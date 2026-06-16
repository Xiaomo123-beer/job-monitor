/**
 * Next.js Instrumentation Hook
 * Runs on server startup — handles first-run seeding.
 * Scheduler is only started in Docker (not on Vercel/serverless).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const isVercel = !!process.env.VERCEL;

    // On Vercel, push schema then seed
    if (isVercel) {
      try {
        console.log("[Instrumentation] Vercel detected — pushing schema...");
        const { execSync } = await import("node:child_process");
        execSync("npx prisma db push --schema=prisma/schema.prisma --accept-data-loss", {
          stdio: "pipe",
          timeout: 30000,
        });
        console.log("[Instrumentation] Schema pushed successfully");
      } catch (e) {
        console.log("[Instrumentation] Schema push skipped:", (e as Error).message);
      }
    }

    const { default: prisma } = await import("@/lib/prisma");

    // First-run: ensure crawl templates and default settings exist
    try {
      const count = await prisma.crawlTemplate.count();
      if (count === 0) {
        console.log("[Instrumentation] First run — seeding data...");
        const templates = [
          { domain: "zhipin.com", name: "Boss直聘", selectors: '{"listContainer":".job-list-box .job-card-wrapper","title":".job-name","company":".company-name","salary":".salary","location":".job-area","experience":".tag-list li:nth-child(1)","education":".tag-list li:nth-child(2)","link":".job-card-body a","nextPage":".options-pages .next"}' },
          { domain: "liepin.com", name: "猎聘", selectors: '{"listContainer":".job-list-item","title":".job-title","company":".company-name","salary":".job-salary","location":".job-area","experience":".job-qualifications span:nth-child(1)","education":".job-qualifications span:nth-child(2)","link":".job-title a","nextPage":".pagination .next"}' },
          { domain: "lagou.com", name: "拉勾", selectors: '{"listContainer":".item__10RTO","title":".p-top__1B7zG","company":".company-name__2-SjF","salary":".money__3LKGq","location":".illegal__3bbbb","experience":".li_b_r__16g9y:nth-child(1)","link":"a","nextPage":".pager_next"}' },
          { domain: "zhaopin.com", name: "智联招聘", selectors: '{"listContainer":".joblist-box__item","title":".jobinfo__top__title","company":".jobinfo__top__company","salary":".jobinfo__top__salary","location":".jobinfo__other__info__item:nth-child(1)","experience":".jobinfo__other__info__item:nth-child(2)","education":".jobinfo__other__info__item:nth-child(3)","link":".jobinfo__top__title a","nextPage":".pagination .next"}' },
          { domain: "linkedin.com", name: "LinkedIn", selectors: '{"listContainer":".jobs-search__results-list li","title":".base-search-card__title","company":".base-search-card__subtitle","salary":".job-search-card__salary-info","location":".job-search-card__location","link":".base-card__full-link","nextPage":".artdeco-pagination__button--next"}' },
        ];
        for (const t of templates) {
          await prisma.crawlTemplate.upsert({ where: { domain: t.domain }, update: t, create: t });
        }
        await prisma.userSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
        console.log("[Instrumentation] Seed complete");
      }
    } catch (e) {
      console.log("[Instrumentation] Seed skipped (DB may not be ready)");
    }

    // Only start scheduler in Docker (not Vercel/serverless)
    if (!isVercel) {
      try {
        const { startScheduler } = await import("@/lib/scheduler");
        startScheduler().catch((err) => {
          console.error("[Instrumentation] Scheduler error:", err);
        });
        console.log("[Instrumentation] Scheduler started");
      } catch {
        console.log("[Instrumentation] Scheduler skipped (serverless environment)");
      }
    } else {
      console.log("[Instrumentation] Running on Vercel — scheduler disabled, crawler unavailable");
    }
  }
}
