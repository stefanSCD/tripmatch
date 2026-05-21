import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  Filter,
  Globe,
  Loader2,
  MapPin,
  Search,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { getMarketplaceRequests, type TravelRequestListItemResponse } from '../services/requestApi';

type SortMode = 'newest' | 'budget_high' | 'budget_low' | 'start_date';

function formatDisplayDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

function RequestCard({
  request,
  onSendOffer,
}: {
  request: TravelRequestListItemResponse;
  onSendOffer: () => void;
}) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-sky-200 hover:shadow-xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-sky-500" />
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>{request.destinationSummary}</p>
          </div>
          <p style={{ fontSize: '12px', color: '#9CA3AF' }}>
            Published {request.publishedAt ? formatDisplayDate(request.publishedAt) : 'recently'}
          </p>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-green-700" style={{ fontSize: '11px', fontWeight: 700 }}>
          <CheckCircle2 className="h-3 w-3" />
          {request.status}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-gray-50 p-3">
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }} className="mb-1">
            <Calendar className="mr-1 inline h-3 w-3" />
            Dates
          </p>
          <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#374151' }}>
            {formatDisplayDate(request.startDate)} - {formatDisplayDate(request.endDate)}
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 p-3">
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }} className="mb-1">
            <DollarSign className="mr-1 inline h-3 w-3" />
            Budget
          </p>
          <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#374151' }}>
            {request.budgetMin.toLocaleString()} - {request.budgetMax.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-3">
        <p style={{ fontSize: '12px', color: '#6B7280' }}>
          Flexible dates: <strong style={{ color: '#374151' }}>{request.isFlexibleDate ? 'Yes' : 'No'}</strong>
        </p>
      </div>

      <button
        onClick={onSendOffer}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-white transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #0EA5E9, #0D9488)', fontSize: '13.5px', fontWeight: 700 }}
      >
        <Sparkles className="h-4 w-4" />
        Create Offer
      </button>
    </div>
  );
}

export default function MarketplacePage() {
  const navigate = useNavigate();
  const { credentials } = useApp();

  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [requests, setRequests] = useState<TravelRequestListItemResponse[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [startFrom, setStartFrom] = useState('');
  const [endTo, setEndTo] = useState('');
  const [flexibleOnly, setFlexibleOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortMode>('newest');

  useEffect(() => {
    let cancelled = false;

    const loadRequests = async () => {
      if (!credentials) {
        if (!cancelled) {
          setRequests([]);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        const firstPage = await getMarketplaceRequests(credentials, {
          destination: searchQuery.trim() || undefined,
          minBudget: parseOptionalNumber(minBudget),
          maxBudget: parseOptionalNumber(maxBudget),
          startFrom: startFrom || undefined,
          endTo: endTo || undefined,
          flexibleDate: flexibleOnly ? true : undefined,
          page: 0,
          size: 50,
          sort: ['publishedAt,desc'],
        });

        const pages = [firstPage];
        for (let page = 1; page < firstPage.totalPages; page += 1) {
          pages.push(await getMarketplaceRequests(credentials, {
            destination: searchQuery.trim() || undefined,
            minBudget: parseOptionalNumber(minBudget),
            maxBudget: parseOptionalNumber(maxBudget),
            startFrom: startFrom || undefined,
            endTo: endTo || undefined,
            flexibleDate: flexibleOnly ? true : undefined,
            page,
            size: firstPage.size,
            sort: ['publishedAt,desc'],
          }));
        }

        if (!cancelled) {
          setRequests(pages.flatMap(page => page.content));
        }
      } catch (error) {
        if (!cancelled) {
          setRequests([]);
          toast.error(error instanceof Error ? error.message : 'Could not load marketplace requests.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadRequests();

    return () => {
      cancelled = true;
    };
  }, [credentials, endTo, flexibleOnly, maxBudget, minBudget, searchQuery, startFrom]);

  const sortedRequests = useMemo(() => {
    const next = [...requests];
    if (sortBy === 'budget_high') {
      next.sort((a, b) => b.budgetMax - a.budgetMax);
    } else if (sortBy === 'budget_low') {
      next.sort((a, b) => a.budgetMin - b.budgetMin);
    } else if (sortBy === 'start_date') {
      next.sort((a, b) => a.startDate.localeCompare(b.startDate));
    } else {
      next.sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
    }
    return next;
  }, [requests, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setMinBudget('');
    setMaxBudget('');
    setStartFrom('');
    setEndTo('');
    setFlexibleOnly(false);
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim()
    || minBudget.trim()
    || maxBudget.trim()
    || startFrom
    || endTo
    || flexibleOnly,
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px' }}>Travel Marketplace</h1>
          <p style={{ fontSize: '14px', color: '#6B7280' }} className="mt-0.5">
            {sortedRequests.length} published requests
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="Search destination..."
              className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-4 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
              style={{ fontSize: '14px' }}
            />
          </div>

          <button
            onClick={() => setShowFilters(prev => !prev)}
            className={`flex items-center gap-2 rounded-2xl border px-5 py-3 transition-all ${
              showFilters || hasActiveFilters
                ? 'border-sky-400 bg-sky-50 text-sky-600'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
            style={{ fontSize: '14px', fontWeight: 600 }}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>

          <select
            value={sortBy}
            onChange={event => setSortBy(event.target.value as SortMode)}
            className="rounded-2xl border border-gray-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-200"
            style={{ fontSize: '14px', color: '#374151' }}
          >
            <option value="newest">Newest First</option>
            <option value="budget_high">Budget High to Low</option>
            <option value="budget_low">Budget Low to High</option>
            <option value="start_date">Start Date</option>
          </select>
        </div>

        {showFilters && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="block">
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <DollarSign className="mr-1 inline h-3.5 w-3.5 text-sky-500" />
                  Min Budget
                </span>
                <input
                  type="number"
                  min="0"
                  value={minBudget}
                  onChange={event => setMinBudget(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  style={{ fontSize: '13px' }}
                />
              </label>

              <label className="block">
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <DollarSign className="mr-1 inline h-3.5 w-3.5 text-sky-500" />
                  Max Budget
                </span>
                <input
                  type="number"
                  min="0"
                  value={maxBudget}
                  onChange={event => setMaxBudget(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  style={{ fontSize: '13px' }}
                />
              </label>

              <label className="block">
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Calendar className="mr-1 inline h-3.5 w-3.5 text-sky-500" />
                  Start From
                </span>
                <input
                  type="date"
                  value={startFrom}
                  onChange={event => setStartFrom(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  style={{ fontSize: '13px' }}
                />
              </label>

              <label className="block">
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Calendar className="mr-1 inline h-3.5 w-3.5 text-sky-500" />
                  End To
                </span>
                <input
                  type="date"
                  value={endTo}
                  onChange={event => setEndTo(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  style={{ fontSize: '13px' }}
                />
              </label>

              <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={flexibleOnly}
                  onChange={event => setFlexibleOnly(event.target.checked)}
                />
                <span style={{ fontSize: '13px', color: '#374151' }}>Flexible dates only</span>
              </label>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex justify-end border-t border-gray-100 pt-4">
                <button
                  onClick={clearFilters}
                  className="rounded-xl bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
                  style={{ fontSize: '13px', fontWeight: 700 }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-6 py-4 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Loading marketplace...</span>
          </div>
        </div>
      ) : sortedRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <Globe className="h-8 w-8 text-gray-400" />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#374151' }}>No requests found</h3>
          <p style={{ fontSize: '14px', color: '#9CA3AF' }} className="mt-1">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {sortedRequests.map(request => (
            <RequestCard
              key={request.id}
              request={request}
              onSendOffer={() => navigate(`/app/offers/create/${request.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
