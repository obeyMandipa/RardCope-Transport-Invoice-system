// src/components/ClientList.tsx
// This file contains the ClientList component which displays a list of clients and allows users to create, edit, and delete clients.

import { useState, useEffect } from "react";
import api from "../utils/api";
import type { Client } from "../types";
import { ClientForm } from "./ClientForm";

export const ClientList = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    const { data } = await api.get("/clients");
    setClients(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const refresh = () => {
    setShowForm(false);
    setSelectedClient(null);
    fetchClients();
  };

  const deleteClient = async (id: string) => {
    if (confirm("Delete this client?")) {
      await api.delete(`/clients/${id}`);
      refresh();
    }
  };

  return (
    <div className=" h-[84vh] overflow-y-scroll p-2 ">
      <div className="  flex justify-between items-center mb-6">
        <h2 className="text-[]"></h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gray-300 text-black hover:text-white px-4 py-2 hover:bg-gray-600"
        >
          New Client
        </button>
      </div>

      {showForm && (
        <div className="mb-8">
          <ClientForm client={selectedClient} onSuccess={refresh} />
        </div>
      )}
        <h1 className="text-[22px]">Client list</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-gray-500 font-normal uppercase">Name</th>
              <th className="px-6 py-3 text-left text-gray-500 font-normal uppercase">Email</th>
              <th className="px-6 py-3 text-left text-gray-500 font-normal uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-gray-500 font-normal uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center">Loading...</td>
              </tr>
            ) : clients.map((client) => (
              <tr key={client._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{client.name}</td>
                <td className="px-6 py-4">{client.email}</td>
                <td className="px-6 py-4">{client.phone}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => setSelectedClient(client)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteClient(client._id)}
                    className="text-red-600 hover:text-red-900"
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