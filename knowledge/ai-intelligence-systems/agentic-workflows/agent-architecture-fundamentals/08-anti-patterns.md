# ECC Anti-Patterns — Agent Architecture Fundamentals

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Agentic Workflows |
| **Knowledge Unit** | Agent Architecture Fundamentals |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Monolithic Agent Handling Multiple Domains
2. No MaxSteps — Agent Loops Indefinitely
3. Passing Mutable State via Constructor
4. Forgetting Promptable Trait
5. Testing Without Ai::fake() — Real API Calls

---

## Repository-Wide Anti-Patterns

- Context window overflow — instructions + history + tools exceed model token limit
- Provider timeout — no HTTP timeout configured for provider calls

---

## Anti-Pattern 1: Monolithic Agent Handling Multiple Domains

### Category
Architecture

### Description
Single agent with tools and instructions covering unrelated domains — LLM confused by conflicting instructions.

### Why It Happens
Teams add capabilities to an existing agent instead of creating new agent classes.

### Warning Signs
- Agent has 10+ unrelated tools
- Instructions mix domains
- Output quality degrades as scope expands

### Why It Is Harmful
The LLM must disambiguate instructions across multiple domains, leading to hallucinated tool calls and irrelevant responses. Irrelevant tool schemas consume tokens in every prompt.

### Preferred Alternative
One agent class per distinct capability. Compose agents for complex workflows.

### Detection Checklist
- [ ] Agent covers multiple domains
- [ ] Declining output quality
- [ ] Irrelevant tools in every prompt

### Related Rules
One Agent Class Per Capability (05-rules.md)

---

## Anti-Pattern 2: No MaxSteps

### Category
Reliability

### Description
Agent with tools but no `#[MaxSteps]` — LLM can call tools indefinitely without producing final answer.

### Preferred Alternative
Set `#[MaxSteps]` appropriate to expected tool chain depth.

### Detection Checklist
- [ ] No MaxSteps attribute
- [ ] Runaway agent loops
- [ ] Unbounded token costs

---

## Anti-Pattern 3: Passing Mutable State via Constructor

### Category
Reliability

### Description
Passing mutable objects (Eloquent models, request objects) via agent constructor — state may change between agent instantiation and execution.

### Preferred Alternative
Pass scalar values (IDs, primitives) or immutable DTOs via constructor.

### Detection Checklist
- [ ] Mutable object in agent constructor
- [ ] State changes between construction and execution
- [ ] Hard-to-debug behavior

---

## Anti-Pattern 4: Forgetting Promptable Trait

### Category
Framework Usage

### Description
Agent class without `use Promptable` — `prompt()`, `stream()`, `queue()` unavailable.

### Preferred Alternative
Include `use Promptable;` in every agent class definition.

### Detection Checklist
- [ ] Agent missing Promptable trait
- [ ] "Method not found" at runtime

---

## Anti-Pattern 5: Testing Without Ai::fake()

### Category
Testing

### Description
Tests call real LLM providers — slow, costly, non-deterministic.

### Preferred Alternative
Use `Ai::fake()` with `preventStrayPrompts()` in all tests.

### Detection Checklist
- [ ] No Ai::fake() in test
- [ ] Real API calls in CI
- [ ] Flaky test suite
