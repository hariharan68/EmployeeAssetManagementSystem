import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import EmployeePage from "./pages/EmployeePage";
import AssetPage from "./pages/AssetPage";
import AssignmentPage from "./pages/AssignmentPage";
import PendingUsersPage from "./pages/PendingUsersPage";
import UserPortalPage from "./pages/UserPortalPage";
import AdminPortalPage from "./pages/AdminPortalPage";


const App = () => {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Public route — anyone can see login page */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes — must be logged in */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees"
            element={
              <ProtectedRoute>
                <EmployeePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assets"
            element={
              <AdminRoute>
                <AssetPage />
              </AdminRoute>
            }
          />
          <Route
            path="/assignments"
            element={
              <ProtectedRoute>
                <AssignmentPage />
              </ProtectedRoute>
            }
          />


          {/* User CRUDE operations */}
          <Route
            path="/user-portal"
            element={
              <AdminRoute>
                <UserPortalPage/>
              </AdminRoute>
            }
            />

          {/* Admin-only route — approve pending registrations */}
          <Route
            path="/approvals"
            element={
              <AdminRoute>
                <PendingUsersPage />
              </AdminRoute>
            }
          />

         

          {/* Admin modification or add admin */}
          <Route
            path="/admin-portal"
            element={
              <AdminRoute>
                <AdminPortalPage/>
              </AdminRoute>
            }
            />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
};

export default App;