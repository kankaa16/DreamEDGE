import api from "./api";

//get fantasy teams belonging to a match
export const getFantasyTeamsByMatchID=async(matchID)=>{
    const response=await api.get(`/matches/${matchID}/teams`);
    return response.data.teams || [];
};

//get a particular fantasy team
export const getFantasyTeamByID=async(id)=>{
    const response=await api.get(`/teams/${id}`);
    return response.data.team;
};

//update existing fantasy team
export const updateFantasyTeam=async(id,team)=>{
    const response=await api.put(`/teams/${id}`,team);
    return response.data;
};