import {BrowserRouter,Routes,Route,Navigate} from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import MyTeam from "./pages/MyTeam";
import MatchDetails from "./pages/MatchDetails";
import TeamBuilder from "./pages/TeamBuilder";
import FantasyAutopsy from "./pages/FantasyAutopsy";

function App(){
    return(
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard/>}/>
                <Route path="/matches/:id" element={<MatchDetails/>}/>
                <Route path="/matches/:id/my-team" element={<MyTeam/>}/>
                <Route path="/matches/:id/create-team" element={<TeamBuilder/>}/>
                <Route path="/teams/:id/autopsy" element={<FantasyAutopsy />} />
                <Route path="*" element={<Navigate to="/" replace/>}/>
            </Routes>
        </BrowserRouter>
    );
}

export default App;