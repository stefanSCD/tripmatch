import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { Calendar, Eye, Loader2, Map, MoreHorizontal, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { deleteTrip, getTripList, type TripListResponse } from '../services/tripApi';

type TabType = 'all' | 'published' | 'active' | 'accepted' | 'draft' | 'completed';
type StatusKey = Exclude<TabType, 'all'> | 'other';

interface TripCardData extends TripListResponse {
  normalizedStatus: StatusKey;
  statusLabel: string;
  dayCount: number;
  startLabel: string;
  endLabel: string;
  dateRange: string;
}

const statusConfig: Record<StatusKey, { label: string; badgeClass: string; dotClass: string; panelClass: string }> = {
  draft: {
    label: 'Draft',
    badgeClass: 'bg-gray-100 text-gray-600',
    dotClass: 'bg-gray-400',
    panelClass: 'bg-gray-50',
  },
  published: {
    label: 'Published',
    badgeClass: 'bg-sky-100 text-sky-700',
    dotClass: 'bg-sky-500',
    panelClass: 'bg-sky-50',
  },
  active: {
    label: 'Active',
    badgeClass: 'bg-green-100 text-green-700',
    dotClass: 'bg-green-500',
    panelClass: 'bg-green-50',
  },
  accepted: {
    label: 'Accepted',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    dotClass: 'bg-emerald-500',
    panelClass: 'bg-emerald-50',
  },
  completed: {
    label: 'Completed',
    badgeClass: 'bg-teal-100 text-teal-700',
    dotClass: 'bg-teal-500',
    panelClass: 'bg-teal-50',
  },
  other: {
    label: 'Other',
    badgeClass: 'bg-gray-100 text-gray-600',
    dotClass: 'bg-gray-400',
    panelClass: 'bg-gray-50',
  },
};

const formatDisplayDate = (value: string) => {
  const date = parseISO(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, 'MMM d, yyyy');
};

const calculateDayCount = (startDate: string, endDate: string) => {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  return Math.max(1, differenceInCalendarDays(end, start) + 1);
};

const normalizeStatus = (status: string): StatusKey => {
  const normalized = status.trim().toLowerCase();
  if (
    normalized === 'published'
    || normalized === 'active'
    || normalized === 'accepted'
    || normalized === 'draft'
    || normalized === 'completed'
  ) {
    return normalized;
  }
  return 'other';
};

const mapTripToCard = (trip: TripListResponse): TripCardData => {
  const normalizedStatus = normalizeStatus(trip.status);
  const startLabel = formatDisplayDate(trip.startDate);
  const endLabel = formatDisplayDate(trip.endDate);

  return {
    ...trip,
    normalizedStatus,
    statusLabel: statusConfig[normalizedStatus].label,
    dayCount: calculateDayCount(trip.startDate, trip.endDate),
    startLabel,
    endLabel,
    dateRange: startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`,
  };
};

export default function MyTripsPage() {
  const navigate = useNavigate();
  const { credentials } = useApp();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [trips, setTrips] = useState<TripCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadTrips = async () => {
      if (!credentials) {
        if (!cancelled) {
          setTrips([]);
          setLoadError(null);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const firstPage = await getTripList(credentials, { page: 0 });
        const pageResponses = [firstPage];

        for (let page = 1; page < firstPage.totalPages; page += 1) {
          pageResponses.push(await getTripList(credentials, { page, size: firstPage.size }));
        }

        if (cancelled) return;

        const nextTrips = pageResponses.flatMap(page => page.content).map(mapTripToCard);
        setTrips(nextTrips);
      } catch (error) {
        if (!cancelled) {
          setTrips([]);
          setLoadError(error instanceof Error ? error.message : 'Unable to load trips.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadTrips();

    return () => {
      cancelled = true;
    };
  }, [credentials, reloadToken]);

  const statusCounts = useMemo(() => {
    return trips.reduce(
      (acc, trip) => {
        if (trip.normalizedStatus !== 'other') {
          acc[trip.normalizedStatus] += 1;
        }
        return acc;
      },
      { published: 0, active: 0, accepted: 0, draft: 0, completed: 0 } as Record<Exclude<StatusKey, 'other'>, number>,
    );
  }, [trips]);

  const tabs: { key: TabType; label: string; count: number }[] = useMemo(() => [
    { key: 'all', label: 'All Trips', count: trips.length },
    { key: 'published', label: 'Published', count: statusCounts.published },
    { key: 'active', label: 'Active', count: statusCounts.active },
    { key: 'accepted', label: 'Accepted', count: statusCounts.accepted },
    { key: 'draft', label: 'Drafts', count: statusCounts.draft },
    { key: 'completed', label: 'Completed', count: statusCounts.completed },
  ], [statusCounts, trips.length]);

  const filteredTrips = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return trips.filter(trip => {
      const matchesTab = activeTab === 'all' || trip.normalizedStatus === activeTab;
      const matchesSearch = !query
        || [
          trip.title,
          trip.description ?? '',
          trip.startLabel,
          trip.endLabel,
          trip.dateRange,
          trip.statusLabel,
        ].join(' ').toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery, trips]);

  const handleDeleteTrip = async (tripId: string | number) => {
    if (!credentials) {
      toast.error('You need to log in again.');
      return;
    }

    if (!window.confirm('Delete this trip?')) {
      return;
    }

    try {
      await deleteTrip(tripId, credentials);
      setTrips(prev => prev.filter(trip => String(trip.id) !== String(tripId)));
      setOpenMenu(null);
      toast.success('Trip deleted.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete trip.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white px-6 py-8 shadow-sm">
          <Loader2 className="h-10 w-10 animate-spin text-sky-500" />
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Loading trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px' }}>My Trips</h1>
          <p style={{ fontSize: '14px', color: '#6B7280' }} className="mt-0.5">{trips.length} trips total</p>
        </div>
        <button
          onClick={() => navigate('/app/trips/create')}
          className="flex items-center gap-2 rounded-2xl px-5 py-2.5 text-white shadow-sm shadow-sky-200"
          style={{ background: 'linear-gradient(135deg, #0EA5E9, #0D9488)', fontSize: '14px', fontWeight: 600 }}
        >
          <Plus className="h-4 w-4" />
          Plan New Trip
        </button>
      </div>

      {loadError && (
        <div className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
          <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#B91C1C' }}>{loadError}</p>
          <button
            type="button"
            onClick={() => setReloadToken(token => token + 1)}
            className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-700"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex gap-1 overflow-x-auto rounded-2xl bg-gray-100 p-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 transition-all ${
                activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
              style={{ fontSize: '13px', fontWeight: activeTab === tab.key ? 700 : 500 }}
            >
              {tab.label}
              <span
                className={`rounded-full px-1.5 py-0.5 ${
                  activeTab === tab.key ? 'bg-sky-100 text-sky-700' : 'bg-gray-200 text-gray-500'
                }`}
                style={{ fontSize: '11px', fontWeight: 700 }}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search trips..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 transition-all focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
            style={{ fontSize: '13.5px' }}
          />
        </div>
      </div>

      {filteredTrips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <Map className="h-8 w-8 text-gray-400" />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#374151' }}>No trips found</h3>
          <p style={{ fontSize: '14px', color: '#9CA3AF' }} className="mt-1">
            {trips.length === 0 ? 'Create your first trip to get started' : 'Try a different search or filter'}
          </p>
          <button
            onClick={() => navigate('/app/trips/create')}
            className="mt-5 flex items-center gap-2 rounded-2xl px-6 py-3 text-white"
            style={{ background: 'linear-gradient(135deg, #0EA5E9, #0D9488)', fontSize: '14px', fontWeight: 600 }}
          >
            <Plus className="h-4 w-4" /> Create Trip
          </button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTrips.map(trip => {
            const status = statusConfig[trip.normalizedStatus];

            return (
              <div
                key={trip.id}
                className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all hover:border-sky-200 hover:shadow-xl"
              >
                <div className={`flex items-start justify-between px-4 py-3 ${status.panelClass}`}>
                  <div className="flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 backdrop-blur-sm">
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>{status.label}</span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280' }}>{trip.dayCount}d</span>
                </div>

                <div className="p-4">
                  <p style={{ fontWeight: 700, fontSize: '15px', color: '#0F172A' }}>{trip.title}</p>
                  {trip.description && (
                    <p style={{ fontSize: '12.5px', color: '#6B7280' }} className="mt-1">
                      {trip.description}
                    </p>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>Start</p>
                      <p style={{ fontSize: '12.5px', fontWeight: 600, color: '#374151' }} className="mt-1">{trip.startLabel}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>End</p>
                      <p style={{ fontSize: '12.5px', fontWeight: 600, color: '#374151' }} className="mt-1">{trip.endLabel}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span style={{ fontSize: '12px' }}>{trip.dateRange}</span>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/app/trips/${trip.id}/planner`)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 transition-all hover:border-sky-300 hover:bg-sky-50"
                      style={{ fontSize: '12.5px', fontWeight: 600, color: '#0EA5E9' }}
                    >
                      <Eye className="h-3.5 w-3.5" /> View Plan
                    </button>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setOpenMenu(openMenu === String(trip.id) ? null : String(trip.id));
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-50 transition-colors hover:bg-gray-100"
                        aria-label="Open trip menu"
                      >
                        <MoreHorizontal className="h-4 w-4 text-gray-400" />
                      </button>

                      {openMenu === String(trip.id) && (
                        <div className="absolute bottom-full right-0 z-10 mb-2 w-40 rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
                          <button
                            type="button"
                            onClick={() => handleDeleteTrip(trip.id)}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-red-600 hover:bg-red-50"
                            style={{ fontSize: '13px' }}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <button
            onClick={() => navigate('/app/trips/create')}
            className="flex min-h-64 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 p-8 transition-all hover:border-sky-300 hover:bg-sky-50/50"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 transition-colors hover:bg-sky-100">
              <Plus className="h-6 w-6 text-gray-400 transition-colors hover:text-sky-500" />
            </div>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#9CA3AF' }}>Plan New Trip</p>
          </button>
        </div>
      )}
    </div>
  );
}
