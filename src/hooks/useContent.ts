import { useEffect, useState } from "react";
import func2url from "../../backend/func2url.json";

type ContentMap = Record<string, string>;

const cache: { data: ContentMap | null } = { data: null };

export function useContent() {
  const [content, setContent] = useState<ContentMap>(cache.data || {});
  const [loading, setLoading] = useState(!cache.data);

  useEffect(() => {
    if (cache.data) return;
    fetch(`${func2url.register}?action=content`)
      .then((r) => r.json())
      .then((data) => {
        const flat: ContentMap = {};
        Object.entries(data.content || {}).forEach(([k, v]) => {
          flat[k] = (v as { value: string }).value;
        });
        cache.data = flat;
        setContent(flat);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const t = (key: string, fallback = "") => content[key] ?? fallback;

  return { t, loading };
}
