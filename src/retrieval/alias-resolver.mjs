export function resolveAliases(aliases, queryTokens) {
  const resolved = [];
  const appliedAliases = [];

  const queryLower = queryTokens.map(t => t.toLowerCase().replace(/-/g, ' ')).join(' ');
  const querySet = new Set(queryTokens.map(t => t.toLowerCase()));
  const queryNormalized = queryLower.replace(/-/g, ' ');

  for (const alias of aliases) {
    const aliasLower = alias.alias.toLowerCase().replace(/-/g, ' ');
    const normalizedLower = alias.normalized_alias
      ? alias.normalized_alias.replace(/-/g, ' ').toLowerCase()
      : '';

    let matchType = null;

    if (queryNormalized === aliasLower) {
      matchType = 'exact';
    } else if (normalizedLower && queryNormalized === normalizedLower) {
      matchType = 'exact';
    } else if (queryNormalized.includes(aliasLower)) {
      matchType = 'substring';
    } else if (normalizedLower && queryNormalized.includes(normalizedLower)) {
      matchType = 'substring';
    } else {
      const aliasTokens = aliasLower.split(/\s+/).filter(t => t.length > 0);
      const matchCount = aliasTokens.filter(t => querySet.has(t)).length;
      if (matchCount >= Math.min(2, aliasTokens.length) && matchCount === aliasTokens.length) {
        matchType = 'token';
      } else if (matchCount >= 1 && aliasTokens.length >= 2 && aliasTokens.some(t => t.length > 4)) {
        matchType = 'partial';
      }
    }

    if (matchType) {
      resolved.push({
        alias: alias.alias,
        normalizedAlias: alias.normalized_alias,
        canonicalKuId: alias.canonical_ku_id,
        matchType,
        sourcePaths: alias.source_paths || [],
      });
      appliedAliases.push({
        alias: alias.alias,
        matches: alias.canonical_ku_id,
        matchType,
      });
    }
  }

  return {
    resolved,
    appliedAliases,
    matchedKuIds: [...new Set(resolved.map(r => r.canonicalKuId))],
  };
}
