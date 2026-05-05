// src/components/InvoiceList.tsx
// This file contains the InvoiceList component which displays a list of invoices and allows users to download them.

import { useState, useEffect } from "react";
import api from "../utils/api";
import type { Invoice } from "../types";

export const InvoiceList = ({ onRefresh }: { onRefresh: () => void }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    const { data } = await api.get("/invoices");
    setInvoices(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const downloadInvoice = async (id: string) => {
    // For now, just fetch - add PDF download later
    const { data } = await api.get(`/invoices/${id}`);
    console.log("Download:", data);
    alert("Invoice downloaded (PDF logic to be added)");
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center">Loading...</td>
            </tr>
          ) : invoices.map((invoice) => (
            <tr key={invoice._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-medium">{invoice.invoiceNumber}</td>
              <td className="px-6 py-4">{invoice.client.name}</td>
              <td className="px-6 py-4">${invoice.totalAmount.toFixed(2)}</td>
              <td className="px-6 py-4 font-semibold">${invoice.balance.toFixed(2)}</td>
              <td className="px-6 py-4">{new Date(invoice.createdAt).toLocaleDateString()}</td>
              <td className="px-6 py-4">
                <button
                  onClick={() => downloadInvoice(invoice._id)}
                  className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 mr-2"
                >
                  Download
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};