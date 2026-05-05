// src/pages/Statements.tsx
// This file contains the Statements page component which allows users to view and download statements for their clients.

import { useState } from "react";
import { ClientList } from "../components/ClientList"; // Simplified selector
import { StatementTable } from "../components/StatementTable";

export const Statements = () => {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h1 className="text-3xl font-bold mb-8">Select Client</h1>
        {/* Simplified: use ClientList with onSelect */}
        <div className="bg-white p-6 rounded-lg shadow">
          <p>Click a client from Clients page or add client selector here</p>
          <select
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full p-2 border rounded mt-4"
          >
            <option value="">Choose client...</option>
            <option value="client1">Client 1</option>
            <option value="client2">Client 2</option>
          </select>
        </div>
      </div>

      <div>
        {selectedClientId && (
          <StatementTable />
        )}
      </div>
    </div>
  );
};