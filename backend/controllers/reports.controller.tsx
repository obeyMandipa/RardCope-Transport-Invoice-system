// backend/controllers/reports.controller.tsx
// This file contains the Express controllers for generating various financial reports (statements, cash books, loads, invoices) and downloading them as PDFs.

// backend/controllers/reports.controller.tsx
import { Request, Response } from "express";
import { Invoice } from "../models/Invoice";
import { Payment } from "../models/Payment";
import { CashBookEntry } from "../models/CashBookEntry";
import { Client } from "../models/Client";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";

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

// ✅ 1. runningstatements
const getRunningStatementsData = async (query: any): Promise<ReportEntry[]> => {
  const { client, startDate, endDate } = query as { client?: string; startDate?: string; endDate?: string };
  
  const clientMatch: any = client ? { client: client } : { client: { $exists: true } };
  const dateFilter: any = {};
  
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date((endDate as string) + "T23:59:59Z");
  }

  const invoices = await Invoice.find({ ...clientMatch, ...dateFilter })
    .populate("client", "name")
    .sort({ createdAt: 1 });

  const invoiceIds = invoices.map((inv: any) => inv._id);
  const paymentFilter: any = { invoice: { $in: invoiceIds } };
  
  if (startDate || endDate) {
    paymentFilter.date = {};
    if (startDate) paymentFilter.date.$gte = new Date(startDate);
    if (endDate) paymentFilter.date.$lte = new Date((endDate as string) + "T23:59:59Z");
  }

  const payments = await Payment.find(paymentFilter).sort({ date: 1 });

  const rows: any[] = [];
  for (const inv of invoices) {
    rows.push({
      date: inv.createdAt,
      transaction: inv.invoiceNumber,
      details: inv.items.map((item: any) => item.description).join(", "),
      amount: inv.totalAmount,
      payment: null,
      type: "invoice",
      clientName: (inv.client as any)?.name
    });

    const invPayments = payments.filter((p: any) => p.invoice.toString() === inv._id.toString());
    for (const pay of invPayments) {
      rows.push({
        date: pay.date,
        transaction: "Payment",
        details: pay.description || "Payment received from",
        amount: null,
        payment: pay.amount,
        type: "payment",
        clientName: (inv.client as any)?.name
      });
    }
  }

  rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let runningBalance = 0;
  const statement = rows.map((row: any) => {
    if (row.type === "invoice") runningBalance += Number(row.amount || 0);
    else if (row.type === "payment") runningBalance -= Number(row.payment || 0);

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

// ✅ Other data functions (unchanged but type-safe)
const getPrimaryCashBookData = async (query: any): Promise<ReportEntry[]> => {
  const { client } = query as { client?: string };
  const match: any = { type: "primary" };
  if (client) match.reference = { $regex: client, $options: "i" };

  const entries = await CashBookEntry.find(match).sort({ date: 1, createdAt: 1 }).lean();
  return entries.map((entry: any) => createReportEntry(entry));
};

const getPettyCashBookData = async (query: any): Promise<ReportEntry[]> => {
  const { client } = query as { client?: string };
  const match: any = { type: "petty" };
  if (client) match.reference = { $regex: client, $options: "i" };

  const entries = await CashBookEntry.find(match).sort({ date: 1, createdAt: 1 }).lean();
  return entries.map((entry: any) => createReportEntry(entry));
};

const getLoadsReportData = async (query: any): Promise<any[]> => {
  const { client, startDate, endDate } = query as { client?: string; startDate?: string; endDate?: string };

  const match: any = {};
  if (client) match.client = client;
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date((endDate as string) + "T23:59:59Z");
  }

  const loads = await Invoice.aggregate([
    // STEP 1: Match invoices
    { $match: match },
    
    // STEP 2: Lookup clients
    {
      $lookup: {
        from: "clients",
        localField: "client",
        foreignField: "_id",
        as: "clientDoc"
      }
    },
    { $unwind: { path: "$clientDoc", preserveNullAndEmptyArrays: true } },
    
    // STEP 3: Unwind items
    { $unwind: "$items" },
    
    // STEP 4: Group by invoice + item
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
    
    // STEP 5: Project final fields
    {
      $project: {
        date: { $dateToString: { format: "%Y-%m-%d", date: "$_id.date" } },
        clientName: "$_id.clientName",
        clientId: "$_id.clientId",
        description: { 
          // $concat: ["$_id.invoice", " - ", "$_id.itemDescription"] 
          $concat: ["$_id.itemDescription"] 
        },
        quantity: "$quantity",
        unitPrice: { $divide: ["$totalAmount", "$quantity"] },
        total: "$totalAmount",
        debit: "$quantity",
        balance: "$totalAmount"
      }
    },
    
    { $sort: { date: 1, "_id.invoice": 1 } }
  ]);

  return loads; // ✅ FIXED: Return the result!
};

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

// Controllers
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

// ✅ FIXED: PDF Generation
export const generatePDFReport = async (req: Request, res: Response) => {
  const { type } = req.params as { type: string };
  const decodedType = decodeURIComponent(type);

  const { client, startDate, endDate } = req.query as { client?: string; startDate?: string; endDate?: string };

  try {
    let reportData: ReportEntry[] = [];
    
switch (decodedType) {
      case "runningstatements":
        reportData = await getRunningStatementsData(req.query);
        break;
      case "cashbook":
        reportData = await getPrimaryCashBookData(req.query);
        break;
      case "pettycashbook":
        reportData = await getPettyCashBookData(req.query);
        break;
      case "loads":
        reportData = await getLoadsReportData(req.query) as any[];
        break;
      case "invoices":
        reportData = await getInvoicesReportData(req.query);
        break;
      default:
        return res.status(400).json({ error: `Invalid report type: ${decodedType}` });
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${decodedType}_report.pdf"`);

    doc.pipe(res);

    // Header
doc.fontSize(20).text(`${decodedType.toUpperCase()} REPORT`, 50, 50);
    
    // Table
    const colWidths = [60, 200, 60, 60, 70]; // ✅ Fixed undefined
    const headers = ["Date", "Description", "Debit", "Credit", "Balance"];
    
    let y = 120;
    doc.fontSize(10).font("Helvetica-Bold");
    let x = 50;
    headers.forEach((header, i) => {
      doc.text(header, x, y);
      x += (colWidths[i] as number);
    });
    y += 25;

    // Data rows
    let runningBalance = 0;
    doc.font("Helvetica");
    reportData.forEach(row => {
      runningBalance += row.debit - row.credit;
      x = 50;
      const dateStr = row.date ? new Date(row.date).toLocaleDateString('en-GB') : '';
      [dateStr, row.description, formatCurrency(row.debit), formatCurrency(row.credit), formatCurrency(runningBalance)]
        .forEach((val, i) => {
          doc.text(val.toString(), x, y);
          x += (colWidths[i] as number);
        });
      y += 20;
    });

    doc.end();
  } catch (error) {
    console.error("PDF Error:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
};

// ✅ FIXED: Excel Export (properly exported)
export const exportExcelReport = async (req: Request, res: Response) => {
  const { type } = req.params as { type: string };
  const decodedType = decodeURIComponent(type);
  const { noHeader } = req.query as { noHeader?: string };

  try {
    let reportData: any[] = [];
    
    // 1. Fetch the correct data based on the type
    switch (decodedType) {
      case "runningstatements":
        reportData = await getRunningStatementsData(req.query);
        break;
      case "cashbook":
        reportData = await getPrimaryCashBookData(req.query);
        break;
      case "pettycashbook":
        reportData = await getPettyCashBookData(req.query);
        break;
      case "loads":
        reportData = await getLoadsReportData(req.query);
        break;
      case "invoices":
        reportData = await getInvoicesReportData(req.query);
        break;
      default:
        return res.status(400).json({ error: `Invalid report type: ${decodedType}` });
    }

    // 2. Initialize Workbook
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Report");
    
    // 3. Add Headers (Unless noHeader is explicitly requested)
    // Note: I reversed your logic because usually 'noHeader' means "don't show".
    // If you want them always, remove the if check.
    if (noHeader) {
      sheet.addRow(["Date", "Description", "Debit $", "Credit $", "Balance $"]);
      sheet.getRow(1).font = { bold: true };
    }

    // 4. Fill Data
    let runningBalance = 0;
    reportData.forEach(row => {
      // Calculate running balance if not pre-calculated
      const dr = Number(row.debit || row.quantity || 0);
      const cr = Number(row.credit || 0);
      runningBalance += (dr - cr);

      sheet.addRow([
        row.date ? new Date(row.date).toLocaleDateString('en-GB') : '',
        row.description || '',
        dr,
        cr,
        row.balance || runningBalance
      ]);
    });

    // 5. Set Headers and Send
    res.setHeader(
      'Content-Type', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition', 
      `attachment; filename="${decodedType}_report_${new Date().toISOString().split('T')[0]}.xlsx"`
    );
    
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Excel Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to export Excel" });
    }
  }
};