// client.tsx
// This file contains the Mongoose model for the Client collection in MongoDB.

import mongoose from "mongoose";

interface ClientAttrs {
  name: string;
  address: string;
  phone: string;
  email: string;
  vat: string;
  tin: string;
}

interface ClientDoc extends mongoose.Document {
  name: string;
  address: string;
  phone: string;
  email: string;
  vat: string;
  tin: string;
}

interface ClientModel extends mongoose.Model<ClientDoc> {
  build(attrs: ClientAttrs): ClientDoc;
}

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String },
    phone: { type: String },
    email: { type: String, required: true },
    vat: { type: String },
    tin: { type: String },
  },
  { timestamps: true }
);

clientSchema.statics.build = function (attrs: ClientAttrs) {
  return new this(attrs);
};

const Client = mongoose.model<ClientDoc, ClientModel>("Client", clientSchema);

export { Client };