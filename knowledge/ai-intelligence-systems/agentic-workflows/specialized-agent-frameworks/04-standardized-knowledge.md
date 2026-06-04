---
id: KU-017
title: "Specialized Agent Frameworks"
subdomain: "agentic-workflows"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/03-agentic-workflows/specialized-agent-frameworks/04-standardized-knowledge.md"
---

# Specialized Agent Frameworks

## Overview

Beyond the first-party Laravel AI SDK, the PHP ecosystem has specialized agent frameworks that extend agent capabilities. SuperAgent (v0.8.6) is an enterprise multi-agent SDK with team management. LarAgent is a LangChain-inspired agent builder with planning and memory. Conductor focuses on orchestration with middleware pipelines. These fill gaps not yet addressed by the core SDK.

## Core Concepts

- **SuperAgent** (`ForgeOmni/SuperAgent`): Multi-agent teams, each agent has role, tools, memory. Manager agent coordinates team. Enterprise features: billing, usage tracking, team management.
- **LarAgent**: LangChain-inspired â€” chains, agents with planning/reasoning, tool sets, memory types (buffer, summary, vector). Strong on structured prompt templates.
- **Conductor** (`akoslabs/conductor`): Focus on agent orchestration and middleware â€” building pipelines of agents with middleware for logging, validation, security.
- **AgentGraph** (`heinergiehl/agent-graph`): Durable graph workflows with checkpointing (see KU-014).

## When To Use

- Production applications requiring Specialized Agent Frameworks functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Team-based agents** (SuperAgent): Define agents by role (researcher, writer, reviewer), manager orchestrates
- **Chain composition** (LarAgent): Build complex behavior by composing simple chains
- **Planner-executor** (LarAgent): Agent plans steps first, then executes â€” reduces token waste on wrong paths
- **Middleware pipeline** (Conductor): Stack middleware on agent execution for logging, validation, transformation

- **Microservice architecture for AI**: SuperAgent treats agents as independent services with defined roles and communication protocols, coordinated by a manager.
- **LangChain for PHP**: LarAgent explicitly follows LangChain patterns â€” chains, agents, tools, memory â€” translated to Laravel conventions.

## Architecture Guidelines

- **Decision**: Standalone vs. SDK-integrated â†’ All are standalone packages. Reason: They predate the Laravel AI SDK or offer features the SDK doesn't yet have. Migration path: SDK covers 80% of use cases; these fill specific gaps.
- **Decision**: LangChain semantics (LarAgent) vs. Laravel-native (SuperAgent) vs. focused utility (Conductor) â†’ Different design philosophies. LarAgent appeals to developers coming from Python; SuperAgent to enterprise teams; Conductor to teams needing middleware.

## Performance Considerations

- SuperAgent's team manager adds orchestration overhead (~1-2 additional LLM calls per task)
- LarAgent's planner adds preprocessing step â€” increases latency but reduces wasted tool calls
- Conductor middleware chain adds per-node overhead â€” keep middleware count low
- AgentGraph checkpointing adds serialization cost per node

| Package | Pros | Cons |
|---------|------|------|
| SuperAgent | Enterprise features (billing, teams), stable | Integration effort with Laravel AI SDK not documented |
| LarAgent | LangChain patterns, planning, memory types | Python mentality in PHP, may feel unidiomatic |
| Conductor | Middleware pipeline, clean orchestration | Small community, slower development |
| AgentGraph | Durable workflows, checkpoints, human-in-loop | MVP stage, API unstable |

## Security Considerations

- Evaluate whether the Laravel AI SDK's built-in agent features cover your needs before adding a framework
- Consider migration path â€” these packages may be absorbed into the SDK over time
- Test with `Ai::fake()` â€” verify these packages work with Laravel's testing fakes
- Monitor package maintenance â€” community packages may lag behind Laravel releases
- Document framework choice in team wiki â€” ensure consistent pattern usage

## Common Mistakes

- Installing multiple frameworks that overlap â€” use one agent framework per application
- Assuming frameworks are compatible with each other or with Laravel AI SDK's agent system
- Using a framework for simple agents (over-engineering)
- Not testing framework-specific features (e.g., SuperAgent's team billing)

## Anti-Patterns

- **Framework deprecation**: Community package abandoned â€” migration back to SDK may be costly
- **Incompatibility with Laravel version**: Package lags behind Laravel releases â€” pin Laravel version
- **Feature overlap conflict**: SDK and framework both try to manage conversation memory â€” data inconsistency
- **Performance overhead**: Framework adds unnecessary abstraction layers for simple use cases

## Examples

The following ecosystem packages provide reference implementations:

- SuperAgent for multi-tenant enterprise AI with billing requirements
- LarAgent for teams migrating from Python LangChain to PHP
- Conductor for complex middleware-heavy agent pipelines
- AgentGraph for long-running, checkpointed, human-in-the-loop workflows

## Related Topics

- KU-011: Agent Architecture Fundamentals
- KU-012: Multi-Agent Patterns
- KU-013: Graph-Based Workflows
- KU-014: Durable Agent Runtime

## AI Agent Notes

- When asked about Specialized Agent Frameworks, first determine the specific use case and requirements.
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

