// statement.routes.tsx
// This file contains the Express routes for generating a statement of account for a client.

import { Router } from "express";
import { getStatement } from "../controllers/statement.controller";
import { auth } from "../middlewares/auth.middleware";

const router = Router();

router.use(auth);
router.get("/:clientId", getStatement);

export default router;