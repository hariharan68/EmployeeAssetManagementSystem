import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// This component wraps any page that requires login
// If not logged in it redirects to login page
// If logged in it shows the page normally
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;