// client.routes.tsx
// This file contains the Express routes for managing clients (CRUD operations).

import { Router } from "express";
import { createClient, getClients, getClient, updateClient, deleteClient } from "../controllers/client.controller";
import { auth } from "../middlewares/auth.middleware";

const router = Router();

router.use(auth); // Protect all client routes
router.route("/").post(createClient).get(getClients);
router.route("/:id").get(getClient).put(updateClient).delete(deleteClient);

export default router;