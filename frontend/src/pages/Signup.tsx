// Similar to Login but POST to /auth/signup
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

export const Signup = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/auth/signup", form);
      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } catch (err) {
      alert("Signup failed");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <form onSubmit={submit} className="bg-white p-8 rounded-lg shadow w-96">
        <h1 className="text-3xl font-bold mb-6">Sign Up</h1>
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full p-3 border rounded mb-4"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full p-3 border rounded mb-4"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full p-3 border rounded mb-6"
          required
        />
        <button type="submit" className="w-full bg-gray-500 text-white py-3 rounded">
          Sign Up
        </button>
        <p className="mt-4 text-center">
          Have account? <a href="/login" className="text-blue-500">Login</a>
        </p>
      </form>
    </div>
  );
};