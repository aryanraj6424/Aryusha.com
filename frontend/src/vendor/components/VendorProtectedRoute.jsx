import { Navigate } from "react-router-dom";

export default function VendorProtectedRoute({
  children,
}) {
  const vendor = JSON.parse(
    localStorage.getItem("vendor")
  );

  const token =
    localStorage.getItem("vendorToken");

  if (!vendor || !token) {
    return (
      <Navigate
        to="/vendor/login"
        replace
      />
    );
  }

  return children;
}