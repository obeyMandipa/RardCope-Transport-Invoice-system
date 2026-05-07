// routes/cashbook.routes.tsx
// This file contains the Express routes for managing cash book entries (CRUD operations).

import { Router } from "express";
import { createCashBookEntry, getCashBookEntries, deleteCashBookEntry } from "../controllers/cashbook.controller";
import { auth } from "../middlewares/auth.middleware";

const router = Router();
router.use(auth);

router.post("/", createCashBookEntry);
router.get("/", getCashBookEntries);
router.delete("/:id", deleteCashBookEntry);

export default router;