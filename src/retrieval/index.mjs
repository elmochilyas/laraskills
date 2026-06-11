import { loadCatalog, findEccRoot } from './catalog-loader.mjs';
import { normalizeQuery } from './query-normalizer.mjs';
import { analyzeQuery } from './query-analyzer.mjs';
import { resolveAliases } from './alias-resolver.mjs';
import { routeQuery } from './domain-router.mjs';
import { generateCandidates } from './candidate-generator.mjs';
import { rankCandidates } from './ranker.mjs';
import { expandGraph } from './graph-expander.mjs';
import { buildContextBundle } from './context-bundler.mjs';
import {
  formatAsMarkdown,
  formatAsJson,
  formatKuDetail,
} from './formatter.mjs';
import { generateExplanation } from './explainer.mjs';
import { DEFAULTS } from './config.mjs';

export function retrieveContext(rawQuery, options = {}) {
  const eccRoot = options.eccRoot || process.env.ECC_ROOT || process.cwd();
  const actualRoot = findEccRoot(eccRoot, options.explicitEccRoot, options.eccRootEnv);
  const catalog = loadCatalog(actualRoot);

  const mergedOptions = { ...DEFAULTS, ...options };
  const normalized = normalizeQuery(rawQuery);
  const analysis = analyzeQuery(normalized);
  const aliasResult = resolveAliases(catalog.aliases, normalized.tokens);
  const routes = routeQuery(normalized, analysis);
  const candidates = generateCandidates(catalog, analysis, aliasResult, routes);
  const ranked = rankCandidates(candidates, catalog, normalized, aliasResult, analysis);
  const topIds = ranked.slice(0, mergedOptions.maxKus || DEFAULTS.maxKus).map(r => r.id);
  const graphResult = expandGraph(catalog, topIds, {
    prerequisiteDepth: mergedOptions.prerequisiteDepth || DEFAULTS.prerequisiteDepth,
    relatedDepth: mergedOptions.relatedDepth || DEFAULTS.relatedDepth,
    maxPrerequisites: mergedOptions.maxPrerequisites || DEFAULTS.maxPrerequisites,
    maxRelated: mergedOptions.maxRelated || DEFAULTS.maxRelated,
  });
  const bundle = buildContextBundle(
    { ...mergedOptions, originalQuery: rawQuery, eccRoot: actualRoot },
    ranked,
    graphResult,
    routes,
    aliasResult,
    analysis,
    catalog,
  );
  const explanation = generateExplanation(bundle, mergedOptions);

  return { bundle, explanation, catalog };
}

export function resolveCanonicalId(catalog, input) {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();

  if (catalog.knowledgeUnits.has(trimmed)) {
    return { id: trimmed, strategy: 'exact' };
  }

  const lastSegment = trimmed.split('/').pop();
  if (!lastSegment) return null;

  for (const [id] of catalog.knowledgeUnits) {
    if (id.split('/').pop() === lastSegment) {
      return { id, strategy: 'last-segment' };
    }
  }

  for (const [id, ku] of catalog.knowledgeUnits) {
    if (ku.knowledge_unit === lastSegment) {
      return { id, strategy: 'knowledge-unit-field' };
    }
  }

  for (const alias of catalog.aliases) {
    if (alias.alias === trimmed || alias.normalized_alias === trimmed) {
      if (catalog.knowledgeUnits.has(alias.canonical_ku_id)) {
        return { id: alias.canonical_ku_id, strategy: 'alias' };
      }
      const aliasLast = alias.canonical_ku_id.split('/').pop();
      if (aliasLast === lastSegment && catalog.knowledgeUnits.has(alias.canonical_ku_id)) {
        return { id: alias.canonical_ku_id, strategy: 'alias-segment' };
      }
    }
  }

  const lcLast = lastSegment.toLowerCase();
  const matches = [];
  for (const [id] of catalog.knowledgeUnits) {
    if (id.toLowerCase().includes(lcLast)) {
      matches.push(id);
    }
  }
  if (matches.length === 1) {
    return { id: matches[0], strategy: 'contains-unique' };
  }

  return null;
}

export function searchKnowledge(rawQuery, options = {}) {
  const eccRoot = options.eccRoot || process.env.ECC_ROOT || process.cwd();
  const actualRoot = findEccRoot(eccRoot, options.explicitEccRoot, options.eccRootEnv);
  const catalog = loadCatalog(actualRoot);

  const normalized = normalizeQuery(rawQuery);
  const analysis = analyzeQuery(normalized);
  const aliasResult = resolveAliases(catalog.aliases, normalized.tokens);

  const routes = routeQuery(normalized, analysis);
  const candidates = generateCandidates(catalog, analysis, aliasResult, routes);
  const ranked = rankCandidates(candidates, catalog, normalized, aliasResult, analysis);

  const limit = options.limit || 20;

  if (options.domain) {
    const filtered = ranked.filter(r => r.ku.domain === options.domain);
    return filtered.slice(0, limit);
  }

  return ranked.slice(0, limit);
}

export function getKnowledgeUnit(id, options = {}) {
  const eccRoot = options.eccRoot || process.env.ECC_ROOT || process.cwd();
  const actualRoot = findEccRoot(eccRoot, options.explicitEccRoot, options.eccRootEnv);
  const catalog = loadCatalog(actualRoot);

  let ku = catalog.knowledgeUnits.get(id);
  let resolvedInfo = null;

  if (!ku) {
    const resolved = resolveCanonicalId(catalog, id);
    if (resolved) {
      ku = catalog.knowledgeUnits.get(resolved.id);
      resolvedInfo = resolved;
    }
  }

  if (!ku) return null;

  return {
    metadata: ku,
    detail: formatKuDetail(ku, catalog, options.includeContent),
    _resolution: resolvedInfo,
  };
}

export function getPrerequisites(id, options = {}) {
  const eccRoot = options.eccRoot || process.env.ECC_ROOT || process.cwd();
  const actualRoot = findEccRoot(eccRoot, options.explicitEccRoot, options.eccRootEnv);
  const catalog = loadCatalog(actualRoot);

  const resolved = resolveCanonicalId(catalog, id);
  const canonicalId = resolved ? resolved.id : id;

  const graphResult = expandGraph(catalog, [canonicalId], {
    prerequisiteDepth: options.depth || 1,
    maxPrerequisites: options.limit || 20,
    relatedDepth: 0,
    maxRelated: 0,
  });

  const result = graphResult.prerequisites;
  if (resolved) result._resolution = resolved;
  return result;
}

export function getRelatedTopics(id, options = {}) {
  const eccRoot = options.eccRoot || process.env.ECC_ROOT || process.cwd();
  const actualRoot = findEccRoot(eccRoot, options.explicitEccRoot, options.eccRootEnv);
  const catalog = loadCatalog(actualRoot);

  const resolved = resolveCanonicalId(catalog, id);
  const canonicalId = resolved ? resolved.id : id;

  const graphResult = expandGraph(catalog, [canonicalId], {
    relatedDepth: options.depth || 1,
    maxRelated: options.limit || 20,
    prerequisiteDepth: 0,
    maxPrerequisites: 0,
  });

  const result = graphResult.relatedTopics;
  if (resolved) result._resolution = resolved;
  return result;
}

export function validateIntelligence(options = {}) {
  const eccRoot = options.eccRoot || process.env.ECC_ROOT || process.cwd();
  const actualRoot = findEccRoot(eccRoot, options.explicitEccRoot, options.eccRootEnv);
  const catalog = loadCatalog(actualRoot);

  const issues = [];

  if (catalog.errors.length > 0) {
    issues.push(...catalog.errors.map(e => `ERROR: ${e}`));
  }

  for (const [id, ku] of catalog.knowledgeUnits) {
    if (!ku.domain) issues.push(`KU ${id}: missing domain`);
    if (!ku.subdomain) issues.push(`KU ${id}: missing subdomain`);
  }

  const sourceIds = new Set(catalog.knowledgeUnits.keys());

  for (const edge of catalog.dependencies.edges) {
    if (!sourceIds.has(edge.source)) {
      issues.push(`Dependency edge ${edge.id}: source "${edge.source}" not found in KUs`);
    }
    if (!sourceIds.has(edge.target)) {
      issues.push(`Dependency edge ${edge.id}: target "${edge.target}" not found in KUs`);
    }
  }

  for (const edge of catalog.relationships.edges) {
    if (!sourceIds.has(edge.source)) {
      issues.push(`Relationship edge ${edge.id}: source "${edge.source}" not found in KUs`);
    }
    if (!sourceIds.has(edge.target)) {
      issues.push(`Relationship edge ${edge.id}: target "${edge.target}" not found in KUs`);
    }
  }

  const nodes = [...sourceIds].map(id => ({ id }));
  const inDegree = new Map();
  for (const id of sourceIds) inDegree.set(id, 0);
  const adj = new Map();
  for (const id of sourceIds) adj.set(id, []);

  for (const edge of catalog.dependencies.edges) {
    if (edge.type === 'prerequisite' && sourceIds.has(edge.source) && sourceIds.has(edge.target)) {
      adj.get(edge.source).push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }
  }

  const queue = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }
  let visitedCount = 0;
  while (queue.length > 0) {
    const node = queue.shift();
    visitedCount++;
    for (const neighbor of (adj.get(node) || [])) {
      const newDeg = inDegree.get(neighbor) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  if (visitedCount !== sourceIds.size) {
    issues.push(`Circular dependency detected: only ${visitedCount}/${sourceIds.size} KUs are reachable in topological order`);
  }

  const results = {
    valid: issues.length === 0,
    knowledgeUnitCount: catalog.knowledgeUnitsCount,
    dependencyEdgeCount: catalog.dependencyEdgesCount,
    relationshipEdgeCount: catalog.relationshipEdgesCount,
    aliasesCount: catalog.aliasesCount,
    externalConceptsCount: catalog.externalConceptsCount,
    issues,
  };

  return results;
}

export function retrieveAndFormat(rawQuery, options = {}) {
  const { bundle, explanation } = retrieveContext(rawQuery, options);

  if (options.format === 'json') {
    return formatAsJson({ ...bundle, _explanation: explanation });
  }

  return formatAsMarkdown(bundle);
}
