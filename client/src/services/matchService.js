import api from "./api";

export const getAllMatches=async()=>{
    const response=await api.get("/matches");
    return response.data.matches || [];
};

export const getMatchById=async(id)=>{
    const response=await api.get(`/matches/${id}`);
    return response.data.match;
};

export const createMatch=async(match)=>{
    const response=await api.post("/matches",match);
    return response.data;
};

export const updateMatch=async(id,match)=>{
    const response=await api.put(`/matches/${id}`,match);
    return response.data;
};

export const deleteMatch=async(id)=>{
    const response=await api.delete(`/matches/${id}`);
    return response.data;
};