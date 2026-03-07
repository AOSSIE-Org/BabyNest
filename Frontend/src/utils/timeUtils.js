export const formatTime = (timeString) => {
  if (!timeString) return '';
  const parts = timeString.split(':');
  if (parts.length < 2) return '';

  let h = parseInt(parts[0]);
  const m = parseInt(parts[1]);

  if (!Number.isFinite(h) || !Number.isFinite(m)) return '';

  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};
