// CashBookEntry.tsx
// This file contains the Mongoose model for the CashBookEntry collection in MongoDB.

import mongoose from "mongoose";

interface CashBookAttrs {
  type: "primary" | "petty";
  date: Date;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference?: string; // client name or expense ID
}

interface CashBookDoc extends mongoose.Document {
  type: "primary" | "petty";
  date: Date;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference?: string;
  createdAt: Date;
}

interface CashBookModel extends mongoose.Model<CashBookDoc> {
  build(attrs: CashBookAttrs): CashBookDoc;
}

const cashBookSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["primary", "petty"], required: true },
    date: { type: Date, required: true, default: Date.now },
    description: { type: String, required: true },
    debit: { type: Number, default: 0, min: 0 },
    credit: { type: Number, default: 0, min: 0 },
    balance: { type: Number, required: true },
    reference: { type: String }, // Client name or expense ID
  },
  { timestamps: true }
);

cashBookSchema.statics.build = function (attrs: CashBookAttrs) {
  return new this(attrs);
};

const CashBookEntry = mongoose.model<CashBookDoc, CashBookModel>("CashBookEntry", cashBookSchema);
export { CashBookEntry };