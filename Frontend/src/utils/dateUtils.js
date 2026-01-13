export function formatLocalDate(utcDateString) {
  if (!utcDateString) return '';
  const d = new Date(utcDateString.endsWith('Z') ? utcDateString : `${utcDateString}Z`);
  return isNaN(d)
    ? 'Invalid date'
    : d.toLocaleString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
}

export function formatDateLabel(date, timeframe) {
  switch (timeframe) {
    case 'day':
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    case 'week':
      return date.toLocaleDateString([], { weekday: 'short' });
    case 'month':
    default:
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}
