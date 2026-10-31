
import {useEffect,useState} from "react";
import {useNavigate,useParams} from "react-router-dom";
import {ArrowLeft,Users,Trophy,Shield,User,Star} from "lucide-react";

import {getMatchById} from "../services/matchService";
import {getPlayersByMatchID} from "../services/playerService";
import {getPlayerStatsByMatchID} from "../services/playerStatsService";
import {getFantasyTeamsByMatchID} from "../services/fantasyTeamService";

function MyTeam(){
    const {id}=useParams();
    const navigate=useNavigate();

    const [match,setMatch]=useState(null);
    const [fantasyTeam,setFantasyTeam]=useState(null);
    const [players,setPlayers]=useState([]);
    const [stats,setStats]=useState([]);
    const [loading,setLoading]=useState(true);
    const [error,setError]=useState("");

    useEffect(()=>{
        const fetchData=async()=>{
            try{
                setLoading(true);
                setError("");

                const [matchData,playersData,statsData,teamsData]=await Promise.all([
                    getMatchById(id),
                    getPlayersByMatchID(id),
                    getPlayerStatsByMatchID(id),
                    getFantasyTeamsByMatchID(id)
                ]);

                setMatch(matchData);
                setPlayers(playersData || []);
                setStats(statsData || []);
                setFantasyTeam(teamsData?.[0] || null);

            }catch(err){
                console.error("Error fetching fantasy team:",err);
                setError("Unable to load your fantasy team.");
            }finally{
                setLoading(false);
            }
        };

        fetchData();
    },[id]);

    if(loading){
        return (
            <div className="min-h-screen bg-[#f7f7f2] flex items-center justify-center">
                <p className="text-gray-500">Loading your fantasy team...</p>
            </div>
        );
    }

    if(error){
        return (
            <div className="min-h-screen bg-[#f7f7f2] flex flex-col items-center justify-center gap-4">
                <p className="text-red-600">{error}</p>
                <button
                    onClick={()=>navigate(`/matches/${id}`)}
                    className="text-green-800 underline"
                >
                    Back to match
                </button>
            </div>
        );
    }

    if(!fantasyTeam || !match){
        return (
            <div className="min-h-screen bg-[#f7f7f2] flex flex-col items-center justify-center gap-4">
                <p className="text-gray-600">No fantasy team found for this match.</p>
                <button
                    onClick={()=>navigate(`/matches/${id}/create-team`)}
                    className="text-green-800 underline"
                >
                    Create Fantasy Team
                </button>
            </div>
        );
    }

    //get selected player details
    const selectedPlayers=(fantasyTeam.selected_players || [])
        .map(playerID=>players.find(player=>player.id===playerID))
        .filter(Boolean);

    //get players belonging to each match team
    const team1Players=selectedPlayers.filter(
        player=>player.team===match.team1
    );

    const team2Players=selectedPlayers.filter(
        player=>player.team===match.team2
    );

    //get captain and vice-captain
    const captain=players.find(
        player=>player.id===fantasyTeam.captain_id
    );

    const viceCaptain=players.find(
        player=>player.id===fantasyTeam.vice_captain_id
    );

    //get stats for a player
    const getPlayerStats=(playerID)=>{
        return stats.find(stat=>stat.player_id===playerID);
    };

    //display one selected player
    const PlayerCard=({player})=>{
        const playerStats=getPlayerStats(player.id);

        const isCaptain=player.id===fantasyTeam.captain_id;
        const isViceCaptain=player.id===fantasyTeam.vice_captain_id;

        return (
            <div className="flex items-center justify-between gap-3 py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#e9eee8] flex items-center justify-center shrink-0">
                        <User size={19} className="text-[#355f49]"/>
                    </div>

                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-[#293e32] truncate">
                                {player.name}
                            </p>

                            {isCaptain && (
                                <span className="text-xs font-bold text-green-800 bg-green-100 px-2 py-1 rounded-full">
                                    C
                                </span>
                            )}

                            {isViceCaptain && (
                                <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2 py-1 rounded-full">
                                    VC
                                </span>
                            )}
                        </div>

                        <p className="text-sm text-gray-500">
                            {player.role}
                        </p>
                    </div>
                </div>

                <div className="text-right shrink-0">
                    <p className="font-semibold text-[#355f49]">
                        {playerStats?.fantasy_points ?? 0}
                    </p>
                    <p className="text-xs text-gray-400">Points</p>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#f7f7f2] px-5 py-8 md:px-10">
            <div className="max-w-6xl mx-auto">

                {/* Back button */}
                <button
                    onClick={()=>navigate(`/matches/${id}`)}
                    className="flex items-center gap-2 text-gray-500 hover:text-[#293e32] mb-8"
                >
                    <ArrowLeft size={18}/>
                    Back
                </button>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-10">
                    <div>
                        <p className="text-sm tracking-widest text-[#788b7b] font-medium mb-3">
                            DREAMEDGE / FANTASY
                        </p>

                        <h1 className="text-4xl font-bold text-[#293e32]">
                            {fantasyTeam.team_name}
                        </h1>

                        <p className="text-gray-500 mt-2">
                            {match.team1} vs {match.team2}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-4">
                        <Users className="text-[#355f49]"/>
                        <span className="font-semibold text-[#293e32]">
                            {selectedPlayers.length}/11 Players
                        </span>
                    </div>
                </div>

                {/* Team counts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
                    {[match.team1,match.team2].map((team,index)=>{
                        const count=index===0?team1Players.length:team2Players.length;

                        return (
                            <div
                                key={team}
                                className="bg-white rounded-2xl border border-gray-100 p-6"
                            >
                                <p className="text-gray-500 font-medium">{team}</p>
                                <p className="text-4xl font-bold text-[#355f49] mt-2">
                                    {count}
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                    Selected players
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Selected players */}
                <div className="bg-white rounded-2xl border border-gray-100 p-7 mb-6">
                    <div className="flex items-center justify-between mb-7">
                        <h2 className="text-xl font-bold text-[#293e32]">
                            Selected Players
                        </h2>
                        <Shield className="text-[#788b7b]" size={24}/>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div>
                            <h3 className="text-sm font-bold tracking-wide text-gray-500 mb-3">
                                {match.team1?.toUpperCase()}
                            </h3>

                            {team1Players.length>0 ? (
                                team1Players.map(player=>(
                                    <PlayerCard key={player.id} player={player}/>
                                ))
                            ):(
                                <p className="text-sm text-gray-400">No players selected.</p>
                            )}
                        </div>

                        <div>
                            <h3 className="text-sm font-bold tracking-wide text-gray-500 mb-3">
                                {match.team2?.toUpperCase()}
                            </h3>

                            {team2Players.length>0 ? (
                                team2Players.map(player=>(
                                    <PlayerCard key={player.id} player={player}/>
                                ))
                            ):(
                                <p className="text-sm text-gray-400">No players selected.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Captain and vice-captain */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-7">
                    <div className="bg-[#e9eee8] rounded-2xl p-6">
                        <div className="flex items-center gap-2 text-[#355f49] mb-3">
                            <Trophy size={20}/>
                            <span className="font-semibold">Captain</span>
                        </div>

                        <h3 className="text-xl font-bold text-[#293e32]">
                            {captain?.name || "Not assigned"}
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                            {captain?.role || ""}
                        </p>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-6">
                        <div className="flex items-center gap-2 text-[#788b7b] mb-3">
                            <Star size={20}/>
                            <span className="font-semibold">Vice-captain</span>
                        </div>

                        <h3 className="text-xl font-bold text-[#293e32]">
                            {viceCaptain?.name || "Not assigned"}
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                            {viceCaptain?.role || ""}
                        </p>
                    </div>
                </div>

                <p className="text-sm text-gray-400">
                    Fantasy points shown are currently illustrative demo statistics.
                </p>

            </div>
        </div>
    );
}

export default MyTeam;
