// src/pages/Payments.tsx
import { useState, useEffect } from "react";
import api from "../utils/api";
import type { Invoice, Client } from "../types";

export const Payments = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState({
    clientId: "",
    invoiceId: "",
    amount: 0,
    date: "",
    description: "",
    cashBookDebit: false,
  });
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [clientsRes, invoicesRes, paymentsRes] = await Promise.all([
      api.get("/clients"),
      api.get("/invoices"),
      api.get("/payments")
    ]);
    setClients(clientsRes.data);
    setInvoices(invoicesRes.data);
    setPayments(paymentsRes.data);
  };

  const handleClientChange = (clientId: string) => {
    setForm((f) => ({ ...f, clientId, invoiceId: "" }));
  };

  const handleInvoiceChange = (invoiceId: string) => {
    setForm((f) => ({ ...f, invoiceId }));
  };

  const submit = async () => {
    setLoading(true);
    try {
      await api.post("/payments", {
        clientId: form.clientId,
        invoiceId: form.invoiceId || undefined,
        amount: form.amount,
        date: form.date || undefined,
        description: form.description,
        cashBookDebit: form.cashBookDebit,
      });

      setForm({ 
        clientId: "", 
        invoiceId: "", 
        amount: 0, 
        date: "", 
        description: "", 
        cashBookDebit: false 
      });

      await loadData();
      alert("Payment created! Auto-allocated across outstanding invoices.");
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to create payment");
    } finally {
      setLoading(false);
    }
  };

  const deletePayment = async (paymentId: string) => {
    if (!confirm("Delete this payment? This will restore the invoice balance.")) return;

    await api.delete(`/payments/${paymentId}`);
    await loadData();
  };

  const filteredInvoices = invoices.filter((inv) => 
    inv.client._id === form.clientId && inv.balance > 0
  );
  const totalOutstanding = filteredInvoices.reduce((sum, inv) => sum + inv.balance, 0);

  return (
    <div className="p-8">
      <h1 className="text-[40px] mb-6">Invoice Payments</h1>

      <div className="overflow-y-scroll h-[80vh]">
        {/* Form - Original Layout */}
        <div className="bg-white p-6 mb-8">
          <h2 className="text-[22px] mb-4">Create Payment</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1">Client *</label>
              <select
                value={form.clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full p-2 border rounded"
                disabled={loading}
                required
              >
                <option value="">Select client...</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {form.clientId && (
                <div className="text-xs text-gray-500 mt-1">
                  Total Outstanding: ${totalOutstanding.toLocaleString()} ({filteredInvoices.length} invoices)
                </div>
              )}
            </div>

            <div>
              <label className="block mb-1">First Invoice (optional)</label>
              <select
                value={form.invoiceId}
                onChange={(e) => handleInvoiceChange(e.target.value)}
                className="w-full p-2 border rounded"
                disabled={!form.clientId || loading}
              >
                <option value="">Auto-allocate to oldest first</option>
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
                  setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))
                }
                className="w-full p-2 border rounded"
                min="0.01"
                step="0.01"
                disabled={loading}
                placeholder={`Max: ${totalOutstanding.toFixed(2)}`}
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
                placeholder="Payment reference"
              />
            </div>

            {/* Checkbox */}
            <div className="flex items-center p-2 mt-6 rounded">
              <input
                id="cashBookDebit"
                type="checkbox"
                checked={form.cashBookDebit}
                onChange={(e) => setForm((f) => ({ ...f, cashBookDebit: e.target.checked }))}
                className="w-5 h-5 text-green-300 border-gray-300 rounded focus:ring-green-500"
                disabled={loading}
              />
              <label htmlFor="cashBookDebit" className="ml-2 block uppercase text-gray-900 text-sm">
                Debit (Primary Cash Book)
              </label>
            </div>
          </div>

          <button
            onClick={submit}
            disabled={!form.clientId || !form.amount || loading}
            className="bg-green-500 text-white px-6 py-2 hover:bg-green-600 disabled:bg-gray-400 w-full"
          >
            {loading ? "Processing..." : "Save Payment"}
          </button>
        </div>

        {/* Table - Original Layout */}
        <div className="bg-white p-6">
          <h2 className="text-[22px] mb-4">All Payments</h2>

          <table className="w-full">
            <thead className="bg-gray-50 text-gray-500 border-b-2">
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
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-3 border-l-2">{new Date(p.date).toLocaleDateString()}</td>
                  <td className="px-6 py-3 border-l-2">{p.invoice?.client?.name || "-"}</td>
                  <td className="px-6 py-3 border-l-2">{p.invoice?.invoiceNumber || "-"}</td>
                  <td className="px-6 py-3 border-l-2">${Number(p.amount).toFixed(2)}</td>
                  <td className="px-6 py-3 border-l-2">{p.description || "-"}</td>
                  <td className="px-6 py-3 border-l-2">
                    {p.cashBookDebit ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                        Primary Cash Book ✓
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-6 py-3 border-l-2">
                    <button
                      onClick={() => deletePayment(p._id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                      disabled={loading}
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
    </div>
  );
};