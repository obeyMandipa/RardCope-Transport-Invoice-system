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
  amount: number;
  payment: number;
  balance: number;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;  
}