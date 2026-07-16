'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import AppLayout from '../../components/AppLayout';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import InvoiceView from '../../components/InvoiceView';
import {
  getTransactions,
  createIncoming,
  createOutgoing,
  updateTransaction,
  getCustomers,
  getPricing,
  getSettings,
} from '../../utils/api';
import { formatCurrency, formatWeight, calculateOutgoing, calculateIncoming } from '../../utils/helpers';
import { format } from 'date-fns';
import { Plus, Search, ArrowLeftRight, Pencil } from 'lucide-react';
import { useAuth } from '../../utils/auth';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { TableSkeleton } from '../../components/Skeleton';

export default function TransactionsPage() {
  const { hasRole } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [pricing, setPricing] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modal, setModal] = useState(null); // 'incoming' | 'outgoing'
  const [editingTx, setEditingTx] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      takeWaste: 'false',
      wasteWeight: 0,
      wastePricePerKG: '',
      advanceAmount: 0,
      invoiceDate: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const watchMaterial = watch('materialType');
  const watchWeight = watch('weight');
  const watchPrice = watch('pricePerKG');
  const watchWaste = watch('wasteWeight');
  const watchWastePrice = watch('wastePricePerKG');
  const watchTakeWaste = watch('takeWaste');
  const watchAdvance = watch('advanceAmount');

  const calc = useMemo(() => {
    if (modal === 'outgoing') {
      return calculateOutgoing({
        weight: watchWeight,
        pricePerKG: watchPrice,
        wasteWeight: watchWaste,
        wastePricePerKG: watchWastePrice,
        takeWaste: watchTakeWaste === 'true',
        advanceAmount: watchAdvance,
      });
    }
    return calculateIncoming({
      weight: watchWeight,
      pricePerKG: watchPrice,
      advanceAmount: watchAdvance,
    });
  }, [modal, watchWeight, watchPrice, watchWaste, watchWastePrice, watchTakeWaste, watchAdvance]);

  const loadData = async () => {
    try {
      const [txRes, custRes, priceRes, setRes] = await Promise.all([
        getTransactions({ limit: 100 }),
        getCustomers(),
        getPricing({ current: 'true' }),
        getSettings(),
      ]);
      setTransactions(txRes.data.data.transactions || []);
      setCustomers(custRes.data.data || []);
      setPricing(priceRes.data.data || []);
      setSettings(setRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (editingTx) return;
    if (watchMaterial && pricing.length) {
      const p = pricing.find((x) => x.materialType === watchMaterial);
      if (p) {
        setValue('pricePerKG', p.pricePerKG);
        setValue('wastePricePerKG', p.pricePerKG);
      }
    }
  }, [watchMaterial, pricing, setValue, editingTx]);

  const openModal = (type) => {
    const defaultPrice = pricing[0]?.pricePerKG || '';
    setEditingTx(null);
    reset({
      takeWaste: 'false',
      wasteWeight: 0,
      wastePricePerKG: defaultPrice,
      advanceAmount: 0,
      invoiceDate: format(new Date(), 'yyyy-MM-dd'),
      materialType: pricing[0]?.materialType || 'Steel',
      pricePerKG: defaultPrice,
      customerId: '',
      notes: '',
    });
    setModal(type);
  };

  const openEdit = (tx, e) => {
    e?.stopPropagation();
    setSelectedTx(null);
    setEditingTx(tx);
    reset({
      customerId: tx.customerId,
      materialType: tx.materialType,
      weight: tx.weight,
      pricePerKG: tx.pricePerKG,
      wasteWeight: tx.wasteWeight || 0,
      wastePricePerKG: tx.wastePrice || tx.pricePerKG,
      takeWaste: tx.takeWaste ? 'true' : 'false',
      advanceAmount: tx.advanceAmount || 0,
      notes: tx.notes || '',
      invoiceDate: format(new Date(tx.invoiceDate), 'yyyy-MM-dd'),
    });
    setModal(tx.type === 'INCOMING' ? 'incoming' : 'outgoing');
  };

  const closeModal = () => {
    setModal(null);
    setEditingTx(null);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = {
        customerId: data.customerId,
        materialType: data.materialType,
        weight: parseFloat(data.weight),
        pricePerKG: parseFloat(data.pricePerKG),
        advanceAmount: parseFloat(data.advanceAmount) || 0,
        notes: data.notes || null,
        invoiceDate: data.invoiceDate,
      };

      if (modal === 'outgoing') {
        payload.wasteWeight = parseFloat(data.wasteWeight) || 0;
        payload.wastePricePerKG =
          data.wastePricePerKG === '' || data.wastePricePerKG === undefined
            ? parseFloat(data.pricePerKG)
            : parseFloat(data.wastePricePerKG);
        payload.takeWaste = data.takeWaste === 'true';
      }

      let res;
      if (editingTx) {
        res = await updateTransaction(editingTx.id, payload);
      } else if (modal === 'incoming') {
        res = await createIncoming(payload);
      } else {
        res = await createOutgoing(payload);
      }

      setToast({ message: res.data.message, type: 'success' });
      closeModal();
      loadData();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Failed to save transaction',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = transactions.filter((t) => {
    if (typeFilter && t.type !== typeFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        t.invoiceNumber.toLowerCase().includes(s) ||
        t.customer?.name?.toLowerCase().includes(s) ||
        t.materialType.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const canEdit = hasRole('ADMIN', 'STAFF');
  const modalTitle = editingTx
    ? `Edit ${modal === 'incoming' ? 'Incoming' : 'Outgoing'} — ${editingTx.invoiceNumber}`
    : modal === 'incoming'
      ? 'Incoming Material'
      : 'Outgoing Material';

  return (
    <AppLayout title="Transactions" subtitle="Incoming & outgoing weighbridge entries">
      <div className="toolbar no-print">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" size={15} />
          <input
            className="input pl-9"
            placeholder="Search invoice, customer, material..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-full sm:w-40" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="INCOMING">Incoming</option>
          <option value="OUTGOING">Outgoing</option>
        </select>
        {canEdit && (
          <>
            <button onClick={() => openModal('incoming')} className="btn-secondary">
              <Plus size={15} /> Incoming
            </button>
            <button onClick={() => openModal('outgoing')} className="btn-primary">
              <Plus size={15} /> Outgoing
            </button>
          </>
        )}
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={9} />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ArrowLeftRight}
            title="No transactions found"
            description="Create an incoming or outgoing entry to get started."
          />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Date</th>
                <th>Type</th>
                <th>Customer</th>
                <th>Material</th>
                <th className="num">Weight</th>
                <th className="num">Total Due</th>
                <th>Status</th>
                {canEdit && <th className="w-12" />}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="cursor-pointer" onClick={() => setSelectedTx(t)}>
                  <td className="font-medium text-brand-600 tabular-nums">{t.invoiceNumber}</td>
                  <td className="tabular-nums whitespace-nowrap">
                    {format(new Date(t.invoiceDate), 'dd MMM yyyy')}
                  </td>
                  <td>
                    <StatusBadge status={t.type} />
                  </td>
                  <td>{t.customer?.name}</td>
                  <td>{t.materialType}</td>
                  <td className="num">{formatWeight(t.weight)}</td>
                  <td className="num font-semibold text-ink">
                    {formatCurrency(t.totalBill)}
                    {t.advanceAmount > 0 && (
                      <span className="block text-2xs font-normal text-ink-subtle">
                        Adv {formatCurrency(t.advanceAmount)}
                      </span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={t.paymentStatus} />
                  </td>
                  {canEdit && (
                    <td>
                      <button
                        type="button"
                        className="p-1.5 rounded-md hover:bg-surface text-ink-muted hover:text-brand-600"
                        title="Edit transaction"
                        onClick={(e) => openEdit(t, e)}
                      >
                        <Pencil size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!modal} onClose={closeModal} title={modalTitle} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" {...register('invoiceDate', { required: true })} />
            </div>
            <div>
              <label className="label">
                {modal === 'incoming' ? 'Supplier / Vendor' : 'Customer'}
              </label>
              <select className="input" {...register('customerId', { required: 'Required' })}>
                <option value="">Select...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.customerId && <p className="field-error">{errors.customerId.message}</p>}
            </div>
            <div>
              <label className="label">Material Type</label>
              <select className="input" {...register('materialType', { required: true })}>
                {pricing.map((p) => (
                  <option key={p.id} value={p.materialType}>
                    {p.materialType}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Weight (KG)</label>
              <input
                type="number"
                step="0.001"
                className="input tabular-nums"
                {...register('weight', { required: 'Required', min: { value: 0.001, message: 'Must be > 0' } })}
              />
              {errors.weight && <p className="field-error">{errors.weight.message}</p>}
            </div>
            <div>
              <label className="label">Price per KG (PKR)</label>
              <input
                type="number"
                step="0.01"
                className="input tabular-nums"
                {...register('pricePerKG', { required: 'Required', min: { value: 0.01, message: 'Must be > 0' } })}
              />
            </div>
            {modal === 'outgoing' && (
              <>
                <div>
                  <label className="label">Waste Weight (KG)</label>
                  <input
                    type="number"
                    step="0.001"
                    className="input tabular-nums"
                    {...register('wasteWeight', { min: 0 })}
                  />
                </div>
                <div>
                  <label className="label">Waste Price per KG (PKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input tabular-nums"
                    placeholder="Enter waste rate"
                    {...register('wastePricePerKG', {
                      min: { value: 0, message: 'Cannot be negative' },
                    })}
                  />
                  <p className="field-hint">wasteAmount = waste weight × waste price/KG</p>
                </div>
              </>
            )}
            <div>
              <label className="label">Advance Received (PKR)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input tabular-nums"
                placeholder="0"
                {...register('advanceAmount', { min: { value: 0, message: 'Cannot be negative' } })}
              />
              <p className="field-hint">Deducted from the bill total</p>
            </div>
          </div>

          {modal === 'outgoing' && (
            <div className="p-4 bg-surface rounded-md border border-line space-y-3">
              <p className="section-heading mb-0">Waste Handling</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex items-center gap-2 cursor-pointer p-3 bg-surface-raised rounded-md border border-line flex-1 has-[:checked]:border-brand-600 has-[:checked]:ring-1 has-[:checked]:ring-brand-600">
                  <input type="radio" value="true" {...register('takeWaste')} className="accent-brand-600" />
                  <span className="text-sm text-ink">With waste (add to total)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-3 bg-surface-raised rounded-md border border-line flex-1 has-[:checked]:border-brand-600 has-[:checked]:ring-1 has-[:checked]:ring-brand-600">
                  <input type="radio" value="false" {...register('takeWaste')} className="accent-brand-600" />
                  <span className="text-sm text-ink">Without waste (minus from total)</span>
                </label>
              </div>
            </div>
          )}

          <div>
            <label className="label">Notes (optional)</label>
            <textarea className="input" rows={2} {...register('notes')} />
          </div>

          <div className="p-4 bg-steel-900 text-white rounded-md space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Material Amount</span>
              <span className="tabular-nums">{formatCurrency(calc.materialAmount)}</span>
            </div>
            {modal === 'outgoing' && calc.wasteAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">
                  {watchTakeWaste === 'true' ? 'Waste Charge' : 'Waste Discount'}
                  {watchWaste > 0 && watchWastePrice !== '' && watchWastePrice !== undefined
                    ? ` (${watchWaste} KG × ${watchWastePrice})`
                    : ''}
                </span>
                <span className={`tabular-nums ${watchTakeWaste === 'true' ? '' : 'text-emerald-400'}`}>
                  {watchTakeWaste === 'true' ? '+' : '-'}
                  {formatCurrency(calc.wasteAmount)}
                </span>
              </div>
            )}
            {calc.grossBill !== undefined && (
              <div className="flex justify-between text-sm border-t border-slate-700 pt-2">
                <span className="text-slate-400">Gross Bill</span>
                <span className="tabular-nums">{formatCurrency(calc.grossBill)}</span>
              </div>
            )}
            {calc.advanceAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Advance Received</span>
                <span className="tabular-nums text-emerald-400">-{formatCurrency(calc.advanceAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold border-t border-slate-700 pt-2">
              <span>Amount Due (PKR)</span>
              <span className="tabular-nums text-brand-300">{formatCurrency(calc.totalBill)}</span>
            </div>
            {modal === 'outgoing' && watchTakeWaste === 'false' && calc.wasteAmount > 0 && (
              <p className="text-xs text-emerald-400">
                Waste discount applied: {formatCurrency(calc.wasteAmount)}
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={closeModal} className="btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : editingTx ? 'Update Transaction' : 'Submit Transaction'}
            </button>
          </div>
        </form>
      </Modal>

      {selectedTx && (
        <InvoiceView
          transaction={selectedTx}
          settings={settings}
          onClose={() => setSelectedTx(null)}
          onEdit={canEdit ? () => openEdit(selectedTx) : undefined}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AppLayout>
  );
}
