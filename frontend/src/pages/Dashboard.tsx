// src/pages/Dashboard.tsx
// This file contains the Dashboard page component which displays key statistics and recent activity for the user.

import { useState, useEffect } from "react";
import api from "../utils/api";
import type { Invoice } from "../types";

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalClients: 0,
    totalRevenue: 0,
    pending: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [{ data: invoices }, { data: clients }] = await Promise.all([
      api.get("/invoices"),
      api.get("/clients"),
    ]);

    const totalRevenue = invoices.reduce((sum: number, inv: Invoice) => sum + inv.totalAmount, 0);
    const pending = invoices.reduce((sum: number, inv: Invoice) => sum + inv.balance, 0);

    setStats({
      totalInvoices: invoices.length,
      totalClients: clients.length,
      totalRevenue,
      pending,
    });
  };

  return (
    <div>
      <h1 className="text-[40px]">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Total Invoices</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalInvoices}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Total Clients</h3>
          <p className="text-3xl font-bold text-green-600">{stats.totalClients}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Total Revenue</h3>
          <p className="text-3xl font-bold text-purple-600">${stats.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Pending</h3>
          <p className="text-3xl font-bold text-red-600">${stats.pending.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold mb-4">Recent Invoices</h3>
          {/* Mini invoice list */}
          <p className="text-gray-500">Recent activity will show here</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <a href="/invoices" className="block p-3 bg-blue-50 rounded hover:bg-blue-100">
              ➕ Create New Invoice
            </a>
            <a href="/clients" className="block p-3 bg-green-50 rounded hover:bg-green-100">
              👥 Add New Client
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};