import axiosInstance from "./axiosInstance";

export const getAllAssets = async (status = null) => {
  const url = status ? `/api/assets/?status=${status}` : "/api/assets/";
  const response = await axiosInstance.get(url);
  return response.data;
};

export const getAssetById = async (id) => {
  const response = await axiosInstance.get(`/api/assets/${id}`);
  return response.data;
};

export const createAsset = async (data) => {
  const response = await axiosInstance.post("/api/assets/", data);
  return response.data;
};

export const updateAsset = async (id, data) => {
  const response = await axiosInstance.put(`/api/assets/${id}`, data);
  return response.data;
};

export const deleteAsset = async (id) => {
  const response = await axiosInstance.delete(`/api/assets/${id}`);
  return response.data;
};