#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  retrieveContext,
  searchKnowledge,
  getKnowledgeUnit,
  getPrerequisites,
  getRelatedTopics,
  validateIntelligence,
} from '../src/retrieval/index.mjs';
import { resolveEccRootWithPrecedence } from '../src/runtime/ecc-root-resolver.mjs';
import { getPackagedIntelligenceRoot } from '../src/runtime/packaged-root.mjs';
import {
  bundleOutputSchema,
  searchResultListSchema,
  knowledgeUnitOutputSchema,
  graphContextOutputSchema,
  validationOutputSchema,
  errorOutputSchema,
  retrieveContextInputSchema,
  searchInputSchema,
  knowledgeUnitInputSchema,
  graphContextInputSchema,
  validateInputSchema,
} from './mcp/schemas.mjs';
import {
  buildRetrieveBundleResult,
  buildSearchResult,
  buildKnowledgeUnitResult,
  buildGraphContextResult,
  buildValidationResult,
  buildErrorResult,
  buildRootErrorResult,
  describeForAgents,
} from './mcp/handlers.mjs';
import {
  buildListSkillsResult,
  buildSearchSkillsResult,
  buildReadSkillResult,
  buildExplainDecisionResult,
} from './mcp/handlers.mjs';
import {
  listSkillsInputSchema,
  searchSkillsInputSchema,
  readSkillInputSchema,
  searchKnowledgeInputSchema as searchKnowledgeSchema,
  retrieveContextInputSchemaV2 as retrieveContextInputSchemaV2Schema,
  explainDecisionInputSchema,
  skillListOutputSchema,
  skillSearchOutputSchema,
  skillReadOutputSchema,
  decisionOutputSchema,
} from './mcp/schemas.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function readPackageVersion() {
  try {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function parseRootArgs(argv) {
  let explicitLaraskillsRoot = null;
  let explicitEccRoot = null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--laraskills-root') {
      const value = argv[i + 1];
      if (value && !value.startsWith('--')) explicitLaraskillsRoot = value;
    }
    if (arg.startsWith('--laraskills-root=')) {
      explicitLaraskillsRoot = arg.slice('--laraskills-root='.length);
    }
    if (arg === '--ecc-root') {
      const value = argv[i + 1];
      if (value && !value.startsWith('--')) explicitEccRoot = value;
    }
    if (arg.startsWith('--ecc-root=')) {
      explicitEccRoot = arg.slice('--ecc-root='.length);
    }
  }
  return { explicitLaraskillsRoot, explicitEccRoot };
}

function resolveRootState() {
  const { explicitLaraskillsRoot, explicitEccRoot } = parseRootArgs(process.argv.slice(2));
  try {
    const result = resolveEccRootWithPrecedence({
      explicitLaraskillsRoot,
      explicitEccRoot,
    });
    return {
      ok: true,
      root: result.root,
      source: result.source,
      valid: result.valid,
      legacyFallback: result.legacyFallback,
      legacyReason: result.legacyReason,
      explicitLaraskillsRoot,
      explicitEccRoot,
      envLaraskillsRoot: process.env.LARASKILLS_ROOT || null,
      envEccRoot: process.env.ECC_ROOT || null,
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message,
      explicitLaraskillsRoot,
      explicitEccRoot,
      envLaraskillsRoot: process.env.LARASKILLS_ROOT || null,
      envEccRoot: process.env.ECC_ROOT || null,
    };
  }
}

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

function errToStderr(prefix, err) {
  const message = err && err.message ? err.message : String(err);
  process.stderr.write(`[laraskills-mcp] ${prefix}: ${message}\n`);
}

function logInfo(message) {
  process.stderr.write(`[laraskills-mcp] ${message}\n`);
}

function makeToolErrorResult(message) {
  return buildErrorResult(message);
}

function makeRootErrorResult(state) {
  return buildRootErrorResult(state);
}

function safeStructured(schema, payload) {
  const parsed = schema.safeParse(payload);
  if (parsed.success) return parsed.data;
  return payload;
}

async function main() {
  const version = readPackageVersion();
  const state = resolveRootState();

  if (!state.ok) {
    logInfo(`LaraSkills root resolution failed. ${state.error}`);
  } else {
    logInfo(`LaraSkills root resolved at ${state.root} (${state.source})`);
    if (state.legacyFallback) {
      logInfo(`compatibility fallback active: ${state.legacyReason}`);
    }
  }

  const server = new McpServer(
    {
      name: 'laraskills',
      version,
    },
    {
      instructions: describeForAgents(),
    },
  );

  function withRoot(handler) {
    return async (args) => {
      if (!state.ok) return makeRootErrorResult(state);
      try {
        return await handler(args, state.root);
      } catch (err) {
        errToStderr('tool-error', err);
        return makeToolErrorResult(err.message || 'Unknown retrieval error');
      }
    };
  }

  server.registerTool(
    'retrieve_context_bundle',
    {
      title: 'Retrieve LaraSkills context bundle',
      description:
        'Return the smallest useful LaraSkills context bundle for a Laravel engineering task. ' +
        'Delegates directly to the existing retrieval core (same semantics as `npx laraskills retrieve`).',
      inputSchema: retrieveContextInputSchema,
      outputSchema: bundleOutputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withRoot(async (args, root) => {
      const result = buildRetrieveBundleResult(args, { eccRoot: root });
      return {
        content: [{ type: 'text', text: result.text }],
        structuredContent: safeStructured(bundleOutputSchema, result.structured),
      };
    }),
  );

  server.registerTool(
    'search_ecc',
    {
      title: 'Search LaraSkills knowledge units',
      description:
        'Search the LaraSkills knowledge unit catalog. ' +
        'Returns ranked KUs with scores, ranking signals, and source paths. ' +
        'Delegates to the existing retrieval core (same semantics as `npx laraskills search`).',
      inputSchema: searchInputSchema,
      outputSchema: searchResultListSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withRoot(async (args, root) => {
      const result = buildSearchResult(args, { eccRoot: root });
      return {
        content: [{ type: 'text', text: result.text }],
        structuredContent: safeStructured(searchResultListSchema, result.structured),
      };
    }),
  );

  server.registerTool(
    'get_knowledge_unit',
    {
      title: 'Get one knowledge unit',
      description:
        'Inspect a single canonical knowledge unit by ID. ' +
        'Supports bounded Markdown content inclusion and artifact-type filtering. ' +
        'Delegates to the existing retrieval core (same semantics as `npx laraskills get`).',
      inputSchema: knowledgeUnitInputSchema,
      outputSchema: knowledgeUnitOutputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withRoot(async (args, root) => {
      const result = buildKnowledgeUnitResult(args, { eccRoot: root });
      if (result.notFound) {
        return makeToolErrorResult(
          `Knowledge unit not found: ${args.id}. Use 'search_ecc' to find the correct canonical ID (e.g., search_ecc({ query: '${args.id.split('/').pop() || args.id}' })). Canonical IDs follow the pattern: domain/subdomain/knowledge-unit-name`
        );
      }
      return {
        content: [{ type: 'text', text: result.text }],
        structuredContent: safeStructured(knowledgeUnitOutputSchema, result.structured),
      };
    }),
  );

  server.registerTool(
    'get_graph_context',
    {
      title: 'Get graph context (prerequisites + related topics)',
      description:
        'Return prerequisites and related topics for a single knowledge unit in one call. ' +
        'Cycle-safe; respects depth and max limits. ' +
        'Delegates to the existing retrieval core (same semantics as `npx laraskills prerequisites` + `npx laraskills related`).',
      inputSchema: graphContextInputSchema,
      outputSchema: graphContextOutputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withRoot(async (args, root) => {
      const result = buildGraphContextResult(args, { eccRoot: root });
      if (result.notFound) {
        return makeToolErrorResult(
          `Knowledge unit not found: ${args.id}. Use 'search_ecc' to find the correct canonical ID (e.g., search_ecc({ query: '${args.id.split('/').pop() || args.id}' })). Canonical IDs follow the pattern: domain/subdomain/knowledge-unit-name`
        );
      }
      return {
        content: [{ type: 'text', text: result.text }],
        structuredContent: safeStructured(graphContextOutputSchema, result.structured),
      };
    }),
  );

  server.registerTool(
    'validate_ecc',
    {
      title: 'Validate LaraSkills intelligence layer',
      description:
        'Validate the structural integrity of the LaraSkills intelligence layer. ' +
        'Returns KU count, edge counts, cycle count, self-loop count, dangling-edge count, and an overall status. ' +
        'Delegates to the existing retrieval core (same semantics as `npx laraskills validate`).',
      inputSchema: validateInputSchema,
      outputSchema: validationOutputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withRoot(async (args, root) => {
      const result = buildValidationResult(args, { eccRoot: root });
      return {
        content: [{ type: 'text', text: result.text }],
        structuredContent: safeStructured(validationOutputSchema, result.structured),
      };
    }),
  );

  server.registerTool(
    'laraskills_list_skills',
    {
      title: 'List installed LaraSkills skills',
      description:
        'Returns all LaraSkills skills registered in the skill registry. ' +
        'Use this to discover available skills and their descriptions.',
      inputSchema: listSkillsInputSchema,
      outputSchema: skillListOutputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async () => {
      try {
        const result = buildListSkillsResult(process.cwd());
        return {
          content: [{ type: 'text', text: result.text }],
          structuredContent: safeStructured(skillListOutputSchema, result.structured),
        };
      } catch (err) {
        errToStderr('list-skills-error', err);
        return makeToolErrorResult(err.message || 'Unknown error listing skills');
      }
    },
  );

  server.registerTool(
    'laraskills_search_skills',
    {
      title: 'Search LaraSkills skills',
      description:
        'Search installed LaraSkills skills by name, description, and tags. ' +
        'Returns ranked results with match scores.',
      inputSchema: searchSkillsInputSchema,
      outputSchema: skillSearchOutputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (args) => {
      try {
        const { query, limit } = searchSkillsInputSchema.parse(args);
        const result = buildSearchSkillsResult(query, process.cwd());
        return {
          content: [{ type: 'text', text: result.text }],
          structuredContent: safeStructured(skillSearchOutputSchema, result.structured),
        };
      } catch (err) {
        errToStderr('search-skills-error', err);
        return makeToolErrorResult(err.message || 'Unknown error searching skills');
      }
    },
  );

  server.registerTool(
    'laraskills_read_skill',
    {
      title: 'Read a LaraSkills skill',
      description:
        'Read the full Markdown content of a LaraSkills skill. ' +
        'Use list_skills to discover available skill names.',
      inputSchema: readSkillInputSchema,
      outputSchema: skillReadOutputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (args) => {
      try {
        const { name } = readSkillInputSchema.parse(args);
        const result = buildReadSkillResult(name, process.cwd());
        if (result.notFound) {
          return makeToolErrorResult(result.message);
        }
        return {
          content: [{ type: 'text', text: result.text }],
          structuredContent: safeStructured(skillReadOutputSchema, {
            name: result.name,
            path: result.path,
            description: result.description,
            tags: result.tags,
            content: result.content,
            contentLength: result.contentLength,
          }),
        };
      } catch (err) {
        errToStderr('read-skill-error', err);
        return makeToolErrorResult(err.message || 'Unknown error reading skill');
      }
    },
  );

  server.registerTool(
    'laraskills_search_knowledge',
    {
      title: 'Search LaraSkills knowledge units',
      description:
        'Alias for search_ecc. Search the LaraSkills knowledge unit catalog. ' +
        'Returns ranked KUs with scores, ranking signals, and source paths.',
      inputSchema: searchKnowledgeSchema,
      outputSchema: searchResultListSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withRoot(async (args, root) => {
      const result = buildSearchResult(args, { eccRoot: root });
      return {
        content: [{ type: 'text', text: result.text }],
        structuredContent: safeStructured(searchResultListSchema, result.structured),
      };
    }),
  );

  server.registerTool(
    'laraskills_retrieve_context',
    {
      title: 'Retrieve LaraSkills context bundle',
      description:
        'Alias for retrieve_context_bundle. Return the smallest useful LaraSkills context bundle for a Laravel engineering task.',
      inputSchema: retrieveContextInputSchemaV2Schema,
      outputSchema: bundleOutputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withRoot(async (args, root) => {
      const result = buildRetrieveBundleResult(args, { eccRoot: root });
      return {
        content: [{ type: 'text', text: result.text }],
        structuredContent: safeStructured(bundleOutputSchema, result.structured),
      };
    }),
  );

  server.registerTool(
    'laraskills_explain_decision',
    {
      title: 'Explain a Laravel architectural decision',
      description:
        'Evaluate a Laravel architectural decision and return guidance, relevant rules, anti-patterns, and a recommendation. ' +
        'Supports topics such as repository patterns, queued jobs, billing, webhooks, and more.',
      inputSchema: explainDecisionInputSchema,
      outputSchema: decisionOutputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (args) => {
      try {
        const { decision, mode } = explainDecisionInputSchema.parse(args);
        const result = buildExplainDecisionResult(decision, mode);
        return {
          content: [{ type: 'text', text: result.text }],
          structuredContent: safeStructured(decisionOutputSchema, result),
        };
      } catch (err) {
        errToStderr('explain-decision-error', err);
        return makeToolErrorResult(err.message || 'Unknown error evaluating decision');
      }
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logInfo('stdio MCP server connected');

  let closing = false;
  async function shutdown(signal) {
    if (closing) return;
    closing = true;
    logInfo(`received ${signal}; shutting down`);
    try {
      await server.close();
    } catch (err) {
      errToStderr('close-error', err);
    }
    process.exit(0);
  }

  process.on('SIGINT', () => { void shutdown('SIGINT'); });
  process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
  process.on('disconnect', () => { void shutdown('disconnect'); });
}

main().catch((err) => {
  errToStderr('fatal', err);
  process.exit(1);
});
