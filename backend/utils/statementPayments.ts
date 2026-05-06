// statementPayments.ts
// Utility to fetch and merge payments into statement rows

import { Payment } from "../models/Payment";
import { Invoice } from "../models/Invoice";

export async function getPaymentsForClient(clientId: string) {
  // Get all invoices for this client
  const invoices = await Invoice.find({ client: clientId });
  const invoiceIds = invoices.map(inv => inv._id);
  // Get all payments for these invoices
  const payments = await Payment.find({ invoice: { $in: invoiceIds } });
  return payments;
}
