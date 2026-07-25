import { Navigate, useLocation } from "react-router-dom";

export default function CustomerProtectedRoute({ children }) {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!user || !user._id) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
