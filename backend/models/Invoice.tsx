// Invoice.tsx
// This file contains the Mongoose model for the Invoice collection in MongoDB.

import mongoose from "mongoose";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceAttrs {
  client: mongoose.Types.ObjectId;
  invoiceNumber: string;
  items: LineItem[];
  totalAmount: number;
  paid: number;
  balance: number;
  dueDate?: Date;
  notes?: string;
}

interface InvoiceDoc extends mongoose.Document {
  client: mongoose.Types.ObjectId;
  invoiceNumber: string;
  items: LineItem[];
  totalAmount: number;
  paid: number;
  balance: number;
  dueDate?: Date;
  notes?: string;
  createdAt: Date;
}

interface InvoiceModel extends mongoose.Model<InvoiceDoc> {
  build(attrs: InvoiceAttrs): InvoiceDoc;
}

const invoiceSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    items: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        total: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    paid: { type: Number, default: 0 },
    balance: { type: Number, required: true },
    dueDate: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

invoiceSchema.statics.build = function (attrs: InvoiceAttrs) {
  return new this(attrs);
};

const Invoice = mongoose.model<InvoiceDoc, InvoiceModel>(
  "Invoice",
  invoiceSchema
);

invoiceSchema.index({ "client": 1, "createdAt": 1 });
// invoiceSchema.index({ "invoiceNumber": 1 });

export { Invoice };