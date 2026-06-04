# Decomposition: Multi-Agent Systems

## Topic Overview

A **multi-agent system (MAS)** coordinates multiple AI agents to solve problems that exceed the capability of a single agent. Each agent has a dedicated role, tool set, and context window. MAS architectures range from simple supervisor-worker hierarchies to complex peer-to-peer swarms. In the Laravel AI ecosystem, multi-agent orchestration is an application-layer concern built on top of the single-agent primitives from ku-01.

## Decomposition Strategy

This Knowledge Unit is atomic. It covers a single well-bounded concept with independent decisions, tradeoffs, and architecture guidance.

## Proposed Folder Structure
```
ku-02/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory

### Multi-Agent Systems
- **Purpose:** A **multi-agent system (MAS)** coordinates multiple AI agents to solve problems that exceed the capability of a single agent. Each agent has a dedicated role, tool set, and context window. MAS architectures range from simple supervisor-worker hierarchies to complex peer-to-peer swarms. In the Laravel AI ecosystem, multi-agent orchestration is an application-layer concern built on top of the single-agent primitives from ku-01.
- **Difficulty:** Intermediate
- **Dependencies:** ku-01, ku-03, ku-06, ku-07, ku-03

## Dependency Graph
**Depends on:**
- ku-01
- ku-03
- ku-06
- ku-07
- ku-03

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- **Agent Role:** Each agent has a distinct persona, system prompt, and tool set. Roles decompose complexity (e.g., Researcher, Writer, Reviewer, Executor).
- **Orchestrator/Supervisor Agent:** A dedicated agent that delegates tasks to worker agents and synthesizes their outputs.
- **Agent Graph (DAG):** Directed acyclic graph defining execution order. Nodes are agents; edges are message-passing channels. Cycles must be bounded.
- **Shared Message Bus:** A communication layer (in-memory, Redis, or database) that agents use to exchange messages asynchronously.
- **Handoff Protocol:** The mechanism by which one agent transfers control to another (explicit tool call, orchestration-layer routing, or message-based delegation).
- **Voting/Consensus:** Multiple agents independently evaluate a task and their outputs are aggregated (majority vote, weighted scoring, or LLM judge).
- **Debate Architecture:** Agents with opposing roles critique each other's outputs iteratively to improve quality.

**Out of scope:**
- ku-01 topics covered in their respective KUs
- ku-03 topics covered in their respective KUs
- ku-06 topics covered in their respective KUs
- ku-07 topics covered in their respective KUs
- ku-03 topics covered in their respective KUs

## Future Expansion Opportunities
The topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

- No Knowledge Unit is overloaded
- No major concept is missing
- Boundaries are clear
- Future phases can operate on individual units
- The structure can scale without reorganization

