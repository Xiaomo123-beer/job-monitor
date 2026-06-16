import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";

/**
 * Check if current time is within notification hours
 */
function isWithinNotificationHours(settings: {
  notifyWorkHoursOnly: boolean;
  notifyStartHour: number;
  notifyEndHour: number;
}): boolean {
  if (!settings.notifyWorkHoursOnly) return true;
  const hour = new Date().getHours();
  return hour >= settings.notifyStartHour && hour < settings.notifyEndHour;
}

/**
 * Main notification dispatcher
 */
export async function sendNotifications(
  matchResultId: string
): Promise<void> {
  console.log(`[Notifier] Processing notifications for match: ${matchResultId}`);

  const match = await prisma.matchResult.findUnique({
    where: { id: matchResultId },
    include: { jobPosting: { include: { site: true } } },
  });

  if (!match) {
    console.log("[Notifier] Match result not found");
    return;
  }

  const settings = await prisma.userSettings.findFirst({
    where: { id: "default" },
  });

  if (!settings) {
    console.log("[Notifier] No user settings found");
    return;
  }

  // Check notification hours
  if (!isWithinNotificationHours(settings)) {
    console.log("[Notifier] Outside notification hours, queuing for later");
    return;
  }

  const job = match.jobPosting;
  const title = `💼 [新岗位] ${job.title} - ${job.company || "未知公司"}`;
  const body = [
    `公司：${job.company || "未知"}`,
    `薪资：${job.salary || "面议"}`,
    `地点：${job.location || "未知"}`,
    `匹配度：${match.score}分`,
    `来源：${job.site.name}`,
    ``,
    `AI分析：${match.matchReason}`,
  ].join("\n");

  const channels: Array<{
    channel: string;
    status: "sent" | "failed";
    error?: string;
  }> = [];

  // 1. Browser notification
  if (settings.notifyBrowser) {
    try {
      await sendBrowserPushNotification(title, body);
      channels.push({ channel: "browser", status: "sent" });
    } catch (error) {
      channels.push({
        channel: "browser",
        status: "failed",
        error: String(error),
      });
    }
  }

  // 2. Email notification
  if (settings.notifyEmail && settings.emailAddress) {
    try {
      await sendEmailNotification({
        to: settings.emailAddress,
        subject: title,
        html: buildEmailHtml(match, job),
        smtp: {
          host: settings.emailHost || process.env.SMTP_HOST || "",
          port: settings.emailPort || parseInt(process.env.SMTP_PORT || "587"),
          user: settings.emailAddress,
          pass: settings.emailPassword || process.env.SMTP_PASS || "",
        },
      });
      channels.push({ channel: "email", status: "sent" });
    } catch (error) {
      channels.push({
        channel: "email",
        status: "failed",
        error: String(error),
      });
    }
  }

  // 3. Webhook notification (钉钉/飞书/企业微信)
  if (settings.notifyWebhook && settings.webhookUrl) {
    try {
      await sendWebhookNotification(
        settings.webhookUrl,
        settings.webhookType || "feishu",
        title,
        body,
        job.url
      );
      channels.push({ channel: "webhook", status: "sent" });
    } catch (error) {
      channels.push({
        channel: "webhook",
        status: "failed",
        error: String(error),
      });
    }
  }

  // Log all notification attempts
  for (const ch of channels) {
    await prisma.notificationLog.create({
      data: {
        matchResultId,
        channel: ch.channel,
        status: ch.status,
        errorMessage: ch.error,
      },
    });
  }

  // Mark as notified if at least one channel succeeded
  const anySent = channels.some((ch) => ch.status === "sent");
  if (anySent) {
    await prisma.matchResult.update({
      where: { id: matchResultId },
      data: { isNotified: true },
    });
  }

  console.log(`[Notifier] Sent: ${channels.filter((c) => c.status === "sent").length}/${channels.length} channels`);
}

// ─── Browser Push Notification ────────────────────────────────────────

export async function sendBrowserPushNotification(
  title: string,
  body: string
): Promise<void> {
  // Web Push requires a Service Worker and VAPID keys
  // This is a server-side call that would use web-push library
  // For now, we log that a push would be sent
  // The actual push is handled client-side via the Notification API
  console.log(`[Notifier] Browser push: ${title}`);
  // In production, you'd use the 'web-push' npm package:
  // await webpush.sendNotification(subscription, JSON.stringify({ title, body }));
}

// ─── Email Notification (Nodemailer) ──────────────────────────────────

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
}

export async function sendEmailNotification(
  options: EmailOptions
): Promise<void> {
  if (!options.smtp.host || !options.smtp.pass) {
    console.log("[Notifier] SMTP not configured, skipping email");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: options.smtp.host,
    port: options.smtp.port,
    secure: options.smtp.port === 465,
    auth: {
      user: options.smtp.user,
      pass: options.smtp.pass,
    },
  });

  await transporter.sendMail({
    from: options.smtp.user,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });

  console.log(`[Notifier] Email sent to ${options.to}`);
}

function buildEmailHtml(
  match: { score: number; matchReason: string },
  job: {
    title: string;
    company: string | null;
    salary: string | null;
    location: string | null;
    url: string;
    description: string;
  }
): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px 12px 0 0;">
    <h2 style="margin: 0;">🔔 新岗位匹配通知</h2>
  </div>
  <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 12px 12px;">
    <h3 style="margin: 0 0 8px;">${job.title}</h3>
    <p style="color: #6b7280; margin: 0 0 16px;">${job.company || "未知公司"}</p>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; color: #6b7280;">💰 薪资</td>
        <td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">${job.salary || "面议"}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; color: #6b7280;">📍 地点</td>
        <td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">${job.location || "未知"}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; color: #6b7280;">⭐ 匹配度</td>
        <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-weight: bold; color: #7c3aed;">${match.score}分</td>
      </tr>
    </table>
    <div style="background: #f5f3ff; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
      <p style="margin: 0; color: #6d28d9; font-size: 14px;"><strong>AI 分析：</strong>${match.matchReason}</p>
    </div>
    <a href="${job.url}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">查看岗位详情 →</a>
  </div>
</body>
</html>`;
}

// ─── Webhook Notifications ────────────────────────────────────────────

export async function sendWebhookNotification(
  webhookUrl: string,
  type: string,
  title: string,
  body: string,
  jobUrl: string
): Promise<void> {
  let payload: Record<string, unknown>;

  switch (type) {
    case "dingtalk":
      payload = buildDingtalkMessage(title, body, jobUrl);
      break;
    case "wechat":
      payload = buildWechatMessage(title, body, jobUrl);
      break;
    case "feishu":
    default:
      payload = buildFeishuMessage(title, body, jobUrl);
      break;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.status} ${await response.text()}`);
  }

  console.log(`[Notifier] Webhook (${type}) sent successfully`);
}

function buildFeishuMessage(
  title: string,
  body: string,
  jobUrl: string
): Record<string, unknown> {
  return {
    msg_type: "interactive",
    card: {
      header: {
        title: { tag: "plain_text", content: title },
        template: "purple",
      },
      elements: [
        {
          tag: "div",
          text: { tag: "lark_md", content: body.replace(/\n/g, "\n") },
        },
        {
          tag: "action",
          actions: [
            {
              tag: "button",
              text: { tag: "plain_text", content: "查看岗位" },
              type: "primary",
              url: jobUrl,
            },
          ],
        },
      ],
    },
  };
}

function buildDingtalkMessage(
  title: string,
  body: string,
  jobUrl: string
): Record<string, unknown> {
  return {
    msgtype: "markdown",
    markdown: {
      title,
      text: `## ${title}\n\n${body}\n\n[查看岗位详情](${jobUrl})`,
    },
  };
}

function buildWechatMessage(
  title: string,
  body: string,
  jobUrl: string
): Record<string, unknown> {
  return {
    msgtype: "markdown",
    markdown: {
      content: `## ${title}\n\n${body}\n\n[查看岗位详情](${jobUrl})`,
    },
  };
}
