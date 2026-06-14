import axiosInstance from "./axiosInstance";

export const getAllEmployees = async () => {
  const response = await axiosInstance.get("/api/employees/");
  return response.data;
};

export const getEmployeeById = async (id) => {
  const response = await axiosInstance.get(`/api/employees/${id}`);
  return response.data;
};

export const getEmployeeAssets = async (id) => {
  const response = await axiosInstance.get(`/api/employees/${id}/assets`);
  return response.data;
};

export const createEmployee = async (data) => {
  const response = await axiosInstance.post("/api/employees/", data);
  return response.data;
};

export const updateEmployee = async (id, data) => {
  const response = await axiosInstance.put(`/api/employees/${id}`, data);
  return response.data;
};

export const deleteEmployee = async (id) => {
  const response = await axiosInstance.delete(`/api/employees/${id}`);
  return response.data;
};