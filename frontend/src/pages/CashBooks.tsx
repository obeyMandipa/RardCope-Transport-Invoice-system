import { useState, useEffect } from "react";
import api from "../utils/api";
import type { CashBookEntry } from "../types";

export const CashBooks = () => {
  const [activeTab, setActiveTab] = useState<"primary" | "petty">("primary");
  const [form, setForm] = useState({
    date: "",
    description: "",
    debit: 0,
    credit: 0,
    reference: "",
  });
  const [entries, setEntries] = useState<CashBookEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, [activeTab]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/cashbook?type=${activeTab}`);
      setEntries(data);
    } catch (error) {
      console.error("Failed to fetch entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!form.description || (form.debit === 0 && form.credit === 0)) return;

    setLoading(true);
    try {
      await api.post("/cashbook", { ...form, type: activeTab });
      setForm({ date: "", description: "", debit: 0, credit: 0, reference: "" });
      fetchEntries();
    } catch (error) {
      console.error("Failed to create entry:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    try {
      await api.delete(`/cashbook/${id}`);
      fetchEntries();
    } catch (error) {
      console.error("Failed to delete entry:", error);
    }
  };

  const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);
  const finalBalance = entries[entries.length - 1]?.balance || 0;

  return (
    <div className="">
      <h1 className="text-[40px] mb-4">Cash Books</h1>

      <div className="flex w-[500px] p-1 mb-4">
        <button
          onClick={() => setActiveTab("primary")}
          className={`flex-1 py-2 px-2 font-semibold transition-all ${
            activeTab === "primary"
              ? "bg-red-800 text-white shadow-xl"
              : "text-gray-600 hover:text-red-800 hover:bg-gray-50"
          }`}
        >
          Primary Cash Book
        </button>
        <button
          onClick={() => setActiveTab("petty")}
          className={`flex-1 py-2 px-2 font-semibold transition-all ${
            activeTab === "petty"
              ? "bg-red-800 text-white shadow-xl"
              : "text-gray-600 hover:text-red-800 hover:bg-gray-50"
          }`}
        >
          Petty Cash Book
        </button>
      </div>

      <div className="overflow-y-scroll h-[75vh]">
        {activeTab === "petty" ? (
          <div className="bg-white p-8  mb-8">
            <h2 className="text-2xl font-semibold mb-6">Petty Cash Book Entry</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full p-3 border border-gray-300  focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  placeholder="Petty cash expense..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-3 border border-gray-300  focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Debit (Funding)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={form.debit}
                  onChange={(e) => setForm({ ...form, debit: parseFloat(e.target.value) || 0 })}
                  className="w-full p-3 border border-gray-300  focus:ring-2 focus:ring-green-500"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credit (Expenses)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={form.credit}
                  onChange={(e) => setForm({ ...form, credit: parseFloat(e.target.value) || 0 })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500"
                  min="0"
                  step="0.01"
                />
              </div> */}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference (Optional)
              </label>
              <input
                type="text"
                placeholder="Expense description or reference"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                className="w-full p-3 border border-gray-300  focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={submit}
              disabled={!form.description || (form.debit === 0 && form.credit === 0) || loading}
              className="mt-6 bg-gray-500 px-8 py-3 text-white  disabled:text-black  disabled:bg-gray-300 disabled:transform-none transition-all duration-200"
            >
              {loading ? "Adding..." : "Add Entry"}
            </button>
          </div>
        ) : (
          <div className="bg-gray-200 border border-gray-200 p-6 mb-8">
            <h2 className="text-xl mb-2">Primary Cash Book</h2>
            <p className="text-red-900">
              Primary cash book entries are created automatically from payments.
            </p>
          </div>
        )}

        <div className="bg-white overflow-hidden">
          <div className="p-8 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl text-gray-900">
                {activeTab === "primary" ? "Primary" : "Petty"} Cash Book
              </h2>
              <div className="text-right space-y-1">
                <div className="text-lg">Total Debit: ${totalDebit.toLocaleString()}</div>
                <div className="text-lg">Total Credit: ${totalCredit.toLocaleString()}</div>
                <div
                  className={`text-[22px] font-normal ${
                    finalBalance >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  Balance: ${finalBalance.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No {activeTab} cash book entries yet. Add one above!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b-2">
                  <tr>
                    <th className="px-6 py-4 border-l-2 font-normal text-left text-sm uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 border-l-2 font-normal text-left text-sm uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 border-l-2 font-normal text-left text-sm  uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-6 py-4 border-l-2 font-normal text-right text-sm  uppercase tracking-wider">
                      Debit
                    </th>
                    <th className="px-6 py-4 border-l-2 font-normal text-right text-sm uppercase tracking-wider">
                      Credit
                    </th>
                    <th className="px-6 py-4 border-l-2 font-normal text-right text-sm uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-4 border-l-2 font-normal text-center text-sm  uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {entries.map((entry) => (
                    <tr key={entry._id} className="hover:bg-gray-50">
                      <td className="border-l-2 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="border-l-2 px-6 py-4 text-sm text-gray-900 max-w-lg">
                        {entry.description}
                      </td>
                      <td className="border-l-2 px-6 py-4 text-sm text-gray-600">
                        {entry.reference || "-"}
                      </td>
                      <td className="border-l-2 px-6 py-4 text-right">
                        ${Number(entry.debit).toLocaleString()}
                      </td>
                      <td className="border-l-2 px-6 py-4 text-right">
                        ${Number(entry.credit).toLocaleString()}
                      </td>
                      <td className="border-l-2 px-6 py-4 text-right">
                        <span>${Number(entry.balance).toLocaleString()}</span>
                      </td>
                      <td className="border-l-2 px-6 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => deleteEntry(entry._id)}
                          className="text-red-600 hover:text-red-800 font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};