
import {useEffect,useState} from "react";
import {useParams,useNavigate} from "react-router-dom";
import {getMatchById} from "../services/matchService";
import {getPlayersByMatchID} from "../services/playerService";
import {getPlayerStatsByMatchID} from "../services/playerStatsService";
import {
    ArrowLeft,
    MapPin,
    CalendarDays,
    Trophy,
    Users,
    UserRound
} from "lucide-react";

function MatchDetails(){
    const {id}=useParams();
    const navigate=useNavigate();

    const [match,setMatch]=useState(null);
    const [players,setPlayers]=useState([]);
    const [playerStats,setPlayerStats]=useState([]);
    const [loading,setLoading]=useState(true);
    const [error,setError]=useState("");
    const [playerError,setPlayerError]=useState("");
    const [statsError,setStatsError]=useState("");

    useEffect(()=>{
        const fetchData=async()=>{
            try{
                setLoading(true);
                setError("");
                setPlayerError("");
                setStatsError("");

                //fetch match details
                const matchData=await getMatchById(id);
                setMatch(matchData);

                //fetch players belonging to this match
                try{
                    const playerData=await getPlayersByMatchID(id);
                    setPlayers(playerData);
                }
                catch(err){
                    console.error("Error fetching players:",err);
                    setPlayerError("Unable to load players.");
                }

                //fetch stats belonging to this match
                try{
                    const statsData=await getPlayerStatsByMatchID(id);
                    setPlayerStats(statsData);
                }
                catch(err){
                    console.error("Error fetching player stats:",err);
                    setStatsError("Unable to load player statistics.");
                }
            }
            catch(err){
                console.error("Error fetching match:",err);
                setError("Unable to load match details.");
            }
            finally{
                setLoading(false);
            }
        };

        fetchData();
    },[id]);

    //format match date
    const formatDate=(date)=>{
        if(!date){
            return "Date to be announced";
        }

        const parsedDate=new Date(date);

        if(
            Number.isNaN(parsedDate.getTime()) ||
            parsedDate.getUTCFullYear()<=1
        ){
            return "Date to be announced";
        }

        return parsedDate.toLocaleDateString("en-IN",{
            day:"numeric",
            month:"long",
            year:"numeric"
        });
    };

    //display missing stats as a dash
    const displayStat=(value)=>{
        return value===null || value===undefined ? "—" : value;
    };

    if(loading){
        return(
            <div className="min-h-screen bg-[#f7f7f2] flex items-center justify-center text-[#244c3b]">
                Loading match details...
            </div>
        );
    }

    if(error || !match){
        return(
            <div className="min-h-screen bg-[#f7f7f2] flex flex-col items-center justify-center gap-4">
                <p className="text-red-600">
                    {error || "Match not found"}
                </p>

                <button
                    onClick={()=>navigate("/")}
                    className="text-[#244c3b] font-semibold"
                >
                    Back to dashboard
                </button>
            </div>
        );
    }

    return(
        <div className="min-h-screen bg-[#f7f7f2]">

            {/* Navbar */}
            <nav className="border-b border-[#e7e8df] bg-[#fdfdf9]">
                <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">

                    <h1 className="text-xl font-bold text-[#244c3b]">
                        DreamEdge
                    </h1>

                    <button
                        onClick={()=>navigate("/")}
                        className="flex items-center gap-2 text-sm font-semibold text-[#244c3b]"
                    >
                        <ArrowLeft size={17}/>
                        Dashboard
                    </button>

                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-10">

                {/* Page Heading */}
                <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#8a988e] mb-3">
                    Match Centre
                </p>

                <h2 className="serif text-4xl md:text-5xl text-[#244c3b]">
                    Match Details.
                </h2>

                <p className="text-[#7c877e] mt-2">
                    Explore the match and prepare your fantasy strategy.
                </p>

                {/* Match Card */}
                <div className="bg-white border border-[#e7e9e0] rounded-3xl p-6 md:p-10 mt-8">

                    <div className="flex justify-between items-center">

                        <span className="text-xs font-bold tracking-wider text-[#879188] uppercase">
                            {match.format}
                        </span>

                        <span className="text-xs font-bold capitalize bg-[#edf2eb] text-[#315d43] px-4 py-2 rounded-full">
                            {match.status}
                        </span>

                    </div>

                    {/* Teams */}
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-12">

                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto rounded-3xl bg-[#edf2eb] flex items-center justify-center text-2xl font-bold text-[#315d43]">
                                {match.team1?.slice(0,3).toUpperCase()}
                            </div>

                            <h3 className="text-xl md:text-2xl font-bold text-[#283c30] mt-4">
                                {match.team1}
                            </h3>
                        </div>

                        <span className="serif text-3xl text-[#a1aa9e]">
                            VS
                        </span>

                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto rounded-3xl bg-[#f2eee4] flex items-center justify-center text-2xl font-bold text-[#927b4e]">
                                {match.team2?.slice(0,3).toUpperCase()}
                            </div>

                            <h3 className="text-xl md:text-2xl font-bold text-[#283c30] mt-4">
                                {match.team2}
                            </h3>
                        </div>

                    </div>

                    {/* Match Information */}
                    <div className="border-t border-[#eef0e9] pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">

                        <div className="flex items-start gap-3">
                            <MapPin className="text-[#819781]" size={20}/>

                            <div>
                                <p className="text-xs text-[#929b91]">
                                    Venue
                                </p>

                                <p className="font-semibold text-[#283c30] mt-1">
                                    {match.venue}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CalendarDays className="text-[#819781]" size={20}/>

                            <div>
                                <p className="text-xs text-[#929b91]">
                                    Match date
                                </p>

                                <p className="font-semibold text-[#283c30] mt-1">
                                    {formatDate(match.date)}
                                </p>
                            </div>
                        </div>

                    </div>

                </div>

                {/* Players Section */}
                <div className="mt-12">

                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">

                        <div>
                            <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#8a988e] mb-2">
                                Squad Overview
                            </p>

                            <h2 className="text-2xl font-bold text-[#244c3b]">
                                Players
                            </h2>

                            <p className="text-sm text-[#8a958c] mt-1">
                                Player profiles and match performance.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-[#68756d]">
                            <Users size={17}/>

                            <span>
                                {players.length} players
                            </span>
                        </div>

                    </div>

                    {playerError?(
                        <div className="bg-white border border-red-100 rounded-2xl p-8 text-center text-red-600">
                            {playerError}
                        </div>
                    ):players.length===0?(
                        <div className="bg-white border border-[#e7e9e0] rounded-2xl p-12 text-center">

                            <UserRound size={32} className="mx-auto text-[#a3b19f] mb-4"/>

                            <h3 className="text-lg font-bold text-[#244c3b]">
                                No players added yet
                            </h3>

                            <p className="text-sm text-[#929b91] mt-2">
                                Player records associated with this match will appear here.
                            </p>

                        </div>
                    ):(
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            {players.map(player=>{
    const stats=playerStats.find(
        item=>item.player_id===player.id
    );

    return(
        <div
            key={player.id}
            className="bg-white border border-[#e7e9e0] rounded-2xl p-5 hover:shadow-sm transition"
        >
            {/* Player name */}
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-[#244c3b]">
                        {player.name}
                    </h3>
                    <p className="text-xs text-[#879188] mt-1">
                        {player.team} · {player.role}
                    </p>
                </div>

                <span className="text-xs bg-[#f2eee4] text-[#927b4e] px-3 py-1 rounded-full">
                    {player.role}
                </span>
            </div>

            {/* Batting score */}
            <div className="flex items-center justify-between mt-5">
                <div>
                    <p className="text-3xl font-bold text-[#244c3b]">
                        {stats?.runs ?? "—"}
                    </p>
                    <p className="text-xs text-[#879188]">
                        Runs ({stats?.balls_faced ?? "—"} balls)
                    </p>
                </div>

                <div className="text-right">
                    <p className="text-xl font-bold text-[#315d43]">
                        {stats?.strike_rate ?? "—"}
                    </p>
                    <p className="text-xs text-[#879188]">
                        Strike Rate
                    </p>
                </div>
            </div>

            {/* Batting details */}
            <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                    ["Fours",stats?.fours],
                    ["Sixes",stats?.sixes],
                    ["Wickets",stats?.wickets]
                ].map(([label,value])=>(
                    <div
                        key={label}
                        className="bg-[#f7f7f2] rounded-xl p-3"
                    >
                        <p className="font-bold text-[#244c3b]">
                            {value ?? "—"}
                        </p>
                        <p className="text-xs text-[#879188]">
                            {label}
                        </p>
                    </div>
                ))}
            </div>

            {/* Bowling details */}
            <div className="flex justify-between text-xs text-[#68756d] mt-4">
                <span>
                    Bowling: {stats ? `${stats.overs} overs` : "—"}
                </span>
                <span>
                    {stats ? `${stats.wickets} wickets · ${stats.runs_conceded} runs` : "—"}
                </span>
            </div>

            {/* Fantasy points */}
            <div className="border-t border-[#eef0e9] mt-4 pt-3 flex justify-between items-center">
                <span className="text-xs font-medium text-[#68756d]">
                    Fantasy Points
                </span>
                <span className="font-bold text-[#244c3b]">
                    {stats?.fantasy_points ?? "—"}
                </span>
            </div>
        </div>
    );
})}

                        </div>
                    )}

                </div>

                {/* Fantasy Preparation */}
                <div className="bg-[#eaf0e8] rounded-2xl p-6 mt-10">

                    <div className="flex items-center gap-3">
                        <Trophy className="text-[#315d43]" size={22}/>

                        <h3 className="font-bold text-[#244c3b]">
                            Fantasy preparation
                        </h3>
                    </div>

                    <p className="text-sm text-[#68756d] mt-3">
                        Player profiles and match statistics are available here. Playing XI, pitch analysis and fantasy team building will be developed in the next stages.
                    </p>

                </div>

            </main>
        </div>
    );
}

export default MatchDetails;
