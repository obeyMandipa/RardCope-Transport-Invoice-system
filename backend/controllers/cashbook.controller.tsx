// controllers/cashbook.controller.tsx
// This file contains the controller functions for managing cash book entries (CRUD operations).

import { Request, Response } from "express";
import mongoose from "mongoose";
import { CashBookEntry } from "../models/CashBookEntry";

const getValidObjectId = (id: string | string[] | undefined): string | null => {
  if (!id || Array.isArray(id)) return null;
  return mongoose.Types.ObjectId.isValid(id) ? id : null;
};


export const createCashBookEntry = async (req: Request, res: Response) => { 
    const { type, date, description, debit, credit, reference, fundPetty } = req.body;

  // If funding petty cash, create two entries: credit primary, debit petty
  if (fundPetty && Number(debit) > 0 && type === "petty") {
    // 1. CREDIT primary cash book
    const primaryEntries = await CashBookEntry.find({ type: "primary" }).sort({ date: 1, createdAt: 1 }).lean();
    let primaryBalance = primaryEntries.reduce((sum, entry) => sum + entry.debit - entry.credit, 0);
    primaryBalance -= Number(debit);
    await CashBookEntry.create({
      type: "primary",
      date: date ? new Date(date) : new Date(),
      description: description ? `Petty cash funding: ${description}` : "Petty cash funding",
      debit: 0,
      credit: Number(debit),
      balance: primaryBalance,
      reference,
    });
    // 2. DEBIT petty cash book
    const pettyEntries = await CashBookEntry.find({ type: "petty" }).sort({ date: 1, createdAt: 1 }).lean();
    let pettyBalance = pettyEntries.reduce((sum, entry) => sum + entry.debit - entry.credit, 0);
    pettyBalance += Number(debit);
    const entry = CashBookEntry.build({
      type: "petty",
      date: date ? new Date(date) : new Date(),
      description: description || "Petty cash funding",
      debit: Number(debit),
      credit: 0,
      balance: pettyBalance,
      reference,
    });
    await entry.save();
    return res.status(201).json(entry);
  }

  // Normal single entry
  if (!["primary", "petty"].includes(type)) {
    return res.status(400).json({ error: "Type must be 'primary' or 'petty'" });
  }
  const entries = await CashBookEntry.find({ type })
    .sort({ date: 1, createdAt: 1 })
    .lean();
  let runningBalance = entries.reduce((sum, entry) => sum + entry.debit - entry.credit, 0);
  runningBalance += Number(debit || 0) - Number(credit || 0);
  const entry = CashBookEntry.build({
    type,
    date: date ? new Date(date) : new Date(),
    description,
    debit: Number(debit || 0),
    credit: Number(credit || 0),
    balance: runningBalance,
    reference,
  });
  await entry.save();
  res.status(201).json(entry);
};

export const getCashBookEntries = async (req: Request, res: Response) => {
  const { type } = req.query;
  
  const query: any = {};
  if (type && ["primary", "petty"].includes(type as string)) {
    query.type = type;
  }

  const entries = await CashBookEntry.find(query)
    .sort({ date: 1, createdAt: 1 });
  
  res.json(entries);
};

export const deleteCashBookEntry = async (req: Request, res: Response) => {
  const { id } = req.params;
  const validId = getValidObjectId(id);
  
  if (!validId) {
    return res.status(400).json({ error: "Invalid entry ID" });
  }

  const entry = await CashBookEntry.findById(validId);
  if (!entry) {
    return res.status(404).json({ error: "Entry not found" });
  }

  await CashBookEntry.findByIdAndDelete(validId);
  res.json({ message: "Entry deleted successfully" });
};