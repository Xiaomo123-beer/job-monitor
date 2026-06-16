import prisma from "@/lib/prisma";
import { sendNotifications } from "@/lib/notifier";
import OpenAI from "openai";

export interface LLMMatchResult {
  score: number;
  reason: string;
}

interface AIConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

/**
 * Get configured AI client (OpenAI or DeepSeek compatible)
 */
async function getAIClient(): Promise<{ client: OpenAI; config: AIConfig } | null> {
  // First check user settings in DB
  try {
    const settings = await prisma.userSettings.findFirst({
      where: { id: "default" },
    });

    if (settings?.openaiApiKey) {
      const provider = settings.aiProvider || "openai";
      const model = settings.aiModel || (provider === "deepseek" ? "deepseek-chat" : "gpt-4o-mini");

      if (provider === "deepseek") {
        return {
          client: new OpenAI({
            apiKey: settings.openaiApiKey,
            baseURL: "https://api.deepseek.com/v1",
          }),
          config: {
            apiKey: settings.openaiApiKey,
            baseURL: "https://api.deepseek.com/v1",
            model,
          },
        };
      }

      // OpenAI or custom provider
      const baseURL = settings.openaiBaseUrl || "https://api.openai.com/v1";
      return {
        client: new OpenAI({
          apiKey: settings.openaiApiKey,
          baseURL,
        }),
        config: {
          apiKey: settings.openaiApiKey,
          baseURL,
          model,
        },
      };
    }
  } catch {
    // DB might not be available during build
  }

  // Fallback: check env var
  const envApiKey = process.env.OPENAI_API_KEY;
  if (envApiKey && envApiKey !== "sk-your-api-key-here") {
    return {
      client: new OpenAI({
        apiKey: envApiKey,
        baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
      }),
      config: {
        apiKey: envApiKey,
        baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      },
    };
  }

  return null;
}

// Keep old function for backward compatibility with crawler fallback
function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "sk-your-api-key-here") {
    return null;
  }
  return new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  });
}

/**
 * Evaluate job match using LLM
 */
export async function evaluateJobWithLLM(
  requirements: string,
  jobDescription: string
): Promise<LLMMatchResult> {
  const ai = await getAIClient();

  if (!ai) {
    // Stub: simple keyword-based matching
    return keywordMatch(requirements, jobDescription);
  }

  try {
    const response = await ai.client.chat.completions.create({
      model: ai.config.model,
      messages: [
        {
          role: "system",
          content: `你是一个专业的招聘匹配助手。你需要根据用户的需求，判断一个岗位是否适合用户。

请严格按以下 JSON 格式返回，不要包含其他内容：
{"score": 数字0-100, "reason": "匹配理由（2-3句话，中文）"}

评分标准：
- 90-100: 完美匹配，技术栈、薪资、地点、经验全部符合
- 70-89: 高度匹配，大部分条件符合
- 50-69: 部分匹配，有一些条件不符合
- 30-49: 低度匹配，只有少量条件符合
- 0-29: 不匹配，基本不符合用户需求`,
        },
        {
          role: "user",
          content: `用户需求：
${requirements}

岗位信息：
${jobDescription}

请评估匹配度并给出理由。`,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content || "";
    return parseMatchResponse(content);
  } catch (error) {
    console.error("[Matcher] LLM evaluation error:", error);
    return keywordMatch(requirements, jobDescription);
  }
}

/**
 * Fallback keyword-based matching
 */
function keywordMatch(
  requirements: string,
  jobDescription: string
): LLMMatchResult {
  const reqLower = requirements.toLowerCase();
  const jobLower = jobDescription.toLowerCase();

  // Extract keywords from requirements
  const keywords = reqLower
    .split(/[\s,，、。；;.!！?？\n]+/)
    .filter((k) => k.length > 1);

  let matchedCount = 0;
  for (const kw of keywords) {
    if (jobLower.includes(kw)) {
      matchedCount++;
    }
  }

  const score = keywords.length > 0
    ? Math.min(95, Math.round((matchedCount / keywords.length) * 100))
    : 50;

  const reason =
    score >= 80
      ? `关键词匹配度较高：${matchedCount}/${keywords.length} 个关键词匹配成功`
      : score >= 50
      ? `关键词部分匹配：${matchedCount}/${keywords.length} 个关键词匹配成功`
      : `关键词匹配度较低：${matchedCount}/${keywords.length} 个关键词匹配成功`;

  return { score, reason };
}

/**
 * Parse LLM response to extract score and reason
 */
function parseMatchResponse(content: string): LLMMatchResult {
  try {
    // Try direct JSON parse
    const parsed = JSON.parse(content);
    return {
      score: Math.max(0, Math.min(100, parsed.score || 50)),
      reason: parsed.reason || "无法解析匹配理由",
    };
  } catch {
    // Try to extract JSON from text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          score: Math.max(0, Math.min(100, parsed.score || 50)),
          reason: parsed.reason || "无法解析匹配理由",
        };
      } catch {
        // Fall through
      }
    }

    // Default
    return {
      score: 50,
      reason: "AI 匹配结果解析失败，使用默认评分",
    };
  }
}

/**
 * Main matching pipeline for new job postings
 */
export async function matchAndNotify(
  jobPostingIds: string[]
): Promise<void> {
  console.log(`[Matcher] Starting matching for ${jobPostingIds.length} jobs`);

  const settings = await prisma.userSettings.findFirst({
    where: { id: "default" },
  });

  if (!settings) {
    console.log("[Matcher] No user settings found");
    return;
  }

  const minScore = settings.minMatchScore || 60;
  const requirements = buildRequirementsText(settings);

  for (const jobId of jobPostingIds) {
    try {
      // Check if already matched
      const existing = await prisma.matchResult.findFirst({
        where: { jobPostingId: jobId },
      });
      if (existing) continue;

      // Fetch job posting
      const job = await prisma.jobPosting.findUnique({
        where: { id: jobId },
      });
      if (!job) continue;

      // Build job description for matching
      const jobDesc = buildJobDescriptionText(job);

      // Evaluate with LLM
      const result = await evaluateJobWithLLM(requirements, jobDesc);

      // Create match result
      const matchResult = await prisma.matchResult.create({
        data: {
          jobPostingId: jobId,
          userId: "default",
          score: result.score,
          matchReason: result.reason,
        },
      });

      console.log(
        `[Matcher] Job "${job.title}" scored ${result.score}: ${result.reason.slice(0, 50)}...`
      );

      // Send notifications if score meets threshold
      if (result.score >= minScore) {
        await sendNotifications(matchResult.id);
      }
    } catch (error) {
      console.error(`[Matcher] Error matching job ${jobId}:`, error);
    }
  }

  console.log("[Matcher] Matching complete");
}

/**
 * Build requirements text from user settings
 */
function buildRequirementsText(settings: Record<string, unknown>): string {
  const parts: string[] = [];

  if (settings.jobRequirements) {
    parts.push(`需求描述：${settings.jobRequirements}`);
  }

  if (settings.salaryMin || settings.salaryMax) {
    const min = settings.salaryMin ? `${settings.salaryMin}K` : "";
    const max = settings.salaryMax ? `${settings.salaryMax}K` : "";
    parts.push(`薪资范围：${min}-${max}`);
  }

  if (settings.locationCities) {
    try {
      const cities = JSON.parse(settings.locationCities as string);
      if (Array.isArray(cities) && cities.length > 0) {
        parts.push(`期望城市：${cities.join("、")}`);
      }
    } catch {
      parts.push(`期望城市：${settings.locationCities}`);
    }
  }

  if (settings.experienceLevel) {
    parts.push(`经验要求：${settings.experienceLevel}`);
  }

  if (settings.educationLevel) {
    parts.push(`学历要求：${settings.educationLevel}`);
  }

  if (settings.bonusKeywords) {
    try {
      const keywords = JSON.parse(settings.bonusKeywords as string);
      if (Array.isArray(keywords) && keywords.length > 0) {
        parts.push(`加分关键词：${keywords.join("、")}`);
      }
    } catch {
      parts.push(`加分关键词：${settings.bonusKeywords}`);
    }
  }

  if (settings.excludeKeywords) {
    try {
      const keywords = JSON.parse(settings.excludeKeywords as string);
      if (Array.isArray(keywords) && keywords.length > 0) {
        parts.push(`排除关键词：${keywords.join("、")}`);
      }
    } catch {
      parts.push(`排除关键词：${settings.excludeKeywords}`);
    }
  }

  return parts.join("\n") || "未设置具体需求";
}

/**
 * Build job description text for LLM matching
 */
function buildJobDescriptionText(job: {
  title: string;
  company: string | null;
  salary: string | null;
  location: string | null;
  experience: string | null;
  education: string | null;
  description: string;
}): string {
  return [
    `岗位名称：${job.title}`,
    `公司：${job.company || "未知"}`,
    `薪资：${job.salary || "面议"}`,
    `地点：${job.location || "未知"}`,
    `经验：${job.experience || "不限"}`,
    `学历：${job.education || "不限"}`,
    `岗位描述：${job.description.slice(0, 2000)}`,
  ].join("\n");
}
