import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MODE_CONFIG, DOMAIN_NAMES } from './config.mjs';

const ARTIFACT_FILES = {
  rules: { file: '05-rules.md', label: 'Rules' },
  skills: { file: '06-skills.md', label: 'Skills' },
  decisionTrees: { file: '07-decision-trees.md', label: 'Decision Trees' },
  antiPatterns: { file: '08-anti-patterns.md', label: 'Anti-Patterns' },
  checklists: { file: '09-checklists.md', label: 'Checklists' },
};

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

function loadArtifactContent(eccRoot, directory, file) {
  if (!directory || !eccRoot) return null;
  const filePath = join(eccRoot, directory, file);
  if (!existsSync(filePath)) return null;
  try {
    return readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function extractHeadings(content) {
  if (!content) return [];
  const headings = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^#{2,4}\s+(.+)/);
    if (match) headings.push(match[1].trim());
  }
  return headings.slice(0, 10);
}

function extractListItems(content) {
  if (!content) return [];
  const items = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^[-*]\s+(.+)/);
    if (match) items.push(match[1].trim());
  }
  return items.slice(0, 8);
}

function extractKeyEntries(content) {
  if (!content) return [];
  const entries = [];
  const lines = content.split('\n');
  let inCodeBlock = false;
  for (const line of lines) {
    if (line.trim().startsWith('```')) { inCodeBlock = !inCodeBlock; continue; }
    if (inCodeBlock) continue;
    const headingMatch = line.match(/^##+\s+(.+)/);
    if (headingMatch) {
      entries.push({ type: 'heading', text: headingMatch[1].trim() });
      continue;
    }
    const itemMatch = line.match(/^[-*]\s+(.+)/);
    if (itemMatch) {
      entries.push({ type: 'item', text: itemMatch[1].trim() });
      continue;
    }
  }
  return entries.slice(0, 15);
}

function processArtifactForKu(eccRoot, directory, artifactType, config) {
  const configEntry = ARTIFACT_FILES[artifactType];
  if (!configEntry) return null;
  if (artifactType === 'decisionTrees' && !config.includeDecisionTrees) return null;
  if (artifactType === 'antiPatterns' && !config.includeAntiPatterns) return null;

  const content = loadArtifactContent(eccRoot, directory, configEntry.file);
  if (!content) return null;

  const lines = content.length;
  let extracted = null;

  if (config.loadContent) {
    extracted = content.slice(0, 2000);
  } else {
    const headings = extractHeadings(content);
    const items = extractListItems(content);
    extracted = { headings, items, lines };
  }

  return extracted;
}

export function buildContextBundle(options, rankedKus, graphResult, routes, aliasResult, domainAnalysis, catalog) {
  const mode = MODE_CONFIG[options.mode] || MODE_CONFIG.standard;
  const eccRoot = options.eccRoot || null;

  const effectiveMaxKus = options.maxKus || mode.maxKus;
  const effectiveMaxRules = options.maxRules || mode.maxRules;
  const effectiveMaxSkills = options.maxSkills || mode.maxSkills;

  const selectedKus = rankedKus.slice(0, effectiveMaxKus);
  const selectedKuIdsSet = new Set(selectedKus.map(k => k.id));

  const bundledRules = [];
  const bundledSkills = [];
  const bundledDecisionTrees = [];
  const bundledAntiPatterns = [];
  const bundledChecklists = [];
  const seenIds = { rules: new Set(), skills: new Set(), decisionTrees: new Set(), antiPatterns: new Set(), checklists: new Set() };

  for (const ku of selectedKus) {
    const kuObj = ku.ku || {};
    const directory = kuObj.directory || '';

    const rulesContent = processArtifactForKu(eccRoot, directory, 'rules', mode);
    if (rulesContent && !seenIds.rules.has(`${ku.id}/rules`)) {
      seenIds.rules.add(`${ku.id}/rules`);
      bundledRules.push({
        id: `${ku.id}/rules`,
        domain: kuObj.domain,
        forKuId: ku.id,
        summary: `Rules for ${kuObj.knowledge_unit || ku.id}`,
        actionable: rulesContent,
        sourceFile: `${directory}/05-rules.md`,
      });
    }

    const skillsContent = processArtifactForKu(eccRoot, directory, 'skills', mode);
    if (skillsContent && !seenIds.skills.has(`${ku.id}/skills`)) {
      seenIds.skills.add(`${ku.id}/skills`);
      bundledSkills.push({
        id: `${ku.id}/skills`,
        domain: kuObj.domain,
        forKuId: ku.id,
        summary: `Skills for ${kuObj.knowledge_unit || ku.id}`,
        actionable: skillsContent,
        sourceFile: `${directory}/06-skills.md`,
      });
    }

    if (mode.includeDecisionTrees) {
      const dtContent = processArtifactForKu(eccRoot, directory, 'decisionTrees', mode);
      if (dtContent && !seenIds.decisionTrees.has(`${ku.id}/decision-trees`)) {
        seenIds.decisionTrees.add(`${ku.id}/decision-trees`);
        bundledDecisionTrees.push({
          id: `${ku.id}/decision-trees`,
          domain: kuObj.domain,
          forKuId: ku.id,
          summary: `Decision Trees for ${kuObj.knowledge_unit || ku.id}`,
          actionable: dtContent,
          sourceFile: `${directory}/07-decision-trees.md`,
        });
      }
    }

    if (mode.includeAntiPatterns) {
      const apContent = processArtifactForKu(eccRoot, directory, 'antiPatterns', mode);
      if (apContent && !seenIds.antiPatterns.has(`${ku.id}/anti-patterns`)) {
        seenIds.antiPatterns.add(`${ku.id}/anti-patterns`);
        bundledAntiPatterns.push({
          id: `${ku.id}/anti-patterns`,
          domain: kuObj.domain,
          forKuId: ku.id,
          summary: `Anti-Patterns for ${kuObj.knowledge_unit || ku.id}`,
          actionable: apContent,
          sourceFile: `${directory}/08-anti-patterns.md`,
        });
      }
    }

    const checkContent = processArtifactForKu(eccRoot, directory, 'checklists', mode);
    if (checkContent && !seenIds.checklists.has(`${ku.id}/checklists`)) {
      seenIds.checklists.add(`${ku.id}/checklists`);
      bundledChecklists.push({
        id: `${ku.id}/checklists`,
        domain: kuObj.domain,
        forKuId: ku.id,
        summary: `Checklists for ${kuObj.knowledge_unit || ku.id}`,
        actionable: checkContent,
        sourceFile: `${directory}/09-checklists.md`,
      });
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
    rules: bundledRules.slice(0, effectiveMaxRules),
    skills: bundledSkills.slice(0, effectiveMaxSkills),
  };

  if (mode.includeDecisionTrees) {
    bundle.decisionTrees = bundledDecisionTrees.slice(0, effectiveMaxRules);
  }

  if (mode.includeAntiPatterns) {
    bundle.antiPatterns = bundledAntiPatterns.slice(0, effectiveMaxRules);
  }

  bundle.checklists = bundledChecklists.slice(0, 3);

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
      signals: ku.breakdown ? ku.breakdown.map(b => `${b.signal}: ${b.value}`).join(', ') : '',
    })),
  };

  return bundle;
}
