// frontend/src/pages/Report.tsx
// This file defines the Reports page, which allows users to view and download various financial reports based on selected filters.

import { useState, useEffect } from "react";
import api from "../utils/api";
import type { Invoice, Client, CashBookEntry } from "../types";
import { IoDownloadOutline } from "react-icons/io5";

interface ReportFilters {
  client?: string;
  startDate?: string;
  endDate?: string;
}

export const Reports = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filters, setFilters] = useState<ReportFilters>({});
  const [activeReport, setActiveReport] = useState<"statements" | "primary" | "petty" | "loads" | "invoices">("statements");
  const [data, setData] = useState<any>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/clients").then(({ data }) => setClients(data));
  }, []);

  const fetchReport = async (reportType: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.client) params.append("client", filters.client);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      
      const { data } = await api.get(`/reports/${reportType}?${params.toString()}`);
      setData(data);
    } catch (error) {
      console.error("Failed to fetch report:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (reportType: string) => {
    try {
      const params = new URLSearchParams();
      if (filters.client) params.append("client", filters.client);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      
      const { data } = await api.get(`/reports/${reportType}/pdf?${params.toString()}`, {
        responseType: "blob"
      });
      
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportType.replace('_', ' ').toUpperCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Download failed");
    }
  };

  const updateFilter = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (activeReport) fetchReport(activeReport);
  }, [activeReport, filters]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Reports</h1>

      {/* Report Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-8">
        {[
          { id: "statements", label: "Running Statements" },
          { id: "primary", label: "Primary Cash Book" },
          { id: "petty", label: "Petty Cash Book" },
          { id: "loads", label: "Loads" },
          { id: "invoices", label: "Invoices" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id as any)}
            className={`p-4 rounded-xl font-semibold transition-all ${
              activeReport === tab.id
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xl"
                : "bg-white border-2 border-gray-200 hover:border-indigo-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-xl mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
            <select
              value={filters.client || ""}
              onChange={(e) => updateFilter("client", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Clients</option>
              {clients.map(client => (
                <option key={client._id} value={client._id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {["statements", "loads", "invoices"].includes(activeReport) && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate || ""}
                  onChange={(e) => updateFilter("startDate", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={filters.endDate || ""}
                  onChange={(e) => updateFilter("endDate", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 capitalize">
            {activeReport.replace('_', ' ')}
          </h2>
          <button
            onClick={() => downloadPDF(activeReport)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            <IoDownloadOutline className="text-xl" />
            Download PDF
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading report...</div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No data found for selected filters
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Description / Invoice
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Client / Reference
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Debit
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Credit
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map((row: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(row.date || row.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                      {row.description || row.invoiceNumber || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {row.clientName || row.reference || row.client?.name || "-"}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-green-600">
                      ${Number(row.debit || row.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-red-600">
                      ${Number(row.credit || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                      ${Number(row.balance || row.balanceDue || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

