// statement.controller.tsx - Controller for handling client statements

import { Request, Response } from "express";
import { Invoice } from "../models/Invoice";
import { Client } from "../models/client";
import { Payment } from "../models/Payment";

export const getStatement = async (req: Request, res: Response) => {
  let clientName: string;

  if (Array.isArray(req.params.clientName)) {
    return res.status(400).json({ error: "Invalid client name format" });
  }

  clientName = req.params.clientName ?? "";

  if (!clientName || clientName.trim().length < 2) {
    return res.status(400).json({ error: "Client name required (min 2 chars)" });
  }

  const client = await Client.findOne({
    name: { $regex: new RegExp(`^${clientName.trim()}$`, "i") },
  });

  if (!client) {
    return res.status(404).json({ error: `Client "${clientName}" not found` });
  }

  const invoices = await Invoice.find({ client: client._id })
    .sort({ createdAt: 1 })
    .populate("client", "name email phone");

  const invoiceIds = invoices.map((inv) => inv._id);
  const payments = await Payment.find({ invoice: { $in: invoiceIds } }).sort({
    date: 1,
  });

  if (invoices.length === 0 && payments.length === 0) {
    return res.json({
      client: client.name,
      message: "No transactions found for this client",
      statement: [],
      totals: {
        invoices: 0,
        totalAmount: 0,
        totalPaid: 0,
        totalBalance: 0,
      },
    });
  }

  const rows: any[] = [];

  for (const inv of invoices) {
    rows.push({
      date: inv.createdAt,
      transaction: inv.invoiceNumber,
      details: inv.items.map((item: any) => item.description).join(", ") || "Invoice",
      amount: inv.totalAmount,
      payment: null,
      type: "invoice",
    });

    const invPayments = payments.filter(
      (p) => p.invoice.toString() === inv._id.toString()
    );

    for (const pay of invPayments) {
      rows.push({
        date: pay.date,
        transaction: "Payment",
        details: pay.method,
        amount: null,
        payment: pay.amount,
        type: "payment",
      });
    }
  }

  rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let runningBalance = 0;
  const statement = rows.map((row) => {
    if (row.type === "invoice") {
      runningBalance += Number(row.amount || 0);
    } else if (row.type === "payment") {
      runningBalance -= Number(row.payment || 0);
    }

    return {
      date: new Date(row.date).toISOString().split("T")[0],
      transaction: row.transaction,
      details: row.details,
      amount: row.type === "invoice" ? row.amount : "",
      payment: row.type === "payment" ? row.payment : "",
      balance: runningBalance,
      type: row.type,
    };
  });

  res.json({
    client: client.name,
    clientId: client._id,
    period: {
      from: new Date(rows[0].date).toISOString().split("T")[0],
      to: new Date(rows[rows.length - 1].date).toISOString().split("T")[0],
    },
    totals: {
      invoices: invoices.length,
      totalAmount: invoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0),
      totalPaid: payments.reduce((sum: number, pay: any) => sum + pay.amount, 0),
      totalBalance: runningBalance,
    },
    statement,
  });
};