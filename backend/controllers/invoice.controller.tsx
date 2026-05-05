// invoice.controller.tsx
// This file contains the controller functions for managing invoices (CRUD operations and download).

import { Request, Response } from "express";
import { Invoice } from "../models/Invoice";
import { generateInvoiceNumber } from "../utils/invoiceNumber";

export const createInvoice = async (req: Request, res: Response) => {
  const { client, items, dueDate, notes } = req.body;
  
  const totalAmount = items.reduce((sum: number, item: any) => sum + item.total, 0);
  const balance = totalAmount;
  
  const invoiceNumber = await generateInvoiceNumber(Invoice);
  
  const invoice = Invoice.build({ 
    client, 
    invoiceNumber, 
    items, 
    totalAmount, 
    paid: 0, 
    balance,
    dueDate, 
    notes 
  });
  
  await invoice.save();
  res.json(invoice);
};

export const getInvoices = async (req: Request, res: Response) => {
  const invoices = await Invoice.find().populate("client");
  res.json(invoices);
};

export const getInvoice = async (req: Request, res: Response) => {
  const invoice = await Invoice.findById(req.params.id).populate("client");
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });
  res.json(invoice);
};

// Download logic (PDF generation would use pdfkit or similar)
export const downloadInvoice = async (req: Request, res: Response) => {
  // Simplified: return JSON for now, add PDF later
  const invoice = await Invoice.findById(req.params.id).populate("client");
  res.json(invoice); // Replace with PDF stream
};