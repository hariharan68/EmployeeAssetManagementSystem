import { createContext, useContext, useState } from "react";

// Step 1 — Create the context object
// This is the notice board
const AuthContext = createContext(null);

// Step 2 — Create the Provider
// This is the person who manages the notice board
// Wrap your entire app with this so everyone can read the board
export const AuthProvider = ({ children }) => {

  // Read from localStorage so login persists after page refresh
  const [token, setToken]       = useState(localStorage.getItem("token"));
  const [role, setRole]         = useState(localStorage.getItem("role"));
  const [username, setUsername] = useState(localStorage.getItem("username"));

  // This function runs when user logs in successfully
  const login = (tokenValue, roleValue, usernameValue) => {
    // Save to state so components re-render immediately
    setToken(tokenValue);
    setRole(roleValue);
    setUsername(usernameValue);

    // Save to localStorage so it survives page refresh
    localStorage.setItem("token", tokenValue);
    localStorage.setItem("role", roleValue);
    localStorage.setItem("username", usernameValue);
  };

  // This function runs when user clicks logout
  const logout = () => {
    // Clear state
    setToken(null);
    setRole(null);
    setUsername(null);

    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
  };

  // isAdmin is a computed value
  // True if role is Admin, false otherwise
  const isAdmin = role === "Admin";

  // isLoggedIn is true if token exists
  const isLoggedIn = !!token;

  return (
    <AuthContext.Provider
      value={{ token, role, username, isAdmin, isLoggedIn, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Step 3 — Create a custom hook
// Instead of writing useContext(AuthContext) everywhere
// you just write useAuth() which is cleaner
export const useAuth = () => useContext(AuthContext);