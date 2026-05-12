// src/components/StatementTable.tsx
// This file contains the StatementTable component which displays a client's statement of transactions and allows downloading it as a PDF.

import { useState, useEffect } from "react";
import api from "../utils/api";
import type { StatementRow } from "../types";

interface Props {
  clientName: string; // ✅ Receive clientName prop
}

interface StatementResponse {
  client: string;
  clientId: string;
  period: { from: string; to: string };
  totals: {
    invoices: number;
    totalAmount: number;
    totalPaid: number;
    totalBalance: number;
  };
  statement: StatementRow[];
}

export const StatementTable = ({ clientName }: Props) => {
  const [data, setData] = useState<StatementResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (clientName) {
      fetchStatement();
    }
  }, [clientName]);

  const fetchStatement = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/runningstatements/${encodeURIComponent(clientName)}`);
      setData(data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load statement");
      console.error("Statement fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const downloadStatementPDF = async () => {
    try {
      // Backend PDF endpoint (add later)
      const response = await api.get(`/runningstatements/${encodeURIComponent(clientName)}/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `statement-${clientName}-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // Fallback: Print to PDF
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-600">Loading statement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <div className="text-2xl text-red-600 mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-red-800 mb-2">Error</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={fetchStatement}
          className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data || data.statement.length === 0) {
    return (
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-12 rounded-xl border-2 border-dashed border-yellow-200 text-center">
        <div className="text-6xl mb-6">📋</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Invoices</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          No invoices found for <strong>"{clientName}"</strong>
        </p>
        <button
          onClick={fetchStatement}
          className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600"
        >
          Refresh
        </button>
      </div>
    );
  }

  const { client, totals, statement, period } = data;
  const totalBalance = totals.totalBalance;

  return (
    <div>
      {/* Print-optimized Table */}
      <div className=" overflow-hidden print:shadow-none print:rounded-none print:border print:border-gray-300">
        
        {/* Summary Header */}
        <div className="p-8 bg-gradient-to-r from-gray-50 to-gray-100 print:bg-white print:p-6 border-b-2 print:border-gray-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm print:text-base">
            <div>
              <strong>Statement Period:</strong><br />
              <span className="font-semibold">{period.from} - {period.to}</span>
            </div>
            <div>
              <strong>Total Invoices:</strong><br />
              <span className=" text-2xl text-indigo-600">{totals.invoices}</span>
            </div>
            <div className="text-right lg:text-left">
              <strong>Summary:</strong><br />
              <span className="text-lg">Amount: ${totals.totalAmount.toLocaleString()}</span><br />
              <span className="text-lg">Paid: ${totals.totalPaid.toLocaleString()}</span><br />
              <span className={`text-2xl font-normal font-black ${totalBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                Balance: ${totalBalance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto p-2 mt-[40px]">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                    <th className=" border-l-2 px-6 py-4 text-gray-500 text-left font-normal uppercase tracking-wide">Date</th>
                    <th className=" border-l-2 px-6 py-4 text-gray-500 text-left font-normal uppercase tracking-wide">Transaction</th>
                    <th className=" border-l-2 px-6 py-4 text-gray-500 text-left font-normal uppercase tracking-wide">Details</th>
                    <th className=" border-l-2 px-6 py-4 text-gray-500 text-right font-normal uppercase tracking-wide">Amount</th>
                    <th className=" border-l-2 px-6 py-4 text-gray-500 text-right font-normal uppercase tracking-wide">Payment</th>
                    <th className=" border-l-2 px-6 py-4 text-gray-500 text-right font-normal uppercase tracking-wide">Balance</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {statement.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 print:hover:bg-white transition-colors h-16">
                  <td className="border-l-2 px-6 py-4 whitespace-nowrap text-sm  text-gray-900 print:text-base print:py-3">
                    {new Date(row.date).toLocaleDateString()}
                  </td>
                  <td className=" border-l-2 px-6 py-4 ">
                    <span className="text-sm px-3 py-1 rounded-full text-indigo-800 print:bg-transparent print:px-0 print:font-bold print:text-base">
                        {row.type === "invoice" ? `Invoice (${row.transaction})` : `Payment (${row.invoiceNumber})`}
                    </span>
                  </td>
                  <td className=" border-l-2 px-6 py-4 text-sm text-gray-900 max-w-md truncate print:max-w-none print:text-base">
                    {row.details}
                  </td>
                  <td className=" border-l-2 px-6 py-4 text-right print:text-right">
                    {row.amount === "" ? "" : `$${Number(row.amount).toLocaleString()}`}
                  </td>
                  <td className=" border-l-2 px-6 py-4 text-right print:text-right">
                    {row.payment === "" ? "" : `$${Number(row.payment).toLocaleString()}`}
                  </td>
                  <td className=" border-l-2 px-6 py-4 text-right print:text-right">
                    <span className={` px-3 py-2 rounded-lg print:text-2xl print:py-1 ${
                      row.balance > 0 
                    }`}>
                      ${Number(row.balance).toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={downloadStatementPDF}
            className="flex-1 lg:flex-none  border-2 bg-gray-300 px-8 py-3 mt-4"
          >
            Download PDF
          </button>
        </div>

        {/* Print Footer */}
        {/* <div className="print:block hidden p-12 bg-gradient-to-r from-gray-50 to-white border-t-4 border-gray-200">
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">Thank you for your business!</p>
            <p className="text-sm text-gray-600 mb-4">Generated on {new Date().toLocaleString()}</p>
            <div className="border-t pt-4">
              <p className="font-bold text-indigo-600">InvoicePro - Professional Invoicing System</p>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};