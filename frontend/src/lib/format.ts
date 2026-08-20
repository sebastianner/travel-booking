export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(iso));
}

export function formatDateLong(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(
    new Date(iso),
  );
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(
    new Date(iso),
  );
}

export function formatDateRange(departureIso: string, returnIso: string): string {
  const departure = new Date(departureIso);
  const ret = new Date(returnIso);
  const sameMonth = departure.getMonth() === ret.getMonth();
  const start = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(departure);
  const end = sameMonth
    ? new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(ret)
    : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(ret);
  return `${start} - ${end}`;
}

export function formatStops(stops: number): string {
  if (stops <= 0) return 'Direct';
  return stops === 1 ? '1 stopover' : `${stops} stopovers`;
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 min ago';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
}
