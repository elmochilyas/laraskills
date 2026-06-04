import { SCORE_WEIGHTS } from './config.mjs';
import { tokenizeForOverlap } from './query-normalizer.mjs';

export function rankCandidates(candidates, catalog, normalizedQuery, aliasResult, domainAnalysis) {
  const queryTokens = tokenizeForOverlap(normalizedQuery.normalized);
  const ranked = [];

  const aliasTargets = new Map();
  for (const alias of catalog.aliases) {
    if (alias.canonical_ku_id) {
      if (!aliasTargets.has(alias.canonical_ku_id)) {
        aliasTargets.set(alias.canonical_ku_id, []);
      }
      aliasTargets.get(alias.canonical_ku_id).push(alias.alias);
    }
  }

  const skillKuMap = new Map();
  for (const skill of catalog.skills) {
    if (skill.id) {
      const kuId = skill.id.replace(/\/rules$|\/skills$|\/decision-trees$|\/anti-patterns$|\/checklists$/, '');
      if (!skillKuMap.has(kuId)) skillKuMap.set(kuId, []);
      skillKuMap.get(kuId).push(skill);
    }
  }

  for (const candidate of candidates) {
    const { id, ku } = candidate;
    let totalScore = 0;
    const breakdown = [];

    const kuNameClean = (ku.knowledge_unit || '').toLowerCase().replace(/[^\w\s]/g, '');
    const queryStr = normalizedQuery.normalized;

    if (kuNameClean === queryStr) {
      totalScore += SCORE_WEIGHTS.exactKuName;
      breakdown.push({ signal: 'exactKuName', value: SCORE_WEIGHTS.exactKuName, detail: 'Exact KU name match' });
    }

    const aliasEntry = aliasResult.resolved.find(a => a.canonicalKuId === id);
    if (aliasEntry) {
      totalScore += SCORE_WEIGHTS.exactAlias;
      breakdown.push({ signal: 'exactAlias', value: SCORE_WEIGHTS.exactAlias, detail: `Matched alias: "${aliasEntry.alias}"` });
    }

    if (aliasTargets.has(id)) {
      totalScore += SCORE_WEIGHTS.exactAlias - 5;
      breakdown.push({ signal: 'aliasTarget', value: SCORE_WEIGHTS.exactAlias - 5, detail: `Alias target: "${aliasTargets.get(id)[0]}"` });
    }

    if (skillKuMap.has(id)) {
      totalScore += SCORE_WEIGHTS.exactSkill;
      breakdown.push({ signal: 'skillExists', value: SCORE_WEIGHTS.exactSkill, detail: 'Has associated skill' });
    }

    const nameTokens = tokenizeForOverlap(kuNameClean);
    let overlap = [...nameTokens].filter(t => queryTokens.has(t)).length;

    const idStr = id.toLowerCase().replace(/[/-]/g, ' ');
    const idTokens = tokenizeForOverlap(idStr);
    overlap += [...idTokens].filter(t => queryTokens.has(t) && t.length > 2).length;

    const subdomainStr = (ku.subdomain || '').toLowerCase().replace(/[/-]/g, ' ');
    const subdomainTokens = tokenizeForOverlap(subdomainStr);
    overlap += [...subdomainTokens].filter(t => queryTokens.has(t) && t.length > 2).length;

    if (overlap > 0) {
      const rawScore = SCORE_WEIGHTS.tokenOverlapMin + (overlap * 3);
      const clampedScore = Math.min(rawScore, SCORE_WEIGHTS.tokenOverlapSummary);
      totalScore += clampedScore;
      breakdown.push({ signal: 'tokenOverlap', value: clampedScore, detail: `${overlap} overlapping tokens across name, id, and subdomain` });
    }

    if (domainAnalysis.primaryDomain && ku.domain === domainAnalysis.primaryDomain) {
      totalScore += SCORE_WEIGHTS.domainRoute;
      breakdown.push({ signal: 'primaryDomain', value: SCORE_WEIGHTS.domainRoute, detail: 'In primary domain' });
    } else if (domainAnalysis.supportingDomains && domainAnalysis.supportingDomains.includes(ku.domain)) {
      totalScore += SCORE_WEIGHTS.domainRoute - 10;
      breakdown.push({ signal: 'supportingDomain', value: SCORE_WEIGHTS.domainRoute - 10, detail: 'In supporting domain' });
    }

    ranked.push({
      id,
      ku,
      score: totalScore,
      breakdown,
      breakdownTotal: breakdown.reduce((s, b) => s + b.value, 0),
    });
  }

  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.id.localeCompare(b.id);
  });

  const seen = new Set();
  const deduped = [];
  for (const r of ranked) {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      deduped.push(r);
    }
  }

  return deduped;
}
