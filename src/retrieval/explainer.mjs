export function generateExplanation(bundle, options) {
  const explanation = {
    query: bundle.query,
    mode: bundle.mode,
    retrievalStrategy: buildStrategyDescription(bundle, options),
    domainSelection: explainDomainSelection(bundle),
    topKuSelection: explainKuSelection(bundle),
    scoreMethodology: 'Weighted signal-based deterministic scoring. Each result receives a score from configurable weights. Higher scores indicate stronger relevance. Tie-breaking is lexicographic by KU ID.',
    appliedAliases: bundle.explanation?.appliedAliases || [],
    signalsUsed: [
      { name: 'exactKuName', weight: 100, description: 'Exact match between query and canonical KU name' },
      { name: 'exactAlias', weight: 95, description: 'Query matched a known alias for this KU' },
      { name: 'exactSkill', weight: 90, description: 'KU has an associated skill entry' },
      { name: 'domainRoute', weight: 45, description: 'KU belongs to a routed domain' },
      { name: 'tokenOverlap', weight: '10-35', description: 'Token overlap between query and KU metadata' },
    ],
  };

  if (bundle.warnings && bundle.warnings.length > 0) {
    explanation.warnings = bundle.warnings;
  }

  return explanation;
}

function buildStrategyDescription(bundle, options) {
  const parts = [];
  parts.push(`Mode: ${bundle.mode}`);
  if (bundle.knowledgeUnits && bundle.knowledgeUnits.length > 0) {
    parts.push(`Selected ${bundle.knowledgeUnits.length} KUs from ${bundle.selectedDomains?.length || 0} domains`);
  }
  if (bundle.prerequisites && bundle.prerequisites.length > 0) {
    parts.push(`Expanded ${bundle.prerequisites.length} prerequisites`);
  }
  if (bundle.relatedTopics && bundle.relatedTopics.length > 0) {
    parts.push(`Expanded ${bundle.relatedTopics.length} related topics`);
  }
  return parts.join('. ') + '.';
}

function explainDomainSelection(bundle) {
  if (!bundle.selectedDomains || bundle.selectedDomains.length === 0) return [];
  return bundle.selectedDomains.map(d => ({
    id: d.id,
    name: d.name,
    score: d.score,
    reason: d.reason || 'Domain match from query analysis',
  }));
}

function explainKuSelection(bundle) {
  if (!bundle.knowledgeUnits || bundle.knowledgeUnits.length === 0) return [];
  return bundle.knowledgeUnits.slice(0, 5).map(ku => ({
    id: ku.id,
    score: ku.score,
    signals: ku.breakdown?.map(b => `${b.signal} (+${b.value})`) || [],
    source: ku.sourcePath || '',
  }));
}

export function explainSearchResults(results, catalog) {
  return results.slice(0, 10).map(r => ({
    id: r.id,
    score: r.score,
    domain: r.ku?.domain || '',
    subdomain: r.ku?.subdomain || '',
    breakdown: r.breakdown || [],
    sourceFound: r.ku?.directory ? `${r.ku.directory}/04-standardized-knowledge.md` : '',
  }));
}
