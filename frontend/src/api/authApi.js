import axiosInstance from "./axiosInstance";

// Call login endpoint
export const loginUser = async (email, password) => {
  const response = await axiosInstance.post("/api/auth/login", {
    email,
    password,
  });
  return response.data;
};

// Call register endpoint
export const registerUser = async (username, email, password, role) => {
  const response = await axiosInstance.post("/api/auth/register", {
    username,
    email,
    password,
    role,
  });
  return response.data;
};

// Get current logged in user profile
export const getMyProfile = async () => {
  const response = await axiosInstance.get("/api/auth/me");
  return response.data;
};

// Admin: list users awaiting approval
export const getPendingUsers = async () => {
  const response = await axiosInstance.get("/api/auth/pending");
  return response.data;
};

// Admin: approve a user and link them to an employee
export const approveUser = async (userId, employeeId) => {
  const response = await axiosInstance.put(`/api/auth/approve/${userId}`, {
    EmployeeID: employeeId,
  });
  return response.data;
};

// Admin: reject (deactivate) a pending user
export const rejectUser = async (userId) => {
  const response = await axiosInstance.delete(`/api/auth/reject/${userId}`);
  return response.data;
};

// Admin: create a new user or admin directly (already approved)
export const adminCreateUser = async (payload) => {
  const response = await axiosInstance.post("/api/auth/admin/create-user", payload);
  return response.data;
};

// Admin: generate login account for an employee
export const generateEmployeeLogin = async (employeeId) => {
  const response = await axiosInstance.post(`/api/auth/generate-login/${employeeId}`);
  return response.data;
};

// Public: employee sets their own password for the first time
export const setOwnPassword = async (email, password) => {
  const response = await axiosInstance.post("/api/auth/set-password", { email, password });
  return response.data;
};
export const getEmployeesWithLogins = async () => {
  const response = await axiosInstance.get("/api/auth/employees-with-logins");
  return response.data;
};