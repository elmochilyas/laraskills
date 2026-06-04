# ECC Anti-Patterns — Prompt Versioning

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Prompt Engineering |
| **Knowledge Unit** | Prompt Versioning |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Prompt Versioning — Can't Roll Back Bad Prompts
2. Prompts Changed Directly in Production — No Testing
3. No Prompt Changelog — Unknown What Changed
4. Same Prompt for All Environments — Dev Prompt in Production
5. No Prompt Review Process — Anyone Can Change

---

## Repository-Wide Anti-Patterns

- Prompt stored only in code — no external review
- No diff tool for prompt changes

---

## Anti-Pattern 1: No Prompt Versioning

### Category
Maintainability

### Description
System prompts edited directly in agent classes with no version history — regression requires reverting from memory.

### Preferred Alternative
Store prompts as versioned files (Markdown, YAML) with git history. Reference versions in config.

### Detection Checklist
- [ ] Prompt in code only
- [ ] No version history
- [ ] Rollback requires git archaeology

---

## Anti-Pattern 2: Prompts Changed in Production Without Testing

### Category
Reliability

### Description
System prompt edited directly in production — no A/B test, no quality evaluation before deploy.

### Preferred Alternative
Test prompt changes in staging with evaluation dataset. A/B test in production before full rollout.

### Detection Checklist
- [ ] Prompt edited in production
- [ ] No pre-deploy testing
- [ ] A/B test not used
