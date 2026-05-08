// invoice.controller.tsx
// This file contains the controller functions for managing invoices (CRUD operations and download).

// invoice.controller.ts
import { Request, Response } from "express";
import { Invoice } from "../models/Invoice";
import { Client } from "../models/Client"; // ✅ Fixed import path
import { generateInvoiceNumber } from "../utils/invoiceNumber";

export const createInvoice = async (req: Request, res: Response) => { // ✅ Complete function wrapper
  try {
    const { client, items, dueDate, notes } = req.body; // client = clientName from frontend
    
    // Look up client by name (case insensitive)
    const clientDoc = await Client.findOne({ name: { $regex: new RegExp(`^${client}$`, 'i') } });
    if (!clientDoc) {
      return res.status(400).json({ error: "Client not found. Create client first." });
    }
    
    const totalAmount = items.reduce((sum: number, item: any) => sum + item.total, 0);
    const balance = totalAmount;
    
    const invoiceNumber = await generateInvoiceNumber(Invoice);
    
    const invoice = Invoice.build({
      client: clientDoc._id,
      invoiceNumber,
      items,
      totalAmount,
      paid: 0,
      balance,
      dueDate,
      notes,
    });
    
    await invoice.save();
    
    // Return populated invoice
    const populatedInvoice = await Invoice.findById(invoice._id).populate("client", "name email phone");
    res.status(201).json(populatedInvoice);
  } catch (error) {
    console.error("Create invoice error:", error);
    res.status(500).json({ error: "Failed to create invoice" });
  }
};

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const invoices = await Invoice.find().populate("client", "name email phone");
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
};

export const getInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("client", "name email phone address");
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
};

export const downloadInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("client");
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    
    res.json({
      success: true,
      invoice: {
        number: invoice.invoiceNumber,
        client: invoice.client,
        items: invoice.items,
        totalAmount: invoice.totalAmount,
        balance: invoice.balance,
        createdAt: invoice.createdAt,
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to download invoice" });
  }
};