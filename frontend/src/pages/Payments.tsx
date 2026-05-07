// src/pages/Payments.tsx
// Page for creating and listing payments

import { useState, useEffect } from "react";
import api from "../utils/api";
import type { Invoice, Client } from "../types";

export const Payments = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState({
    client: "",
    invoice: "",
    amount: 0,
    date: "",
    description: "",
    cashBookDebit: false, // ✅ New checkbox
  });
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    api.get("/clients").then(({ data }) => setClients(data));
    api.get("/invoices").then(({ data }) => setInvoices(data));
    api.get("/payments").then(({ data }) => setPayments(data));
  }, []);

  const handleClientChange = (clientName: string) => {
    setForm((f) => ({ ...f, client: clientName, invoice: "" }));
  };

  const handleInvoiceChange = (invoiceId: string) => {
    setForm((f) => ({ ...f, invoice: invoiceId }));
  };

  const submit = async () => {
    await api.post("/payments", {
      invoiceId: form.invoice,
      amount: form.amount,
      date: form.date || undefined,
      description: form.description,
      cashBookDebit: form.cashBookDebit, // ✅ Send to backend
    });

    setForm({ 
      client: "", 
      invoice: "", 
      amount: 0, 
      date: "", 
      description: "", 
      cashBookDebit: false 
    });

    const { data } = await api.get("/payments");
    setPayments(data);
  };

  const deletePayment = async (paymentId: string) => {
    if (!confirm("Delete this payment? This will restore the invoice balance.")) return;

    await api.delete(`/payments/${paymentId}`);
    const { data } = await api.get("/payments");
    setPayments(data);
    const invoicesRes = await api.get("/invoices");
    setInvoices(invoicesRes.data);
  };

  const filteredInvoices = invoices.filter((inv) => inv.client.name === form.client);

  return (
    <div className="p-8 overflow-y-scroll h-[94vh]">
      <h1 className="text-[40px] mb-6">Invoice Payments</h1>

      <div className="bg-white p-6  mb-8">
        <h2 className="text-xl font-semibold mb-4">Create Payment</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1">Client</label>
            <select
              value={form.client}
              onChange={(e) => handleClientChange(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select client...</option>
              {clients.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1">Invoice</label>
            <select
              value={form.invoice}
              onChange={(e) => handleInvoiceChange(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={!form.client}
            >
              <option value="">Select invoice...</option>
              {filteredInvoices.map((inv) => (
                <option key={inv._id} value={inv._id}>
                  {inv.invoiceNumber} (${inv.balance.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1">Amount</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, amount: parseFloat(e.target.value) }))
              }
              className="w-full p-2 border rounded"
              min="0.01"
              step="0.01"
            />
          </div>

          <div>
            <label className="block mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block mb-1">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* ✅ NEW CHECKBOX */}
          <div className="flex items-center p-2 mt-6 rounded">
            <input
              id="cashBookDebit"
              type="checkbox"
              checked={form.cashBookDebit}
              onChange={(e) => setForm((f) => ({ ...f, cashBookDebit: e.target.checked }))}
              className="w-5 h-5 text-green-300 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="cashBookDebit" className="ml-2 block text-green-600 uppercase text-gray-900">
                Debit (Primary Cash Book)
            </label>
          </div>
        </div>

        <button
          onClick={submit}
          disabled={!form.invoice || !form.amount}
          className="bg-green-500 text-white px-6 py-2 rounded font-semibold hover:bg-green-600 disabled:bg-gray-400"
        >
          Save Payment
        </button>
      </div>

      <div className="bg-white p-6">
        <h2 className="text-[22px] text-normal mb-4">All Payments</h2>

        <table className="w-full">
          <thead className="bg-gray-50 text-gray-500  border-b-2">
            <tr>
              <th className="px-4 py-2 uppercase font-normal text-left border-l-2">Date</th>
              <th className="px-4 py-2 uppercase font-normal text-left border-l-2">Client</th>
              <th className="px-4 py-2 uppercase font-normal text-left border-l-2">Invoice</th>
              <th className="px-4 py-2 uppercase font-normal text-left border-l-2">Amount</th>
              <th className="px-4 py-2 uppercase font-normal text-left border-l-2">Description</th>
              <th className="px-4 py-2 uppercase font-normal text-left border-l-2">Cash Book</th>
              <th className="px-4 py-2 uppercase font-normal text-left border-l-2">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {payments.map((p, i) => (
              <tr key={i}>
                <td className="px-6 py-3  border-l-2">{new Date(p.date).toLocaleDateString()}</td>
                <td className="px-6 py-3  border-l-2">{p.invoice?.client?.name || "-"}</td>
                <td className="px-6 py-3  border-l-2">{p.invoice?.invoiceNumber || "-"}</td>
                <td className="px-6 py-3  border-l-2">${Number(p.amount).toFixed(2)}</td>
                <td className="px-6 py-3  border-l-2">{p.description || "-"}</td>
                <td className="px-6 py-3  border-l-2">
                  {p.cashBookDebit ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                      Primary Cash Book ✓
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-6 py-3  border-l-2">
                  <button
                    onClick={() => deletePayment(p._id)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};