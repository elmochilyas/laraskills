# ECC Anti-Patterns — Agent Config & Promptable Trait

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Laravel AI SDK |
| **Knowledge Unit** | Agent Config & Promptable Trait |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Forgetting the Promptable Trait — No prompt() Method Available
2. Dynamic Runtime Configuration via Method Overrides Instead of Attributes
3. Stateless Agent as Transient — Repeated Resolution Overhead
4. Constructor Injection for Secrets Instead of Config
5. Not Registering Agents in Service Container

---

## Repository-Wide Anti-Patterns

- Mixed configuration strategies — some agents use attributes, others use properties
- Missing AI_PROVIDER env var — SDK silently fails or uses wrong provider

---

## Anti-Pattern 1: Forgetting the Promptable Trait

### Category
Framework Usage

### Description
Agent class without `use Promptable` — `prompt()`, `stream()`, and `queue()` methods are not available, producing "method not found" runtime errors.

### Preferred Alternative
Include `use Promptable;` as a standard part of every agent class definition.

### Detection Checklist
- [ ] "Method not found" on agent call
- [ ] Missing `use Promptable` in agent class
- [ ] Manual workaround for execution

---

## Anti-Pattern 2: Dynamic Runtime Configuration via Method Overrides

### Category
Maintainability

### Description
Overriding `provider()`, `model()`, or `temperature()` methods at runtime instead of using declarative attributes — configuration scattered and mutable.

### Preferred Alternative
Use `#[Provider]`, `#[Model]`, `#[Temperature]` attributes for static configuration. Reserve overrides for genuinely dynamic cases.

### Detection Checklist
- [ ] Runtime method overrides for static config
- [ ] Configuration not visible at compile time
- [ ] Mutation risk during agent execution

---

## Anti-Pattern 3: Stateless Agent as Transient

### Category
Performance

### Description
Stateless agents with no constructor parameters re-instantiated on every request — redundant attribute reading and tool resolution.

### Preferred Alternative
Register stateless agents as singletons in the service container.

### Detection Checklist
- [ ] `new SearchAgent()` per request
- [ ] No constructor parameters
- [ ] No per-request state needed

---

## Anti-Pattern 4: Constructor Injection for Secrets

### Category
Security

### Description
API keys, tokens, or secrets passed through agent constructor — secrets visible in container resolutions, dumps, and logs.

### Preferred Alternative
Inject configuration objects or use the SDK's config mechanism. Never pass raw secrets to agents.

### Detection Checklist
- [ ] API key in agent constructor
- [ ] Secret in container dump/debug output
- [ ] Config-based approach possible

---

## Anti-Pattern 5: Not Registering Agents in Service Container

### Category
Framework Usage

### Description
Instantiating agents manually with `new` everywhere — no DI, no lifecycle management, hard to replace for testing.

### Preferred Alternative
Register agents in the service container for automated resolution and test swapping.

### Detection Checklist
- [ ] `new AgentName()` scattered across codebase
- [ ] No container registration
- [ ] Hard to mock/fake in tests
