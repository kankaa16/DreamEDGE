
import {useEffect,useState} from "react";
import {useParams,useNavigate} from "react-router-dom";
import {ArrowLeft,Check,Users,Trophy} from "lucide-react";

import {getMatchById} from "../services/matchService";
import {getPlayersByMatchID} from "../services/playerService";
import {createFantasyTeam} from "../services/fantasyTeamService";

function TeamBuilder(){
    const {id}=useParams();
    const navigate=useNavigate();

    const [match,setMatch]=useState(null);
    const [players,setPlayers]=useState([]);
    const [selectedPlayers,setSelectedPlayers]=useState([]);
    const [teamName,setTeamName]=useState("My Dream XI");
    const [captainID,setCaptainID]=useState("");
    const [viceCaptainID,setViceCaptainID]=useState("");

    const [loading,setLoading]=useState(true);
    const [saving,setSaving]=useState(false);
    const [error,setError]=useState("");

    //fetch match and its players
    useEffect(()=>{
        const fetchData=async()=>{
            try{
                const [matchData,playersData]=await Promise.all([
                    getMatchById(id),
                    getPlayersByMatchID(id)
                ]);

                setMatch(matchData);
                setPlayers(playersData);
            }
            catch(err){
                console.error(err);
                setError("Unable to load match players.");
            }
            finally{
                setLoading(false);
            }
        };

        fetchData();
    },[id]);

    //select or remove a player
    //select or remove a player
const togglePlayer=(playerID)=>{
    setSelectedPlayers(prev=>{
        //remove player
        if(prev.includes(playerID)){
            if(captainID===playerID) setCaptainID("");
            if(viceCaptainID===playerID) setViceCaptainID("");

            return prev.filter(id=>id!==playerID);
        }

        //maximum 11 players
        if(prev.length===11) return prev;

        //find the player being selected
        const player=players.find(p=>p.id===playerID);

        //count selected players from the same real team
        const teamCount=prev.filter(id=>{
            const selectedPlayer=players.find(p=>p.id===id);
            return selectedPlayer?.team===player?.team;
        }).length;

        //maximum 7 players from one team
        if(teamCount>=7){
            setError("You can select maximum 7 players from one team.");
            return prev;
        }

        setError("");
        return [...prev,playerID];
    });
};
//validate player role limits
const validateRoles=()=>{
    const roleCount={
        wicketkeeper:0,
        batter:0,
        allrounder:0,
        bowler:0
    };

    selectedPlayers.forEach(id=>{
        const player=players.find(p=>p.id===id);
        const role=player?.role?.toLowerCase();

        if(role==="wicketkeeper" || role==="wk"){
            roleCount.wicketkeeper++;
        }
        else if(role==="batter" || role==="batsman"){
            roleCount.batter++;
        }
        else if(role==="allrounder" || role==="all-rounder"){
            roleCount.allrounder++;
        }
        else if(role==="bowler"){
            roleCount.bowler++;
        }
    });

    if(roleCount.wicketkeeper<1 || roleCount.wicketkeeper>4){
        return "Select 1-4 wicketkeepers.";
    }

    if(roleCount.batter<3 || roleCount.batter>6){
        return "Select 3-6 batters.";
    }

    if(roleCount.allrounder<1 || roleCount.allrounder>4){
        return "Select 1-4 all-rounders.";
    }

    if(roleCount.bowler<3 || roleCount.bowler>6){
        return "Select 3-6 bowlers.";
    }

    return "";
};
    //save fantasy team
    const handleSaveTeam=async()=>{
        setError("");

        if(selectedPlayers.length!==11){
            setError("Please select exactly 11 players.");
            return;
        }
        //validate role limits
    const roleError=validateRoles();

    if(roleError){
        setError(roleError);
        return;
    }

        if(!captainID || !viceCaptainID){
            setError("Please select a captain and vice-captain.");
            return;
        }

        if(captainID===viceCaptainID){
            setError("Captain and vice-captain must be different.");
            return;
        }

        if(!selectedPlayers.includes(captainID) ||
           !selectedPlayers.includes(viceCaptainID)){
            setError("Captain and vice-captain must be selected players.");
            return;
        }

        try{
            setSaving(true);

            await createFantasyTeam({
                match_id:id,
                team_name:teamName,
                selected_players:selectedPlayers,
                captain_id:captainID,
                vice_captain_id:viceCaptainID
            });

            navigate(`/matches/${id}/my-team`);
        }
        catch(err){
            console.error(err);
            setError(
                err.response?.data?.error ||
                "Unable to save your fantasy team."
            );
        }
        finally{
            setSaving(false);
        }
    };

    //group players by their real teams
    const team1Players=players.filter(
        player=>player.team===match?.team1
    );

    const team2Players=players.filter(
        player=>player.team===match?.team2
    );

    const renderPlayers=(teamPlayers)=>{
        return teamPlayers.map(player=>{
            const isSelected=selectedPlayers.includes(player.id);

            return(
                <button
                    key={player.id}
                    type="button"
                    onClick={()=>togglePlayer(player.id)}
                    disabled={!isSelected && selectedPlayers.length===11}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition ${
                        isSelected
                        ?"bg-[#edf3eb] border-[#315d43]"
                        :"bg-white border-[#e8eae3] hover:border-[#a3b49f]"
                    }`}
                >
                    <div className="flex items-center gap-3 text-left">
                        <div className="w-10 h-10 rounded-full bg-[#f1f2ec] flex items-center justify-center text-sm font-bold text-[#315d43]">
                            {player.name?.slice(0,1).toUpperCase()}
                        </div>

                        <div>
                            <p className="font-semibold text-[#283c30]">
                                {player.name}
                            </p>

                            <p className="text-xs text-[#929b91] capitalize mt-1">
                                {player.role}
                            </p>
                        </div>
                    </div>

                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isSelected
                        ?"bg-[#315d43] text-white"
                        :"border border-[#cbd1c8]"
                    }`}>
                        {isSelected && <Check size={15}/>}
                    </div>
                </button>
            );
        });
    };

    if(loading){
        return(
            <div className="min-h-screen bg-[#f7f7f2] flex items-center justify-center text-[#315d43]">
                Loading players...
            </div>
        );
    }

    if(!match){
        return(
            <div className="min-h-screen bg-[#f7f7f2] p-10 text-center">
                <p className="text-red-600">
                    {error || "Match not found."}
                </p>
            </div>
        );
    }

    return(
        <div className="min-h-screen bg-[#f7f7f2]">

            {/* Navbar */}
            <nav className="bg-[#fdfdf9] border-b border-[#e7e8df]">
                <div className="max-w-7xl mx-auto px-6 py-5">
                    <button
                        onClick={()=>navigate(`/matches/${id}`)}
                        className="flex items-center gap-2 text-sm text-[#68756d] hover:text-[#244c3b]"
                    >
                        <ArrowLeft size={17}/>
                        Back to match
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-10">

                {/* Header */}
                <div className="mb-8">
                    <p className="text-xs font-bold tracking-[0.2em] text-[#8a988e] uppercase mb-3">
                        Match preparation
                    </p>

                    <h1 className="serif text-4xl md:text-5xl text-[#244c3b]">
                        Build your Dream XI.
                    </h1>

                    <p className="text-sm text-[#7c877e] mt-3">
                        {match.team1} vs {match.team2}
                    </p>
                </div>

                {/* Team name and counter */}
                <div className="bg-white border border-[#e7e9e0] rounded-2xl p-5 mb-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">

                    <div>
                        <label className="text-xs text-[#89948a] font-semibold">
                            FANTASY TEAM NAME
                        </label>

                        <input
                            value={teamName}
                            onChange={e=>setTeamName(e.target.value)}
                            className="block mt-2 w-full sm:w-72 outline-none border-b border-[#dfe3d9] focus:border-[#315d43] py-2 text-lg font-semibold text-[#244c3b]"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <Users className="text-[#315d43]" size={22}/>

                        <div>
                            <p className="text-2xl font-bold text-[#244c3b]">
                                {selectedPlayers.length}/11
                            </p>

                            <p className="text-xs text-[#929b91]">
                                Players selected
                            </p>
                        </div>
                    </div>
                </div>

                {/* Selection progress */}
                <div className="h-2 bg-[#e6e9e1] rounded-full mb-8 overflow-hidden">
                    <div
                        className="h-full bg-[#315d43] rounded-full transition-all"
                        style={{
                            width:`${selectedPlayers.length/11*100}%`
                        }}
                    />
                </div>

                {/* Player selection */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-[#244c3b]">
                                {match.team1}
                            </h2>

                            <span className="text-xs text-[#89948a]">
                                {team1Players.filter(p=>selectedPlayers.includes(p.id)).length} selected
                            </span>
                        </div>

                        <div className="space-y-3">
                            {renderPlayers(team1Players)}
                        </div>
                    </section>

                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-[#244c3b]">
                                {match.team2}
                            </h2>

                            <span className="text-xs text-[#89948a]">
                                {team2Players.filter(p=>selectedPlayers.includes(p.id)).length} selected
                            </span>
                        </div>

                        <div className="space-y-3">
                            {renderPlayers(team2Players)}
                        </div>
                    </section>

                </div>

                {/* Captain selection */}
                {selectedPlayers.length===11 && (
                    <section className="bg-white border border-[#e7e9e0] rounded-2xl p-6 mt-9">

                        <div className="flex items-center gap-2 mb-5">
                            <Trophy size={20} className="text-[#927b4e]"/>

                            <h2 className="text-xl font-bold text-[#244c3b]">
                                Leadership
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                            <div>
                                <label className="text-sm font-semibold text-[#68756d]">
                                    Captain (2x points)
                                </label>

                                <select
                                    value={captainID}
                                    onChange={e=>setCaptainID(e.target.value)}
                                    className="w-full mt-2 p-3 rounded-xl border border-[#e1e5dc] bg-[#fdfdf9] text-sm outline-none"
                                >
                                    <option value="">Select captain</option>

                                    {selectedPlayers.map(playerID=>{
                                        const player=players.find(
                                            p=>p.id===playerID
                                        );

                                        return(
                                            <option key={playerID} value={playerID}>
                                                {player?.name}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-[#68756d]">
                                    Vice-captain (1.5x points)
                                </label>

                                <select
                                    value={viceCaptainID}
                                    onChange={e=>setViceCaptainID(e.target.value)}
                                    className="w-full mt-2 p-3 rounded-xl border border-[#e1e5dc] bg-[#fdfdf9] text-sm outline-none"
                                >
                                    <option value="">Select vice-captain</option>

                                    {selectedPlayers.map(playerID=>{
                                        const player=players.find(
                                            p=>p.id===playerID
                                        );

                                        return(
                                            <option key={playerID} value={playerID}>
                                                {player?.name}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                        </div>
                    </section>
                )}
                

                {/* Save */}
                {error && (
                    <p className="mt-5 text-sm text-red-600">
                        {error}
                    </p>
                )}

                <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">

                    <p className="text-sm text-[#89948a]">
                        Select 11 players to continue.
                    </p>

                    <button
                        onClick={handleSaveTeam}
                        disabled={saving || selectedPlayers.length!==11}
                        className="w-full sm:w-auto bg-[#244c3b] text-white px-8 py-3 rounded-xl text-sm font-semibold hover:bg-[#315d43] disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                        {saving?"Saving team...":"Save Fantasy Team"}
                    </button>

                </div>

            </main>
        </div>
    );
}

export default TeamBuilder;
