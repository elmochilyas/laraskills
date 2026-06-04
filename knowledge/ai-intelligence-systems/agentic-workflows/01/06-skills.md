# Skill: Implement Agent Loop with Tool Orchestration
## Purpose
Build a perceive-think-act agent loop with configurable iteration limits, tool registry, server-side validation, and structured logging for multi-step AI workflows.
## When To Use
- Automating multi-step workflows requiring conditional branching (support ticket triage, knowledge base lookup, escalation)
- Tasks where operation sequence is not known at design time (code generation, iterative analysis)
- Systems that interact with external APIs or databases based on natural language intent
## When NOT To Use
- Simple single-turn Q&A (use direct LLM call without agent loop)
- Purely deterministic workflows (use static pipeline or state machine)
- Tasks exceeding tool-calling reliability for the chosen model
- High-throughput, low-latency paths where agent loop overhead is unacceptable
## Prerequisites
- LLM provider with tool-calling capability
- Tool definitions with typed schemas (name, description, parameters)
- Tool registry pattern for dispatching tool calls
- Message history data structure
## Inputs
- User input/query
- Tool registry with tool definitions
- Max iteration limit (default 10-15)
- System prompt with agent persona and behavioral guardrails
## Workflow (numbered)
1. Design tool registry with `register()`, `schemas()`, and `dispatch()` methods
2. Define tool schemas with typed parameters, descriptions, and constraints
3. Set configurable max iteration limit (default ≤15) on the perceive-think-act loop
4. Validate every tool call argument against its schema before execution
5. Return structured error messages to the LLM for recoverable tool errors
6. Log full message history per iteration (user input, assistant response, tool calls, tool results)
7. Implement early stop detection when LLM response has no tool calls
8. Implement idempotency keys for side-effect tools (create, update, delete)
9. Separate orchestration logic from business logic (dedicated orchestrator class)
## Validation Checklist
- [ ] Agent loop has configurable max iteration limit (default ≤15)
- [ ] Tool schemas include descriptions for every parameter
- [ ] Tool call arguments validated server-side before dispatch
- [ ] Structured error messages returned to LLM for recoverable errors
- [ ] Full message history logged per iteration
- [ ] Side-effect tools implement idempotency keys
- [ ] Agent orchestration separated from business logic
- [ ] System prompt concise — tool descriptions in schemas, not prompt
## Common Failures
- No max iteration limit — infinite loops with runaway costs
- Storing raw LLM response without validation — malformed tool calls crash the loop
- Mixing orchestration code with business logic — can't swap models or tool registries
- Over-trusting LLM JSON output — always validate before dispatch
- Forgetting to trim message history when approaching context limits
## Decision Points
- **Tool schema format**: Provider-specific (OpenAI-style vs Anthropic-style) — validate format matches provider
- **Tool registry pattern**: Central map vs distributed registration — central for single source of truth
- **Iteration limit**: 10-15 for interactive, 20-50 for background queue workflows
## Performance Considerations
- Each iteration adds 300-1500ms latency (LLM inference time)
- Token consumption grows linearly with iterations
- Implement early stop detection if two consecutive identical responses (no tool calls)
- Cache tool results where possible for read-only tools
- Use streaming for the final answer to give users perceptible progress
## Security Considerations
- Every tool call must verify authorization — never trust LLM's choice alone
- Validate and sanitize tool parameters server-side against injection
- Agent message history may contain sensitive data — encrypt at rest, redact PII in logs
- Apply rate limits at tool-execution layer
- Never return raw tool results to end users without filtering sensitive fields
## Related Rules (from 05-rules.md)
- Always Set Max Iteration Limit
- Validate Tool Call Arguments Server-Side
- Return Structured Error Messages to the LLM
- Log Full Message History for Debugging
- Keep System Prompts Concise
- Implement Idempotency Keys for Side-Effect Tools
- Separate Orchestration from Business Logic
## Related Skills
- Create a Single-Responsibility Agent Class
- Implement Multi-Agent Patterns
- Test AI Features with Fakes
## Success Criteria
- Agent completes tasks within configured iteration limit
- Tool call validation catches malformed arguments before execution
- Structured error messages enable LLM self-correction
- Full message history logged enables debugging and replay
- Side-effect idempotency prevents duplicate operations
