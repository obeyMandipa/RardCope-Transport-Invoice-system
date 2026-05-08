// backend/routes/reports.routes.tsx
// This file contains the Express routes for generating various financial reports (statements, cash books, loads, invoices) and downloading them as PDFs.

import { Router } from "express";
import {
  getRunningStatements,
  getPrimaryCashBook,
  getPettyCashBook,
  getLoadsReport,
  getInvoicesReport,
  generatePDFReport
} from "../controllers/reports.controller";

const router = Router();

router.get("/statements", getRunningStatements);
router.get("/primary", getPrimaryCashBook);
router.get("/petty", getPettyCashBook);
router.get("/loads", getLoadsReport);
router.get("/invoices", getInvoicesReport);
router.get("/:type/pdf", generatePDFReport);

export default router;