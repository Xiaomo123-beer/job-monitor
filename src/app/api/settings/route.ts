import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    let settings = await prisma.userSettings.findFirst({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { id: "default" },
      });
    }

    // Strip sensitive fields
    const { emailPassword, openaiApiKey, ...safe } = settings;
    return NextResponse.json({
      ...safe,
      hasEmailPassword: !!emailPassword,
      hasOpenaiApiKey: !!openaiApiKey,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Build update data, only including valid fields
    const allowedFields = [
      "monitorFrequency",
      "minMatchScore",
      "notifyBrowser",
      "notifyEmail",
      "emailAddress",
      "emailPassword",
      "emailHost",
      "emailPort",
      "notifyWebhook",
      "webhookUrl",
      "webhookType",
      "notifyWorkHoursOnly",
      "notifyStartHour",
      "notifyEndHour",
      "dataRetentionDays",
      "openaiApiKey",
      "openaiBaseUrl",
      "aiProvider",
      "aiModel",
      "jobRequirements",
      "salaryMin",
      "salaryMax",
      "locationCities",
      "experienceLevel",
      "educationLevel",
      "bonusKeywords",
      "excludeKeywords",
    ];

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }

    const settings = await prisma.userSettings.upsert({
      where: { id: "default" },
      update: data,
      create: { id: "default", ...data },
    });

    // Strip sensitive fields
    const { emailPassword, openaiApiKey, ...safe } = settings;
    return NextResponse.json({
      ...safe,
      hasEmailPassword: !!emailPassword,
      hasOpenaiApiKey: !!openaiApiKey,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
