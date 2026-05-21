import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  MessageSquare,
  Plane,
  Send,
  XCircle,
  Hotel,
  Paperclip,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { acceptOffer, getOfferDetail, rejectOffer, sendOffer, type OfferDetailResponse } from '../services/offerApi';
import { getMyRequestDetail, getRequestDetail, type TravelRequestDetailResponse } from '../services/requestApi';

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

const statusLabel: Record<OfferDetailResponse['status'], { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-gray-50 border-gray-200 text-gray-700' },
  READY: { label: 'Ready', className: 'bg-sky-50 border-sky-200 text-sky-700' },
  SENT: { label: 'Sent', className: 'bg-amber-50 border-amber-200 text-amber-700' },
  ACCEPTED: { label: 'Accepted', className: 'bg-green-50 border-green-200 text-green-700' },
  REJECTED: { label: 'Rejected', className: 'bg-red-50 border-red-200 text-red-600' },
  EXPIRED: { label: 'Expired', className: 'bg-purple-50 border-purple-200 text-purple-700' },
};

export default function OfferDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { credentials, user, checkUnreadAndRefreshIfChanged } = useApp();

  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<'send' | 'accept' | 'reject' | null>(null);
  const [offer, setOffer] = useState<OfferDetailResponse | null>(null);
  const [requestDetail, setRequestDetail] = useState<TravelRequestDetailResponse | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectFeedback, setRejectFeedback] = useState('');

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
        const detail = await getOfferDetail(id, credentials);
        if (cancelled) return;
        setOffer(detail);

        try {
          const request = user.role === 'agency'
            ? await getRequestDetail(detail.requestId, credentials)
            : await getMyRequestDetail(detail.requestId, credentials);
          if (!cancelled) {
            setRequestDetail(request);
          }
        } catch {
          if (!cancelled) {
            setRequestDetail(null);
          }
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Could not load offer details.');
          setOffer(null);
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
  }, [credentials, id, user.role]);

  const canSend = useMemo(() => user.role === 'agency' && (offer?.status === 'DRAFT' || offer?.status === 'READY'), [offer?.status, user.role]);
  const canTravelerRespond = useMemo(() => user.role === 'traveler' && offer?.status === 'SENT', [offer?.status, user.role]);

  const handleSend = async () => {
    if (!offer || !credentials) return;
    setBusyAction('send');
    try {
      const response = await sendOffer(offer.id, credentials);
      setOffer(prev => (prev ? { ...prev, status: response.status, sentAt: new Date().toISOString() } : prev));
      toast.success(response.message);
      void checkUnreadAndRefreshIfChanged().catch(() => {
        // Notification sync failures are handled in polling state.
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not send offer.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleAccept = async () => {
    if (!offer || !credentials) return;
    setBusyAction('accept');
    try {
      const response = await acceptOffer(offer.id, credentials);
      setOffer(prev => (
        prev
          ? { ...prev, status: response.status, respondedAt: new Date().toISOString() }
          : prev
      ));
      toast.success(response.message);
      void checkUnreadAndRefreshIfChanged().catch(() => {
        // Notification sync failures are handled in polling state.
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not accept offer.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleReject = async () => {
    if (!offer || !credentials) return;
    const feedback = rejectFeedback.trim();
    if (!feedback) {
      toast.error('Feedback is required for reject action.');
      return;
    }

    setBusyAction('reject');
    try {
      const response = await rejectOffer(offer.id, { feedbackMessage: feedback }, credentials);
      setOffer(prev => (
        prev
          ? { ...prev, status: response.status, feedbackMessage: feedback, respondedAt: new Date().toISOString() }
          : prev
      ));
      setShowRejectModal(false);
      setRejectFeedback('');
      toast.success(response.message);
      void checkUnreadAndRefreshIfChanged().catch(() => {
        // Notification sync failures are handled in polling state.
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not reject offer.');
    } finally {
      setBusyAction(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-6 py-4 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Loading offer details...</span>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <FileText className="mx-auto mb-3 h-8 w-8 text-gray-400" />
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#374151' }}>Offer could not be loaded.</p>
          <button
            onClick={() => navigate('/app/offers')}
            className="mt-4 rounded-xl border border-gray-200 px-4 py-2 hover:bg-gray-50"
            style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}
          >
            Back to Offers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-3 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-500" />
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Reject Offer</h3>
            </div>
            <p style={{ fontSize: '13.5px', color: '#6B7280' }} className="mb-3">
              Add feedback for the agency.
            </p>
            <textarea
              value={rejectFeedback}
              onChange={event => setRejectFeedback(event.target.value)}
              rows={4}
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-sky-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
              style={{ fontSize: '13.5px' }}
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 hover:bg-gray-50"
                style={{ fontSize: '13.5px', fontWeight: 700, color: '#374151' }}
              >
                Cancel
              </button>
              <button
                onClick={() => void handleReject()}
                disabled={busyAction === 'reject'}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-white disabled:opacity-60"
                style={{ fontSize: '13.5px', fontWeight: 700 }}
              >
                {busyAction === 'reject' ? 'Rejecting...' : 'Reject Offer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200">
          <ArrowLeft className="h-4.5 w-4.5 text-gray-500" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px' }}>Offer Details</h1>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 ${statusLabel[offer.status].className}`} style={{ fontSize: '11px', fontWeight: 700 }}>
              {statusLabel[offer.status].label}
            </span>
          </div>
          <p style={{ fontSize: '13.5px', color: '#6B7280' }}>
            {requestDetail?.destinationSummary || `Request #${offer.requestId}`}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }} className="mb-4">Commercial</h3>
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
              <span style={{ fontSize: '14px', color: '#6B7280' }}>Price</span>
              <span style={{ fontSize: '26px', fontWeight: 800, color: '#0EA5E9' }}>{offer.currency} {offer.price.toLocaleString()}</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-3">
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>Created</p>
                <p style={{ fontSize: '12.5px', color: '#374151' }}>{formatDateTime(offer.createdAt)}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>Updated</p>
                <p style={{ fontSize: '12.5px', color: '#374151' }}>{formatDateTime(offer.updatedAt)}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>Sent At</p>
                <p style={{ fontSize: '12.5px', color: '#374151' }}>{formatDateTime(offer.sentAt)}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>Responded At</p>
                <p style={{ fontSize: '12.5px', color: '#374151' }}>{formatDateTime(offer.respondedAt)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }} className="mb-3">Operational Details</h3>
            <div className="space-y-3">
              <div className="rounded-xl bg-gray-50 p-3">
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }} className="mb-1">
                  <Hotel className="mr-1 inline h-3.5 w-3.5 text-purple-500" />
                  Accommodation
                </p>
                <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.55 }}>{offer.accommodationDetails}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }} className="mb-1">
                  <Plane className="mr-1 inline h-3.5 w-3.5 text-sky-500" />
                  Transport
                </p>
                <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.55 }}>{offer.transportDetails}</p>
              </div>
              {offer.itinerarySummary && (
                <div className="rounded-xl bg-gray-50 p-3">
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }} className="mb-1">
                    <FileText className="mr-1 inline h-3.5 w-3.5 text-teal-500" />
                    Itinerary Summary
                  </p>
                  <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.55 }}>{offer.itinerarySummary}</p>
                </div>
              )}
              {offer.conditions && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#92400E' }} className="mb-1">Conditions</p>
                  <p style={{ fontSize: '13px', color: '#78350F', lineHeight: 1.55 }}>{offer.conditions}</p>
                </div>
              )}
              {offer.attachmentUrl && (
                <a
                  href={offer.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 hover:bg-gray-50"
                  style={{ fontSize: '13px', fontWeight: 700, color: '#0EA5E9' }}
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  Open Attachment
                </a>
              )}
              {offer.feedbackMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#B91C1C' }} className="mb-1">Feedback</p>
                  <p style={{ fontSize: '13px', color: '#7F1D1D', lineHeight: 1.55 }}>{offer.feedbackMessage}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }} className="mb-3">Request Context</h3>
            {requestDetail ? (
              <div className="space-y-2">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>Destination</p>
                  <p style={{ fontSize: '13px', color: '#374151' }}>{requestDetail.destinationSummary}</p>
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
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>Preferences</p>
                  <p style={{ fontSize: '12.5px', color: '#6B7280', lineHeight: 1.5 }}>{requestDetail.sharedPreferences}</p>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#9CA3AF' }}>Request details unavailable.</p>
            )}
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }} className="mb-3">Actions</h3>

            {canSend && (
              <button
                onClick={() => void handleSend()}
                disabled={busyAction === 'send'}
                className="mb-2 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-white disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #0EA5E9, #0D9488)', fontSize: '14px', fontWeight: 700 }}
              >
                <Send className="h-4.5 w-4.5" />
                {busyAction === 'send' ? 'Sending...' : 'Send Offer'}
              </button>
            )}

            {canTravelerRespond && (
              <>
                <button
                  onClick={() => void handleAccept()}
                  disabled={busyAction === 'accept'}
                  className="mb-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-3.5 text-white disabled:opacity-60"
                  style={{ fontSize: '14px', fontWeight: 700 }}
                >
                  <CheckCircle2 className="h-4.5 w-4.5" />
                  {busyAction === 'accept' ? 'Accepting...' : 'Accept Offer'}
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={busyAction !== null}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-3.5 text-red-600 disabled:opacity-60"
                  style={{ fontSize: '14px', fontWeight: 700 }}
                >
                  <XCircle className="h-4.5 w-4.5" />
                  Reject Offer
                </button>
              </>
            )}

            {!canSend && !canTravelerRespond && (
              <p style={{ fontSize: '13px', color: '#9CA3AF' }}>
                No available actions for current role/status.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
