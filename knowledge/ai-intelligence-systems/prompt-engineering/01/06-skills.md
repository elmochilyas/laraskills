# Skill: Design and Manage Production Prompts

## Purpose
Systematically design, version, compile, and maintain production prompts as code — with template classes, prompt registries, system/user separation, and guardrail instructions for injection protection.

## When To Use
- Every LLM-based application — prompt engineering is fundamental to output quality
- Iterating on application behavior — prompt changes tune LLM output
- Multi-model deployments where prompts need adjustment per model
- Applications where output consistency is critical

## When NOT To Use
- Well-defined single-step transformations where a simple instruction suffices
- Fine-tuned models where behavior is baked into training data

## Prerequisites
- Understanding of LLM message roles (system, user, assistant, tool)
- Prompt registry or storage mechanism (version-controlled files, database)
- Template engine or string interpolation for prompt compilation
- Output format specification for the task

## Inputs
- Task description (what the model should do)
- Persona/role definition (who the model is acting as)
- Constraints and guardrails (what the model should NOT do)
- Output format specification (JSON, markdown, text)
- Dynamic context variables (user input, RAG results, conversation history)

## Workflow
1. **Define the system prompt**: Start with persona and role definition. Add capabilities, constraints, output format instructions, and safety guardrails. Keep under 1500 tokens. Store as a version-controlled template in the prompt registry.
2. **Separate system from user prompts**: The system prompt defines persona/constraints (rarely changes). The user prompt carries the per-request task (varies each call). Never concatenate system instructions into user messages.
3. **Create prompt template classes**: Implement `PromptTemplate` with system and user template strings, placeholder resolution (`{{variable}}`), and few-shot example support. Compile to the messages array at request time.
4. **Implement prompt compilation**: Use a prompt registry service that resolves templates with context variables, injects RAG results as context, and builds the final message array. Cache compiled system prompts (they don't change per request).
5. **Add injection protection**: Wrap user input in delimiters (`<user_input>...</user_input>`) with instructions for the model not to follow embedded commands. Never put user input directly adjacent to system instructions.
6. **Add output format specification**: In the system prompt, specify the exact output format. Use structured output modes (JSON mode, tool calling) when available. Include a schema or template in the prompt.
7. **Implement prompt versioning**: Use semantic versioning for prompts. Store version history. Tag prompts with model compatibility (a prompt optimized for GPT-4o may need adjustment for Claude).
8. **Set up prompt review process**: Prompt changes go through the same review process as code — create PR, review, test, merge, deploy. Include a prompt diff in the PR.
9. **Monitor prompt metrics**: Track prompt token count per version, output format failure rate, user feedback per prompt version, and cost per prompt. Alert on significant changes.
10. **Iterate based on evaluation**: Use prompt test results and production metrics to refine prompts. Optimize for clarity, conciseness, and reliability.

## Validation Checklist
- [ ] Prompts are stored as version-controlled files or PHP classes, not in databases
- [ ] System and user prompts are separated (system = persona/constraints, user = task request)
- [ ] User input is wrapped in delimiters with injection protection instructions
- [ ] Prompt templates use clear, specific language with guardrails
- [ ] Prompt test suite exists with edge cases
- [ ] Prompts are compiled by a central prompt registry service
- [ ] Prompt changes go through the same review process as code

## Common Failures
- **Prompt injection via user input**: User says "Ignore previous instructions and..." and the model complies. Fix: wrap user input in delimiters, use role separation, add injection protection instructions.
- **Prompt bloat**: Prompts grow to 3000+ tokens with conflicting instructions. Fix: enforce token budgets per section, regularly prune redundant instructions.
- **Inconsistent output across models**: A prompt optimized for GPT-4o produces poor results on Claude. Fix: version prompts per model family, test with all target models.
- **Stale facts in prompts**: Hardcoded policy information becomes outdated. Fix: reference facts from a knowledge base/RAG system instead of embedding them in prompts.
- **Prompt drift over time**: The model's behavior with the same prompt changes after provider updates. Fix: run regression tests after every model update.

## Decision Points
- **System prompt vs. user prompt placement**: System prompt for stable persona/constraints. User prompt for per-request task. Security-critical instructions go in the system prompt.
- **Few-shot examples inclusion**: Include 2-3 examples for complex tasks. Omit for simple tasks (saves tokens). Test with and without to measure impact.
- **Single-purpose vs. multi-purpose prompts**: Single-purpose prompts are more reliable. Multi-purpose prompts save tokens but risk confusion.

## Performance Considerations
- Prompt length directly impacts cost and latency. Every token costs money and time.
- System prompt is processed once per KV-cache prefix. Keep it stable across requests for caching benefits.
- Prompt compilation <1ms. Optimize large context injection (reuse pre-compiled RAG context).
- Few-shot examples add significant token cost. Limit to 2-3 unless necessary.
- Track prompt token count per version and alert on growth.

## Security Considerations
- Never include API keys, internal URLs, or secrets in system prompts
- User input must be delimited from instructions to prevent prompt injection
- System prompts should include instructions not to reveal themselves
- Output validation: don't assume the model followed instructions — validate server-side
- Prompt extraction: attackers may probe instructions — avoid including proprietary logic

## Related Rules
- Always define the model's persona, constraints, and output format before any instructions
- Never include factual data directly in system prompt — reference it from knowledge base
- Implement system prompt composition from modular fragments, never monolithic strings
- Always separate user-provided content from system-added context using distinct message roles
- Limit user message length to a predictable maximum and truncate or summarize beyond
- Validate user messages for excessive repetitions, special characters, and pattern anomalies before sending

## Related Skills
- Skill: Design System Prompts for Agents (ku-02)
- Skill: Optimize Prompt Token Usage and Quality (ku-03)
- Skill: Produce Structured Output from LLMs (ku-04)
- Skill: Test and Evaluate Prompt Quality (ku-05)

## Success Criteria
- System prompts are under 1500 tokens and include persona, constraints, output format, and safety instructions
- User input is properly delimited with injection protection
- Prompt templates compile correctly with all context variables resolved
- Prompts are version-controlled with semantic versions and change history
- Prompt changes go through review and pass test suite before deployment
- Injection protection prevents >99% of prompt injection attempts