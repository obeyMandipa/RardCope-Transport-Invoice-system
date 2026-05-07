// This file defines the Expenses page, allowing users to add, view, and delete expenses.

import { useState, useEffect } from "react";
import api from "../utils/api";
import type { Expense } from "../types";

export const Expenses = () => {
  const [form, setForm] = useState({
    date: "",
    description: "",
    amount: 0,
  });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/expenses");
      setExpenses(data);
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!form.description || form.amount <= 0) return;

    setLoading(true);
    try {
      await api.post("/expenses", form);
      setForm({ date: "", description: "", amount: 0 });
      fetchExpenses();
    } catch (error) {
      console.error("Failed to create expense:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    
    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch (error) {
      console.error("Failed to delete expense:", error);
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="">
        <h1 className="text-[40px] text-gray-900 mb-8">Expenses</h1>
        <div className=" overflow-y-scroll h-[80vh] ">
            {/* Create Expense Form */}
            <div className="bg-white p-8 w-full shadow-xl mb-8">
                <h2 className="text-[25px] mb-6">Add New Expense</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <input
                    type="text"
                    placeholder="Expense description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                    <input
                    type="number"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    min="0"
                    step="0.01"
                    />
                </div>
                </div>

                <button
                onClick={submit}
                disabled={!form.description || form.amount <= 0 || loading}
                className="mt-6 bg-gray-300 text-black px-8 py-3 hover:bg-gray-500 hover:text-white"
                >
                {loading ? "Adding..." : "Add Expense"}
                </button>
            </div>

            {/* Expenses Table */}
            <div className="bg-white shadow-xl overflow-hidden">
                <div className="p-8 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-[22px] text-gray-900">All Expenses</h2>
                    <div className="text-2xl font-bold text-red-600">
                    Total: ${totalExpenses.toLocaleString()}
                    </div>
                </div>
                </div>

                {loading ? (
                <div className="p-12 text-center text-gray-500">Loading expenses...</div>
                ) : expenses.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                    No expenses recorded yet. Add one above!
                </div>
                ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                    <thead className="text-gray-500">
                        <tr>
                        <th className="px-6 py-4 text-left font-normal uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left font-normal uppercase tracking-wider">Description</th>
                        <th className="px-6 py-4 text-right font-normal uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-center font-normal uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {expenses.map((expense) => (
                        <tr key={expense._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap ">
                            {new Date(expense.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 max-w-md truncate">
                            {expense.description}
                            </td>
                            <td className="px-6 py-4 text-right">
                            ${Number(expense.amount).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-center whitespace-nowrap">
                            <button
                                onClick={() => deleteExpense(expense._id)}
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
    
)};