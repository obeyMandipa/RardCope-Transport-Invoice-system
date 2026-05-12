// invoice.routes.tsx
// This file contains the Express routes for managing invoices (CRUD operations and download).

import { Router } from "express";
import { createInvoice, getInvoices, getInvoice, downloadInvoice, deleteInvoice } from "../controllers/invoice.controller";
import { auth } from "../middlewares/auth.middleware";
import { generateInvoicePDF } from "../controllers/invoice.controller";

const router = Router();    

router.use(auth);
router.route("/").post(createInvoice).get(getInvoices);
router.route("/:id").get(getInvoice).get(downloadInvoice);
router.delete('/:id', deleteInvoice);

router.get("/:id/pdf", generateInvoicePDF); 
export default router;