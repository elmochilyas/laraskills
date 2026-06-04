---
id: ku-02
title: "Multi-Agent Systems"
subdomain: "agent-architecture-orchestration"
ku-type: "architectural"
date-created: "2026-06-02"
domain-maturity: "emerging"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/agent-architecture-orchestration/ku-02/04-standardized-knowledge.md"
---

# Multi-Agent Systems

## Overview

A **multi-agent system (MAS)** coordinates multiple AI agents to solve problems that exceed the capability of a single agent. Each agent has a dedicated role, tool set, and context window. MAS architectures range from simple supervisor-worker hierarchies to complex peer-to-peer swarms. In the Laravel AI ecosystem, multi-agent orchestration is an application-layer concern built on top of the single-agent primitives from ku-01.

## Core Concepts

- **Agent Role:** Each agent has a distinct persona, system prompt, and tool set. Roles decompose complexity (e.g., Researcher, Writer, Reviewer, Executor).
- **Orchestrator/Supervisor Agent:** A dedicated agent that delegates tasks to worker agents and synthesizes their outputs.
- **Agent Graph (DAG):** Directed acyclic graph defining execution order. Nodes are agents; edges are message-passing channels. Cycles must be bounded.
- **Shared Message Bus:** A communication layer (in-memory, Redis, or database) that agents use to exchange messages asynchronously.
- **Handoff Protocol:** The mechanism by which one agent transfers control to another (explicit tool call, orchestration-layer routing, or message-based delegation).
- **Voting/Consensus:** Multiple agents independently evaluate a task and their outputs are aggregated (majority vote, weighted scoring, or LLM judge).
- **Debate Architecture:** Agents with opposing roles critique each other's outputs iteratively to improve quality.

## When To Use

- Tasks requiring diverse expertise (e.g., code generation needs a planner + coder + tester).
- Complex workflows that benefit from parallel execution (multiple agents research different sources simultaneously).
- Systems needing specialized security isolation (a "safe" agent with limited tools and a "powerful" agent with elevated privileges).
- Applications where a single agent's context window is insufficient for the full problem scope.

## When NOT To Use

- Simple single-domain tasks (one agent is cheaper, faster, and easier to debug).
- Real-time applications where multi-agent handoff latency is unacceptable.
- Teams without observability infrastructure — debugging multi-agent systems without logs is intractable.
- When the coordination overhead exceeds the benefit (2 agents with 1 tool each — just use one agent).

## Best Practices

- Define agent roles with **strict tool boundaries**. No two agents should have overlapping tool sets unless explicitly designed.
- Implement a **timeout per agent turn**. A stuck agent should not block the entire system.
- Use **structured message formats** (JSON schemas) for inter-agent communication, not free-text.
- Log every message passing event with source agent, target agent, message type, and latency.
- Design agents to be **stateless workers**; state lives in the orchestration layer or a shared store.

## Architecture Guidelines

- Prefer a **hierarchical supervisor pattern** for most production systems: a supervisor agent routes tasks, worker agents execute, results flow back up.
- For high throughput, use a **pipeline pattern** with queue workers: Agent A writes to a queue, Agent B consumes and processes, Agent C publishes result.
- The **orchestrator must be deterministic** for control flow; all non-determinism (LLM calls) lives in worker agents.
- Model the agent graph explicitly (YAML/JSON config) rather than hardcoding orchestration logic.
- For Laravel, implement each agent as a **job class** with retry logic, and use the queue for inter-agent message passing.

## Performance Considerations

- Multi-agent systems add latency proportional to the depth of the agent graph (each hop = one LLM call).
- Parallel fan-out reduces wall-clock time but increases total token spend (N agents × prompt tokens).
- Sub-graph batching: group independent agents that share context to reduce redundant prompt processing.
- Consider **agent caching**: memoize agent outputs for identical inputs within a session.
- The orchestrator agent's context window grows with each sub-result; implement summarization or sliding-window trimming.

## Security Considerations

- **Privilege separation:** A code-execution agent must be sandboxed (no network, no filesystem) while a research agent has read-only API access.
- **Inter-agent message validation:** Never trust that Agent A sent valid JSON. Validate schema on every message.
- **Orchestrator is the trust boundary:** Workers should not communicate directly with each other unless explicitly routed through the orchestrator.
- **Agent spoofing:** Ensure message attribution is cryptographic or at minimum, source-verified by the runtime.
- **Data isolation:** Each agent's context window should be isolated; no accidental cross-agent data leakage.

## Common Mistakes

- Making agents too granular (an agent per function call) creates overhead without benefit.
- Not implementing dead agent detection — a crashed worker stalls the entire pipeline.
- Letting agents communicate in free-text, making it impossible to validate or route messages programmatically.
- Overloading the supervisor agent — it becomes the bottleneck and its context window fills with all sub-results.
- Skipping error propagation — when a worker fails, the system should retry, escalate, or gracefully degrade.

## Anti-Patterns

- **Circular Agent Dependencies:** Agent A calls Agent B which calls Agent A. Detect cycles at orchestration-definition time.
- **Broadcast-All:** Every agent message goes to every other agent. Leads to context pollution and quadratic message volume.
- **Tightly Coupled Agents:** Agents share internal state or tools. Each agent must be independently replaceable.
- **Orchestrator as God Object:** The supervisor handles routing, execution, and result synthesis. Break result synthesis into a dedicated agent.

## Examples

### Supervisor-Worker Message Flow
```php
// Supervisor sends task to ResearchAgent
$supervisor->assign('research', $question);
$researchResult = $researchAgent->execute($question);
$supervisor->receive('research_result', $researchResult);

// Supervisor sends writing task with research context
$supervisor->assign('write', [
    'question' => $question,
    'research' => $researchResult
]);
$answer = $writerAgent->execute($question, $researchResult);
```

### Agent Graph Config (YAML)
```yaml
agents:
  supervisor:
    role: planner
    tools: [assign, escalate, finalize]
  researcher:
    role: research
    tools: [web_search, read_document]
    max_turns: 5
  writer:
    role: write
    tools: [format, cite]
    max_turns: 3
graph:
  - from: supervisor
    to: researcher
    when: "needs_research"
  - from: researcher
    to: writer
    when: "research_done"
  - from: writer
    to: supervisor
    when: "draft_ready"
```

## Related Topics

- ku-01 (Agent Architecture Fundamentals): Single-agent loop that each MAS node runs.
- ku-03 (Agent Communication): Protocols and message formats for inter-agent passing.
- ku-06 (Agent Memory & State): Shared and isolated memory strategies in MAS.
- ku-07 (Orchestration Frameworks): Tools and frameworks for managing multi-agent workflows.
- ai-middleware-gateway/ku-03: Routing agent traffic through API gateways.

## AI Agent Notes

- When asked to design a multi-agent system, first clarify: what is the single agent's limitation that forces multiple agents?
- For debugging MAS issues, request the full inter-agent message trace (not just the final output).
- Prefer to read agent graph configs before agent implementations — the structure reveals intent.
- When generating MAS code, produce the agent graph config separately from the agent implementations.

## Verification

- [ ] Each agent has a single, well-defined role documented in its system prompt.
- [ ] Agent graph is defined as config (not hardcoded) and validated for cycles.
- [ ] Inter-agent messages use a schema-validated JSON format.
- [ ] Every agent turn has a timeout (default ≤30s for LLM, shorter for tools).
- [ ] Agent failures propagate correctly: retry → escalate to supervisor → fail gracefully.
- [ ] No two agents share overlapping tool sets unless explicitly documented.
- [ ] All inter-agent communication is logged with source, target, type, and latency.
