import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// This component wraps any page that requires Admin role
// If not Admin it redirects to dashboard
// If Admin it shows the page normally
const AdminRoute = ({ children }) => {
  const { isLoggedIn, isAdmin } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;