import {
  retrieveContext,
  searchKnowledge,
  getKnowledgeUnit,
  getPrerequisites,
  getRelatedTopics,
  validateIntelligence,
} from '../../src/retrieval/index.mjs';
import { loadCatalog } from '../../src/retrieval/catalog-loader.mjs';
import { getPackagedIntelligenceRoot } from '../../src/runtime/packaged-root.mjs';
import {
  retrieveContextInputSchema,
  searchInputSchema,
  knowledgeUnitInputSchema,
  graphContextInputSchema,
  validateInputSchema,
} from './schemas.mjs';
import { existsSync, readFileSync } from 'node:fs';
import { dirname as pathDirname, join as pathJoin } from 'node:path';
import { fileURLToPath as urlToFilePath } from 'node:url';
import {
  readRegistry,
  getRegistryPath,
  validateRegistry,
  getRegistrySummary,
} from '../../src/runtime/skill-registry.mjs';

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

const __handlerDirname = pathDirname(urlToFilePath(import.meta.url));
const HANDLER_ROOT = pathJoin(__handlerDirname, '..', '..');

export function buildListSkillsResult(target) {
  const summary = getRegistrySummary(target || process.cwd());
  if (!summary.exists) {
    return {
      text: 'No LaraSkills skill registry found. Run "laraskills init" or "laraskills update" to generate the registry.',
      structured: { version: '0.0.0', skillCount: 0, skills: [] },
    };
  }
  return {
    text: `LaraSkills v${summary.version || 'unknown'} — ${summary.skillCount} skills installed.\n\n${summary.skills.map((s, i) => `${i + 1}. ${s.name}: ${s.description}`).join('\n')}`,
    structured: { version: summary.version || 'unknown', skillCount: summary.skillCount, skills: summary.skills },
  };
}

export function buildSearchSkillsResult(query, target) {
  const summary = getRegistrySummary(target || process.cwd());
  if (!summary.exists || summary.skillCount === 0) {
    return { text: `No skills found matching "${query}".`, structured: { query, count: 0, results: [] } };
  }
  const q = query.toLowerCase();
  const results = summary.skills
    .map(s => {
      let score = 0;
      if (s.name.toLowerCase().includes(q)) score += 100;
      if (s.description.toLowerCase().includes(q)) score += 50;
      const tagMatch = s.tags.filter(t => t.toLowerCase().includes(q));
      if (tagMatch.length > 0) score += tagMatch.length * 25;
      return { name: s.name, description: s.description, tags: s.tags, matchScore: score };
    })
    .filter(r => r.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 20);
  return {
    text: results.length === 0 ? `No skills found matching "${query}".` : `Found ${results.length} skills for "${query}":\n${results.map((r, i) => `${i + 1}. ${r.name} (score: ${r.matchScore}): ${r.description}`).join('\n')}`,
    structured: { query, count: results.length, results },
  };
}

export function buildReadSkillResult(name, target) {
  const registry = readRegistry(target || process.cwd());
  if (!registry) {
    return { notFound: true, message: 'No skill registry found. Run "laraskills init" or "laraskills update" to generate it.' };
  }
  const skill = registry.skills.find(s => s.name === name);
  if (!skill) {
    return { notFound: true, message: `Skill "${name}" not found in registry. Use list_skills to see available skills.` };
  }
  const tgt = target || process.cwd();
  const skillPath = pathJoin(tgt, skill.path);
  let content = '';
  try {
    if (existsSync(skillPath)) {
      content = readFileSync(skillPath, 'utf-8');
    }
  } catch { content = ''; }
  if (!content) {
    const altPath = pathJoin(HANDLER_ROOT, 'skills', name, 'SKILL.md');
    try {
      if (existsSync(altPath)) content = readFileSync(altPath, 'utf-8');
    } catch { content = ''; }
  }
  const text = content
    ? `Skill: ${name}\nPath: ${skill.path}\nDescription: ${skill.description}\nTags: ${skill.tags.join(', ')}\n\n${content.substring(0, 5000)}${content.length > 5000 ? '\n\n[Content truncated at 5000 characters. Content length: ' + content.length + ']' : ''}`
    : `Skill: ${name}\nPath: ${skill.path}\nDescription: ${skill.description}\nTags: ${skill.tags.join(', ')}\n\n[Content not available on disk. Run "laraskills update" to refresh.]`;
  return {
    name: skill.name,
    path: skill.path,
    description: skill.description,
    tags: skill.tags,
    content,
    contentLength: content.length,
    notFound: false,
    text,
  };
}

export function buildExplainDecisionResult(decision, mode) {
  const lc = decision.toLowerCase();
  const guidance = [];
  const rules = [];
  const antiPatterns = [];

  if (lc.includes('repository') || lc.includes('eloquent') || lc.includes('active record')) {
    guidance.push('Eloquent is an Active Record ORM with rich querying and persistence behavior.');
    guidance.push('You usually do not need a repository around every Eloquent model unless there is a genuine persistence boundary, multiple data sources, or complex query contracts.');
    guidance.push('For most Laravel applications, prefer direct Eloquent in Actions or domain services. Introduce repositories only when they create a meaningful abstraction boundary.');
    rules.push('Prefer direct Eloquent over unnecessary repository wrappers');
    rules.push('Use repositories only at genuine persistence boundaries or multi-source scenarios');
    antiPatterns.push('Wrapping every Eloquent model in a Repository that adds no value');
  }

  if (lc.includes('queue') || lc.includes('job') || lc.includes('serialize')) {
    guidance.push('Laravel can serialize queued Eloquent models by identifier.');
    guidance.push('For high-risk billing, webhook, reconciliation, tenant, and permission jobs, prefer IDs or immutable external provider IDs for freshness, replay, and idempotency.');
    guidance.push('For low-risk notification jobs, passing models can be acceptable if missing/deleted models are handled gracefully.');
    rules.push('Avoid passing models to jobs for billing, webhook, and tenant-critical operations');
    rules.push('Prefer explicit IDs or immutable provider IDs for high-risk queued jobs');
    antiPatterns.push('Blindly passing models to every queued job without considering freshness, missing/deleted model edges, and replay safety');
  }

  if (lc.includes('global scope') || lc.includes('tenantscope')) {
    guidance.push('Avoid hiding business-critical tenant isolation in ad-hoc global scopes.');
    guidance.push('Prefer explicit tenant scoping or a well-tested tenancy package.');
    guidance.push('If using global scopes, test CLI, queue, admin bypass, and cross-tenant behavior.');
    rules.push('Prefer explicit scoping over hidden global scopes for tenant isolation');
    rules.push('Test global scope escape hatches (withoutGlobalScope) if used');
    antiPatterns.push('Relying on global scopes as the only tenant isolation mechanism without testing CLI/queue/cross-tenant behavior');
  }

  if (lc.includes('cashier') || lc.includes('stripe') || lc.includes('billing') || lc.includes('subscription')) {
    guidance.push('Cashier is a strong default for standard Stripe subscription SaaS.');
    guidance.push('Cashier does not replace production billing architecture. Still design: webhook idempotency, audit logs, reconciliation, entitlement checks, failure alerts, manual replay, and business-specific tests.');
    rules.push('Design billing architecture independently of Cashier\'s convenient abstractions');
    rules.push('Always implement webhook idempotency, reconciliation, and audit logging for billing');
    antiPatterns.push('Assuming Cashier handles all billing edge cases without custom reconciliation and idempotency');
  }

  if (lc.includes('webhook') || lc.includes('web hook')) {
    guidance.push('Webhook controllers should do minimal synchronous work: 1) verify signature, 2) persist raw event/idempotency record if required, 3) dispatch job after commit where relevant, 4) return 2xx quickly.');
    guidance.push('All business effects should happen asynchronously in idempotent jobs.');
    rules.push('Webhook controller: verify, persist, dispatch, respond (minimal sync work)');
    rules.push('Process webhook business effects in idempotent queued jobs');
    antiPatterns.push('Processing all webhook business logic synchronously in the controller before responding');
  }

  if (lc.includes('spatie') || lc.includes('permission') || lc.includes('role') && lc.includes('team')) {
    guidance.push('For Spatie Permission with teams: ensure guard name consistency across roles and permissions.');
    guidance.push('Configure teams support explicitly and manage current team context via middleware.');
    guidance.push('Separate platform roles from team roles; test policy vs entitlement separation.');
    guidance.push('Test cross-team access, viewAny behavior, and API token permissions vs team roles.');
    rules.push('Maintain guard name consistency with Spatie Permission teams');
    rules.push('Test cross-team authorization, API token scopes vs team roles');
    antiPatterns.push('Mixing platform and team roles without clear separation and test coverage');
  }

  if (guidance.length === 0) {
    guidance.push('For Laravel architectural decisions: follow the Controller → Action → Domain Service → Contract → Infrastructure flow.');
    guidance.push('Prefer constructor injection over facades. Depend on contracts, not concrete implementations.');
    guidance.push('Use PHP 8 attributes for model configuration (#[Fillable], #[Table], #[Casts]).');
    guidance.push('Organize by feature/domain (app/Modules/User/), not by type (app/Models/).');
    rules.push('Follow Controller → Action → Service → Contract → Infrastructure architecture');
    rules.push('Use constructor injection; depend on contracts');
  }

  const recommendation = guidance[0] || 'Evaluate trade-offs based on project context. Prefer simpler patterns over over-engineering.';

  const result = {
    decision,
    guidance: guidance.join('\n\n'),
    mode,
    relevantRules: rules,
    relevantAntiPatterns: antiPatterns,
    recommendation,
  };

  const text = `# ${decision}\n\n## Guidance\n\n${guidance.join('\n\n')}\n\n## Relevant Rules\n\n${rules.map(r => `- ${r}`).join('\n')}\n\n## Anti-Patterns to Avoid\n\n${antiPatterns.map(a => `- ${a}`).join('\n')}\n\n## Recommendation\n\n${recommendation}`;
  return { ...result, text };
}

export function describeForAgents() {
  return [
    'LaraSkills MCP server. Always use `retrieve_context_bundle` (or alias `laraskills_retrieve_context`) first for any non-trivial Laravel task.',
    'Search with `search_ecc` (or alias `laraskills_search_knowledge`) to discover KUs by topic. Results include canonical IDs you can copy-paste directly into `get_knowledge_unit` and `get_graph_context`.',
    'Deep-inspect with `get_knowledge_unit` -- also accepts short IDs (last path segment) and aliases for convenience.',
    'Explore dependencies with `get_graph_context` -- prerequisites and related topics in one call.',
    'Check integrity with `validate_ecc`.',
    'Discover skills with `laraskills_list_skills`, search with `laraskills_search_skills`, read skill content with `laraskills_read_skill`.',
    'Evaluate architectural decisions with `laraskills_explain_decision` (e.g., repository pattern, queued jobs, billing, webhooks).',
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
  const packagedRoot = getPackagedIntelligenceRoot();
  const hint = state.explicitLaraskillsRoot
    ? `Explicit --laraskills-root path failed: ${state.explicitLaraskillsRoot}`
    : state.explicitEccRoot
      ? `Deprecated --ecc-root path failed: ${state.explicitEccRoot}`
      : state.envLaraskillsRoot
        ? `LARASKILLS_ROOT path failed: ${state.envLaraskillsRoot}`
        : state.envEccRoot
          ? `Legacy ECC_ROOT path failed: ${state.envEccRoot}`
          : 'No configured root was found.';
  const packagedNote = packagedRoot
    ? 'Packaged intelligence is available — this error may indicate a corrupted npm installation. Try: npm install -g laraskills'
    : 'No packaged intelligence found — the npm package may be incomplete.';
  const message = [
    'LaraSkills intelligence files were not found.',
    hint,
    '',
    packagedNote,
    '',
    'Options:',
    '  Ensure the package is installed correctly:',
    '    npm install -g laraskills',
    '',
    '  Advanced: point to a custom checkout:',
    '    laraskills setup --laraskills-root /path/to/laraskills',
    '',
    '  Or set the environment variable:',
    '    LARASKILLS_ROOT=/path/to/laraskills',
    '',
    '  Run doctor for diagnostics:',
    '    laraskills doctor',
  ].join('\n');
  return {
    isError: true,
    content: [{ type: 'text', text: message }],
  };
}
