# ECC Anti-Patterns — Psalm Taint Analysis

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | AI Safety & Security |
| **Knowledge Unit** | Psalm Taint Analysis |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Static Analysis for AI Code — Taint Flows Undetected
2. Taint Sources Not Configured (LLM Output as Taint Source)
3. Taint Sinks Not Configured (DB, File, Shell)
4. Taint Warnings Ignored — Suppressed Without Review
5. No CI Enforcement of Taint Checks

---

## Repository-Wide Anti-Patterns

- Psalm taint analysis not part of CI pipeline
- Taint issues tracked separately from code issues

---

## Anti-Pattern 1: No Static Analysis for AI Code

### Category
Security

### Description
PHP code handling LLM output not analyzed for taint flows — undetected injection vulnerabilities.

### Preferred Alternative
Run Psalm taint analysis with AI-specific taint sources (LLM output, tool arguments) and sinks (SQL, shell, file).

### Detection Checklist
- [ ] No Psalm taint analysis
- [ ] LLM output not marked as taint source
- [ ] Injection vulnerabilities undetected

---

## Anti-Pattern 2: Taint Sources Not Configured

### Category
Security

### Description
Psalm security analysis runs but LLM output and tool arguments not configured as taint sources.

### Preferred Alternative
Configure LLM output and tool arguments as taint sources. Configure DB/file/shell as taint sinks.

### Detection Checklist
- [ ] LLM output not marked as taint
- [ ] Tool args not marked as taint
- [ ] Taint analysis misses AI vectors
