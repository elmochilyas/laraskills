# ECC Anti-Patterns — Laravel AI SDK Architecture

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Laravel AI SDK |
| **Knowledge Unit** | Laravel AI SDK Architecture |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Monolithic Agent Class Handling Multiple Domains
2. Using Properties Instead of Attributes for Static Configuration
3. Testing Without Ai::fake() — Real API Calls in Test Suite
4. Using prompt() for Long-Running Requests (>5s)
5. Not Setting MaxSteps — Runaway Agent Loops

---

## Repository-Wide Anti-Patterns

- Conversation table bloat — no retention policy on `agent_conversations`
- Forgetting `preventStrayPrompts()` — accidental real API calls in tests

---

## Anti-Pattern 1: Monolithic Agent Class Handling Multiple Domains

### Category
Architecture

### Description
Single Agent class with tools and instructions for unrelated domains (support, search, billing combined) — LLM gets confused by conflicting instructions.

### Why It Happens
Teams create one agent for all AI features, then keep adding tools and instructions.

### Warning Signs
- Agent class has 15+ tools
- Instructions mix multiple domains
- Output quality degrades as tools are added

### Why It Is Harmful
A monolithic agent receives instructions and tools for multiple domains. The LLM must disambiguate which tools to use for the current input. Conflicting or overlapping tool descriptions cause hallucinated tool calls, wrong tool selections, or irrelevant responses. Output quality degrades proportionally to the number of unrelated tools. Each prompt sends all tool schemas in context, consuming tokens for tools irrelevant to the current request.

### Preferred Alternative
One Agent class per distinct AI capability. Each agent has focused instructions and relevant tools only.

### Detection Checklist
- [ ] Single agent for multiple domains
- [ ] Declining output quality as tools increase
- [ ] Irrelevant tool schemas in every prompt

### Related Rules
One Agent Class Per Capability (05-rules.md)

---

## Anti-Pattern 2: Using Properties Instead of Attributes for Static Configuration

### Category
Framework Usage

### Description
Declaring provider, model, temperature as `protected` properties instead of PHP attributes — mutable, not inspectable at compile time.

### Preferred Alternative
Use `#[Provider]`, `#[Model]`, `#[Temperature]` attributes for static configuration.

### Detection Checklist
- [ ] `protected string $provider` in agent class
- [ ] Configuration scattered across code
- [ ] Runtime mutation risk

---

## Anti-Pattern 3: Testing Without Ai::fake()

### Category
Testing

### Description
Unit/feature tests call real LLM providers — slow, costly, non-deterministic, network-dependent.

### Preferred Alternative
Use `Ai::fake()` and `Ai::preventStrayPrompts()` in all tests.

### Detection Checklist
- [ ] No `Ai::fake()` in test
- [ ] Real API calls during test suite
- [ ] Flaky tests from network/timeout issues

---

## Anti-Pattern 4: Using prompt() for Long-Running Requests

### Category
Performance

### Description
Synchronous `->prompt()` for agent calls expected to take >5s — blocks PHP worker, exhausts pool.

### Preferred Alternative
Use `->stream()` for interactive or `->queue()` for background processing.

### Detection Checklist
- [ ] `prompt()` for image generation
- [ ] `prompt()` for complex tool chains
- [ ] Worker pool exhaustion under load

---

## Anti-Pattern 5: Not Setting MaxSteps

### Category
Reliability

### Description
Agent with tools but no `#[MaxSteps]` attribute — LLM can call tools indefinitely without producing final answer.

### Preferred Alternative
Always set `#[MaxSteps]` appropriate to expected tool chain depth.

### Detection Checklist
- [ ] No `#[MaxSteps]` on tool-using agent
- [ ] Runaway agent loops
- [ ] Unbounded token consumption
