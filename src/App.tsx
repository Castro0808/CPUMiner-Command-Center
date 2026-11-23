import React, { useState, useEffect } from "react";
import { 
  Cpu, Terminal, Download, GitBranch, Sparkles, Activity, Play, Square, 
  Settings, CheckCircle, AlertCircle, RefreshCw, Layers, ShieldCheck, 
  ExternalLink, Copy, Check, HardDrive, Wrench, ChevronRight, HelpCircle, Send, Heart
} from "lucide-react";

interface ReleaseAsset {
  name: string;
  size: number;
  download_count: number;
  browser_download_url: string;
}

interface Release {
  id: number;
  tag_name: string;
  name: string;
  published_at: string;
  html_url: string;
  body: string;
  author: {
    login: string;
    avatar_url: string;
  };
  assets: ReleaseAsset[];
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"releases" | "builder" | "benchmark" | "sim" | "advisor">("releases");
  const [releases, setReleases] = useState<Release[]>([]);
  const [loadingReleases, setLoadingReleases] = useState<boolean>(true);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [aiSummaries, setAiSummaries] = useState<Record<string, string>>({});
  const [summarizing, setSummarizing] = useState<boolean>(false);

  // Config builder state
  const [algo, setAlgo] = useState("scrypt");
  const [poolUrl, setPoolUrl] = useState("stratum+tcp://litecoinpool.org:3333");
  const [username, setUsername] = useState("worker.1");
  const [password, setPassword] = useState("x");
  const [threads, setThreads] = useState(4);
  const [cpuAffinity, setCpuAffinity] = useState(false);
  const [benchmarkMode, setBenchmarkMode] = useState(false);
  const [copied, setCopied] = useState(false);

  // Mining simulation state
  const [simRunning, setSimRunning] = useState(false);
  const [shares, setShares] = useState({ accepted: 0, rejected: 0 });
  const [logs, setLogs] = useState<string[]>([]);
  const [hashrate, setHashrate] = useState(0);

  // AI chat state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "ai", text: "Greetings! I am your Pooler CPUMiner technical assistant. Ask me anything about compiling minerd, configuring stratum pools, optimizing AVX/AES-NI instruction sets, or troubleshooting thread affinity." }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetchReleases();
  }, []);

  const fetchReleases = async () => {
    try {
      setLoadingReleases(true);
      const res = await fetch("/api/releases");
      const data = await res.json();
      if (Array.isArray(data)) {
        setReleases(data);
        if (data.length > 0) setSelectedRelease(data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch releases:", err);
    } finally {
      setLoadingReleases(false);
    }
  };

  const handleSummarize = async (release: Release) => {
    if (aiSummaries[release.tag_name]) return;
    try {
      setSummarizing(true);
      const res = await fetch("/api/ai/summarize-release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagName: release.tag_name,
          releaseName: release.name,
          body: release.body
        })
      });
      const data = await res.json();
      if (data.summary) {
        setAiSummaries(prev => ({ ...prev, [release.tag_name]: data.summary }));
      }
    } catch (err) {
      console.error("AI summary error:", err);
    } finally {
      setSummarizing(false);
    }
  };

  // Mining simulation loop
  useEffect(() => {
    let interval: any;
    if (simRunning) {
      interval = setInterval(() => {
        const randomHash = +(Math.random() * 15 + 35).toFixed(2);
        setHashrate(randomHash);
        const hit = Math.random();
        if (hit > 0.8) {
          setShares(s => ({ ...s, accepted: s.accepted + 1 }));
          setLogs(l => [`[${new Date().toLocaleTimeString()}] Stratum block difficulty target met. Share accepted by pool! (+${randomHash} kH/s)`, ...l.slice(0, 49)]);
        } else if (hit < 0.05) {
          setShares(s => ({ ...s, rejected: s.rejected + 1 }));
          setLogs(l => [`[${new Date().toLocaleTimeString()}] WARNING: Share rejected (stale job or diff mismatch).`, ...l.slice(0, 49)]);
        } else {
          setLogs(l => [`[${new Date().toLocaleTimeString()}] thread 0: 32.4 kH/s, 1024 hashes, nonce 0x${Math.floor(Math.random()*100000).toString(16)}`, ...l.slice(0, 49)]);
        }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [simRunning]);

  const generateCommand = () => {
    let cmd = `./minerd -a ${algo} -o ${poolUrl} -u ${username} -p ${password} -t ${threads}`;
    if (cpuAffinity) cmd += ` --cpu-affinity`;
    if (benchmarkMode) cmd += ` --benchmark`;
    return cmd;
  };

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(generateCommand());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || chatLoading) return;

    const userText = inputMessage;
    setInputMessage("");
    setChatMessages(prev => [...prev, { sender: "user", text: userText }]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, history: chatMessages })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { sender: "ai", text: data.reply || "No response received." }]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages(prev => [...prev, { sender: "ai", text: "Error communicating with AI assistant." }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar: Strict 3-zone contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white whitespace-nowrap">CPUMiner Center</h1>
            <p className="text-xs text-slate-400 font-mono">pooler/cpuminer (minerd)</p>
          </div>
        </div>

        {/* Zone 2: 4-5 concise single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button 
            onClick={() => setActiveTab("releases")} 
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${activeTab === 'releases' ? 'text-cyan-400 border-cyan-400 font-semibold' : 'border-transparent hover:text-slate-200'}`}
          >
            Releases Explorer
          </button>
          <button 
            onClick={() => setActiveTab("builder")} 
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${activeTab === 'builder' ? 'text-cyan-400 border-cyan-400 font-semibold' : 'border-transparent hover:text-slate-200'}`}
          >
            Config Generator
          </button>
          <button 
            onClick={() => setActiveTab("benchmark")} 
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${activeTab === 'benchmark' ? 'text-cyan-400 border-cyan-400 font-semibold' : 'border-transparent hover:text-slate-200'}`}
          >
            Benchmark Calculator
          </button>
          <button 
            onClick={() => setActiveTab("sim")} 
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${activeTab === 'sim' ? 'text-cyan-400 border-cyan-400 font-semibold' : 'border-transparent hover:text-slate-200'}`}
          >
            Stratum Simulator
          </button>
          <button 
            onClick={() => setActiveTab("advisor")} 
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${activeTab === 'advisor' ? 'text-cyan-400 border-cyan-400 font-semibold' : 'border-transparent hover:text-slate-200'}`}
          >
            AI Expert Advisor
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <a 
            href="https://github.com/sponsors/Castro0808" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/60 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            Sponsor
          </a>
          <a 
            href="https://github.com/pooler/cpuminer" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <GitBranch className="w-3.5 h-3.5" />
            GitHub Repository
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </header>

      {/* Mobile Nav Tabs */}
      <div className="lg:hidden flex overflow-x-auto gap-2 px-4 py-2 border-b border-slate-800 bg-slate-900 text-xs">
        <button onClick={() => setActiveTab("releases")} className={`px-3 py-1.5 rounded whitespace-nowrap ${activeTab === 'releases' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}>Releases</button>
        <button onClick={() => setActiveTab("builder")} className={`px-3 py-1.5 rounded whitespace-nowrap ${activeTab === 'builder' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}>Config</button>
        <button onClick={() => setActiveTab("benchmark")} className={`px-3 py-1.5 rounded whitespace-nowrap ${activeTab === 'benchmark' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}>Benchmark</button>
        <button onClick={() => setActiveTab("sim")} className={`px-3 py-1.5 rounded whitespace-nowrap ${activeTab === 'sim' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}>Simulator</button>
        <button onClick={() => setActiveTab("advisor")} className={`px-3 py-1.5 rounded whitespace-nowrap ${activeTab === 'advisor' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}>AI Expert</button>
      </div>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* --- RELEASES EXPLORER TAB --- */}
        {activeTab === "releases" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <GitBranch className="w-6 h-6 text-cyan-400" />
                  pooler / cpuminer Releases
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Multi-threaded CPU miner for Litecoin, Bitcoin, and scrypt-based cryptocurrencies (minerd).
                </p>
              </div>
              <button 
                onClick={fetchReleases}
                disabled={loadingReleases}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 self-start"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingReleases ? 'animate-spin' : ''}`} />
                Refresh Releases
              </button>
            </div>

            {loadingReleases ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-cyan-500" />
                <p className="text-sm">Fetching releases from GitHub...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left column: Release selector list */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Release Versions</h3>
                  <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
                    {releases.map((rel) => {
                      const isSelected = selectedRelease?.id === rel.id;
                      return (
                        <button
                          key={rel.id}
                          onClick={() => setSelectedRelease(rel)}
                          className={`w-full text-left p-4 rounded-xl border transition-all ${
                            isSelected 
                              ? 'bg-cyan-950/30 border-cyan-500/50 text-white shadow-lg shadow-cyan-950/50' 
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-cyan-400 text-sm">{rel.tag_name}</span>
                            <span className="text-xs text-slate-500">{new Date(rel.published_at).toLocaleDateString()}</span>
                          </div>
                          <h4 className="font-medium text-sm mt-1 truncate">{rel.name || rel.tag_name}</h4>
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 font-mono">
                            <span>{rel.assets.length} assets</span>
                            <span>·</span>
                            <span>{rel.author.login}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right 2 columns: Selected Release details */}
                <div className="lg:col-span-2 space-y-6">
                  {selectedRelease ? (
                    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-semibold">
                              {selectedRelease.tag_name}
                            </span>
                            <span className="text-xs text-slate-400">
                              Published on {new Date(selectedRelease.published_at).toLocaleDateString()} by {selectedRelease.author.login}
                            </span>
                          </div>
                          <h2 className="text-xl font-bold text-white mt-2">{selectedRelease.name}</h2>
                        </div>
                        <a 
                          href={selectedRelease.html_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 self-start whitespace-nowrap"
                        >
                          View on GitHub <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {/* AI Release Breakdown button & box */}
                      <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                            <Sparkles className="w-4 h-4" />
                            AI Release Notes Breakdown
                          </div>
                          {!aiSummaries[selectedRelease.tag_name] && (
                            <button
                              onClick={() => handleSummarize(selectedRelease)}
                              disabled={summarizing}
                              className="px-3 py-1 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors flex items-center gap-1.5"
                            >
                              {summarizing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                              Summarize with Gemini
                            </button>
                          )}
                        </div>
                        {aiSummaries[selectedRelease.tag_name] ? (
                          <div className="text-sm text-slate-300 leading-relaxed font-sans whitespace-pre-line bg-slate-900/80 p-4 rounded-lg border border-slate-800">
                            {aiSummaries[selectedRelease.tag_name]}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">
                            Click to generate a technical engineering summary of this release using Google Gemini AI.
                          </p>
                        )}
                      </div>

                      {/* Release Notes Body */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Release Notes</h3>
                        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-line overflow-x-auto leading-relaxed">
                          {selectedRelease.body || "No release notes provided."}
                        </div>
                      </div>

                      {/* Assets List */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Downloads & Assets</h3>
                        <div className="space-y-2">
                          {selectedRelease.assets.map((asset, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-mono">
                              <div className="flex items-center gap-3 truncate">
                                <Download className="w-4 h-4 text-cyan-400 shrink-0" />
                                <span className="text-slate-200 truncate">{asset.name}</span>
                                <span className="text-slate-500">({(asset.size / 1024).toFixed(1)} KB)</span>
                              </div>
                              <div className="flex items-center gap-4 shrink-0">
                                <span className="text-slate-500">{asset.download_count.toLocaleString()} downloads</span>
                                <a 
                                  href={asset.browser_download_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-sans font-medium transition-colors"
                                >
                                  Download
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-500">Select a release version to view details.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- CONFIG GENERATOR TAB --- */}
        {activeTab === "builder" && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-800">
              <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <Terminal className="w-6 h-6 text-cyan-400" />
                CPUMiner Command Line Builder (`minerd`)
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Construct optimized startup commands and configuration arguments for pooler/cpuminer.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Controls */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Parameters & Flags</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Mining Algorithm (`-a`)</label>
                    <select 
                      value={algo} 
                      onChange={e => setAlgo(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="scrypt">Scrypt (Litecoin, Dogecoin, etc.)</option>
                      <option value="sha256d">SHA-256d (Bitcoin era testnets)</option>
                      <option value="keccak">Keccak (NIST standard)</option>
                      <option value="skein">Skein</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Stratum Pool URL (`-o`)</label>
                    <input 
                      type="text" 
                      value={poolUrl} 
                      onChange={e => setPoolUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm font-mono text-cyan-400 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Worker Username (`-u`)</label>
                      <input 
                        type="text" 
                        value={username} 
                        onChange={e => setUsername(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Worker Password (`-p`)</label>
                      <input 
                        type="text" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Thread Count (`-t`): {threads}</label>
                    <input 
                      type="range" 
                      min="1" 
                      max="32" 
                      value={threads} 
                      onChange={e => setThreads(Number(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>

                  <div className="pt-2 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={cpuAffinity} 
                        onChange={e => setCpuAffinity(e.target.checked)}
                        className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-cyan-600 focus:ring-0"
                      />
                      <span className="text-sm text-slate-300">Bind threads to specific CPU cores (`--cpu-affinity`)</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={benchmarkMode} 
                        onChange={e => setBenchmarkMode(e.target.checked)}
                        className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-cyan-600 focus:ring-0"
                      />
                      <span className="text-sm text-slate-300">Run local hashing benchmark (`--benchmark`)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Output Command Preview */}
              <div className="space-y-6">
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Generated CLI Command</h3>
                    <button
                      onClick={handleCopyCommand}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "Copied!" : "Copy Command"}
                    </button>
                  </div>
                  
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto leading-relaxed">
                    {generateCommand()}
                  </div>

                  <div className="border-t border-slate-800 pt-4 space-y-2 text-xs text-slate-400">
                    <p className="font-semibold text-slate-300">Compilation Quick Start (Linux / macOS):</p>
                    <div className="bg-slate-950 p-3 rounded-lg font-mono text-[11px] text-slate-300 space-y-1">
                      <p>./autogen.sh</p>
                      <p>./configure CFLAGS="-O3"</p>
                      <p>make</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- BENCHMARK CALCULATOR TAB --- */}
        {activeTab === "benchmark" && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-800">
              <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <Activity className="w-6 h-6 text-cyan-400" />
                Hashrate & Hardware Benchmark Estimator
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Estimate expected CPU mining performance (kH/s) across modern and vintage microarchitectures.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { cpu: "Intel Core i9-14900K", cores: 24, threads: 32, hashrate: "145.2 kH/s", power: "185W" },
                { cpu: "AMD Ryzen 9 7950X", cores: 16, threads: 32, hashrate: "162.8 kH/s", power: "170W" },
                { cpu: "Apple M3 Max", cores: 16, threads: 16, hashrate: "98.4 kH/s", power: "45W" },
                { cpu: "Intel Xeon E5-2690 v4", cores: 14, threads: 28, hashrate: "78.0 kH/s", power: "135W" },
                { cpu: "Intel Core i7-4770K (Classic)", cores: 4, threads: 8, hashrate: "18.5 kH/s", power: "84W" },
                { cpu: "AMD FX-8350 (Bulldozer)", cores: 8, threads: 8, hashrate: "22.1 kH/s", power: "125W" },
              ].map((item, i) => (
                <div key={i} className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-white text-sm">{item.cpu}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{item.cores} Cores / {item.threads} Threads</p>
                    </div>
                    <Cpu className="w-5 h-5 text-cyan-400 shrink-0" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 font-mono text-xs">
                    <div>
                      <span className="text-slate-500 block">Est. Scrypt Hashrate</span>
                      <span className="text-cyan-400 font-bold">{item.hashrate}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Power Draw</span>
                      <span className="text-slate-200">{item.power}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- STRATUM SIMULATOR TAB --- */}
        {activeTab === "sim" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Terminal className="w-6 h-6 text-cyan-400" />
                  Stratum Mining Worker Simulator
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Test and observe simulated pool worker telemetry, share submissions, and hash output in real time.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSimRunning(!simRunning)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    simRunning ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {simRunning ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {simRunning ? "Stop Miner" : "Start Miner"}
                </button>
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Current Hashrate</span>
                <div className="text-2xl font-mono font-bold text-cyan-400 mt-1">{hashrate} <span className="text-xs text-slate-500">kH/s</span></div>
              </div>
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Accepted Shares</span>
                <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">{shares.accepted}</div>
              </div>
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Rejected Shares</span>
                <div className="text-2xl font-mono font-bold text-rose-400 mt-1">{shares.rejected}</div>
              </div>
            </div>

            {/* Terminal console */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                  <span className="ml-2 text-xs font-mono text-slate-400">minerd — stratum+tcp://litecoinpool.org</span>
                </div>
                <div className="text-xs font-mono text-slate-500">
                  {simRunning ? <span className="text-emerald-400">● RUNNING</span> : <span className="text-slate-500">○ IDLE</span>}
                </div>
              </div>
              <div className="p-4 font-mono text-xs text-slate-300 h-96 overflow-y-auto space-y-1 bg-slate-950">
                {logs.length === 0 ? (
                  <div className="text-slate-600 italic">Miner is idle. Click "Start Miner" above to begin hashing simulation.</div>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className={log.includes("WARNING") ? "text-rose-400" : log.includes("accepted") ? "text-emerald-400" : "text-slate-300"}>
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- AI EXPERT ADVISOR TAB --- */}
        {activeTab === "advisor" && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-800">
              <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-cyan-400" />
                AI Mining Expert & Compilation Advisor
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Get instant expert guidance on compiling minerd, resolving missing libcurl dependencies, and tuning thread affinity.
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[600px]">
              <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white">Gemini Technical Advisor</h3>
                  <p className="text-xs text-slate-400">Powered by @google/genai</p>
                </div>
              </div>

              {/* Chat messages */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.sender === 'user' 
                        ? 'bg-cyan-600 text-white rounded-br-none' 
                        : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="bg-slate-800 text-slate-400 rounded-2xl px-4 py-3 text-sm flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                      Thinking...
                    </div>
                  </div>
                )}
              </div>

              {/* Input box */}
              <form onSubmit={handleSendMessage} className="p-4 bg-slate-900 border-t border-slate-800 flex gap-3">
                <input 
                  type="text" 
                  value={inputMessage} 
                  onChange={e => setInputMessage(e.target.value)}
                  placeholder="Ask about compilation, libcurl, or thread optimization..." 
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
                <button 
                  type="submit" 
                  disabled={chatLoading || !inputMessage.trim()}
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500 bg-slate-900/40 flex flex-col sm:flex-row items-center justify-center gap-2">
        <span>CPUMiner Command Center — Built for pooler/cpuminer release exploration and operations.</span>
        <span className="hidden sm:inline">·</span>
        <a href="https://github.com/sponsors/Castro0808" target="_blank" rel="noreferrer" className="text-rose-400 hover:underline flex items-center gap-1">
          Support @Castro0808 on GitHub Sponsors
        </a>
      </footer>
    </div>
  );
}
