import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  try {
    const sites = await prisma.jobSite.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { jobPostings: true },
        },
      },
    });
    return NextResponse.json(sites);
  } catch (error) {
    console.error("Error fetching sites:", error);
    return NextResponse.json(
      { error: "Failed to fetch sites" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Support batch creation
    const sites = Array.isArray(body) ? body : [body];

    const created = [];
    for (const site of sites) {
      if (!site.url) continue;

      // Extract domain for name if not provided
      const url = new URL(site.url.startsWith("http") ? site.url : `https://${site.url}`);
      const name = site.name || url.hostname.replace("www.", "");

      const created_site = await prisma.jobSite.create({
        data: {
          name,
          url: site.url.startsWith("http") ? site.url : `https://${site.url}`,
        },
      });
      created.push(created_site);
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating site:", error);
    return NextResponse.json(
      { error: "Failed to create site" },
      { status: 500 }
    );
  }
}
