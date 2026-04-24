import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { getUser } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";
import Icon from "@/components/ui/icon";
import { DetectResult, Project, normalizeGitUrl, validateGitUrl } from "@/components/deploy-from-git/deployFromGitData";
import DeployStepSource from "@/components/deploy-from-git/DeployStepSource";
import DeployStepConfigure from "@/components/deploy-from-git/DeployStepConfigure";
import DeployStepProgress from "@/components/deploy-from-git/DeployStepProgress";

export default function DeployFromGit() {
  const user = getUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState<"source" | "configure" | "deploying" | "done">("source");
  const [sourceIdx, setSourceIdx] = useState(0);
  const [repoUrl, setRepoUrl] = useState("");
  const [gitToken, setGitToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detectResult, setDetectResult] = useState<DetectResult | null>(null);
  const [detectError, setDetectError] = useState("");

  // Configure step
  const [branch, setBranch] = useState("main");
  const [buildCmd, setBuildCmd] = useState("");
  const [outDir, setOutDir] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | "new">("new");
  const [envPairs, setEnvPairs] = useState<{ k: string; v: string }[]>([]);

  // Deploy step
  const [deployId, setDeployId] = useState<number | null>(null);
  const [deployStatus, setDeployStatus] = useState<"building" | "ready" | "error">("building");
  const [buildLog, setBuildLog] = useState("Запускаем деплой...");
  const [deployUrl, setDeployUrl] = useState("");
  const [deployDuration, setDeployDuration] = useState(0);
  const [deployError, setDeployError] = useState("");
  const [deploying, setDeploying] = useState(false);

  const logRef = useRef<HTMLPreElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (user) {
      apiGet("projects", { user_id: String(user.user_id) }).then((d) =>
        setProjects(d.projects || [])
      );
    }
    const preUrl = searchParams.get("repo");
    if (preUrl) { setRepoUrl(preUrl); }
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [buildLog]);

  const handleDetect = async () => {
    if (!repoUrl.trim()) return;
    const normalized = normalizeGitUrl(repoUrl);
    setRepoUrl(normalized);
    const validErr = validateGitUrl(normalized);
    if (validErr) { setDetectError(validErr); return; }
    setDetecting(true); setDetectError(""); setDetectResult(null);
    const data = await apiGet("git_detect", { repo_url: normalized });
    setDetecting(false);
    if (data.error) { setDetectError(data.error + (data.details ? ': ' + data.details : '')); return; }
    setDetectResult(data);
    setBuildCmd(data.build_cmd || "npm run build");
    setOutDir(data.out_dir || "dist");
    const guessedName = repoUrl.split('/').pop()?.replace('.git', '') || 'my-project';
    setProjectName(guessedName);
    setStep("configure");
  };

  const startDeploy = async () => {
    if (!user) return;
    setDeploying(true); setDeployError("");

    let project_id: number;

    if (selectedProjectId === "new") {
      const { ok, data } = await apiPost("create_project", {
        user_id: user.user_id, name: projectName || "git-project",
        repo_url: repoUrl, framework: detectResult?.framework || "other",
      });
      if (!ok) { setDeployError(data.error || "Ошибка создания проекта"); setDeploying(false); return; }
      project_id = data.project_id;
    } else {
      project_id = selectedProjectId;
    }

    const env_vars: Record<string, string> = {};
    envPairs.forEach(({ k, v }) => { if (k.trim()) env_vars[k.trim()] = v; });

    setStep("deploying");
    setBuildLog("Запускаем деплой...\n");

    const { ok, data } = await apiPost("git_deploy", {
      project_id, user_id: user.user_id,
      repo_url: repoUrl, branch, build_cmd: buildCmd, out_dir: outDir,
      framework: detectResult?.framework, env_vars,
      ...(gitToken ? { git_token: gitToken } : {}),
    });

    setDeploying(false);

    if (!ok || !data.success) {
      setDeployStatus("error");
      setDeployError(data.error || "Неизвестная ошибка");
      setBuildLog(data.details || data.error || "Ошибка деплоя");
      return;
    }

    setDeployId(data.deploy_id);
    setDeployStatus("ready");
    setDeployUrl(data.url || "");
    setDeployDuration(data.duration_seconds || 0);
    setBuildLog("Деплой завершён!\nURL: " + (data.url || ""));
    setStep("done");

    navigate(`/dashboard/project/${project_id}`);
  };

  // Если деплой запущен — поллим статус
  useEffect(() => {
    if (step !== "deploying" || !deployId || !user) return;
    pollRef.current = setInterval(async () => {
      const data = await apiGet("deploy_status", { deploy_id: String(deployId), user_id: String(user.user_id) });
      if (data.build_log) setBuildLog(data.build_log);
      if (data.status === "ready") {
        setDeployStatus("ready"); setDeployUrl(data.url || "");
        setDeployDuration(data.duration_seconds || 0);
        setStep("done");
        if (pollRef.current) clearInterval(pollRef.current);
      } else if (data.status === "error") {
        setDeployStatus("error"); setDeployError("Деплой завершился с ошибкой");
        setStep("done");
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [step, deployId]);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate("/dashboard")} className="text-neutral-500 hover:text-white transition-colors">
            <Icon name="ChevronLeft" size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Deploy from Git</h1>
            <p className="text-neutral-400 text-sm mt-0.5">Разверни любой проект из Git в один клик</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { key: "source", label: "Источник" },
            { key: "configure", label: "Настройка" },
            { key: "deploying", label: "Деплой" },
          ].map((s, i) => {
            const steps = ["source", "configure", "deploying", "done"];
            const current = steps.indexOf(step);
            const idx = steps.indexOf(s.key);
            const done = current > idx;
            const active = current === idx || (s.key === "deploying" && step === "done");
            return (
              <div key={s.key} className="flex items-center gap-2">
                {i > 0 && <div className={`h-px w-8 ${done || active ? "bg-blue-400" : "bg-neutral-800"}`} />}
                <div className="flex items-center gap-1.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${done ? "bg-blue-400 text-black" : active ? "bg-blue-400/20 border border-blue-400 text-blue-400" : "bg-neutral-800 text-neutral-500"}`}>
                    {done ? <Icon name="Check" size={10} /> : i + 1}
                  </div>
                  <span className={`text-sm ${active || done ? "text-white" : "text-neutral-500"}`}>{s.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* STEP 1: Source */}
        {step === "source" && (
          <DeployStepSource
            sourceIdx={sourceIdx}
            repoUrl={repoUrl}
            gitToken={gitToken}
            showToken={showToken}
            detecting={detecting}
            detectError={detectError}
            onSelectSource={setSourceIdx}
            onChangeUrl={(url) => { setRepoUrl(url); setDetectError(""); }}
            onChangeToken={setGitToken}
            onToggleToken={() => setShowToken((p) => !p)}
            onDetect={handleDetect}
          />
        )}

        {/* STEP 2: Configure */}
        {step === "configure" && detectResult && (
          <DeployStepConfigure
            repoUrl={repoUrl}
            detectResult={detectResult}
            projects={projects}
            selectedProjectId={selectedProjectId}
            projectName={projectName}
            branch={branch}
            buildCmd={buildCmd}
            outDir={outDir}
            envPairs={envPairs}
            deploying={deploying}
            onBack={() => setStep("source")}
            onDeploy={startDeploy}
            onSelectProject={setSelectedProjectId}
            onChangeProjectName={setProjectName}
            onChangeBranch={setBranch}
            onChangeBuildCmd={setBuildCmd}
            onChangeOutDir={setOutDir}
            onAddEnvPair={() => setEnvPairs((p) => [...p, { k: "", v: "" }])}
            onChangeEnvPair={(i, field, value) => setEnvPairs((p) => p.map((x, j) => j === i ? { ...x, [field]: value } : x))}
            onRemoveEnvPair={(i) => setEnvPairs((p) => p.filter((_, j) => j !== i))}
            onResetDetect={() => { setStep("source"); setDetectResult(null); }}
          />
        )}

        {/* STEP 3: Deploying / Done */}
        {(step === "deploying" || step === "done") && (
          <DeployStepProgress
            step={step}
            deployStatus={deployStatus}
            repoUrl={repoUrl}
            buildLog={buildLog}
            deployUrl={deployUrl}
            deployDuration={deployDuration}
            deployError={deployError}
            logRef={logRef}
            onGoToDashboard={() => navigate("/dashboard")}
            onDeployAnother={() => { setStep("source"); setDetectResult(null); setDeployStatus("building"); setDeployId(null); }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
