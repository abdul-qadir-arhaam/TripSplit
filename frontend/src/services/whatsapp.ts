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
export function generateTripInviteText(trip: TripInviteData, inviterName?: string, inviteTokenOrUrl?: string): string {
  const origin = window.location.origin;
  const joinUrl = inviteTokenOrUrl 
    ? (inviteTokenOrUrl.startsWith('http') ? inviteTokenOrUrl : `${origin}/join/${inviteTokenOrUrl}`)
    : `${origin}/join/${trip.id}`;
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

/**
 * Generates formatted WhatsApp expense breakdown message (PRD Section 13).
 */
export function generateExpenseShareText(
  tripName: string,
  tripId: string,
  expense: {
    title: string;
    amount: string | number;
    currency: string;
    paid_by_name: string;
    category: string;
    location_name?: string | null;
    notes?: string | null;
    splits?: Array<{ member_display_name: string; amount: string | number }>;
  }
): string {
  const origin = window.location.origin;
  const tripUrl = `${origin}/trips/${tripId}`;
  const sym = expense.currency === 'INR' ? '₹' : expense.currency;

  let splitsBlock = '';
  if (expense.splits && expense.splits.length > 0) {
    splitsBlock = '\n👥 *Participants:*\n' +
      expense.splits.map(s => `• ${s.member_display_name}: ${sym}${Number(s.amount).toLocaleString()}`).join('\n') + '\n';
  }

  const locationBlock = expense.location_name ? `📍 *Location:* ${expense.location_name}\n` : '';
  const notesBlock = expense.notes ? `📝 *Notes:* ${expense.notes}\n` : '';

  return (
    `🧾 *Trip Expense: ${tripName}*\n\n` +
    `📌 *Expense:* ${expense.title} (${expense.category})\n` +
    `💰 *Amount:* ${sym}${Number(expense.amount).toLocaleString()}\n` +
    `💳 *Paid by:* ${expense.paid_by_name}\n` +
    splitsBlock +
    locationBlock +
    notesBlock +
    `\n👉 *View expense on Trip Finance:*\n${tripUrl}`
  );
}

/**
 * Generates formatted WhatsApp settlement recommendation message.
 */
export function generateSettlementShareText(
  tripName: string,
  tripId: string,
  suggestion: {
    from_member_name: string;
    to_member_name: string;
    amount: string | number;
  },
  currency: string = 'INR'
): string {
  const origin = window.location.origin;
  const tripUrl = `${origin}/trips/${tripId}`;
  const sym = currency === 'INR' ? '₹' : currency;

  return (
    `💸 *Settlement Reminder: ${tripName}*\n\n` +
    `Hey *${suggestion.from_member_name}*, you owe *${suggestion.to_member_name}*:\n` +
    `👉 *${sym}${Number(suggestion.amount).toLocaleString()}*\n\n` +
    `Please settle this and mark it on Trip Finance:\n` +
    `${tripUrl}`
  );
}

/**
 * Generates formatted WhatsApp complete trip settlement summary sheet.
 */
export function generateTripSettlementSheetText(
  tripName: string,
  tripId: string,
  suggestions: Array<{
    from_member_name: string;
    to_member_name: string;
    amount: string | number;
  }>,
  currency: string = 'INR'
): string {
  const origin = window.location.origin;
  const tripUrl = `${origin}/trips/${tripId}`;
  const sym = currency === 'INR' ? '₹' : currency;

  if (suggestions.length === 0) {
    return (
      `🎉 *All Balances Settled: ${tripName}*\n\n` +
      `Great news everyone! All trip expenses are balanced and there are zero outstanding debts.\n\n` +
      `${tripUrl}`
    );
  }

  const items = suggestions.map((s, i) => `${i + 1}. *${s.from_member_name}* ➔ *${s.to_member_name}*: ${sym}${Number(s.amount).toLocaleString()}`).join('\n');

  return (
    `⚖️ *Final Settlement Sheet: ${tripName}*\n\n` +
    `Here are the calculated minimized payments to settle all trip debts:\n\n` +
    items + '\n\n' +
    `👉 *View complete balances:*\n${tripUrl}`
  );
}

/**
 * Generates formatted WhatsApp confirmation receipt for a recorded settlement payment.
 */
export function generateSettlementReceiptText(
  tripName: string,
  tripId: string,
  settlement: {
    from_member_name: string;
    to_member_name: string;
    amount: string | number;
    currency?: string;
    payment_method?: string | null;
    payment_date?: string | null;
    notes?: string | null;
  }
): string {
  const origin = window.location.origin;
  const tripUrl = `${origin}/trips/${tripId}`;
  const sym = settlement.currency === 'INR' ? '₹' : (settlement.currency || '₹');
  const methodStr = settlement.payment_method ? `💳 *Method:* ${settlement.payment_method}\n` : '';
  const dateStr = settlement.payment_date 
    ? `📅 *Date:* ${new Date(settlement.payment_date).toLocaleDateString()}\n` 
    : '';
  const notesStr = settlement.notes ? `📝 *Note:* ${settlement.notes}\n` : '';

  return (
    `✅ *Payment Recorded: ${tripName}*\n\n` +
    `*${settlement.from_member_name}* paid *${settlement.to_member_name}*:\n` +
    `👉 *${sym}${Number(settlement.amount).toLocaleString()}*\n\n` +
    methodStr +
    dateStr +
    notesStr +
    `\nLedger balances have been updated accordingly.\n` +
    `🔗 *View Balances:* ${tripUrl}`
  );
}
