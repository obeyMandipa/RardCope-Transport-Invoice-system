// server.tsx
// This file contains the main Express server setup, including middleware, routes, and Swagger documentation.
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger.json";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";
import clientRoutes from "./routes/client.routes";
import invoiceRoutes from "./routes/invoice.routes";
import statementRoutes from "./routes/statement.routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/statements", statementRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/swagger.json", (req, res) => {
  res.json(swaggerDocument);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
  console.log(`Swagger JSON: http://localhost:${PORT}/swagger.json`);
});