'use client';

import { useState } from 'react';
import { formatCurrency, formatWeight, STATUS_COLORS } from '../utils/helpers';
import { format } from 'date-fns';
import { Printer, Download, Mail, X } from 'lucide-react';

export default function InvoiceView({ transaction, settings, onClose, onRecordPayment }) {
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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-8 border border-steel-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-steel-200 no-print bg-steel-50/80">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-steel-500 font-semibold">Tax Invoice</p>
            <h2 className="font-display text-lg text-steel-900">{transaction.invoiceNumber}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn-outline text-xs py-1.5">
              <Printer size={14} /> Print
            </button>
            <button onClick={handleDownloadPDF} className="btn-outline text-xs py-1.5">
              <Download size={14} /> PDF
            </button>
            {onRecordPayment && transaction.paymentStatus !== 'PAID' && (
              <button onClick={onRecordPayment} className="btn-primary text-xs py-1.5">
                Record Payment
              </button>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-steel-100 rounded-md">
              <X size={18} />
            </button>
          </div>
        </div>

        <div id="invoice-content" className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="font-display text-2xl text-steel-900">{company.companyName || 'Steel Mill'}</h1>
              <p className="text-sm text-steel-500 mt-1 whitespace-pre-line">{company.companyAddress}</p>
              {company.companyGST && <p className="text-sm text-steel-500">NTN / GST: {company.companyGST}</p>}
              {company.companyPhone && <p className="text-sm text-steel-500">Ph: {company.companyPhone}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-steel-400">Invoice</p>
              <p className="font-semibold text-lg text-steel-900">{transaction.invoiceNumber}</p>
              <p className="text-sm text-steel-500 mt-1">
                {format(new Date(transaction.invoiceDate), 'dd MMM yyyy')}
              </p>
              <span className={`badge mt-2 ${STATUS_COLORS[transaction.paymentStatus]}`}>
                {transaction.paymentStatus}
              </span>
            </div>
          </div>

          <div className="mb-8 p-4 bg-steel-50 rounded-xl">
            <p className="text-xs uppercase tracking-wider text-steel-400 mb-1">
              {transaction.type === 'INCOMING' ? 'Supplier' : 'Bill To'}
            </p>
            <p className="font-medium text-steel-900">{transaction.customer?.name}</p>
            {transaction.customer?.address && (
              <p className="text-sm text-steel-500">{transaction.customer.address}</p>
            )}
            {transaction.customer?.gstNumber && (
              <p className="text-sm text-steel-500">GST: {transaction.customer.gstNumber}</p>
            )}
            {transaction.customer?.contactNumber && (
              <p className="text-sm text-steel-500">Ph: {transaction.customer.contactNumber}</p>
            )}
          </div>

          <table className="w-full mb-6 text-sm">
            <thead>
              <tr className="border-b-2 border-steel-200">
                <th className="text-left py-2 text-steel-500 font-medium">Description</th>
                <th className="text-right py-2 text-steel-500 font-medium">Weight</th>
                <th className="text-right py-2 text-steel-500 font-medium">Rate/KG</th>
                <th className="text-right py-2 text-steel-500 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-steel-100">
                <td className="py-3">
                  <span className="font-medium">{transaction.materialType}</span>
                  <span className={`badge ml-2 ${STATUS_COLORS[transaction.type]}`}>{transaction.type}</span>
                </td>
                <td className="text-right py-3">{formatWeight(transaction.weight)}</td>
                <td className="text-right py-3">{formatCurrency(transaction.pricePerKG)}</td>
                <td className="text-right py-3">{formatCurrency(transaction.materialAmount)}</td>
              </tr>
              {transaction.type === 'OUTGOING' && transaction.wasteWeight > 0 && (
                <tr className="border-b border-steel-100">
                  <td className="py-3 text-steel-600">
                    Waste {transaction.takeWaste ? '(Added)' : '(Discount)'}
                  </td>
                  <td className="text-right py-3">{formatWeight(transaction.wasteWeight)}</td>
                  <td className="text-right py-3">{formatCurrency(transaction.wastePrice)}</td>
                  <td className="text-right py-3">
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
                <span className="text-steel-500">Material Amount</span>
                <span>{formatCurrency(transaction.materialAmount)}</span>
              </div>
              {transaction.type === 'OUTGOING' && transaction.wasteAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-steel-500">
                    {transaction.takeWaste ? 'Waste Charge' : 'Waste Discount'}
                  </span>
                  <span className={transaction.takeWaste ? 'text-steel-900' : 'text-emerald-600'}>
                    {transaction.takeWaste ? '+' : '-'}
                    {formatCurrency(transaction.wasteAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold border-t border-steel-200 pt-2">
                <span>Total</span>
                <span>{formatCurrency(transaction.totalBill)}</span>
              </div>
              {transaction.paidAmount > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-steel-500">Paid</span>
                    <span className="text-emerald-600">{formatCurrency(transaction.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Balance Due</span>
                    <span className="text-red-600">
                      {formatCurrency(transaction.totalBill - transaction.paidAmount)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {transaction.notes && (
            <div className="mt-6 p-3 bg-amber-50 rounded-lg text-sm text-amber-800">
              <strong>Notes:</strong> {transaction.notes}
            </div>
          )}

          {company.bankName && (
            <div className="mt-8 pt-4 border-t border-steel-100 text-xs text-steel-500">
              <p className="font-medium text-steel-700 mb-1">Bank Details</p>
              <p>{company.bankName} | A/C: {company.bankAccount} | IFSC: {company.bankIFSC}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
