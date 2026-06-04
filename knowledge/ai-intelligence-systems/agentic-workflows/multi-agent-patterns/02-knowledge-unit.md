# Knowledge Unit: Multi-Agent Patterns

## Metadata

- **ID:** KU-012
- **Subdomain:** Agent Architecture & Orchestration
- **Slug:** multi-agent-patterns
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

The Laravel AI SDK ships five multi-agent patterns based on Anthropic research: chaining, routing, parallelization, orchestrator-workers, and sub-agents. These enable complex workflows by composing multiple specialized agents. Each pattern addresses a specific coordination problem, and the SDK provides PHP implementations with tool calling, memory, failover, and queue support.

## Core Concepts

- **Chaining**: Sequential agents where each agent's output is the next agent's input — decomposes complex tasks into manageable steps
- **Routing**: Classifier agent routes input to specialized handler agents — separates concerns by domain
- **Parallelization**: Multiple agents work simultaneously on different aspects — fan-out for independent subtasks
- **Orchestrator-Worker**: Orchestrator agent plans and delegates to worker agents, synthesizes results — most flexible pattern
- **Sub-agents**: Agent delegates sub-tasks to child agents, receives structured results — hierarchical

## Mental Models

- **Pipeline pattern**: Like Unix pipes — output of one command feeds into next. Chain agents for sequential transformation.
- **Router pattern**: Like Laravel router — classifier middleware maps request to appropriate controller (agent).
- **Orchestrator pattern**: Like a project manager — breaks work into tasks, assigns to specialists, reviews and assembles output.
- **Microservices for AI**: Each agent is a service with specific expertise, communicating through structured messages.

## Internal Mechanics

Each multi-agent pattern is implemented as application-level composition, not SDK primitives. The SDK provides Agent classes; the developer orchestrates them in PHP code.

**Chaining**: Agent A's response is passed as context to Agent B. Can include quality gates between steps — validation agent checks output before passing to next.

**Routing**: A classifier agent receives the input and returns a structured decision (e.g., `{ "route": "billing" }`), which the application uses to invoke the appropriate specialist agent.

**Parallelization**: Use Laravel's concurrency facade (`Concurrency::run()`) or queue to fan out to multiple agents simultaneously, then aggregate results.

**Orchestrator-Worker**: The orchestrator agent receives the goal, creates a plan, delegates through tool calls to worker agents, and receives structured responses. The orchestrator's instructions define how to decompose and synthesize.

**Sub-agents**: An agent uses a tool that spawns and executes another agent, returning structured results. The sub-agent has its own instructions, tools, and schema.

## Patterns

- **Quality gates**: Between chain steps, use a lightweight validation agent to check output quality before proceeding
- **Route caching**: Cache routing decisions for identical inputs — skip classifier for repetitive queries
- **Parallel aggregation**: Fan-out identical queries to multiple models, compare results for consensus
- **Orchestrator checklist**: Orchestrator instructions define plan structure, delegation format, and synthesis rules
- **Sub-agent factory**: Tool creates agent instances with scoped context and returns structured results

## Architectural Decisions

- **Decision**: Application-level orchestration vs. framework primitives → Multi-agent patterns are composed in PHP, not provided as SDK methods. Reason: Patterns vary too much to codify; SDK provides building blocks, not workflows.
- **Decision**: Structured output for handoff vs. raw text → Agents use `HasStructuredOutput` for inter-agent communication. Reason: Type-safe, validated handoff prevents cascading errors.
- **Decision**: Synchronous vs. parallel execution → Pattern-dependent. Chaining and routing are sequential by nature. Parallel fan-out uses Concurrency facade. Orchestrator can mix sequential and parallel.

## Tradeoffs

| Tradeoff | Pro | Con |
|----------|-----|-----|
| More agents = better specialization | Each agent has focused context | Exponential token cost, coordination overhead |
| Orchestrator pattern | Most flexible | Orchestrator becomes bottleneck, adds latency |
| Parallel execution | Faster than sequential | Harder to debug, race conditions in shared state |
| Application-level orchestration | Full control over flow | More boilerplate than declarative workflow |

## Performance Considerations

- Each agent call costs tokens — multi-agent workflows cost 2-10x single agent
- Sequential chains: total latency = sum of individual agent latencies
- Parallel fan-out: total latency = max of individual latencies, but token cost multiplies
- Orchestrator coordination overhead: 1-3 additional LLM calls for planning and synthesis
- Context windows compound — each agent in a chain sees accumulated context from prior agents

## Production Considerations

- Start with a single agent — only add multi-agent complexity when justified
- Timebox each agent step — slow agents block the entire workflow
- Implement circuit breakers per agent — one agent's failure shouldn't cascade
- Log inter-agent messages — critical for debugging multi-step failures
- Use structured output for agent handoffs — typed contracts prevent cascading errors
- Profile token usage per agent — identify cost outliers

## Common Mistakes

- Multi-agent before single-agent is validated (premature decomposition)
- Agents with overlapping responsibilities (tool selection ambiguity)
- No structured output between agents (raw text handoff causes misinterpretation)
- Ignoring cascading failures (one agent's bad output poisons downstream agents)
- Overloading the orchestrator (giving it too many decisions reduces quality)

## Failure Modes

- **Cascade failure**: Upstream agent failure poisons all downstream — validate outputs at each step
- **Orchestrator decision fatigue**: Too many delegation decisions degrades orchestrator quality — limit to 4-5 workers per orchestrator
- **Context explosion**: Accumulated history across agents exceeds context window — use summarization between steps
- **Deadlock**: Agents waiting on each other — implement timeout per agent step
- **Cost explosion**: Multi-agent workflow runs 10x token count of single-agent — implement budget caps per workflow

## Ecosystem Usage

- Support ticket triage: routing agent → billing/tech/sales agents
- Document processing: chain agent for extract → classify → summarize → store
- Research assistant: orchestrator delegates to search → analyze → synthesize → write agents
- Code review pipeline: parallel static analysis + AI review + security check agents

## Related Knowledge Units

- KU-011: Agent Architecture Fundamentals
- KU-013: Graph-Based Workflows
- KU-014: Durable Agent Runtime
- KU-015: Queued Agent Execution

## Research Notes

- Five patterns based on Anthropic's "Building Effective Agents" research (published Dec 2024)
- Laravel AI SDK blog covers all five patterns with code examples (May 2026)
- Gartner estimates 40% of enterprise apps will embed AI agents by end of 2026
- Most production systems evolve from single-agent → two-agent → multi-agent as complexity demands
- Industry rule: More than 4 workers in one orchestrator → decompose into sub-graphs
