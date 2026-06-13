import {
  retrieveContext,
  searchKnowledge,
  getKnowledgeUnit,
  getPrerequisites,
  getRelatedTopics,
  validateIntelligence,
} from '../../src/retrieval/index.mjs';
import { loadCatalog } from '../../src/retrieval/catalog-loader.mjs';
import {
  retrieveContextInputSchema,
  searchInputSchema,
  knowledgeUnitInputSchema,
  graphContextInputSchema,
  validateInputSchema,
} from './schemas.mjs';

function readEdgesForSelfLoopsAndDangling(catalog) {
  const sourceIds = new Set(catalog.knowledgeUnits.keys());
  let selfLoops = 0;
  let dangling = 0;
  for (const e of catalog.dependencies.edges) {
    if (e.source === e.target) selfLoops += 1;
    if (!sourceIds.has(e.source) || !sourceIds.has(e.target)) dangling += 1;
  }
  return { selfLoops, dangling };
}

function countCycles(catalog) {
  const inDegree = new Map();
  const adj = new Map();
  for (const id of catalog.knowledgeUnits.keys()) {
    inDegree.set(id, 0);
    adj.set(id, []);
  }
  for (const e of catalog.dependencies.edges) {
    if (e.type === 'prerequisite' && adj.has(e.source) && adj.has(e.target)) {
      adj.get(e.source).push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
  }
  const queue = [];
  for (const [id, deg] of inDegree) if (deg === 0) queue.push(id);
  let visited = 0;
  while (queue.length > 0) {
    const node = queue.shift();
    visited += 1;
    for (const n of adj.get(node) || []) {
      const d = inDegree.get(n) - 1;
      inDegree.set(n, d);
      if (d === 0) queue.push(n);
    }
  }
  const total = catalog.knowledgeUnits.size;
  return total - visited;
}

export function describeForAgents() {
  return [
    'LaraSkills MCP server. Always use `retrieve_context_bundle` first for any non-trivial Laravel task.',
    'Search with `search_ecc` to discover KUs by topic. Results include canonical IDs you can copy-paste directly into `get_knowledge_unit` and `get_graph_context`.',
    'Deep-inspect with `get_knowledge_unit` -- also accepts short IDs (last path segment) and aliases for convenience.',
    'Explore dependencies with `get_graph_context` -- prerequisites and related topics in one call.',
    'Check integrity with `validate_ecc`.',
    'Budget: prefer `compact` or `standard` mode before `deep`. Avoid loading the entire repository.',
    'Convergence: if a bundle does not answer the question, iterate by narrowing the task or switching to a different domain.',
  ].join(' ');
}

export function buildRetrieveBundleResult(rawArgs, ctx) {
  const args = retrieveContextInputSchema.parse(rawArgs || {});
  const { bundle, explanation } = retrieveContext(args.task, {
    eccRoot: ctx.eccRoot,
    mode: args.mode,
    maxKus: args.max_kus,
    maxRules: args.max_rules,
    maxSkills: args.max_skills,
    maxRelated: args.max_related,
    maxPrerequisites: args.max_prerequisites,
    prerequisiteDepth: args.prerequisite_depth,
    relatedDepth: args.related_depth,
    budget: args.budget,
    domain: args.domain,
  });

  const structured = {
    query: bundle.query,
    mode: bundle.mode,
    estimatedTokens: bundle.estimatedTokens,
    selectedDomains: bundle.selectedDomains || [],
    knowledgeUnits: bundle.knowledgeUnits || [],
    rules: bundle.rules || [],
    skills: bundle.skills || [],
    decisionTrees: bundle.decisionTrees || [],
    antiPatterns: bundle.antiPatterns || [],
    checklists: bundle.checklists || [],
    prerequisites: bundle.prerequisites || [],
    relatedTopics: bundle.relatedTopics || [],
    externalConcepts: bundle.externalConcepts || [],
    warnings: bundle.warnings || [],
    explanation: {
      appliedAliases: (explanation && explanation.appliedAliases) || (bundle.explanation && bundle.explanation.appliedAliases) || [],
      rankingSummary: (explanation && explanation.rankingSummary) || (bundle.explanation && bundle.explanation.rankingSummary) || [],
    },
  };

  const budgetLabel = { compact: '~2K', standard: '~6K', deep: '~15K' }[bundle.mode] || '~6K';
  const text = [
    `ECC context bundle for: ${bundle.query}`,
    `Mode: ${bundle.mode} (${budgetLabel} tokens) | Estimated tokens: ${bundle.estimatedTokens}`,
    `Domains: ${structured.selectedDomains.map((d) => d.name).join(', ') || 'auto-detected'}`,
    `Knowledge units: ${structured.knowledgeUnits.length} | Rules: ${structured.rules.length} | Skills: ${structured.skills.length}`,
    `Prerequisites: ${structured.prerequisites.length} | Related topics: ${structured.relatedTopics.length}`,
    structured.warnings.length > 0 ? `Warnings: ${structured.warnings.length}` : 'No warnings.',
    '',
    'Convergence guidance:',
    '  - If this bundle answers the question, proceed with implementation.',
    '  - If not, narrow the task description or switch to a different domain.',
    '  - Use search_ecc to discover additional KUs, then get_knowledge_unit for deep inspection.',
    '  - Use get_graph_context to explore prerequisites or related topics for any KU in the bundle.',
  ].join('\n');

  return { text, structured };
}

export function buildSearchResult(rawArgs, ctx) {
  const args = searchInputSchema.parse(rawArgs || {});
  const results = searchKnowledge(args.query, {
    eccRoot: ctx.eccRoot,
    limit: args.limit,
    domain: args.domain,
  });

  const structured = {
    query: args.query,
    count: results.length,
    results: results.map((r) => ({
      id: r.id,
      score: r.score,
      domain: r.ku?.domain || '',
      subdomain: r.ku?.subdomain || '',
      name: r.ku?.knowledge_unit || r.id,
      breakdown: r.breakdown || [],
      sourcePath: r.ku?.directory ? `${r.ku.directory}/04-standardized-knowledge.md` : '',
    })),
  };

  const text = (() => {
    if (structured.count === 0) return `No matches for "${args.query}".`;

    const top = structured.results.slice(0, 5);
    const lines = [
      `Found ${structured.count} KUs for "${args.query}".`,
      'Results (use the ID column with get_knowledge_unit / get_graph_context):',
      '  # | ID (canonical) | Name | Score',
      '  ---+---',
    ];
    for (let i = 0; i < top.length; i++) {
      const r = top[i];
      lines.push(`  ${i + 1}. | ${r.id} | ${r.name} | ${r.score}`);
    }
    if (structured.count > 5) {
      lines.push(`  ... and ${structured.count - 5} more. Use a more specific query to narrow.`);
    }
    return lines.join('\n');
  })();

  return { text, structured };
}

const ARTIFACT_TYPE_TO_FLAG = {
  knowledge: null,
  rules: 'has_rules',
  skills: 'has_skills',
  decision_trees: 'has_decision_trees',
  anti_patterns: 'has_anti_patterns',
  checklists: 'has_checklists',
};

const ARTIFACT_TYPE_TO_FILE = {
  knowledge: '04-standardized-knowledge.md',
  rules: '05-rules.md',
  skills: '06-skills.md',
  decision_trees: '07-decision-trees.md',
  anti_patterns: '08-anti-patterns.md',
  checklists: '09-checklists.md',
};

export function buildKnowledgeUnitResult(rawArgs, ctx) {
  const args = knowledgeUnitInputSchema.parse(rawArgs || {});
  const result = getKnowledgeUnit(args.id, {
    eccRoot: ctx.eccRoot,
    includeContent: args.include_content,
  });
  if (!result) {
    return { notFound: true };
  }

  const md = result.metadata || {};
  const resolution = result._resolution;
  const artifactSummaries = args.artifact_types.map((t) => {
    if (t === 'knowledge') {
      return {
        artifact_type: t,
        available: !!md.directory,
        source_file: md.directory ? `${md.directory}/04-standardized-knowledge.md` : undefined,
      };
    }
    const flag = ARTIFACT_TYPE_TO_FLAG[t];
    const has = flag ? !!md[flag] : false;
    return {
      artifact_type: t,
      available: has,
      source_file: has && md.directory ? `${md.directory}/${ARTIFACT_TYPE_TO_FILE[t]}` : undefined,
    };
  });

  const structured = {
    id: md.id || args.id,
    metadata: {
      id: md.id || args.id,
      domain: md.domain || '',
      subdomain: md.subdomain || '',
      knowledge_unit: md.knowledge_unit,
      difficulty: md.difficulty,
      directory: md.directory,
      has_skills: md.has_skills,
      has_rules: md.has_rules,
      has_checklists: md.has_checklists,
      has_decision_trees: md.has_decision_trees,
      has_anti_patterns: md.has_anti_patterns,
    },
    artifact_summaries: artifactSummaries,
    content: args.include_content ? result.detail : undefined,
    detail: result.detail,
    _resolution: resolution ? { strategy: resolution.strategy, resolved_id: resolution.id } : undefined,
  };

  const parts = [`Knowledge unit: ${structured.metadata.knowledge_unit || structured.metadata.id}`];
  parts.push(`Canonical ID: ${md.id || args.id}`);
  parts.push(`Domain: ${structured.metadata.domain} | Subdomain: ${structured.metadata.subdomain}`);
  if (resolution) {
    parts.push(`(ID resolved via "${resolution.strategy}" strategy — provided input was: "${args.id}")`);
  }
  parts.push(`Artifacts: ${artifactSummaries.filter((a) => a.available).map((a) => a.artifact_type).join(', ') || 'none'}`);
  const text = parts.join('\n');

  return { text, structured };
}

export function buildGraphContextResult(rawArgs, ctx) {
  const args = graphContextInputSchema.parse(rawArgs || {});
  const prereqResult = getPrerequisites(args.id, {
    eccRoot: ctx.eccRoot,
    depth: args.prerequisite_depth,
    limit: args.max_prerequisites,
  });
  const relatedResult = getRelatedTopics(args.id, {
    eccRoot: ctx.eccRoot,
    depth: args.related_depth,
    limit: args.max_related,
  });

  const prereqs = prereqResult || [];
  const related = relatedResult || [];
  const prereqRes = prereqResult._resolution;
  const relatedRes = relatedResult._resolution;
  const resolution = prereqRes || relatedRes;

  if (prereqs.length === 0 && related.length === 0) {
    const catalog = loadCatalog(ctx.eccRoot);
    const resolvedId = resolution ? resolution.id : args.id;
    if (!catalog.knowledgeUnits.has(resolvedId)) {
      return { notFound: true };
    }
  }

  const effectiveId = resolution ? resolution.id : args.id;

  const structured = {
    id: args.id,
    resolvedId: effectiveId !== args.id ? effectiveId : undefined,
    prerequisites: prereqs.map((p) => ({
      id: p.id,
      sourceKuId: p.sourceKuId,
      reason: p.reason,
      depth: p.depth,
      strength: p.strength,
    })),
    relatedTopics: related.map((r) => ({
      id: r.id,
      sourceKuId: r.sourceKuId,
      reason: r.reason,
      depth: r.depth,
    })),
    totalPrerequisitesFound: prereqs.length,
    totalRelatedFound: related.length,
    truncated: prereqs.length >= args.max_prerequisites || related.length >= args.max_related,
  };

  const parts = [`Graph context for: ${effectiveId}`];
  if (resolution) {
    parts.push(`(ID resolved via "${resolution.strategy}" strategy — provided input was: "${args.id}")`);
  }
  parts.push(`Prerequisites: ${prereqs.length} (depth ${args.prerequisite_depth}) | Related: ${related.length} (depth ${args.related_depth})`);
  const text = parts.join('\n');

  return { text, structured };
}

export function buildValidationResult(rawArgs, ctx) {
  validateInputSchema.parse(rawArgs || {});
  const result = validateIntelligence({ eccRoot: ctx.eccRoot });
  const catalog = loadCatalog(ctx.eccRoot);
  const { selfLoops, dangling } = readEdgesForSelfLoopsAndDangling(catalog);
  const cycles = countCycles(catalog);

  const structured = {
    valid: result.valid,
    knowledgeUnitCount: result.knowledgeUnitCount,
    dependencyEdgeCount: result.dependencyEdgeCount,
    relationshipEdgeCount: result.relationshipEdgeCount,
    aliasesCount: result.aliasesCount,
    externalConceptsCount: result.externalConceptsCount,
    cycleCount: cycles,
    selfLoopCount: selfLoops,
    danglingEdgeCount: dangling,
    issues: result.issues || [],
  };

  const text = structured.valid
    ? `LaraSkills intelligence is VALID. ${structured.knowledgeUnitCount} KUs, ${structured.dependencyEdgeCount} dep edges, ${structured.relationshipEdgeCount} rel edges, 0 cycles, 0 self-loops, 0 dangling.`
    : `LaraSkills intelligence has ${structured.issues.length} issue(s). Top issue: ${structured.issues[0] || 'unknown'}`;

  return { text, structured };
}

export function buildErrorResult(message) {
  return {
    isError: true,
    content: [{ type: 'text', text: `Error: ${message}` }],
  };
}

export function buildRootErrorResult(state) {
  const hint = state.explicitLaraskillsRoot
    ? `Explicit --laraskills-root path failed: ${state.explicitLaraskillsRoot}`
    : state.explicitEccRoot
      ? `Deprecated --ecc-root path failed: ${state.explicitEccRoot}`
      : state.envLaraskillsRoot
        ? `LARASKILLS_ROOT path failed: ${state.envLaraskillsRoot}`
        : state.envEccRoot
          ? `Legacy ECC_ROOT path failed: ${state.envEccRoot}`
          : 'No configured LaraSkills root was found, and the current working directory does not contain intelligence/json/.';
  const message = [
    'LaraSkills intelligence files were not found.',
    hint,
    '',
    'The npm package contains the CLI and MCP adapter.',
    'Retrieval requires access to a full LaraSkills checkout.',
    '',
    'Options:',
    '  Run the built-in setup command:',
    '    laraskills setup --laraskills-root /path/to/laraskills',
    '',
    '  Set the preferred environment variable:',
    '    LARASKILLS_ROOT=/path/to/laraskills',
    '',
    '  Or pass --laraskills-root to the MCP server:',
    '    node scripts/laraskills-mcp.mjs --laraskills-root /path/to/laraskills',
    '',
    '  Run doctor for diagnostics:',
    '    laraskills doctor',
    '',
    'Temporary compatibility fallbacks: --ecc-root, ECC_ROOT, and the old config directory.',
  ].join('\n');
  return {
    isError: true,
    content: [{ type: 'text', text: message }],
  };
}
