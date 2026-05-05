// src/components/InvoiceForm.tsx
// This file contains the InvoiceForm component which is used to create new invoices in the application.

import { useState } from "react";
import api from "../utils/api";
import type { LineItem } from "../types";

export const InvoiceForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [form, setForm] = useState({
    client: "",
    items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }], // ✅ Add total: 0
    dueDate: "",
    notes: "",
  });

  const addItem = () =>
    setForm({ ...form, items: [...form.items, { description: "", quantity: 1, unitPrice: 0, total: 0 }] });

  const updateItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };
    newItems[index].total = newItems[index].quantity * newItems[index].unitPrice; // ✅ Now works
    setForm({ ...form, items: newItems });
  };

  const submit = async () => {
    try {
      await api.post("/invoices", {
        client: form.client,
        items: form.items.filter(item => item.description && item.total > 0), // ✅ Filter empty items
        dueDate: form.dueDate || undefined,
        notes: form.notes || undefined,
      });
      onSuccess();
    } catch (error) {
      alert("Failed to create invoice");
    }
  };

  const totalAmount = form.items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-[25px] mb-4">New Invoice</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Client Name</label>
        <input
          type="text"
          placeholder="Put client name here"
          value={form.client}
          onChange={(e) => setForm({ ...form, client: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div className="space-y-3 mb-6">
        {form.items.map((item, i) => (
          <div key={i} className="grid grid-cols-4 gap-2 items-end p-3 bg-gray-50 rounded-lg">
            <input
              placeholder="Description"
              value={item.description}
              onChange={(e) => updateItem(i, "description", e.target.value)}
              className="p-2 border rounded col-span-2"
              required
            />
            <div className="grid grid-cols-3 gap-1">
              <input
                type="number"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => updateItem(i, "quantity", parseFloat(e.target.value) || 0)}
                className="p-2 border rounded text-sm"
                min="0"
                step="0.01"
              />
              <input
                type="number"
                placeholder="$/unit"
                value={item.unitPrice}
                onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                className="p-2 border rounded text-sm"
                min="0"
                step="0.01"
              />
              <div className="p-2 font-bold text-right bg-white rounded text-sm">
                ${(item.total || 0).toFixed(2)}
              </div>
            </div>
            {form.items.length > 1 && (
              <button
                type="button"
                onClick={() => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) })}
                className="col-span-4 text-red-500 hover:text-red-700 text-sm mt-1"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mb-4 p-4 bg-blue-50 rounded-lg">
        <button
          type="button"
          onClick={addItem}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
        >
          ➕ Add Item
        </button>
        <div className="text-xl font-bold text-blue-600">
          Total: ${totalAmount.toFixed(2)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Due Date</label>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <input
            type="text"
            placeholder="Optional notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>

      <button
        onClick={submit}
        disabled={!form.client || totalAmount === 0}
        className="w-full bg-green-500 text-white px-6 py-3 rounded font-semibold hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        ✅ Create & Save Invoice
      </button>
    </div>
  );
};