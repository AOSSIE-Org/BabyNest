export function calculateCurrentWeek(dueDate) {
  const due = new Date(dueDate);
  const conception = new Date(due);
  conception.setDate(conception.getDate() - 280);
  const diff = Date.now() - conception;
  return Math.min(Math.max(Math.floor(diff / (1000 * 60 * 60 * 24 * 7)), 1), 40);
}
