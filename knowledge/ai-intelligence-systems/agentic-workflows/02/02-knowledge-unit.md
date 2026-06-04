# Knowledge Unit: Multi-Agent Systems

## Metadata

- **ID:** ku-02
- **Subdomain:** Agentic Workflows
- **Slug:** multi-agent-systems
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

A **multi-agent system (MAS)** coordinates multiple AI agents to solve problems that exceed the capability of a single agent. Each agent has a dedicated role, tool set, and context window. MAS architectures range from simple supervisor-worker hierarchies to complex peer-to-peer swarms. In the Laravel AI ecosystem, multi-agent orchestration is an application-layer concern built on top of the single-agent primitives from ku-01.

## Core Concepts

- **Agent Role:** Each agent has a distinct persona, system prompt, and tool set. Roles decompose complexity (e.g., Researcher, Writer, Reviewer, Executor).
- **Orchestrator/Supervisor Agent:** A dedicated agent that delegates tasks to worker agents and synthesizes their outputs.
- **Agent Graph (DAG):** Directed acyclic graph defining execution order. Nodes are agents; edges are message-passing channels. Cycles must be bounded.
- **Shared Message Bus:** A communication layer (in-memory, Redis, or database) that agents use to exchange messages asynchronously.
- **Handoff Protocol:** The mechanism by which one agent transfers control to another (explicit tool call, orchestration-layer routing, or message-based delegation).
- **Voting/Consensus:** Multiple agents independently evaluate a task and their outputs are aggregated (majority vote, weighted scoring, or LLM judge).
- **Debate Architecture:** Agents with opposing roles critique each other's outputs iteratively to improve quality.

## Mental Models

- **Agent Role:** Each agent has a distinct persona, system prompt, and tool set. Roles decompose complexity (e.g., Researcher, Writer, Reviewer, Executor).
- **Orchestrator/Supervisor Agent:** A dedicated agent that delegates tasks to worker agents and synthesizes their outputs.
- **Agent Graph (DAG):** Directed acyclic graph defining execution order. Nodes are agents; edges are message-passing channels. Cycles must be bounded.


## Internal Mechanics

The internal mechanics of Multi-Agent Systems follow established patterns within the Agentic Workflows domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- Define agent roles with **strict tool boundaries**. No two agents should have overlapping tool sets unless explicitly designed.
- Implement a **timeout per agent turn**. A stuck agent should not block the entire system.
- Use **structured message formats** (JSON schemas) for inter-agent communication, not free-text.
- Log every message passing event with source agent, target agent, message type, and latency.
- Design agents to be **stateless workers**; state lives in the orchestration layer or a shared store.

## Patterns

- Define agent roles with **strict tool boundaries**. No two agents should have overlapping tool sets unless explicitly designed.
- Implement a **timeout per agent turn**. A stuck agent should not block the entire system.
- Use **structured message formats** (JSON schemas) for inter-agent communication, not free-text.
- Log every message passing event with source agent, target agent, message type, and latency.
- Design agents to be **stateless workers**; state lives in the orchestration layer or a shared store.

## Architectural Decisions

- Prefer a **hierarchical supervisor pattern** for most production systems: a supervisor agent routes tasks, worker agents execute, results flow back up.
- For high throughput, use a **pipeline pattern** with queue workers: Agent A writes to a queue, Agent B consumes and processes, Agent C publishes result.
- The **orchestrator must be deterministic** for control flow; all non-determinism (LLM calls) lives in worker agents.
- Model the agent graph explicitly (YAML/JSON config) rather than hardcoding orchestration logic.
- For Laravel, implement each agent as a **job class** with retry logic, and use the queue for inter-agent message passing.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Multi-agent systems add latency proportional to the depth of the agent graph (each hop = one LLM call).
- Parallel fan-out reduces wall-clock time but increases total token spend (N agents Ã— prompt tokens).
- Sub-graph batching: group independent agents that share context to reduce redundant prompt processing.
- Consider **agent caching**: memoize agent outputs for identical inputs within a session.
- The orchestrator agent's context window grows with each sub-result; implement summarization or sliding-window trimming.

## Production Considerations

- **Privilege separation:** A code-execution agent must be sandboxed (no network, no filesystem) while a research agent has read-only API access.
- **Inter-agent message validation:** Never trust that Agent A sent valid JSON. Validate schema on every message.
- **Orchestrator is the trust boundary:** Workers should not communicate directly with each other unless explicitly routed through the orchestrator.
- **Agent spoofing:** Ensure message attribution is cryptographic or at minimum, source-verified by the runtime.
- **Data isolation:** Each agent's context window should be isolated; no accidental cross-agent data leakage.

## Common Mistakes

- Making agents too granular (an agent per function call) creates overhead without benefit.
- Not implementing dead agent detection â€” a crashed worker stalls the entire pipeline.
- Letting agents communicate in free-text, making it impossible to validate or route messages programmatically.
- Overloading the supervisor agent â€” it becomes the bottleneck and its context window fills with all sub-results.
- Skipping error propagation â€” when a worker fails, the system should retry, escalate, or gracefully degrade.

## Failure Modes

- **Circular Agent Dependencies:** Agent A calls Agent B which calls Agent A. Detect cycles at orchestration-definition time.
- **Broadcast-All:** Every agent message goes to every other agent. Leads to context pollution and quadratic message volume.
- **Tightly Coupled Agents:** Agents share internal state or tools. Each agent must be independently replaceable.
- **Orchestrator as God Object:** The supervisor handles routing, execution, and result synthesis. Break result synthesis into a dedicated agent.

## Ecosystem Usage

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

## Related Knowledge Units

- ku-01 (Agent Architecture Fundamentals): Single-agent loop that each MAS node runs.
- ku-03 (Agent Communication): Protocols and message formats for inter-agent passing.
- ku-06 (Agent Memory & State): Shared and isolated memory strategies in MAS.
- ku-07 (Orchestration Frameworks): Tools and frameworks for managing multi-agent workflows.
- ai-middleware-gateway/ku-03: Routing agent traffic through API gateways.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

