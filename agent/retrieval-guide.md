# ECC Retrieval Guide

Optimal retrieval strategy for AI agents.

---

## MCP Path (Preferred — Agent with MCP Server)

Use the MCP server tools when available. They return structured, ranked results faster than manual file scanning.

**Default workflow (every task):**
1. Call `retrieve_context_bundle` with the task description (start with `compact` or `standard` mode)
2. If the bundle answers the question, proceed with implementation using the returned KUs, rules, and skills
3. If not, iterate: narrow the task description, switch domains, or use `search_ecc` to discover additional KUs
4. For deep inspection of a single KU, use `get_knowledge_unit` (accepts full canonical IDs, short last-segment IDs, and aliases)
5. For prerequisites or related topics, use `get_graph_context` to expand in one call

**Budgeting:**
- `compact` (~2K tokens) — quick routing, narrow scope
- `standard` (~6K tokens) — balanced, good for most tasks
- `deep` (~15K+ tokens) — full research; only use when `standard` is insufficient

**Canonical-ID convenience:** `get_knowledge_unit` and `get_graph_context` now accept short IDs (e.g., `resource-controller-methods` instead of the full `api-crud-system-engineering/resource-controllers/resource-controller-methods`). Use `search_ecc` to discover KUs — its text output lists full canonical IDs for every result.

**Convergence:** If a bundle does not sufficiently answer the question, narrow the task description (add domain-specific terms), try a different domain via the `domain` parameter, or use `search_ecc` for exploratory discovery. Avoid repeatedly calling `deep` mode — iterate by narrowing scope instead.

---

## Fast Path (Known Task — Manual without MCP)

1. Consult agent/agent-routing-map.md -- identify domain
2. Open agent/domain-selection-guide.md -- find subdomain
3. Navigate to knowledge/{domain}/{subdomain}/
4. Read 02-knowledge-unit.md for overview
5. Read 09-checklists.md for validation requirements

---

## Deep Path (Unknown Territory)

1. Open intelligence/indexes/knowledge-unit-index.md -- scan all domains
2. Identify candidate domains
3. Open intelligence/indexes/checklist-index.md for related checklists
4. Open agent/domain-selection-guide.md for confirmation
5. Navigate to knowledge/{domain}/{subdomain}/{ku}/

---

## Checklist-Driven Path (Validation First)

1. Open intelligence/indexes/checklist-index.md
2. Use the Checklists By Domain section to find relevant checklists
3. Navigate to source checklist files in knowledge/{domain}/{subdomain}/
4. Validate against checklist items
5. Fix issues based on rules and skills

---

## Rule-Driven Path (Compliance)

1. Open intelligence/indexes/rule-index.md
2. Search for domain-specific rules (Top 100 section or full registry)
3. Apply rules during implementation
4. Verify checklist covers rule violations
5. Cross-reference with agent/agent-routing-map.md for rule-to-domain mapping

---

## Skill-Driven Path (Learning)

1. Open skills/{skill-name}/ directory
2. Read skill file for patterns and examples
3. Cross-reference with knowledge/{domain}/{subdomain}/
4. Apply skill patterns in implementation
5. Validate with checklists from intelligence/indexes/checklist-index.md

---

## Decision Tree Path (Architecture Choices)

1. Open intelligence/indexes/decision-tree-index.md
2. Navigate to relevant decision category
3. Follow decision tree branches for the problem
4. Make informed architecture choice
5. Implement using knowledge and skills

---

## Dependency-Aware Path (Complex Tasks)

1. Open intelligence/indexes/dependency-index.md
2. Identify cross-domain dependency chains
3. Map out prerequisite knowledge units
4. Follow chain from foundation to advanced
5. Implement each layer with proper dependency resolution

---

## Agent-Assisted Path (Delegation)

1. Identify the task type
2. Consult agent/agent-routing-map.md for agent assignment
3. Load the matching agent from agents/{agent-name}
4. Delegate implementation to the agent
5. Verify output against checklists and rules

---

## Reference Locations

| Resource | Location |
|---|---|
| Agent routing map | agent/agent-routing-map.md |
| Domain selection guide | agent/domain-selection-guide.md |
| Domain routing index | agent/domain-routing-index.md |
| Task-to-skill map | agent/task-to-skill-map.md |
| Knowledge Unit Index | intelligence/indexes/knowledge-unit-index.md |
| Checklist Index | intelligence/indexes/checklist-index.md |
| Rule Index | intelligence/indexes/rule-index.md |
| Skill Index | intelligence/indexes/skill-index.md |
| Decision Tree Index | intelligence/indexes/decision-tree-index.md |
| Dependency Index | intelligence/indexes/dependency-index.md |
| Knowledge Registry | intelligence/registry/knowledge-registry.md |
| Knowledge base root | knowledge/ |
| Skills root | skills/ |
| Agents root | agents/ |
| Rules root | rules/ |
