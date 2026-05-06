// src/components/InvoiceList.tsx
// This file contains the InvoiceList component which displays a list of invoices and allows users to download them.

import { useState, useEffect } from "react";
import api from "../utils/api";
import type { Invoice } from "../types";
import { IoIosClose } from "react-icons/io";
import { IoDownloadOutline } from "react-icons/io5";



export const InvoiceList = ({ onRefresh }: { onRefresh: () => void }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null); // ✅ View state

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/invoices");
      setInvoices(data);
    } catch (error) {
      console.error("Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [onRefresh]);

  const handleViewInvoice = async (id: string) => {
    try {
      const { data } = await api.get(`/invoices/${id}`);
      setViewInvoice(data);
    } catch (error) {
      alert("Failed to load invoice");
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const { data } = await api.get(`/invoices/${id}`);
      // Simulate PDF download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.invoiceNumber}.json`;
      a.click();
    } catch (error) {
      alert("Download failed");
    }
  };

  if (loading) return <div className="text-center py-8">Loading invoices...</div>;

  return (
    <div className="">
      {/* Invoice Table */}
      <div className="bg-white rounded-lg shadow  mb-8">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-gray-500 text-left font-normal uppercase">Invoice</th>
              <th className="px-6 py-3 text-gray-500 text-left font-normal uppercase">Client</th>
              <th className="px-6 py-3 text-gray-500 text-right font-normal uppercase">Total</th>
              <th className="px-6 py-3 text-gray-500 text-right font-normal uppercase">Balance</th>
              <th className="px-6 py-3 text-gray-500 text-left font-normal uppercase">Date</th>
              <th className="px-6 py-3 text-gray-500 text-left font-normal uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoices.map((invoice) => (
              <tr key={invoice._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-sm font-semibold">
                  {invoice.invoiceNumber}
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium">{invoice.client.name}</div>
                  <div className="text-sm text-gray-500">{invoice.client.email}</div>
                </td>
                <td className="px-6 py-4 text-right ">
                  ${invoice.totalAmount.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right ">
                  ${invoice.balance.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(invoice.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <button
                    onClick={() => handleViewInvoice(invoice._id)}
                    className="text-blue-300 px-3 py-1 rounded font-medium hover:text-blue-600 "
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDownload(invoice._id)}
                    className="text-green-300 px-3 py-1 rounded font-medium hover:text-green-600"
                  >
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ VIEW INVOICE MODAL */}
      {viewInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-4 ">
                <div className=" w-full flex ">
                  <button
                      onClick={() => setViewInvoice(null)}
                      className="flex justify-end bg-red-400 p-2 rounded-full text-[20px] "
                      >
                      <IoIosClose />
                  </button>
                </div> <br />
                
              {/* Header */}
              <div className="flex justify-between items-start mb-8 border-b pb-6">
                <div>
                  <h1 className="mb-2">
                    Invoice No: {viewInvoice.invoiceNumber}
                  </h1>
                  <p className="text-[18px]  mb-1">
                    {viewInvoice.client.name}
                  </p>
                  <p className="">
                    {viewInvoice.client.email} • {viewInvoice.client.phone}
                  </p>
                </div>
              </div>

              {/* ✅ ITEMS TABLE - Shows ALL Descriptions */}
              <div className="mb-8">
                <h3 className="text-[23px]  mb-4">Invoice Items</h3>
                <div className="bg-gray-50 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-white">
                      <tr>
                        <th className="px-6 py-4 text-left uppercase font-normal border-r-2">Date</th>
                        <th className="px-6 py-4 text-left uppercase font-normal border-r-2">Description</th>
                        <th className="px-6 py-4 text-right uppercase font-normal border-r-2">Qty</th>
                        <th className="px-6 py-4 text-right uppercase font-normal border-r-2">Unit Price</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {viewInvoice.items.map((item, i) => (
                        <tr key={i} className="hover:bg-white border-b-2 border-t-2 border-gray-200">
                          <td className="px-6 py-4  border-r-2">
                            {new Date(viewInvoice.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 border-r-2">
                            <div className="text-gray-900 ">{item.description}</div>
                          </td>
                          <td className="px-6 py-4 text-right  border-r-2">{item.quantity}</td>
                          <td className="px-6 py-4 text-right border-r-2">
                            ${item.unitPrice.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right  ">
                            ${item.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="  mb-8 text-lg">
                <div className="space-y-2 flex flex-col justify-end items-end">
                  <div>Paid: <span className="font-semibold">${viewInvoice.paid.toFixed(2)}</span></div>
                  <div className="text-[20px] border-t pt-2">
                    Balance: ${viewInvoice.balance.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className=" ml-8 flex justify-start border-t pt-6">
                <div>
                    BANKING DETAILS <br />
                    BANK: ZB <br />
                    ACC NAME: 4125469593405 <br />
                    BRANCH: WESTGATE <br />
                    ACCOUNT: 4125469593405 <br />
                    PHONE: 0779 711 229 <br />
                </div>
                </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-6">
                <button
                  onClick={() => handleDownload(viewInvoice._id)}
                  className="flex justify-center items-center bg-gray-400 py-3 px-8 "
                >
                  <IoDownloadOutline className="text-[25px]" /> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};