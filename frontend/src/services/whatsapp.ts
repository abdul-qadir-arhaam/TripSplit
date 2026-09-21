import { formatTripDateRange } from '../utils/dates';

export interface TripInviteData {
  id: string;
  name: string;
  destination: string;
  start_date?: string | null;
  end_date?: string | null;
  budget?: string | number | null;
  currency?: string;
  trip_type?: string;
}

/**
 * Generates formatted WhatsApp invitation text for a trip.
 * Strictly adheres to client-side deep linking without direct scraping or WhatsApp bot APIs.
 */
export function generateTripInviteText(trip: TripInviteData, inviterName?: string): string {
  const origin = window.location.origin;
  const joinUrl = `${origin}/join/${trip.id}`;
  const dates = formatTripDateRange(trip.start_date, trip.end_date);
  const inviterGreeting = inviterName ? `*${inviterName}* has invited you` : "You're invited";

  const currencySymbol = trip.currency === 'INR' ? '₹' : (trip.currency || '₹');
  const budgetLine = trip.budget 
    ? `💰 *Target Budget:* ${currencySymbol}${Number(trip.budget).toLocaleString()}\n` 
    : '';

  return (
    `✈️ *Trip Invitation: ${trip.name}*\n\n` +
    `Hey! ${inviterGreeting} to join the upcoming trip:\n\n` +
    `📍 *Destination:* ${trip.destination}\n` +
    `📅 *Dates:* ${dates}\n` +
    budgetLine +
    `🏷️ *Type:* ${trip.trip_type || 'Vacation'}\n\n` +
    `👉 *Join the trip here to track expenses & settle balances:*\n` +
    `${joinUrl}\n\n` +
    `_Powered by Trip Finance_`
  );
}

/**
 * Returns the universal WhatsApp sharing URL.
 * Supported across desktop WhatsApp Web, Windows app, iOS, and Android.
 */
export function getWhatsAppShareUrl(text: string): string {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}

/**
 * Safely opens WhatsApp sharing in a new window/tab.
 */
export function openWhatsApp(text: string): void {
  const url = getWhatsAppShareUrl(text);
  window.open(url, '_blank', 'noopener,noreferrer');
}
