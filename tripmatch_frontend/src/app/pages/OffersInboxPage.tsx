import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Search,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { getAgencyOffers, getUserOffers, type OfferListItemResponse, type OfferStatus } from '../services/offerApi';
import { getMyRequestDetail, getRequestDetail } from '../services/requestApi';

type FilterType = 'all' | OfferStatus;

const statusConfig: Record<OfferStatus, { label: string; color: string; bg: string; border: string }> = {
  DRAFT: { label: 'Draft', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
  READY: { label: 'Ready', color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200' },
  SENT: { label: 'Sent', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  ACCEPTED: { label: 'Accepted', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
  REJECTED: { label: 'Rejected', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  EXPIRED: { label: 'Expired', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
};

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

interface OfferViewModel extends OfferListItemResponse {
  requestSummary?: string;
}

export default function OffersInboxPage() {
  const navigate = useNavigate();
  const { credentials, user } = useApp();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [offers, setOffers] = useState<OfferViewModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadOffers = async () => {
      if (!credentials || user.role === 'admin') {
        if (!cancelled) {
          setOffers([]);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        const listFetcher = user.role === 'agency' ? getAgencyOffers : getUserOffers;
        const firstPage = await listFetcher(credentials, {
          page: 0,
          size: 50,
          sort: ['createdAt,desc'],
        });

        const pages = [firstPage];
        for (let page = 1; page < firstPage.totalPages; page += 1) {
          pages.push(await listFetcher(credentials, {
            page,
            size: firstPage.size,
            sort: ['createdAt,desc'],
          }));
        }

        const baseOffers = pages.flatMap(page => page.content);
        const requestIds = [...new Set(baseOffers.map(item => item.requestId))];

        const summaries = new Map<number, string>();
        await Promise.allSettled(requestIds.map(async requestId => {
          try {
            if (user.role === 'agency') {
              const request = await getRequestDetail(requestId, credentials);
              summaries.set(requestId, request.destinationSummary);
            } else {
              const request = await getMyRequestDetail(requestId, credentials);
              summaries.set(requestId, request.destinationSummary);
            }
          } catch {
            // Keep fallback label.
          }
        }));

        if (cancelled) return;

        setOffers(baseOffers.map(item => ({
          ...item,
          requestSummary: summaries.get(item.requestId),
        })));
      } catch (error) {
        if (!cancelled) {
          setOffers([]);
          toast.error(error instanceof Error ? error.message : 'Could not load offers.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadOffers();

    return () => {
      cancelled = true;
    };
  }, [credentials, user.role]);

  const filters: { key: FilterType; label: string; count: number }[] = useMemo(() => ([
    { key: 'all', label: 'All', count: offers.length },
    { key: 'SENT', label: 'Sent', count: offers.filter(item => item.status === 'SENT').length },
    { key: 'ACCEPTED', label: 'Accepted', count: offers.filter(item => item.status === 'ACCEPTED').length },
    { key: 'REJECTED', label: 'Rejected', count: offers.filter(item => item.status === 'REJECTED').length },
    { key: 'DRAFT', label: 'Draft', count: offers.filter(item => item.status === 'DRAFT').length },
    { key: 'READY', label: 'Ready', count: offers.filter(item => item.status === 'READY').length },
    { key: 'EXPIRED', label: 'Expired', count: offers.filter(item => item.status === 'EXPIRED').length },
  ]), [offers]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return offers.filter(offer => {
      const matchesFilter = activeFilter === 'all' || offer.status === activeFilter;
      const haystack = `${offer.requestSummary ?? ''} ${offer.requestId} ${offer.currency} ${offer.status}`.toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, offers, searchQuery]);

  if (user.role === 'admin') {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <FileText className="mx-auto mb-3 h-8 w-8 text-gray-400" />
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#374151' }}>Offers inbox is available for travelers and agencies.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px' }}>Offers Inbox</h1>
          <p style={{ fontSize: '14px', color: '#6B7280' }} className="mt-0.5">
            {offers.filter(item => item.status === 'SENT').length} active offers
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={event => setSearchQuery(event.target.value)}
          placeholder="Search by request, status, currency..."
          className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-4 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
          style={{ fontSize: '14px' }}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map(filter => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
            className={`flex flex-shrink-0 items-center gap-2 rounded-xl px-4 py-2 transition-all ${
              activeFilter === filter.key
                ? 'bg-sky-500 text-white shadow-sm shadow-sky-200'
                : 'border border-gray-200 bg-white text-gray-600 hover:border-sky-300'
            }`}
            style={{ fontSize: '13px', fontWeight: activeFilter === filter.key ? 700 : 500 }}
          >
            {filter.label}
            <span className={`rounded-full px-2 py-0.5 ${activeFilter === filter.key ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'}`} style={{ fontSize: '11px', fontWeight: 700 }}>
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-6 py-4 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Loading offers...</span>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#374151' }}>No offers found</h3>
          <p style={{ fontSize: '14px', color: '#9CA3AF' }} className="mt-1">Try another filter or search term.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(offer => {
            const status = statusConfig[offer.status];
            return (
              <div
                key={offer.id}
                className="cursor-pointer rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-sky-200 hover:shadow-md"
                onClick={() => navigate(`/app/offers/${offer.id}`)}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                      {offer.requestSummary || `Request #${offer.requestId}`}
                    </p>
                    <p style={{ fontSize: '12px', color: '#9CA3AF' }} className="mt-0.5">
                      Request ID: {offer.requestId}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${status.bg} ${status.border} ${status.color}`} style={{ fontSize: '11px', fontWeight: 700 }}>
                    {status.label}
                  </span>
                </div>

                <div className="mb-3 flex items-center justify-between">
                  <p style={{ fontSize: '22px', fontWeight: 800, color: '#0EA5E9' }}>
                    {offer.currency} {offer.price.toLocaleString()}
                  </p>
                  <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                    <Clock className="mr-1 inline h-3.5 w-3.5" />
                    Updated {formatDateTime(offer.updatedAt)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-gray-50 p-2.5">
                    <p style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>Sent At</p>
                    <p style={{ fontSize: '12.5px', color: '#374151' }}>{formatDateTime(offer.sentAt)}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-2.5">
                    <p style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>Responded At</p>
                    <p style={{ fontSize: '12.5px', color: '#374151' }}>{formatDateTime(offer.respondedAt)}</p>
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <span className="inline-flex items-center gap-1 text-sky-500" style={{ fontSize: '13px', fontWeight: 700 }}>
                    View Details
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
