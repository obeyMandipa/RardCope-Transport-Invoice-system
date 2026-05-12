// frontend/src/pages/Report.tsx
import { useState, useEffect } from "react";
import api from "../utils/api";
import type { Invoice, Client, CashBookEntry } from "../types";
import { IoDownloadOutline } from "react-icons/io5";
import { FaFileExcel } from "react-icons/fa";

interface ReportFilters {
  client?: string;
  startDate?: string;
  endDate?: string;
}

export const Reports = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filters, setFilters] = useState<ReportFilters>({});
  const [activeReport, setActiveReport] = useState<"runningstatements" | "cashbook" | "pettycashbook" | "loads" | "invoices">("runningstatements");
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
    
    const response = await api.get(`/reports/${reportType}/pdf?${params.toString()}`, {
      responseType: "blob"
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType.replace('_', ' ').toUpperCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
  } catch (error) {
    alert("Download failed");
  }
};

  const downloadExcel = async (reportType: string) => {
    try {
      const params = new URLSearchParams();
      if (filters.client) params.append("client", filters.client);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      params.append("noHeader", "1"); // Remove header row as requested
      const response = await api.get(`/reports/${reportType}/excel?${params.toString()}`,
        { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportType.replace('_', ' ').toUpperCase()}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch (error) {
      alert("Excel export failed");
    }
  };

  const updateFilter = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (activeReport) fetchReport(activeReport);
  }, [activeReport, filters]);

  return (
    <div className="">
      <div className="">
        <h1 className="text-[40px] mb-8">Reports</h1>

        <div className="mb-4 space-x-4">
          {[
            { id: "runningstatements", label: "Running Statements" },
            { id: "cashbook", label: "Primary Cash Book" },
            { id: "pettycashbook", label: "Petty Cash Book" },
            { id: "loads", label: "Loads" },
            { id: "invoices", label: "Invoices" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id as any)}
              className={`p-2 w-[200px] font-semibold transition-all ${
                activeReport === tab.id
                  ? "text-white bg-red-900"
                  : "bg-white text-gray-700 hover:text-red-900 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-y-scroll h-[70vh]">
        {/* Filters */}
        <div className="bg-white p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
              <select
                value={filters.client || ""}
                onChange={(e) => updateFilter("client", e.target.value)}
                className="w-full p-3 border border-gray-300"
              >
                <option value="">All Clients</option>
                {clients.map(client => (
                  <option key={client._id} value={client._id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {["runningstatements", "loads", "invoices"].includes(activeReport) && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate || ""}
                    onChange={(e) => updateFilter("startDate", e.target.value)}
                    className="w-full p-3 border border-gray-300 focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate || ""}
                    onChange={(e) => updateFilter("endDate", e.target.value)}
                    className="w-full p-3 border border-gray-300 focus:ring-2"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Report Table */}
        <div className="bg-white   overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 capitalize">
              {activeReport.replace('_', ' ')}
            </h2>
            
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadPDF(activeReport)}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-300 hover:bg-gray-600 hover:text-white rounded"
                    title="Download PDF"
                  >
                    <IoDownloadOutline className="text-xl" />
                    PDF
                  </button>
                  <button
                    onClick={() => downloadExcel(activeReport)}
                    className="flex items-center gap-2 px-6 py-3 bg-green-200 hover:bg-green-600 hover:text-white rounded"
                    title="Export to Excel"
                  >
                    <FaFileExcel className="text-xl" />
                    Excel
                  </button>
                </div>
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
                <thead className="text-gray-500  bg-gray-50">
                  <tr>
                    {activeReport === "loads" ? (
                      <>
                        <th className="border-l-2 px-6 py-4 text-left  font-normal uppercase tracking-wider">
                          Date
                        </th>
                        <th className="border-l-2 px-6 py-4 text-left font-normal text-gray-900 uppercase tracking-wider">
                          Client Name
                        </th>
                        <th className="border-l-2 px-6 py-4 text-left font-normal uppercase tracking-wider">
                          Description
                        </th>
                        <th className="border-l-2 px-6 py-4 text-rightnormal font-normal uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="border-l-2 px-6 py-4 text-right font-normal uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="border-l-2 px-6 py-4 text-right font-normal0 uppercase tracking-wider">
                          Total
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="border-l-2 px-6 py-4 text-left font-normal uppercase ">
                          Date
                        </th>
                        <th className="border-l-2 px-6 py-4 text-left font-normal uppercase">
                          Transaction Details
                        </th>
                        <th className="border-l-2 px-6 py-4 text-right font-normal uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="border-l-2 px-6 py-4 text-right font-normal uppercase tracking-wider">
                          Payment
                        </th>
                        <th className="border-l-2 px-6 py-4 text-right font-normal uppercase tracking-wider">
                          Balance
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-gray-200">
                  {data.map((row: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {activeReport === "loads" ? (
                        <>
                          <td className="border-l-2 px-6 py-4 whitespace-nowrap">
                            {new Date(row.date || row.createdAt).toLocaleDateString()}
                          </td>
                          <td className="border-l-2 px-6 py-4 text-sm ">
                            {row.clientName || row.client?.name || '-'}
                          </td>
                          <td className="border-l-2 px-6 py-4  max-w-md">
                            {row.description || '-'}
                            {/* {row.description || row.invoiceNumber || '-'} */}
                          </td>
                          <td className="border-l-2 px-6 py-4 text-right">
                            {row.quantity?.toLocaleString() || row.debit?.toLocaleString() || '-'}t
                          </td>
                          <td className="border-l-2 px-6 py-4 text-right">
                            ${row.unitPrice ? Number(row.unitPrice).toFixed(2) : '-'}
                          </td>
                          <td className="border-l-2 px-6 py-4 text-right">
                            ${Number(row.total || row.balance || 0).toLocaleString()}
                          </td>
                        </>
                      ) : (
                        // ... other reports unchanged
                        <>
                          <td className="border-l-2 px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(row.date || row.createdAt).toLocaleDateString()}
                          </td>
                          <td className="border-l-2 px-6 py-4 text-sm">
                            <span > {row.description} </span>
                            <div className="text-sm text-gray-600 mt-1">{row.details}</div>
                          </td>
                          <td className="border-l-2 px-6 py-4 text-right text-sm font-normal text">
                            {row.debit ? `$${Number(row.debit).toLocaleString()}` : '-'}
                          </td>
                          <td className="border-l-2 px-6 py-4 text-right text-sm font-normal">
                            {row.credit ? `$${Number(row.credit).toLocaleString()}` : '-'}
                          </td>
                          <td className="border-l-2 px-6 py-4 text-right text-sm font-normal">
                            ${Number(row.balance || 0).toLocaleString()}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>

                {/* ✅ NEW: LOADS TOTALS FOOTER */}
                {activeReport === "loads" && (
                  <tfoot className="">
                    <tr>
                      <th colSpan={3} className="border-l-2 px-6 py-4 text-left text-lg font-normal">
                        TOTALS
                      </th>
                      <th className="border-l-2 px-6 py-4 text-right text-lg font-normal">
                        {data.reduce((sum: number, row: any) => sum + (row.quantity || row.debit || 0), 0).toLocaleString()}t
                      </th>
                      <th className="border-l-2 px-6 py-4 text-right text-lg font-bold text-gray-900">
                        -
                      </th>
                      <th className="border-l-2 px-6 py-4 text-right text-xl font-normal">
                        ${data.reduce((sum: number, row: any) => sum + Number(row.total || row.balance || 0), 0).toLocaleString()}
                      </th>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
      </div>
     </div>
    </div>
  );
};