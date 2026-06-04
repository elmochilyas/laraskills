import { MODE_CONFIG, DOMAIN_NAMES } from './config.mjs';

function estimateTokens(text) {
  if (!text) return 0;
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });
  const segments = segmenter.segment(text.replace(/\s+/g, ' '));
  let count = 0;
  for (const seg of segments) {
    if (seg.isWordLike) count++;
  }
  return Math.ceil(count * 1.3);
}

function collectArtifacts(catalog, kuId, artifactMap) {
  const result = [];
  for (const [key, entries] of Object.entries(artifactMap)) {
    if (!entries) continue;
    for (const entry of entries) {
      if (entry.id && entry.id.startsWith(kuId)) {
        result.push({ artifactType: key, entry });
      }
    }
  }
  return result;
}

export function buildContextBundle(options, rankedKus, graphResult, routes, aliasResult, domainAnalysis, catalog) {
  const mode = MODE_CONFIG[options.mode] || MODE_CONFIG.standard;

  const effectiveMaxKus = options.maxKus || mode.maxKus;
  const effectiveMaxRules = options.maxRules || mode.maxRules;
  const effectiveMaxSkills = options.maxSkills || mode.maxSkills;

  const selectedKus = rankedKus.slice(0, effectiveMaxKus);
  const selectedKuIds = new Set(selectedKus.map(k => k.id));

  const artifactMap = {
    rules: catalog.rules,
    skills: catalog.skills,
    decisionTrees: catalog.decisionTrees,
    antiPatterns: catalog.antiPatterns,
    checklists: catalog.checklists,
  };

  const bundledRules = [];
  const bundledSkills = [];
  const bundledDecisionTrees = [];
  const bundledAntiPatterns = [];
  const bundledChecklists = [];
  const seenIds = { rules: new Set(), skills: new Set(), decisionTrees: new Set(), antiPatterns: new Set(), checklists: new Set() };

  const targetMap = {
    rules: { dest: bundledRules, seen: seenIds.rules, max: effectiveMaxRules },
    skills: { dest: bundledSkills, seen: seenIds.skills, max: effectiveMaxSkills },
  };

  if (mode.includeDecisionTrees) {
    targetMap.decisionTrees = { dest: bundledDecisionTrees, seen: seenIds.decisionTrees, max: effectiveMaxRules };
  }
  if (mode.includeAntiPatterns) {
    targetMap.antiPatterns = { dest: bundledAntiPatterns, seen: seenIds.antiPatterns, max: effectiveMaxRules };
  }
  targetMap.checklists = { dest: bundledChecklists, seen: seenIds.checklists, max: 3 };

  for (const ku of selectedKus) {
    for (const [type, entries] of Object.entries(artifactMap)) {
      const target = targetMap[type];
      if (!target) continue;
      for (const entry of entries) {
        if (entry.id && entry.id.startsWith(ku.id) && !target.seen.has(entry.id)) {
          target.seen.add(entry.id);
          target.dest.push({ ...entry, forKuId: ku.id });
        }
      }
    }
  }

  const bundle = {
    query: options.originalQuery || '',
    mode: options.mode || 'standard',
    selectedDomains: routes.length > 0 && routes[0].primaryDomain
      ? [
          {
            id: routes[0].primaryDomain.id,
            name: routes[0].primaryDomain.name,
            score: routes[0].primaryDomain.confidence,
            reason: routes[0].primaryDomain.reason,
          },
          ...routes[0].supportingDomains.map(d => ({
            id: d.id,
            name: d.name,
            score: 60,
            reason: 'Supporting domain',
          })),
        ]
      : domainAnalysis.domains.slice(0, 3).map(d => ({
          id: d.domain,
          name: DOMAIN_NAMES[d.domain] || d.domain,
          score: d.score,
          reason: `Keyword match: ${d.matchedTerms.slice(0, 3).join(', ')}`,
        })),
    knowledgeUnits: selectedKus.map(ku => ({
      id: ku.id,
      domain: ku.ku.domain,
      subdomain: ku.ku.subdomain,
      name: ku.ku.knowledge_unit || ku.ku.id,
      difficulty: ku.ku.difficulty || 'intermediate',
      score: ku.score,
      breakdown: ku.breakdown,
      directory: ku.ku.directory || '',
      sourcePath: ku.ku.directory ? `${ku.ku.directory}/04-standardized-knowledge.md` : '',
    })),
    rules: bundledRules.slice(0, effectiveMaxRules).map(r => ({
      id: r.id,
      domain: r.domain,
      summary: r.summary,
      sourcePath: r.source_path || '',
      forKuId: r.forKuId,
    })),
    skills: bundledSkills.slice(0, effectiveMaxSkills).map(s => ({
      id: s.id,
      domain: s.domain,
      summary: s.summary,
      sourcePath: s.source_path || '',
      forKuId: s.forKuId,
    })),
  };

  if (mode.includeDecisionTrees) {
    bundle.decisionTrees = bundledDecisionTrees.slice(0, effectiveMaxRules).map(d => ({
      id: d.id,
      domain: d.domain,
      summary: d.summary,
      sourcePath: d.source_path || '',
      forKuId: d.forKuId,
    }));
  }

  if (mode.includeAntiPatterns) {
    bundle.antiPatterns = bundledAntiPatterns.slice(0, effectiveMaxRules).map(a => ({
      id: a.id,
      domain: a.domain,
      summary: a.summary,
      sourcePath: a.source_path || '',
      forKuId: a.forKuId,
    }));
  }

  bundle.checklists = bundledChecklists.slice(0, 3).map(c => ({
    id: c.id,
    domain: c.domain,
    summary: c.summary,
    sourcePath: c.source_path || '',
    forKuId: c.forKuId,
  }));

  bundle.prerequisites = graphResult.prerequisites.map(p => ({
    id: p.id,
    sourceKuId: p.sourceKuId,
    reason: p.reason,
    depth: p.depth,
  }));

  bundle.relatedTopics = graphResult.relatedTopics.map(r => ({
    id: r.id,
    sourceKuId: r.sourceKuId,
    reason: r.reason,
    depth: r.depth,
  }));

  const externalKuIds = new Set();
  for (const ku of selectedKus) externalKuIds.add(ku.id);
  for (const p of graphResult.prerequisites) externalKuIds.add(p.id);
  bundle.externalConcepts = catalog.externalConcepts
    .filter(ec => ec.referenced_by && ec.referenced_by.some(ref => externalKuIds.has(ref)))
    .slice(0, 5)
    .map(ec => ({
      id: ec.id,
      name: ec.name,
      reason: ec.reason,
    }));

  bundle.warnings = [];
  if (catalog.warnings.length > 0) {
    bundle.warnings.push(...catalog.warnings.slice(0, 5));
  }
  if (graphResult.truncated) {
    bundle.warnings.push('Results were truncated due to max limits');
  }

  bundle.estimatedTokens = estimateTokens(JSON.stringify(bundle));

  bundle.explanation = {
    appliedAliases: aliasResult.appliedAliases.map(a => ({
      alias: a.alias,
      matches: a.matches,
      matchType: a.matchType,
    })),
    rankingSummary: selectedKus.slice(0, 3).map(ku => ({
      id: ku.id,
      score: ku.score,
      signals: ku.breakdown.map(b => `${b.signal}: ${b.value}`).join(', '),
    })),
  };

  return bundle;
}
