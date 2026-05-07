// src/types/index.ts
// This file contains TypeScript interfaces for the data models used in the frontend application.

export interface Client {
  _id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  vat: string;
  tin: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  _id: string;
  client: Client;
  invoiceNumber: string;
  items: LineItem[];
  totalAmount: number;
  paid: number;
  balance: number;
  createdAt: string;
}

export interface StatementRow {
  date: string;
  transaction: string;
  details: string;
  amount: string;
  payment: string;
  type: "invoice" | "payment";
  invoiceNumber: string; // For payments, to show which invoice they relate to
  balance: number;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;  
}

export interface Expense {
  _id: string;
  date: string;
  description: string;
  amount: number;
  createdAt: string;
}

export interface CashBookEntry {
  _id: string;
  type: "primary" | "petty";
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference?: string;
  createdAt: string;
}