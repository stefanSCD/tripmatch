import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  EyeOff,
  Loader2,
  Lock,
  MapPin,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { getDestinationList, getTripBudget, getTripDetail } from '../services/tripApi';
import { publishTravelRequest, type TravelRequestResponse } from '../services/requestApi';

const previewImage = 'https://images.unsplash.com/photo-1573790387438-4da905039392?w=900&h=600&fit=crop';
const activities = ['City tours', 'Nature', 'Food', 'Culture', 'Relaxation', 'Adventure'];

interface ShareToggle {
  key: string;
  label: string;
  description: string;
  visible: boolean;
}

function formatDateInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return trimmed;
  return parsed.toISOString().slice(0, 10);
}

export default function PublishRequestPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { credentials } = useApp();

  const [loadingTrip, setLoadingTrip] = useState(true);
  const [tripTitle, setTripTitle] = useState('Trip Request');
  const [destinationSummary, setDestinationSummary] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budgetMin, setBudgetMin] = useState(1000);
  const [budgetMax, setBudgetMax] = useState(2500);
  const [isFlexibleDate, setIsFlexibleDate] = useState(false);
  const [estimatedTravelers, setEstimatedTravelers] = useState('2');

  const [shareItems, setShareItems] = useState<ShareToggle[]>([
    { key: 'destination', label: 'Destination', description: 'Destination summary and timeframe', visible: true },
    { key: 'budget', label: 'Budget', description: 'Budget range for the request', visible: true },
    { key: 'activities', label: 'Activities', description: 'Preferred activities and style', visible: true },
    { key: 'travelers', label: 'Travelers', description: 'Approximate party size', visible: true },
    { key: 'notes', label: 'Extra Notes', description: 'Special requirements for agencies', visible: true },
    { key: 'contact', label: 'Contact Info', description: 'Contact is shared only after acceptance', visible: false },
  ]);

  const [selectedActivities, setSelectedActivities] = useState<string[]>(['Culture', 'Food', 'Relaxation']);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [published, setPublished] = useState<TravelRequestResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadTripContext = async () => {
      if (!credentials || !id) {
        if (!cancelled) {
          setLoadingTrip(false);
        }
        return;
      }

      setLoadingTrip(true);
      try {
        const trip = await getTripDetail(id, credentials);
        if (cancelled) return;

        setTripTitle(trip.title);
        setStartDate(formatDateInput(trip.startDate));
        setEndDate(formatDateInput(trip.endDate));
        setDestinationSummary(trip.title);

        try {
          const destinations = await getDestinationList(id, credentials, {
            page: 0,
            size: 1,
            sort: ['startDate,asc'],
          });
          if (!cancelled && destinations.content[0]) {
            const firstDestination = destinations.content[0];
            setDestinationSummary(`${firstDestination.city}, ${firstDestination.country}`);
          }
        } catch {
          // Destination summary fallback remains trip title.
        }

        try {
          const budget = await getTripBudget(id, credentials);
          if (!cancelled) {
            const total = Math.max(1, Math.round(budget.totalBudget));
            const min = Math.max(1, Math.round(total * 0.7));
            setBudgetMin(min);
            setBudgetMax(total);
          }
        } catch {
          // Budget is optional. Keep defaults.
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Could not load trip context.');
        }
      } finally {
        if (!cancelled) {
          setLoadingTrip(false);
        }
      }
    };

    void loadTripContext();

    return () => {
      cancelled = true;
    };
  }, [credentials, id]);

  const toggleVisibility = (key: string) => {
    setShareItems(prev => prev.map(item => (item.key === key ? { ...item, visible: !item.visible } : item)));
  };

  const toggleActivity = (activity: string) => {
    setSelectedActivities(prev => (
      prev.includes(activity)
        ? prev.filter(value => value !== activity)
        : [...prev, activity]
    ));
  };

  const sharedPreferences = useMemo(() => {
    const visibleFields = shareItems.filter(item => item.visible).map(item => item.label);
    const preferencesLines = [
      `Visible fields: ${visibleFields.join(', ') || 'none'}`,
      `Travelers: ${estimatedTravelers || 'not specified'}`,
      `Preferred activities: ${selectedActivities.join(', ') || 'none specified'}`,
    ];

    if (additionalNotes.trim()) {
      preferencesLines.push(`Notes: ${additionalNotes.trim()}`);
    }

    return preferencesLines.join('\n');
  }, [additionalNotes, estimatedTravelers, selectedActivities, shareItems]);

  const handlePublish = async () => {
    if (!credentials) {
      toast.error('You need to log in first.');
      return;
    }

    if (!id) {
      toast.error('Trip ID is missing from the route.');
      return;
    }

    const summary = destinationSummary.trim();
    const safeStartDate = startDate.trim();
    const safeEndDate = endDate.trim();

    if (!summary || !safeStartDate || !safeEndDate) {
      toast.error('Destination summary and dates are required.');
      return;
    }

    if (budgetMin < 0 || budgetMax < 0 || budgetMin > budgetMax) {
      toast.error('Budget range is invalid.');
      return;
    }

    setIsPublishing(true);
    try {
      const response = await publishTravelRequest(id, {
        sharedPreferences,
        budgetMin,
        budgetMax,
        destinationSummary: summary,
        startDate: safeStartDate,
        endDate: safeEndDate,
        isFlexibleDate,
      }, credentials);

      setPublished(response);
      toast.success(response.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not publish request.');
    } finally {
      setIsPublishing(false);
    }
  };

  if (loadingTrip) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-6 py-4 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Loading publish form...</span>
        </div>
      </div>
    );
  }

  if (published) {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <div className="max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }} className="mb-2">
            Request Published
          </h1>
          <p style={{ fontSize: '15px', color: '#6B7280', lineHeight: 1.65 }} className="mb-8">
            Request #{published.requestId} is now visible for agencies. You can monitor incoming offers from the offers inbox.
          </p>

          <div className="mb-8 grid grid-cols-3 gap-4">
            {[
              { icon: Building2, label: 'Status', value: published.status },
              { icon: Clock, label: 'Published', value: published.publishedAt ? 'Now' : '-' },
              { icon: Sparkles, label: 'Trip ID', value: String(published.tripId) },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl border border-gray-100 bg-white p-4">
                <stat.icon className="mx-auto mb-2 h-5 w-5 text-sky-500" />
                <p style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>{stat.value}</p>
                <p style={{ fontSize: '11.5px', color: '#9CA3AF' }}>{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/app/offers')}
              className="w-full rounded-2xl py-4 text-white"
              style={{ background: 'linear-gradient(135deg, #0EA5E9, #0D9488)', fontSize: '15px', fontWeight: 700 }}
            >
              View Offers Inbox
            </button>
            <button
              onClick={() => navigate('/app/requests')}
              className="w-full rounded-2xl border border-gray-200 py-4 hover:bg-gray-50"
              style={{ fontSize: '15px', fontWeight: 600, color: '#374151' }}
            >
              Go to My Requests
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200">
          <ArrowLeft className="h-4.5 w-4.5 text-gray-500" />
        </button>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px' }}>Publish to Marketplace</h1>
          <p style={{ fontSize: '13.5px', color: '#6B7280' }}>{tripTitle}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-4.5 w-4.5 text-sky-500" />
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>Request Core Details</h2>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#374151' }}>Destination Summary</span>
                <input
                  value={destinationSummary}
                  onChange={event => setDestinationSummary(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  style={{ fontSize: '13.5px' }}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#374151' }}>Start Date</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={event => setStartDate(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    style={{ fontSize: '13.5px' }}
                  />
                </label>

                <label className="block">
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#374151' }}>End Date</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={event => setEndDate(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    style={{ fontSize: '13.5px' }}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#374151' }}>Budget Min</span>
                  <input
                    type="number"
                    min="0"
                    value={budgetMin}
                    onChange={event => setBudgetMin(Math.max(0, Number(event.target.value) || 0))}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    style={{ fontSize: '13.5px' }}
                  />
                </label>

                <label className="block">
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#374151' }}>Budget Max</span>
                  <input
                    type="number"
                    min="0"
                    value={budgetMax}
                    onChange={event => setBudgetMax(Math.max(0, Number(event.target.value) || 0))}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    style={{ fontSize: '13.5px' }}
                  />
                </label>
              </div>

              <label className="mt-1 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={isFlexibleDate}
                  onChange={event => setIsFlexibleDate(event.target.checked)}
                />
                <span style={{ fontSize: '12.5px', color: '#374151' }}>Flexible dates</span>
              </label>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Lock className="h-4.5 w-4.5 text-sky-500" />
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>Visibility Controls</h2>
            </div>
            <div className="space-y-3">
              {shareItems.map(item => (
                <div key={item.key} className="flex items-center justify-between rounded-2xl border border-gray-100 p-3">
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{item.label}</p>
                    <p style={{ fontSize: '11.5px', color: '#9CA3AF' }}>{item.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleVisibility(item.key)}
                    className={`flex h-5.5 w-10 items-center rounded-full px-0.5 ${item.visible ? 'justify-end bg-sky-500' : 'justify-start bg-gray-200'}`}
                  >
                    <span className="h-4 w-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }} className="mb-3">Traveler Preferences</h2>
            <div className="mb-3">
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#374151' }}>Estimated Travelers</label>
              <input
                value={estimatedTravelers}
                onChange={event => setEstimatedTravelers(event.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-200"
                style={{ fontSize: '13.5px' }}
              />
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              {activities.map(activity => (
                <button
                  key={activity}
                  type="button"
                  onClick={() => toggleActivity(activity)}
                  className={`rounded-full border px-3 py-1.5 ${
                    selectedActivities.includes(activity)
                      ? 'border-sky-300 bg-sky-100 text-sky-700'
                      : 'border-gray-200 bg-gray-50 text-gray-500'
                  }`}
                  style={{ fontSize: '12px', fontWeight: 600 }}
                >
                  {activity}
                </button>
              ))}
            </div>

            <textarea
              value={additionalNotes}
              onChange={event => setAdditionalNotes(event.target.value)}
              placeholder="Special requirements for agencies..."
              rows={4}
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-200"
              style={{ fontSize: '13.5px' }}
            />
          </div>
        </div>

        <div>
          <div className="sticky top-6 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
            <div className="relative h-44 overflow-hidden">
              <img src={previewImage} alt={destinationSummary} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
              <div className="absolute bottom-3 left-3">
                <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-green-400 px-2.5 py-1 text-white" style={{ fontSize: '11px', fontWeight: 700 }}>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  Live Preview
                </span>
                <p style={{ fontWeight: 800, fontSize: '18px', color: 'white' }}>{destinationSummary || 'Destination summary'}</p>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}><Calendar className="mr-1 inline h-3 w-3" />Dates</p>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }} className="mt-1">{startDate} - {endDate}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}><DollarSign className="mr-1 inline h-3 w-3" />Budget</p>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }} className="mt-1">{budgetMin} - {budgetMax}</p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p style={{ fontSize: '11.5px', fontWeight: 700, color: '#6B7280' }}><Users className="mr-1 inline h-3 w-3" />Travelers: {estimatedTravelers || 'n/a'}</p>
              </div>

              {shareItems.filter(item => !item.visible).length > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <EyeOff className="h-4 w-4 text-gray-400" />
                  <p style={{ fontSize: '12px', color: '#9CA3AF' }}>{shareItems.filter(item => !item.visible).length} fields hidden</p>
                </div>
              )}

              <button
                onClick={() => void handlePublish()}
                disabled={isPublishing}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-white transition-all hover:opacity-90 disabled:opacity-70"
                style={{ background: 'linear-gradient(135deg, #0EA5E9, #0D9488)', fontSize: '15px', fontWeight: 700 }}
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Share2 className="h-5 w-5" />
                    Publish to Marketplace
                  </>
                )}
              </button>
              <p style={{ fontSize: '11.5px', color: '#9CA3AF', textAlign: 'center' }}>
                Agencies will be notified once this request is published.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
