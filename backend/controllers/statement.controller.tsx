import { Request, Response } from "express";
import mongoose from "mongoose";
import { Invoice } from "../models/Invoice";

export const getStatement = async (req: Request, res: Response) => {
  // ✅ Extract and type-safely convert clientId
  let clientId: string;
  
  if (Array.isArray(req.params.clientId)) {
    return res.status(400).json({ error: "Invalid client ID format" });
  }
  
  clientId = req.params.clientId ?? "";
  
  if (!clientId) {
    return res.status(400).json({ error: "Client ID required" });
  }
  
  if (!mongoose.Types.ObjectId.isValid(clientId)) {
    return res.status(400).json({ error: "Invalid client ID format" });
  }
  
  const objectId = new mongoose.Types.ObjectId(clientId);
  
  const invoices = await Invoice.find({ client: objectId })
    .sort({ createdAt: -1 })
    .populate("client");
  
  if (invoices.length === 0) {
    return res.json([]); // Empty statement is valid
  }
  
  // Calculate running balance
  let runningBalance = 0;
  const statement = invoices.map((inv) => {
    runningBalance += inv.balance;
    return {
      date: inv.createdAt.toISOString().split("T")[0],
      transaction: inv.invoiceNumber,
      details: inv.items[0]?.description || "Invoice",
      amount: inv.totalAmount,
      payment: inv.paid,
      balance: runningBalance,
    };
  });
  
  res.json(statement);
};