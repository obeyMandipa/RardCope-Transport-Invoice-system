// backend/routes/reports.routes.tsx
// This file contains the Express routes for generating various financial reports (statements, cash books, loads, invoices) and downloading them as PDFs.

// backend/routes/reports.routes.tsx
import { Router } from "express";
import {
  getRunningStatements,
  getPrimaryCashBook,
  getPettyCashBook,
  getLoadsReport,
  getInvoicesReport,
  generatePDFReport,
  exportExcelReport
} from "../controllers/reports.controller";

const router = Router();

router.get("/:type/pdf", generatePDFReport);
router.get("/:type/excel", exportExcelReport);

// ✅ SPECIFIC ROUTES FIRST (before param routes)
router.get("/runningstatements", getRunningStatements);
router.get("/cashbook", getPrimaryCashBook);
router.get("/pettycashbook", getPettyCashBook);
router.get("/loads", getLoadsReport);
router.get("/invoices", getInvoicesReport);

// ✅ PDF & Excel AFTER specific routes (use exact matches)
router.get("/runningstatements/pdf", generatePDFReport);
router.get("/cashbook/pdf", generatePDFReport);
router.get("/pettycashbook/pdf", generatePDFReport);
router.get("/loads/pdf", generatePDFReport);
router.get("/invoices/pdf", generatePDFReport);

router.get("/runningstatements/excel", exportExcelReport);
router.get("/cashbook/excel", exportExcelReport);
router.get("/pettycashbook/excel", exportExcelReport);
router.get("/loads/excel", exportExcelReport);
router.get("/invoices/excel", exportExcelReport);

export default router;