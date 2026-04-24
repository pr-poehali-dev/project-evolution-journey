import { useState } from "react";

export default function DevToolsHttpTester({ projectUrl }: { projectUrl: string }) {
  const [url, setUrl] = useState(projectUrl);
  const [method, setMethod] = useState("GET");
  const [body, setBody] = useState("");
  const [result, setResult] = useState<{ status: number; body: string; time: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!url) return;
    setLoading(true);
    const t0 = Date.now();
    try {
      const res = await fetch(url, {
        method,
        headers: method !== "GET" ? { "Content-Type": "application/json" } : undefined,
        body: method !== "GET" && body ? body : undefined,
      });
      const text = await res.text();
      setResult({ status: res.status, body: text, time: Date.now() - t0 });
    } catch (e) {
      setResult({ status: 0, body: String(e), time: Date.now() - t0 });
    }
    setLoading(false);
  };

  return (
    <div className="bg-black p-4 flex flex-col gap-3">
      <div className="flex gap-2">
        <select value={method} onChange={(e) => setMethod(e.target.value)}
          className="bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs text-white w-24 focus:outline-none focus:border-blue-400 transition-colors">
          {["GET", "POST", "PUT", "DELETE"].map((m) => <option key={m}>{m}</option>)}
        </select>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..."
          className="flex-1 bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-400 transition-colors" />
        <button onClick={run} disabled={loading || !url}
          className="px-4 py-2 bg-blue-400 text-black text-xs font-medium hover:bg-white transition-colors disabled:opacity-40">
          {loading ? "..." : "Send"}
        </button>
      </div>
      {method !== "GET" && (
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder='{"key": "value"}'
          className="bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-400 transition-colors resize-none" />
      )}
      {result && (
        <div className="border border-neutral-800 rounded overflow-hidden">
          <div className="flex items-center gap-3 px-3 py-2 bg-neutral-900 border-b border-neutral-800">
            <span className={`text-xs font-mono font-bold ${result.status >= 200 && result.status < 300 ? "text-green-400" : result.status >= 400 ? "text-red-400" : "text-yellow-400"}`}>
              {result.status || "ERR"}
            </span>
            <span className="text-xs text-neutral-500">{result.time}ms</span>
          </div>
          <pre className="text-xs text-green-400 font-mono p-3 max-h-48 overflow-auto whitespace-pre-wrap">
            {(() => { try { return JSON.stringify(JSON.parse(result.body), null, 2); } catch { return result.body; } })()}
          </pre>
        </div>
      )}
    </div>
  );
}
