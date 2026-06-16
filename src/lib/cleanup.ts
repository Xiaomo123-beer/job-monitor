import prisma from "@/lib/prisma";

/**
 * Clean up old records based on user's data retention settings
 */
export async function cleanOldRecords(): Promise<void> {
  try {
    const settings = await prisma.userSettings.findFirst({
      where: { id: "default" },
    });

    const retentionDays = settings?.dataRetentionDays || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    console.log(
      `[Cleanup] Removing records older than ${retentionDays} days (before ${cutoffDate.toISOString()})`
    );

    // Delete old notification logs (through match results)
    const oldMatches = await prisma.matchResult.findMany({
      where: {
        createdAt: { lt: cutoffDate },
        isFavorited: false, // Don't delete favorited items
      },
      select: { id: true },
    });

    const oldMatchIds = oldMatches.map((m) => m.id);

    if (oldMatchIds.length > 0) {
      // Delete notification logs for old matches
      await prisma.notificationLog.deleteMany({
        where: { matchResultId: { in: oldMatchIds } },
      });

      // Delete old match results
      await prisma.matchResult.deleteMany({
        where: { id: { in: oldMatchIds } },
      });
    }

    // Delete old crawl logs
    await prisma.crawlLog.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });

    // Delete old job postings that have no match results
    await prisma.jobPosting.deleteMany({
      where: {
        firstSeenAt: { lt: cutoffDate },
        matchResults: { none: {} },
      },
    });

    console.log(
      `[Cleanup] Completed: removed ${oldMatchIds.length} match records`
    );
  } catch (error) {
    console.error("[Cleanup] Error:", error);
  }
}
