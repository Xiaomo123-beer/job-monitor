import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalSites, activeSites, todayNewJobs, totalMatches, totalUnread] =
      await Promise.all([
        prisma.jobSite.count(),
        prisma.jobSite.count({ where: { status: "active" } }),
        prisma.jobPosting.count({
          where: { firstSeenAt: { gte: todayStart } },
        }),
        prisma.matchResult.count(),
        prisma.matchResult.count({
          where: { isRead: false },
        }),
      ]);

    return NextResponse.json({
      totalSites,
      activeSites,
      todayNewJobs,
      totalMatches,
      totalUnread,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
