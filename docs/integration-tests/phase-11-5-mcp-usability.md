# Phase 11.5 — Post-Hardening Real-Project Verification: MCP Usability

**Date:** 2026-06-10
**Purpose:** Evaluate whether the Phase 11.4 MCP improvements resolve the retrieval-chain failures observed in Run C's agent report.

---

## 1. Phase 11.3 MCP Issues (Pre-Hardening)

Run C's agent report documented three MCP-related failures:

| Issue | Symptom | Impact |
|-------|---------|--------|
| `search_ecc` returned "bare KU names" | Agent received short names (e.g., `policy-management`) without canonical IDs | Unable to call `get_knowledge_unit` |
| `get_knowledge_unit` expected canonical IDs | Agent tried `get_knowledge_unit("policy-management")` and got errors | Failed to retrieve detailed policy knowledge |
| Some `get_knowledge_unit` calls failed | Agent gave up on authorization-related lookups | Agent proceeded without full policy context |

---

## 2. Phase 11.4 Fixes Applied

### 2.1 Improved Error Messages for `get_knowledge_unit`

When called with a non-canonical short name, `get_knowledge_unit` now returns an actionable `isError` result:

```json
{
  "error": "Unknown knowledge unit ID: 'policy-management'. Use search_ecc to find the correct canonical ID. Canonical IDs follow the pattern: '<domain>/<subdomain>/<knowledge-unit-name>' (e.g., 'application-architecture-patterns/policies-gates/policy-management')."
}
```

This error message:
- Tells the agent exactly what went wrong
- Tells the agent which tool to use instead (`search_ecc`)
- Shows the canonical ID pattern with a concrete example

### 2.2 `search_ecc` Output Includes Canonical IDs

Each search result includes a canonical `id` field that `get_knowledge_unit` can consume:

```json
{
  "id": "application-architecture-patterns/policies-gates/policy-management",
  "name": "policy-management",
  "domain": "application-architecture-patterns",
  "subdomain": "policies-gates",
  "score": 0.92,
  "sourcePath": "application-architecture-patterns/policies-gates/policy-management"
}
```

The text output also renders the ID prominently:

```
## 7. application-architecture-patterns/policies-gates/policy-management
**Score:** 0.92 | **Domain:** application-architecture-patterns | **ID:** application-architecture-patterns/policies-gates/policy-management
```

---

## 3. Post-Hardening MCP Test Results

All 38 MCP tests pass (0 failures across 12 suites):

| Suite | Tests | Status |
|-------|:-----:|:------:|
| Startup | 3 | ✅ All pass |
| stdio cleanliness | 1 | ✅ All pass |
| Shutdown handling | 2 | ✅ All pass |
| Tool discovery | 4 | ✅ All pass |
| `retrieve_context_bundle` | 5 | ✅ All pass |
| `search_ecc` | 4 | ✅ All pass |
| `get_knowledge_unit` | 4 | ✅ All pass |
| `get_graph_context` | 4 | ✅ All pass |
| `validate_ecc` | 6 | ✅ All pass |
| ECC_ROOT resolution | 3 | ✅ All pass |
| Determinism | 2 | ✅ All pass |
| Encoding | 1 | ✅ All pass |

### Hardening-Specific Tests

Two tests directly verify the Phase 11.4 improvements:

| Test | What it verifies | Status |
|------|------------------|:------:|
| `canonical-ID round-trip: search -> get -> verify cycle preserves ID` | Canonical IDs from `search_ecc` resolve correctly in `get_knowledge_unit` | ✅ Pass |
| `returns actionable error with search suggestion for non-canonical short IDs` | Error message guides agent toward search when non-canonical ID is used | ✅ Pass |

---

## 4. Remaining Usability Concerns

### 4.1 Agent Must Read Structured Output

The `search_ecc` tool returns both a text summary (in the tool response content) and structured JSON (in the `structuredContent` block). Current AI coding agents may read the text summary and only see the heading name without noting the `ID:` field. This is an agent-consumption pattern issue, not a tool-design issue.

**Recommendation:** Monitor whether agents consistently read the `ID:` field from search results. If agents continue to miss it, consider reordering the tool output to put the canonical ID before the short name.

### 4.2 Error Recovery Requires Agent Cooperation

The improved error message from `get_knowledge_unit` tells the agent to use `search_ecc`, but the agent must:
1. Recognize the `isError` flag
2. Read the error message
3. Call `search_ecc` with a sensible query
4. Extract the canonical ID from the search results
5. Retry `get_knowledge_unit` with the correct ID

This is a multi-step recovery that some agents may fail to execute correctly.

### 4.3 No Proactive Guidance

The tools do not currently coach the agent on the search-then-get workflow. The error message only appears after a failed call. Consider adding a hint to `search_ecc` output or `get_knowledge_unit` schema descriptions that explicitly state: "Use the `id` field from search results — not the short name — when calling this tool."

---

## 5. Conclusion

The Phase 11.4 MCP improvements are **technically correct and verified by tests**:

- `search_ecc` returns usable canonical IDs in both structured and text output
- `get_knowledge_unit` returns actionable error messages that guide agents to search
- All 38 tests pass, including the two hardening-specific round-trip and error-handling tests

The remaining risk is **agent-side consumption behavior**: whether the AI coding agent reads the canonical ID from search results rather than the short heading name. This is an agent-behavior issue outside the tool's control. If agent misuse persists, the next hardening iteration should focus on making the canonical ID more prominent or adding schema-level workflow guidance.
