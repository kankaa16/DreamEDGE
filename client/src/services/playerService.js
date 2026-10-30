import api from "./api";

//get all players belonging to a match
export const getPlayersByMatchID=async(matchID)=>{
    const response=await api.get(`/matches/${matchID}/players`);
    return response.data.players || [];
};

//get a single player
export const getPlayerByID=async(id)=>{
    const response=await api.get(`/players/${id}`);
    return response.data.player;
};

//create a player
export const createPlayer=async(player)=>{
    const response=await api.post("/players",player);
    return response.data;
};

//update a player
export const updatePlayer=async(id,player)=>{
    const response=await api.put(`/players/${id}`,player);
    return response.data;
};

//delete a player
export const deletePlayer=async(id)=>{
    const response=await api.delete(`/players/${id}`);
    return response.data;
};