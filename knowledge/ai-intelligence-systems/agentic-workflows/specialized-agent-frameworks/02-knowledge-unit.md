# Knowledge Unit: Specialized Agent Frameworks

## Metadata

- **ID:** KU-017
- **Subdomain:** Agent Architecture & Orchestration
- **Slug:** specialized-agent-frameworks
- **Version:** 1.0.0
- **Maturity:** Stable (SuperAgent, LarAgent) / Emerging (Conductor)
- **Status:** Published

## Executive Summary

Beyond the first-party Laravel AI SDK, the PHP ecosystem has specialized agent frameworks that extend agent capabilities. SuperAgent (v0.8.6) is an enterprise multi-agent SDK with team management. LarAgent is a LangChain-inspired agent builder with planning and memory. Conductor focuses on orchestration with middleware pipelines. These fill gaps not yet addressed by the core SDK.

## Core Concepts

- **SuperAgent** (`ForgeOmni/SuperAgent`): Multi-agent teams, each agent has role, tools, memory. Manager agent coordinates team. Enterprise features: billing, usage tracking, team management.
- **LarAgent**: LangChain-inspired — chains, agents with planning/reasoning, tool sets, memory types (buffer, summary, vector). Strong on structured prompt templates.
- **Conductor** (`akoslabs/conductor`): Focus on agent orchestration and middleware — building pipelines of agents with middleware for logging, validation, security.
- **AgentGraph** (`heinergiehl/agent-graph`): Durable graph workflows with checkpointing (see KU-014).

## Mental Models

- **Microservice architecture for AI**: SuperAgent treats agents as independent services with defined roles and communication protocols, coordinated by a manager.
- **LangChain for PHP**: LarAgent explicitly follows LangChain patterns — chains, agents, tools, memory — translated to Laravel conventions.

## Internal Mechanics

**SuperAgent**:
- `AgentTeam` class groups agents with `TeamManager`
- Each agent has `role`, `tools`, `memory`, `model` configuration
- Manager agent receives task, breaks it down, assigns sub-tasks to team members
- Results aggregated by manager, final response returned
- Built-in usage tracking for billing — `TeamMonitor` tracks per-agent token consumption

**LarAgent**:
- `AgentBuilder` fluent API: `->withInstructions()`, `->withTools()`, `->withMemory()`, `->withPlanner()`
- `Planner` interface: agent plans steps before executing
- `Memory` types: `BufferMemory` (last N turns), `SummaryMemory` (summarized history), `VectorMemory` (RAG-based)
- Chains: `LLMChain`, `SequentialChain`, `RouterChain` — LangChain equivalents

## Patterns

- **Team-based agents** (SuperAgent): Define agents by role (researcher, writer, reviewer), manager orchestrates
- **Chain composition** (LarAgent): Build complex behavior by composing simple chains
- **Planner-executor** (LarAgent): Agent plans steps first, then executes — reduces token waste on wrong paths
- **Middleware pipeline** (Conductor): Stack middleware on agent execution for logging, validation, transformation

## Architectural Decisions

- **Decision**: Standalone vs. SDK-integrated → All are standalone packages. Reason: They predate the Laravel AI SDK or offer features the SDK doesn't yet have. Migration path: SDK covers 80% of use cases; these fill specific gaps.
- **Decision**: LangChain semantics (LarAgent) vs. Laravel-native (SuperAgent) vs. focused utility (Conductor) → Different design philosophies. LarAgent appeals to developers coming from Python; SuperAgent to enterprise teams; Conductor to teams needing middleware.

## Tradeoffs

| Package | Pros | Cons |
|---------|------|------|
| SuperAgent | Enterprise features (billing, teams), stable | Integration effort with Laravel AI SDK not documented |
| LarAgent | LangChain patterns, planning, memory types | Python mentality in PHP, may feel unidiomatic |
| Conductor | Middleware pipeline, clean orchestration | Small community, slower development |
| AgentGraph | Durable workflows, checkpoints, human-in-loop | MVP stage, API unstable |

## Performance Considerations

- SuperAgent's team manager adds orchestration overhead (~1-2 additional LLM calls per task)
- LarAgent's planner adds preprocessing step — increases latency but reduces wasted tool calls
- Conductor middleware chain adds per-node overhead — keep middleware count low
- AgentGraph checkpointing adds serialization cost per node

## Production Considerations

- Evaluate whether the Laravel AI SDK's built-in agent features cover your needs before adding a framework
- Consider migration path — these packages may be absorbed into the SDK over time
- Test with `Ai::fake()` — verify these packages work with Laravel's testing fakes
- Monitor package maintenance — community packages may lag behind Laravel releases
- Document framework choice in team wiki — ensure consistent pattern usage

## Common Mistakes

- Installing multiple frameworks that overlap — use one agent framework per application
- Assuming frameworks are compatible with each other or with Laravel AI SDK's agent system
- Using a framework for simple agents (over-engineering)
- Not testing framework-specific features (e.g., SuperAgent's team billing)

## Failure Modes

- **Framework deprecation**: Community package abandoned — migration back to SDK may be costly
- **Incompatibility with Laravel version**: Package lags behind Laravel releases — pin Laravel version
- **Feature overlap conflict**: SDK and framework both try to manage conversation memory — data inconsistency
- **Performance overhead**: Framework adds unnecessary abstraction layers for simple use cases

## Ecosystem Usage

- SuperAgent for multi-tenant enterprise AI with billing requirements
- LarAgent for teams migrating from Python LangChain to PHP
- Conductor for complex middleware-heavy agent pipelines
- AgentGraph for long-running, checkpointed, human-in-the-loop workflows

## Related Knowledge Units

- KU-011: Agent Architecture Fundamentals
- KU-012: Multi-Agent Patterns
- KU-013: Graph-Based Workflows
- KU-014: Durable Agent Runtime

## Research Notes

- SuperAgent: 107+ stars, v0.8.6, stable but community-maintained
- LarAgent: featured on Laravel.io (Apr 2025), stable
- Conductor: 45+ stars, emerging
- Laravel AI SDK may absorb some of these features in future releases — SuperAgent's team management and LarAgent's planner are frequently requested
