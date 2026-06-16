import prisma from "@/lib/prisma";
import puppeteer, { Browser, Page } from "puppeteer";
import { evaluateJobWithLLM } from "@/lib/matcher";

export interface CrawlResult {
  siteId: string;
  status: "success" | "partial" | "failed";
  jobsFound: number;
  newJobIds: string[];
  error?: string;
}

interface SelectorConfig {
  listContainer: string;
  title: string;
  company: string;
  salary?: string;
  location?: string;
  experience?: string;
  education?: string;
  link: string;
  nextPage?: string;
}

/**
 * Extract domain from URL for matching crawl templates
 */
function getDomain(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace("www.", "");
  } catch {
    return url;
  }
}

/**
 * Random delay between min and max milliseconds
 */
function randomDelay(min: number, max: number): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract text from page using CSS selectors
 */
async function extractWithSelectors(
  page: Page,
  selectors: SelectorConfig
): Promise<Record<string, string>[]> {
  const jobs: Record<string, string>[] = [];

  // Wait for the job list container
  try {
    await page.waitForSelector(selectors.listContainer, { timeout: 15000 });
  } catch {
    // Container not found, maybe the page structure changed
    return jobs;
  }

  // Scroll to load more if needed
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 300;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= 2000) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });

  // Extract data
  const extractedJobs = await page.evaluate((sel: SelectorConfig) => {
    const containers = document.querySelectorAll(sel.listContainer);
    const results: Record<string, string>[] = [];

    containers.forEach((container) => {
      const getText = (selector?: string) => {
        if (!selector) return "";
        const el = container.querySelector(selector);
        return el?.textContent?.trim() || "";
      };

      const getHref = (selector: string) => {
        const el = container.querySelector(selector);
        return el?.getAttribute("href") || "";
      };

      const job: Record<string, string> = {
        title: getText(sel.title),
        company: getText(sel.company),
        salary: getText(sel.salary),
        location: getText(sel.location),
        experience: getText(sel.experience),
        education: getText(sel.education),
        link: getHref(sel.link) || window.location.href,
      };

      // Only include if we have at least a title
      if (job.title) {
        results.push(job);
      }
    });

    return results;
  }, selectors);

  return extractedJobs;
}

/**
 * Fallback: extract full page text content
 */
async function extractFullPageText(page: Page): Promise<string> {
  return page.evaluate(() => {
    // Remove scripts, styles, and other non-content elements
    const clone = document.body.cloneNode(true) as HTMLElement;
    const scripts = clone.querySelectorAll(
      "script, style, nav, footer, header, iframe, noscript"
    );
    scripts.forEach((s) => s.remove());

    // Get main content or body text
    const main = clone.querySelector("main") || clone;
    return main.textContent?.trim() || "";
  });
}

/**
 * Main crawl function for a single site
 */
export async function runCrawlForSite(
  site: { id: string; name: string; url: string; status: string }
): Promise<CrawlResult> {
  console.log(`[Crawler] Starting crawl for: ${site.name} (${site.url})`);

  let browser: Browser | null = null;
  let jobsFound = 0;
  const newJobIds: string[] = [];

  try {
    // Find matching template
    const domain = getDomain(site.url);
    const template = await prisma.crawlTemplate.findFirst({
      where: { domain: { contains: domain.split(".")[0] } },
    });

    const selectors: SelectorConfig | null = template
      ? (JSON.parse(template.selectors) as SelectorConfig)
      : null;

    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Set a realistic user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Set viewport
    await page.setViewport({ width: 1440, height: 900 });

    // Navigate to the URL
    await randomDelay(1000, 3000);
    await page.goto(site.url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Try to extract jobs with selectors first
    let rawJobs: Record<string, string>[] = [];

    if (selectors) {
      console.log(`[Crawler] Using template: ${template?.name}`);
      rawJobs = await extractWithSelectors(page, selectors);
    }

    // If selectors failed or no template, fall back to full page text + LLM
    if (rawJobs.length === 0) {
      console.log("[Crawler] Selectors failed, falling back to full text + LLM");
      const fullText = await extractFullPageText(page);
      // Truncate text to avoid token limits
      const truncatedText = fullText.slice(0, 8000);
      rawJobs = await extractJobsFromText(truncatedText);
    }

    // Try pagination (first page only for now)
    if (selectors?.nextPage && rawJobs.length > 0) {
      try {
        const nextButton = await page.$(selectors.nextPage);
        if (nextButton) {
          await nextButton.click();
          await randomDelay(2000, 4000);
          await page.waitForNetworkIdle({ timeout: 10000 });
          const page2Jobs = await extractWithSelectors(page, selectors);
          rawJobs.push(...page2Jobs);
        }
      } catch {
        // Pagination failed, continue with first page results
      }
    }

    jobsFound = rawJobs.length;

    // Process each job: generate externalId, deduplicate, insert
    for (const raw of rawJobs) {
      // Fix relative URLs
      let jobUrl = raw.link || "";
      if (jobUrl && !jobUrl.startsWith("http")) {
        try {
          const baseUrl = new URL(site.url);
          jobUrl = `${baseUrl.origin}${jobUrl.startsWith("/") ? "" : "/"}${jobUrl}`;
        } catch {
          jobUrl = site.url;
        }
      }

      // Generate externalId from title + company + URL
      const externalId = Buffer.from(
        `${raw.title}-${raw.company}-${jobUrl}`
      ).toString("base64").slice(0, 64);

      // Check if already exists (dedup)
      const existing = await prisma.jobPosting.findUnique({
        where: {
          siteId_externalId: {
            siteId: site.id,
            externalId,
          },
        },
      });

      if (existing) continue;

      // Insert new job posting
      const job = await prisma.jobPosting.create({
        data: {
          siteId: site.id,
          externalId,
          title: raw.title || "未知标题",
          company: raw.company || null,
          salary: raw.salary || null,
          location: raw.location || null,
          experience: raw.experience || null,
          education: raw.education || null,
          description: raw.description || raw.title || "",
          url: jobUrl,
        },
      });

      newJobIds.push(job.id);
    }

    await browser.close();

    // Create crawl log
    await prisma.crawlLog.create({
      data: {
        siteId: site.id,
        status: "success",
        jobsFound,
        jobsNew: newJobIds.length,
      },
    });

    console.log(
      `[Crawler] Completed: ${jobsFound} found, ${newJobIds.length} new`
    );

    return {
      siteId: site.id,
      status: "success",
      jobsFound,
      newJobIds,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`[Crawler] Error for ${site.name}:`, errorMessage);

    // Create error crawl log
    try {
      await prisma.crawlLog.create({
        data: {
          siteId: site.id,
          status: "failed",
          jobsFound,
          jobsNew: 0,
          error: errorMessage,
        },
      });
    } catch {
      // Log creation failed
    }

    if (browser) {
      try {
        await browser.close();
      } catch {
        // Browser already closed
      }
    }

    return {
      siteId: site.id,
      status: "failed",
      jobsFound,
      newJobIds,
      error: errorMessage,
    };
  }
}

/**
 * LLM-based fallback: extract job listings from plain text
 */
export async function extractJobsFromText(
  text: string
): Promise<Record<string, string>[]> {
  const prompt = `你是一个招聘信息解析助手。请从以下页面文本中，提取所有招聘岗位信息。

页面文本：
"""
${text.slice(0, 6000)}
"""

请以 JSON 数组格式返回，每个岗位包含以下字段：
- title: 岗位名称
- company: 公司名称
- salary: 薪资（如"15k-25k"）
- location: 工作地点
- experience: 经验要求
- education: 学历要求
- description: 岗位描述简述（100字以内）

只返回 JSON 数组，不要包含其他内容。如果没有找到任何岗位，返回空数组 []。`;

  try {
    // Try using OpenAI to parse
    const result = await evaluateJobWithLLM(
      prompt,
      "请返回有效的 JSON 数组。"
    );

    // Extract JSON from the result
    const jsonMatch = result.reason.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error("[Crawler] LLM extraction failed:", error);
  }

  return [];
}
