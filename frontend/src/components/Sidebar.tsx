// src/components/Sidebar.tsx
// This file contains the Sidebar component which is used for navigation in the application.

import { Link, useLocation } from "react-router-dom";
import { LuLayoutDashboard } from "react-icons/lu";
import { LiaFileInvoiceSolid } from "react-icons/lia";
import { GoGraph } from "react-icons/go";
import { FiUsers } from "react-icons/fi";
import { RiLogoutBoxLine } from "react-icons/ri";



const navItems = [
  { path: "/dashboard", icon: <LuLayoutDashboard />, label: "Dashboard" },
  { path: "/invoices", icon: <LiaFileInvoiceSolid />, label: "Invoices" },
  { path: "/statements", icon: <GoGraph />, label: "Statements" },
  { path: "/clients", icon: <FiUsers />, label: "Clients" },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="w-64 h-screen bg-red-900 text-white p-4 ">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">RardCope Invoice</h1>
      </div>
      <nav>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center p-3 mb-2  ${
              location.pathname === item.path
                ? "bg-gray-700"
                : "hover:bg-gray-500"
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
        className="flex justify-start  items-center mt-auto p-3 hover:bg-gray-700  mt-8"
      >
       <RiLogoutBoxLine />
 Logout
      </button>
    </div>
  );
};