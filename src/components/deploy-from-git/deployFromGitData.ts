export type DetectResult = {
  framework: string;
  scripts: Record<string, string>;
  build_cmd: string;
  out_dir: string;
};

export type Project = { id: number; name: string };

export const SOURCES = [
  { label: "GitHub", icon: "Github", placeholder: "https://github.com/user/repo", hint: "Публичные и приватные репозитории" },
  { label: "GitLab", icon: "GitBranch", placeholder: "https://gitlab.com/user/repo", hint: "gitlab.com и self-hosted" },
  { label: "Bitbucket", icon: "GitBranch", placeholder: "https://bitbucket.org/user/repo", hint: "Bitbucket Cloud" },
  { label: "Любой Git URL", icon: "Link", placeholder: "https://git.example.com/user/repo.git", hint: "Любой публичный Git-сервер" },
];

export const FRAMEWORK_ICONS: Record<string, string> = {
  nextjs: "▲", react: "⚛", vue: "💚", nuxt: "💚", svelte: "🔥", astro: "🚀", remix: "💿", other: "📦",
};

export function normalizeGitUrl(raw: string): string {
  let url = raw.trim().replace(/[\u00ab\u00bb\u201c\u201d\u2018\u2019]/g, "");
  try {
    const u = new URL(url.startsWith("http") ? url : "https://" + url);
    url = u.origin + u.pathname;
  } catch {
    // не URL — оставляем как есть
  }
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  url = url.replace(/\/+$/, "");
  return url;
}

export function validateGitUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!["http:", "https:"].includes(u.protocol)) return "URL должен начинаться с https://";
    if (!u.hostname.includes(".")) return "Некорректный хост: " + u.hostname;
    const parts = u.pathname.replace(/^\//, "").split("/").filter(Boolean);
    if (parts.length < 2) return "URL должен содержать владельца и название репозитория: github.com/user/repo";
    return null;
  } catch {
    return "Некорректный URL репозитория";
  }
}
