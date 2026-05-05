// src/App.tsx
// This file contains the main App component which sets up the routing for the frontend application using React Router.

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Dashboard } from "./pages/Dashboard";
import { Invoices } from "./pages/Invoices";
import { Statements } from "./pages/Statements";
import { Clients } from "./pages/Clients";
import { Sidebar } from "./components/Sidebar";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  return token ? <>{children}</> : <Navigate to="/login" />;
};

export default function App() {
  return (
    <Router>
      <div className="flex">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <>
                  <Sidebar />
                  <div className="flex-1 p-8">
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/invoices" element={<Invoices />} />
                      <Route path="/statements" element={<Statements />} />
                      <Route path="/clients" element={<Clients />} />
                      <Route path="/" element={<Navigate to="/dashboard" />} />
                    </Routes>
                  </div>
                </>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}