# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** agentic-workflows
**Knowledge Unit:** ku-05
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Cache tool results
- [ ] Handle errors gracefully.
- [ ] Implement parallel tool execution
- [ ] Return results in a consistent format.
- [ ] Validate tool call arguments
- [ ] All tool calls are validated server-side before execution.
- [ ] Every tool execution is logged with arguments, result, and latency.
- [ ] Every tool has a unique name, description, and documented parameter schema.
- [ ] Limit Active Tool Set to 15-20 Per Agent
- [ ] Log Every Tool Execution
- [ ] Parallelize Independent Tool Calls
- [ ] Return Consistent Structured Tool Results
- [ ] Validate Tool Call Arguments Server-Side

---

# Architecture Checklist

- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement defense layers: input validation, output guarding, and content filtering

---

# Implementation Checklist

- [ ] Cache tool results
- [ ] Handle errors gracefully.
- [ ] Implement parallel tool execution
- [ ] Return results in a consistent format.
- [ ] Validate tool call arguments
- [ ] Write clear, specific tool names and descriptions.
- [ ] Limit Active Tool Set to 15-20 Per Agent
- [ ] Log Every Tool Execution
- [ ] Parallelize Independent Tool Calls
- [ ] Return Consistent Structured Tool Results
- [ ] Validate Tool Call Arguments Server-Side
- [ ] Write Clear, Specific Tool Names and Descriptions

---

# Performance Checklist

- [ ] Consider **lazy schema loading**: only include tools relevant to the current task, not the full registry.
- [ ] Large schemas may cause the LLM to ignore tools (attention dilution). Keep active tool sets under 15-20.
- [ ] Parallel tool calls can be executed concurrently, reducing wall-clock time from sum to max of tool latencies.
- [ ] Tool call latency adds directly to total agent response time. Each tool call = network + compute + parsing.
- [ ] Tool schemas count toward prompt tokens. A schema with 10 tools each having 5 parameters adds ~1000-2000 tokens.

---

# Security Checklist

- [ ] Audit logging:
- [ ] Idempotency:
- [ ] Input sanitization:
- [ ] Rate limiting:
- [ ] Tool authorization:

---

# Reliability Checklist

- [ ] Forgetting that tool schemas count toward the context window (and the cost).
- [ ] Letting the LLM call tools with raw user input â€” always validate and sanitize arguments server-side.
- [ ] Not handling tool call errors â€” the agent gets a crash instead of a graceful error message.
- [ ] Not including descriptions in tool schemas â€” the LLM doesn't know what the tool does or when to call it.
- [ ] Returning unstructured text as tool results â€” the LLM struggles to parse and use it.

---

# Testing Checklist

- [ ] All tool calls are validated server-side before execution.
- [ ] Every tool execution is logged with arguments, result, and latency.
- [ ] Every tool has a unique name, description, and documented parameter schema.
- [ ] Parallel tool execution is implemented for independent tools.
- [ ] Tool authorization is checked per call (not just at agent instantiation).
- [ ] Tool results are returned in a structured format with success/error indication.
- [ ] Tool schemas are generated from code (not hand-written JSON) to ensure consistency.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [No Schema Validation on Structured Agent Output]
- [ ] [Trusting Structured Output Guarantee â€” No Server-Side Check]
- [ ] [Not Handling Output Truncation (Finish Reason Checks)]
- [ ] [Overly Complex Schema That Restricts Valid Outputs]
- [ ] [No Retry on Invalid Output]
- [ ] No-Op Tools:
- [ ] Side Effect Without Confirmation:
- [ ] Tool Soup:
- [ ] Tool-as-Database:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


