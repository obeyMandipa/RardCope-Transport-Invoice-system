// controllers/payment.controller.tsx
// Controller functions for managing payments (create, list, filter by invoice).

import { Request, Response } from "express";
import mongoose from "mongoose";
import { Payment } from "../models/Payment";
import { Invoice } from "../models/Invoice";

const getValidObjectId = (id: string | string[] | undefined): string | null => {
  if (!id || Array.isArray(id)) return null;
  return mongoose.Types.ObjectId.isValid(id) ? id : null;
};

export const createPayment = async (req: Request, res: Response) => {
  const { invoiceId, amount, date, method } = req.body;

  const validId = getValidObjectId(invoiceId);
  if (!validId) {
    return res.status(400).json({ error: "Invalid invoice ID format" });
  }

  const invoice = await Invoice.findById(validId);
  if (!invoice) {
    return res.status(404).json({ error: "Invoice not found" });
  }

  const payment = Payment.build({
    invoice: new mongoose.Types.ObjectId(validId),
    amount: Number(amount),
    date: date ? new Date(date) : new Date(),
    method,
  });

  await payment.save();

  invoice.paid += Number(amount);
  invoice.balance = Math.max(0, invoice.balance - Number(amount));
  await invoice.save();

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

export const deletePayment = async (req: Request, res: Response) => {
  const { id } = req.params;

  const validId = getValidObjectId(id);
  if (!validId) {
    return res.status(400).json({ error: "Invalid payment ID format" });
  }

  const payment = await Payment.findById(validId);
  if (!payment) {
    return res.status(404).json({ error: "Payment not found" });
  }

  const invoice = await Invoice.findById(payment.invoice);
  if (invoice) {
    invoice.paid = Math.max(0, invoice.paid - payment.amount);
    invoice.balance += payment.amount;
    await invoice.save();
  }

  await Payment.findByIdAndDelete(validId);

  res.json({ message: "Payment deleted successfully" });
};