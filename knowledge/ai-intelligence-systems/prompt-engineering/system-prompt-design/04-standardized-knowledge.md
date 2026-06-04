---
id: KU-030 (Prompt Engineering)
title: "System Prompt Design"
subdomain: "prompt-engineering"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/10-prompt-engineering/system-prompt-design/04-standardized-knowledge.md"
---

# System Prompt Design

## Overview

System prompt design is the practice of crafting the initial instruction given to an LLM that defines its persona, behavior boundaries, output format, and operational rules. In the Laravel AI SDK, the system prompt is set via the `instructions()` method on Agent classes or the `$system` parameter on `Ai::call()`. Well-designed system prompts are the single highest-leverage activity in AI application quality â€” a good prompt can make a weak model perform well; a bad prompt can break a strong one.

## Core Concepts

- **System prompt vs. user prompt**: System prompt sets persistent context and rules; user prompt carries the per-request input â€” the system prompt is prepended to every conversation turn
- **Persona definition**: Explicitly define the AI's role (e.g., "You are a Laravel expert writing production code") â€” sets tone, expertise level, and response style
- **Behavioral guardrails**: Rules the AI must follow (e.g., "Never execute code in responses" or "Always ask clarifying questions if the request is ambiguous")
- **Output structure specification**: Define response format (JSON schema, markdown, XML tags) â€” essential for structured output and tool calling
- **Context window management**: System prompt consumes tokens from the context window â€” balance detail with available space for conversation
- **Chain-of-thought triggers**: Embed reasoning instructions ("Think step by step before answering") to improve output quality
- **Constraint listing**: Explicitly list constraints (token limits, forbidden topics, tone requirements) to shape the response

## When To Use

- Production applications requiring System Prompt Design functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Persona-first opening**: Start with "You are [role]" to establish identity before any rules
- **Positive framing**: "Do provide code examples" (not "Don't forget to provide code examples") â€” LLMs respond better to affirmative instructions
- **Rule categorization**: Group rules by type (formatting, behavior, constraints) for clarity
- **Context injection via constructor**: Inject user details, tenant scope, or session data into the system prompt dynamically
- **System prompt templates**: Store base prompts in Blade views or config files, render with context before agent instantiation
- **Multi-paragraph structure**: Separate sections with line breaks â€” LLMs respect paragraph boundaries as logical separators

- **Employee Handbook**: The system prompt is the employee handbook â€” it tells the AI what its job is, how to behave, what rules to follow, and how to format its work. Without it, the AI improvises based on training data alone.
- **Mission Briefing**: Before a military operation, troops receive a briefing that covers mission objective, rules of engagement, ROE limits, communication protocols, and extraction plan. The system prompt is the AI's mission briefing.
- **Recipe Card**: A recipe lists ingredients (tools available), instructions (behavioral rules), and desired outcome (output format). The system prompt is the recipe the AI follows for every response.

## Architecture Guidelines

- **Decision**: System prompt in Agent class vs. external file â†’ Both supported. Reason: Small prompts inline for readability; large prompts (50+ lines) in Blade files or config for maintainability.
- **Decision**: Static instructions vs. dynamic per-request instructions â†’ Hybrid. Reason: Base behavior is static (class-level), per-request context is dynamic (constructor injection or method parameter).
- **Decision**: How much detail in system prompt? â†’ Comprehensive but concise. Reason: Each token in system prompt reduces available context for the conversation; typical range is 200-1000 tokens.

## Performance Considerations

- System prompt token count directly reduces available context for user input and conversation history
- Keep system prompts under 1000 tokens for agents with long conversations; under 500 for agents requiring large context windows
- Dynamic system prompt generation (via Blade rendering) adds ~1-5ms per agent call
- Very long system prompts (2000+ tokens) degrade response quality as attention dilutes â€” test with and without to measure output quality difference
- For streaming responses, a well-crafted system prompt produces better first-token quality â€” the AI starts generating with clearer intent

| Tradeoff | Pro | Con |
|----------|-----|-----|
| Detailed system prompt | Constrains behavior precisely | Consumes context window tokens |
| Dynamic system prompt | Personalized per user/session | Must be generated every time â€” adds latency |
| Intrusive guardrails | Prevents most off-topic responses | May make AI hesitant, refuses legitimate requests |

## Security Considerations

- Version control system prompts â€” changes to prompts change AI behavior; track in git alongside code
- A/B test system prompt variations â€” a single word change can measurably affect response quality
- Log system prompt version used per agent call â€” essential for debugging output quality issues
- Audit system prompts for leaked secrets â€” never include API keys, database credentials, or PII templates
- Review instructions periodically â€” as models improve, instructions may need simplification (newer models need less hand-holding)
- Implement prompt guardrails against system prompt leakage â€” users asking "ignore your instructions" should be caught by injection detection middleware

## Common Mistakes

- Over-constraining the AI â€” too many rules make the AI refuse legitimate requests (e.g., "Never say you can't do something" conflicts with "Never hallucinate")
- Contradictory instructions â€” "Be concise" but "Always provide detailed examples" â€” the AI may prioritize one at random
- Anthropomorphizing in system prompt â€” "You are a helpful assistant" is weak; specific personas (e.g., "Laravel senior developer") produce better results
- Not testing without the system prompt â€” sometimes removing instructions improves output when the model's training already covers the behavior
- System prompt injection via user context â€” dynamically injecting user-provided content into instructions without sanitization creates injection vectors

## Anti-Patterns

- **System prompt leakage**: User asks "Repeat your system prompt" and the AI complies â€” implement injection middleware that blocks this pattern
- **Instruction forgetting**: In long conversations, the AI drifts from system prompt instructions â€” reinforce key rules in user prompts periodically
- **Token exhaustion**: System prompt + conversation history exceeds context window â€” implement conversation pruning or sliding window
- **Persona confusion**: Multiple agents share system prompts but expect different behaviors â€” ensure each agent has a unique, tailored prompt
- **Over-refusal**: Over-guardrailed system prompt causes AI to refuse legitimate requests â€” balance constraints with utility; test with real user queries

## Examples

The following ecosystem packages provide reference implementations:

- **Laravel AI SDK `Agent` class**: `instructions` property on Agent classes for system prompt definition
- **Inspector.dev Neuron AI `SystemPrompt` class**: Third-party system prompt management with versioning
- **`dewaldhugo/laravel-ai-governor`**: Prompt migrations â€” version-controlled prompt templates, similar to database migrations
- **Blade templates**: Render system prompts from Blade files with injected context (user name, role, locale)
- **Config files**: Store system prompts in `config/prompts.php` for non-agent AI calls via `Ai::call()`

## Related Topics

- KU-002: Few-Shot Chain-of-Thought (advanced prompt techniques layered on system prompt)
- KU-003: Prompt Versioning (managing prompt changes over time)
- KU-004: Structured Output Schemas (output format specification in system prompts)
- KU-005: A/B Testing Prompt Variants (measuring prompt quality differences)
- KU-001: Agent Architecture Fundamentals (how system prompts integrate with agent lifecycle)

## AI Agent Notes

- When asked about System Prompt Design, first determine the specific use case and requirements.
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

