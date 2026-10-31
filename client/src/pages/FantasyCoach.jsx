import { ArrowLeft, BrainCircuit, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

function FantasyCoach() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#f7f7f2]">
            <nav className="border-b border-[#e7e8df] bg-[#fdfdf9]">
                <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="text-white w-9 h-9 bg-[#244c3b] rounded-xl flex items-center justify-center">
                            11
                        </div>
                        <span className="text-xl font-bold tracking-tight text-[#244c3b]">
                            DreamEdge
                        </span>
                    </div>

                    <button
                        onClick={() => navigate("/dashboard")}
                        className="flex items-center gap-2 text-sm font-semibold text-[#244c3b] hover:text-[#087d60]"
                    >
                        <ArrowLeft size={16}/>
                        Dashboard
                    </button>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <p className="text-xs font-bold tracking-[0.2em] text-[#8a988e] uppercase mb-3">
                        Personal fantasy insights
                    </p>
                    <h1 className="serif text-5xl text-[#244c3b]">
                        Fantasy Coach.
                    </h1>
                    <p className="text-[#7c877e] mt-3">
                        Learn from your previous matches. Improve with every game.
                    </p>
                </div>

                <section className="bg-white border border-[#e9eae2] rounded-2xl p-8 md:p-12 text-center">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-[#edf2eb] text-[#244c3b] flex items-center justify-center">
                        <BrainCircuit size={27}/>
                    </div>

                    <h2 className="text-2xl font-bold text-[#244c3b] mt-5">
                        Your coach is getting ready.
                    </h2>
                    <p className="text-sm text-[#879188] max-w-lg mx-auto mt-3 leading-6">
                        Once you have more completed match autopsies, DreamEdge will
                        use your history to identify recurring mistakes and suggest
                        ways to improve your fantasy strategy.
                    </p>

                    <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-[#edf2eb] text-[#315d43] text-xs font-semibold">
                        <Sparkles size={14}/>
                        Personalised insights coming soon
                    </div>

                    <div className="mt-8">
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="bg-[#244c3b] text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-[#315d43] transition"
                        >
                            Back to dashboard
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default FantasyCoach;
