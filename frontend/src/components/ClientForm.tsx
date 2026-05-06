// src/components/ClientForm.tsx
// This file contains the ClientForm component which is used to create and edit clients in the application.

import { useState } from "react";
import api from "../utils/api";
import type { Client } from "../types";

interface Props {
  client?: Client | null;
  onSuccess: () => void;
}

export const ClientForm = ({ client, onSuccess }: Props) => {
  const [form, setForm] = useState<Partial<Client>>(
    client || { name: "", address: "", phone: "", email: "", vat: "", tin: "" }
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (client?._id) {
        await api.put(`/clients/${client._id}`, form);
      } else {
        await api.post("/clients", form);
      }
      onSuccess();
    } catch (err) {
      alert("Error saving client");
    }
  };

  return (
    <form onSubmit={submit} className="bg-white p-6 rounded-lg shadow ">
      <h2 className="text-xl font-bold mb-4">{client ? "Edit Client" : "New Client"}</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={form.name || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            type="tel"
            value={form.phone || ""}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={form.email || ""}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">TIN</label>
          <input
            type="text"
            value={form.tin || ""}
            onChange={(e) => setForm({ ...form, tin: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Address</label>
        <textarea
          value={form.address || ""}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="w-full p-2 border rounded"
          rows={3}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">VAT</label>
        <input
          type="text"
          value={form.vat || ""}
          onChange={(e) => setForm({ ...form, vat: e.target.value })}
          className="w-full p-2 border rounded"
        />
      </div>

      <button
        type="submit"
        className=" bg-gray-300 hover:text-white py-2 px-4 font-medium hover:bg-gray-600"
      >
        {client ? "Update Client" : "Create Client"}
      </button>
    </form>
  );
};