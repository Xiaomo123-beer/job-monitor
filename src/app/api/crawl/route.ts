import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { runCrawlForSite } from "@/lib/crawler";
import { matchAndNotify } from "@/lib/matcher";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const siteId = body.siteId as string | undefined;

    const sites = siteId
      ? await prisma.jobSite.findMany({
          where: { id: siteId, status: { not: "paused" } },
        })
      : await prisma.jobSite.findMany({
          where: { status: "active" },
        });

    if (sites.length === 0) {
      return NextResponse.json(
        { error: "No active sites found" },
        { status: 404 }
      );
    }

    const results = [];
    for (const site of sites) {
      const result = await runCrawlForSite(site);
      results.push(result);

      // Update site lastCrawledAt
      await prisma.jobSite.update({
        where: { id: site.id },
        data: {
          lastCrawledAt: new Date(),
          status: result.status === "failed" ? "error" : site.status,
          errorMessage: result.error || null,
        },
      });

      // Run AI matching for new jobs
      if (result.newJobIds && result.newJobIds.length > 0) {
        await matchAndNotify(result.newJobIds);
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error running crawl:", error);
    return NextResponse.json(
      { error: "Failed to run crawl" },
      { status: 500 }
    );
  }
}
