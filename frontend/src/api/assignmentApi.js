import axiosInstance from "./axiosInstance";

export const getAllAssignments = async () => {
  const response = await axiosInstance.get("/api/assignments/");
  return response.data;
};

export const getAssignmentsByEmployee = async (employeeId) => {
  const response = await axiosInstance.get(
    `/api/assignments/employee/${employeeId}`
  );
  return response.data;
};

export const assignAsset = async (data) => {
  const response = await axiosInstance.post("/api/assignments/assign", data);
  return response.data;
};

export const returnAsset = async (assignmentId, data) => {
  const response = await axiosInstance.put(
    `/api/assignments/return/${assignmentId}`,
    data
  );
  return response.data;
};