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
    { ...mergedOptions, originalQuery: rawQuery },
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

  const ku = catalog.knowledgeUnits.get(id);
  if (!ku) return null;

  return {
    metadata: ku,
    detail: formatKuDetail(ku, catalog, options.includeContent),
  };
}

export function getPrerequisites(id, options = {}) {
  const eccRoot = options.eccRoot || process.env.ECC_ROOT || process.cwd();
  const actualRoot = findEccRoot(eccRoot, options.explicitEccRoot, options.eccRootEnv);
  const catalog = loadCatalog(actualRoot);

  const graphResult = expandGraph(catalog, [id], {
    prerequisiteDepth: options.depth || 1,
    maxPrerequisites: options.limit || 20,
    relatedDepth: 0,
    maxRelated: 0,
  });

  return graphResult.prerequisites;
}

export function getRelatedTopics(id, options = {}) {
  const eccRoot = options.eccRoot || process.env.ECC_ROOT || process.cwd();
  const actualRoot = findEccRoot(eccRoot, options.explicitEccRoot, options.eccRootEnv);
  const catalog = loadCatalog(actualRoot);

  const graphResult = expandGraph(catalog, [id], {
    relatedDepth: options.depth || 1,
    maxRelated: options.limit || 20,
    prerequisiteDepth: 0,
    maxPrerequisites: 0,
  });

  return graphResult.relatedTopics;
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
