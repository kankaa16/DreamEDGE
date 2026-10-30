
import {useEffect,useState} from "react";
import {useParams,useNavigate} from "react-router-dom";
import {ArrowLeft, Crown, Shield, Users} from "lucide-react";

import {getFantasyTeamsByMatchID} from "../services/fantasyTeamService";
import {getPlayersByMatchID} from "../services/playerService";
import {getPlayerStatsByMatchID} from "../services/playerStatsService";

function MyTeam(){
    const {id}=useParams();
    const navigate=useNavigate();

    const [team,setTeam]=useState(null);
    const [players,setPlayers]=useState([]);
    const [stats,setStats]=useState([]);
    const [loading,setLoading]=useState(true);
    const [error,setError]=useState("");

    useEffect(()=>{
        const fetchTeam=async()=>{
            try{
                setLoading(true);

                const [teams,allPlayers,allStats]=await Promise.all([
                    getFantasyTeamsByMatchID(id),
                    getPlayersByMatchID(id),
                    getPlayerStatsByMatchID(id)
                ]);

                if(!teams.length){
                    setError("No fantasy team found for this match.");
                    return;
                }

                setTeam(teams[0]);
                setPlayers(allPlayers);
                setStats(allStats);
            }
            catch(err){
                console.error(err);
                setError("Unable to load your fantasy team.");
            }
            finally{
                setLoading(false);
            }
        };

        fetchTeam();
    },[id]);

    if(loading){
        return <div className="p-8 text-center">Loading your team...</div>;
    }

    if(error){
        return <div className="p-8 text-center text-red-600">{error}</div>;
    }

    const selectedPlayers=players.filter(player=>
        team.selected_players.includes(player.id)
    );

    const getPlayerStats=(playerID)=>{
        return stats.find(item=>item.player_id===playerID);
    };

    const indiaPlayers=selectedPlayers.filter(p=>p.team==="India");
    const australiaPlayers=selectedPlayers.filter(p=>p.team==="Australia");

    const renderPlayers=(teamPlayers)=>{
        return teamPlayers.map(player=>{
            const playerStats=getPlayerStats(player.id);

            return (
                <div key={player.id}
                    className="flex items-center justify-between border-b border-gray-100 py-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#e9eee8] flex items-center justify-center text-[#315b45] font-semibold">
                            {player.name.charAt(0)}
                        </div>

                        <div>
                            <div className="font-semibold text-[#263b30]">
                                {player.name}
                                {team.captain_id===player.id &&
                                    <span className="ml-2 text-xs bg-[#315b45] text-white px-2 py-1 rounded-full">C</span>
                                }
                                {team.vice_captain_id===player.id &&
                                    <span className="ml-2 text-xs bg-[#d9e5d8] text-[#315b45] px-2 py-1 rounded-full">VC</span>
                                }
                            </div>
                            <p className="text-sm text-gray-500">{player.role}</p>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="font-semibold text-[#315b45]">
                            {playerStats?.fantasy_points ?? "—"}
                        </p>
                        <p className="text-xs text-gray-500">Fantasy pts</p>
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="min-h-screen bg-[#f7f7f2] px-5 py-8 md:px-12">
            <div className="max-w-5xl mx-auto">

                <button
                    onClick={()=>navigate(-1)}
                    className="flex items-center gap-2 text-sm text-gray-500 mb-6 hover:text-[#315b45]">
                    <ArrowLeft size={17}/> Back
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <p className="text-sm uppercase tracking-widest text-[#718475]">
                            DreamEdge / Fantasy
                        </p>
                        <h1 className="text-4xl font-semibold text-[#263b30] mt-2">
                            {team.team_name}
                        </h1>
                        <p className="text-gray-500 mt-2">
                            Your selected Fantasy XI
                        </p>
                    </div>

                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3">
                        <Users size={19} className="text-[#315b45]"/>
                        <span className="font-semibold">{selectedPlayers.length}/11 Players</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white rounded-2xl p-5 border border-gray-100">
                        <p className="text-sm text-gray-500">India</p>
                        <h2 className="text-3xl font-semibold text-[#315b45] mt-1">
                            {indiaPlayers.length}
                        </h2>
                        <p className="text-xs text-gray-400">Selected players</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-gray-100">
                        <p className="text-sm text-gray-500">Australia</p>
                        <h2 className="text-3xl font-semibold text-[#315b45] mt-1">
                            {australiaPlayers.length}
                        </h2>
                        <p className="text-xs text-gray-400">Selected players</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-7">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-xl font-semibold text-[#263b30]">
                            Selected Players
                        </h2>
                        <Shield className="text-[#718475]"/>
                    </div>

                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        India
                    </h3>
                    {renderPlayers(indiaPlayers)}

                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-7 mb-2">
                        Australia
                    </h3>
                    {renderPlayers(australiaPlayers)}
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-5">
                    <div className="bg-[#e9eee8] rounded-2xl p-5">
                        <div className="flex items-center gap-2 text-[#315b45]">
                            <Crown size={18}/>
                            <span className="text-sm font-medium">Captain</span>
                        </div>
                        <h3 className="text-xl font-semibold text-[#263b30] mt-2">
                            {players.find(p=>p.id===team.captain_id)?.name || "—"}
                        </h3>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-gray-100">
                        <div className="flex items-center gap-2 text-[#718475]">
                            <Crown size={18}/>
                            <span className="text-sm font-medium">Vice-captain</span>
                        </div>
                        <h3 className="text-xl font-semibold text-[#263b30] mt-2">
                            {players.find(p=>p.id===team.vice_captain_id)?.name || "—"}
                        </h3>
                    </div>
                </div>

                <p className="text-xs text-gray-400 mt-5">
                    Fantasy points shown are currently illustrative demo statistics.
                </p>
            </div>
        </div>
    );
}

export default MyTeam;
