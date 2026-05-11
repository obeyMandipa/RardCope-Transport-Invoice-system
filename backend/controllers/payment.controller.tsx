// controllers/payment.controller.tsx
// Controller functions for managing payments (create, list, filter by invoice).

// controllers/payment.controller.tsx
import { Request, Response } from "express";
import mongoose from "mongoose";
import { Payment } from "../models/Payment";
import { Invoice } from "../models/Invoice";
import { CashBookEntry } from "../models/CashBookEntry";

const getValidObjectId = (id: string | string[] | undefined): string | null => {
  if (!id || Array.isArray(id)) return null;
  return mongoose.Types.ObjectId.isValid(id) ? id : null;
};

// ✅ NEW: Auto-allocate payment across multiple invoices
export const createPayment = async (req: Request, res: Response) => {
  const { clientId, invoiceId, amount, date, description, cashBookDebit = false } = req.body;

  // Validate client
  const validClientId = getValidObjectId(clientId);
  if (!validClientId) {
    return res.status(400).json({ error: "Invalid client ID format" });
  }

  // Validate first invoice (optional)
  const validInvoiceId = invoiceId ? getValidObjectId(invoiceId) : null;

  const totalAmount = Number(amount);
  if (totalAmount <= 0) {
    return res.status(400).json({ error: "Amount must be greater than 0" });
  }

  const client = await Invoice.findOne({ client: validClientId, balance: { $gt: 0 } })
    .populate("client", "name")
    .sort({ createdAt: 1 }); // Get oldest unpaid invoice first

  if (!client) {
    return res.status(404).json({ error: "No outstanding invoices found for this client" });
  }

  try {
    // ✅ AUTO-ALLOCATION LOGIC
    let remainingAmount = totalAmount;
    const createdPayments: any[] = [];
    const clientInvoices = await Invoice.find({ 
      client: validClientId, 
      balance: { $gt: 0 } 
    }).sort({ createdAt: 1 });

    for (const invoice of clientInvoices) {
      if (remainingAmount <= 0) break;

      const paymentAmount = Math.min(remainingAmount, invoice.balance);
      
      // Create payment
      const payment = await Payment.create({
        invoice: invoice._id,
        amount: paymentAmount,
        date: date ? new Date(date) : new Date(),
        description: description || `Payment for ${invoice.invoiceNumber}`,
        cashBookDebit
      });

      // Update invoice
      invoice.paid += paymentAmount;
      invoice.balance = Math.max(0, invoice.totalAmount - invoice.paid);
      await invoice.save();

      createdPayments.push(payment);
      remainingAmount -= paymentAmount;

      // Total cash book entry (only once for full amount)
      if (createdPayments.length === 1 && cashBookDebit) {
        await createCashBookEntry(totalAmount, date || new Date().toISOString(), client.client as any, description);
      }
    }

    // Populate all created payments
    const populatedPayments = await Payment.find({
      _id: { $in: createdPayments.map(p => p._id) }
    }).populate({
  path: "invoice",
  populate: { path: "client", select: "name" },
  select: "invoiceNumber totalAmount balance paid"
});

    res.status(201).json({
      message: `Payment created successfully. Allocated across ${createdPayments.length} invoice(s).`,
      payments: populatedPayments,
      remaining: remainingAmount
    });

  } catch (error) {
    res.status(500).json({ error: "Failed to create payment" });
  }
};

// ✅ Helper: Create single cash book entry for total amount
const createCashBookEntry = async (amount: number, date: string | Date, client: any, description: string) => {
  const primaryEntries = await CashBookEntry.find({ type: "primary" })
    .sort({ date: 1, createdAt: 1 })
    .lean();
  
  let primaryBalance = primaryEntries.reduce((sum: number, entry: any) => sum + entry.debit - entry.credit, 0);
  primaryBalance += Number(amount);

  await CashBookEntry.create({
    type: "primary",
    date: new Date(date),
    description: `Payment received: ${client?.name || "Client"} - ${description}`,
    debit: Number(amount),
    credit: 0,
    balance: primaryBalance,
    reference: `${client?.name || "Client"}`,
  });
};

// Rest of your existing functions (getPayments, deletePayment, etc.) remain the same...
export const getPayments = async (req: Request, res: Response) => {
  const payments = await Payment.find()
    .populate({
      path: "invoice",
      populate: {
        path: "client",
        select: "name"
      },
      select: "invoiceNumber totalAmount balance paid"
    })
    .sort({ date: -1 });
  res.json(payments);
};

export const deletePayment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const validId = getValidObjectId(id);
  
  if (!validId) {
    return res.status(400).json({ error: "Invalid payment ID format" });
  }

  const payment = await Payment.findById(validId).populate("invoice");
  if (!payment) {
    return res.status(404).json({ error: "Payment not found" });
  }

  // Restore invoice balance
  const invoice = payment.invoice as any;
  if (invoice) {
    invoice.paid = Math.max(0, invoice.paid - payment.amount);
    invoice.balance += payment.amount;
    await invoice.save();
  }

  await Payment.findByIdAndDelete(validId);
  res.json({ message: "Payment deleted successfully" });
};