# ECC Anti-Patterns — Tool Design for Agents

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Agentic Workflows |
| **Knowledge Unit** | Tool Design for Agents |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Tools Returning Raw Eloquent Models with Sensitive Fields
2. Tool That Lets LLM Construct Arbitrary Queries
3. Overly Broad Tool Description — LLM Uses Wrong Tool
4. No Tool Result Size Limit
5. Tool Accepting User Identifiers from LLM Arguments

---

## Repository-Wide Anti-Patterns

- Tool timeout not configured — handle() hangs agent loop
- No audit logging on tool invocations

---

## Anti-Pattern 1: Tools Returning Raw Eloquent Models

### Category
Security

### Description
Tool returns `$user->toArray()` — password hashes, API keys, internal fields exposed to LLM.

### Preferred Alternative
Explicitly select only needed fields. Never return models directly.

### Detection Checklist
- [ ] toArray() on model in tool output
- [ ] Sensitive fields in LLM context
- [ ] Explicit select() not used

---

## Anti-Pattern 2: Tool That Lets LLM Construct Arbitrary Queries

### Category
Security

### Description
Tool accepts raw WHERE conditions or column names from LLM — prompt injection yields arbitrary data access.

### Preferred Alternative
One tool per specific query with fixed parameters. Never pass dynamic query structure from LLM.

### Detection Checklist
- [ ] Dynamic query construction from LLM args
- [ ] Column names from LLM
- [ ] Arbitrary WHERE conditions
