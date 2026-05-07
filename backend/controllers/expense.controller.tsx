// Expense controller
// This file contains the Express controller functions for managing expenses (CRUD operations).

import { Request, Response } from "express";
import mongoose from "mongoose";
import { Expense } from "../models/Expense";

const getValidObjectId = (id: string | string[] | undefined): string | null => {
  if (!id || Array.isArray(id)) return null;
  return mongoose.Types.ObjectId.isValid(id) ? id : null;
};

export const createExpense = async (req: Request, res: Response) => {
  const { date, description, amount } = req.body;

  const expense = Expense.build({
    date: date ? new Date(date) : new Date(),
    description,
    amount: Number(amount),
  });

  await expense.save();
  res.status(201).json(expense);
};

export const getExpenses = async (req: Request, res: Response) => {
  const expenses = await Expense.find()
    .sort({ date: -1, createdAt: -1 });
  res.json(expenses);
};

export const deleteExpense = async (req: Request, res: Response) => {
  const { id } = req.params;
  const validId = getValidObjectId(id);
  
  if (!validId) {
    return res.status(400).json({ error: "Invalid expense ID" });
  }

  const expense = await Expense.findById(validId);
  if (!expense) {
    return res.status(404).json({ error: "Expense not found" });
  }

  await Expense.findByIdAndDelete(validId);
  res.json({ message: "Expense deleted successfully" });
};