# Skills

## Skill 1: Design multi-agent systems with strict role-based tool boundaries

### Purpose
Coordinate multiple AI agents with dedicated roles, tool sets, and context windows using orchestrator/supervisor patterns, shared message buses, and handoff protocols to decompose complex tasks across specialized agents.

### When To Use
- Use when a single agent's tool set or context window is insufficient for the task
- Use when different parts of a task require different expertise, personas, or security levels
- Use when you need specialized agents with isolated tool access (least privilege)
- Use when building complex workflows that benefit from parallel agent execution

### When NOT To Use
- Do NOT use when a single agent can handle the task — multi-agent adds unnecessary complexity
- Do NOT use when agents share tools — overlapping tool sets create security holes and role confusion
- Do NOT use without defining strict handoff protocols between agents

### Prerequisites
- Laravel AI SDK with agent primitives
- Defined agent roles with non-overlapping tool sets
- Message bus infrastructure (in-memory, Redis, or database)
- Understanding of orchestrator/supervisor pattern

### Inputs
- Task description requiring multi-agent decomposition
- Agent role definitions (persona, tools, context window limits)
- Orchestration configuration (execution order, handoff rules)
- Shared message format for inter-agent communication

### Workflow
1. Decompose the task into sub-tasks, each assigned to a specialized agent role
2. Define each agent with a unique persona, system prompt, and non-overlapping tool set
3. Implement an orchestrator/supervisor agent that delegates tasks and synthesizes outputs
4. Set up a shared message bus (Redis, database, or in-memory) for inter-agent communication
5. Define handoff protocols: explicit tool calls, orchestration-layer routing, or message-based delegation
6. Implement voting/consensus for parallel agent evaluation: majority vote or weighted scoring
7. Configure tool boundaries strictly — never let two agents share tools unless designed for redundancy
8. Add human-in-the-loop approval for critical decision points
9. Test the multi-agent system with integration tests covering all handoff paths

### Validation Checklist
- [ ] Each agent has a unique role with non-overlapping tools
- [ ] Orchestrator delegates tasks and synthesizes outputs correctly
- [ ] Handoff protocols work for all agent-to-agent transitions
- [ ] Tool boundaries prevent unauthorized access across agents
- [ ] Message bus delivers messages reliably between agents
- [ ] Voting/consensus works for parallel evaluation patterns
- [ ] Human-in-the-loop stops execution at critical points
- [ ] Integration tests cover all handoff paths and error scenarios
- [ ] Agent isolation prevents one agent's failure from crashing others

### Common Failures
- **Overlapping tools**: Two agents share tools — less-trusted agent accesses sensitive functionality
- **No handoff protocol**: Agents don't communicate results back — orchestrator never gets output
- **Context overflow**: Agent context overwhelmed by message history — implement summarization
- **Voting deadlock**: Consensus algorithm doesn't converge — implement tie-breaking rules
- **Agent loop**: Orchard doesn't terminate — implement max iteration limits

### Decision Points
- **Orchestration pattern**: Supervisor-worker (simple) vs. peer-to-peer swarm (complex) — supervisor for most cases
- **Handoff mechanism**: Explicit tool call vs. message bus routing — message bus for asynchronous systems
- **Consensus method**: Majority vote (fast) vs. weighted scoring (accurate) — match to task criticality

### Performance Considerations
- Multi-agent systems add latency proportional to agent count and communication overhead
- Parallel agent execution improves throughput but may hit provider rate limits
- Message bus adds latency — use in-memory for synchronous, Redis for distributed
- Orchestrator can become a bottleneck — consider load-balanced orchestrator instances

### Security Considerations
- Strict tool boundaries prevent privilege escalation between agents
- Message bus contents should be encrypted for sensitive data
- Orchestrator should validate all agent outputs before forwarding
- Each agent should authenticate to the message bus
- Audit log all inter-agent communications

### Related Rules
- R1: Define Agent Roles with Strict Tool Boundaries — overlapping tools confuse roles and create security holes

### Related Skills
- Design agent communication protocols with standardized message envelopes
- Implement agent planning and reasoning strategies
- Build agent orchestration frameworks with async execution via queues
- Implement agent memory and state persistence

### Success Criteria
- Each agent operates within its defined role and tool boundaries
- Orchestrator successfully decomposes and synthesizes complex tasks
- Handoffs between agents complete without data loss
- Consensus produces correct results for parallel evaluation tasks
- Tool isolation prevents unauthorized access between agents
- Multi-agent system degrades gracefully when individual agents fail
