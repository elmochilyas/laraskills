# ECC Anti-Patterns — Graph Workflows

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Agentic Workflows |
| **Knowledge Unit** | Graph Workflows |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Linear Chain Using Graph Framework (Over-engineering)
2. Cyclic Graph Without Loop Detection
3. All Nodes on Single Provider — No Provider Diversity
4. No Error Handling Per Graph Node
5. Graph State Not Persisted for Resumption

---

## Repository-Wide Anti-Patterns

- Graph definition in code without visual documentation
- Single node failure aborts entire graph

---

## Anti-Pattern 1: Linear Chain Using Graph Framework

### Category
Architecture

### Description
Using graph workflow framework for a simple linear chain — adds unnecessary complexity.

### Preferred Alternative
Use simple chaining for linear flows. Reserve graph for branching, parallel, or conditional workflows.

### Detection Checklist
- [ ] Graph framework for linear flow
- [ ] No branching or conditional nodes
- [ ] Simpler chaining would work

---

## Anti-Pattern 2: Cyclic Graph Without Loop Detection

### Category
Reliability

### Description
Graph with cycles but no MaxSteps or loop detection — infinite execution.

### Preferred Alternative
Implement step limits and cycle detection in graph runtime.

### Detection Checklist
- [ ] Graph cycle without protection
- [ ] Infinite graph execution
- [ ] No step limit
