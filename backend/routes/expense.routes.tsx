// routes/expense.route.tsx
// This file contains the Express routes for managing expenses (CRUD operations).

import { Router } from "express";
import { createExpense, getExpenses, deleteExpense } from "../controllers/expense.controller";
import { auth } from "../middlewares/auth.middleware";

const router = Router();
router.use(auth);

router.post("/", createExpense);
router.get("/", getExpenses);
router.delete("/:id", deleteExpense);

export default router;