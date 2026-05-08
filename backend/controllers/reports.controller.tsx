// backend/controllers/reports.controller.tsx
// This file contains the Express controllers for generating various financial reports (statements, cash books, loads, invoices) and downloading them as PDFs.

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

// ✅ Helper function to safely create ReportEntry
const createReportEntry = (data: any): ReportEntry => ({
  date: data.date || new Date().toISOString().split('T')[0],
  description: (data.description || data.invoiceNumber || "N/A").toString(),
  clientName: data.clientName || data.client?.name || undefined,
  reference: data.reference || undefined,
  debit: Number(data.debit) || 0,
  credit: Number(data.credit) || 0,
  balance: Number(data.balance) || 0
});

// ✅ 1. Running Statements - Fixed aggregation pipeline
const getRunningStatementsData = async (query: any): Promise<ReportEntry[]> => {
  const { client, startDate, endDate } = query;
  
  const match: any = { client: { $exists: true } };
  if (client) match.client = client;
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate as string);
    if (endDate) match.createdAt.$lte = new Date((endDate as string) + "T23:59:59Z");
  }

  const invoices = await Invoice.aggregate([
    { $match: match },
    { 
      $lookup: { 
        from: "payments", 
        localField: "_id", 
        foreignField: "invoice", 
        as: "payments" 
      } 
    },
    {
      $addFields: {
        paid: { $sum: { $ifNull: ["$payments.amount", 0] } },
        balance: { $subtract: ["$totalAmount", { $sum: { $ifNull: ["$payments.amount", 0] } }] }
      }
    },
    {
      $project: {
        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        description: "$invoiceNumber",
        clientName: { $ifNull: ["$client.name", "Unknown"] },
        debit: 0,
        credit: "$totalAmount",
        balance: "$balance"
      }
    },
    { $sort: { date: 1 } }
  ]);

  return invoices.map((inv: any) => createReportEntry({
    ...inv,
    description: inv.description,
    clientName: inv.clientName
  }));
};

// ✅ 2. Primary Cash Book
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

// ✅ 3. Petty Cash Book
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

// ✅ 4. Loads Report
const getLoadsReportData = async (query: any): Promise<ReportEntry[]> => {
  const { client, startDate, endDate } = query;

  const match: any = {};
  if (client) match.client = client;
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate as string);
    if (endDate) match.createdAt.$lte = new Date((endDate as string) + "T23:59:59Z");
  }

  const loads = await Invoice.aggregate([
    { $match: match },
    { $unwind: "$items" },
    {
      $group: {
        _id: {
          invoice: "$invoiceNumber",
          client: { $ifNull: ["$client.name", "Unknown"] },
          date: "$createdAt"
        },
        totalQuantity: { $sum: "$items.quantity" },
        totalAmount: { $sum: "$items.total" }
      }
    },
    {
      $project: {
        date: { $dateToString: { format: "%Y-%m-%d", date: "$_id.date" } },
        description: "$_id.invoice",
        clientName: "$_id.client",
        debit: "$totalQuantity",
        credit: 0,
        balance: "$totalAmount"
      }
    },
    { $sort: { date: 1 } }
  ]);

  return loads.map((item: any) => createReportEntry({
    date: item.date,
    description: item.description,
    clientName: item.clientName,
    debit: item.debit,
    credit: item.credit,
    balance: item.balance
  }));
};

// ✅ 5. Invoices Report
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

// ✅ Export controllers
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

// ✅ PDF Generator
export const generatePDFReport = async (req: Request, res: Response) => {
  const { type } = req.params as { type: string };
  const { client, startDate, endDate } = req.query;

  try {
    let reportData: ReportEntry[] = [];
    
    switch (type) {
      case "statements":
        reportData = await getRunningStatementsData(req.query);
        break;
      case "primary":
        reportData = await getPrimaryCashBookData(req.query);
        break;
      case "petty":
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

    // Header
    doc.fontSize(20).text(`${type.toUpperCase()} REPORT`, 50, 50);
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
      .text("Client/Reference", 280, y)
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
        .text((row.clientName || row.reference || "-").substring(0, 20), 280, y, { width: 170 })
        .text(formatCurrency(row.debit), 450, y, { width: 70, align: "right" })
        .text(formatCurrency(row.credit), 520, y, { width: 60, align: "right" })
        .text(formatCurrency(runningBalance), 580, y, { width: 60, align: "right" });
      
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