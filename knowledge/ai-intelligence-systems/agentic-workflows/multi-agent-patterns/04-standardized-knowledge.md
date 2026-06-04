---
id: KU-012
title: "Multi-Agent Patterns"
subdomain: "agentic-workflows"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/03-agentic-workflows/multi-agent-patterns/04-standardized-knowledge.md"
---

# Multi-Agent Patterns

## Overview

The Laravel AI SDK ships five multi-agent patterns based on Anthropic research: chaining, routing, parallelization, orchestrator-workers, and sub-agents. These enable complex workflows by composing multiple specialized agents. Each pattern addresses a specific coordination problem, and the SDK provides PHP implementations with tool calling, memory, failover, and queue support.

## Core Concepts

- **Chaining**: Sequential agents where each agent's output is the next agent's input â€” decomposes complex tasks into manageable steps
- **Routing**: Classifier agent routes input to specialized handler agents â€” separates concerns by domain
- **Parallelization**: Multiple agents work simultaneously on different aspects â€” fan-out for independent subtasks
- **Orchestrator-Worker**: Orchestrator agent plans and delegates to worker agents, synthesizes results â€” most flexible pattern
- **Sub-agents**: Agent delegates sub-tasks to child agents, receives structured results â€” hierarchical

## When To Use

- Production applications requiring Multi-Agent Patterns functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Quality gates**: Between chain steps, use a lightweight validation agent to check output quality before proceeding
- **Route caching**: Cache routing decisions for identical inputs â€” skip classifier for repetitive queries
- **Parallel aggregation**: Fan-out identical queries to multiple models, compare results for consensus
- **Orchestrator checklist**: Orchestrator instructions define plan structure, delegation format, and synthesis rules
- **Sub-agent factory**: Tool creates agent instances with scoped context and returns structured results

- **Pipeline pattern**: Like Unix pipes â€” output of one command feeds into next. Chain agents for sequential transformation.
- **Router pattern**: Like Laravel router â€” classifier middleware maps request to appropriate controller (agent).
- **Orchestrator pattern**: Like a project manager â€” breaks work into tasks, assigns to specialists, reviews and assembles output.
- **Microservices for AI**: Each agent is a service with specific expertise, communicating through structured messages.

## Architecture Guidelines

- **Decision**: Application-level orchestration vs. framework primitives â†’ Multi-agent patterns are composed in PHP, not provided as SDK methods. Reason: Patterns vary too much to codify; SDK provides building blocks, not workflows.
- **Decision**: Structured output for handoff vs. raw text â†’ Agents use `HasStructuredOutput` for inter-agent communication. Reason: Type-safe, validated handoff prevents cascading errors.
- **Decision**: Synchronous vs. parallel execution â†’ Pattern-dependent. Chaining and routing are sequential by nature. Parallel fan-out uses Concurrency facade. Orchestrator can mix sequential and parallel.

## Performance Considerations

- Each agent call costs tokens â€” multi-agent workflows cost 2-10x single agent
- Sequential chains: total latency = sum of individual agent latencies
- Parallel fan-out: total latency = max of individual latencies, but token cost multiplies
- Orchestrator coordination overhead: 1-3 additional LLM calls for planning and synthesis
- Context windows compound â€” each agent in a chain sees accumulated context from prior agents

| Tradeoff | Pro | Con |
|----------|-----|-----|
| More agents = better specialization | Each agent has focused context | Exponential token cost, coordination overhead |
| Orchestrator pattern | Most flexible | Orchestrator becomes bottleneck, adds latency |
| Parallel execution | Faster than sequential | Harder to debug, race conditions in shared state |
| Application-level orchestration | Full control over flow | More boilerplate than declarative workflow |

## Security Considerations

- Start with a single agent â€” only add multi-agent complexity when justified
- Timebox each agent step â€” slow agents block the entire workflow
- Implement circuit breakers per agent â€” one agent's failure shouldn't cascade
- Log inter-agent messages â€” critical for debugging multi-step failures
- Use structured output for agent handoffs â€” typed contracts prevent cascading errors
- Profile token usage per agent â€” identify cost outliers

## Common Mistakes

- Multi-agent before single-agent is validated (premature decomposition)
- Agents with overlapping responsibilities (tool selection ambiguity)
- No structured output between agents (raw text handoff causes misinterpretation)
- Ignoring cascading failures (one agent's bad output poisons downstream agents)
- Overloading the orchestrator (giving it too many decisions reduces quality)

## Anti-Patterns

- **Cascade failure**: Upstream agent failure poisons all downstream â€” validate outputs at each step
- **Orchestrator decision fatigue**: Too many delegation decisions degrades orchestrator quality â€” limit to 4-5 workers per orchestrator
- **Context explosion**: Accumulated history across agents exceeds context window â€” use summarization between steps
- **Deadlock**: Agents waiting on each other â€” implement timeout per agent step
- **Cost explosion**: Multi-agent workflow runs 10x token count of single-agent â€” implement budget caps per workflow

## Examples

The following ecosystem packages provide reference implementations:

- Support ticket triage: routing agent â†’ billing/tech/sales agents
- Document processing: chain agent for extract â†’ classify â†’ summarize â†’ store
- Research assistant: orchestrator delegates to search â†’ analyze â†’ synthesize â†’ write agents
- Code review pipeline: parallel static analysis + AI review + security check agents

## Related Topics

- KU-011: Agent Architecture Fundamentals
- KU-013: Graph-Based Workflows
- KU-014: Durable Agent Runtime
- KU-015: Queued Agent Execution

## AI Agent Notes

- When asked about Multi-Agent Patterns, first determine the specific use case and requirements.
- Reference the core concepts as foundational understanding before diving into implementation.
- Consider the architecture guidelines when designing the solution.
- Review common mistakes and anti-patterns to avoid pitfalls.
- Check related topics for complementary knowledge units.

## Verification

- [ ] Core concepts are understood and applied correctly.
- [ ] Best practices from the patterns section are followed.
- [ ] Architecture guidelines are implemented.
- [ ] Performance implications are accounted for in the design.
- [ ] Security considerations are addressed.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.

