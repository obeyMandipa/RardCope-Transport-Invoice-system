// invoiceNumber.tsx
// This file contains the utility function to generate unique invoice numbers in the format YYMMDD-0001.

// YYMMDD-0001
export const generateInvoiceNumber = async (
  InvoiceModel: any // pass Invoice model as arg
): Promise<string> => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const prefix = `${year}${month}${day}`;

  const last = await InvoiceModel.findOne(
    { invoiceNumber: new RegExp(`^${prefix}-`) },
    {},
    { sort: { invoiceNumber: -1 } }
  );

  let num = 1;
  if (last) {
    const parts = last.invoiceNumber.split("-");
    const lastNum = parseInt(parts[1], 10);
    num = lastNum + 1;
  }

  return `${prefix}-${num.toString().padStart(4, "0")}`;
};