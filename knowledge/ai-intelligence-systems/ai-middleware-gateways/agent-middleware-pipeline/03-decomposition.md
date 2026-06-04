# Decomposition: Agent Middleware Pipeline

## Topic Overview
The agent middleware pipeline intercepts and modifies prompts before they reach the LLM (pre-send) and responses after they return (post-receive). It enables cross-cutting concerns like prompt injection detection, PII redaction, logging, cost metering, and content moderation without polluting agent or tool logic.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-01-agent-middleware-pipeline/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Agent Middleware Pipeline
- **Purpose:** The agent middleware pipeline intercepts and modifies prompts before they reach the LLM (pre-send) and responses after they return (post-receive). It enables cross-cutting concerns like prompt injection detection, PII redaction, logging, cost metering, and content moderation without polluting agent or tool logic.
- **Difficulty:** Intermediate
- **Dependencies:** KU-002, KU-026, KU-027, KU-029, KU-001

## Dependency Graph
**Depends on:**
- KU-002
- KU-026
- KU-027
- KU-029
- KU-001

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- `HasMiddleware` trait
- Pre-send middleware
- Post-receive middleware
- `make:agent-middleware`
- Pipeline order
- Middleware bypass

**Out of scope:**
- KU-002 topics covered in their respective KUs
- KU-026 topics covered in their respective KUs
- KU-027 topics covered in their respective KUs
- KU-029 topics covered in their respective KUs
- KU-001 topics covered in their respective KUs

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization