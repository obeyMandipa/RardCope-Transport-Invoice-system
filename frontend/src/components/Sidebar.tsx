// src/components/Sidebar.tsx
// This file contains the Sidebar component which is used for navigation in the application.

import { Link, useLocation } from "react-router-dom";

const navItems = [
  { path: "/dashboard", icon: "📊", label: "Dashboard" },
  { path: "/invoices", icon: "📄", label: "Invoices" },
  { path: "/statements", icon: "📈", label: "Statements" },
  { path: "/clients", icon: "👥", label: "Clients" },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="w-64 h-screen bg-gray-800 text-white p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">InvoicePro</h1>
      </div>
      <nav>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center p-3 mb-2 rounded-lg ${
              location.pathname === item.path
                ? "bg-blue-600"
                : "hover:bg-gray-700"
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <button
        onClick={() => {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }}
        className="mt-auto w-full p-3 bg-red-600 rounded-lg mt-8"
      >
        Logout
      </button>
    </div>
  );
};