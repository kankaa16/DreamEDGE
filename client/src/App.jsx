import {BrowserRouter,Routes,Route,Navigate} from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import MatchDetails from "./pages/MatchDetails";

function App(){
    return(
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard/>}/>
                <Route path="/matches/:id" element={<MatchDetails/>}/>
                <Route path="*" element={<Navigate to="/" replace/>}/>
            </Routes>
        </BrowserRouter>
    );
}

export default App;