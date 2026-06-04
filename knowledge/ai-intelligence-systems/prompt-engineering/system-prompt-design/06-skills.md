# Skills

## Skill 1: Design and test secure, effective system prompts for Laravel AI agents

### Purpose
Craft system prompts that define the LLM's persona, behavior boundaries, output format, and operational rules, with adversarial input testing before deployment, ensuring no PII, secrets, or credentials are included in the prompt text.

### When To Use
- Use when creating new Agent classes in Laravel AI SDK
- Use when defining persona and behavior rules for AI assistants
- Use when setting up any production AI service that interacts with users
- Use when you need to enforce output format specifications
- Use before deploying any prompt change to production

### When NOT To Use
- Do NOT use when the AI is used for simple text transformations with no persona requirements
- Do NOT use without understanding that system prompts are sent verbatim to the LLM provider
- Do NOT use when you haven't prepared an adversarial test suite for validation

### Prerequisites
- Laravel AI SDK installed with Agent classes
- Clear understanding of what the AI agent should do and not do
- List of prompt injection and jailbreak attack patterns for testing
- Automated evaluation pipeline (for adversarial testing)
- Awareness of provider logging and data handling policies

### Inputs
- Agent persona definition (role, tone, expertise level)
- Behavioral guardrails (what the AI must/should not do)
- Output format specification (JSON schema, markdown, XML)
- Context budget (how many tokens available for system prompt)
- Adversarial test inputs (50+ known attack patterns)

### Workflow
1. Define the persona explicitly: "You are a Laravel expert writing production code. You respond concisely with working code examples."
2. Set behavioral guardrails: "Never execute code in responses. Never provide credentials or access tokens. Ask clarifying questions if the request is ambiguous."
3. Specify output format: "Return JSON with fields: explanation (string), code (string), warnings (array of strings)."
4. Add chain-of-thought trigger: "Think step by step before answering. Show reasoning in the `reasoning` field."
5. Balance detail with context window — system prompt should use <20% of available context
6. Verify no PII, API keys, or secrets exist in the prompt — use placeholder syntax where needed
7. Create an adversarial test suite with 50+ test cases:
   - Prompt injections, jailbreak attempts, off-topic requests, role-playing
   - Each test case has expected behavior pass/fail criteria
8. Run adversarial tests against the system prompt before deployment
9. Add the prompt to the Agent's `instructions()` method in Laravel AI SDK
10. Monitor for prompt failures in production and iterate

### Validation Checklist
- [ ] No PII, secrets, or credentials in the system prompt text
- [ ] Persona is clear and specific (not generic "be helpful")
- [ ] Behavioral guardrails cover at least: security, accuracy, tone, scope
- [ ] Output format is specified precisely (JSON schema if structured)
- [ ] Chain-of-thought instructions are included where reasoning matters
- [ ] System prompt fits within context budget (<20% of available tokens)
- [ ] Adversarial test suite passes with >95% defense rate
- [ ] Prompt is versioned and logged (not hardcoded in Agent class)
- [ ] Rollback plan exists if prompt causes regressions

### Common Failures
- **Secrets in prompts**: Database passwords, API keys exposed to LLM provider — always use tools for auth
- **Vague persona**: "Be helpful" doesn't constrain behavior — leads to unpredictable outputs
- **Missing guardrails**: No "don't execute code" instruction — LLM may return executable payloads
- **Prompt injection vulnerability**: No adversarial testing — deployed prompt easily jailbroken
- **Context overflow**: System prompt too verbose (>30% of context) — no room for conversation
- **No output format enforcement**: LLM returns free-form text when JSON expected — parsing failures

### Decision Points
- **Persona specificity**: Very specific (narrow) vs. general (broad) — more specific = more predictable
- **Guardrail phrasing**: Positive ("Do X") vs. negative ("Never do Y") — both are needed
- **Chain-of-thought verbosity**: Brief ("Think step by step") vs. detailed (structured CoT format)
- **Context budget percentage**: 10% for simple, 20% for complex, never >30%

### Performance Considerations
- System prompt tokens are consumed on every request — optimize for length
- Longer system prompts increase latency proportionally (more tokens to process)
- Chain-of-thought adds completion tokens (cost) but improves quality
- Complex system prompts may increase refusal rates (model follows instructions too strictly)

### Security Considerations
- NEVER include secrets, API keys, passwords, or PII in system prompts
- System prompts are sent to third-party LLM providers — assume they are logged
- Use placeholder variables and inject authenticated data via tools or user messages
- Adversarial test suite must be updated as new attack patterns emerge
- Prompt changes should go through code review before deployment

### Related Rules
- R1: Never include PII, API keys, or secrets in system prompts under any circumstances
- R2: Test system prompts with an adversarial input suite before any production deployment

### Related Skills
- Implement prompt versioning with version-controlled prompt files
- Design structured output schemas for agent responses
- Implement A/B testing for prompt variants
- Design few-shot examples and chain-of-thought prompts

### Success Criteria
- System prompt produces consistent, predictable behavior across diverse inputs
- Adversarial test suite passes with >95% defense rate before deployment
- No secrets or PII are present in the system prompt
- Output format compliance >99% for structured outputs
- Prompt fits within context budget (<20% tokens) for all intended use cases
- Prompt changes are version-controlled and rollback-able
