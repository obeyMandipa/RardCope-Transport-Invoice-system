// controllers/payment.controller.tsx
// Controller functions for managing payments (create, list, filter by invoice).

import { Request, Response } from "express";
import mongoose from "mongoose";
import { Payment } from "../models/Payment";
import { Invoice } from "../models/Invoice";
import { CashBookEntry } from "../models/CashBookEntry";

const getValidObjectId = (id: string | string[] | undefined): string | null => {
  if (!id || Array.isArray(id)) return null;
  return mongoose.Types.ObjectId.isValid(id) ? id : null;
};

// ✅ FIXED: Complete createPayment function
export const createPayment = async (req: Request, res: Response) => {
  const { invoiceId, amount, date, description, cashBookDebit = false } = req.body;

  const validId = getValidObjectId(invoiceId);
  if (!validId) {
    return res.status(400).json({ error: "Invalid invoice ID format" });
  }

  const invoice = await Invoice.findById(validId).populate("client", "name");
  if (!invoice) {
    return res.status(404).json({ error: "Invoice not found" });
  }

  const payment = Payment.build({
    invoice: new mongoose.Types.ObjectId(validId),
    amount: Number(amount),
    date: date ? new Date(date) : new Date(),
    description: description || "",
    cashBookDebit, // ✅ Save checkbox state
  });

  await payment.save();

  // Update invoice balance
  (invoice as any).paid += Number(amount);
  (invoice as any).balance = Math.max(0, (invoice as any).balance - Number(amount));
  await invoice.save();

  // ✅ CORRECTED: Payments DEBIT primary cash book (money in)
  if (cashBookDebit) {
    // 1. DEBIT PRIMARY CASH BOOK (money received)
    const primaryEntries = await CashBookEntry.find({ type: "primary" })
      .sort({ date: 1, createdAt: 1 })
      .lean();
    let primaryBalance = primaryEntries.reduce((sum: number, entry: any) => sum + entry.debit - entry.credit, 0);
    primaryBalance += Number(amount);
    await CashBookEntry.create({
      type: "primary",
      date: payment.date,
      description: `Invoice payment: ${(invoice.client as any)?.name || "Client"}`,
      debit: Number(amount),
      credit: 0,
      balance: primaryBalance,
      reference: `${(invoice.client as any)?.name || "Client"} - ${invoice.invoiceNumber}`,
    });
  }

  const populatedPayment = await Payment.findById(payment._id).populate(
    "invoice",
    "invoiceNumber client totalAmount balance paid"
  );

  res.status(201).json(populatedPayment);
};

export const getPayments = async (req: Request, res: Response) => {
  const payments = await Payment.find()
    .populate("invoice", "invoiceNumber client totalAmount balance paid")
    .sort({ date: -1 });
  res.json(payments);
};

export const getPaymentsForInvoice = async (req: Request, res: Response) => {
  const { invoiceId } = req.params;
  const validId = getValidObjectId(invoiceId);
  if (!validId) {
    return res.status(400).json({ error: "Invalid invoice ID format" });
  }

  const payments = await Payment.find({
    invoice: new mongoose.Types.ObjectId(validId),
  })
    .populate("invoice", "invoiceNumber client totalAmount balance paid")
    .sort({ date: -1 });
  res.json(payments);
};

// ✅ FIXED: Complete deletePayment function
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

  // ✅ REVERSE CASH BOOK ENTRIES if cashBookDebit was true
  if (payment.cashBookDebit) {
    // Delete matching petty cash debit
    await CashBookEntry.deleteOne({
      type: "petty",
      date: payment.date,
      description: { $regex: new RegExp((invoice.client as any)?.name || "Client", "i") },
      debit: payment.amount,
      reference: { $regex: new RegExp(invoice.invoiceNumber, "i") },
    });

    // Delete matching primary cash credit
    await CashBookEntry.deleteOne({
      type: "primary",
      date: payment.date,
      description: { $regex: /Transfer to petty cash/i },
      credit: payment.amount,
      reference: { $regex: new RegExp(invoice.invoiceNumber, "i") },
    });
  }

  await Payment.findByIdAndDelete(validId);
  res.json({ message: "Payment deleted successfully" });
};