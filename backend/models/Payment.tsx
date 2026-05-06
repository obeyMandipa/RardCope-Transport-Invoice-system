// models/Payment.ts - Your code + enhancements
import mongoose from "mongoose";

interface PaymentAttrs {
  invoice: mongoose.Types.ObjectId;
  amount: number;
  date: Date;
  method: string; // 'cash', 'card', 'bank', 'mpesa'
  notes?: string;
}

interface PaymentDoc extends mongoose.Document {
  invoice: mongoose.Types.ObjectId;
  amount: number;
  date: Date;
  method: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentModel extends mongoose.Model<PaymentDoc> {
  build(attrs: PaymentAttrs): PaymentDoc;
}

const paymentSchema = new mongoose.Schema(
  {
    invoice: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Invoice", 
      required: true,
      index: true // ✅ Faster queries
    },
    amount: { 
      type: Number, 
      required: true, 
      min: 0 // ✅ Prevent negative payments
    },
    date: { 
      type: Date, 
      required: true,
      default: Date.now
    },
    method: { 
      type: String, 
      required: true,
      enum: ['cash', 'card', 'bank', 'mpesa', 'transfer'] // ✅ Valid methods
    },
    notes: { 
      type: String, 
      maxlength: 500 // ✅ Reasonable limit
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true }
  }
);

// ✅ Index for fast invoice lookups
paymentSchema.index({ invoice: 1, date: -1 });

paymentSchema.statics.build = function (attrs: PaymentAttrs) {
  return new this(attrs);
};

const Payment = mongoose.model<PaymentDoc, PaymentModel>("Payment", paymentSchema);

export { Payment };