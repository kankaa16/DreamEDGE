
import {useEffect,useState} from "react";
import {useParams,useNavigate} from "react-router-dom";
import {
    ArrowLeft,
    Users,
    MapPin,
    CalendarDays,
    Trophy,
    ArrowRight
} from "lucide-react";

import {getMatchById} from "../services/matchService";
import {getPlayersByMatchID} from "../services/playerService";
import {getPlayerStatsByMatchID} from "../services/playerStatsService";
import {getFantasyTeamsByMatchID} from "../services/fantasyTeamService";

function MatchDetails(){

    const {id}=useParams();
    const navigate=useNavigate();

    const [match,setMatch]=useState(null);
    const [players,setPlayers]=useState([]);
    const [stats,setStats]=useState([]);
    const [fantasyTeam,setFantasyTeam]=useState(null);

    const [loading,setLoading]=useState(true);
    const [error,setError]=useState("");

    useEffect(()=>{
        const fetchMatchDetails=async()=>{
            try{
                setLoading(true);
                setError("");

                const matchData=await getMatchById(id);
                setMatch(matchData);

                const [playerData,statsData,teamsData]=await Promise.all([
                    getPlayersByMatchID(id),
                    getPlayerStatsByMatchID(id),
                    getFantasyTeamsByMatchID(id)
                ]);

                setPlayers(playerData);
                setStats(statsData);
                setFantasyTeam(teamsData.length>0 ? teamsData[0] : null);
            }
            catch(err){
                console.error(err);
                setError("Unable to load match details.");
            }
            finally{
                setLoading(false);
            }
        };

        fetchMatchDetails();
    },[id]);

    const getPlayerStats=(playerID)=>{
        return stats.find(item=>item.player_id===playerID);
    };

    const displayStat=(value)=>{
        return value===undefined || value===null ? "—" : value;
    };

    const indiaPlayers=players.filter(player=>player.team===match?.team1);
    const australiaPlayers=players.filter(player=>player.team===match?.team2);

    const renderPlayers=(teamPlayers)=>{
        if(!teamPlayers.length){
            return (
                <p className="text-sm text-gray-400 py-4">
                    No players available.
                </p>
            );
        }

        return (
            <div className="grid md:grid-cols-2 gap-4">
                {teamPlayers.map(player=>{
                    const playerStats=getPlayerStats(player.id);

                    return (
                        <div
                            key={player.id}
                            className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-[#b9cbbd] transition"
                        >
                            <div className="flex justify-between items-start">
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

                            {match.status==="upcoming" ? (
                                <div className="mt-5 bg-[#f7f7f2] rounded-xl p-4">
                                    <p className="text-sm text-gray-600">
                                        Match hasn't started yet.
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Player performance statistics will appear once the match begins.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-3 gap-2 mt-5">
                                        <div className="bg-[#f7f7f2] rounded-xl p-3">
                                            <p className="text-xs text-gray-500">Runs</p>
                                            <p className="text-lg font-semibold text-[#263b30]">
                                                {displayStat(playerStats?.runs)}
                                            </p>
                                        </div>

                                        <div className="bg-[#f7f7f2] rounded-xl p-3">
                                            <p className="text-xs text-gray-500">Wickets</p>
                                            <p className="text-lg font-semibold text-[#263b30]">
                                                {displayStat(playerStats?.wickets)}
                                            </p>
                                        </div>

                                        <div className="bg-[#f7f7f2] rounded-xl p-3">
                                            <p className="text-xs text-gray-500">Fantasy pts</p>
                                            <p className="text-lg font-semibold text-[#315b45]">
                                                {displayStat(playerStats?.fantasy_points)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between text-xs text-gray-500 mt-4">
                                        <span>4s: {displayStat(playerStats?.fours)}</span>
                                        <span>6s: {displayStat(playerStats?.sixes)}</span>
                                        <span>SR: {displayStat(playerStats?.strike_rate)}</span>
                                    </div>

                                    <div className="flex justify-between text-xs text-gray-500 mt-3">
                                        <span>Overs: {displayStat(playerStats?.overs)}</span>
                                        <span>Wickets: {displayStat(playerStats?.wickets)}</span>
                                        <span>Economy: {displayStat(playerStats?.economy)}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    if(loading){
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f7f7f2]">
                <p className="text-[#315b45]">Loading match details...</p>
            </div>
        );
    }

    if(error || !match){
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f7f2] gap-4">
                <p className="text-red-600">
                    {error || "Match not found."}
                </p>

                <button
                    onClick={()=>navigate("/")}
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

                <button
                    onClick={()=>navigate(-1)}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#315b45] mb-7"
                >
                    <ArrowLeft size={17}/>
                    Back
                </button>

                {/*match header*/}
                <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-9">

                    <div className="flex flex-col md:flex-row justify-between gap-5">

                        <div>
                            <div className="flex items-center gap-2 text-sm text-[#718475] uppercase tracking-widest">
                                <Trophy size={15}/>
                                {match.format}
                            </div>

                            <h1 className="text-3xl md:text-4xl font-semibold text-[#263b30] mt-3">
                                {match.team1} vs {match.team2}
                            </h1>

                            <div className="flex flex-wrap gap-4 mt-5 text-sm text-gray-500">
                                <span className="flex items-center gap-2">
                                    <MapPin size={16}/>
                                    {match.venue || "Venue unavailable"}
                                </span>

                                <span className="flex items-center gap-2">
                                    <CalendarDays size={16}/>
                                    {match.date
                                        ? new Date(match.date).toLocaleDateString()
                                        : "Date to be announced"}
                                </span>
                            </div>
                        </div>

                        <div className="self-start bg-[#e9eee8] text-[#315b45] px-4 py-2 rounded-full text-sm font-medium capitalize">
                            {match.status}
                        </div>

                    </div>

                    <div className="border-t border-gray-100 mt-7 pt-6 flex flex-wrap items-center justify-between gap-4">

                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <Users size={18}/>
                            {players.length} players available
                        </div>

                        {fantasyTeam ? (
                            <button
                                onClick={()=>navigate(`/matches/${id}/my-team`)}
                                className="flex items-center gap-2 bg-[#315b45] text-white px-5 py-3 rounded-xl hover:bg-[#264936] transition"
                            >
                                View My Fantasy Team
                                <ArrowRight size={17}/>
                            </button>
                        ) : (
                            <button
                                onClick={()=>navigate(`/matches/${id}/create-team`)}
                                className="flex items-center gap-2 bg-[#315b45] text-white px-5 py-3 rounded-xl hover:bg-[#264936] transition"
                            >
                                Create Fantasy Team
                                <ArrowRight size={17}/>
                            </button>
                        )}

                    </div>
                </div>

                {/*player squads*/}
                <div className="mt-9">

                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-sm text-[#718475] uppercase tracking-widest">
                                Match Centre
                            </p>

                            <h2 className="text-2xl font-semibold text-[#263b30] mt-1">
                                Player Squads
                            </h2>
                        </div>

                        <span className="text-sm text-gray-500">
                            {players.length} players
                        </span>
                    </div>

                    {/*first team*/}
                    <div className="mb-9">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[#263b30]">
                                {match.team1}
                            </h3>

                            <span className="text-sm text-gray-500">
                                {indiaPlayers.length} players
                            </span>
                        </div>

                        {renderPlayers(indiaPlayers)}
                    </div>

                    {/*second team*/}
                    <div className="mb-9">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[#263b30]">
                                {match.team2}
                            </h3>

                            <span className="text-sm text-gray-500">
                                {australiaPlayers.length} players
                            </span>
                        </div>

                        {renderPlayers(australiaPlayers)}
                    </div>

                </div>

                {match.status!=="upcoming" && (
                    <p className="text-xs text-gray-400 mt-5">
                        Player statistics and fantasy points are illustrative demo data.
                    </p>
                )}

            </div>
        </div>
    );
}

export default MatchDetails;
