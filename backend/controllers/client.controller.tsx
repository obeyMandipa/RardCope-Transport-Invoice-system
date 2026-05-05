// client.controller.tsx
// This file contains the controller functions for managing clients (CRUD operations).

import { Request, Response } from "express";
import { Client } from "../models/client";

export const createClient = async (req: Request, res: Response) => {
  const client = Client.build(req.body);
  await client.save();
  res.json(client);
};

export const getClients = async (req: Request, res: Response) => {
  const clients = await Client.find();
  res.json(clients);
};

export const getClient = async (req: Request, res: Response) => {
  const client = await Client.findById(req.params.id);
  if (!client) return res.status(404).json({ error: "Client not found" });
  res.json(client);
};

export const updateClient = async (req: Request, res: Response) => {
  const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!client) return res.status(404).json({ error: "Client not found" });
  res.json(client);
};

export const deleteClient = async (req: Request, res: Response) => {
  const client = await Client.findByIdAndDelete(req.params.id);
  if (!client) return res.status(404).json({ error: "Client not found" });
  res.json({ message: "Client deleted" });
};