// src/pages/Login.tsx
// This file contains the Login page component which allows users to log in to the application.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

export const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/auth/login", form);
      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } catch (err) {
      alert("Login failed");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center  bg-red-50">
      <form onSubmit={submit} className="bg-white p-8 rounded-lg w-96 border-2 shadow-xl">
        <h1 className="text-3xl font-bold mb-6">Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full p-3 border rounded mb-4"
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full p-3 border rounded mb-6"
        />
        <button type="submit" className="w-full bg-gray-500 text-white py-3 rounded">
          Login
        </button>
        <p className="mt-4 text-center">
          No account? <a href="/signup" className="text-blue-500">Sign up</a>
        </p>
      </form>
    </div>
  );
};