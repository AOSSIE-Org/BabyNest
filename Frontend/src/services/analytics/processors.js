import { formatDateLabel } from '../../utils/dateUtils';

export function processWeight(data, timeframe) {
  const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  return {
    labels: sorted.map(i => formatDateLabel(new Date(i.date), timeframe)),
    values: sorted.map(i => Number(i.weight)),
    raw: sorted,
  };
}
