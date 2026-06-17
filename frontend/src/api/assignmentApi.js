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

export const submitReturnRequest = async (assignmentId, reason) => {
  const response = await axiosInstance.post(
    `/api/assignments/return-request/${assignmentId}`,
    { reason }
  );
  return response.data;
};

export const getReturnRequests = async () => {
  const response = await axiosInstance.get("/api/assignments/return-requests");
  return response.data;
};

export const approveReturnRequest = async (requestId) => {
  const response = await axiosInstance.put(`/api/assignments/return-request/approve/${requestId}`);
  return response.data;
};

export const ignoreReturnRequest = async (requestId) => {
  const response = await axiosInstance.put(`/api/assignments/return-request/ignore/${requestId}`);
  return response.data;
};

export const getMyReturnRequests = async () => {
  const response = await axiosInstance.get("/api/assignments/my-return-requests");
  return response.data;
};