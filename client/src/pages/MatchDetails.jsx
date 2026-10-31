
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Users,
    MapPin,
    CalendarDays,
    Trophy,
    ArrowRight,
    Award,
    Flag
} from "lucide-react";

import { getMatchById } from "../services/matchService";
import { getPlayersByMatchID } from "../services/playerService";
import { getPlayerStatsByMatchID } from "../services/playerStatsService";
import { getFantasyTeamsByMatchID } from "../services/fantasyTeamService";

function MatchDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [match, setMatch] = useState(null);
    const [players, setPlayers] = useState([]);
    const [stats, setStats] = useState([]);
    const [fantasyTeam, setFantasyTeam] = useState(null);

    const [activeTeam, setActiveTeam] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchMatchDetails = async () => {
            try {
                setLoading(true);
                setError("");

                const matchData = await getMatchById(id);

                setMatch(matchData);
                setActiveTeam(matchData.team1);

                const [playerData, statsData, teamsData] = await Promise.all([
                    getPlayersByMatchID(id),
                    getPlayerStatsByMatchID(id),
                    getFantasyTeamsByMatchID(id)
                ]);

                setPlayers(playerData);
                setStats(statsData);
                setFantasyTeam(
                    teamsData.length > 0 ? teamsData[0] : null
                );
            } catch (err) {
                console.error(err);
                setError("Unable to load match details.");
            } finally {
                setLoading(false);
            }
        };

        fetchMatchDetails();
    }, [id]);

    const getPlayerStats = (playerID) => {
        return stats.find(item => item.player_id === playerID);
    };

    const displayStat = (value) => {
        return value === undefined || value === null ? "—" : value;
    };

    const formatDate = (date) => {
        if (!date) return "Date unavailable";

        const parsedDate = new Date(date);

        if (
            Number.isNaN(parsedDate.getTime()) ||
            parsedDate.getFullYear() < 2000
        ) {
            return "Date unavailable";
        }

        return parsedDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    };

    const team1Players = players.filter(
        player => player.team === match?.team1
    );

    const team2Players = players.filter(
        player => player.team === match?.team2
    );

    const activeTeamPlayers = players.filter(
        player => player.team === activeTeam
    );

    
const renderResult = () => {
    const result = match?.result;

    if (match?.status !== "completed" || !result) return null;

    // country flags
    const getFlag = (team) => {
        const flags = {
            "South Africa": "🇿🇦",
            "New Zealand": "🇳🇿",
            "India": "🇮🇳",
            "Australia": "🇦🇺",
            "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
            "West Indies": "🏝️",
            "Pakistan": "🇵🇰",
            "Sri Lanka": "🇱🇰",
            "Bangladesh": "🇧🇩",
            "Afghanistan": "🇦🇫"
        };

        return flags[team] || "🏏";
    };

    // hide /10 when the team is all out
    const formatScore = (score) => {
        if (!score) return "—";

        const [runs, wickets] = String(score).split("/");

        return Number(wickets) === 10 ? runs : score;
    };

    // format match date
    const getDateLabel = (date) => {
        if (!date) return "";

        const parsedDate = new Date(date);

        if (
            Number.isNaN(parsedDate.getTime()) ||
            parsedDate.getFullYear() < 2000
        ) {
            return "";
        }

        return parsedDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short"
        });
    };

    return (
        <div className="mt-7 bg-[#202020] text-white rounded-xl px-5 py-7 md:px-10 md:py-8">

            {/* match date */}
            <p className="text-lg md:text-2xl text-gray-400 mb-8">
                {getDateLabel(match.date)}
            </p>

            {/* scorecard */}
            <div className="w-full flex justify-center">
                <div className="grid grid-cols-[auto_auto_auto_auto] items-center justify-center gap-x-3 sm:gap-x-5 md:gap-x-8 lg:gap-x-12">

                    {/* team 1 flag and name */}
                    <div className="flex flex-col items-center text-center">
                        <span className="text-4xl md:text-6xl leading-none">
                            {getFlag(match.team1)}
                        </span>

                        <p className="text-base md:text-3xl font-medium mt-5 whitespace-nowrap">
                            {match.team1}
                        </p>
                    </div>

                    {/* team 1 score */}
                    <div className="text-center whitespace-nowrap">
                        <p className="text-xl md:text-3xl font-semibold">
                            {formatScore(result.team1_score)}
                        </p>

                        <p className="text-sm md:text-xl text-gray-400 mt-1">
                            ({result.team1_overs || "—"})
                        </p>
                    </div>

                    {/* team 2 score */}
                    <div className="text-center whitespace-nowrap">
                        <p className="text-xl md:text-3xl font-semibold">
                            {formatScore(result.team2_score)}
                        </p>

                        <p className="text-sm md:text-xl text-gray-400 mt-1">
                            ({result.team2_overs || "—"})
                        </p>
                    </div>

                    {/* team 2 flag and name */}
                    <div className="flex flex-col items-center text-center">
                        <span className="text-4xl md:text-6xl leading-none">
                            {getFlag(match.team2)}
                        </span>

                        <p className="text-base md:text-3xl font-medium mt-5 whitespace-nowrap">
                            {match.team2}
                        </p>
                    </div>

                </div>
            </div>

            {/* match result */}
            <div className="text-center mt-7">
                <p className="text-lg md:text-2xl font-semibold">
                    {result.winner} won by {result.margin}
                </p>

                {result.player_of_match && (
                    <p className="text-sm md:text-lg text-gray-400 mt-3">
                        Player of the Match: {result.player_of_match}
                    </p>
                )}
            </div>

            {/* demo data indicator */}
            {result.is_demo && (
                <p className="text-xs text-gray-500 text-center mt-4">
                    Illustrative demo data
                </p>
            )}

        </div>
    );
};


    const renderPlayers = (teamPlayers) => {
        if (!teamPlayers.length) {
            return (
                <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
                    <p className="text-sm text-gray-500">
                        No players available for this team.
                    </p>
                </div>
            );
        }

        return (
            <div className="grid md:grid-cols-2 gap-4">
                {teamPlayers.map(player => {
                    const playerStats = getPlayerStats(player.id);

                    return (
                        <div
                            key={player.id}
                            className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-[#b9cbbd] transition"
                        >
                            {/* player information */}
                            <div className="flex justify-between items-start gap-3">
                                <div>
                                    <h3 className="font-semibold text-[#263b30]">
                                        {player.name}
                                    </h3>

                                    <p className="text-sm text-gray-500 mt-1">
                                        {player.role}
                                    </p>
                                </div>

                                <span className="bg-[#e9eee8] text-[#315b45] rounded-full px-3 py-1 text-xs">
                                    {player.team}
                                </span>
                            </div>

                            {match.status === "upcoming" ? (
                                <div className="mt-5 bg-[#f7f7f2] rounded-xl p-4">
                                    <p className="text-sm text-gray-600">
                                        Match hasn't started yet.
                                    </p>

                                    <p className="text-xs text-gray-400 mt-1">
                                        Player statistics will appear once the match begins.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* main statistics */}
                                    <div className="grid grid-cols-3 gap-2 mt-5">
                                        <div className="bg-[#f7f7f2] rounded-xl p-3">
                                            <p className="text-xs text-gray-500">
                                                Runs
                                            </p>

                                            <p className="text-xl font-semibold text-[#263b30]">
                                                {displayStat(playerStats?.runs)}
                                            </p>
                                        </div>

                                        <div className="bg-[#f7f7f2] rounded-xl p-3">
                                            <p className="text-xs text-gray-500">
                                                Wickets
                                            </p>

                                            <p className="text-xl font-semibold text-[#263b30]">
                                                {displayStat(playerStats?.wickets)}
                                            </p>
                                        </div>

                                        <div className="bg-[#f7f7f2] rounded-xl p-3">
                                            <p className="text-xs text-gray-500">
                                                Fantasy pts
                                            </p>

                                            <p className="text-xl font-semibold text-[#315b45]">
                                                {displayStat(playerStats?.fantasy_points)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* batting statistics */}
                                    <div className="grid grid-cols-3 gap-2 mt-4">
                                        <div>
                                            <p className="text-xs text-gray-400">
                                                4s
                                            </p>
                                            <p className="text-sm font-medium text-gray-600">
                                                {displayStat(playerStats?.fours)}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-400">
                                                6s
                                            </p>
                                            <p className="text-sm font-medium text-gray-600">
                                                {displayStat(playerStats?.sixes)}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-400">
                                                Strike Rate
                                            </p>
                                            <p className="text-sm font-medium text-gray-600">
                                                {playerStats?.strike_rate != null
    ? Number(playerStats.strike_rate).toFixed(2)
    : "—"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* bowling statistics */}
                                    <div className="grid grid-cols-3 gap-2 mt-4 border-t border-gray-100 pt-4">
                                        <div>
                                            <p className="text-xs text-gray-400">
                                                Overs
                                            </p>
                                            <p className="text-sm font-medium text-gray-600">
                                                {displayStat(playerStats?.overs)}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-400">
                                                Wickets
                                            </p>
                                            <p className="text-sm font-medium text-gray-600">
                                                {displayStat(playerStats?.wickets)}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-400">
                                                Economy
                                            </p>
                                            <p className="text-sm font-medium text-gray-600">
                                                {displayStat(playerStats?.economy)}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f7f7f2]">
                <p className="text-[#315b45]">
                    Loading match details...
                </p>
            </div>
        );
    }

    if (error || !match) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f7f2] gap-4">
                <p className="text-red-600">
                    {error || "Match not found."}
                </p>

                <button
                    onClick={() => navigate("/")}
                    className="text-[#315b45] underline"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f7f7f2] px-5 py-8 md:px-12">
            <div className="max-w-6xl mx-auto">

                {/* back button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#315b45] mb-7"
                >
                    <ArrowLeft size={17} />
                    Back
                </button>

                {/* match header */}
                <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-9">
                    <div className="flex flex-col md:flex-row justify-between gap-5">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-[#718475] uppercase tracking-widest">
                                <Trophy size={15} />
                                {match.format}
                            </div>

                            <h1 className="text-3xl md:text-4xl font-semibold text-[#263b30] mt-3">
                                {match.team1} vs {match.team2}
                            </h1>

                            <div className="flex flex-wrap gap-4 mt-5 text-sm text-gray-500">
                                <span className="flex items-center gap-2">
                                    <MapPin size={16} />
                                    {match.venue || "Venue unavailable"}
                                </span>

                                <span className="flex items-center gap-2">
                                    <CalendarDays size={16} />
                                    {formatDate(match.date)}
                                </span>
                            </div>
                        </div>

                        <div className="self-start bg-[#e9eee8] text-[#315b45] px-4 py-2 rounded-full text-sm font-medium capitalize">
                            {match.status}
                        </div>
                    </div>

                   
<div className="border-t border-gray-100 mt-7 pt-6 flex flex-wrap items-center justify-between gap-4">
    <div className="flex items-center gap-2 text-gray-500 text-sm">
        <Users size={18} />
        {players.length} players available
    </div>

    <div className="flex flex-wrap items-center gap-3">
        {fantasyTeam ? (
            <>
                <button
                    onClick={() => navigate(`/matches/${id}/my-team`)}
                    className="flex items-center gap-2 border border-[#315b45] text-[#315b45] px-5 py-3 rounded-xl hover:bg-[#e9eee8] transition"
                >
                    View My Fantasy Team
                    <ArrowRight size={17} />
                </button>

                {match.status === "completed" && (
                    <button
                        onClick={() => navigate(`/teams/${fantasyTeam.id}/autopsy`)}
                        className="flex items-center gap-2 bg-[#315b45] text-white px-5 py-3 rounded-xl hover:bg-[#264936] transition"
                    >
                        <Award size={17} />
                        View Your Analysis
                        <ArrowRight size={17} />
                    </button>
                )}
            </>
        ) : (
            <button
                onClick={() => navigate(`/matches/${id}/create-team`)}
                className="flex items-center gap-2 bg-[#315b45] text-white px-5 py-3 rounded-xl hover:bg-[#264936] transition"
            >
                Create Fantasy Team
                <ArrowRight size={17} />
            </button>
        )}
    </div>
</div>

                </div>

                {/* match result */}
                {renderResult()}

                {/* team-wise scorecard */}
                <div className="mt-9">

                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-sm text-[#718475] uppercase tracking-widest">
                                Match Centre
                            </p>

                            <h2 className="text-2xl font-semibold text-[#263b30] mt-1">
                                Scorecard
                            </h2>
                        </div>

                        <span className="text-sm text-gray-500">
                            {players.length} players
                        </span>
                    </div>

                    {/* team tabs */}
                    <div className="grid grid-cols-2 bg-[#e9eee8] rounded-2xl p-1.5 mb-6">
                        {[match.team1, match.team2].map(team => {
                            const isActive = activeTeam === team;

                            return (
                                <button
                                    key={team}
                                    onClick={() => setActiveTeam(team)}
                                    className={`py-4 px-3 rounded-xl text-sm md:text-base font-semibold transition ${
                                        isActive
                                            ? "bg-white text-[#315b45] shadow-sm"
                                            : "text-gray-500 hover:text-[#315b45]"
                                    }`}
                                >
                                    {team}

                                    <span className="ml-2 text-xs opacity-70">
                                        (
                                        {players.filter(
                                            player => player.team === team
                                        ).length}
                                        )
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* selected team's players */}
                    {renderPlayers(activeTeamPlayers)}

                </div>

                {match.status !== "upcoming" && (
                    <p className="text-xs text-gray-400 mt-5">
                        Player statistics and fantasy points are illustrative demo data.
                    </p>
                )}
            </div>
        </div>
    );
}

export default MatchDetails;
