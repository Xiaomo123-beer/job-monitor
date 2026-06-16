import cron, { type ScheduledTask } from "node-cron";
import prisma from "@/lib/prisma";
import { runCrawlForSite } from "@/lib/crawler";
import { matchAndNotify } from "@/lib/matcher";
import { cleanOldRecords } from "@/lib/cleanup";

let crawlTask: ScheduledTask | null = null;
let cleanupTask: ScheduledTask | null = null;

/**
 * Build a cron expression from minutes interval
 */
function getCronExpression(minutes: number): string {
  if (minutes < 60) {
    return `*/${minutes} * * * *`;
  }
  const hours = Math.floor(minutes / 60);
  return `0 */${hours} * * *`;
}

/**
 * Run crawl for all active sites
 */
async function crawlAllActiveSites(): Promise<void> {
  console.log("[Scheduler] Running scheduled crawl...");

  try {
    const settings = await prisma.userSettings.findFirst({
      where: { id: "default" },
    });

    // Check notification hours
    if (settings?.notifyWorkHoursOnly) {
      const hour = new Date().getHours();
      if (hour < settings.notifyStartHour || hour >= settings.notifyEndHour) {
        console.log("[Scheduler] Outside notification hours, skipping");
        return;
      }
    }

    const sites = await prisma.jobSite.findMany({
      where: { status: "active" },
    });

    if (sites.length === 0) {
      console.log("[Scheduler] No active sites to crawl");
      return;
    }

    for (const site of sites) {
      try {
        // Random delay between sites to avoid rate limiting
        const delay = Math.floor(Math.random() * 5000) + 3000;
        await new Promise((resolve) => setTimeout(resolve, delay));

        const result = await runCrawlForSite(site);

        // Update site lastCrawledAt
        await prisma.jobSite.update({
          where: { id: site.id },
          data: {
            lastCrawledAt: new Date(),
            status: result.status === "failed" ? "error" : site.status,
            errorMessage: result.error || null,
          },
        });

        // Match new jobs
        if (result.newJobIds && result.newJobIds.length > 0) {
          await matchAndNotify(result.newJobIds);
        }
      } catch (error) {
        console.error(`[Scheduler] Error crawling site ${site.name}:`, error);
      }
    }
  } catch (error) {
    console.error("[Scheduler] Error in crawl job:", error);
  }
}

/**
 * Start the scheduler
 */
export async function startScheduler(): Promise<void> {
  // Get user settings
  const settings = await prisma.userSettings.findFirst({
    where: { id: "default" },
  });

  const frequency = settings?.monitorFrequency || 30;
  const cronExpr = getCronExpression(frequency);

  console.log(`[Scheduler] Starting with frequency: ${frequency}min (${cronExpr})`);

  // Stop existing tasks
  stopScheduler();

  // Schedule crawl task
  crawlTask = cron.schedule(cronExpr, async () => {
    await crawlAllActiveSites();
  });

  // Schedule daily cleanup at 3:07 AM
  cleanupTask = cron.schedule("7 3 * * *", async () => {
    console.log("[Scheduler] Running daily cleanup...");
    await cleanOldRecords();
  });

  console.log("[Scheduler] Started successfully");
}

/**
 * Stop the scheduler
 */
export function stopScheduler(): void {
  if (crawlTask) {
    crawlTask.stop();
    crawlTask = null;
  }
  if (cleanupTask) {
    cleanupTask.stop();
    cleanupTask = null;
  }
  console.log("[Scheduler] Stopped");
}

/**
 * Update scheduler frequency without restarting
 */
export async function updateSchedulerFrequency(minutes: number): Promise<void> {
  await prisma.userSettings.upsert({
    where: { id: "default" },
    update: { monitorFrequency: minutes },
    create: { id: "default", monitorFrequency: minutes },
  });
  await startScheduler();
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus(): { running: boolean; frequency: string } {
  return {
    running: crawlTask !== null,
    frequency: crawlTask ? "configured" : "stopped",
  };
}
