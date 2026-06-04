# Skill: Implement Multi-Agent Patterns
## Purpose
Compose multiple specialized agents using chaining, routing, parallelization, orchestrator-worker, or sub-agent patterns for complex AI workflows.
## When To Use
- Complex tasks decomposable into distinct sub-tasks requiring different expertise
- Support ticket triage (routing: billing, tech, sales agents)
- Document processing pipelines (chain: extract -> classify -> summarize -> store)
- Research assistants (orchestrator delegates to search, analyze, synthesize agents)
## When NOT To Use
- Simple use cases solvable with a well-designed single agent
- Before validating that a single-agent approach is insufficient
- Prototypes where multi-agent complexity outweighs benefits
## Prerequisites
- Laravel AI SDK installed with agent support
- Understanding of single-agent fundamentals
- `HasStructuredOutput` for agent-agent communication
- `HasTools` for agent capabilities
## Inputs
- Task description and decomposition plan
- Specialized agent definitions (instructions, tools, schema)
- Pattern selection (chain, route, parallel, orchestrator, sub-agent)
- Quality gate definitions between agent steps
## Workflow (numbered)
1. Start with a single agent and validate it's insufficient before decomposing
2. Choose the appropriate multi-agent pattern:
   - **Chaining**: Sequential agents where each output feeds into the next
   - **Routing**: Classifier agent routes input to specialized handler agents
   - **Parallelization**: Multiple agents work simultaneously on independent subtasks
   - **Orchestrator-Worker**: Orchestrator plans, delegates to workers, synthesizes results
   - **Sub-agents**: Agent delegates sub-tasks to child agents
3. Use `HasStructuredOutput` for typed, validated inter-agent communication
4. Timebox each agent step with `#[MaxTokens]` and `#[MaxSteps]`
5. Implement quality gates between chain steps to validate output before passing along
6. Cache routing decisions for identical inputs to skip classifier
7. Log inter-agent messages for debugging multi-step failures
8. Implement budget caps per workflow for cost control
## Validation Checklist
- [ ] Single-agent approach proven insufficient before multi-agent decomposition
- [ ] Inter-agent communication uses structured output, not raw text
- [ ] Each agent has tuned `#[MaxTokens]` and `#[MaxSteps]`
- [ ] Quality gates validate output between chain steps
- [ ] Routing decisions cached where applicable
- [ ] Workflow-level budget caps implemented
- [ ] Inter-agent messages logged for debugging
- [ ] Error handling prevents cascade failures
## Common Failures
- Multi-agent before single-agent is validated (premature decomposition)
- Agents with overlapping responsibilities (tool selection ambiguity)
- No structured output between agents — raw text handoff causes misinterpretation
- Ignoring cascading failures — one agent's bad output poisons downstream
- Overloading the orchestrator — too many decisions reduces quality
## Decision Points
- **Pattern selection**: Chain for sequential transformation, routing for classification, parallel for independent subtasks, orchestrator for flexible delegation
- **Agent-agent handoff**: Structured output for typed contracts; raw text only for final user-facing output
- **Synchronous vs parallel**: Chain sequentially by nature; parallel fan-out for independent subtasks
## Performance Considerations
- Each agent call costs tokens — multi-agent costs 2-10x single agent
- Sequential chains: total latency = sum of individual agent latencies
- Parallel fan-out: total latency = max of individual latencies, but token cost multiplies
- Orchestrator coordination: 1-3 additional LLM calls for planning and synthesis
## Security Considerations
- Timebox each agent step — slow agents block the entire workflow
- Implement circuit breakers per agent — one agent's failure shouldn't cascade
- Log inter-agent messages critical for debugging multi-step failures
- Use structured output for agent handoffs — typed contracts prevent cascading errors
- Profile token usage per agent to identify cost outliers
## Related Rules (from 05-rules.md)
- Start with a Single Agent Before Multi-Agent
- Use Structured Output for Inter-Agent Communication
- Timebox Each Agent Step
- Implement Quality Gates Between Chain Steps
## Related Skills
- Create a Single-Responsibility Agent Class
- Design and Implement Graph-Based Workflows
- Implement Queued Agent Execution
## Success Criteria
- Multi-agent workflow solves tasks a single agent cannot handle effectively
- Inter-agent communication is typed, validated, and debuggable
- One agent's failure does not cascade to other agents
- Cost and latency are within acceptable bounds for the use case
