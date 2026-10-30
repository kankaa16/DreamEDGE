
import {useEffect,useState} from "react";
import {getAllMatches} from "../services/matchService";
import {
    Activity,
    ArrowUpRight,
    CalendarDays,
    MapPin,
    Trophy,
    Plus
} from "lucide-react";
import {useNavigate} from "react-router-dom";
const filters=["all","upcoming","live","completed"];

function Dashboard(){
    const navigate=useNavigate();
    const [matches,setMatches]=useState([]);
    const [loading,setLoading]=useState(true);
    const [error,setError]=useState("");
    const [filter,setFilter]=useState("all");

    useEffect(()=>{
        const fetchMatches=async()=>{
            try{
                setLoading(true);

                const data=await getAllMatches();

                setMatches(data);
                setError("");
            }
            catch(err){
                console.error("Error fetching matches:",err);
                setError("Unable to load matches. Please try again.");
            }
            finally{
                setLoading(false);
            }
        };

        fetchMatches();
    },[]);

    // Calculate statistics from all matches
    const totalMatches=matches.length;

    const liveMatches=matches.filter(match=>
        match.status==="live"
    ).length;

    const upcomingMatches=matches.filter(match=>
        match.status==="upcoming"
    ).length;

    // Apply selected filter
    const filteredMatches=matches.filter(match=>{
        return filter==="all" || match.status===filter;
    });

    // Format match date
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
            month:"short",
            year:"numeric"
        });
    };

    // Status styling
    const getStatusStyle=(status)=>{
        const styles={
            live:"bg-red-50 text-red-600",
            upcoming:"bg-green-50 text-green-700",
            completed:"bg-stone-100 text-stone-600"
        };

        return styles[status] || "bg-gray-100 text-gray-600";
    };

    return(
        <div className="min-h-screen bg-[#f7f7f2]">

            {/* Navbar */}
            <nav className="border-b border-[#e7e8df] bg-[#fdfdf9]">
                <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">

                    <div className="flex items-center gap-2">
                        <div className="text-[#ffffff] w-9 h-9 bg-[#244c3b] rounded-xl flex items-center justify-center">
                            11
                        </div>

                        <span className="text-xl font-bold tracking-tight text-[#244c3b]">
                            DreamEdge
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#68756d]">
                        <span className="text-[#244c3b]">
                            Dashboard
                        </span>
                        <span>Match Prep</span>
                        <span>Live Tracker</span>
                        <span>Autopsy</span>
                    </div>

                    <div className="text-sm font-semibold text-[#244c3b] bg-[#edf1e9] px-4 py-2 rounded-full">
                        Fantasy Intelligence
                    </div>

                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-10">

                {/* Dashboard Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-10">

                    <div>
                        <p className="text-xs font-bold tracking-[0.2em] text-[#8a988e] uppercase mb-3">
                            Your cricket command centre
                        </p>

                        <h1 className="serif text-5xl md:text-6xl text-[#244c3b]">
                            Dashboard.
                        </h1>

                        <p className="text-[#7c877e] mt-3">
                            Don't just play fantasy. Understand the game.
                        </p>
                    </div>

                    <button
                        disabled
                        className="flex items-center gap-2 bg-[#244c3b] text-white px-5 py-3 rounded-xl text-sm font-semibold opacity-70 cursor-not-allowed"
                    >
                        <Plus size={17}/>
                        Create fantasy team
                    </button>

                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">

                    <div className="bg-white border border-[#e9eae2] rounded-2xl p-5">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-[#879188]">
                                Total matches
                            </span>

                            <Trophy size={19} className="text-[#819781]"/>
                        </div>

                        <p className="text-3xl font-bold text-[#244c3b] mt-4">
                            {loading?"—":totalMatches}
                        </p>

                        <p className="text-xs text-[#9aa39a] mt-1">
                            Matches in database
                        </p>
                    </div>

                    <div className="bg-white border border-[#e9eae2] rounded-2xl p-5">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-[#879188]">
                                Live matches
                            </span>

                            <Activity size={19} className="text-red-400"/>
                        </div>

                        <p className="text-3xl font-bold text-[#244c3b] mt-4">
                            {loading?"—":liveMatches}
                        </p>

                        <p className="text-xs text-[#9aa39a] mt-1">
                            Currently in progress
                        </p>
                    </div>

                    <div className="bg-white border border-[#e9eae2] rounded-2xl p-5">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-[#879188]">
                                Upcoming matches
                            </span>

                            <CalendarDays size={19} className="text-[#819781]"/>
                        </div>

                        <p className="text-3xl font-bold text-[#244c3b] mt-4">
                            {loading?"—":upcomingMatches}
                        </p>

                        <p className="text-xs text-[#9aa39a] mt-1">
                            Coming up next
                        </p>
                    </div>

                </div>

                {/* Match Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-6">

                    <div>
                        <h2 className="text-2xl font-bold text-[#244c3b]">
                            Matches
                        </h2>

                        <p className="text-sm text-[#8a958c] mt-1">
                            Explore matches and prepare your fantasy strategy.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {filters.map(item=>(
                            <button
                                key={item}
                                onClick={()=>setFilter(item)}
                                className={`px-4 py-2 rounded-full text-xs font-semibold capitalize transition ${
                                    filter===item
                                    ?"bg-[#244c3b] text-white"
                                    :"bg-white border border-[#e6e8df] text-[#78847a] hover:border-[#244c3b]"
                                }`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>

                </div>

                {/* Match List */}
                {loading?(
                    <div className="bg-white border border-[#e9eae2] rounded-2xl p-12 text-center text-[#879188]">
                        Loading matches...
                    </div>
                ):error?(
                    <div className="bg-white border border-red-100 rounded-2xl p-10 text-center">
                        <p className="text-red-600">{error}</p>

                        <button
                            onClick={()=>window.location.reload()}
                            className="mt-4 text-sm text-[#244c3b] font-semibold underline"
                        >
                            Retry
                        </button>
                    </div>
                ):filteredMatches.length===0?(
                    <div className="bg-white border border-[#e9eae2] rounded-2xl p-12 text-center">

                        <Trophy size={32} className="mx-auto text-[#a3b19f] mb-4"/>

                        <h3 className="text-lg font-bold text-[#244c3b]">
                            No matches found
                        </h3>

                        <p className="text-sm text-[#929b91] mt-2">
                            There are no matches in this category.
                        </p>

                    </div>
                ):(
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                        {filteredMatches.map(match=>(
                            <div
    key={match.id}
    onClick={()=>navigate(`/matches/${match.id}`)}
    className="bg-white border border-[#e7e9e0] rounded-2xl p-6 hover:shadow-md transition cursor-pointer"
>

                                {/* Match Information */}
                                <div className="flex justify-between items-center mb-7">

                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold tracking-wider text-[#879188] uppercase">
                                            {match.format}
                                        </span>

                                        <span className="w-1 h-1 rounded-full bg-[#c2c9bf]"></span>

                                        <span className="text-xs text-[#9ba49a]">
                                            {formatDate(match.date)}
                                        </span>
                                    </div>

                                    <span className={`text-xs font-bold capitalize px-3 py-1.5 rounded-full ${getStatusStyle(match.status)}`}>
                                        {match.status}
                                    </span>

                                </div>

                                {/* Teams */}
                                <div className="flex items-center justify-between gap-3">

                                    <div className="flex-1 text-center">
                                        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#edf2eb] flex items-center justify-center text-lg font-bold text-[#315d43]">
                                            {match.team1?.slice(0,3).toUpperCase()}
                                        </div>

                                        <h3 className="font-bold text-[#283c30] mt-3">
                                            {match.team1}
                                        </h3>
                                    </div>

                                    <div className="text-center">
                                        <span className="serif text-2xl text-[#a1aa9e]">
                                            VS
                                        </span>
                                    </div>

                                    <div className="flex-1 text-center">
                                        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#f2eee4] flex items-center justify-center text-lg font-bold text-[#927b4e]">
                                            {match.team2?.slice(0,3).toUpperCase()}
                                        </div>

                                        <h3 className="font-bold text-[#283c30] mt-3">
                                            {match.team2}
                                        </h3>
                                    </div>

                                </div>

                                {/* Venue */}
                                <div className="border-t border-[#eef0e9] mt-7 pt-4 flex items-center justify-between">

                                    <div className="flex items-center gap-2 text-sm text-[#89948a]">
                                        <MapPin size={15}/>

                                        <span>{match.venue}</span>
                                    </div>

                                    <button
                                        disabled
                                        className="text-[#315d43] opacity-50 cursor-not-allowed"
                                    >
                                        <ArrowUpRight size={19}/>
                                    </button>

                                </div>

                            </div>
                        ))}

                    </div>
                )}

                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-[#e5e8df] flex flex-col sm:flex-row justify-between gap-2 text-xs text-[#a0a99f]">
                    <span>DreamEdge · Fantasy cricket intelligence</span>
                    <span>Understand the game. Play smarter.</span>
                </div>

            </main>
        </div>
    );
}

export default Dashboard;
