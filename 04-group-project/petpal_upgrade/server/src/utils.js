export function dayKey(date = new Date()) {
  // Uses UTC dates consistently to avoid server timezone differences.
  return date.toISOString().slice(0, 10);
}
export function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
