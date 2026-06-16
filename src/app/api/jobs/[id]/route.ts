import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await prisma.jobPosting.findUnique({
      where: { id },
      include: {
        site: true,
        matchResults: {
          include: {
            notificationLogs: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { error: "Failed to fetch job" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Update MatchResult (isRead, isFavorited)
    const matchResultId = body.matchResultId;
    if (!matchResultId) {
      return NextResponse.json(
        { error: "matchResultId is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (typeof body.isRead === "boolean") updateData.isRead = body.isRead;
    if (typeof body.isFavorited === "boolean")
      updateData.isFavorited = body.isFavorited;

    const updated = await prisma.matchResult.update({
      where: { id: matchResultId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 }
    );
  }
}
