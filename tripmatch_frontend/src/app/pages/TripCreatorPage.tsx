import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { addDays, format, parseISO } from 'date-fns';
import { ArrowLeft, ArrowRight, Calendar, FileText, Loader2, Map, MapPin, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import {
  createTrip,
  generateAiDraft,
  regenerateAiDraftDay,
  saveAiDraftAsTrip,
  type AiDraftDetailResponse,
} from '../services/tripApi';

const interestOptions = [
  'Culture',
  'Food',
  'Nature',
  'Hiking',
  'Museums',
  'Photography',
  'Nightlife',
  'Wellness',
  'Shopping',
  'Architecture',
];

function buildDefaultDates() {
  const today = new Date();
  return {
    startDate: format(today, 'yyyy-MM-dd'),
    endDate: format(addDays(today, 6), 'yyyy-MM-dd'),
  };
}

export default function TripCreatorPage() {
  const navigate = useNavigate();
  const { credentials } = useApp();
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('ai');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);
  const [regeneratingDay, setRegeneratingDay] = useState<number | null>(null);
  const [aiDraft, setAiDraft] = useState<AiDraftDetailResponse | null>(null);

  // Manual form
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');

  // AI form
  const defaults = useMemo(() => buildDefaultDates(), []);
  const [destinationHint, setDestinationHint] = useState('');
  const [tripType, setTripType] = useState('');
  const [aiStartDate, setAiStartDate] = useState(defaults.startDate);
  const [aiEndDate, setAiEndDate] = useState(defaults.endDate);
  const [budgetTotal, setBudgetTotal] = useState('3000');
  const [currency, setCurrency] = useState('USD');
  const [pace, setPace] = useState('Moderate');
  const [notes, setNotes] = useState('');
  const [interests, setInterests] = useState<string[]>([]);

  const toggleInterest = (interest: string) => {
    setInterests(prev => (prev.includes(interest) ? prev.filter(item => item !== interest) : [...prev, interest]));
  };

  const handleCreateManualTrip = async () => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedStartDate = startDate.trim();
    const trimmedEndDate = endDate.trim();

    if (!credentials) {
      toast.error('You need to log in first.');
      return;
    }

    if (!trimmedTitle || !trimmedStartDate || !trimmedEndDate) {
      toast.error('Title, start date and end date are required.');
      return;
    }

    if (trimmedTitle.length < 2 || trimmedTitle.length > 255) {
      toast.error('Title must be between 2 and 255 characters.');
      return;
    }

    const start = parseISO(trimmedStartDate);
    const end = parseISO(trimmedEndDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.error('Please enter valid dates.');
      return;
    }

    if (end < start) {
      toast.error('End date must be after start date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createTrip({
        title: trimmedTitle,
        description: trimmedDescription || undefined,
        startDate: trimmedStartDate,
        endDate: trimmedEndDate,
        createdWithAi: false,
      }, credentials);

      toast.success(response.message);
      navigate(`/app/trips/${response.tripId}/planner`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create trip.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateAiTrip = async () => {
    const trimmedDestination = destinationHint.trim();
    const trimmedTripType = tripType.trim();
    const trimmedCurrency = currency.trim().toUpperCase();
    const trimmedPace = pace.trim();
    const trimmedNotes = notes.trim();
    const parsedBudget = Number(budgetTotal);

    if (!credentials) {
      toast.error('You need to log in first.');
      return;
    }

    if (!trimmedDestination && !trimmedTripType) {
      toast.error('Provide at least destination or trip type.');
      return;
    }

    if (!aiStartDate || !aiEndDate) {
      toast.error('Start date and end date are required.');
      return;
    }

    const start = parseISO(aiStartDate);
    const end = parseISO(aiEndDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.error('Please enter valid dates for AI generation.');
      return;
    }

    if (end < start) {
      toast.error('End date must be after start date.');
      return;
    }

    if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) {
      toast.error('Budget total must be greater than 0.');
      return;
    }

    if (!trimmedCurrency) {
      toast.error('Currency is required.');
      return;
    }

    if (!trimmedPace) {
      toast.error('Pace is required.');
      return;
    }

    setAiLoading(true);
    try {
      const draft = await generateAiDraft({
        destinationHint: trimmedDestination || undefined,
        tripType: trimmedTripType || undefined,
        startDate: aiStartDate,
        endDate: aiEndDate,
        budgetTotal: parsedBudget,
        currency: trimmedCurrency,
        interests: interests.length > 0 ? interests : undefined,
        pace: trimmedPace,
        notes: trimmedNotes || undefined,
      }, credentials);

      setAiDraft(draft);
      toast.success('AI draft generated successfully.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to generate AI draft.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveDraftAsTrip = async () => {
    if (!credentials) {
      toast.error('You need to log in first.');
      return;
    }

    if (!aiDraft) {
      toast.error('Generate a draft first.');
      return;
    }

    const override = window.prompt('Trip title override (optional):', aiDraft.title) ?? '';
    const trimmedOverride = override.trim();

    setAiSaving(true);
    try {
      const response = await saveAiDraftAsTrip(
        aiDraft.id,
        trimmedOverride ? { tripTitleOverride: trimmedOverride } : undefined,
        credentials,
      );
      toast.success(response.message);
      navigate(`/app/trips/${response.tripId}/planner`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save AI draft as trip.');
    } finally {
      setAiSaving(false);
    }
  };

  const handleRegenerateDay = async (dayNumber: number) => {
    if (!credentials || !aiDraft) return;
    const instruction = window.prompt(`Instruction for day ${dayNumber} (optional):`, '') ?? '';

    setRegeneratingDay(dayNumber);
    try {
      const nextDraft = await regenerateAiDraftDay(aiDraft.id, {
        dayNumber,
        instruction: instruction.trim() || undefined,
      }, credentials);
      setAiDraft(nextDraft);
      toast.success(`Day ${dayNumber} regenerated.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to regenerate day.');
    } finally {
      setRegeneratingDay(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate('/app/trips')}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 transition-colors hover:bg-gray-200"
        >
          <ArrowLeft className="h-4.5 w-4.5 text-gray-500" />
        </button>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px' }}>Plan Your Trip</h1>
          <p style={{ fontSize: '14px', color: '#6B7280' }}>Create manually or generate an AI draft from the backend</p>
        </div>
      </div>

      <div className="mb-8 flex w-fit gap-1 rounded-2xl bg-gray-100 p-1">
        {[
          { key: 'ai', label: 'AI Generator', icon: Sparkles },
          { key: 'manual', label: 'Manual Planning', icon: Map },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as 'manual' | 'ai')}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 transition-all ${
              activeTab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
            style={{ fontSize: '14px', fontWeight: activeTab === key ? 700 : 500 }}
          >
            <Icon className={`h-4 w-4 ${activeTab === key && key === 'ai' ? 'text-sky-500' : ''}`} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'manual' && (
        <div className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Trip Details</h2>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="mb-1.5 block">
              <FileText className="mr-1.5 inline h-3.5 w-3.5 text-sky-500" />
              Title
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Give your trip a title"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 transition-all focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
              style={{ fontSize: '14.5px' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="mb-1.5 block">
                <Calendar className="mr-1.5 inline h-3.5 w-3.5 text-sky-500" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 transition-all focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                style={{ fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="mb-1.5 block">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 transition-all focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                style={{ fontSize: '14px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="mb-1.5 block">
              <FileText className="mr-1.5 inline h-3.5 w-3.5 text-sky-500" />
              Trip Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe your plan"
              rows={5}
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 transition-all focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
              style={{ fontSize: '14px' }}
            />
          </div>

          <button
            onClick={handleCreateManualTrip}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-white disabled:opacity-70"
            style={{ background: 'linear-gradient(135deg, #0EA5E9, #0D9488)', fontSize: '14px', fontWeight: 700 }}
          >
            {isSubmitting ? 'Creating trip...' : <>Continue to Planner <ArrowRight className="h-4 w-4" /></>}
          </button>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6 rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 to-teal-50 p-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-teal-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>AI Trip Generator</p>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="mb-1.5 block">
                <MapPin className="mr-1.5 inline h-3.5 w-3.5 text-sky-500" />
                Destination Hint
              </label>
              <input
                value={destinationHint}
                onChange={e => setDestinationHint(e.target.value)}
                placeholder="e.g. Bali, Indonesia"
                className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-300"
                style={{ fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="mb-1.5 block">Trip Type</label>
              <input
                value={tripType}
                onChange={e => setTripType(e.target.value)}
                placeholder="e.g. Cultural, Relaxation, Family"
                className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-300"
                style={{ fontSize: '14px' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="mb-1.5 block">Start Date</label>
                <input
                  type="date"
                  value={aiStartDate}
                  onChange={e => setAiStartDate(e.target.value)}
                  className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-300"
                  style={{ fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="mb-1.5 block">End Date</label>
                <input
                  type="date"
                  value={aiEndDate}
                  onChange={e => setAiEndDate(e.target.value)}
                  className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-300"
                  style={{ fontSize: '14px' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="mb-1.5 block">Budget Total</label>
                <input
                  value={budgetTotal}
                  onChange={e => setBudgetTotal(e.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-300"
                  style={{ fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="mb-1.5 block">Currency</label>
                <input
                  value={currency}
                  onChange={e => setCurrency(e.target.value.toUpperCase())}
                  placeholder="USD"
                  className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-300"
                  style={{ fontSize: '14px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="mb-1.5 block">Pace</label>
              <input
                value={pace}
                onChange={e => setPace(e.target.value)}
                placeholder="Slow / Moderate / Fast"
                className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-300"
                style={{ fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="mb-2 block">Interests</label>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map(interest => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`rounded-full border px-3 py-1.5 transition-all ${
                      interests.includes(interest)
                        ? 'border-sky-400 bg-sky-100 text-sky-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-sky-300'
                    }`}
                    style={{ fontSize: '12px', fontWeight: 600 }}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="mb-1.5 block">Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-sky-200 bg-white px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-300"
                style={{ fontSize: '14px' }}
              />
            </div>

            <button
              onClick={handleGenerateAiTrip}
              disabled={aiLoading}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-white transition-all hover:opacity-90 disabled:opacity-70"
              style={{ background: 'linear-gradient(135deg, #0EA5E9, #0D9488)', fontSize: '15px', fontWeight: 700 }}
            >
              {aiLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating AI draft...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate AI Draft
                </>
              )}
            </button>
          </div>

          <div>
            {!aiDraft && !aiLoading && (
              <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 p-10 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-teal-100">
                  <Sparkles className="h-7 w-7 text-sky-500" />
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#374151' }}>AI Draft Preview</h3>
                <p style={{ fontSize: '14px', color: '#9CA3AF', lineHeight: 1.6 }} className="mt-2 max-w-xs">
                  Fill in the form and generate an AI draft itinerary from the backend.
                </p>
              </div>
            )}

            {aiLoading && (
              <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-sky-200 bg-sky-50/50 p-10 text-center">
                <Loader2 className="mb-4 h-10 w-10 animate-spin text-sky-500" />
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#0369A1' }}>Generating draft...</p>
              </div>
            )}

            {aiDraft && (
              <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 p-5" style={{ background: 'linear-gradient(135deg, #F0F9FF, #F0FDFA)' }}>
                  <div className="mb-1 flex items-center gap-2">
                    <CheckBadge />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>AI Draft</span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{aiDraft.title}</h3>
                  <p style={{ fontSize: '13px', color: '#6B7280' }}>
                    {aiDraft.content.startDate} - {aiDraft.content.endDate} | {aiDraft.content.primaryDestination}
                  </p>
                  <p style={{ fontSize: '13px', color: '#0EA5E9', fontWeight: 700 }} className="mt-1">
                    {aiDraft.content.currency} {aiDraft.content.estimatedTotal.toLocaleString()}
                  </p>
                </div>

                <div className="max-h-96 space-y-4 overflow-y-auto p-5">
                  {aiDraft.content.days.map(day => (
                    <div key={day.dayNumber} className="rounded-2xl border border-gray-100 p-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>Day {day.dayNumber} - {day.date}</p>
                          {day.summary && <p style={{ fontSize: '12.5px', color: '#6B7280' }}>{day.summary}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleRegenerateDay(day.dayNumber)}
                          disabled={regeneratingDay === day.dayNumber}
                          className="rounded-lg border border-sky-200 px-3 py-1.5 hover:bg-sky-50 disabled:opacity-60"
                          style={{ fontSize: '11.5px', fontWeight: 700, color: '#0EA5E9' }}
                        >
                          {regeneratingDay === day.dayNumber ? 'Regenerating...' : 'Regenerate Day'}
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {day.activities.map((activity, index) => (
                          <div key={`${day.dayNumber}-${index}`} className="flex items-start gap-2">
                            <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-400" />
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{activity.startTime} - {activity.title}</p>
                              <p style={{ fontSize: '12px', color: '#6B7280' }}>{activity.location}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 p-5">
                  <button
                    type="button"
                    onClick={() => void handleSaveDraftAsTrip()}
                    disabled={aiSaving}
                    className="w-full rounded-xl py-3 text-white disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #0EA5E9, #0D9488)', fontSize: '13.5px', fontWeight: 700 }}
                  >
                    {aiSaving ? 'Saving...' : 'Save Draft As Trip'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CheckBadge() {
  return (
    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-green-100 text-green-700">
      <span style={{ fontSize: '10px', fontWeight: 800 }}>✓</span>
    </span>
  );
}
