function scoreTag(score) {
  if (score >= 90) return '★ HIGH';
  if (score >= 60) return '● MEDIUM';
  return '○ LOW';
}

function formatActionable(actionable, mode) {
  if (!actionable) return '';
  if (typeof actionable === 'string') {
    const lines = actionable.split('\n').filter(l => l.trim());
    const truncated = lines.slice(0, 15);
    return truncated.map(l => `    ${l.trim()}`).join('\n');
  }
  const parts = [];
  if (actionable.headings && actionable.headings.length > 0) {
    parts.push('    Topics:');
    for (const h of actionable.headings.slice(0, 5)) {
      parts.push(`      - ${h}`);
    }
  }
  if (actionable.items && actionable.items.length > 0) {
    parts.push('    Key items:');
    for (const item of actionable.items.slice(0, 5)) {
      parts.push(`      - ${item}`);
    }
  }
  return parts.join('\n');
}

function formatDomainSection(domains) {
  if (!domains || domains.length === 0) return '';
  const lines = ['## Selected Domains', ''];
  for (const d of domains) {
    lines.push(`- **${d.name}** \`${d.id}\``);
    lines.push(`  - Score: ${d.score} — ${d.reason || ''}`);
    lines.push('');
  }
  return lines.join('\n');
}

function formatKuSection(kus) {
  if (!kus || kus.length === 0) return '';
  const lines = ['## Knowledge Units', ''];
  for (const ku of kus) {
    lines.push(`### ${ku.name}`);
    lines.push(`- **ID:** \`${ku.id}\``);
    lines.push(`- **Domain:** ${ku.domain}`);
    lines.push(`- **Difficulty:** ${ku.difficulty}`);
    lines.push(`- **Score:** ${ku.score} ${scoreTag(ku.score)}`);
    lines.push(`- **Source:** \`${ku.sourcePath}\``);
    if (ku.breakdown && ku.breakdown.length > 0) {
      lines.push('- **Score breakdown:**');
      for (const b of ku.breakdown) {
        lines.push(`  - ${b.signal}: +${b.value} (${b.detail})`);
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}

function formatArtifactSection(title, items, label) {
  if (!items || items.length === 0) return '';
  const lines = [`## ${title}`, ''];
  for (const item of items) {
    lines.push(`- **${item.id}**`);
    if (item.summary) lines.push(`  - Summary: ${item.summary}`);
    if (item.actionable) {
      const formatted = formatActionable(item.actionable, 'standard');
      if (formatted) lines.push(formatted);
    }
    if (item.sourceFile) lines.push(`  - Source: \`${item.sourceFile}\``);
    if (item.forKuId) lines.push(`  - For KU: \`${item.forKuId}\``);
    lines.push('');
  }
  return lines.join('\n');
}

function formatListSection(title, items, idField, reasonField) {
  if (!items || items.length === 0) return '';
  const lines = [`## ${title}`, ''];
  for (const item of items) {
    const idVal = item[idField] || item.id;
    lines.push(`- **\`${idVal}\`**`);
    if (item[reasonField] || item.reason) {
      lines.push(`  - Reason: ${item[reasonField] || item.reason}`);
    }
    if (item.depth !== undefined) {
      lines.push(`  - Depth: ${item.depth}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

export function formatAsMarkdown(bundle) {
  const lines = [];

  lines.push(`# ECC Context Bundle`);
  lines.push('');
  lines.push(`**Query:** ${bundle.query}`);
  const budgetLabel = { compact: '~2K', standard: '~6K', deep: '~15K+' }[bundle.mode] || '~6K';
  lines.push(`**Mode:** ${bundle.mode} (${budgetLabel} tokens)`);
  lines.push(`**Estimated tokens:** ${bundle.estimatedTokens}`);
  lines.push('');

  const domainText = formatDomainSection(bundle.selectedDomains);
  if (domainText) lines.push(domainText);

  if (bundle.knowledgeUnits && bundle.knowledgeUnits.length > 0) {
    lines.push(formatKuSection(bundle.knowledgeUnits));
  }

  if (bundle.rules && bundle.rules.length > 0) {
    lines.push(formatArtifactSection('Applicable Rules', bundle.rules, 'rule'));
  }

  if (bundle.skills && bundle.skills.length > 0) {
    lines.push(formatArtifactSection('Recommended Skills', bundle.skills, 'skill'));
  }

  if (bundle.decisionTrees && bundle.decisionTrees.length > 0) {
    lines.push(formatArtifactSection('Decision Trees', bundle.decisionTrees, 'decision tree'));
  }

  if (bundle.antiPatterns && bundle.antiPatterns.length > 0) {
    lines.push(formatArtifactSection('Anti-Patterns', bundle.antiPatterns, 'anti-pattern'));
  }

  if (bundle.checklists && bundle.checklists.length > 0) {
    lines.push(formatArtifactSection('Checklists', bundle.checklists, 'checklist'));
  }

  if (bundle.prerequisites && bundle.prerequisites.length > 0) {
    lines.push(formatListSection('Prerequisites', bundle.prerequisites, 'id', 'reason'));
  }

  if (bundle.relatedTopics && bundle.relatedTopics.length > 0) {
    lines.push(formatListSection('Related Topics', bundle.relatedTopics, 'id', 'reason'));
  }

  if (bundle.externalConcepts && bundle.externalConcepts.length > 0) {
    lines.push(formatListSection('External Concepts', bundle.externalConcepts, 'name', 'reason'));
  }

  if (bundle.warnings && bundle.warnings.length > 0) {
    lines.push('## Warnings');
    lines.push('');
    for (const w of bundle.warnings) {
      lines.push(`- ⚠ ${w}`);
    }
    lines.push('');
  }

  lines.push('## Explanation');
  lines.push('');

  if (bundle.explanation && bundle.explanation.appliedAliases && bundle.explanation.appliedAliases.length > 0) {
    lines.push('### Applied Aliases');
    lines.push('');
    for (const a of bundle.explanation.appliedAliases) {
      lines.push(`- "${a.alias}" → \`${a.matches}\` (${a.matchType})`);
    }
    lines.push('');
  }

  if (bundle.explanation && bundle.explanation.rankingSummary && bundle.explanation.rankingSummary.length > 0) {
    lines.push('### Top Ranking Signals');
    lines.push('');
    for (const r of bundle.explanation.rankingSummary) {
      lines.push(`- \`${r.id}\`: score ${r.score} — ${r.signals}`);
    }
    lines.push('');
  }

  if (!bundle.explanation || (bundle.explanation.appliedAliases && bundle.explanation.appliedAliases.length === 0)) {
    lines.push('No aliases were applied. The query was routed using domain keyword matching and token overlap scoring.');
    lines.push('');
  }

  return lines.join('\n');
}

export function formatAsJson(bundle) {
  return JSON.stringify(bundle, null, 2);
}

export function formatKuDetail(ku, catalog, includeContent) {
  const lines = [];
  lines.push(`# ${ku.knowledge_unit || ku.id}`);
  lines.push('');
  lines.push(`- **ID:** \`${ku.id}\``);
  lines.push(`- **Domain:** ${ku.domain}`);
  lines.push(`- **Subdomain:** ${ku.subdomain}`);
  lines.push(`- **Difficulty:** ${ku.difficulty || 'unknown'}`);
  lines.push(`- **Directory:** \`${ku.directory || ''}\``);
  lines.push('');

  const dependencies = catalog.dependencies.edges
    .filter(e => e.target === ku.id || e.source === ku.id);
  if (dependencies.length > 0) {
    lines.push('## Dependencies');
    lines.push('');
    for (const dep of dependencies) {
      const dir = dep.target === ku.id ? '← required by' : '→ requires';
      lines.push(`- \`${dep.source}\` ${dir} \`${dep.target}\``);
    }
    lines.push('');
  }

  const related = catalog.relationships.edges
    .filter(e => e.source === ku.id || e.target === ku.id);
  if (related.length > 0) {
    lines.push('## Related Topics');
    lines.push('');
    for (const rel of related) {
      const other = rel.source === ku.id ? rel.target : rel.source;
      lines.push(`- \`${other}\` — ${rel.reason || ''}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
