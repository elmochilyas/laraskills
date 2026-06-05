import { SCORE_WEIGHTS } from './config.mjs';
import { tokenizeForOverlap } from './query-normalizer.mjs';
import { getKuConceptFamilies } from './query-analyzer.mjs';

const RANKING_STOPWORDS = new Set([
  'api', 'crud', 'rest', 'design', 'engineering', 'system',
  'architecture', 'laravel', 'implementation', 'development',
  'pattern', 'application', 'framework', 'php', 'web',
  'and', 'with', 'for', 'add', 'use', 'using', 'set', 'new',
]);

function isGenericToken(token) {
  return RANKING_STOPWORDS.has(token) || token.length <= 2;
}

function tokenizeField(text) {
  return tokenizeForOverlap(text || '');
}

function scoreFieldTokens(queryTokens, fieldText, weight, genericWeight) {
  const fieldTokens = tokenizeField(fieldText);
  let score = 0;
  for (const qt of queryTokens) {
    if (fieldTokens.has(qt)) {
      if (isGenericToken(qt)) {
        score += genericWeight;
      } else {
        score += weight;
      }
    }
  }
  return score;
}

const SKILL_STOPWORDS = new Set([
  'api', 'crud', 'rest', 'design', 'engineering', 'system',
  'architecture', 'laravel', 'implementation', 'development',
  'pattern', 'application', 'framework', 'php', 'web',
  'for', 'skills', 'rules', 'with', 'and', 'the', 'this', 'that',
  'from', 'into', 'using', 'based', '01',
]);

function scoreSkillMatch(queryTokens, skills, catalog) {
  const meaningfulTokens = [...queryTokens].filter(t => !SKILL_STOPWORDS.has(t) && t.length > 2);
  if (meaningfulTokens.length === 0) return 0;

  for (const skill of skills) {
    const summary = (skill.summary || '').toLowerCase();
    const skillNameTokens = tokenizeField(summary);
    let matchedCount = 0;
    for (const qt of meaningfulTokens) {
      if (skillNameTokens.has(qt)) matchedCount++;
    }
    if (matchedCount >= 2) {
      return SCORE_WEIGHTS.exactSkillMatch;
    }
  }
  return 0;
}

function scoreConceptCoverage(queryConcepts, kuId) {
  if (!queryConcepts || queryConcepts.length === 0) return 0;
  const kuFamilies = getKuConceptFamilies(kuId);
  if (kuFamilies.length === 0) return 0;
  let covered = 0;
  for (const concept of queryConcepts) {
    if (kuFamilies.includes(concept.family)) covered++;
  }
  return covered * SCORE_WEIGHTS.conceptSlotFill;
}

function reRankByCoverage(ranked, queryConcepts, primaryDomain) {
  if (!queryConcepts || queryConcepts.length === 0) return ranked;

  const conceptSlots = queryConcepts.map(c => c.family);
  const conceptDomains = new Map();
  for (const c of queryConcepts) {
    if (c.domain) conceptDomains.set(c.family, c.domain);
  }
  const slotAssignments = new Map();
  const subdomainCounts = new Map();

  const boosted = ranked.map(r => {
    const kuFamilies = getKuConceptFamilies(r.id);
    let bonus = 0;

    for (const family of kuFamilies) {
      if (conceptSlots.includes(family) && !slotAssignments.has(family)) {
        const conceptDomain = conceptDomains.get(family);
        const domainMatch = conceptDomain && r.ku.domain === conceptDomain;
        bonus += domainMatch ? SCORE_WEIGHTS.conceptSlotFill * 2 : SCORE_WEIGHTS.conceptSlotFill;
        slotAssignments.set(family, r.id);
      }
    }

    if (primaryDomain && r.ku.domain === primaryDomain) {
      bonus += SCORE_WEIGHTS.conceptSlotFill;
    }

    const subdomain = (r.ku.subdomain || 'unknown');
    const count = (subdomainCounts.get(subdomain) || 0) + 1;
    subdomainCounts.set(subdomain, count);
    if (count > 3) {
      bonus -= Math.min((count - 3) * 5, 15);
    }

    const newScore = Math.max(0, r.score + bonus);
    return { ...r, score: newScore, coverageBonus: bonus };
  });

  boosted.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aFamilies = getKuConceptFamilies(a.id);
    const bFamilies = getKuConceptFamilies(b.id);
    const aCoverage = aFamilies.filter(f => conceptSlots.includes(f)).length;
    const bCoverage = bFamilies.filter(f => conceptSlots.includes(f)).length;
    if (bCoverage !== aCoverage) return bCoverage - aCoverage;
    return a.id.localeCompare(b.id);
  });

  return boosted;
}

export function rankCandidates(candidates, catalog, normalizedQuery, aliasResult, domainAnalysis) {
  const queryTokens = tokenizeForOverlap(normalizedQuery.normalized);
  const queryTokenArray = [...queryTokens];
  const queryConcepts = domainAnalysis.concepts || [];

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

  const domainSet = new Set();
  if (domainAnalysis.primaryDomain) domainSet.add(domainAnalysis.primaryDomain);
  if (domainAnalysis.supportingDomains) {
    for (const sd of domainAnalysis.supportingDomains) domainSet.add(sd);
  }

  for (const candidate of candidates) {
    const { id, ku } = candidate;
    let totalScore = 0;
    const breakdown = [];

    const kuNameClean = (ku.knowledge_unit || '').toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
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

    const skills = skillKuMap.get(id) || [];
    if (skills.length > 0) {
      const skillScore = scoreSkillMatch(queryTokenArray, skills, catalog);
      if (skillScore > 0) {
        totalScore += skillScore;
        breakdown.push({ signal: 'exactSkillMatch', value: skillScore, detail: 'Skill name matches query terms' });
      } else {
        totalScore += SCORE_WEIGHTS.artifactAvailability;
        breakdown.push({ signal: 'artifactAvailability', value: SCORE_WEIGHTS.artifactAvailability, detail: 'Has associated skill file' });
      }
    }

    const nameScore = scoreFieldTokens(queryTokenArray, kuNameClean, SCORE_WEIGHTS.tokenKuName, 0);
    if (nameScore > 0) {
      totalScore += nameScore;
      breakdown.push({ signal: 'tokenKuName', value: nameScore, detail: 'Token match in KU name' });
    }

    const subdomainStr = (ku.subdomain || '');
    const subdomainScore = scoreFieldTokens(queryTokenArray, subdomainStr, SCORE_WEIGHTS.tokenSubdomain, SCORE_WEIGHTS.genericToken);
    if (subdomainScore > 0) {
      totalScore += subdomainScore;
      breakdown.push({ signal: 'tokenSubdomain', value: subdomainScore, detail: 'Token match in subdomain' });
    }

    const idStr = id.toLowerCase().replace(/[/-]/g, ' ');
    const genericScore = scoreFieldTokens(queryTokenArray, idStr, SCORE_WEIGHTS.genericToken, SCORE_WEIGHTS.genericToken) -
      subdomainScore - nameScore;
    if (genericScore > 0) {
      totalScore += Math.min(genericScore, SCORE_WEIGHTS.genericToken * 3);
      breakdown.push({ signal: 'genericToken', value: Math.min(genericScore, SCORE_WEIGHTS.genericToken * 3), detail: 'Generic token match in domain or ID path' });
    }

    if (domainAnalysis.primaryDomain && ku.domain === domainAnalysis.primaryDomain) {
      totalScore += SCORE_WEIGHTS.domainRoute;
      breakdown.push({ signal: 'domainRoute', value: SCORE_WEIGHTS.domainRoute, detail: 'In primary domain' });
    } else if (domainSet.has(ku.domain)) {
      totalScore += SCORE_WEIGHTS.domainRoute - 5;
      breakdown.push({ signal: 'domainRoute', value: SCORE_WEIGHTS.domainRoute - 5, detail: 'In supporting or matched domain' });
    }

    const conceptScore = scoreConceptCoverage(queryConcepts, id);
    if (conceptScore > 0) {
      totalScore += conceptScore;
      breakdown.push({ signal: 'conceptCoverage', value: conceptScore, detail: 'Covers explicit query concept' });
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

  const reRanked = reRankByCoverage(ranked, queryConcepts, domainAnalysis.primaryDomain);

  const seen = new Set();
  const deduped = [];
  for (const r of reRanked) {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      deduped.push(r);
    }
  }

  return deduped;
}
