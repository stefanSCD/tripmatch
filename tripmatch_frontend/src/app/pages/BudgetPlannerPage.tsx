import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, CheckCircle2, DollarSign, Loader2, Save } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import {
  getTripBudget,
  getTripDetail,
  upsertTripBudget,
  type BudgetCategory,
  type TripBudgetCategoryResponse,
  type TripBudgetResponse,
} from '../services/tripApi';

interface EditableCategory {
  category: BudgetCategory;
  allocatedAmount: number;
  spentTotal: number;
}

const categoryMeta: Record<BudgetCategory, { label: string; icon: string; color: string }> = {
  ACCOMMODATION: { label: 'Accommodation', icon: 'Hotel', color: '#0EA5E9' },
  TRANSPORT: { label: 'Transport', icon: 'Plane', color: '#0D9488' },
  FOOD: { label: 'Food', icon: 'Utensils', color: '#F97316' },
  ACTIVITIES: { label: 'Activities', icon: 'Activity', color: '#8B5CF6' },
};

const categoryOrder: BudgetCategory[] = ['ACCOMMODATION', 'TRANSPORT', 'FOOD', 'ACTIVITIES'];

function defaultCategories(): EditableCategory[] {
  return categoryOrder.map(category => ({
    category,
    allocatedAmount: 0,
    spentTotal: 0,
  }));
}

function mergeBudgetCategories(categories: TripBudgetCategoryResponse[] | undefined): EditableCategory[] {
  const byCategory = new Map((categories ?? []).map(item => [item.category, item]));
  return categoryOrder.map(category => {
    const found = byCategory.get(category);
    return {
      category,
      allocatedAmount: found?.allocatedAmount ?? 0,
      spentTotal: found?.spentTotal ?? 0,
    };
  });
}

export default function BudgetPlannerPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { credentials } = useApp();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tripTitle, setTripTitle] = useState('Trip Budget');
  const [totalBudget, setTotalBudget] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [categories, setCategories] = useState<EditableCategory[]>(defaultCategories());
  const [lastResponse, setLastResponse] = useState<TripBudgetResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!credentials || !id) {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const trip = await getTripDetail(id, credentials);
        if (cancelled) return;
        setTripTitle(trip.title);

        try {
          const budget = await getTripBudget(id, credentials);
          if (cancelled) return;
          setLastResponse(budget);
          setTotalBudget(budget.totalBudget);
          setCurrency(budget.currency);
          setCategories(mergeBudgetCategories(budget.categories));
        } catch (budgetError) {
          if (cancelled) return;
          setLastResponse(null);
          setTotalBudget(0);
          setCurrency('USD');
          setCategories(defaultCategories());

          const message = budgetError instanceof Error ? budgetError.message.toLowerCase() : '';
          if (!message.includes('not found')) {
            toast.error(budgetError instanceof Error ? budgetError.message : 'Could not load budget.');
          }
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Could not load trip budget context.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [credentials, id]);

  const totalAllocated = useMemo(
    () => categories.reduce((sum, category) => sum + category.allocatedAmount, 0),
    [categories],
  );
  const totalSpent = useMemo(
    () => categories.reduce((sum, category) => sum + category.spentTotal, 0),
    [categories],
  );
  const remaining = totalBudget - totalSpent;
  const overAllocated = totalAllocated > totalBudget && totalBudget > 0;

  const pieData = useMemo(
    () => categories
      .filter(item => item.allocatedAmount > 0)
      .map(item => ({
        name: categoryMeta[item.category].label,
        value: item.allocatedAmount,
        color: categoryMeta[item.category].color,
      })),
    [categories],
  );

  const barData = useMemo(
    () => categories.map(item => ({
      name: categoryMeta[item.category].label,
      allocated: item.allocatedAmount,
      spent: item.spentTotal,
    })),
    [categories],
  );

  const updateCategoryAmount = (category: BudgetCategory, value: number) => {
    const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
    setCategories(prev => prev.map(item => (
      item.category === category
        ? { ...item, allocatedAmount: safeValue }
        : item
    )));
  };

  const handleSave = async () => {
    if (!credentials || !id) {
      toast.error('You need to log in first.');
      return;
    }

    const trimmedCurrency = currency.trim().toUpperCase();
    if (totalBudget <= 0) {
      toast.error('Total budget must be greater than 0.');
      return;
    }
    if (!trimmedCurrency) {
      toast.error('Currency is required.');
      return;
    }

    setSaving(true);
    try {
      const response = await upsertTripBudget(id, {
        totalBudget,
        currency: trimmedCurrency,
        categories: categories.map(item => ({
          category: item.category,
          allocatedAmount: item.allocatedAmount,
        })),
      }, credentials);

      setLastResponse(response);
      setTotalBudget(response.totalBudget);
      setCurrency(response.currency);
      setCategories(mergeBudgetCategories(response.categories));
      toast.success('Budget saved successfully.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save budget.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-6 py-4 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Loading budget...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 transition-colors hover:bg-gray-200"
          >
            <ArrowLeft className="h-4.5 w-4.5 text-gray-500" />
          </button>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px' }}>Budget Planner</h1>
            <p style={{ fontSize: '13.5px', color: '#6B7280' }}>{tripTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Total Budget</p>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-sky-500" />
              <input
                type="number"
                min="0"
                step="0.01"
                value={totalBudget}
                onChange={e => setTotalBudget(Math.max(0, Number(e.target.value) || 0))}
                className="w-32 rounded-lg border border-gray-200 px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-sky-200"
                style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}
              />
            </div>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Currency</p>
            <input
              value={currency}
              onChange={e => setCurrency(e.target.value.toUpperCase())}
              className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-sky-200"
              style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}
            />
          </div>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-xl px-4 py-2.5 text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #0EA5E9, #0D9488)', fontSize: '13px', fontWeight: 700 }}
          >
            <Save className="mr-1.5 inline h-3.5 w-3.5" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Total Budget', value: `${currency} ${totalBudget.toLocaleString()}` },
          { label: 'Allocated', value: `${currency} ${totalAllocated.toLocaleString()}` },
          { label: 'Spent', value: `${currency} ${totalSpent.toLocaleString()}` },
          { label: 'Remaining', value: `${currency} ${remaining.toLocaleString()}` },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p style={{ fontSize: '21px', fontWeight: 800, color: '#0F172A' }}>{stat.value}</p>
            <p style={{ fontSize: '12.5px', color: '#9CA3AF', marginTop: '2px' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {overAllocated && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p style={{ fontSize: '13.5px', color: '#991B1B' }}>
            Category allocations exceed total budget by {currency} {(totalAllocated - totalBudget).toLocaleString()}.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }} className="mb-4">Category Allocation</h2>
          <div className="space-y-4">
            {categories.map(item => {
              const meta = categoryMeta[item.category];
              const usagePct = item.allocatedAmount > 0 ? (item.spentTotal / item.allocatedAmount) * 100 : 0;

              return (
                <div key={item.category}>
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>{meta.label}</p>
                      <p style={{ fontSize: '11.5px', color: '#9CA3AF' }}>
                        Spent: {currency} {item.spentTotal.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.allocatedAmount}
                        onChange={e => updateCategoryAmount(item.category, Number(e.target.value))}
                        className="w-28 rounded-lg border border-gray-200 px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-sky-200"
                        style={{ fontSize: '13px', fontWeight: 700 }}
                      />
                    </div>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(usagePct, 100)}%`,
                        backgroundColor: usagePct > 90 ? '#EF4444' : meta.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }} className="mb-4">Budget Distribution</h2>
            <div className="flex items-center gap-5">
              <div style={{ width: 160, height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {categories.map(item => (
                  <div key={item.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ background: categoryMeta[item.category].color }} />
                      <span style={{ fontSize: '12.5px', color: '#6B7280' }}>{categoryMeta[item.category].label}</span>
                    </div>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#374151' }}>
                      {totalAllocated > 0 ? ((item.allocatedAmount / totalAllocated) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }} className="mb-4">Allocated vs Spent</h2>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="allocated" fill="#E0F2FE" radius={[4, 4, 0, 0]} name="Allocated" />
                  <Bar dataKey="spent" fill="#0EA5E9" radius={[4, 4, 0, 0]} name="Spent" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {lastResponse && (
        <div className="flex items-center gap-2 rounded-2xl border border-green-100 bg-green-50 p-3">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <p style={{ fontSize: '12.5px', color: '#166534' }}>
            Estimated progress: {lastResponse.estimatedProgressPct.toFixed(1)}% | Spent progress: {lastResponse.spentProgressPct.toFixed(1)}%
          </p>
        </div>
      )}
    </div>
  );
}
