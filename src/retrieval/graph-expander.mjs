export function expandGraph(catalog, topRankedKuIds, options = {}) {
  const {
    prerequisiteDepth = 1,
    relatedDepth = 1,
    maxPrerequisites = 5,
    maxRelated = 5,
  } = options;

  const prerequisites = [];
  const relatedTopics = [];
  const visitedPre = new Set();
  const visitedRel = new Set();
  const expandedPre = new Set();
  const expandedRel = new Set();

  function findPrerequisites(kuId, depth) {
    if (depth > prerequisiteDepth || visitedPre.has(kuId)) return;
    visitedPre.add(kuId);

    for (const edge of catalog.dependencies.edges) {
      if (edge.target === kuId && edge.type === 'prerequisite') {
        const sourceKey = edge.source;
        if (!expandedPre.has(sourceKey)) {
          expandedPre.add(sourceKey);
          prerequisites.push({
            id: sourceKey,
            sourceKuId: kuId,
            reason: edge.reason || 'Prerequisite dependency',
            strength: edge.strength || 'recommended',
            depth,
            evidencePaths: edge.evidence_paths || [],
          });
        }
        if (depth + 1 <= prerequisiteDepth) {
          findPrerequisites(sourceKey, depth + 1);
        }
      }
    }
  }

  function findRelated(kuId, depth) {
    if (depth > relatedDepth || visitedRel.has(kuId)) return;
    visitedRel.add(kuId);

    for (const edge of catalog.relationships.edges) {
      let relatedId = null;
      if (edge.source === kuId && edge.type === 'related-topic') {
        relatedId = edge.target;
      } else if (edge.target === kuId && edge.type === 'related-topic') {
        relatedId = edge.source;
      }
      if (relatedId && !expandedRel.has(relatedId)) {
        expandedRel.add(relatedId);
        relatedTopics.push({
          id: relatedId,
          sourceKuId: kuId,
          reason: edge.reason || 'Related topic',
          depth,
          evidencePaths: edge.evidence_paths || [],
        });
      }
      if (relatedId && depth + 1 <= relatedDepth) {
        findRelated(relatedId, depth + 1);
      }
    }
  }

  for (const kuId of topRankedKuIds) {
    findPrerequisites(kuId, 1);
    findRelated(kuId, 1);
  }

  const uniquePre = [];
  const seenPre = new Set();
  for (const p of prerequisites) {
    if (!seenPre.has(p.id)) {
      seenPre.add(p.id);
      uniquePre.push(p);
    }
  }

  const uniqueRel = [];
  const seenRel = new Set();
  for (const r of relatedTopics) {
    if (!seenRel.has(r.id)) {
      seenRel.add(r.id);
      uniqueRel.push(r);
    }
  }

  return {
    prerequisites: uniquePre.slice(0, maxPrerequisites),
    relatedTopics: uniqueRel.slice(0, maxRelated),
    totalPrerequisitesFound: uniquePre.length,
    totalRelatedFound: uniqueRel.length,
    truncated: uniquePre.length > maxPrerequisites || uniqueRel.length > maxRelated,
  };
}
