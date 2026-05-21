import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { addDays, format, parseISO } from 'date-fns';
import {
  ArrowLeft, Plus, GripVertical, Edit3, Trash2, Clock, MapPin,
  Copy, DollarSign, ChevronDown, ChevronUp, Plane, Hotel, Utensils, Camera,
  Activity, Check, Share2, DollarSign as Budget
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import {
  createActivity,
  createDestination,
  deleteActivity as deleteActivityApi,
  deleteDestination,
  getActivityList,
  getDestinationList,
  getTripDetail,
  duplicateActivity as duplicateActivityApi,
  reorderActivities,
  updateTrip,
  updateActivity,
  updateDestination,
  type ActivityListResponse,
  type BudgetCategory,
  type TripStatus,
} from '../services/tripApi';

interface ActivityItem {
  id: string;
  title: string;
  location: string;
  description: string;
  time: string;
  duration: string;
  cost: number;
  type: 'transport' | 'accommodation' | 'food' | 'activity' | 'sightseeing';
  activityDate?: string;
  startTime?: string;
  durationMinutes?: number;
  estimatedCost?: number;
  notes?: string;
  category?: BudgetCategory;
}

interface DayPlan {
  id?: string;
  day: number;
  date: string;
  endDate?: string;
  city?: string;
  country?: string;
  notes?: string;
  activities: ActivityItem[];
}

interface TripDetails {
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  notes: string;
}

interface ActivitySelection {
  dayIdx: number;
  actIdx: number;
}

interface ActivityDraft {
  title: string;
  location: string;
  activityDate: string;
  startTime: string;
  durationMinutes: number;
  estimatedCost: number;
  notes: string;
}

const typeConfig = {
  transport: { icon: Plane, color: 'text-sky-500', bg: 'bg-sky-50', border: 'border-sky-200' },
  accommodation: { icon: Hotel, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' },
  food: { icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' },
  activity: { icon: Activity, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' },
  sightseeing: { icon: Camera, color: 'text-teal-500', bg: 'bg-teal-50', border: 'border-teal-200' },
};

function mapActivityTypeToBudgetCategory(type: ActivityItem['type']): BudgetCategory {
  if (type === 'transport') return 'TRANSPORT';
  if (type === 'accommodation') return 'ACCOMMODATION';
  if (type === 'food') return 'FOOD';
  return 'ACTIVITIES';
}

function mapBudgetCategoryToActivityType(category?: BudgetCategory): ActivityItem['type'] {
  if (category === 'TRANSPORT') return 'transport';
  if (category === 'ACCOMMODATION') return 'accommodation';
  if (category === 'FOOD') return 'food';
  return 'activity';
}

function normalizeNumericId(value: string | number) {
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : value;
}

const initialDays: DayPlan[] = [];

const formatPlannerDate = (date: string) => format(parseISO(date), 'EEEE, MMM d');

const parseDurationMinutes = (duration: string) => {
  const normalized = duration.trim().toLowerCase();

  if (!normalized) return 60;

  const mixedMatch = normalized.match(/(\d+(?:\.\d+)?)\s*h(?:\s*(\d+)\s*m)?/);
  if (mixedMatch) {
    const hours = Math.round(parseFloat(mixedMatch[1] || '0') * 60);
    const minutes = mixedMatch[2] ? parseInt(mixedMatch[2], 10) : 0;
    return hours + minutes;
  }

  const minuteMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)\b/);
  if (minuteMatch) {
    return Math.round(parseFloat(minuteMatch[1] || '0'));
  }

  const hourMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/);
  if (hourMatch) {
    return Math.round(parseFloat(hourMatch[1] || '0') * 60);
  }

  const numeric = Number(normalized);
  return Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric) : 60;
};

const formatDurationMinutes = (minutes: number) => {
  const safeMinutes = Math.max(0, Math.round(minutes));
  if (safeMinutes === 0) return '0 min';
  if (safeMinutes < 60) return `${safeMinutes} min`;

  const hours = Math.floor(safeMinutes / 60);
  const remainder = safeMinutes % 60;
  if (remainder === 0) {
    return `${hours} hr${hours === 1 ? '' : 's'}`;
  }

  return `${hours} hr ${remainder} min`;
};

const formatCost = (value: number) => value.toLocaleString('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const normalizeDays = (items: DayPlan[]) => {
  const sorted = [...items].sort((a, b) => {
    const diff = parseISO(a.date).getTime() - parseISO(b.date).getTime();
    if (diff !== 0) return diff;
    return a.day - b.day;
  });

  return sorted.map((item, index) => ({
    ...item,
    day: index + 1,
  }));
};

const isTemporaryActivityId = (id: string) => id.startsWith('new-');

const mapActivityResponseToItem = (activity: ActivityListResponse): ActivityItem => ({
  id: String(activity.id),
  title: activity.title,
  location: activity.location,
  description: activity.notes ?? '',
  time: activity.startTime,
  duration: formatDurationMinutes(activity.durationMinutes),
  cost: activity.estimatedCost,
  type: mapBudgetCategoryToActivityType(activity.category),
  activityDate: activity.activityDate,
  startTime: activity.startTime,
  durationMinutes: activity.durationMinutes,
  estimatedCost: activity.estimatedCost,
  notes: activity.notes ?? '',
  category: activity.category,
});

export default function TripPlannerPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { credentials } = useApp();

  const [days, setDays] = useState<DayPlan[]>(initialDays);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1, 2]));
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [tripTitle, setTripTitle] = useState('Trip Planner');
  const [tripDescription, setTripDescription] = useState('');
  const [tripStartDate, setTripStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [tripEndDate, setTripEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [tripCreatedWithAi, setTripCreatedWithAi] = useState(false);
  const [tripStatus, setTripStatus] = useState<TripStatus | null>(null);
  const [tripDetails, setTripDetails] = useState<TripDetails>(() => ({
    city: '',
    country: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  }));
  const [editingActivity, setEditingActivity] = useState<ActivitySelection | null>(null);
  const [activityDraft, setActivityDraft] = useState<ActivityDraft>({
    title: '',
    location: '',
    activityDate: '',
    startTime: '',
    durationMinutes: 60,
    estimatedCost: 0,
    notes: '',
  });
  const [draggedItem, setDraggedItem] = useState<{ dayIdx: number; actIdx: number } | null>(null);
  const [dragOverItem, setDragOverItem] = useState<{ dayIdx: number; actIdx: number } | null>(null);
  const routeTripId = id ?? null;

  useEffect(() => {
    let cancelled = false;

    const loadPlanner = async () => {
      if (!credentials) {
        if (!cancelled) {
          setLoadError('You need to log in first.');
          setTripStatus(null);
          setDays([]);
          setExpandedDays(new Set());
          setEditingDay(null);
          setEditingActivity(null);
          setIsLoading(false);
        }
        return;
      }

      if (!id) {
        if (!cancelled) {
          setLoadError('Trip ID is missing from route.');
          setTripStatus(null);
          setDays([]);
          setExpandedDays(new Set());
          setEditingDay(null);
          setEditingActivity(null);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setLoadError(null);
      try {
        const [tripResponse, destinationResponse] = await Promise.all([
          getTripDetail(id, credentials),
          getDestinationList(id, credentials, { size: 1000, sort: ['startDate,asc', 'createdAt,asc'] }),
        ]);

        if (cancelled) return;

        setTripTitle(tripResponse.title);
        setTripDescription(tripResponse.description ?? '');
        setTripStartDate(tripResponse.startDate);
        setTripEndDate(tripResponse.endDate);
        setTripCreatedWithAi(tripResponse.createdWithAi);
        setTripStatus(tripResponse.status);

        const routeTripId = id;
        const nextDays = await Promise.all(destinationResponse.content.map(async (destination, index) => {
          const nextDay: DayPlan = {
            id: String(destination.id),
            day: index + 1,
            date: destination.startDate,
            endDate: destination.endDate,
            city: destination.city,
            country: destination.country,
            notes: destination.notes ?? '',
            activities: [],
          };

          if (!destination.id) {
            return nextDay;
          }

          try {
            const activityResponse = await getActivityList(routeTripId, destination.id, credentials, {
              size: 1000,
              sort: ['activityDate,asc', 'displayOrder,asc'],
            });

            return {
              ...nextDay,
              activities: activityResponse.content.map(mapActivityResponseToItem),
            };
          } catch {
            return nextDay;
          }
        }));

        if (cancelled) return;

        setDays(nextDays);
        setExpandedDays(new Set(nextDays.slice(0, 2).map(dayItem => dayItem.day)));
        setEditingDay(null);
        setEditingActivity(null);
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Could not load trip planner.');
          setTripStatus(null);
          setDays([]);
          setExpandedDays(new Set());
          setEditingDay(null);
          setEditingActivity(null);
        }
      }
    };

    void loadPlanner().finally(() => {
      if (!cancelled) {
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [credentials, id, reloadToken]);

  const openDayEditor = (day: DayPlan) => {
    setEditingActivity(null);
    setEditingDay(day.day);
    setTripDetails({
      city: day.city ?? '',
      country: day.country ?? '',
      startDate: day.date,
      endDate: day.endDate ?? day.date,
      notes: day.notes ?? '',
    });
    setExpandedDays(prev => {
      const next = new Set(prev);
      next.add(day.day);
      return next;
    });
  };

  const toggleDay = (day: number) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const addActivity = (dayIdx: number) => {
    const day = days[dayIdx];
    if (!day) return;

    const dayDate = day.date || tripStartDate || format(new Date(), 'yyyy-MM-dd');
    const newActivity: ActivityItem = {
      id: `new-${Date.now()}`,
      title: 'New Activity',
      location: 'Location',
      description: 'Description of the activity',
      time: '10:00',
      duration: '1 hr',
      cost: 0,
      type: 'activity',
      activityDate: dayDate,
      startTime: '10:00',
      durationMinutes: 60,
      estimatedCost: 0,
      notes: 'Description of the activity',
      category: 'ACTIVITIES',
    };

    setDays(prev => {
      const next = [...prev];
      next[dayIdx] = { ...next[dayIdx], activities: [...next[dayIdx].activities, newActivity] };
      return next;
    });
    toast.success('Activity added!');
  };

  const deleteActivity = async (dayIdx: number, actIdx: number) => {
    const day = days[dayIdx];
    const activity = day?.activities[actIdx];
    if (!day || !activity) return;
    const authCredentials = credentials;

    try {
      if (authCredentials && routeTripId && day.id && !isTemporaryActivityId(String(activity.id))) {
        await deleteActivityApi(routeTripId, day.id, activity.id, authCredentials);
      }

      setDays(prev => {
        const next = [...prev];
        const acts = [...next[dayIdx].activities];
        acts.splice(actIdx, 1);
        next[dayIdx] = { ...next[dayIdx], activities: acts };
        return next;
      });
      setEditingActivity(null);
      toast.success('Activity removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete activity.');
    }
  };

  const openActivityEditor = (dayIdx: number, actIdx: number) => {
    const activity = days[dayIdx]?.activities[actIdx];
    if (!activity) return;

    setEditingDay(null);
    setExpandedDays(prev => {
      const next = new Set(prev);
      next.add(days[dayIdx]?.day ?? dayIdx + 1);
      return next;
    });
    setEditingActivity({ dayIdx, actIdx });
    setActivityDraft({
      title: activity.title,
      location: activity.location,
      activityDate: activity.activityDate ?? days[dayIdx]?.date ?? tripStartDate,
      startTime: activity.startTime ?? activity.time,
      durationMinutes: activity.durationMinutes ?? parseDurationMinutes(activity.duration),
      estimatedCost: activity.estimatedCost ?? activity.cost,
      notes: activity.notes ?? activity.description,
    });
  };

  const saveActivity = async () => {
    if (!editingActivity) return;

    const currentDay = days[editingActivity.dayIdx];
    const currentActivity = currentDay?.activities[editingActivity.actIdx];
    if (!currentDay || !currentActivity) return;

    const title = activityDraft.title.trim();
    const location = activityDraft.location.trim();
    const activityDate = activityDraft.activityDate.trim();
    const startTime = activityDraft.startTime.trim();
    const notes = activityDraft.notes.trim();
    const authCredentials = credentials;

    if (!title || !location || !activityDate || !startTime) {
      toast.error('Title, location, activity date and start time are required.');
      return;
    }

    const parsedDate = parseISO(activityDate);
    if (Number.isNaN(parsedDate.getTime())) {
      toast.error('Please enter a valid activity date.');
      return;
    }

    if (activityDraft.durationMinutes <= 0) {
      toast.error('Duration must be greater than 0.');
      return;
    }

    if (activityDraft.estimatedCost <= 0) {
      toast.error('Estimated cost must be greater than 0.');
      return;
    }

    if (!authCredentials || !routeTripId) {
      toast.error('Trip context is not available.');
      return;
    }

    if (!currentDay.id) {
      toast.error('Save the destination first before saving activities.');
      return;
    }

    const category = currentActivity.category ?? mapActivityTypeToBudgetCategory(currentActivity.type);
    const payload = {
      title,
      location,
      activityDate,
      startTime,
      durationMinutes: activityDraft.durationMinutes,
      estimatedCost: activityDraft.estimatedCost,
      notes: notes || undefined,
      category,
    };

    try {
      if (isTemporaryActivityId(String(currentActivity.id))) {
        let response;
        try {
          response = await createActivity(routeTripId, currentDay.id, payload, authCredentials);
        } catch (error) {
          const canRetry = error instanceof Error && /overlap/i.test(error.message);
          if (!canRetry || !window.confirm('This activity overlaps another one. Save anyway?')) {
            throw error;
          }
          response = await createActivity(
            routeTripId,
            currentDay.id,
            { ...payload, allowOverlap: true },
            authCredentials,
          );
        }

        const createdActivityId = response.id === null ? `new-${Date.now()}` : String(response.id);

        setDays(prev =>
          prev.map((day, dayIdx) => {
            if (dayIdx !== editingActivity.dayIdx) return day;

            const nextActivities = day.activities.map((activity, actIdx) => {
              if (actIdx !== editingActivity.actIdx) return activity;

              return {
                ...activity,
                id: createdActivityId,
                title,
                location,
                activityDate,
                startTime,
                durationMinutes: activityDraft.durationMinutes,
                estimatedCost: activityDraft.estimatedCost,
                notes,
                category,
                time: startTime,
                duration: formatDurationMinutes(activityDraft.durationMinutes),
                cost: activityDraft.estimatedCost,
                description: notes,
              };
            });

            return { ...day, activities: nextActivities };
          })
        );

        toast.success(response.message || 'Activity created successfully!');
      } else {
        try {
          await updateActivity(routeTripId, currentDay.id, currentActivity.id, payload, authCredentials);
        } catch (error) {
          const canRetry = error instanceof Error && /overlap/i.test(error.message);
          if (!canRetry || !window.confirm('This activity overlaps another one. Save anyway?')) {
            throw error;
          }
          await updateActivity(
            routeTripId,
            currentDay.id,
            currentActivity.id,
            { ...payload, allowOverlap: true },
            authCredentials,
          );
        }

        setDays(prev =>
          prev.map((day, dayIdx) => {
            if (dayIdx !== editingActivity.dayIdx) return day;

            const nextActivities = day.activities.map((activity, actIdx) => {
              if (actIdx !== editingActivity.actIdx) return activity;

              return {
                ...activity,
                title,
                location,
                activityDate,
                startTime,
                durationMinutes: activityDraft.durationMinutes,
                estimatedCost: activityDraft.estimatedCost,
                notes,
                category,
                time: startTime,
                duration: formatDurationMinutes(activityDraft.durationMinutes),
                cost: activityDraft.estimatedCost,
                description: notes,
              };
            });

            return { ...day, activities: nextActivities };
          })
        );

        toast.success('Activity updated successfully!');
      }

      setEditingActivity(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save activity.');
    }
  };

  const handleDragStart = (dayIdx: number, actIdx: number) => {
    setDraggedItem({ dayIdx, actIdx });
  };

  const handleDragOver = (e: React.DragEvent, dayIdx: number, actIdx: number) => {
    e.preventDefault();
    setDragOverItem({ dayIdx, actIdx });
  };

  const handleDrop = (e: React.DragEvent, toDayIdx: number, toActIdx: number) => {
    e.preventDefault();
    if (!draggedItem) return;
    const { dayIdx: fromDay, actIdx: fromAct } = draggedItem;
    if (fromDay === toDayIdx && fromAct === toActIdx) return;

    if (fromDay !== toDayIdx) {
      setDraggedItem(null);
      setDragOverItem(null);
      toast.error('Move across destinations is not supported.');
      return;
    }

    const nextDays = JSON.parse(JSON.stringify(days)) as DayPlan[];
    const [moved] = nextDays[fromDay].activities.splice(fromAct, 1);
    nextDays[toDayIdx].activities.splice(toActIdx, 0, moved);

    setDays(nextDays);
    setDraggedItem(null);
    setDragOverItem(null);
    toast.success('Activity moved!');

    const reorderedDay = nextDays[toDayIdx];
    if (
      credentials
      && routeTripId
      && reorderedDay?.id
      && fromDay === toDayIdx
      && !reorderedDay.activities.some(activity => isTemporaryActivityId(String(activity.id)))
    ) {
      const orderedActivityIds = reorderedDay.activities.map(activity => normalizeNumericId(activity.id));
      void reorderActivities(routeTripId, reorderedDay.id, { orderedActivityIds }, credentials)
        .catch(error => {
          toast.error(error instanceof Error ? error.message : 'Could not persist activity order.');
        });
    }
  };

  const duplicateActivity = async (dayIdx: number, actIdx: number) => {
    const day = days[dayIdx];
    const activity = day?.activities[actIdx];
    if (!day || !activity) return;

    if (credentials && routeTripId && day.id && !isTemporaryActivityId(String(activity.id))) {
      try {
        try {
          await duplicateActivityApi(routeTripId, day.id, activity.id, undefined, credentials);
        } catch (error) {
          const canRetry = error instanceof Error && /overlap/i.test(error.message);
          if (!canRetry || !window.confirm('Duplicated activity overlaps existing schedule. Duplicate anyway?')) {
            throw error;
          }
          await duplicateActivityApi(
            routeTripId,
            day.id,
            activity.id,
            { allowOverlap: true },
            credentials,
          );
        }

        const refreshedActivities = await getActivityList(routeTripId, day.id, credentials, {
          size: 1000,
          sort: ['activityDate,asc', 'displayOrder,asc'],
        });

        setDays(prev => prev.map((item, index) => (
          index === dayIdx
            ? { ...item, activities: refreshedActivities.content.map(mapActivityResponseToItem) }
            : item
        )));
        toast.success('Activity duplicated successfully.');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to duplicate activity.');
      }
      return;
    }

    const copy: ActivityItem = {
      ...activity,
      id: `new-${Date.now()}`,
      title: `${activity.title} (copy)`,
    };

    setDays(prev => {
      const next = [...prev];
      const nextActivities = [...next[dayIdx].activities];
      nextActivities.splice(actIdx + 1, 0, copy);
      next[dayIdx] = { ...next[dayIdx], activities: nextActivities };
      return next;
    });
    toast.success('Activity duplicated.');
  };

  const handleSaveTripDetails = async () => {
    if (editingDay === null) return;

    const currentDay = days.find(day => day.day === editingDay);
    if (!currentDay) return;

    const city = tripDetails.city.trim();
    const country = tripDetails.country.trim();
    const startDate = tripDetails.startDate.trim();
    const endDate = tripDetails.endDate.trim();
    const notes = tripDetails.notes.trim();

    if (!city || !country || !startDate || !endDate) {
      toast.error('City, country, start date and end date are required.');
      return;
    }

    if (city.length < 2 || city.length > 125) {
      toast.error('City must be between 2 and 125 characters.');
      return;
    }

    if (country.length < 2 || country.length > 125) {
      toast.error('Country must be between 2 and 125 characters.');
      return;
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.error('Please enter valid dates.');
      return;
    }

    if (end < start) {
      toast.error('End date must be after start date.');
      return;
    }

    const previousStart = parseISO(currentDay.date);
    const deltaDays = Math.round((start.getTime() - previousStart.getTime()) / 86400000);
    const isNewDestination = !currentDay.id;
    const nextActivities = currentDay.activities.map(activity => ({
      ...activity,
      activityDate: format(addDays(parseISO(activity.activityDate ?? currentDay.date), deltaDays), 'yyyy-MM-dd'),
    }));

    try {
      if (!credentials || !routeTripId) {
        toast.error('Trip context is not available.');
        return;
      }

      if (currentDay.id) {
        await updateDestination(routeTripId, currentDay.id, {
          city,
          country,
          startDate,
          endDate,
          notes: notes || undefined,
        }, credentials);
      } else {
        const response = await createDestination(routeTripId, {
          city,
          country,
          startDate,
          endDate,
          notes: notes || undefined,
        }, credentials);

        const createdDestinationId = String(response.destinationId);
        setDays(prev => prev.map(day => (
          day.day === editingDay
            ? { ...day, id: createdDestinationId }
            : day
        )));
      }

      setDays(prev => {
        const next = prev.map(day => {
          if (day.day !== editingDay) return day;

          return {
            ...day,
            date: startDate,
            endDate,
            city,
            country,
            notes,
            activities: nextActivities,
          };
        });

        return normalizeDays(next);
      });

      if (credentials && currentDay.id && deltaDays !== 0) {
        const activityUpdates = nextActivities
          .filter(activity => !isTemporaryActivityId(String(activity.id)))
          .map(activity => updateActivity(routeTripId, currentDay.id!, activity.id, {
            activityDate: activity.activityDate,
          }, credentials));

        await Promise.allSettled(activityUpdates);
      }

      setTripDetails({
        city,
        country,
        startDate,
        endDate,
        notes,
      });

      setEditingDay(null);
      toast.success(isNewDestination ? 'Destination created!' : 'Destination updated!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save destination.');
    }
  };

  const deleteDay = async (dayNumber: number) => {
    const dayToDelete = days.find(day => day.day === dayNumber);
    if (!dayToDelete) return;

    try {
      if (credentials && routeTripId && dayToDelete.id) {
        await deleteDestination(routeTripId, dayToDelete.id, credentials);
      }

      const remainingDays = days.filter(day => day.day !== dayNumber);
      const nextDays = normalizeDays(remainingDays);
      const nextExpandedDays = new Set<number>(nextDays.slice(0, 2).map(day => day.day));

      setDays(nextDays);
      setExpandedDays(nextExpandedDays);

      if (editingDay !== null && editingDay === dayNumber) {
        setEditingDay(null);
      } else if (editingDay !== null && editingDay > dayNumber) {
        setEditingDay(editingDay - 1);
      }

      setEditingActivity(null);
      toast.success('Destination deleted!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete destination.');
    }
  };

  const handleSavePlan = async () => {
    if (!credentials || !routeTripId) {
      toast.error('Trip context is not available.');
      return;
    }

    if (editingDay !== null || editingActivity !== null) {
      toast.error('Save current destination/activity edits first.');
      return;
    }

    try {
      await updateTrip(routeTripId, {
        title: tripTitle,
        description: tripDescription || undefined,
        startDate: tripStartDate,
        endDate: tripEndDate,
      }, credentials);
      toast.success('Plan saved.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save plan.');
    }
  };

  const totalCost = days.flatMap(d => d.activities).reduce((sum, a) => sum + (a.estimatedCost ?? a.cost), 0);
  const totalActivities = days.flatMap(d => d.activities).length;
  const canNavigateTripActions = Boolean(routeTripId);
  const canPublishTrip = canNavigateTripActions && tripStatus === 'DRAFT';

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white px-6 py-8 shadow-sm">
          <div className="w-10 h-10 rounded-full border-4 border-sky-100 border-t-sky-500 animate-spin" />
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Loading planner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/app/trips')} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0">
              <ArrowLeft className="w-4.5 h-4.5 text-gray-500" />
            </button>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px' }}>{tripTitle}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <span style={{ fontSize: '13px', color: '#6B7280' }}>
                  {formatPlannerDate(tripStartDate)} - {formatPlannerDate(tripEndDate)}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-700" style={{ fontSize: '11px', fontWeight: 700 }}>
                  {tripCreatedWithAi ? 'AI trip' : 'Manual trip'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-700" style={{ fontSize: '11px', fontWeight: 700 }}>
                  {days.length} destinations
                </span>
              </div>
              {tripDescription && (
                <p style={{ fontSize: '13.5px', color: '#6B7280' }} className="mt-1 max-w-2xl">{tripDescription}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => routeTripId && navigate(`/app/trips/${routeTripId}/budget`)}
              disabled={!canNavigateTripActions}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:border-sky-300 hover:bg-sky-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontSize: '13px', fontWeight: 600, color: '#0EA5E9' }}
            >
              <Budget className="w-3.5 h-3.5" /> Budget
            </button>
            {canPublishTrip && (
              <button
                onClick={() => routeTripId && navigate(`/app/trips/${routeTripId}/publish`)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white"
                style={{ background: 'linear-gradient(135deg, #0EA5E9, #0D9488)', fontSize: '13px', fontWeight: 600 }}
              >
                <Share2 className="w-3.5 h-3.5" /> Publish
              </button>
            )}
          </div>
        </div>

        {loadError && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
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

        {/* Destinations */}
        <div className="space-y-4">
          {days.map((day, dayIdx) => {
            const isExpanded = expandedDays.has(day.day);
            const dayTotal = day.activities.reduce((s, a) => s + (a.estimatedCost ?? a.cost), 0);
            const dateLabel = day.endDate && day.endDate !== day.date
              ? `${formatPlannerDate(day.date)} - ${formatPlannerDate(day.endDate)}`
              : formatPlannerDate(day.date);

            return (
              <div key={day.day} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Destination Header */}
                <div
                  onClick={() => toggleDay(day.day)}
                  className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                      <span style={{ fontSize: '12px', fontWeight: 800, color: 'white' }}>{day.day}</span>
                    </div>
                    <div className="text-left">
                      <p style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>Destination {day.day}</p>
                      <p style={{ fontSize: '12.5px', color: '#9CA3AF' }}>
                        {day.city && day.country ? `${day.city}, ${day.country}` : 'Destination details'} - {dateLabel} - {day.activities.length} activities
                      </p>
                      {day.notes && (
                        <p style={{ fontSize: '12.5px', color: '#6B7280' }} className="mt-1">{day.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        openDayEditor(day);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 hover:border-sky-300 hover:bg-sky-50 transition-colors"
                      style={{ fontSize: '11px', fontWeight: 600, color: '#0EA5E9' }}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        deleteDay(day.day);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 hover:border-red-300 hover:bg-red-50 transition-colors"
                      style={{ fontSize: '11px', fontWeight: 600, color: '#DC2626' }}
                      aria-label={`Delete destination ${day.day}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0EA5E9' }}>${formatCost(dayTotal)}</span>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        toggleDay(day.day);
                      }}
                      className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
                      aria-label={isExpanded ? 'Collapse day' : 'Expand day'}
                    >
                      {isExpanded ? <ChevronUp className="w-4.5 h-4.5 text-gray-400" /> : <ChevronDown className="w-4.5 h-4.5 text-gray-400" />}
                    </button>
                  </div>
                </div>

                {editingDay === day.day && (
                  <div className="border-t border-gray-100 bg-gray-50/60 p-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">Start Date</label>
                        <input
                          type="date"
                          value={tripDetails.startDate}
                          onChange={e => setTripDetails(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all"
                          style={{ fontSize: '14px' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">City</label>
                        <input
                          value={tripDetails.city}
                          onChange={e => setTripDetails(prev => ({ ...prev, city: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all"
                          style={{ fontSize: '14px' }}
                          placeholder="City"
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">Country</label>
                        <input
                          value={tripDetails.country}
                          onChange={e => setTripDetails(prev => ({ ...prev, country: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all"
                          style={{ fontSize: '14px' }}
                          placeholder="Country"
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">End Date</label>
                        <input
                          type="date"
                          value={tripDetails.endDate}
                          onChange={e => setTripDetails(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all"
                          style={{ fontSize: '14px' }}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">Notes</label>
                        <textarea
                          value={tripDetails.notes}
                          onChange={e => setTripDetails(prev => ({ ...prev, notes: e.target.value }))}
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all resize-none"
                          style={{ fontSize: '14px' }}
                          placeholder="Notes for this destination"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingDay(null)}
                        className="px-4 py-2 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                        style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280' }}
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveTripDetails}
                        className="px-4 py-2 rounded-xl text-white transition-all"
                        style={{ background: 'linear-gradient(135deg, #0EA5E9, #0D9488)', fontSize: '13px', fontWeight: 700 }}
                      >
                        Save destination
                      </button>
                    </div>
                  </div>
                )}

                {/* Activities */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    <div className="p-4 space-y-2">
                      {day.activities.map((activity, actIdx) => {
                        const tc = typeConfig[activity.type];
                        const Icon = tc.icon;
                        const isDragging = draggedItem?.dayIdx === dayIdx && draggedItem?.actIdx === actIdx;
                        const isDragOver = dragOverItem?.dayIdx === dayIdx && dragOverItem?.actIdx === actIdx;
                        const isEditingActivity = editingActivity?.dayIdx === dayIdx && editingActivity?.actIdx === actIdx;
                        const activityDate = activity.activityDate ?? day.date;
                        const activityTime = activity.startTime ?? activity.time;
                        const durationMinutes = activity.durationMinutes ?? parseDurationMinutes(activity.duration);
                        const estimatedCost = activity.estimatedCost ?? activity.cost;
                        const notes = activity.notes ?? activity.description;

                        return (
                          <div key={activity.id} className="space-y-2">
                            <div
                              draggable
                              onDragStart={() => handleDragStart(dayIdx, actIdx)}
                              onDragOver={e => handleDragOver(e, dayIdx, actIdx)}
                              onDrop={e => handleDrop(e, dayIdx, actIdx)}
                              onDragEnd={() => { setDraggedItem(null); setDragOverItem(null); }}
                              className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all group ${
                                isDragging ? 'opacity-40 scale-95' : ''
                              } ${isDragOver ? 'border-sky-400 bg-sky-50' : `border ${tc.border} ${tc.bg}`}`}
                            >
                              {/* Drag handle */}
                              <div className="flex items-center mt-1 cursor-grab active:cursor-grabbing">
                                <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                              </div>

                              {/* Icon */}
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white border ${tc.border}`}>
                                <Icon className={`w-4 h-4 ${tc.color}`} />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{activity.title}</span>
                                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white" style={{ fontSize: '11px', color: '#9CA3AF' }}>
                                        <Clock className="w-3 h-3" />{activityTime}
                                      </span>
                                      <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{formatPlannerDate(activityDate)}</span>
                                      <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{formatDurationMinutes(durationMinutes)}</span>
                                    </div>
                                    <p style={{ fontSize: '12.5px', color: '#6B7280' }} className="mt-0.5">{notes}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                      <MapPin className="w-3 h-3 text-gray-400" />
                                      <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{activity.location}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2 flex-shrink-0">
                                    {estimatedCost > 0 && (
                                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0EA5E9' }}>${formatCost(estimatedCost)}</span>
                                    )}
                                    {estimatedCost === 0 && (
                                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-600" style={{ fontSize: '10px', fontWeight: 700 }}>Free</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    duplicateActivity(dayIdx, actIdx);
                                  }}
                                  className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center transition-colors"
                                  title="Duplicate"
                                >
                                  <Copy className="w-3.5 h-3.5 text-gray-400 hover:text-sky-500" />
                                </button>
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    openActivityEditor(dayIdx, actIdx);
                                  }}
                                  className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center transition-colors"
                                  title="Edit"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-gray-400 hover:text-teal-500" />
                                </button>
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    deleteActivity(dayIdx, actIdx);
                                  }}
                                  className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                                </button>
                              </div>
                            </div>

                            {isEditingActivity && (
                              <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 md:ml-11">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                  <div>
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">Title</label>
                                    <input
                                      value={activityDraft.title}
                                      onChange={e => setActivityDraft(prev => ({ ...prev, title: e.target.value }))}
                                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all"
                                      style={{ fontSize: '14px' }}
                                      placeholder="Title"
                                    />
                                  </div>

                                  <div>
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">Location</label>
                                    <input
                                      value={activityDraft.location}
                                      onChange={e => setActivityDraft(prev => ({ ...prev, location: e.target.value }))}
                                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all"
                                      style={{ fontSize: '14px' }}
                                      placeholder="Location"
                                    />
                                  </div>

                                  <div>
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">Activity Date</label>
                                    <input
                                      type="date"
                                      value={activityDraft.activityDate}
                                      onChange={e => setActivityDraft(prev => ({ ...prev, activityDate: e.target.value }))}
                                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all"
                                      style={{ fontSize: '14px' }}
                                    />
                                  </div>

                                  <div>
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">Start Time</label>
                                    <input
                                      type="time"
                                      value={activityDraft.startTime}
                                      onChange={e => setActivityDraft(prev => ({ ...prev, startTime: e.target.value }))}
                                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all"
                                      style={{ fontSize: '14px' }}
                                    />
                                  </div>

                                  <div>
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">Duration Minutes</label>
                                    <input
                                      type="number"
                                      min="1"
                                      step="1"
                                      value={activityDraft.durationMinutes}
                                      onChange={e => setActivityDraft(prev => ({ ...prev, durationMinutes: Math.max(0, Number(e.target.value) || 0) }))}
                                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all"
                                      style={{ fontSize: '14px' }}
                                      placeholder="60"
                                    />
                                  </div>

                                  <div>
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">Estimated Cost</label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={activityDraft.estimatedCost}
                                      onChange={e => setActivityDraft(prev => ({ ...prev, estimatedCost: Math.max(0, Number(e.target.value) || 0) }))}
                                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all"
                                      style={{ fontSize: '14px' }}
                                      placeholder="0"
                                    />
                                  </div>

                                  <div className="md:col-span-2">
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">Notes</label>
                                    <textarea
                                      value={activityDraft.notes}
                                      onChange={e => setActivityDraft(prev => ({ ...prev, notes: e.target.value }))}
                                      rows={3}
                                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all resize-none"
                                      style={{ fontSize: '14px' }}
                                      placeholder="Notes for this destination"
                                    />
                                  </div>
                                </div>

                                <div className="mt-4 flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingActivity(null)}
                                    className="px-4 py-2 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                                    style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280' }}
                                  >
                                    Close
                                  </button>
                                  <button
                                    type="button"
                                    onClick={saveActivity}
                                    className="px-4 py-2 rounded-xl text-white transition-all"
                                    style={{ background: 'linear-gradient(135deg, #0EA5E9, #0D9488)', fontSize: '13px', fontWeight: 700 }}
                                  >
                                    Save activity
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Add activity button */}
                    <div className="px-4 pb-4">
                      <button
                        onClick={() => addActivity(dayIdx)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 hover:border-sky-300 hover:bg-sky-50/50 transition-all"
                        style={{ fontSize: '13px', fontWeight: 600, color: '#9CA3AF' }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Activity
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add Destination */}
          <button
            onClick={() => {
              const lastDay = days[days.length - 1];
              const nextDate = lastDay
                ? format(addDays(parseISO(lastDay.endDate ?? lastDay.date), 1), 'yyyy-MM-dd')
                : tripStartDate;
              const newDay: DayPlan = {
                day: days.length + 1,
                date: nextDate,
                endDate: nextDate,
                city: '',
                country: '',
                notes: '',
                activities: [],
              };
              setDays(prev => [...prev, newDay]);
              setExpandedDays(prev => new Set(prev).add(newDay.day));
              setEditingActivity(null);
              setEditingDay(newDay.day);
              setTripDetails({
                city: '',
                country: '',
                startDate: nextDate,
                endDate: nextDate,
                notes: '',
              });
              toast.success('New destination added!');
            }}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-sky-300 hover:bg-sky-50/50 transition-all"
            style={{ fontSize: '14px', fontWeight: 600, color: '#9CA3AF' }}
          >
            <Plus className="w-4 h-4" />
            Add Destination
          </button>
        </div>
      </div>

      {/* Right Sidebar Summary */}
      <div className="hidden xl:flex flex-col w-64 border-l border-gray-100 bg-white p-5 space-y-5">
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>Trip Summary</h3>

        {/* Stats */}
        <div className="space-y-3">
          {[
            { label: 'Destinations', value: days.length, icon: 'D' },
            { label: 'Activities', value: totalActivities, icon: 'A' },
            { label: 'Est. Cost', value: `$${formatCost(totalCost)}`, icon: '$' },
          ].map(stat => (
            <div key={stat.label} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '16px' }}>{stat.icon}</span>
                <span style={{ fontSize: '13px', color: '#6B7280' }}>{stat.label}</span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Activity types breakdown */}
        <div>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="mb-2">By Type</p>
          <div className="space-y-2">
            {Object.entries(typeConfig).map(([type, config]) => {
              const count = days.flatMap(d => d.activities).filter(a => a.type === type).length;
              if (count === 0) return null;
              const Icon = config.icon;
              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${config.bg}`}>
                      <Icon className={`w-3 h-3 ${config.color}`} />
                    </div>
                    <span style={{ fontSize: '12.5px', color: '#6B7280', textTransform: 'capitalize' }}>{type}</span>
                  </div>
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#374151' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <button onClick={() => void handleSavePlan()} className="w-full py-2.5 rounded-xl border border-gray-200 hover:border-sky-300 hover:bg-sky-50 transition-all flex items-center justify-center gap-2" style={{ fontSize: '13px', fontWeight: 600, color: '#0EA5E9' }}>
            <Check className="w-3.5 h-3.5" /> Save Plan
          </button>
          {canPublishTrip && (
            <button
              onClick={() => routeTripId && navigate(`/app/trips/${routeTripId}/publish`)}
              className="w-full py-2.5 rounded-xl text-white flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #0EA5E9, #0D9488)', fontSize: '13px', fontWeight: 600 }}
            >
              <Share2 className="w-3.5 h-3.5" /> Publish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
