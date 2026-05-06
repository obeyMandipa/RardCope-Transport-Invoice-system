// src/pages/Statements.tsx
// This file contains the Statements page component which allows users to view and download statements for their clients.

import { useState, useEffect } from "react";
import api from "../utils/api";
import type { Client } from "../types";
import { StatementTable } from "../components/StatementTable";

export const Statements = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch real clients from API
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data } = await api.get("/clients");
        setClients(data);
      } catch (error) {
        console.error("Failed to fetch clients:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading clients...</div>
      </div>
    );
  }

  return (
    <div className="w-full pr-8 ">
      <h1 className="text-[40px] mb">Statements</h1>
      
      <div className="h-[84vh] overflow-y-scroll">
        {/* ✅ Client Selector */}
        <div className="bg-white mt-8">
          <h2 className="text-[22px]">Select Client</h2>
          
          <div className="relative mt-4">
            <select
              value={selectedClientName || ""}
              onChange={(e) => setSelectedClientName(e.target.value || null)}
              className="w-full p-4 border-2 "
            >
              <option value="">Choose a client to view statement</option>
              {clients.map((client) => (
                <option key={client._id} value={client.name}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {clients.length === 0 && (
            <div className="mt-6 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
              <p className="text-yellow-800 font-medium">
                💡 No clients yet? 
              </p>
            </div>
          )}
        </div>

        {/* ✅ Statement Table */}
        <div className=" w-full mt-12">
          {selectedClientName ? (
            <StatementTable clientName={selectedClientName} />
          ) : (
            <div className=" p-12  text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Client Selected</h3>
              
            </div>
          )}
        </div>
      </div>
    </div>
  );
};