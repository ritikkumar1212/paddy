export function buildWinnerMap(results) {
  const map = {};
  results.forEach(r => {
    map[r.horse_number] = r.position;
  });
  return map;
}
