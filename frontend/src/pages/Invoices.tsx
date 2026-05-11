// src/pages/Invoices.tsx
// This file contains the Invoices page component which displays a list of invoices and allows users to create new invoices.
import { useState } from "react";
import { InvoiceForm } from "../components/InvoiceForm";
import { InvoiceList } from "../components/InvoiceList";

export const Invoices = () => {
  const [showForm, setShowForm] = useState(false);
  const refresh = () => setShowForm(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-[40px] ">Invoices</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gray-300 text-black hover:text-white px-6 py-2 font-medium hover:bg-gray-600"
        >
          {showForm ? "Cancel" : "New Invoice"}
        </button>
      </div>
        <div className="overflow-y-scroll h-[80vh]">
{showForm && <InvoiceForm onSuccess={refresh} />}

      <InvoiceList onRefresh={refresh} />
        </div>
      
    </div>
  );
};