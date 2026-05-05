// statement.controller.tsx - Controller for handling client statements

import { Request, Response } from "express";
import mongoose from "mongoose";
import { Invoice } from "../models/Invoice";
import { Client } from "../models/client";

export const getStatement = async (req: Request, res: Response) => {
  // ✅ Extract clientName (not clientId)
  let clientName: string;
  
  if (Array.isArray(req.params.clientName)) {
    return res.status(400).json({ error: "Invalid client name format" });
  }
  
  clientName = req.params.clientName ?? "";
  
  if (!clientName || clientName.trim().length < 2) {
    return res.status(400).json({ error: "Client name required (min 2 chars)" });
  }
  
  // ✅ Find client by name (case insensitive)
  const client = await Client.findOne({ 
    name: { $regex: new RegExp(`^${clientName.trim()}$`, 'i') } 
  });
  
  if (!client) {
    return res.status(404).json({ error: `Client "${clientName}" not found` });
  }
  
  // ✅ Get ALL invoices for this client
  const invoices = await Invoice.find({ client: client._id })
    .sort({ createdAt: -1 })
    .populate("client", "name email phone");
  
  if (invoices.length === 0) {
    return res.json({
      client: client.name,
      message: "No invoices found for this client",
      statement: []
    });
  }
  
  // ✅ Calculate running balance (newest to oldest)
  let runningBalance = 0;
  const statement = invoices.map((inv: any) => {
    runningBalance += inv.balance; // Add unpaid balance
    return {
      date: inv.createdAt.toISOString().split("T")[0],
      transaction: inv.invoiceNumber,
      details: inv.items.map((item: any) => item.description).join(', ') || "Invoice", // ✅ All item descriptions
      amount: inv.totalAmount,
      payment: inv.paid,
      balance: runningBalance,
      invoiceId: inv._id, // ✅ For linking back
    };
  });
  
  res.json({
    client: client.name,
    clientId: client._id,
    period: {
      from: invoices[invoices.length - 1]!.createdAt.toISOString().split("T")[0],
      to: invoices[0]!.createdAt.toISOString().split("T")[0],
    },
    totals: {
      invoices: invoices.length,
      totalAmount: invoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0),
      totalPaid: invoices.reduce((sum: number, inv: any) => sum + inv.paid, 0),
      totalBalance: runningBalance,
    },
    statement
  });
};