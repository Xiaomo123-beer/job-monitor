import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return d.toLocaleDateString("zh-CN");
}

export function formatSalary(salary: string | null): string {
  if (!salary) return "薪资面议";
  return salary;
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600 bg-green-50 dark:bg-green-950";
  if (score >= 60) return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950";
  return "text-gray-600 bg-gray-50 dark:bg-gray-800";
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return "高度匹配";
  if (score >= 60) return "中度匹配";
  return "低度匹配";
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "text-green-600 bg-green-50 dark:bg-green-950";
    case "paused":
      return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950";
    case "error":
      return "text-red-600 bg-red-50 dark:bg-red-950";
    default:
      return "text-gray-600 bg-gray-50 dark:bg-gray-800";
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "active":
      return "运行中";
    case "paused":
      return "已暂停";
    case "error":
      return "异常";
    default:
      return "未知";
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}
