import { z } from 'zod';

export const retrieveContextInputSchema = z.object({
  task: z.string().min(1).max(2000).describe(
    'Natural-language Laravel engineering task description.',
  ),
  mode: z.enum(['compact', 'standard', 'deep']).default('standard').describe(
    'Bundle size: compact (quick routing), standard (default), or deep (full research).',
  ),
  max_kus: z.number().int().min(1).max(50).default(10).describe(
    'Maximum number of knowledge units to include in the bundle.',
  ),
  max_rules: z.number().int().min(0).max(50).default(10).describe(
    'Maximum number of rules to include.',
  ),
  max_skills: z.number().int().min(0).max(50).default(6).describe(
    'Maximum number of skills to include.',
  ),
  max_related: z.number().int().min(0).max(50).default(6).describe(
    'Maximum number of related topics to include.',
  ),
  max_prerequisites: z.number().int().min(0).max(50).default(6).describe(
    'Maximum number of prerequisites to include.',
  ),
  prerequisite_depth: z.number().int().min(0).max(5).default(1).describe(
    'Graph expansion depth for prerequisite lookup.',
  ),
  related_depth: z.number().int().min(0).max(5).default(1).describe(
    'Graph expansion depth for related-topic lookup.',
  ),
  budget: z.number().int().min(256).max(200000).default(6000).describe(
    'Estimated token budget for the returned bundle.',
  ),
  domain: z.string().min(1).max(200).optional().describe(
    'Optional domain filter (e.g. "security-identity-engineering").',
  ),
});

export const searchInputSchema = z.object({
  query: z.string().min(1).max(500).describe('Search query string.'),
  limit: z.number().int().min(1).max(100).default(10).describe(
    'Maximum number of results to return.',
  ),
  domain: z.string().min(1).max(200).optional().describe(
    'Optional domain filter.',
  ),
});

export const knowledgeUnitInputSchema = z.object({
  id: z.string().min(1).max(500).describe('Canonical knowledge unit ID.'),
  include_content: z.boolean().default(false).describe(
    'Whether to include bounded Markdown content for the KU.',
  ),
  artifact_types: z.array(
    z.enum([
      'knowledge',
      'rules',
      'skills',
      'decision_trees',
      'anti_patterns',
      'checklists',
    ]),
  ).default([
    'knowledge',
    'rules',
    'skills',
    'decision_trees',
    'anti_patterns',
    'checklists',
  ]).describe(
    'Subset of artifact summaries to include.',
  ),
});

export const graphContextInputSchema = z.object({
  id: z.string().min(1).max(500).describe('Canonical knowledge unit ID.'),
  prerequisite_depth: z.number().int().min(0).max(5).default(1).describe(
    'Prerequisite expansion depth.',
  ),
  related_depth: z.number().int().min(0).max(5).default(1).describe(
    'Related-topic expansion depth.',
  ),
  max_prerequisites: z.number().int().min(0).max(100).default(10).describe(
    'Maximum number of prerequisites to return.',
  ),
  max_related: z.number().int().min(0).max(100).default(10).describe(
    'Maximum number of related topics to return.',
  ),
});

export const validateInputSchema = z.object({}).strict().describe(
  'No input required.',
);

const signalSchema = z.object({
  signal: z.string(),
  value: z.number(),
  detail: z.string().optional(),
});

const knowledgeUnitSummarySchema = z.object({
  id: z.string(),
  domain: z.string(),
  subdomain: z.string(),
  name: z.string(),
  difficulty: z.string(),
  score: z.number(),
  breakdown: z.array(signalSchema),
  directory: z.string(),
  sourcePath: z.string(),
});

const artifactSummarySchema = z.object({
  id: z.string(),
  domain: z.string(),
  forKuId: z.string(),
  summary: z.string(),
  sourceFile: z.string(),
});

const graphNodeSchema = z.object({
  id: z.string(),
  sourceKuId: z.string().optional(),
  reason: z.string().optional(),
  depth: z.number().optional(),
  strength: z.string().optional(),
});

const externalConceptSchema = z.object({
  id: z.string(),
  name: z.string(),
  reason: z.string().optional(),
});

const domainSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  score: z.number().optional(),
  reason: z.string().optional(),
});

export const bundleOutputSchema = z.object({
  query: z.string(),
  mode: z.string(),
  estimatedTokens: z.number(),
  selectedDomains: z.array(domainSummarySchema),
  knowledgeUnits: z.array(knowledgeUnitSummarySchema),
  rules: z.array(artifactSummarySchema),
  skills: z.array(artifactSummarySchema),
  decisionTrees: z.array(artifactSummarySchema).optional(),
  antiPatterns: z.array(artifactSummarySchema).optional(),
  checklists: z.array(artifactSummarySchema),
  prerequisites: z.array(graphNodeSchema),
  relatedTopics: z.array(graphNodeSchema),
  externalConcepts: z.array(externalConceptSchema),
  warnings: z.array(z.string()),
  explanation: z.object({
    appliedAliases: z.array(z.object({
      alias: z.string(),
      matches: z.union([z.string(), z.array(z.string())]).optional(),
      matchType: z.string().optional(),
    })),
    rankingSummary: z.array(z.object({
      id: z.string(),
      score: z.number(),
      signals: z.string(),
    })),
  }),
});

const searchHitSchema = z.object({
  id: z.string(),
  score: z.number(),
  domain: z.string(),
  subdomain: z.string(),
  name: z.string(),
  breakdown: z.array(signalSchema),
  sourcePath: z.string(),
});

export const searchResultListSchema = z.object({
  query: z.string(),
  count: z.number(),
  results: z.array(searchHitSchema),
});

export const knowledgeUnitOutputSchema = z.object({
  id: z.string(),
  metadata: z.object({
    id: z.string(),
    domain: z.string(),
    subdomain: z.string(),
    knowledge_unit: z.string().optional(),
    difficulty: z.string().optional(),
    directory: z.string().optional(),
    has_skills: z.boolean().optional(),
    has_rules: z.boolean().optional(),
    has_checklists: z.boolean().optional(),
    has_decision_trees: z.boolean().optional(),
    has_anti_patterns: z.boolean().optional(),
  }),
  artifact_summaries: z.array(z.object({
    artifact_type: z.string(),
    available: z.boolean(),
    source_file: z.string().optional(),
  })),
  content: z.string().optional(),
  detail: z.string().optional(),
});

export const graphContextOutputSchema = z.object({
  id: z.string(),
  prerequisites: z.array(graphNodeSchema),
  relatedTopics: z.array(graphNodeSchema),
  totalPrerequisitesFound: z.number().optional(),
  totalRelatedFound: z.number().optional(),
  truncated: z.boolean().optional(),
});

export const validationOutputSchema = z.object({
  valid: z.boolean(),
  knowledgeUnitCount: z.number(),
  dependencyEdgeCount: z.number(),
  relationshipEdgeCount: z.number(),
  aliasesCount: z.number(),
  externalConceptsCount: z.number(),
  cycleCount: z.number(),
  selfLoopCount: z.number(),
  danglingEdgeCount: z.number(),
  issues: z.array(z.string()),
});

export const errorOutputSchema = z.object({
  error: z.string(),
  code: z.string(),
  hint: z.string().optional(),
});
