import api from "./api";

//get stats of all players belonging to a match
export const getPlayerStatsByMatchID=async(matchID)=>{
    const response=await api.get(`/matches/${matchID}/player-stats`);
    return response.data.stats || [];
};

//get stats of a particular player
export const getPlayerStats=async(matchID,playerID)=>{
    const response=await api.get(`/matches/${matchID}/players/${playerID}/stats`);
    return response.data.stats;
};