import axiosInstance from "./axiosInstance";

export const getAllGroups = async () => {
  const response = await axiosInstance.get("/api/asset-groups/");
  return response.data;
};

export const getGroupById = async (id) => {
  const response = await axiosInstance.get(`/api/asset-groups/${id}`);
  return response.data;
};

export const getAssetsInGroup = async (groupId) => {
  const response = await axiosInstance.get(
    `/api/asset-groups/${groupId}/assets`
  );
  return response.data;
};

export const createGroup = async (data) => {
  const response = await axiosInstance.post("/api/asset-groups/", data);
  return response.data;
};

export const updateGroup = async (id, data) => {
  const response = await axiosInstance.put(`/api/asset-groups/${id}`, data);
  return response.data;
};

export const deleteGroup = async (id) => {
  const response = await axiosInstance.delete(`/api/asset-groups/${id}`);
  return response.data;
};