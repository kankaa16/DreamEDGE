import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    BrainCircuit,
    Sparkles,
    RefreshCw,
    AlertCircle,
    Trophy,
    Target,
    TrendingUp,
    Lightbulb,
    ShieldCheck,
    LoaderCircle,
    Activity,
    Zap,
    Award,
    Crosshair,
} from "lucide-react";

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:8080/api";

// Cache the latest successful response while the app remains open.
let fantasyCoachCache = null;

// ---------------------------------------------
// Parse Gemini report into short dashboard items
// ---------------------------------------------

function parseReport(report = "") {
    const sections = {};
    let current = "";

    report.split("\n").forEach((line) => {
        const heading = line.match(/^#{1,3}\s+(.+)/);

        if (heading) {
            current = heading[1]
                .replace(/^\d+[\.\)]\s*/, "")
                .trim()
                .toLowerCase();

            sections[current] = [];
            return;
        }

        const content = line.trim();

        if (content && current) {
            sections[current].push(content);
        }
    });

    const find = (...terms) => {
        const key = Object.keys(sections).find((heading) =>
            terms.some((term) => heading.includes(term))
        );

        return key ? sections[key] : [];
    };

    const clean = (items, limit) =>
        items
            .map((item) =>
                item
                    .replace(/^[-*]\s+/, "")
                    .replace(/^\d+[\.\)]\s*/, "")
                    .replace(/\*\*/g, "")
                    .replace(/\*/g, "")
                    .trim()
            )
            .filter((item) => item.length > 10)
            .slice(0, limit)
            .map((item) =>
                item.length > 180 ? `${item.slice(0, 177).trim()}...` : item
            );

    return {
        strengths: clean(
            find("strengths", "what's working", "top performers"),
            2
        ),

        mistakes: clean(
            find(
                "improvement areas",
                "recurring mistakes",
                "room to improve",
                "mistakes",
                "weaknesses"
            ),
            2
        ),

        recommendations: clean(
            find(
                "next match tips",
                "game plan",
                "personalised recommendations",
                "recommendations"
            ),
            3
        ),

        verdict: clean(
            find("coach verdict", "final verdict", "verdict"),
            1
        ),
    };
}

// ---------------------------------------------
// Semi-circle selection control gauge
// ---------------------------------------------

function SelectionGauge({ value }) {
    const score =
        value === null || value === undefined
            ? null
            : Math.max(0, Math.min(100, Number(value)));

    const circumference = 283;
    const offset =
        score === null
            ? circumference
            : circumference - (score / 100) * circumference;

    const label =
        score === null
            ? "Awaiting data"
            : score >= 80
                ? "Excellent control"
                : score >= 65
                    ? "Good control"
                    : score >= 45
                        ? "Getting there"
                        : "Room to grow";

    return (
        <section className="bg-white border border-[#e7ece5] rounded-2xl p-5 md:p-8 shadow-[0_3px_16px_rgba(29,55,39,0.025)]">
            <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] items-center gap-6 md:gap-10">

                <div className="flex-1">
                    <div className="flex items-center gap-2 text-[#6e8d75] text-[10px] font-bold tracking-[0.18em] uppercase">
                        <Crosshair size={14} />
                        Your selection control
                    </div>

                    <h2 className="text-2xl md:text-3xl font-extrabold text-[#244c3b] mt-3">
                        How well are you picking your XI?
                    </h2>

                    <p className="text-sm text-[#87938a] mt-2 max-w-md leading-6">
                        See how close your selected team came to the best
                        feasible team in your analysed matches.
                    </p>

                    <div className="flex items-center gap-2 mt-5">
                        <span className="w-2 h-2 rounded-full bg-[#15966b]" />
                        <span className="text-xs text-[#718076]">
                            Higher control means better player selection.
                        </span>
                    </div>
                </div>

                 <div className="w-full md:w-64 flex justify-center md:mr-10">
                    <div className="relative w-60 h-36 overflow-hidden">

                        <svg
                            viewBox="0 0 220 125"
                            className="w-full h-full"
                        >
                            <path
                                d="M 20 110 A 90 90 0 0 1 200 110"
                                fill="none"
                                stroke="#e9eee8"
                                strokeWidth="17"
                                strokeLinecap="round"
                            />

                            {score !== null && (
                                <path
                                    d="M 20 110 A 90 90 0 0 1 200 110"
                                    fill="none"
                                    stroke="#15966b"
                                    strokeWidth="17"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={offset}
                                    className="transition-all duration-1000 ease-out"
                                />
                            )}
                        </svg>

                        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                            <span className="text-3xl font-black text-[#244c3b] tabular-nums whitespace-nowrap">
                                {score === null ? "--" : `${score.toFixed(1)}%`}
                            </span>

                            <span className="text-xs font-semibold text-[#15966b] mt-1">
                                {label}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ---------------------------------------------
// Inline bold text renderer
// ---------------------------------------------

function InlineText({ children, light = false }) {
    const parts = String(children).split(/(\*\*.*?\*\*)/g);

    return parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return (
                <strong
                    key={index}
                    className={light ? "font-bold text-white" : "font-bold text-[#244c3b]"}
                >
                    {part.slice(2, -2)}
                </strong>
            );
        }

        return <span key={index}>{part}</span>;
    });
}

// ---------------------------------------------
// Small performance stat
// ---------------------------------------------

function StatCard({ label, value, icon: Icon, color = "green" }) {
    const colors = {
        green: "bg-[#edf3ed] text-[#315d43]",
        blue: "bg-[#edf1fa] text-[#536d9d]",
        orange: "bg-[#fff3e8] text-[#c27a32]",
        purple: "bg-[#f1edfa] text-[#7761a2]",
    };

    return (
        <div className="bg-white border border-[#e7ece5] rounded-2xl p-4 md:p-5">
            <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors[color]}`}
            >
                <Icon size={18} />
            </div>

            <p className="text-xs text-[#929d94] mt-3">
                {label}
            </p>

            <p className="text-xl md:text-2xl font-extrabold text-[#244c3b] mt-1 capitalize">
                {value ?? "--"}
            </p>
        </div>
    );
}

// ---------------------------------------------
// Strengths / improvement cards
// ---------------------------------------------

function InsightCard({
    title,
    subtitle,
    icon: Icon,
    items,
    type = "green",
}) {
    const styles = {
        green: {
            icon: "bg-[#e9f3ec] text-[#28724d]",
            dot: "bg-[#299866]",
        },
        orange: {
            icon: "bg-[#fff2e5] text-[#c27a32]",
            dot: "bg-[#d58a3d]",
        },
    };

    const style = styles[type];

    return (
        <section className="bg-white border border-[#e9ede6] rounded-2xl p-5 md:p-6">
            <div className="flex items-center gap-3 mb-5">
                <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.icon}`}
                >
                    <Icon size={19} />
                </div>

                <div>
                    <h3 className="font-bold text-[#244c3b]">
                        {title}
                    </h3>

                    <p className="text-xs text-[#929d94] mt-1">
                        {subtitle}
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {items.length > 0 ? (
                    items.map((item, index) => (
                        <div key={index} className="flex gap-3 items-start">
                            <span
                                className={`w-1.5 h-1.5 rounded-full mt-[7px] shrink-0 ${style.dot}`}
                            />

                            <p className="text-[15px] leading-[1.8] text-[#65736a]">
                                <InlineText>{item}</InlineText>
                            </p>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-[#9aa39b]">
                        More match data is needed.
                    </p>
                )}
            </div>
        </section>
    );
}

// ---------------------------------------------
// Next match recommendations
// ---------------------------------------------

function RecommendationCard({ items }) {
    return (
        <section className="bg-[#203e31] text-white rounded-2xl p-5 md:p-6 relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full border border-white/10" />
            <div className="absolute -right-5 -top-5 w-28 h-28 rounded-full border border-white/10" />

            <div className="relative">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <Lightbulb size={20} />
                    </div>

                    <div>
                        <h3 className="font-bold">
                            Your next move
                        </h3>

                        <p className="text-xs text-white/55 mt-1">
                            Three things to focus on
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    {items.length > 0 ? (
                        items.map((item, index) => (
                            <div
                                key={index}
                                className="flex gap-3 items-start bg-white/[0.07] rounded-xl p-3"
                            >
                                <span className="w-7 h-7 rounded-lg bg-[#b6d6bd] text-[#203e31] flex items-center justify-center text-xs font-bold shrink-0">
                                    {index + 1}
                                </span>

                                <p className="text-[13px] leading-[1.7] text-white/85">
                                    <InlineText light>{item}</InlineText>
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-white/60">
                            More match history is needed for recommendations.
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}

// ---------------------------------------------
// Main Fantasy Coach page
// ---------------------------------------------

function FantasyCoach() {
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retry, setRetry] = useState(0);

    // Reuse cached insights on page revisit.
    // Only fetch again when the user clicks Refresh insights.
    useEffect(() => {
        const controller = new AbortController();

        if (retry === 0 && fantasyCoachCache) {
            setData(fantasyCoachCache);
            setError("");
            setLoading(false);

            return () => controller.abort();
        }

        async function fetchInsights() {
            setLoading(true);
            setError("");

            try {
                const response = await fetch(
                    `${API_URL}/fantasy-coach`,
                    { signal: controller.signal }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.error || "Unable to load your insights."
                    );
                }

                if (controller.signal.aborted) return;

                fantasyCoachCache = result;
                setData(result);
            } catch (err) {
                if (err.name !== "AbortError") {
                    setError(err.message || "Something went wrong.");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        fetchInsights();

        return () => controller.abort();
    }, [retry]);

    const report = useMemo(
        () => parseReport(data?.report || ""),
        [data?.report]
    );

    const verdict = report.verdict[0] || "";

    const hasReport = Boolean(data?.report);

    return (
        <div className="min-h-screen bg-[#f5f7f3]">

            {/* Navigation */}
            <nav className="bg-white/90 border-b border-[#e8ece5]">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#244c3b] text-white flex items-center justify-center font-bold text-sm">
                            11
                        </div>

                        <span className="text-lg font-extrabold tracking-tight text-[#244c3b]">
                            DreamEdge
                        </span>
                    </div>

                    <button
                        onClick={() => navigate("/dashboard")}
                        className="flex items-center gap-2 text-sm font-semibold text-[#637268] hover:text-[#087d60] transition"
                    >
                        <ArrowLeft size={16} />
                        Dashboard
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-5 md:px-8 py-8 md:py-11">

                {/* Page heading */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-[#6e8d75] text-[11px] font-bold tracking-[0.2em] uppercase mb-3">
                            <Sparkles size={14} />
                            Personal fantasy insights
                        </div>

                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#244c3b]">
                            Fantasy Coach<span className="text-[#91ad91]">.</span>
                        </h1>

                        <p className="text-sm text-[#87938a] mt-2">
                            Your previous game moves, analysed. So you make a smarter move next time.
                        </p>
                    </div>

                    {!loading && !error && hasReport && (
                        <button
                            onClick={() => setRetry((value) => value + 1)}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#dfe7dd] bg-white text-[#315d43] text-xs font-bold hover:bg-[#edf3ed] transition"
                        >
                            <RefreshCw size={14} />
                            Refresh insights
                        </button>
                    )}
                </div>

                {/* Loading */}
                {loading && (
                    <div className="bg-white border border-[#e7ece5] rounded-2xl p-16 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-[#edf3ed] text-[#315d43] flex items-center justify-center mx-auto">
                            <LoaderCircle size={27} className="animate-spin" />
                        </div>

                        <h2 className="font-bold text-[#244c3b] mt-5">
                            Analysing your fantasy journey
                        </h2>

                        <p className="text-sm text-[#8b978e] mt-2">
                            Finding patterns across your completed matches...
                        </p>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="bg-white border border-red-100 rounded-2xl p-12 text-center">
                        <AlertCircle size={30} className="mx-auto text-red-400" />

                        <h2 className="font-bold text-[#244c3b] mt-4">
                            Couldn't load your insights
                        </h2>

                        <p className="text-sm text-[#8b978e] mt-2">
                            {error}
                        </p>

                        <button
                            onClick={() => setRetry((value) => value + 1)}
                            className="mt-5 px-5 py-2.5 bg-[#244c3b] text-white rounded-xl text-sm font-semibold"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* No data */}
                {!loading && !error && data && !hasReport && (
                    <div className="bg-white border border-[#e7ece5] rounded-2xl p-12 text-center">
                        <BrainCircuit size={34} className="mx-auto text-[#668b70]" />

                        <h2 className="text-xl font-bold text-[#244c3b] mt-4">
                            Your coach is getting ready
                        </h2>

                        <p className="text-sm text-[#8b978e] mt-2 max-w-md mx-auto">
                            {data.message ||
                                "Complete more match autopsies to unlock your personal insights."}
                        </p>
                    </div>
                )}

                {/* Dashboard */}
                {!loading && !error && hasReport && (
                    <>
                        {/* Top stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">

                            <StatCard
                                label="Matches analysed"
                                value={data.matches_analysed ?? 0}
                                icon={Trophy}
                                color="green"
                            />

                            <StatCard
                                label="Analysis status"
                                value="Insights ready"
                                icon={Activity}
                                color="blue"
                            />

                            <StatCard
                                label="Coach engine"
                                value="DreamEdge AI"
                                icon={BrainCircuit}
                                color="orange"
                            />
                        </div>

                        {/* Demo notice */}
                        {data.is_demo && (
                            <div className="flex items-center gap-2.5 bg-[#fff9ed] border border-[#f2e7cf] rounded-xl px-4 py-3 mb-5">
                                <Sparkles size={16} className="text-[#b7833f] shrink-0" />

                                <p className="text-xs text-[#947344] font-medium">
                                    Demo insights — generated using synthetic match data.
                                </p>
                            </div>
                        )}

                        {/* Selection gauge */}
                        <div className="mb-5">
                            <SelectionGauge value={data.selection_control} />
                        </div>

                        {/* Performance stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">

                            <StatCard
                                label="Captaincy efficiency"
                                value={
                                    data.captaincy_efficiency != null
                                        ? `${Number(data.captaincy_efficiency).toFixed(1)}%`
                                        : "--"
                                }
                                icon={Trophy}
                                color="green"
                            />

                            <StatCard
                                label="Best department"
                                value={data.best_department || "--"}
                                icon={TrendingUp}
                                color="blue"
                            />

                            <StatCard
                                label="Points missed"
                                value={
                                    data.points_missed != null
                                        ? Number(data.points_missed).toLocaleString("en-IN", {
    maximumFractionDigits: 1,
  })
                                        : "--"
                                }
                                icon={Target}
                                color="orange"
                            />

                            <StatCard
                                label="Strong picks"
                                value={
                                    data.strong_picks != null
                                        ? data.strong_picks
                                        : "--"
                                }
                                icon={Award}
                                color="purple"
                            />
                        </div>

                        {/* Strengths and improvement areas */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

                            <InsightCard
                                title="What's working"
                                subtitle="Give yourself credit"
                                icon={TrendingUp}
                                items={report.strengths}
                                type="green"
                            />

                            <InsightCard
                                title="Room to improve"
                                subtitle="Your biggest opportunities"
                                icon={Target}
                                items={report.mistakes}
                                type="orange"
                            />
                        </div>

                        {/* Recommendations */}
                        <div className="mb-5">
                            <RecommendationCard
                                items={report.recommendations}
                            />
                        </div>

                        {/* Confidence booster */}
                        <section className="bg-[#eaf3eb] border border-[#dce8dc] rounded-2xl p-5 md:p-6 flex gap-4 items-center">
                            <div className="w-12 h-12 rounded-xl bg-white text-[#15966b] flex items-center justify-center shrink-0">
                                <ShieldCheck size={23} />
                            </div>

                            <div>
                                <p className="font-bold text-[#244c3b]">
                                    Keep backing your instincts.
                                </p>

                                <p className="text-sm text-[#607568] mt-1 leading-6">
                                    {verdict ||
                                        "You've got a foundation to build on. Keep learning from every match and sharpening your strategy."}
                                </p>
                            </div>
                        </section>
                    </>
                )}

                {/* Footer */}
                <footer className="mt-9 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#9aa49b]">
                    <p className="flex items-center gap-2">
                        <BrainCircuit size={14} />
                        Powered by DreamEdge AI
                    </p>

                    <p>
                        Don't just play fantasy. Understand the game.
                    </p>
                </footer>
            </main>
        </div>
    );
}

export default FantasyCoach;