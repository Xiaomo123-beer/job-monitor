import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("pageSize") || "20"))
    );
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const minScore = parseInt(searchParams.get("minScore") || "0");
    const isRead = searchParams.get("isRead");
    const isFavorited = searchParams.get("isFavorited");
    const keyword = searchParams.get("keyword") || "";

    // Build the where clause for MatchResult
    const matchWhere: Record<string, unknown> = {};
    if (minScore > 0) matchWhere.score = { gte: minScore };
    if (isRead === "true") matchWhere.isRead = true;
    if (isRead === "false") matchWhere.isRead = false;
    if (isFavorited === "true") matchWhere.isFavorited = true;

    // Build where for JobPosting
    const postingWhere: Record<string, unknown> = {};
    if (keyword) {
      postingWhere.OR = [
        { title: { contains: keyword } },
        { company: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    const [jobs, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where: {
          ...postingWhere,
          matchResults: {
            some: matchWhere,
          },
        },
        include: {
          site: { select: { name: true, url: true } },
          matchResults: {
            select: {
              id: true,
              score: true,
              matchReason: true,
              isNotified: true,
              isRead: true,
              isFavorited: true,
              createdAt: true,
            },
          },
        },
        orderBy: sortBy === "score"
          ? { matchResults: { _count: "desc" } }
          : sortBy === "salary"
          ? { salary: sortOrder as "asc" | "desc" }
          : { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.jobPosting.count({
        where: {
          ...postingWhere,
          matchResults: {
            some: matchWhere,
          },
        },
      }),
    ]);

    return NextResponse.json({
      data: jobs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}
