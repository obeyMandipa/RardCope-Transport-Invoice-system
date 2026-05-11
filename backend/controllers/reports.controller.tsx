// backend/controllers/reports.controller.tsx
// This file contains the Express controllers for generating various financial reports (statements, cash books, loads, invoices) and downloading them as PDFs.

// backend/controllers/reports.controller.tsx
import { Request, Response } from "express";
import { Invoice } from "../models/Invoice";
import { Payment } from "../models/Payment";
import { CashBookEntry } from "../models/CashBookEntry";
import { Client } from "../models/Client";
import PDFDocument from "pdfkit";

interface ReportEntry {
  date: string;
  description: string;
  clientName?: string;
  reference?: string;
  debit: number;
  credit: number;
  balance: number;
}

const formatCurrency = (amount: number): string => Number(amount).toFixed(2);

const createReportEntry = (data: any): ReportEntry => ({
  date: data.date || new Date().toISOString().split('T')[0],
  description: (data.description || data.invoiceNumber || "N/A").toString(),
  clientName: data.clientName || data.client?.name || undefined,
  reference: data.reference || undefined,
  debit: Number(data.debit) || 0,
  credit: Number(data.credit) || 0,
  balance: Number(data.balance) || 0
});

// ✅ FIXED: Running Statements - Pure Mongoose (no aggregation)
const getRunningStatementsData = async (query: any): Promise<ReportEntry[]> => {
  const { client, startDate, endDate } = query;
  
  // Client filter
  const clientMatch: any = client ? { client: client } : { client: { $exists: true } };
  
  // Date filter
  const dateFilter: any = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate as string);
    if (endDate) dateFilter.createdAt.$lte = new Date((endDate as string) + "T23:59:59Z");
  }

  // ✅ Use Mongoose find() instead of aggregation to avoid projection issues
  const invoices = await Invoice.find({ ...clientMatch, ...dateFilter })
    .populate("client", "name")
    .sort({ createdAt: 1 });

  const invoiceIds = invoices.map((inv: any) => inv._id);
  
  // Filter payments by date if specified
  const paymentFilter: any = { invoice: { $in: invoiceIds } };
  if (startDate || endDate) {
    paymentFilter.date = {};
    if (startDate) paymentFilter.date.$gte = new Date(startDate as string);
    if (endDate) paymentFilter.date.$lte = new Date((endDate as string) + "T23:59:59Z");
  }

  const payments = await Payment.find(paymentFilter).sort({ date: 1 });

  // Build chronological rows
  const rows: any[] = [];
  
  for (const inv of invoices) {
    rows.push({
      date: inv.createdAt,
      transaction: inv.invoiceNumber,
      details: inv.items.map((item: any) => item.description).join(", ") || "Invoice",
      amount: inv.totalAmount,
      payment: null,
      type: "invoice",
      clientName: (inv.client as any)?.name
    });

    const invPayments = payments.filter((p: any) => 
      p.invoice.toString() === inv._id.toString()
    );

    for (const pay of invPayments) {
      rows.push({
        date: pay.date,
        transaction: "Payment",
        details: pay.description || "Payment received",
        amount: null,
        payment: pay.amount,
        type: "payment",
        clientName: (inv.client as any)?.name
      });
    }
  }

  // Sort chronologically
  rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate running balance
  let runningBalance = 0;
  const statement = rows.map((row: any) => {
    if (row.type === "invoice") {
      runningBalance += Number(row.amount || 0);
    } else if (row.type === "payment") {
      runningBalance -= Number(row.payment || 0);
    }

    return {
      date: new Date(row.date).toISOString().split("T")[0],
      transaction: row.transaction,
      details: row.details,
      amount: row.amount,
      payment: row.payment,
      balance: runningBalance,
      type: row.type,
      clientName: row.clientName
    };
  });

  return statement.map((row: any) => createReportEntry({
    date: row.date,
    description: `${row.transaction}: ${row.details}`,
    clientName: row.clientName,
    debit: row.amount || 0,
    credit: row.payment || 0,
    balance: row.balance
  }));
};

// ✅ 2. Primary Cash Book (unchanged)
const getPrimaryCashBookData = async (query: any): Promise<ReportEntry[]> => {
  const { client } = query;
  
  const match: any = { type: "primary" };
  if (client) {
    match.reference = { $regex: client as string, $options: "i" };
  }

  const entries = await CashBookEntry.find(match)
    .sort({ date: 1, createdAt: 1 })
    .lean();

  return entries.map((entry: any) => createReportEntry({
    date: entry.date,
    description: entry.description,
    reference: entry.reference,
    debit: entry.debit,
    credit: entry.credit,
    balance: entry.balance
  }));
};

// ✅ 3. Petty Cash Book (unchanged)
const getPettyCashBookData = async (query: any): Promise<ReportEntry[]> => {
  const { client } = query;
  
  const match: any = { type: "petty" };
  if (client) {
    match.reference = { $regex: client as string, $options: "i" };
  }

  const entries = await CashBookEntry.find(match)
    .sort({ date: 1, createdAt: 1 })
    .lean();

  return entries.map((entry: any) => createReportEntry({
    date: entry.date,
    description: entry.description,
    reference: entry.reference,
    debit: entry.debit,
    credit: entry.credit,
    balance: entry.balance
  }));
};


// ✅ FIXED: Loads Report - Proper client population
const getLoadsReportData = async (query: any): Promise<any[]> => {
  const { client, startDate, endDate } = query;

  const match: any = {};
  if (client) match.client = client;
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate as string);
    if (endDate) match.createdAt.$lte = new Date((endDate as string) + "T23:59:59Z");
  }

  const loads = await Invoice.aggregate([
    // ✅ STEP 1: Match invoices
    { $match: match },
    
    // ✅ STEP 2: Lookup clients (like invoice.controller populate)
    {
      $lookup: {
        from: "clients",
        localField: "client",
        foreignField: "_id",
        as: "clientDoc"
      }
    },
    { $unwind: { path: "$clientDoc", preserveNullAndEmptyArrays: true } },
    
    // ✅ STEP 3: Unwind items
    { $unwind: "$items" },
    
    // ✅ STEP 4: Group by invoice + item
    {
      $group: {
        _id: {
          invoice: "$invoiceNumber",
          clientId: "$client",
          clientName: { $ifNull: ["$clientDoc.name", "Unknown"] },
          date: "$createdAt",
          itemDescription: "$items.description"
        },
        quantity: { $sum: "$items.quantity" },
        totalAmount: { $sum: "$items.total" },
        unitPrice: { $first: "$items.unitPrice" }
      }
    },
    
    // ✅ STEP 5: Project final fields
    {
      $project: {
        date: { $dateToString: { format: "%Y-%m-%d", date: "$_id.date" } },
        clientName: "$_id.clientName",
        clientId: "$_id.clientId",
        description: { 
          $concat: ["$_id.invoice", " - ", "$_id.itemDescription"] 
        },
        quantity: "$quantity",
        unitPrice: { $divide: ["$totalAmount", "$quantity"] },
        total: "$totalAmount",
        debit: "$quantity", // PDF compatibility
        balance: "$totalAmount" // PDF compatibility
      }
    },
    
    { $sort: { date: 1, "_id.invoice": 1 } }
  ]);

  return loads;
};

// ✅ 5. Invoices Report (unchanged)
const getInvoicesReportData = async (query: any): Promise<ReportEntry[]> => {
  const { client, startDate, endDate } = query;

  const match: any = {};
  if (client) match.client = client;
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate as string);
    if (endDate) match.createdAt.$lte = new Date((endDate as string) + "T23:59:59Z");
  }

  const invoices = await Invoice.find(match)
    .populate("client", "name")
    .sort({ createdAt: 1 })
    .lean();

  return invoices.map((inv: any) => createReportEntry({
    date: inv.createdAt,
    description: inv.invoiceNumber,
    clientName: inv.client?.name,
    debit: 0,
    credit: inv.totalAmount,
    balance: inv.balance
  }));
};

// ✅ Controllers & PDF (unchanged)
export const getRunningStatements = async (req: Request, res: Response) => {
  const data = await getRunningStatementsData(req.query);
  res.json(data);
};

export const getPrimaryCashBook = async (req: Request, res: Response) => {
  const data = await getPrimaryCashBookData(req.query);
  res.json(data);
};

export const getPettyCashBook = async (req: Request, res: Response) => {
  const data = await getPettyCashBookData(req.query);
  res.json(data);
};

export const getLoadsReport = async (req: Request, res: Response) => {
  const data = await getLoadsReportData(req.query);
  res.json(data);
};

export const getInvoicesReport = async (req: Request, res: Response) => {
  const data = await getInvoicesReportData(req.query);
  res.json(data);
};

export const generatePDFReport = async (req: Request, res: Response) => {
  const { type } = req.params as { type: string };
  const { client, startDate, endDate } = req.query;

  try {
    let reportData: ReportEntry[] = [];
    
    switch (type) {
      case "running statements":
        reportData = await getRunningStatementsData(req.query);
        break;
      case "cashbook":
        reportData = await getPrimaryCashBookData(req.query);
        break;
      case "petty cashbook":
        reportData = await getPettyCashBookData(req.query);
        break;
      case "loads":
        reportData = await getLoadsReportData(req.query);
        break;
      case "invoices":
        reportData = await getInvoicesReportData(req.query);
        break;
      default:
        return res.status(400).json({ error: "Invalid report type" });
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition", 
      `attachment; filename="${type}_report_${new Date().toISOString().split('T')[0]}.pdf"`
    );

    doc.pipe(res);

    // Header (unchanged)
    doc.fontSize(15).text(`${type.toUpperCase()} REPORT`, 50, 50);
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, 50, 80);

    if (client && typeof client === "string") {
      const clientDoc = await Client.findById(client);
      doc.text(`Client: ${clientDoc?.name || client}`, 50, 100);
    }
    if (startDate || endDate) {
      doc.text(`Period: ${startDate || "..."} to ${endDate || "..."}`, 50, 115);
    }

    // Table Headers
    let y = 150;
    doc.fontSize(10).font("Helvetica-Bold")
      .text("Date", 50, y)
      .text("Description", 130, y)
      // .text("Client/Reference", 280, y)
      .text("Debit $", 450, y)
      .text("Credit $", 520, y)
      .text("Balance $", 580, y);
    y += 25;

    // Table Data
    let runningBalance = 0;
    reportData.forEach((row: ReportEntry) => {
      runningBalance += row.debit - row.credit;
      
      doc.fontSize(10).font("Helvetica")
        .text(row.date, 50, y, { width: 80 })
        .text(row.description.substring(0, 25), 130, y, { width: 150 })
        // .text((row.clientName || row.reference || "-").substring(0, 20), 280, y, { width: 170 })
        .text(formatCurrency(row.debit), 450, y, { width: 70, align: "left" })
        .text(formatCurrency(row.credit), 520, y, { width: 60, align: "left" })
        .text(formatCurrency(runningBalance), 580, y, { width: 60, align: "left" });
      
      y += 20;
      if (y > 700) {
        doc.addPage();
        y = 80;
      }
    });

    // Summary
    const totalDebit = reportData.reduce((sum, r) => sum + r.debit, 0);
    doc.fontSize(14).font("Helvetica-Bold")
      .text("TOTAL", 450, y + 30)
      .text(formatCurrency(totalDebit), 520, y + 30, { width: 60, align: "right" })
      .text(formatCurrency(runningBalance), 580, y + 30, { width: 60, align: "right" });

    doc.end();
  } catch (error) {
    console.error("PDF Generation Error:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
};