import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  DollarSign,
  FileText,
  Loader2,
  Paperclip,
  Plane,
  Hotel,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { createOffer, sendOffer } from '../services/offerApi';
import { getRequestDetail, type TravelRequestDetailResponse } from '../services/requestApi';
import {
  getActivityList,
  getDestinationList,
  type ActivityListResponse,
  type DestinationListResponse,
} from '../services/tripApi';

const STEPS = ['Price & Overview', 'Accommodation', 'Transport', 'Itinerary', 'Review & Send'];

interface TravelerItineraryDestination extends DestinationListResponse {
  activities: ActivityListResponse[];
}

function formatDateLabel(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
}

export default function OfferCreationPage() {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const { credentials, checkUnreadAndRefreshIfChanged } = useApp();

  const [requestDetail, setRequestDetail] = useState<TravelRequestDetailResponse | null>(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [accommodationDetails, setAccommodationDetails] = useState('');
  const [transportDetails, setTransportDetails] = useState('');
  const [itinerarySummary, setItinerarySummary] = useState('');
  const [conditions, setConditions] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [travelerItinerary, setTravelerItinerary] = useState<TravelerItineraryDestination[]>([]);
  const [loadingTravelerItinerary, setLoadingTravelerItinerary] = useState(false);
  const [travelerItineraryError, setTravelerItineraryError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadRequest = async () => {
      if (!credentials || !requestId) {
        if (!cancelled) {
          setRequestDetail(null);
          setTravelerItinerary([]);
          setTravelerItineraryError(null);
          setLoadingTravelerItinerary(false);
          setLoadingContext(false);
        }
        return;
      }

      setLoadingContext(true);
      try {
        const detail = await getRequestDetail(requestId, credentials);
        if (cancelled) return;

        setRequestDetail(detail);
        setTravelerItinerary([]);
        setTravelerItineraryError(null);
        setLoadingTravelerItinerary(true);

        try {
          const destinationPage = await getDestinationList(detail.tripId, credentials, {
            page: 0,
            size: 100,
            sort: ['startDate,asc', 'createdAt,asc'],
          });

          const itinerary = await Promise.all(destinationPage.content.map(async destination => {
            if (!destination.id) {
              return {
                ...destination,
                activities: [],
              } satisfies TravelerItineraryDestination;
            }

            try {
              const activityPage = await getActivityList(detail.tripId, destination.id, credentials, {
                page: 0,
                size: 200,
                sort: ['activityDate,asc', 'startTime,asc', 'displayOrder,asc'],
              });
              return {
                ...destination,
                activities: activityPage.content,
              } satisfies TravelerItineraryDestination;
            } catch {
              return {
                ...destination,
                activities: [],
              } satisfies TravelerItineraryDestination;
            }
          }));

          if (!cancelled) {
            setTravelerItinerary(itinerary);
          }
        } catch {
          if (!cancelled) {
            setTravelerItinerary([]);
            setTravelerItineraryError('Traveler itinerary is not available for this request.');
          }
        } finally {
          if (!cancelled) {
            setLoadingTravelerItinerary(false);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setRequestDetail(null);
          setTravelerItinerary([]);
          setTravelerItineraryError(null);
          setLoadingTravelerItinerary(false);
          toast.error(error instanceof Error ? error.message : 'Could not load request details.');
        }
      } finally {
        if (!cancelled) {
          setLoadingContext(false);
        }
      }
    };

    void loadRequest();

    return () => {
      cancelled = true;
    };
  }, [credentials, requestId]);

  const parsedPrice = useMemo(() => Number(price), [price]);
  const canProceed = () => {
    if (currentStep === 0) {
      return Number.isFinite(parsedPrice) && parsedPrice > 0 && currency.trim().length > 0;
    }
    if (currentStep === 1) {
      return accommodationDetails.trim().length > 0;
    }
    if (currentStep === 2) {
      return transportDetails.trim().length > 0;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!credentials) {
      toast.error('You need to log in first.');
      return;
    }
    if (!requestId) {
      toast.error('Request ID is missing.');
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      toast.error('Price must be greater than 0.');
      return;
    }
    if (!currency.trim()) {
      toast.error('Currency is required.');
      return;
    }
    if (!accommodationDetails.trim() || !transportDetails.trim()) {
      toast.error('Accommodation and transport details are required.');
      return;
    }

    setSubmitting(true);
    try {
      const createResponse = await createOffer(requestId, {
        price: parsedPrice,
        currency: currency.trim().toUpperCase(),
        accommodationDetails: accommodationDetails.trim(),
        transportDetails: transportDetails.trim(),
        itinerarySummary: itinerarySummary.trim() || undefined,
        conditions: conditions.trim() || undefined,
        attachmentUrl: attachmentUrl.trim() || undefined,
      }, credentials);

      const sendResponse = await sendOffer(createResponse.offerId, credentials);
      toast.success(sendResponse.message || 'Offer sent successfully.');
      void checkUnreadAndRefreshIfChanged().catch(() => {
        // Do not block navigation when notification refresh fails.
      });
      navigate('/app/offers');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create or send offer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingContext) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-6 py-4 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Loading request...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 transition-colors hover:bg-gray-200">
          <ArrowLeft className="h-4.5 w-4.5 text-gray-500" />
        </button>
        <div className="flex-1">
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px' }}>Create Offer</h1>
          <p style={{ fontSize: '13.5px', color: '#6B7280' }}>
            {requestDetail
              ? `${requestDetail.destinationSummary} · ${requestDetail.budgetMin.toLocaleString()}-${requestDetail.budgetMax.toLocaleString()} budget`
              : 'Request context unavailable'}
          </p>
        </div>
      </div>

      <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((step, index) => (
          <div key={step} className="flex flex-shrink-0 items-center gap-2">
            <div
              className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 transition-all ${
                index === currentStep
                  ? 'bg-gradient-to-r from-sky-500 to-teal-600 text-white'
                  : index < currentStep
                    ? 'bg-green-50 text-green-600'
                    : 'bg-gray-100 text-gray-400'
              }`}
              onClick={() => {
                if (index < currentStep) setCurrentStep(index);
              }}
            >
              <div className={`flex h-5 w-5 items-center justify-center rounded-full ${
                index === currentStep ? 'bg-white/25' : index < currentStep ? 'bg-green-400' : 'bg-gray-300'
              }`}>
                {index < currentStep ? <Check className="h-3 w-3 text-white" /> : <span style={{ fontSize: '10px', fontWeight: 800 }}>{index + 1}</span>}
              </div>
              <span style={{ fontSize: '12.5px', fontWeight: 600 }}>{step}</span>
            </div>
            {index < STEPS.length - 1 && <div className={`h-0.5 w-5 ${index < currentStep ? 'bg-green-300' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm lg:col-span-2">
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A' }} className="mb-6">{STEPS[currentStep]}</h2>

          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="mb-2 block">
                  <DollarSign className="mr-1 inline h-3.5 w-3.5 text-sky-500" />
                  Offer Price
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={event => setPrice(event.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                  style={{ fontSize: '22px', fontWeight: 800, color: '#0EA5E9' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="mb-2 block">
                  Currency
                </label>
                <input
                  value={currency}
                  onChange={event => setCurrency(event.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                  style={{ fontSize: '14px' }}
                />
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="block">
                <Hotel className="mr-1 inline h-3.5 w-3.5 text-sky-500" />
                Accommodation Details
              </label>
              <textarea
                value={accommodationDetails}
                onChange={event => setAccommodationDetails(event.target.value)}
                rows={8}
                placeholder="Hotel name, room type, location, meal plan, inclusions..."
                className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                style={{ fontSize: '14px' }}
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="block">
                <Plane className="mr-1 inline h-3.5 w-3.5 text-sky-500" />
                Transport Details
              </label>
              <textarea
                value={transportDetails}
                onChange={event => setTransportDetails(event.target.value)}
                rows={6}
                placeholder="Transfers, flights, local transport, pick-up details..."
                className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                style={{ fontSize: '14px' }}
              />

              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="block">
                <Paperclip className="mr-1 inline h-3.5 w-3.5 text-sky-500" />
                Attachment URL (optional)
              </label>
              <input
                value={attachmentUrl}
                onChange={event => setAttachmentUrl(event.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                style={{ fontSize: '14px' }}
              />
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>Traveler Existing Itinerary</p>
                {loadingTravelerItinerary ? (
                  <p style={{ fontSize: '12.5px', color: '#6B7280' }} className="mt-2">Loading traveler itinerary...</p>
                ) : travelerItinerary.length === 0 ? (
                  <p style={{ fontSize: '12.5px', color: '#6B7280' }} className="mt-2">
                    {travelerItineraryError ?? 'Traveler has no saved itinerary details yet.'}
                  </p>
                ) : (
                  <div className="mt-2 space-y-3">
                    {travelerItinerary.map(destination => (
                      <div key={String(destination.id)} className="rounded-xl border border-sky-100 bg-white p-3">
                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                          {destination.city}, {destination.country}
                        </p>
                        <p style={{ fontSize: '12px', color: '#6B7280' }}>
                          {formatDateLabel(destination.startDate)} - {formatDateLabel(destination.endDate)}
                        </p>
                        {destination.notes ? (
                          <p style={{ fontSize: '12px', color: '#6B7280' }} className="mt-1.5">{destination.notes}</p>
                        ) : null}

                        {destination.activities.length > 0 ? (
                          <div className="mt-2 space-y-1">
                            {destination.activities.slice(0, 3).map(activity => (
                              <p key={String(activity.id)} style={{ fontSize: '11.5px', color: '#4B5563' }}>
                                {formatDateLabel(activity.activityDate)} {activity.startTime.slice(0, 5)} - {activity.title}
                              </p>
                            ))}
                            {destination.activities.length > 3 ? (
                              <p style={{ fontSize: '11.5px', color: '#6B7280' }}>+{destination.activities.length - 3} more activities</p>
                            ) : null}
                          </div>
                        ) : (
                          <p style={{ fontSize: '11.5px', color: '#6B7280' }} className="mt-2">No activities listed for this destination.</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="block">
                <FileText className="mr-1 inline h-3.5 w-3.5 text-sky-500" />
                Itinerary Summary
              </label>
              <textarea
                value={itinerarySummary}
                onChange={event => setItinerarySummary(event.target.value)}
                rows={7}
                placeholder="Day-by-day summary and key experiences..."
                className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                style={{ fontSize: '14px' }}
              />

              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="block">
                Conditions (optional)
              </label>
              <textarea
                value={conditions}
                onChange={event => setConditions(event.target.value)}
                rows={4}
                placeholder="Cancellation policy, payment terms, availability notes..."
                className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                style={{ fontSize: '14px' }}
              />
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-gray-100">
                <div className="border-b border-sky-100 bg-gradient-to-r from-sky-50 to-teal-50 p-5">
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>Offer Summary</h3>
                </div>
                <div className="space-y-3 p-5">
                  <div className="flex items-center justify-between border-b border-gray-100 py-2.5">
                    <span style={{ fontSize: '14px', color: '#6B7280' }}>Price</span>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: '#0EA5E9' }}>{currency} {Number.isFinite(parsedPrice) ? parsedPrice.toLocaleString() : '-'}</span>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }} className="mb-1">Accommodation</p>
                    <p style={{ fontSize: '12.5px', color: '#6B7280' }}>{accommodationDetails || '-'}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }} className="mb-1">Transport</p>
                    <p style={{ fontSize: '12.5px', color: '#6B7280' }}>{transportDetails || '-'}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }} className="mb-1">Itinerary</p>
                    <p style={{ fontSize: '12.5px', color: '#6B7280' }}>{itinerarySummary || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-5">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 transition-all hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #0EA5E9, #0D9488)', fontSize: '14px', fontWeight: 600 }}
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => void handleSubmit()}
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-white transition-all disabled:opacity-70"
                style={{ background: 'linear-gradient(135deg, #0EA5E9, #0D9488)', fontSize: '14px', fontWeight: 700 }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Create & Send Offer
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="h-fit overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="p-5">
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }} className="mb-4">Request Snapshot</h3>
            {requestDetail ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>Destination</p>
                  <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#374151' }}>{requestDetail.destinationSummary}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>Dates</p>
                  <p style={{ fontSize: '13px', color: '#374151' }}>{requestDetail.startDate} - {requestDetail.endDate}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>Budget Range</p>
                  <p style={{ fontSize: '13px', color: '#374151' }}>{requestDetail.budgetMin.toLocaleString()} - {requestDetail.budgetMax.toLocaleString()}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>Shared Preferences</p>
                  <p style={{ fontSize: '12.5px', color: '#6B7280', lineHeight: 1.5 }}>{requestDetail.sharedPreferences}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>Traveler Itinerary</p>
                  {loadingTravelerItinerary ? (
                    <p style={{ fontSize: '12px', color: '#6B7280' }} className="mt-1.5">Loading itinerary...</p>
                  ) : travelerItinerary.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#6B7280' }} className="mt-1.5">
                      {travelerItineraryError ?? 'No itinerary details shared yet.'}
                    </p>
                  ) : (
                    <div className="mt-1.5 space-y-2">
                      {travelerItinerary.map(destination => (
                        <div key={String(destination.id)} className="rounded-lg border border-gray-200 bg-white px-2.5 py-2">
                          <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                            {destination.city}, {destination.country}
                          </p>
                          <p style={{ fontSize: '11.5px', color: '#6B7280' }}>
                            {formatDateLabel(destination.startDate)} - {formatDateLabel(destination.endDate)}
                          </p>
                          <p style={{ fontSize: '11px', color: '#6B7280' }}>
                            {destination.activities.length} {destination.activities.length === 1 ? 'activity' : 'activities'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {requestDetail.isFlexibleDate && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-sky-700" style={{ fontSize: '11px', fontWeight: 700 }}>
                    <CheckCircle2 className="h-3 w-3" />
                    Flexible dates
                  </span>
                )}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#9CA3AF' }}>Request details are unavailable.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
