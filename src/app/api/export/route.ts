import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";

    const matches = await prisma.matchResult.findMany({
      where: { isFavorited: true },
      include: {
        jobPosting: {
          include: { site: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = matches.map((m) => ({
      title: m.jobPosting.title,
      company: m.jobPosting.company,
      salary: m.jobPosting.salary,
      location: m.jobPosting.location,
      匹配度: m.score,
      匹配理由: m.matchReason,
      来源: m.jobPosting.site.name,
      链接: m.jobPosting.url,
      发布时间: m.jobPosting.publishedAt,
      匹配时间: m.createdAt,
    }));

    if (format === "csv") {
      const headers = Object.keys(data[0] || {});
      const csvRows = [
        headers.join(","),
        ...data.map((row) =>
          headers
            .map((h) => {
              const val = String(row[h as keyof typeof row] || "");
              return val.includes(",") ? `"${val}"` : val;
            })
            .join(",")
        ),
      ];
      const csv = csvRows.join("\n");
      // Add BOM for Excel compatibility with Chinese characters
      const bom = "﻿";
      return new NextResponse(bom + csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="matched-jobs.csv"',
        },
      });
    }

    return NextResponse.json(data, {
      headers: {
        "Content-Disposition":
          'attachment; filename="matched-jobs.json"',
      },
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
