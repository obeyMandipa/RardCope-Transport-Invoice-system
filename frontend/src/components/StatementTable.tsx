// src/components/StatementTable.tsx
// This file contains the StatementTable component which displays a client's statement of transactions and allows downloading it as a PDF.

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../utils/api";
import type { StatementRow } from "../types";

export const StatementTable = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [statement, setStatement] = useState<StatementRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clientId) fetchStatement();
  }, [clientId]);

  const fetchStatement = async () => {
    setLoading(true);
    const { data } = await api.get(`/statements/${clientId}`);
    setStatement(data);
    setLoading(false);
  };

  const downloadStatement = () => {
    // PDF logic here
    console.log("Download statement for client:", clientId);
    alert("Statement downloaded (PDF logic to be added)");
  };

  if (!clientId) return <div>Select a client</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Client Statement</h2>
        <button
          onClick={downloadStatement}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Download PDF
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Payment</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">Loading...</td>
              </tr>
            ) : statement.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-6 py-4">{new Date(row.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-medium">{row.transaction}</td>
                <td className="px-6 py-4">{row.details}</td>
                <td className="px-6 py-4 text-right">${row.amount.toFixed(2)}</td>
                <td className="px-6 py-4 text-right">${row.payment.toFixed(2)}</td>
                <td className="px-6 py-4 text-right font-semibold">${row.balance.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};