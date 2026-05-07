// models/Expenses.tsx
// This file contains the Mongoose model for the Expense collection in MongoDB.

import mongoose from "mongoose";

interface ExpenseAttrs {
  date: Date;
  description: string;
  amount: number;
}

interface ExpenseDoc extends mongoose.Document {
  date: Date;
  description: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ExpenseModel extends mongoose.Model<ExpenseDoc> {
  build(attrs: ExpenseAttrs): ExpenseDoc;
}

const expenseSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    description: { type: String, required: true, maxlength: 500 },
    amount: { type: Number, required: true, min: 0 },
  },
  { 
    timestamps: true 
  }
);

expenseSchema.statics.build = function (attrs: ExpenseAttrs) {
  return new this(attrs);
};

const Expense = mongoose.model<ExpenseDoc, ExpenseModel>("Expense", expenseSchema);
export { Expense };