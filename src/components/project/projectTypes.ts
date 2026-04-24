export type Deployment = {
  id: number;
  status: string;
  branch: string;
  commit_sha: string;
  commit_message: string;
  url: string;
  preview_url?: string;
  build_log: string;
  duration_seconds: number;
  created_at: string;
  finished_at: string;
};

export type Domain = { id: number; domain: string; verified: boolean };
export type AnalyticsRow = { date: string; views: number; unique_visitors: number; bandwidth_mb: number; requests: number };
export type Webhook = { id: number; url: string; events: string; active: boolean; created_at: string };
export type ProjectData = {
  id: number;
  name: string;
  repo_url: string;
  framework: string;
  domain: string;
  env_vars: Record<string, string>;
  created_at: string;
};

export type Tab = "deployments" | "analytics" | "usage" | "env" | "domains" | "webhooks" | "integrations" | "devtools" | "settings";
export type UsageStat = { date: string; bandwidth_mb: number; requests: number; build_seconds: number };
export type Integration = { id: number; type: string; config: Record<string, string>; active: boolean; created_at: string };

export const STATUS_COLORS: Record<string, string> = {
  ready: "text-green-400 bg-green-400/10",
  building: "text-yellow-400 bg-yellow-400/10",
  error: "text-red-400 bg-red-400/10",
  queued: "text-neutral-400 bg-neutral-400/10",
  cancelled: "text-neutral-500 bg-neutral-500/10",
};