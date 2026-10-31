
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

function StatCard({ label, value, description, accent = "text-gray-900" }) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`mt-2 text-3xl font-bold ${accent}`}>
                {value ?? "—"}
            </p>
            {description && (
                <p className="mt-1 text-xs text-gray-400">{description}</p>
            )}
        </div>
    );
}

function SectionTitle({ title, subtitle }) {
    return (
        <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            {subtitle && (
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
        </div>
    );
}

function PointsBar({ label, points, total }) {
    const percentage = total > 0 ? Math.max(0, (points / total) * 100) : 0;

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">{label}</span>
                <span className="font-semibold text-gray-900">{points}</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
        </div>
    );
}

function FantasyAutopsy() {
    const { id } = useParams();

    const [autopsy, setAutopsy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchAutopsy() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(`${API_URL}/teams/${id}/autopsy`);

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Unable to load match autopsy.");
                }

                setAutopsy(data.autopsy);
            } catch (err) {
                setError(err.message || "Something went wrong.");
            } finally {
                setLoading(false);
            }
        }

        fetchAutopsy();
    }, [id]);

    if (loading) {
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

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f7f8f5] px-5">
                <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center">
                    <h2 className="text-xl font-bold text-gray-900">
                        Couldn't load the autopsy
                    </h2>
                    <p className="mt-2 text-sm text-red-600">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-5 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    if (!autopsy) return null;

    const performance = autopsy.performance || {};
    const captaincy = autopsy.captaincy || {};
    const selection = autopsy.selection || {};

    const totalPoints =
        autopsy.total_points ?? performance.total_points ?? 0;

    const missedPoints = selection.points_missed ?? 0;

    const replacements = selection.replacements || [];
    const opportunities = selection.missed_opportunities || [];
    const selectedPlayers = selection.selected_players || [];
    const topPerformers = performance.top_performers || [];
    const bottomPerformers = performance.bottom_performers || [];

    const match = autopsy.match || {};

    return (
        <div className="min-h-screen bg-[#f7f8f5] text-gray-900">
            {/* Header */}
            <header className="border-b border-gray-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
                    <div>
                        <p className="text-xl font-black tracking-tight text-emerald-800">
                            DreamEdge<span className="text-emerald-500">.</span>
                        </p>
                        <p className="text-xs text-gray-400">
                            Fantasy intelligence
                        </p>
                    </div>

                    <a
                        href="/"
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                        Dashboard
                    </a>
                </div>
            </header>

            <main className="mx-auto max-w-7xl space-y-8 px-5 py-8 lg:px-8">
                {/* Match heading */}
                <section>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                            MATCH AUTOPSY
                        </span>

                        {autopsy.is_demo && (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                                DEMO DATA
                            </span>
                        )}
                    </div>

                    <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
                        Understand your performance.
                    </h1>

                    <p className="mt-2 text-gray-500">
                        {match.team1 || "Team 1"} vs {match.team2 || "Team 2"}
                        {match.format && ` · ${match.format}`}
                    </p>
                </section>

                {/* Main score */}
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Your team score"
                        value={totalPoints}
                        description="Including captain and vice-captain multipliers"
                        accent="text-emerald-700"
                    />

                    <StatCard
                        label="Base points"
                        value={autopsy.base_points}
                        description="Before captaincy multipliers"
                    />

                    <StatCard
                        label="Best possible XI"
                        value={selection.best_possible_points}
                        description="Under the current selection constraints"
                    />

                    <StatCard
                        label="Points missed"
                        value={missedPoints}
                        description="Difference from the best possible XI"
                        accent="text-red-600"
                    />
                </section>

                {/* Performance */}
                <section className="rounded-2xl border border-gray-200 bg-white p-6">
                    <SectionTitle
                        title="Team performance"
                        subtitle="Where your fantasy points came from."
                    />

                    <div className="grid gap-8 md:grid-cols-2">
                        <div className="space-y-5">
                            <PointsBar
                                label="Batting"
                                points={performance.batting_points || 0}
                                total={totalPoints}
                            />
                            <PointsBar
                                label="Bowling"
                                points={performance.bowling_points || 0}
                                total={totalPoints}
                            />
                            <PointsBar
                                label="Fielding"
                                points={performance.fielding_points || 0}
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

                            <div className="rounded-xl bg-red-50 p-4">
                                <p className="text-xs text-red-700">
                                    Weakest department
                                </p>
                                <p className="mt-2 text-lg font-bold capitalize text-red-900">
                                    {performance.weakest_department || "—"}
                                </p>
                            </div>

                            <div className="col-span-2 rounded-xl bg-gray-50 p-4">
                                <p className="text-xs text-gray-500">
                                    Top player dependency
                                </p>
                                <p className="mt-1 text-2xl font-bold">
                                    {Number(
                                        performance.top_player_dependency || 0
                                    ).toFixed(1)}%
                                </p>
                                <p className="mt-1 text-xs text-gray-400">
                                    Share of team points contributed by your
                                    highest-scoring player.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Top and bottom performers */}
                <section className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6">
                        <SectionTitle
                            title="Top performers"
                            subtitle="Your highest-scoring players."
                        />

                        <div className="space-y-4">
                            {topPerformers.map((player, index) => (
                                <div
                                    key={player.id || player.name}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
                                            {index + 1}
                                        </span>
                                        <span className="font-semibold">
                                            {player.name}
                                        </span>
                                    </div>

                                    <span className="font-bold text-emerald-700">
                                        {player.points} pts
                                    </span>
                                </div>
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
                            title="Lowest performers"
                            subtitle="Players who contributed the fewest points."
                        />

                        <div className="space-y-4">
                            {bottomPerformers.map((player, index) => (
                                <div
                                    key={player.id || player.name}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-sm font-bold text-red-600">
                                            {index + 1}
                                        </span>
                                        <span className="font-semibold">
                                            {player.name}
                                        </span>
                                    </div>

                                    <span className="font-bold text-red-600">
                                        {player.points} pts
                                    </span>
                                </div>
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
                        title="Captaincy analysis"
                        subtitle="Did your captain and vice-captain choices work?"
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl bg-gray-50 p-5">
                            <p className="text-xs text-gray-500">
                                Your captain
                            </p>
                            <h3 className="mt-2 text-xl font-bold">
                                {captaincy.current_captain || "—"}
                            </h3>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-5">
                            <p className="text-xs text-gray-500">
                                Best captain
                            </p>
                            <h3 className="mt-2 text-xl font-bold text-emerald-700">
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

                        <div className="rounded-xl bg-gray-50 p-5">
                            <p className="text-xs text-gray-500">
                                Best vice-captain
                            </p>
                            <h3 className="mt-2 text-xl font-bold text-emerald-700">
                                {captaincy.best_vice_captain || "—"}
                            </h3>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-5">
                        <div>
                            <p className="text-sm text-red-700">
                                Points lost due to captaincy choices
                            </p>
                            <p className="mt-1 text-2xl font-black text-red-700">
                                {captaincy.points_lost ?? 0} pts
                            </p>
                        </div>

                        <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-red-700">
                            {captaincy.current_pair_optimal
                                ? "Optimal captaincy"
                                : "Suboptimal captaincy"}
                        </span>
                    </div>
                </section>

                {/* Biggest missed opportunity */}
                {selection.biggest_missed_opportunity && (
                    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                        <p className="text-xs font-bold tracking-wider text-emerald-700">
                            BIGGEST MISSED OPPORTUNITY
                        </p>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">
                                    {selection.biggest_missed_opportunity.name}
                                </h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    {selection.biggest_missed_opportunity.team}
                                    {" · "}
                                    {selection.biggest_missed_opportunity.role}
                                </p>
                            </div>

                            <p className="text-3xl font-black text-emerald-700">
                                {selection.biggest_missed_opportunity.points} pts
                            </p>
                        </div>

                        <p className="mt-4 text-sm text-gray-700">
                            {selection.biggest_missed_opportunity.reason}
                        </p>

                        <div className="mt-4 grid grid-cols-3 gap-3">
                            <div className="rounded-lg bg-white p-3">
                                <p className="text-xs text-gray-400">Batting</p>
                                <p className="mt-1 font-bold">
                                    {selection.biggest_missed_opportunity.batting_points}
                                </p>
                            </div>

                            <div className="rounded-lg bg-white p-3">
                                <p className="text-xs text-gray-400">Bowling</p>
                                <p className="mt-1 font-bold">
                                    {selection.biggest_missed_opportunity.bowling_points}
                                </p>
                            </div>

                            <div className="rounded-lg bg-white p-3">
                                <p className="text-xs text-gray-400">Fielding</p>
                                <p className="mt-1 font-bold">
                                    {selection.biggest_missed_opportunity.fielding_points}
                                </p>
                            </div>
                        </div>
                    </section>
                )}

                {/* Missed opportunities */}
                <section className="rounded-2xl border border-gray-200 bg-white p-6">
                    <SectionTitle
                        title="Missed opportunities"
                        subtitle="The five highest-scoring unselected players."
                    />

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[550px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 text-xs text-gray-400">
                                    <th className="pb-3">PLAYER</th>
                                    <th className="pb-3">TEAM</th>
                                    <th className="pb-3">CATEGORY</th>
                                    <th className="pb-3 text-right">POINTS</th>
                                </tr>
                            </thead>

                            <tbody>
                                {opportunities.map((player) => (
                                    <tr
                                        key={player.player_id}
                                        className="border-b border-gray-50 last:border-0"
                                    >
                                        <td className="py-4 font-semibold">
                                            {player.name}
                                        </td>
                                        <td className="py-4 text-gray-500">
                                            {player.team}
                                        </td>
                                        <td className="py-4">
                                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs capitalize text-gray-600">
                                                {player.category?.replace(
                                                    "_",
                                                    " "
                                                )}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right font-bold text-emerald-700">
                                            {player.points}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {opportunities.length === 0 && (
                            <p className="py-6 text-center text-sm text-gray-400">
                                No missed opportunities found.
                            </p>
                        )}
                    </div>
                </section>

                
{/* Better selection choices */}
<section className="rounded-2xl border border-gray-200 bg-white p-6">
    <SectionTitle
        title="Better selection choices"
        subtitle="See who you picked versus who could have earned you more points."
    />

    <div className="space-y-4">
        {replacements.map((replacement, index) => (
            <div
                key={`${replacement.out_player}-${replacement.in_player}`}
                className="rounded-2xl border border-gray-100 p-4 md:p-5"
            >
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-5">

                    {/* Your choice */}
                    <div className="min-w-0 rounded-xl bg-gray-50 p-3 md:p-4">
                        <p className="text-[10px] font-bold tracking-wider text-gray-400 md:text-xs">
                            YOUR CHOICE
                        </p>

                        <h3 className="mt-2 truncate text-sm font-bold text-gray-800 md:text-base">
                            {replacement.out_player}
                        </h3>

                        <p className="mt-1 text-lg font-bold text-gray-500 md:text-xl">
                            {replacement.out_points}
                            <span className="ml-1 text-xs font-normal">pts</span>
                        </p>
                    </div>

                    {/* Arrow */}
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-xl text-gray-400 md:text-2xl">
                            →
                        </span>
                    </div>

                    {/* Better choice */}
                    <div className="min-w-0 rounded-xl border border-emerald-100 bg-emerald-50 p-3 md:p-4">
                        <p className="text-[10px] font-bold tracking-wider text-emerald-700 md:text-xs">
                            BETTER CHOICE
                        </p>

                        <h3 className="mt-2 truncate text-sm font-bold text-emerald-900 md:text-base">
                            {replacement.in_player}
                        </h3>

                        <p className="mt-1 text-lg font-bold text-emerald-700 md:text-xl">
                            {replacement.in_points}
                            <span className="ml-1 text-xs font-normal">pts</span>
                        </p>
                    </div>
                </div>

                {/* Points difference */}
                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-400">
                        Potential points gained
                    </p>

                    <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-bold text-emerald-800">
                        +{replacement.points_gained} pts
                    </span>
                </div>
            </div>
        ))}

        {replacements.length === 0 && (
            <p className="text-sm text-gray-400">
                No better replacements found.
            </p>
        )}
    </div>
</section>


                {/* Selected XI */}
                <section className="rounded-2xl border border-gray-200 bg-white p-6">
                    <SectionTitle
                        title="Your selected XI"
                        subtitle="Individual fantasy points before captaincy multipliers."
                    />

                    <div className="space-y-3">
                        {selectedPlayers
                            .slice()
                            .sort((a, b) => b.points - a.points)
                            .map((player) => (
                                <div
                                    key={player.player_id}
                                    className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
                                >
                                    <div>
                                        <p className="font-semibold">
                                            {player.name}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {player.team} · {player.role}
                                        </p>
                                    </div>

                                    <p className="font-bold">
                                        {player.points} pts
                                    </p>
                                </div>
                            ))}
                    </div>
                </section>

                <footer className="pb-8 text-center text-xs text-gray-400">
                    DreamEdge · Don't just play fantasy. Understand the game.
                </footer>
            </main>
        </div>
    );
}

export default FantasyAutopsy;
