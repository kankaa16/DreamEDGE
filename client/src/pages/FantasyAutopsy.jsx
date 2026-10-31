import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    ArrowUpRight,
    ChartNoAxesColumn,
    Crown,
    Search,
    Sparkles,
    Trophy,
} from "lucide-react";

const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:8080/api"
).replace(/\/$/, "");

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function formatPoints(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) return "—";

    return Number.isInteger(number) ? number : number.toFixed(1);
}

function getPlayerPoints(player) {
    return Number(
        player?.points ??
        player?.final_points ??
        player?.finalPoints ??
        player?.breakdown?.total_points ??
        0
    );
}

function getBreakdown(player) {
    return player?.breakdown || {};
}

function parseGeminiReport(report = "") {
    const result = {};

    const normalized = report
        .replace(/\r\n/g, "\n")
        .replace(/^```markdown\s*/i, "")
        .replace(/\s*```$/, "");

    const sections = normalized.split(/^##\s+/m);

    sections.forEach((section) => {
        const lines = section.trim().split("\n");
        const heading = lines.shift()?.trim();

        if (!heading) return;

        result[heading] = lines.join("\n").trim();
    });

    return result;
}

function findReportSection(sections, heading) {
    const key = Object.keys(sections).find((item) =>
        item.toLowerCase().includes(heading.toLowerCase())
    );

    return key ? sections[key] : "";
}

function extractSentences(text = "", limit = 3) {
    return text
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/^\s*[-•]\s*/gm, "")
        .split(/(?<=[.!?])\s+|\n+/)
        .map((item) => item.trim())
        .filter((item) => item.length > 15)
        .slice(0, limit);
}

function extractBullets(text = "", limit = 5) {
    return text
        .split("\n")
        .map((line) =>
            line
                .replace(/^\s*[-*•]\s*/, "")
                .replace(/\*\*/g, "")
                .trim()
        )
        .filter((line) => line.length > 0)
        .slice(0, limit);
}

// --------------------------------------------------
// Reusable UI
// --------------------------------------------------

function StatCard({ label, value, description, color = "default" }) {
    const colors = {
        default: "text-gray-900",
        green: "text-emerald-700",
        red: "text-rose-700",
        blue: "text-blue-700",
        purple: "text-violet-700",
    };

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">{label}</p>

            <p className={`mt-2 text-3xl font-black ${colors[color]}`}>
                {value ?? "—"}
            </p>

            {description && (
                <p className="mt-2 text-xs leading-5 text-gray-400">
                    {description}
                </p>
            )}
        </div>
    );
}

function SectionTitle({ title, subtitle, icon }) {
    return (
        <div className="mb-5 flex items-start gap-3">
            {icon && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                    {icon}
                </div>
            )}

            <div>
                <h2 className="text-lg font-bold text-gray-900">
                    {title}
                </h2>

                {subtitle && (
                    <p className="mt-1 text-sm text-gray-500">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
}

function PointsBar({ label, points, total }) {
    const numericPoints = Number(points) || 0;
    const numericTotal = Number(total) || 0;

    const percentage =
        numericTotal > 0
            ? Math.min(
                Math.max((numericPoints / numericTotal) * 100, 0),
                100
            )
            : 0;

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">
                    {label}
                </span>

                <span className="font-bold text-gray-900">
                    {formatPoints(numericPoints)}
                </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                    className="h-full rounded-full bg-emerald-600 transition-all"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

function PlayerRow({ player, index, variant = "green" }) {
    const points = getPlayerPoints(player);

    const styles =
        variant === "red"
            ? "bg-rose-50 text-rose-700"
            : "bg-emerald-50 text-emerald-700";

    return (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3">
            <div className="flex min-w-0 items-center gap-3">
                <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${styles}`}
                >
                    {index + 1}
                </span>

                <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">
                        {player.name || "Unknown player"}
                    </p>

                    <p className="text-xs capitalize text-gray-400">
                        {player.role || "Player"}
                        {player.is_captain && " · Captain"}
                        {player.is_vice_captain && " · Vice-captain"}
                    </p>
                </div>
            </div>

            <p
                className={`shrink-0 font-bold ${
                    variant === "red"
                        ? "text-rose-700"
                        : "text-emerald-700"
                }`}
            >
                {formatPoints(points)} pts
            </p>
        </div>
    );
}

function InsightCard({ icon, title, description, color = "green" }) {
    const styles = {
        green: "border-emerald-100 bg-emerald-50",
        red: "border-rose-100 bg-rose-50",
        blue: "border-blue-100 bg-blue-50",
        purple: "border-violet-100 bg-violet-50",
        amber: "border-amber-100 bg-amber-50",
    };

    return (
        <div className={`rounded-2xl border p-5 ${styles[color]}`}>
            <span className="text-emerald-800">{icon}</span>

            <h3 className="mt-3 font-bold text-gray-900">
                {title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-600">
                {description}
            </p>
        </div>
    );
}

function LoadingScreen() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#f7f8f5]">
            <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />

                <p className="mt-4 text-sm text-gray-500">
                    Analysing your fantasy team...
                </p>
            </div>
        </div>
    );
}

function ErrorScreen({ message, onRetry }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#f7f8f5] px-5">
            <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center">
                <h2 className="text-xl font-bold text-gray-900">
                    Couldn't load the autopsy
                </h2>

                <p className="mt-2 text-sm text-red-600">
                    {message}
                </p>

                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-5 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}

// --------------------------------------------------
// Main page
// --------------------------------------------------

export default function FantasyAutopsy() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [autopsy, setAutopsy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [report, setReport] = useState("");
    const [reportLoading, setReportLoading] = useState(false);
    const [reportError, setReportError] = useState("");

    // --------------------------------------------------
    // Fetch normal autopsy
    // --------------------------------------------------

    useEffect(() => {
        if (!id) {
            setError("Fantasy team ID is missing from the URL.");
            setLoading(false);
            return;
        }

        const controller = new AbortController();

        async function fetchAutopsy() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `${API_URL}/teams/${encodeURIComponent(id)}/autopsy`,
                    { signal: controller.signal }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.error || "Unable to load match autopsy."
                    );
                }

                if (!data.autopsy) {
                    throw new Error("Autopsy data was not returned.");
                }

                setAutopsy(data.autopsy);
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

        fetchAutopsy();

        return () => controller.abort();
    }, [id]);

    // --------------------------------------------------
    // Generate AI report
    // --------------------------------------------------

    async function generateAIInsights() {
        if (!id || reportLoading) return;

        try {
            setReportLoading(true);
            setReportError("");

            const response = await fetch(
                `${API_URL}/teams/${encodeURIComponent(id)}/autopsy?include_report=true`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.details ||
                    data.error ||
                    "Unable to generate AI insights."
                );
            }

            const generatedReport = data.autopsy?.report;

            if (!generatedReport) {
                throw new Error("The AI returned an empty report.");
            }

            setReport(generatedReport);

            requestAnimationFrame(() => {
                document.getElementById("ai-insights")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            });
        } catch (err) {
            setReportError(
                err.message || "Failed to generate AI insights."
            );
        } finally {
            setReportLoading(false);
        }
    }

    // --------------------------------------------------
    // Parse AI report
    // Keep this hook BEFORE all conditional returns.
    // --------------------------------------------------

    const reportSections = useMemo(
        () => parseGeminiReport(report),
        [report]
    );

    // --------------------------------------------------
    // Loading and error
    // --------------------------------------------------

    if (loading) return <LoadingScreen />;

    if (error) {
        return (
            <ErrorScreen
                message={error}
                onRetry={() => window.location.reload()}
            />
        );
    }

    if (!autopsy) return null;

    // --------------------------------------------------
    // Actual backend data
    // --------------------------------------------------

    const performance = autopsy.performance || {};
    const captaincy = autopsy.captaincy || {};
    const selection = autopsy.selection || {};

    const totalPoints = Number(autopsy.total_points ?? 0);
    const basePoints = Number(autopsy.base_points ?? 0);

    const players = Array.isArray(autopsy.players)
        ? autopsy.players
        : [];

    // Support both the actual AutopsyPlayer response and the older
    // selected_players field if the backend still returns that field.
    const selectedPlayers =
        players.length > 0
            ? players
            : Array.isArray(selection.selected_players)
                ? selection.selected_players
                : [];

    const topPerformers = Array.isArray(performance.top_performers)
        ? performance.top_performers
        : [];

    const bottomPerformers = Array.isArray(performance.bottom_performers)
        ? performance.bottom_performers
        : [];

    const replacements = Array.isArray(selection.replacements)
        ? selection.replacements
        : [];

    const opportunities = Array.isArray(selection.missed_opportunities)
        ? selection.missed_opportunities
        : [];

    const missedPoints = Number(selection.points_missed ?? 0);

    const matchName =
        typeof autopsy.match === "string"
            ? autopsy.match
            : "Match details unavailable";

    const format = autopsy.format || "";

    const captaincyLost = Number(captaincy.points_lost ?? 0);

    const overview = findReportSection(
        reportSections,
        "Match Overview"
    );

    const captaincyExplanation = findReportSection(
        reportSections,
        "Captaincy Analysis"
    );

    const selectionExplanation = findReportSection(
        reportSections,
        "Selection Analysis"
    );

    const verdict = findReportSection(
        reportSections,
        "Final Verdict"
    );

    const overviewSentences = extractSentences(overview, 2);
    const captaincySentences = extractSentences(captaincyExplanation, 2);
    const selectionSentences = extractSentences(selectionExplanation, 3);
    const tips = extractBullets(verdict, 4);

    const biggestMiss = selection.biggest_missed_opportunity || null;

    // --------------------------------------------------
    // Page
    // --------------------------------------------------

    return (
        <div className="min-h-screen bg-[#f7f8f5] text-gray-900">
            {/* Header */}

            <header className="border-b border-gray-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
                    <div>
                        <p className="text-xl font-black tracking-tight text-emerald-800">
                            DreamEdge
                            <span className="text-emerald-500">.</span>
                        </p>

                        <p className="text-xs text-gray-400">
                            Fantasy intelligence
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                        Dashboard
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-7xl space-y-8 px-5 py-8 lg:px-8">
                {/* Match heading */}

                <section className="mx-auto w-full max-w-[1440px] px-6 pb-10 pt-12 md:px-10 lg:px-14">

  <div className="mb-6 flex flex-wrap items-center gap-2">
    <span className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold tracking-[0.12em] text-emerald-800">
      MATCH AUTOPSY
    </span>

    <span className="rounded-full bg-amber-100 px-4 py-2 text-xs font-bold tracking-[0.12em] text-amber-800">
      DEMO DATA
    </span>
  </div>

  <div className="max-w-4xl">
    <h1 className="font-[Manrope] text-4xl font-extrabold leading-[1.12] tracking-[-0.045em] text-slate-900 md:text-5xl lg:text-[58px]">
      Your fantasy performance,
      <span className="text-emerald-800"> decoded.</span>
    </h1>

    <p className="mt-4 text-base font-medium tracking-[-0.01em] text-slate-500 md:text-lg">
      Mumbai Indians
      <span className="mx-2 text-slate-300">vs</span>
      Rajasthan Royals
      <span className="mx-2 text-slate-300">·</span>
      T20
    </p>
  </div>
</section>

                {/* Actions */}

                <section className="grid gap-4 md:grid-cols-2">
                    <button
                        type="button"
                        onClick={() =>
                            document.getElementById("match-analysis")?.scrollIntoView({
                                behavior: "smooth",
                            })
                        }
                        className="group rounded-2xl border border-gray-200 bg-white p-6 text-left transition hover:border-emerald-300 hover:shadow-md"
                    >
                        <div className="flex items-center justify-between">
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-700">
                                <ChartNoAxesColumn size={21} strokeWidth={1.8} />
                            </span>

                            <ArrowRight size={20} className="text-gray-400 transition group-hover:translate-x-1" />
                        </div>

                        <h2 className="mt-5 text-lg font-bold">
                            View My Analysis
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-gray-500">
                            See your points, player performances, captaincy
                            decisions and missed opportunities.
                        </p>

                        <p className="mt-4 text-sm font-semibold text-emerald-800">
                            Explore analysis <ArrowRight size={15} className="ml-1 inline" />
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={generateAIInsights}
                        disabled={reportLoading}
                        className="group rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 text-left transition hover:border-emerald-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <div className="flex items-center justify-between">
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-xl text-emerald-800">
                                <Sparkles size={21} strokeWidth={1.8} />
                            </span>

                            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
                                AI Match Analyst
                            </span>
                        </div>

                        <h2 className="mt-5 text-lg font-bold">
                            {reportLoading
                                ? "Generating insights..."
                                : report
                                    ? "Regenerate AI Insights"
                                    : "Generate AI Insights"}
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-gray-600">
                            Discover what went wrong, which picks you missed
                            and how to improve your next team.
                        </p>

                        <p className="mt-4 text-sm font-semibold text-emerald-800">
                            {reportLoading ? "Please wait..." : <>Generate report <ArrowRight size={15} className="ml-1 inline" /></>}
                        </p>
                    </button>
                </section>

                {/* Main scorecards */}

                <section
                    id="match-analysis"
                    className="scroll-mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                    <StatCard
                        label="Your team score"
                        value={formatPoints(totalPoints)}
                        description="Including captain and vice-captain multipliers"
                        color="green"
                    />

                    <StatCard
                        label="Base points"
                        value={formatPoints(basePoints)}
                        description="Before captaincy multipliers"
                    />

                    <StatCard
                        label="Best possible XI"
                        value={
                            selection.best_possible_points != null
                                ? formatPoints(selection.best_possible_points)
                                : "—"
                        }
                        description="Under the selection constraints"
                        color="blue"
                    />

                    <StatCard
                        label="Points missed"
                        value={formatPoints(missedPoints)}
                        description="Gap from the best possible XI"
                        color="red"
                    />
                </section>

                {/* Team performance */}

                <section className="rounded-2xl border border-gray-200 bg-white p-6">
                    <SectionTitle
                        title="Where your points came from"
                        subtitle="Your team's contribution by department."
                        icon={<ChartNoAxesColumn size={19} strokeWidth={1.8} />}
                    />

                    <div className="grid gap-8 md:grid-cols-2">
                        <div className="space-y-5">
                            <PointsBar
                                label="Batting"
                                points={performance.batting_points}
                                total={totalPoints}
                            />

                            <PointsBar
                                label="Bowling"
                                points={performance.bowling_points}
                                total={totalPoints}
                            />

                            <PointsBar
                                label="Fielding"
                                points={performance.fielding_points}
                                total={totalPoints}
                            />

                            <PointsBar
                                label="Other"
                                points={performance.other_points}
                                total={totalPoints}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-emerald-50 p-4">
                                <p className="text-xs text-emerald-700">
                                    Strongest department
                                </p>

                                <p className="mt-2 text-lg font-bold capitalize text-emerald-900">
                                    {performance.strongest_department || "—"}
                                </p>
                            </div>

                            <div className="rounded-xl bg-rose-50 p-4">
                                <p className="text-xs text-rose-700">
                                    Weakest department
                                </p>

                                <p className="mt-2 text-lg font-bold capitalize text-rose-900">
                                    {performance.weakest_department || "—"}
                                </p>
                            </div>

                            <div className="col-span-2 rounded-xl bg-gray-50 p-4">
                                <p className="text-xs text-gray-500">
                                    Top player dependency
                                </p>

                                <p className="mt-1 text-2xl font-black">
                                    {performance.top_player_dependency != null
                                        ? `${Number(performance.top_player_dependency).toFixed(1)}%`
                                        : "—"}
                                </p>

                                <p className="mt-1 text-xs text-gray-400">
                                    Share of team points contributed by your
                                    highest-scoring player.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Player performance */}

                <section className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6">
                        <SectionTitle
                            title="Your best performers"
                            subtitle="Players who delivered the most points."
                            icon={<Trophy size={19} strokeWidth={1.8} />}
                        />

                        <div className="space-y-3">
                            {topPerformers.slice(0, 5).map((player, index) => (
                                <PlayerRow
                                    key={player.player_id || player.id || player.name || index}
                                    player={player}
                                    index={index}
                                />
                            ))}

                            {topPerformers.length === 0 && (
                                <p className="text-sm text-gray-400">
                                    No performer data available.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-6">
                        <SectionTitle
                            title="Picks that underperformed"
                            subtitle="Your lowest-scoring selected players."
                            icon={<AlertTriangle size={19} strokeWidth={1.8} />}
                        />

                        <div className="space-y-3">
                            {bottomPerformers.slice(0, 5).map((player, index) => (
                                <PlayerRow
                                    key={player.player_id || player.id || player.name || index}
                                    player={player}
                                    index={index}
                                    variant="red"
                                />
                            ))}

                            {bottomPerformers.length === 0 && (
                                <p className="text-sm text-gray-400">
                                    No performer data available.
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                {/* Captaincy */}

                <section className="rounded-2xl border border-gray-200 bg-white p-6">
                    <SectionTitle
                        title="Captaincy decisions"
                        subtitle="Did you multiply the right players?"
                        icon={<Crown size={19} strokeWidth={1.8} />}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl bg-gray-50 p-5">
                            <p className="text-xs text-gray-500">
                                Your captain
                            </p>

                            <h3 className="mt-2 text-xl font-bold">
                                {captaincy.current_captain || "—"}
                            </h3>

                            <p className="mt-1 text-xs text-gray-400">
                                {captaincy.current_captain_optimal === true
                                    ? "Correct captain choice"
                                    : ""}
                            </p>
                        </div>

                        <div className="rounded-xl bg-emerald-50 p-5">
                            <p className="text-xs text-emerald-700">
                                Best captain
                            </p>

                            <h3 className="mt-2 text-xl font-bold text-emerald-800">
                                {captaincy.best_captain || "—"}
                            </h3>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-5">
                            <p className="text-xs text-gray-500">
                                Your vice-captain
                            </p>

                            <h3 className="mt-2 text-xl font-bold">
                                {captaincy.current_vice_captain || "—"}
                            </h3>
                        </div>

                        <div className="rounded-xl bg-emerald-50 p-5">
                            <p className="text-xs text-emerald-700">
                                Best vice-captain
                            </p>

                            <h3 className="mt-2 text-xl font-bold text-emerald-800">
                                {captaincy.best_vice_captain || "—"}
                            </h3>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 p-5">
                        <div>
                            <p className="text-sm text-gray-600">
                                Points lost due to captaincy
                            </p>

                            <p className={`mt-1 text-2xl font-black ${
                                captaincyLost > 0
                                    ? "text-rose-700"
                                    : "text-emerald-700"
                            }`}>
                                {formatPoints(captaincyLost)} pts
                            </p>
                        </div>

                        <span className={`rounded-full px-3 py-2 text-xs font-semibold ${
                            captaincy.current_pair_optimal
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                        }`}>
                            {captaincy.current_pair_optimal
                                ? "Optimal pair"
                                : "Pair could be improved"}
                        </span>
                    </div>
                </section>

                {/* Missed opportunity */}

                {biggestMiss && (
                    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                        <p className="text-xs font-bold tracking-wider text-emerald-700">
                            BIGGEST MISSED OPPORTUNITY
                        </p>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">
                                    {biggestMiss.name}
                                </h2>

                                <p className="mt-1 text-sm text-gray-600">
                                    {biggestMiss.team}
                                    {biggestMiss.role && ` · ${biggestMiss.role}`}
                                </p>
                            </div>

                            <p className="text-3xl font-black text-emerald-700">
                                {formatPoints(biggestMiss.points)}
                                <span className="ml-1 text-sm">pts</span>
                            </p>
                        </div>

                        {biggestMiss.reason && (
                            <p className="mt-4 text-sm leading-6 text-gray-700">
                                {biggestMiss.reason}
                            </p>
                        )}

                        <div className="mt-4 grid grid-cols-3 gap-3">
                            <div className="rounded-lg bg-white p-3">
                                <p className="text-xs text-gray-400">Batting</p>
                                <p className="mt-1 font-bold">
                                    {formatPoints(biggestMiss.batting_points)}
                                </p>
                            </div>

                            <div className="rounded-lg bg-white p-3">
                                <p className="text-xs text-gray-400">Bowling</p>
                                <p className="mt-1 font-bold">
                                    {formatPoints(biggestMiss.bowling_points)}
                                </p>
                            </div>

                            <div className="rounded-lg bg-white p-3">
                                <p className="text-xs text-gray-400">Fielding</p>
                                <p className="mt-1 font-bold">
                                    {formatPoints(biggestMiss.fielding_points)}
                                </p>
                            </div>
                        </div>
                    </section>
                )}

                {/* Missed opportunities */}

                <section className="rounded-2xl border border-gray-200 bg-white p-6">
                    <SectionTitle
                        title="Players you missed"
                        subtitle="Unselected players included in the best possible XI."
                        icon={<Search size={19} strokeWidth={1.8} />}
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                        {opportunities.map((player, index) => (
                            <div
                                key={player.player_id || player.name || index}
                                className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-4"
                            >
                                <div className="min-w-0">
                                    <p className="truncate font-bold text-gray-900">
                                        {player.name}
                                    </p>

                                    <p className="mt-1 text-xs capitalize text-gray-400">
                                        {player.team}
                                        {player.category &&
                                            ` · ${player.category.replace(/_/g, " ")}`}
                                    </p>
                                </div>

                                <p className="shrink-0 font-black text-emerald-700">
                                    {formatPoints(player.points)} pts
                                </p>
                            </div>
                        ))}

                        {opportunities.length === 0 && (
                            <p className="text-sm text-gray-400">
                                No missed opportunities found.
                            </p>
                        )}
                    </div>
                </section>

                {/* Recommended replacements */}

                <section className="rounded-2xl border border-gray-200 bg-white p-6">
                    <SectionTitle
                        title="The swaps that could have helped"
                        subtitle="Compare your selection with better alternatives."
                        icon={<ArrowUpRight size={19} strokeWidth={1.8} />}
                    />

                    <div className="grid gap-3 md:grid-cols-2">
                        {replacements.map((replacement, index) => (
                            <div
                                key={`${replacement.out_player}-${replacement.in_player}-${index}`}
                                className="rounded-2xl border border-gray-100 p-4"
                            >
                                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                                    <div className="min-w-0 rounded-xl bg-rose-50 p-3">
                                        <p className="text-[10px] font-bold tracking-wider text-rose-600">
                                            YOUR PICK
                                        </p>

                                        <p className="mt-2 truncate text-sm font-bold text-gray-900">
                                            {replacement.out_player}
                                        </p>

                                        <p className="mt-1 text-sm text-gray-500">
                                            {formatPoints(replacement.out_points)} pts
                                        </p>
                                    </div>

                                    <ArrowRight size={19} className="text-gray-300" />

                                    <div className="min-w-0 rounded-xl bg-emerald-50 p-3">
                                        <p className="text-[10px] font-bold tracking-wider text-emerald-700">
                                            BETTER PICK
                                        </p>

                                        <p className="mt-2 truncate text-sm font-bold text-gray-900">
                                            {replacement.in_player}
                                        </p>

                                        <p className="mt-1 text-sm text-gray-500">
                                            {formatPoints(replacement.in_points)} pts
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                                    <p className="text-xs text-gray-400">
                                        Potential gain
                                    </p>

                                    <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-bold text-emerald-800">
                                        +{formatPoints(replacement.points_gained)} pts
                                    </span>
                                </div>
                            </div>
                        ))}

                        {replacements.length === 0 && (
                            <p className="text-sm text-gray-400">
                                No replacement comparisons available.
                            </p>
                        )}
                    </div>
                </section>

                {/* Selected XI */}

                <section className="rounded-2xl border border-gray-200 bg-white p-6">
                    <SectionTitle
                        title="Your selected XI"
                        subtitle="Your actual selected players and their final fantasy points."
                        icon={<Activity size={19} strokeWidth={1.8} />}
                    />

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {selectedPlayers
                            .slice()
                            .sort((a, b) => getPlayerPoints(b) - getPlayerPoints(a))
                            .map((player, index) => (
                                <div
                                    key={player.player_id || player.name || index}
                                    className="rounded-xl border border-gray-100 p-4"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="truncate font-bold text-gray-900">
                                                {player.name}
                                            </p>

                                            <p className="mt-1 text-xs capitalize text-gray-400">
                                                {player.team} · {player.role}
                                            </p>
                                        </div>

                                        {(player.is_captain || player.is_vice_captain) && (
                                            <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
                                                {player.is_captain ? "C" : "VC"}
                                            </span>
                                        )}
                                    </div>

                                    <p className="mt-4 text-xl font-black text-emerald-700">
                                        {formatPoints(
                                            player.final_points ??
                                            player.points ??
                                            getBreakdown(player).total_points
                                        )}
                                        <span className="ml-1 text-xs font-medium text-gray-400">
                                            pts
                                        </span>
                                    </p>

                                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-gray-500">
                                        <span>
                                            Bat {formatPoints(getBreakdown(player).batting_points)}
                                        </span>
                                        <span>
                                            Bowl {formatPoints(getBreakdown(player).bowling_points)}
                                        </span>
                                        <span>
                                            Field {formatPoints(getBreakdown(player).fielding_points)}
                                        </span>
                                    </div>
                                </div>
                            ))}

                        {selectedPlayers.length === 0 && (
                            <p className="text-sm text-gray-400">
                                No selected player data available.
                            </p>
                        )}
                    </div>
                </section>

                {/* Compact AI insights */}

                <section
                    id="ai-insights"
                    className="scroll-mt-8 space-y-4"
                >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                                AI Match Analyst
                            </p>
                            <h2 className="mt-1 text-xl font-black tracking-tight text-gray-900">
                                Match insights
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                The key decisions behind your result.
                            </p>
                        </div>

                        {autopsy.is_demo && (
                            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                                Demo match · Synthetic data
                            </span>
                        )}

                        <button
                            type="button"
                            onClick={generateAIInsights}
                            disabled={reportLoading}
                            className="rounded-xl bg-[#173d32] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#245443] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {reportLoading
                                ? "Analysing..."
                                : report
                                    ? "Refresh insights"
                                    : "Generate insights"}
                        </button>
                    </div>

                    {reportLoading && (
                        <div className="rounded-2xl border border-gray-200 bg-white p-6">
                            <div className="flex items-center gap-3">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />
                                <p className="text-sm font-medium text-gray-600">
                                    Gemini is analysing your match...
                                </p>
                            </div>
                        </div>
                    )}

                    {reportError && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                            <p className="text-sm font-medium text-rose-800">
                                {reportError}
                            </p>
                            <button
                                type="button"
                                onClick={generateAIInsights}
                                className="mt-1 text-xs font-bold text-rose-800 underline"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {!report && !reportLoading && !reportError && (
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-7 text-center">
                            <p className="text-sm text-gray-600">
                                Get a concise breakdown of your selection and captaincy decisions.
                            </p>
                            <button
                                type="button"
                                onClick={generateAIInsights}
                                className="mt-3 text-sm font-bold text-emerald-800 hover:text-emerald-950"
                            >
                                Generate match insights <ArrowRight size={15} className="ml-1 inline" />
                            </button>
                        </div>
                    )}

                    {report && !reportLoading && (
                        <>
                            {/*
                              Selection comparison graph.
                              Uses backend values rather than numbers invented by the AI.
                            */}
                            <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
                                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-sm font-bold text-gray-900">
                                            Selection gap
                                        </h3>
                                        <span className="text-xs text-gray-400">
                                            Base points · XI comparison
                                        </span>
                                    </div>

                                    {(() => {
                                        const selectedScore = Math.max(0, basePoints);
                                        const bestScore = Math.max(
                                            0,
                                            Number(selection.best_possible_points ?? 0)
                                        );
                                        const maxScore = Math.max(selectedScore, bestScore, 1);
                                        const selectedWidth = (selectedScore / maxScore) * 100;
                                        const bestWidth = (bestScore / maxScore) * 100;

                                        return (
                                            <div className="mt-5 space-y-4">
                                                <div>
                                                    <div className="mb-1.5 flex items-center justify-between text-xs">
                                                        <span className="font-medium text-gray-600">
                                                            Your selected XI
                                                        </span>
                                                        <span className="font-bold text-gray-900">
                                                            {formatPoints(selectedScore)}
                                                        </span>
                                                    </div>
                                                    <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                                                        <div
                                                            className="h-full rounded-full bg-slate-500"
                                                            style={{ width: `${selectedWidth}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="mb-1.5 flex items-center justify-between text-xs">
                                                        <span className="font-medium text-gray-600">
                                                            Best possible XI
                                                        </span>
                                                        <span className="font-bold text-emerald-800">
                                                            {bestScore > 0 ? formatPoints(bestScore) : "—"}
                                                        </span>
                                                    </div>
                                                    <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                                                        <div
                                                            className="h-full rounded-full bg-emerald-600"
                                                            style={{ width: `${bestWidth}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
                                                    <span className="text-xs text-gray-500">
                                                        Potential points left on the table
                                                    </span>
                                                    <span className="text-lg font-black text-rose-700">
                                                        {formatPoints(missedPoints)} pts
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                                        <p className="text-xs text-gray-500">
                                            Your final score
                                        </p>
                                        <p className="mt-2 text-2xl font-black text-emerald-800">
                                            {formatPoints(totalPoints)}
                                        </p>
                                        <p className="mt-1 text-[11px] text-gray-400">
                                            With C/VC multipliers
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                                        <p className="text-xs text-gray-500">
                                            Captaincy points lost
                                        </p>
                                        <p className={`mt-2 text-2xl font-black ${
                                            captaincyLost > 0 ? "text-rose-700" : "text-emerald-800"
                                        }`}>
                                            {formatPoints(captaincyLost)}
                                        </p>
                                        <p className="mt-1 text-[11px] text-gray-400">
                                            From multiplier choices
                                        </p>
                                    </div>

                                    <div className="col-span-2 rounded-2xl border border-gray-200 bg-white p-4">
                                        <p className="text-xs font-semibold text-gray-500">
                                            Match takeaway
                                        </p>
                                        <p className="mt-2 text-sm leading-6 text-gray-700">
                                            {overviewSentences[0] ||
                                                "Review the selection gap and missed-player analysis to see where points were lost."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Two short decision cards */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-2xl border border-rose-100 bg-white p-5">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-gray-900">
                                            Biggest missed pick
                                        </h3>
                                        <ArrowUpRight size={19} className="text-rose-600" />
                                    </div>

                                    {(() => {
                                        const missed = biggestMiss || opportunities[0];
                                        return missed ? (
                                            <div className="mt-3 flex items-end justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-base font-bold text-gray-900">
                                                        {missed.name || "Unselected player"}
                                                    </p>
                                                    <p className="mt-1 text-xs capitalize text-gray-500">
                                                        {missed.role || missed.category?.replace(/_/g, " ") || "Missed opportunity"}
                                                    </p>
                                                </div>
                                                <p className="shrink-0 text-xl font-black text-emerald-700">
                                                    {formatPoints(missed.points)} pts
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="mt-3 text-sm text-gray-500">
                                                No missed-pick data was returned.
                                            </p>
                                        );
                                    })()}

                                    {selectionSentences[0] && (
                                        <p className="mt-3 border-t border-gray-100 pt-3 text-xs leading-5 text-gray-600">
                                            {selectionSentences[0]}
                                        </p>
                                    )}
                                </div>

                                <div className="rounded-2xl border border-amber-100 bg-white p-5">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-gray-900">
                                            Captaincy check
                                        </h3>
                                        <Crown size={19} className="text-amber-600" />
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-[11px] text-gray-400">Your captain</p>
                                            <p className="mt-1 truncate text-sm font-bold text-gray-900">
                                                {captaincy.current_captain || "—"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-gray-400">Best captain</p>
                                            <p className="mt-1 truncate text-sm font-bold text-emerald-800">
                                                {captaincy.best_captain || "—"}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="mt-3 border-t border-gray-100 pt-3 text-xs leading-5 text-gray-600">
                                        {captaincySentences[0] ||
                                            (captaincyLost > 0
                                                ? `Your captaincy decisions left ${formatPoints(captaincyLost)} points unused.`
                                                : "Your captaincy pair was optimal for this match.")}
                                    </p>
                                </div>
                            </div>

                            {/* Short next-match note */}
                            <div className="rounded-2xl bg-[#173d32] p-5 text-white">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-sm font-bold">
                                        One thing to take into your next match
                                    </h3>
                                    <Activity size={19} className="text-emerald-300" />
                                </div>
                                <p className="mt-2 text-sm leading-6 text-emerald-50">
                                    {tips[0] ||
                                        extractSentences(verdict, 1)[0] ||
                                        selectionSentences[1] ||
                                        "Compare player roles and recent contributions before locking your XI, then evaluate captaincy separately."}
                                </p>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={generateAIInsights}
                                    disabled={reportLoading}
                                    className="text-xs font-semibold text-gray-500 underline hover:text-gray-800 disabled:opacity-50"
                                >
                                    Regenerate insights
                                </button>
                            </div>
                        </>
                    )}
                </section>

                <footer className="pb-8 text-center text-xs text-gray-400">
                    DreamEdge · Don't just play fantasy. Understand the game.
                </footer>
            </main>
        </div>
    );
}