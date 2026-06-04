import { SCORE_WEIGHTS } from './config.mjs';

export function generateCandidates(catalog, analysis, aliasResult, routes) {
  const candidates = [];

  const topDomains = new Set();
  if (routes.length > 0 && routes[0].primaryDomain) {
    topDomains.add(routes[0].primaryDomain.id);
    for (const sd of routes[0].supportingDomains) {
      topDomains.add(sd.id);
    }
  }
  for (const ad of analysis.domains) {
    topDomains.add(ad.domain);
  }
  for (const kuId of aliasResult.matchedKuIds) {
    const parts = kuId.split('/');
    if (parts.length >= 1) topDomains.add(parts[0]);
  }

  const domainSet = new Set(topDomains);
  const scored = [];

  for (const [id, ku] of catalog.knowledgeUnits) {
    let score = 0;
    let matchSources = [];

    if (aliasResult.matchedKuIds.includes(id)) {
      score = Math.max(score, SCORE_WEIGHTS.exactAlias);
      matchSources.push('alias');
    }

    if (domainSet.has(ku.domain)) {
      const domainScore = analysis.domains.find(d => d.domain === ku.domain);
      if (domainScore) {
        score = Math.max(score, SCORE_WEIGHTS.domainRoute);
        matchSources.push('domain');
      }
    }

    const normalizedId = id.toLowerCase();
    const normalizedTokens = analysis.tokens;
    const idTokens = normalizedId.replace(/[/-]/g, ' ').split(/\s+/);

    const tokenOverlap = normalizedTokens.filter(t =>
      idTokens.some(it => it.includes(t) || t.includes(it))
    ).length;

    if (tokenOverlap > 0) {
      const overlapScore = Math.min(
        SCORE_WEIGHTS.tokenOverlapMin + (tokenOverlap * 3),
        SCORE_WEIGHTS.tokenOverlapSummary
      );
      score += overlapScore;
      matchSources.push('token');
    }

    if (score > 0) {
      const kuSummary = `${ku.knowledge_unit || ''} ${ku.subdomain || ''} ${ku.domain || ''}`;
      scored.push({
        id,
        ku,
        score,
        matchSources: [...new Set(matchSources)],
        domain: ku.domain,
        subdomain: ku.subdomain,
        summary: kuSummary,
      });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.id.localeCompare(b.id);
  });

  const seen = new Set();
  for (const s of scored) {
    if (!seen.has(s.id)) {
      seen.add(s.id);
      candidates.push(s);
    }
  }

  return candidates.slice(0, 200);
}
