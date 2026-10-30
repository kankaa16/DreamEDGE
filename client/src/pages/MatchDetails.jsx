import {useEffect,useState} from "react";
import {useParams,useNavigate} from "react-router-dom";
import {getMatchById} from "../services/matchService";
import {ArrowLeft,MapPin,CalendarDays,Trophy} from "lucide-react";

function MatchDetails(){
    const {id}=useParams();
    const navigate=useNavigate();

    const [match,setMatch]=useState(null);
    const [loading,setLoading]=useState(true);
    const [error,setError]=useState("");

    useEffect(()=>{
        const fetchMatch=async()=>{
            try{
                const data=await getMatchById(id);
                setMatch(data);
            }
            catch(err){
                console.error(err);
                setError("Unable to load match details.");
            }
            finally{
                setLoading(false);
            }
        };

        fetchMatch();
    },[id]);

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
                <p className="text-red-600">{error || "Match not found"}</p>

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

            <main className="max-w-5xl mx-auto px-6 py-10">

                {/* Page heading */}
                <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#8a988e] mb-3">
                    Match Centre
                </p>

                <h2 className="serif text-4xl md:text-5xl text-[#244c3b]">
                    Match Details
                </h2>

                <p className="text-[#7c877e] mt-2">
                    Explore the match before building your fantasy team.
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

                {/* Next section */}
                <div className="bg-[#eaf0e8] rounded-2xl p-6 mt-6">
                    <div className="flex items-center gap-3">
                        <Trophy className="text-[#315d43]" size={22}/>

                        <h3 className="font-bold text-[#244c3b]">
                            Fantasy preparation
                        </h3>
                    </div>

                    <p className="text-sm text-[#68756d] mt-3">
                        Player information, playing XI, pitch analysis and fantasy team building will be available here as we implement the Match Prep features.
                    </p>
                </div>

            </main>
        </div>
    );
}

export default MatchDetails;