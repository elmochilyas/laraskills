import { SCORE_WEIGHTS } from './config.mjs';

export function generateCandidates(catalog, analysis, aliasResult, routes) {
  const candidates = [];

  const conceptDomains = new Map();
  if (analysis.concepts) {
    for (const c of analysis.concepts) {
      if (c.domain && c.matched) {
        conceptDomains.set(c.domain, (conceptDomains.get(c.domain) || 0) + 1);
      }
    }
  }

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
  for (const [domain, count] of conceptDomains) {
    topDomains.add(domain);
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
      if (domainScore || conceptDomains.has(ku.domain)) {
        score = Math.max(score, SCORE_WEIGHTS.domainRoute);
        matchSources.push('domain');
      }

      if (conceptDomains.has(ku.domain)) {
        score += SCORE_WEIGHTS.crossDomainBoost * conceptDomains.get(ku.domain);
        matchSources.push('concept-cross-domain');
      }
    }

    const normalizedId = id.toLowerCase();
    const analysisTokens = analysis.tokens || [];
    const idTokens = normalizedId.replace(/[/-]/g, ' ').split(/\s+/);

    const tokenOverlap = analysisTokens.filter(t =>
      idTokens.some(it => it.includes(t) || t.includes(it))
    ).length;

    if (tokenOverlap > 0) {
      const overlapScore = Math.min(5 + tokenOverlap * 2, 15);
      score += overlapScore;
      matchSources.push('token');
    }

    if (score > 0) {
      scored.push({
        id,
        ku,
        score,
        matchSources: [...new Set(matchSources)],
        domain: ku.domain,
        subdomain: ku.subdomain,
      });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.id.localeCompare(b.id);
  });

  const seen = new Set();
  const candidates_result = [];
  for (const s of scored) {
    if (!seen.has(s.id)) {
      seen.add(s.id);
      candidates_result.push(s);
    }
  }

  return candidates_result.slice(0, 200);
}
