// payment.routes.tsx
// Express routes for payments

import { Router } from "express";
import {
  createPayment,
  getPayments,
  // getPaymentsForInvoice,
  deletePayment,
} from "../controllers/payment.controller";
import { auth } from "../middlewares/auth.middleware";

const router = Router();

router.use(auth);
router.post("/", createPayment);
router.get("/", getPayments);
// router.get("/invoice/:invoiceId", getPaymentsForInvoice);
router.delete("/:id", deletePayment);

export default router;