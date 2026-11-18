export type TrafficKind = "pageview" | "click" | "engage" | "ping";
export type TrafficDevice = "mobile" | "desktop" | "other";

export type TrafficSummary = {
  liveNow: number;
  todayVisitors: number;
  todaySessions: number;
  todayPageviews: number;
  todayClicks: number;
  todayEngaged: number;
  yesterdayVisitors: number;
  last7Days: { day: string; visitors: number; pageviews: number; clicks: number }[];
  topPaths: { path: string; views: number }[];
  devices: { mobile: number; desktop: number; other: number };
  updatedAt: string;
};
