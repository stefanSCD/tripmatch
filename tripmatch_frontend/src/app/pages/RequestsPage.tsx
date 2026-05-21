import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { format, parseISO } from 'date-fns';
import { CheckCircle2, Clock, ExternalLink, FileText, Loader2, Lock, Search, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import MarketplacePage from './MarketplacePage';
import {
  getMyRequests,
  unpublishTravelRequest,
  type TravelRequestListItemResponse,
  type TravelRequestStatus,
} from '../services/requestApi';

type RequestTab = 'all' | 'published' | 'closed';

interface RequestCardData extends TravelRequestListItemResponse {
  budgetLabel: string;
  dateLabel: string;
  publishedLabel: string;
}

function formatDateLabel(value: string) {
  const parsed = parseISO(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return format(parsed, 'MMM d, yyyy');
}

function statusLabel(status: TravelRequestStatus) {
  return status === 'PUBLISHED' ? 'Published' : 'Closed';
}

function statusBadge(status: TravelRequestStatus) {
  if (status === 'PUBLISHED') {
    return {
      icon: CheckCircle2,
      className: 'bg-green-50 text-green-700 border-green-200',
    };
  }

  return {
    icon: Lock,
    className: 'bg-gray-50 text-gray-600 border-gray-200',
  };
}

export default function RequestsPage() {
  const navigate = useNavigate();
  const { credentials, user } = useApp();

  const [items, setItems] = useState<RequestCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<RequestTab>('all');
  const [reloadToken, setReloadToken] = useState(0);
  const [busyRequestId, setBusyRequestId] = useState<number | null>(null);

  useEffect(() => {
    if (user.role === 'agency') return;
    if (user.role === 'admin') return;

    let cancelled = false;

    const loadRequests = async () => {
      if (!credentials) {
        if (!cancelled) {
          setItems([]);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        const firstPage = await getMyRequests(credentials, {
          page: 0,
          size: 50,
          sort: ['createdAt,desc'],
        });

        const pages = [firstPage];
        for (let page = 1; page < firstPage.totalPages; page += 1) {
          pages.push(await getMyRequests(credentials, {
            page,
            size: firstPage.size,
            sort: ['createdAt,desc'],
          }));
        }

        if (cancelled) return;

        const nextItems = pages.flatMap(page => page.content).map(item => ({
          ...item,
          budgetLabel: `${item.budgetMin.toLocaleString()} - ${item.budgetMax.toLocaleString()}`,
          dateLabel: `${formatDateLabel(item.startDate)} - ${formatDateLabel(item.endDate)}`,
          publishedLabel: item.publishedAt ? formatDateLabel(item.publishedAt) : 'Not published',
        }));

        setItems(nextItems);
      } catch (error) {
        if (!cancelled) {
          setItems([]);
          toast.error(error instanceof Error ? error.message : 'Could not load requests.');
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
  }, [credentials, reloadToken, user.role]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter(item => {
      const matchesTab = activeTab === 'all'
        || (activeTab === 'published' && item.status === 'PUBLISHED')
        || (activeTab === 'closed' && item.status === 'CLOSED');
      const matchesSearch = !query || item.destinationSummary.toLowerCase().includes(query);
      return matchesTab && matchesSearch;
    });
  }, [activeTab, items, search]);

  const counts = useMemo(() => ({
    all: items.length,
    published: items.filter(item => item.status === 'PUBLISHED').length,
    closed: items.filter(item => item.status === 'CLOSED').length,
  }), [items]);

  const handleUnpublish = async (requestId: number) => {
    if (!credentials) {
      toast.error('You need to log in again.');
      return;
    }

    if (!window.confirm('Unpublish this request?')) {
      return;
    }

    setBusyRequestId(requestId);
    try {
      const response = await unpublishTravelRequest(requestId, credentials);
      setItems(prev => prev.map(item => (
        item.id === requestId
          ? { ...item, status: response.status }
          : item
      )));
      toast.success(response.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not unpublish request.');
    } finally {
      setBusyRequestId(null);
    }
  };

  if (user.role === 'agency') {
    return <MarketplacePage />;
  }

  if (user.role === 'admin') {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <FileText className="mx-auto mb-3 h-8 w-8 text-gray-400" />
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#374151' }}>Request management is available for traveler accounts.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-6 py-4 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Loading requests...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px' }}>My Requests</h1>
          <p style={{ fontSize: '14px', color: '#6B7280' }} className="mt-0.5">{counts.published} published requests</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/app/trips')}
          className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sky-700 transition-colors hover:bg-sky-100"
          style={{ fontSize: '13px', fontWeight: 700 }}
        >
          Publish New Request
        </button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex gap-1 overflow-x-auto rounded-2xl bg-gray-100 p-1">
          {[
            { key: 'all' as const, label: 'All', count: counts.all },
            { key: 'published' as const, label: 'Published', count: counts.published },
            { key: 'closed' as const, label: 'Closed', count: counts.closed },
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 transition-all ${
                activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
              style={{ fontSize: '13px', fontWeight: activeTab === tab.key ? 700 : 500 }}
            >
              {tab.label}
              <span className="rounded-full bg-gray-100 px-1.5 py-0.5" style={{ fontSize: '11px', fontWeight: 700 }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search destination..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 transition-all focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
            style={{ fontSize: '13.5px' }}
          />
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <FileText className="mx-auto mb-3 h-8 w-8 text-gray-400" />
          <p style={{ fontSize: '17px', fontWeight: 700, color: '#374151' }}>No requests found</p>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF' }} className="mt-1">Try another filter or publish a new request.</p>
          <button
            type="button"
            onClick={() => setReloadToken(token => token + 1)}
            className="mt-5 rounded-xl border border-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-50"
            style={{ fontSize: '13px', fontWeight: 700 }}
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredItems.map(item => {
            const status = statusBadge(item.status);
            const StatusIcon = status.icon;

            return (
              <div key={item.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${status.className}`} style={{ fontSize: '11px', fontWeight: 700 }}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {statusLabel(item.status)}
                  </span>
                  <span style={{ fontSize: '11.5px', color: '#9CA3AF' }}>
                    <Clock className="mr-1 inline h-3.5 w-3.5" />
                    {item.publishedLabel}
                  </span>
                </div>

                <p style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>{item.destinationSummary}</p>
                <p style={{ fontSize: '12.5px', color: '#6B7280' }} className="mt-1">{item.dateLabel}</p>
                <p style={{ fontSize: '12.5px', color: '#6B7280' }} className="mt-0.5">
                  Budget: {item.budgetLabel}
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/app/offers')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sky-600 transition-colors hover:border-sky-300 hover:bg-sky-50"
                    style={{ fontSize: '12.5px', fontWeight: 700 }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View Offers
                  </button>

                  {item.status === 'PUBLISHED' && (
                    <button
                      type="button"
                      onClick={() => void handleUnpublish(item.id)}
                      disabled={busyRequestId === item.id}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                      style={{ fontSize: '12.5px', fontWeight: 700 }}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      {busyRequestId === item.id ? 'Closing...' : 'Unpublish'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
