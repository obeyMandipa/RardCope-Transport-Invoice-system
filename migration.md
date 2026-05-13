## **Data Migration Process** - Step-by-Step + Templates

### **🎯 Process Overview (5 Steps)**

```
1. EXPORT Old Data (Excel/CSV/JSON)
2. CLEAN & Transform (Excel/Google Sheets)
3. CREATE Templates (JSON files)
4. RUN Migration Script
5. VERIFY & Fix Numbers
```

***

## **📋 STEP 1: Export Old Data**

**From Old System/Database:**
```
- Clients.csv: name,email,phone
- Invoices.csv: invoiceNumber,clientName,date,totalAmount,paid,balance
- InvoiceItems.csv: invoiceNumber,description,qty,unitPrice,total
- Payments.csv: invoiceNumber,date,amount,description  
- CashBook.csv: type,date,description,reference,debit,credit,balance
```

***

## **📋 STEP 2: Transform in Excel**

**Clients Template:**
| name              | email                    | phone       |
|-------------------|--------------------------|-------------|
| ABC Construction  | abc@construction.com     | +263123456  |

**Invoices Template (Separate Items):**
| invoiceNumber | clientName        | date       | totalAmount | paid | balance |
|---------------|-------------------|------------|-------------|------|---------|
| INV-0001      | ABC Construction  | 2026-05-01 | 1000        | 400  | 600     |

**InvoiceItems Template:**
| invoiceNumber | description       | qty | unitPrice | total |
|---------------|-------------------|-----|------------|-------|
| INV-0001      | Cement 50kg bags  | 10  | 50         | 500   |

***

## **📋 STEP 3: JSON Templates**

**`scripts/old-clients.json`:**
```json
[
  {"name": "ABC Construction", "email": "abc@construction.com", "phone": "+263123456"},
  {"name": "XYZ Builders", "email": "xyz@builders.co.zw", "phone": "+263789012"}
]
```

**`scripts/old-invoices.json`:**
```json
[
  {
    "invoiceNumber": "INV-0001",
    "clientName": "ABC Construction",
    "items": [
      {"description": "Cement 50kg bags", "quantity": 10, "unitPrice": 50, "total": 500},
      {"description": "Sand", "quantity": 20, "unitPrice": 25, "total": 500}
    ],
    "totalAmount": 1000,
    "paid": 400,
    "balance": 600,
    "date": "2026-05-01",
    "payments": [
      {"date": "2026-05-02", "amount": 400, "description": "Bank transfer"}
    ]
  }
]
```

**`scripts/old-cashbook.json`:**
```json
[
  {
    "type": "primary",
    "date": "2026-05-01",
    "description": "Fuel purchase",
    "reference": "ABC Construction",
    "debit": 200,
    "credit": 0,
    "balance": 200
  }
]
```

***

## **📋 STEP 4: Migration Script (`scripts/migrate.ts`)**

```typescript
// 1. Connect MongoDB
await mongoose.connect('mongodb://localhost:27017/invoicing');

// 2. Import Clients (create Client docs)
const clients = await Client.insertMany(oldClients);
const clientMap = new Map(clients.map(c => [c.name.toLowerCase(), c._id]));

// 3. Import Invoices + Link Clients
for (oldInv of oldInvoices) {
  const clientId = clientMap.get(oldInv.clientName.toLowerCase());
  const invoice = new Invoice({ client: clientId, ...oldInv });
  await invoice.save();
  
  // 4. Import Payments (link to invoice)
  for (payment of oldInv.payments) {
    new Payment({ invoice: invoice._id, ...payment }).save();
  }
}

// 5. Import CashBook
await CashBookEntry.insertMany(oldCashBook);

// 6. Fix Invoice Numbers (INV-0001, INV-0002...)
await fixInvoiceNumbers();
```

***

## **📋 STEP 5: Run & Verify**

```bash
# Dry run first
node scripts/migrate.js --dry-run

# Full migration  
node scripts/migrate.js

# Verify counts
db.clients.count()     // Should match old clients
db.invoices.count()    // Should match old invoices
db.payments.count()    // Should match old payments
```

***

## **⚠️ Prod Migration Checklist**
```
✅ Backup old database
✅ Test migration on staging
✅ Verify client links (no orphans)
✅ Check invoice numbers sequential
✅ Validate totals (invoice vs payments)
✅ Test PDF generation (10 random invoices)
✅ Deploy frontend (new schema compatible)
```

## **⏱️ Time Estimate:**
```
Small dataset (<1000 records): 30 mins
Large dataset (>10k records): 2-3 hours
```

**Export → Transform → JSON → Migrate → Verify! Zero downtime!** 🔄✅