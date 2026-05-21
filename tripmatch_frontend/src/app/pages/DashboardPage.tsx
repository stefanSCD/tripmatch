import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  DollarSign,
  FileText,
  Globe,
  Inbox,
  Loader2,
  Map,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getAdminAccounts, getPendingAgencies } from '../services/adminApi';
import { getAgencyOffers, getOfferDetail, getUserOffers, type OfferListItemResponse, type OfferStatus } from '../services/offerApi';
import { getAccountProfile } from '../services/profileApi';
import { getMarketplaceRequests, getMyRequestDetail, type TravelRequestListItemResponse } from '../services/requestApi';
import { getDestinationList, getTripList, type TripListResponse } from '../services/tripApi';

interface PagedResponse<T> {
  content: T[];
  size: number;
  totalPages: number;
}

interface TravelerTripCardData {
  id: string | number;
  title: string;
  status: string;
  dayCount: number;
  dateRangeLabel: string;
  destinationLabel: string;
}

interface TravelerOfferCardData {
  id: number;
  status: OfferStatus;
  price: number;
  currency: string;
  destinationSummary: string;
  agencyName: string;
}

const tripStatusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600' },
  published: { label: 'Published', className: 'bg-sky-100 text-sky-700' },
  active: { label: 'Active', className: 'bg-green-100 text-green-700' },
  accepted: { label: 'Accepted', className: 'bg-emerald-100 text-emerald-700' },
  completed: { label: 'Completed', className: 'bg-teal-100 text-teal-700' },
  other: { label: 'Other', className: 'bg-gray-100 text-gray-600' },
};

const offerStatusConfig: Record<OfferStatus, { label: string; color: string; bg: string }> = {
  DRAFT: { label: 'Draft', color: 'text-gray-600', bg: 'bg-gray-100' },
  READY: { label: 'Ready', color: 'text-sky-700', bg: 'bg-sky-100' },
  SENT: { label: 'Sent', color: 'text-amber-700', bg: 'bg-amber-100' },
  ACCEPTED: { label: 'Accepted', color: 'text-green-700', bg: 'bg-green-100' },
  REJECTED: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-100' },
  EXPIRED: { label: 'Expired', color: 'text-purple-700', bg: 'bg-purple-100' },
};

function formatDisplayDate(value: string) {
  const parsed = parseISO(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return format(parsed, 'MMM d, yyyy');
}

function toDayCount(startDate: string, endDate: string) {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  return Math.max(1, differenceInCalendarDays(end, start) + 1);
}

function normalizeTripStatus(status: string) {
  const normalized = status.trim().toLowerCase();
  if (
    normalized === 'draft'
    || normalized === 'published'
    || normalized === 'active'
    || normalized === 'accepted'
    || normalized === 'completed'
  ) {
    return normalized;
  }
  return 'other';
}

async function collectAllPages<T>(fetchPage: (page: number, size: number) => Promise<PagedResponse<T>>, size = 50) {
  const firstPage = await fetchPage(0, size);
  const pages = [firstPage];

  for (let page = 1; page < firstPage.totalPages; page += 1) {
    pages.push(await fetchPage(page, firstPage.size || size));
  }

  return pages.flatMap(page => page.content);
}

function StatCard({ icon: Icon, label, value, sub, color, bgColor }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bgColor}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <TrendingUp className="w-4 h-4 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="mt-4">
        <p style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>{label}</p>
        {sub && <p style={{ fontSize: '11.5px', color: '#0EA5E9', fontWeight: 600, marginTop: '6px' }}>{sub}</p>}
      </div>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-6 py-4 shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>{label}</span>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 flex items-center justify-between">
      <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#B91C1C' }}>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-700"
      >
        Retry
      </button>
    </div>
  );
}

function TravelerTripCard({ trip }: { trip: TravelerTripCardData }) {
  const navigate = useNavigate();
  const status = tripStatusConfig[normalizeTripStatus(trip.status)] ?? tripStatusConfig.other;

  return (
    <div
      onClick={() => navigate(`/app/trips/${trip.id}/planner`)}
      className="cursor-pointer rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:border-sky-200 hover:shadow-md"
    >
      <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-sky-50 to-teal-50 px-4 py-3">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
        <span style={{ fontSize: '12px', color: '#6B7280' }}>{trip.dayCount} days</span>
      </div>
      <div className="p-4">
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>{trip.title}</p>
        <div className="mt-1 flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 text-gray-400" />
          <p style={{ fontSize: '12.5px', color: '#6B7280' }}>{trip.destinationLabel}</p>
        </div>
        <p style={{ fontSize: '12px', color: '#9CA3AF' }} className="mt-3">{trip.dateRangeLabel}</p>
      </div>
    </div>
  );
}

function TravelerOfferCard({ offer }: { offer: TravelerOfferCardData }) {
  const navigate = useNavigate();
  const status = offerStatusConfig[offer.status];

  return (
    <div
      onClick={() => navigate(`/app/offers/${offer.id}`)}
      className="cursor-pointer rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-sky-200 hover:shadow-md"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{offer.agencyName}</p>
          <p style={{ fontSize: '12.5px', color: '#6B7280' }}>{offer.destinationSummary}</p>
        </div>
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${status.color} ${status.bg}`}>
          {status.label}
        </span>
      </div>
      <p style={{ fontSize: '18px', fontWeight: 800, color: '#0EA5E9' }}>
        {offer.currency} {offer.price.toLocaleString()}
      </p>
    </div>
  );
}

function AgencyRequestCard({ request }: { request: TravelRequestListItemResponse }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-sky-200 hover:shadow-md transition-all">
      <div className="mb-2 flex items-start justify-between gap-2">
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>{request.destinationSummary}</p>
        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">{request.status}</span>
      </div>
      <p style={{ fontSize: '12.5px', color: '#6B7280' }}>{formatDisplayDate(request.startDate)} - {formatDisplayDate(request.endDate)}</p>
      <p style={{ fontSize: '12.5px', color: '#6B7280' }} className="mt-0.5">
        Budget: {request.budgetMin.toLocaleString()} - {request.budgetMax.toLocaleString()}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Flexible: {request.isFlexibleDate ? 'Yes' : 'No'}</span>
        <button
          onClick={() => navigate(`/app/offers/create/${request.id}`)}
          className="inline-flex items-center gap-1 text-sky-600"
          style={{ fontSize: '12.5px', fontWeight: 700 }}
        >
          Create Offer <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function TravelerDashboard() {
  const navigate = useNavigate();
  const { credentials, user } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [recentTrips, setRecentTrips] = useState<TravelerTripCardData[]>([]);
  const [recentOffers, setRecentOffers] = useState<TravelerOfferCardData[]>([]);
  const [stats, setStats] = useState({
    activeTrips: 0,
    pendingOffers: 0,
    completedTrips: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!credentials) {
        if (!cancelled) {
          setIsLoading(false);
          setRecentTrips([]);
          setRecentOffers([]);
        }
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const [allTrips, allOffers] = await Promise.all([
          collectAllPages<TripListResponse>((page, size) => getTripList(credentials, {
            page,
            size,
            sort: ['startDate,desc'],
          })),
          collectAllPages<OfferListItemResponse>((page, size) => getUserOffers(credentials, {
            page,
            size,
            sort: ['updatedAt,desc'],
          })),
        ]);

        const activeTrips = allTrips.filter(trip => {
          const normalized = normalizeTripStatus(trip.status);
          return normalized === 'published' || normalized === 'active' || normalized === 'accepted';
        }).length;
        const completedTrips = allTrips.filter(trip => normalizeTripStatus(trip.status) === 'completed').length;
        const pendingOffers = allOffers.filter(offer => offer.status === 'SENT').length;
        const totalSpent = allOffers
          .filter(offer => offer.status === 'ACCEPTED')
          .reduce((sum, offer) => sum + offer.price, 0);

        const topTrips = [...allTrips]
          .sort((a, b) => b.startDate.localeCompare(a.startDate))
          .slice(0, 3);

        const tripCards = await Promise.all(topTrips.map(async trip => {
          let destinationLabel = 'Destination not set';
          try {
            const destinations = await getDestinationList(trip.id, credentials, {
              page: 0,
              size: 1,
              sort: ['startDate,asc'],
            });
            const firstDestination = destinations.content[0];
            if (firstDestination) {
              destinationLabel = `${firstDestination.city}, ${firstDestination.country}`;
            }
          } catch {
            // Destination fallback remains generic.
          }

          return {
            id: trip.id,
            title: trip.title,
            status: trip.status,
            dayCount: toDayCount(trip.startDate, trip.endDate),
            dateRangeLabel: `${formatDisplayDate(trip.startDate)} - ${formatDisplayDate(trip.endDate)}`,
            destinationLabel,
          } satisfies TravelerTripCardData;
        }));

        const topOffers = [...allOffers]
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
          .slice(0, 3);

        const offerCards = await Promise.all(topOffers.map(async offer => {
          let destinationSummary = `Request #${offer.requestId}`;
          let agencyName = 'Travel Agency';

          try {
            const request = await getMyRequestDetail(offer.requestId, credentials);
            destinationSummary = request.destinationSummary;
          } catch {
            // Keep request fallback.
          }

          try {
            const detail = await getOfferDetail(offer.id, credentials);
            const agencyProfile = await getAccountProfile(detail.agencyAccountId, credentials);
            const profileName = agencyProfile.agencyName?.trim()
              || [agencyProfile.firstName, agencyProfile.lastName].filter(Boolean).join(' ').trim();
            if (profileName) {
              agencyName = profileName;
            }
          } catch {
            // Keep agency fallback.
          }

          return {
            id: offer.id,
            status: offer.status,
            price: offer.price,
            currency: offer.currency,
            destinationSummary,
            agencyName,
          } satisfies TravelerOfferCardData;
        }));

        if (!cancelled) {
          setStats({
            activeTrips,
            pendingOffers,
            completedTrips,
            totalSpent,
          });
          setRecentTrips(tripCards);
          setRecentOffers(offerCards);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Could not load dashboard.');
          setRecentTrips([]);
          setRecentOffers([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [credentials, reloadToken]);

  if (isLoading) {
    return <LoadingState label="Loading dashboard..." />;
  }

  return (
    <div className="p-6 space-y-7 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px' }}>Welcome back, {user.name}</h1>
          <p style={{ fontSize: '14px', color: '#6B7280' }} className="mt-0.5">You have {stats.pendingOffers} offers waiting for review</p>
        </div>
        <button
          onClick={() => navigate('/app/trips/create')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white shadow-sm shadow-sky-200"
          style={{ background: 'linear-gradient(135deg, #0EA5E9, #0D9488)', fontSize: '14px', fontWeight: 600 }}
        >
          <Plus className="w-4 h-4" />
          New Trip
        </button>
      </div>

      {loadError && (
        <ErrorState
          message={loadError}
          onRetry={() => setReloadToken(token => token + 1)}
        />
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Map} label="Active Trips" value={stats.activeTrips} sub="Published + active + accepted" color="text-sky-500" bgColor="bg-sky-50" />
        <StatCard icon={Inbox} label="Pending Offers" value={stats.pendingOffers} sub="Awaiting your response" color="text-orange-500" bgColor="bg-orange-50" />
        <StatCard icon={CheckCircle2} label="Completed Trips" value={stats.completedTrips} sub="Marked as completed" color="text-teal-500" bgColor="bg-teal-50" />
        <StatCard icon={DollarSign} label="Total Spent" value={`$${stats.totalSpent.toLocaleString()}`} sub="Accepted offers total" color="text-purple-500" bgColor="bg-purple-50" />
      </div>

      <div className="relative rounded-3xl overflow-hidden p-7" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #0C4A6E 60%, #134E4A 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #0EA5E9 0%, transparent 50%)' }} />
        <div className="relative flex items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Trip Generator</span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'white', letterSpacing: '-0.3px' }}>Generate your next itinerary with AI</h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)' }} className="mt-1">Uses the backend draft generation endpoint.</p>
          </div>
          <button
            onClick={() => navigate('/app/trips/create')}
            className="flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl text-sky-900 hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #38BDF8, #2DD4BF)', fontSize: '14px', fontWeight: 700 }}
          >
            Try AI Planner <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A' }}>My Trips</h2>
            <button onClick={() => navigate('/app/trips')} className="flex items-center gap-1 hover:underline" style={{ fontSize: '13px', color: '#0EA5E9', fontWeight: 600 }}>
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {recentTrips.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center">
                <p style={{ fontSize: '13.5px', color: '#9CA3AF' }}>No trips available yet.</p>
              </div>
            ) : (
              recentTrips.map(trip => <TravelerTripCard key={trip.id} trip={trip} />)
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A' }}>Recent Offers</h2>
            <button onClick={() => navigate('/app/offers')} className="flex items-center gap-1 hover:underline" style={{ fontSize: '13px', color: '#0EA5E9', fontWeight: 600 }}>
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-3">
            {recentOffers.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center">
                <p style={{ fontSize: '13.5px', color: '#9CA3AF' }}>No offers available yet.</p>
              </div>
            ) : (
              recentOffers.map(offer => <TravelerOfferCard key={offer.id} offer={offer} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AgencyDashboard() {
  const navigate = useNavigate();
  const { credentials } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [recentRequests, setRecentRequests] = useState<TravelRequestListItemResponse[]>([]);
  const [stats, setStats] = useState({
    activeRequests: 0,
    offersSent: 0,
    offersAccepted: 0,
    revenue: 0,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!credentials) {
        if (!cancelled) {
          setIsLoading(false);
          setRecentRequests([]);
        }
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const [marketplacePage, agencyOffers] = await Promise.all([
          getMarketplaceRequests(credentials, {
            page: 0,
            size: 50,
            sort: ['publishedAt,desc'],
          }),
          collectAllPages<OfferListItemResponse>((page, size) => getAgencyOffers(credentials, {
            page,
            size,
            sort: ['updatedAt,desc'],
          })),
        ]);

        const offersSent = agencyOffers.filter(offer => offer.status !== 'DRAFT' && offer.status !== 'READY').length;
        const offersAccepted = agencyOffers.filter(offer => offer.status === 'ACCEPTED').length;
        const revenue = agencyOffers
          .filter(offer => offer.status === 'ACCEPTED')
          .reduce((sum, offer) => sum + offer.price, 0);

        if (!cancelled) {
          setStats({
            activeRequests: marketplacePage.totalElements,
            offersSent,
            offersAccepted,
            revenue,
          });
          setRecentRequests(marketplacePage.content.slice(0, 3));
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Could not load dashboard.');
          setRecentRequests([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [credentials, reloadToken]);

  if (isLoading) {
    return <LoadingState label="Loading dashboard..." />;
  }

  const acceptanceRate = stats.offersSent > 0
    ? Math.round((stats.offersAccepted / stats.offersSent) * 100)
    : 0;

  return (
    <div className="p-6 space-y-7 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px' }}>Agency Dashboard</h1>
          <p style={{ fontSize: '14px', color: '#6B7280' }} className="mt-0.5">{stats.activeRequests} open requests in marketplace</p>
        </div>
        <button onClick={() => navigate('/app/marketplace')} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white" style={{ background: 'linear-gradient(135deg, #0D9488, #0EA5E9)', fontSize: '14px', fontWeight: 600 }}>
          <Globe className="w-4 h-4" /> Browse Marketplace
        </button>
      </div>

      {loadError && (
        <ErrorState
          message={loadError}
          onRetry={() => setReloadToken(token => token + 1)}
        />
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Open Requests" value={stats.activeRequests} sub="Published now" color="text-sky-500" bgColor="bg-sky-50" />
        <StatCard icon={Inbox} label="Offers Sent" value={stats.offersSent} sub="All statuses sent" color="text-teal-500" bgColor="bg-teal-50" />
        <StatCard icon={CheckCircle2} label="Offers Accepted" value={stats.offersAccepted} sub={`${acceptanceRate}% acceptance`} color="text-green-500" bgColor="bg-green-50" />
        <StatCard icon={DollarSign} label="Revenue" value={`$${stats.revenue.toLocaleString()}`} sub="Accepted offers total" color="text-orange-500" bgColor="bg-orange-50" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A' }}>Latest Travel Requests</h2>
          <button onClick={() => navigate('/app/marketplace')} className="flex items-center gap-1 hover:underline" style={{ fontSize: '13px', color: '#0EA5E9', fontWeight: 600 }}>
            View marketplace <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {recentRequests.length === 0 ? (
            <div className="md:col-span-3 rounded-2xl border border-gray-100 bg-white p-8 text-center">
              <p style={{ fontSize: '13.5px', color: '#9CA3AF' }}>No published requests available.</p>
            </div>
          ) : (
            recentRequests.map(request => <AgencyRequestCard key={request.id} request={request} />)
          )}
        </div>
      </div>
    </div>
  );
}

function AdminDashboardWidget() {
  const navigate = useNavigate();
  const { credentials } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAgencies: 0,
    totalAdmins: 0,
    activeRequests: 0,
    pendingAgencyApprovals: 0,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!credentials) {
        if (!cancelled) {
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const [usersPage, agenciesPage, adminsPage, pendingAgencies] = await Promise.all([
          getAdminAccounts(credentials, { role: 'USER', page: 0, size: 1 }),
          getAdminAccounts(credentials, { role: 'AGENCY', page: 0, size: 1 }),
          getAdminAccounts(credentials, { role: 'ADMIN', page: 0, size: 1 }),
          getPendingAgencies(credentials),
        ]);

        let activeRequests = 0;
        try {
          const requestsPage = await getMarketplaceRequests(credentials, { page: 0, size: 1, sort: ['publishedAt,desc'] });
          activeRequests = requestsPage.totalElements;
        } catch {
          // `/api/requests` is agency-scoped in the current API contract.
          // Keep admin overview metrics available even if this endpoint is forbidden.
        }

        const pendingAgencyApprovals = pendingAgencies.filter(item => !item.approved).length;

        if (!cancelled) {
          setStats({
            totalUsers: usersPage.totalElements,
            totalAgencies: agenciesPage.totalElements,
            totalAdmins: adminsPage.totalElements,
            activeRequests,
            pendingAgencyApprovals,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Could not load admin overview.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [credentials, reloadToken]);

  if (isLoading) {
    return <LoadingState label="Loading dashboard..." />;
  }

  return (
    <div className="p-6 space-y-7 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px' }}>Admin Overview</h1>
          <p style={{ fontSize: '14px', color: '#6B7280' }} className="mt-0.5">Platform metrics from live backend data</p>
        </div>
        <button onClick={() => navigate('/app/admin')} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white" style={{ background: 'linear-gradient(135deg, #F97316, #EF4444)', fontSize: '14px', fontWeight: 600 }}>
          Admin Panel <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {loadError && (
        <ErrorState
          message={loadError}
          onRetry={() => setReloadToken(token => token + 1)}
        />
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers.toLocaleString()} sub="Traveler accounts" color="text-sky-500" bgColor="bg-sky-50" />
        <StatCard icon={Building2} label="Agencies" value={stats.totalAgencies} sub={`${stats.pendingAgencyApprovals} pending`} color="text-teal-500" bgColor="bg-teal-50" />
        <StatCard icon={Activity} label="Active Requests" value={stats.activeRequests} sub="Published in marketplace" color="text-orange-500" bgColor="bg-orange-50" />
        <StatCard icon={FileText} label="Admins" value={stats.totalAdmins} sub="Admin accounts" color="text-purple-500" bgColor="bg-purple-50" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }} className="mb-4">Operational Snapshot</h3>
          <div className="space-y-3">
            {[
              { label: 'Pending agency approvals', value: stats.pendingAgencyApprovals },
              { label: 'Published requests', value: stats.activeRequests },
              { label: 'Traveler accounts', value: stats.totalUsers },
              { label: 'Agency accounts', value: stats.totalAgencies },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-gray-50">
                <span style={{ fontSize: '13.5px', color: '#6B7280' }}>{item.label}</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }} className="mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => navigate('/app/admin')}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-left hover:border-sky-300 hover:bg-sky-50 transition-colors"
              style={{ fontSize: '13px', fontWeight: 600, color: '#0EA5E9' }}
            >
              Manage accounts and approvals
            </button>
            <button
              type="button"
              onClick={() => navigate('/app/marketplace')}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-left hover:border-sky-300 hover:bg-sky-50 transition-colors"
              style={{ fontSize: '13px', fontWeight: 600, color: '#0EA5E9' }}
            >
              Review marketplace requests
            </button>
            <button
              type="button"
              onClick={() => navigate('/app/notifications')}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-left hover:border-sky-300 hover:bg-sky-50 transition-colors"
              style={{ fontSize: '13px', fontWeight: 600, color: '#0EA5E9' }}
            >
              Check latest notifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useApp();

  if (user.role === 'agency') return <AgencyDashboard />;
  if (user.role === 'admin') return <AdminDashboardWidget />;
  return <TravelerDashboard />;
}
