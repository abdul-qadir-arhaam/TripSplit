/**
 * Date utilities for Trip Finance
 */

export function toISODateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function getTripDurationDays(startDate?: string | null, endDate?: string | null): number | null {
  if (!startDate || !endDate) return null;
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : null;
  } catch {
    return null;
  }
}

export function formatTripDateRange(startDate?: string | null, endDate?: string | null): string {
  if (!startDate && !endDate) return 'Dates TBD';
  if (startDate && !endDate) return `Starts ${formatDate(startDate)}`;
  if (!startDate && endDate) return `Ends ${formatDate(endDate)}`;

  const days = getTripDurationDays(startDate, endDate);
  const formattedStart = formatDate(startDate);
  const formattedEnd = formatDate(endDate);

  if (startDate === endDate) {
    return `${formattedStart} (1 day)`;
  }

  const durationText = days ? ` (${days} days)` : '';
  return `${formattedStart} – ${formattedEnd}${durationText}`;
}

export function getTripTimeStatus(startDate?: string | null, endDate?: string | null): {
  label: string;
  variant: 'default' | 'brand' | 'success' | 'warning';
} | null {
  if (!startDate) return null;

  const todayStr = toISODateString(new Date());
  const today = new Date(todayStr).getTime();
  const start = new Date(startDate).getTime();
  const end = endDate ? new Date(endDate).getTime() : start;

  if (today < start) {
    const daysUntil = Math.ceil((start - today) / (1000 * 60 * 60 * 24));
    if (daysUntil === 1) {
      return { label: 'Starts tomorrow', variant: 'brand' };
    }
    return { label: `Starts in ${daysUntil} days`, variant: 'brand' };
  } else if (today >= start && today <= end) {
    return { label: 'Ongoing trip', variant: 'success' };
  } else {
    return { label: 'Past trip', variant: 'default' };
  }
}

export function getPresetDates(preset: 'weekend' | 'nextWeek' | 'nextMonth'): { startDate: string; endDate: string } {
  const today = new Date();
  
  if (preset === 'weekend') {
    // Coming Friday to Sunday
    const dayOfWeek = today.getDay(); // 0 is Sun, 5 is Fri, 6 is Sat
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    const friday = new Date(today);
    friday.setDate(today.getDate() + daysUntilFriday);

    const sunday = new Date(friday);
    sunday.setDate(friday.getDate() + 2);

    return {
      startDate: toISODateString(friday),
      endDate: toISODateString(sunday),
    };
  }

  if (preset === 'nextWeek') {
    // Next Monday for 7 days
    const dayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon
    const daysUntilMonday = (1 - dayOfWeek + 7) % 7 || 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysUntilMonday);

    const nextSunday = new Date(monday);
    nextSunday.setDate(monday.getDate() + 6);

    return {
      startDate: toISODateString(monday),
      endDate: toISODateString(nextSunday),
    };
  }

  if (preset === 'nextMonth') {
    // Exactly 30 days from now, for 4 days
    const start = new Date(today);
    start.setDate(today.getDate() + 30);

    const end = new Date(start);
    end.setDate(start.getDate() + 3);

    return {
      startDate: toISODateString(start),
      endDate: toISODateString(end),
    };
  }

  return { startDate: '', endDate: '' };
}
