//  src/pages/Clients.tsx
// This file contains the Clients page component which displays a list of clients and allows users to manage them.

import { ClientList } from "../components/ClientList";

export const Clients = () => {
  return (
    <div>
      <h1 className="text-[40px]">Clients</h1>
      <ClientList />
    </div>
  );
};