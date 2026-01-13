export function weightInsights(values) {
  if (!values.length) return ['No data yet'];
  const delta = values[values.length - 1] - values[0];
  return delta > 0
    ? ['Weight increasing normally']
    : ['Weight stable'];
}
