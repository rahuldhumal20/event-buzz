import { Navigate } from "react-router-dom";
import { isAdmin } from "../services/auth";

export default function AdminRoute({ children }) {
  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }
  return children;
}
