function normalize(str) {
  if (!str) return "";
  return str
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

function createRaceSignature(runners) {
  const pairs = [];

  for (const r of runners) {
    const horse = normalize(r.name);
    const jockey = normalize(r.jockey);

    if (horse) pairs.push(`${horse}:${jockey}`);
  }

  pairs.sort();
  return pairs.join("|");
}

module.exports = { createRaceSignature };
