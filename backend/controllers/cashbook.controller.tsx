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
  const { type, date, description, debit, credit, reference } = req.body;

  // ✅ BLOCK MANUAL PRIMARY ENTRIES
  if (type === "primary") {
    return res.status(403).json({ 
      error: "Primary cash book entries are auto-created from Payments page" 
    });
  }

  // ✅ DETECT PETTY FUNDING (debit > 0, credit = 0)
  if (type === "petty" && Number(debit) > 0 && Number(credit) === 0) {
    const amount = Number(debit);

    try {
      // 1. CREDIT PRIMARY CASH BOOK (money transferred OUT)
      const primaryEntries = await CashBookEntry.find({ type: "primary" })
        .sort({ date: 1, createdAt: 1 })
        .lean();
      let primaryBalance = primaryEntries.reduce(
        (sum: number, entry: any) => sum + entry.debit - entry.credit, 
        0
      );
      primaryBalance -= amount;

      await CashBookEntry.create({
        type: "primary",
        date: date ? new Date(date) : new Date(),
        description: description ? `Petty cash funding: ${description}` : "Petty cash funding",
        debit: 0,
        credit: amount,
        balance: primaryBalance,
        reference: `Petty: ${reference || 'Funding'}`,
      });

      // 2. DEBIT PETTY CASH BOOK (money received)
      const pettyEntries = await CashBookEntry.find({ type: "petty" })
        .sort({ date: 1, createdAt: 1 })
        .lean();
      let pettyBalance = pettyEntries.reduce(
        (sum: number, entry: any) => sum + entry.debit - entry.credit, 
        0
      );
      pettyBalance += amount;

      const pettyEntry = CashBookEntry.build({
        type: "petty",
        date: date ? new Date(date) : new Date(),
        description: description || "Petty cash funding",
        debit: amount,
        credit: 0,
        balance: pettyBalance,
        reference,
      });
      await pettyEntry.save();

      return res.status(201).json({
        message: "Petty cash funded successfully",
        petty: pettyEntry,
        primary: { description: pettyEntry.description, amount, balance: primaryBalance }
      });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fund petty cash" });
    }
  }

  // ✅ REGULAR PETTY CASH EXPENSE (credit only)
  if (type === "petty" && Number(credit) > 0 && Number(debit) === 0) {
    const entries = await CashBookEntry.find({ type })
      .sort({ date: 1, createdAt: 1 })
      .lean();
    let runningBalance = entries.reduce(
      (sum: number, entry: any) => sum + entry.debit - entry.credit, 
      0
    );
    runningBalance -= Number(credit);

    const entry = CashBookEntry.build({
      type,
      date: date ? new Date(date) : new Date(),
      description,
      debit: 0,
      credit: Number(credit),
      balance: runningBalance,
      reference,
    });
    await entry.save();
    return res.status(201).json(entry);
  }

  // ✅ INVALID ENTRY
  return res.status(400).json({ 
    error: "Valid petty cash entries: Debit (funding) or Credit (expense) only" 
  });
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