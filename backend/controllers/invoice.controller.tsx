// invoice.controller.tsx
// This file contains the controller functions for managing invoices (CRUD operations and download).

// invoice.controller.ts
import { Request, Response } from "express";
import { Invoice } from "../models/Invoice";
import { Client } from "../models/Client"; // ✅ Fixed import path
import { generateInvoiceNumber } from "../utils/invoiceNumber";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const createInvoice = async (req: Request, res: Response) => { // ✅ Complete function wrapper
  try {
    const { client, items, dueDate, notes } = req.body; // client = clientName from frontend
    
    // Look up client by name (case insensitive)
    const clientDoc = await Client.findOne({ name: { $regex: new RegExp(`^${client}$`, 'i') } });
    if (!clientDoc) {
      return res.status(400).json({ error: "Client not found. Create client first." });
    }
    
    const totalAmount = items.reduce((sum: number, item: any) => sum + item.total, 0);
    const balance = totalAmount;
    
    const invoiceNumber = await generateInvoiceNumber(Invoice);
    
    const invoice = Invoice.build({
      client: clientDoc._id,
      invoiceNumber,
      items,
      totalAmount,
      paid: 0,
      balance,
      dueDate,
      notes,
    });
    
    await invoice.save();
    
    // Return populated invoice
    const populatedInvoice = await Invoice.findById(invoice._id).populate("client", "name email phone");
    res.status(201).json(populatedInvoice);
  } catch (error) {
    console.error("Create invoice error:", error);
    res.status(500).json({ error: "Failed to create invoice" });
  }
};

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const invoices = await Invoice.find().populate("client", "name email phone");
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
};

export const getInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("client", "name email phone address");
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
};

export const downloadInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("client");
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    
    res.json({
      success: true,
      invoice: {
        number: invoice.invoiceNumber,
        client: invoice.client,
        items: invoice.items,
        totalAmount: invoice.totalAmount,
        balance: invoice.balance,
        createdAt: invoice.createdAt,
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to download invoice" });
  }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    await Invoice.findByIdAndDelete(id);
    
    res.json({ 
      message: `Invoice ${invoice.invoiceNumber} deleted successfully`,
      deletedId: id 
    });
  } catch (error) {
    console.error("Delete invoice error:", error);
    res.status(500).json({ error: "Failed to delete invoice" });
  }
};

// ✅ NEW: Download invoice as PDF 
export const generateInvoicePDF = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("client", "name email phone address");
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${invoice.invoiceNumber}_INVOICE.pdf"`);
    doc.pipe(res);

    // --- BRANDED HEADER (Exact positions as requested) ---
    const headerHeight = 150;
    const pageWidth = doc.page.width;
    const margin = 50;
    const companyNameX = 150;
    const contactStartX = 400;
    const contactWidth = 250;

    // 1. Red Triangle (Top Right)
    doc.save()
       .moveTo(pageWidth - 300, 0)
       .lineTo(pageWidth, 0)
       .lineTo(pageWidth, 70)
       .fill('#ef4444');

    // 2. Logo
    const logoPath = path.join(__dirname, "..", "..", "frontend", "src", "assets", "logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 30, { height: 90 });
    }

    // 3. Company Name
    doc.fillColor('#ef4444')
       .fontSize(22)
       .font("Helvetica")
       .text("Rardcope Transport", companyNameX, 65, { width: 250 });

    // 4. Contact Info (Fixed width, no overflow)
    doc.fillColor('#000000')
       .fontSize(10)
       .font("Helvetica")
       .text("+263 42 759 290 / +263 779 711 229", contactStartX, 45, { width: contactWidth })
       .text("+263 736 919 099", contactStartX, 58, { width: contactWidth })
       .text("304 Empowerment Way, Willowvale", contactStartX, 71, { width: contactWidth })
       .text("Harare", contactStartX, 84, { width: contactWidth })
       .text("rardcopetransport@gmail.com", contactStartX, 97, { width: contactWidth })
       .fillColor('#2563eb')
       .fontSize(9)
       .text("www.rardcopetransport.co.zw", contactStartX, 110, { width: contactWidth });

    doc.restore();
    // --- END HEADER ---

    // Invoice Header (Matches Modal)
    let y = 200;
    doc.fillColor('#000000').fontSize(16).font("Helvetica")
       .text(`Invoice No: ${invoice.invoiceNumber}`, 50, y);
    y += 35;

    const populatedClient = invoice.client as { name?: string; email?: string; phone?: string };

    doc.fontSize(20).font("Helvetica")
       .text(populatedClient.name || '', 50, y);
    y += 25;

    if (populatedClient.email || populatedClient.phone) {
      doc.fontSize(14).text(`${populatedClient.email || ''}${populatedClient.email && populatedClient.phone ? ' • ' : ''}${populatedClient.phone || ''}`, 50, y);
      y += 30;
    }

    // Items Table (Modal Layout - Total at Bottom)
doc.fontSize(14).font("Helvetica").text("Invoice Items", 50, y);
y += 35;

// Table Headers (No Total column)
const colWidths = [60, 280, 70, 100]; // Adjusted: Date | Description | Qty | Unit Price
const headers = ["Date", "Description", "Qty", "Unit Price"];

doc.fontSize(11).font("Helvetica").fillColor('#000000');
let x = 50;
headers.forEach((header, i) => {
  doc.text(header, x, y, { width: colWidths[i], align: i > 2 ? 'right' : 'left' });
  x += (colWidths[i] as number);
});
y += 25;

// Header underline
doc.moveTo(50, y - 5).lineTo(pageWidth - 50, y - 5).stroke('#e5e7eb');

// Items Rows (Description gets more space)
doc.fontSize(10).font("Helvetica");
invoice.items.forEach((item: any) => {
  x = 50;
  const dateStr = new Date(invoice.createdAt).toLocaleDateString('en-GB');
  
  const values = [
    dateStr,
    item.description,           // Wider column
    item.quantity.toString(),
    `$${item.unitPrice.toFixed(2)}`
  ];

  values.forEach((val, i) => {
    doc.text(val.toString(), x, y, { 
      width: colWidths[i], 
      align: i > 2 ? 'right' : 'left',
      lineBreak: true 
    });
    x += (colWidths[i] as number);
  });
  y += 22;
});

/// ✅ TOTAL at Bottom (Single Line, Perfect Right Alignment)
doc.fontSize(12).font("Helvetica").fillColor('#000000');

// Calculate exact position under Unit Price column (right edge)
const unitPriceColEnd = 50 + colWidths.reduce((sum: number, w: number, i: number) => i < 3 ? sum + w : sum, 0);
const totalAmount = invoice.items.reduce((sum: number, item: any) => sum + item.total, 0);

// Draw underline for total row
doc.moveTo(50, y + 8).lineTo(pageWidth - 50, y + 8).stroke('#e5e7eb');

// TOTAL label (left of amount)
// doc.text("TOTAL:", unitPriceColEnd - 120, y + 12, { align: 'right', width: 100 });

// Amount (right-aligned in Unit Price column space)
doc.text(`$${totalAmount.toFixed(2)}`, unitPriceColEnd + 20, y + 12, { 
  align: 'right', 
  width: 80 
});

    // Banking Details (Bottom Left)
    y += 40;
    doc.fontSize(12).font("Helvetica").text("BANKING DETAILS", 50, y);
    y += 25;
    
    doc.fontSize(11).font("Helvetica").text("BANK: ZB", 50, y);
    y += 18;
    doc.text("ACC NAME: 4125469593405", 50, y);
    y += 18;
    doc.text("BRANCH: WESTGATE", 50, y);
    y += 18;
    doc.text("ACCOUNT: 4125469593405", 50, y);
    y += 18;
    doc.text("PHONE: 0779 711 229", 50, y);

    doc.end();
  } catch (error) {
    console.error("Invoice PDF Error:", error);
    res.status(500).json({ error: "Failed to generate invoice PDF" });
  }
};