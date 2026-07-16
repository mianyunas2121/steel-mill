'use client';

import { useState } from 'react';
import { formatCurrency, formatWeight } from '../utils/helpers';
import { format } from 'date-fns';
import { Printer, Download, X, Pencil } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function InvoiceView({ transaction, settings, onClose, onRecordPayment, onEdit }) {
  const [printing, setPrinting] = useState(false);

  if (!transaction) return null;

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 100);
  };

  const handleDownloadPDF = async () => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('invoice-content');
      html2pdf()
        .set({
          margin: 10,
          filename: `${transaction.invoiceNumber}.pdf`,
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(element)
        .save();
    } catch (err) {
      console.error('PDF error:', err);
      handlePrint();
    }
  };

  const company = settings || {};

  return (
    <div className="fixed inset-0 z-modal bg-[var(--surface-overlay)] flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-surface-raised rounded-md shadow-dropdown w-full max-w-3xl my-8 border border-line">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line no-print bg-surface">
          <div>
            <p className="text-2xs uppercase tracking-wider text-ink-subtle font-semibold">Tax Invoice</p>
            <h2 className="text-base font-semibold text-ink tabular-nums">{transaction.invoiceNumber}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn-outline btn-sm" disabled={printing}>
              <Printer size={14} /> Print
            </button>
            <button onClick={handleDownloadPDF} className="btn-outline btn-sm">
              <Download size={14} /> PDF
            </button>
            {onEdit && (
              <button onClick={onEdit} className="btn-outline btn-sm">
                <Pencil size={14} /> Edit
              </button>
            )}
            {onRecordPayment && transaction.paymentStatus !== 'PAID' && (
              <button onClick={onRecordPayment} className="btn-primary btn-sm">
                Record Payment
              </button>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-surface rounded-md text-ink-subtle" aria-label="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        <div id="invoice-content" className="p-8 print:p-0">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-xl font-semibold text-ink tracking-tight">
                {company.companyName || 'Steel Mill'}
              </h1>
              <p className="text-sm text-ink-muted mt-1 whitespace-pre-line">{company.companyAddress}</p>
              {company.companyGST && (
                <p className="text-sm text-ink-muted tabular-nums">NTN / GST: {company.companyGST}</p>
              )}
              {company.companyPhone && (
                <p className="text-sm text-ink-muted tabular-nums">Ph: {company.companyPhone}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xs uppercase tracking-wider text-ink-subtle font-semibold">Invoice</p>
              <p className="font-semibold text-lg text-ink tabular-nums">{transaction.invoiceNumber}</p>
              <p className="text-sm text-ink-muted mt-1 tabular-nums">
                {format(new Date(transaction.invoiceDate), 'dd MMM yyyy')}
              </p>
              <div className="mt-2 flex justify-end">
                <StatusBadge status={transaction.paymentStatus} />
              </div>
            </div>
          </div>

          <div className="mb-8 p-4 bg-surface rounded-md border border-line">
            <p className="text-2xs uppercase tracking-wider text-ink-subtle mb-1 font-semibold">
              {transaction.type === 'INCOMING' ? 'Supplier' : 'Bill To'}
            </p>
            <p className="font-semibold text-ink">{transaction.customer?.name}</p>
            {transaction.customer?.address && (
              <p className="text-sm text-ink-muted">{transaction.customer.address}</p>
            )}
            {transaction.customer?.gstNumber && (
              <p className="text-sm text-ink-muted tabular-nums">GST: {transaction.customer.gstNumber}</p>
            )}
            {transaction.customer?.contactNumber && (
              <p className="text-sm text-ink-muted tabular-nums">Ph: {transaction.customer.contactNumber}</p>
            )}
          </div>

          <table className="w-full mb-6 text-sm">
            <thead>
              <tr className="border-b-2 border-line-strong">
                <th className="text-left py-2 text-ink-subtle font-semibold text-2xs uppercase tracking-wider">
                  Description
                </th>
                <th className="text-right py-2 text-ink-subtle font-semibold text-2xs uppercase tracking-wider">
                  Weight
                </th>
                <th className="text-right py-2 text-ink-subtle font-semibold text-2xs uppercase tracking-wider">
                  Rate/KG
                </th>
                <th className="text-right py-2 text-ink-subtle font-semibold text-2xs uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line">
                <td className="py-3">
                  <span className="font-medium text-ink">{transaction.materialType}</span>
                  <span className="ml-2 inline-flex">
                    <StatusBadge status={transaction.type} />
                  </span>
                </td>
                <td className="text-right py-3 tabular-nums">{formatWeight(transaction.weight)}</td>
                <td className="text-right py-3 tabular-nums">{formatCurrency(transaction.pricePerKG)}</td>
                <td className="text-right py-3 tabular-nums font-medium">
                  {formatCurrency(transaction.materialAmount)}
                </td>
              </tr>
              {transaction.type === 'OUTGOING' && transaction.wasteWeight > 0 && (
                <tr className="border-b border-line">
                  <td className="py-3 text-ink-muted">
                    Waste {transaction.takeWaste ? '(Added)' : '(Discount)'}
                  </td>
                  <td className="text-right py-3 tabular-nums">{formatWeight(transaction.wasteWeight)}</td>
                  <td className="text-right py-3 tabular-nums">{formatCurrency(transaction.wastePrice)}</td>
                  <td className="text-right py-3 tabular-nums">
                    {transaction.takeWaste ? '+' : '-'}
                    {formatCurrency(transaction.wasteAmount)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-ink-subtle">Material Amount</span>
                <span className="tabular-nums">{formatCurrency(transaction.materialAmount)}</span>
              </div>
              {transaction.type === 'OUTGOING' && transaction.wasteAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-ink-subtle">
                    {transaction.takeWaste ? 'Waste Charge' : 'Waste Discount'}
                  </span>
                  <span
                    className={`tabular-nums ${
                      transaction.takeWaste ? 'text-ink' : 'text-status-success'
                    }`}
                  >
                    {transaction.takeWaste ? '+' : '-'}
                    {formatCurrency(transaction.wasteAmount)}
                  </span>
                </div>
              )}
              {transaction.advanceAmount > 0 && (
                <>
                  <div className="flex justify-between text-sm border-t border-line pt-2">
                    <span className="text-ink-subtle">Gross Bill</span>
                    <span className="tabular-nums">
                      {formatCurrency(
                        transaction.grossBill ??
                          Number(transaction.totalBill) + Number(transaction.advanceAmount || 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-subtle">Advance Received</span>
                    <span className="tabular-nums text-status-success">
                      -{formatCurrency(transaction.advanceAmount)}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-base font-semibold border-t border-line pt-2">
                <span>Amount Due</span>
                <span className="tabular-nums">{formatCurrency(transaction.totalBill)}</span>
              </div>
              {transaction.paidAmount > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-subtle">Paid</span>
                    <span className="tabular-nums text-status-success">
                      {formatCurrency(transaction.paidAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Balance Due</span>
                    <span className="tabular-nums text-status-danger">
                      {formatCurrency(transaction.totalBill - transaction.paidAmount)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {transaction.notes && (
            <div className="mt-6 p-3 bg-status-warningBg rounded-md text-sm text-status-warning border border-line">
              <strong>Notes:</strong> {transaction.notes}
            </div>
          )}

          {company.bankName && (
            <div className="mt-8 pt-4 border-t border-line text-xs text-ink-subtle">
              <p className="font-semibold text-ink-muted mb-1">Bank Details</p>
              <p className="tabular-nums">
                {company.bankName} | A/C: {company.bankAccount} | IFSC: {company.bankIFSC}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
