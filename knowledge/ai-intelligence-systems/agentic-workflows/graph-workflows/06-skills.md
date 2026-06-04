# Skill: Design and Implement Graph-Based Workflows
## Purpose
Build durable, stateful multi-step processes using directed graph workflows with branching, parallel fan-out, loops, and human-in-the-loop approval gates.
## When To Use
- Multi-step document processing pipelines (extract -> classify -> redact -> store -> notify)
- Customer onboarding workflows with human approval gates
- Long-running research agents with iterative refinement
- Automated content moderation with escalation flows
## When NOT To Use
- Simple linear chains that can be implemented as sequential agent calls
- Stateless request-response patterns
- Prototypes where graph overhead (state management, checkpointing) isn't justified
## Prerequisites
- Laravel application with queue support
- Graph workflow package (LaraGraph, AgentGraph) or custom implementation
- Understanding of directed graph concepts (nodes, edges, state)
- State serialization knowledge
## Inputs
- Workflow step definitions (nodes)
- Transition rules between steps (edges, conditional routing)
- State schema definition
- Checkpoint and persistence configuration
## Workflow (numbered)
1. Define graph nodes — each node is a processing step (agent, tool, or custom callable)
2. Define edges between nodes — sequential, conditional, parallel fan-out/fan-in
3. Define typed state schema passed through the graph
4. Implement conditional branching with a catch-all/default edge
5. Set max iteration guards on all loops (prevent infinite loops)
6. Configure checkpointing strategy (every-node, interval, or manual)
7. Implement human-in-the-loop pause points for approval gates
8. Add workflow-level timeout to abandon stuck workflows
9. Test every node, every edge, and every conditional branch exhaustively
10. Implement error subgraph for graceful failure handling
## Validation Checklist
- [ ] Graph nodes represent distinct processing steps
- [ ] Every conditional branch has a catch-all/default edge
- [ ] All loops have max iteration guards
- [ ] Checkpoint strategy configured (every-node recommended for production)
- [ ] Human-in-the-loop gates have timeout and default action
- [ ] Workflow-level timeout prevents infinite execution
- [ ] All graph branches tested exhaustively (not just happy path)
- [ ] State schema versioned for backward compatibility
- [ ] Error subgraph or error handling exists for node failures
## Common Failures
- Using graph workflows when a simple chain suffices (over-engineering)
- Not defining max iterations on loops — infinite loops consume tokens indefinitely
- No catch-all edge — workflow gets stuck with no defined transition
- Parallel nodes with shared mutable state — race conditions
- Conditional edges that don't cover all cases — workflow gets stuck
## Decision Points
- **Explicit graph vs code-defined**: Explicit graph definition for inspectability, debuggability, serialization
- **Typed state schema vs free-form array**: Typed state objects for serialization, validation, checkpointing reliability
- **Synchronous vs async execution**: Synchronous for predictable flows; async for long-running workflows
## Performance Considerations
- Checkpoint serialization adds latency per node boundary — batch checkpoint for high-throughput workflows
- State object size grows as workflow progresses — prune unnecessary state before checkpointing
- Parallel fan-out bounded by queue worker concurrency
- Graph compilation done once per workflow definition — cache compiled graph
## Security Considerations
- Define max execution time per workflow — prevent runaway graph traversal
- Implement dead letter queues for failed workflows
- Monitor checkpoint storage size — growing state objects indicate missing cleanup
- Version graph definitions — breaking changes to state schema require migration
- Human-in-the-loop requires webhook/API — implement timeout for approval waiting
## Related Rules (from 05-rules.md)
- Use Graph Workflows Only When Necessary
- Define Catch-All Edges for Conditional Branches
- Set Max Iteration Guards on All Loops
- Test All Graph Branches Exhaustively
## Related Skills
- Implement Durable Agent Workflows with Checkpointing
- Implement Multi-Agent Patterns
- Create a Single-Responsibility Agent Class
## Success Criteria
- Complex multi-step workflows execute reliably with proper error handling
- All conditional branches have defined transitions (no stuck workflows)
- Loops terminate after configured max iterations
- Human-in-the-loop approval gates work with timeout fallback
- Graph visualization aids debugging and team communication
