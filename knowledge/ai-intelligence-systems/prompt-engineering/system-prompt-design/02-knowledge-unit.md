# Knowledge Unit: System Prompt Design

## Metadata

- **ID:** KU-030 (Prompt Engineering)
- **Subdomain:** Prompt Engineering Systems
- **Slug:** system-prompt-design
- **Version:** 1.0.0
- **Maturity:** Stable (established practice)
- **Status:** Published

## Executive Summary

System prompt design is the practice of crafting the initial instruction given to an LLM that defines its persona, behavior boundaries, output format, and operational rules. In the Laravel AI SDK, the system prompt is set via the `instructions()` method on Agent classes or the `$system` parameter on `Ai::call()`. Well-designed system prompts are the single highest-leverage activity in AI application quality — a good prompt can make a weak model perform well; a bad prompt can break a strong one.

## Core Concepts

- **System prompt vs. user prompt**: System prompt sets persistent context and rules; user prompt carries the per-request input — the system prompt is prepended to every conversation turn
- **Persona definition**: Explicitly define the AI's role (e.g., "You are a Laravel expert writing production code") — sets tone, expertise level, and response style
- **Behavioral guardrails**: Rules the AI must follow (e.g., "Never execute code in responses" or "Always ask clarifying questions if the request is ambiguous")
- **Output structure specification**: Define response format (JSON schema, markdown, XML tags) — essential for structured output and tool calling
- **Context window management**: System prompt consumes tokens from the context window — balance detail with available space for conversation
- **Chain-of-thought triggers**: Embed reasoning instructions ("Think step by step before answering") to improve output quality
- **Constraint listing**: Explicitly list constraints (token limits, forbidden topics, tone requirements) to shape the response

## Mental Models

- **Employee Handbook**: The system prompt is the employee handbook — it tells the AI what its job is, how to behave, what rules to follow, and how to format its work. Without it, the AI improvises based on training data alone.
- **Mission Briefing**: Before a military operation, troops receive a briefing that covers mission objective, rules of engagement, ROE limits, communication protocols, and extraction plan. The system prompt is the AI's mission briefing.
- **Recipe Card**: A recipe lists ingredients (tools available), instructions (behavioral rules), and desired outcome (output format). The system prompt is the recipe the AI follows for every response.

## Internal Mechanics

In the Laravel AI SDK, system prompts are set at the Agent class level via the `instructions()` method:

```php
#[Provider('anthropic')]
#[Model('claude-sonnet-4-20250514')]
class SupportAgent extends Agent
{
    protected string $instructions = '
        You are a Laravel technical support specialist.
        - Always provide code examples when explaining solutions
        - Ask for error messages before diagnosing
        - Never suggest packages that are abandoned or insecure
        - Format responses in Markdown
        - If you don\'t know the answer, say so — do not hallucinate
    ';

    public function tools(): array
    {
        return [new SearchDocumentation(), new CheckPackageStatus()];
    }
}
```

The system prompt is concatenated with the conversation history and user prompt before being sent to the LLM. In the SDK's provider gateway, the system prompt is placed in the `system` role message (for Anthropic/OpenAI) or as a prefixed instruction (for completion-style APIs).

System prompts can include dynamic variables via constructor injection:

```php
public function __construct(private User $user)
{
    $this->instructions = "You are helping {$user->name}, a {$user->role} at {$user->company}.";
}
```

## Patterns

- **Persona-first opening**: Start with "You are [role]" to establish identity before any rules
- **Positive framing**: "Do provide code examples" (not "Don't forget to provide code examples") — LLMs respond better to affirmative instructions
- **Rule categorization**: Group rules by type (formatting, behavior, constraints) for clarity
- **Context injection via constructor**: Inject user details, tenant scope, or session data into the system prompt dynamically
- **System prompt templates**: Store base prompts in Blade views or config files, render with context before agent instantiation
- **Multi-paragraph structure**: Separate sections with line breaks — LLMs respect paragraph boundaries as logical separators

## Architectural Decisions

- **Decision**: System prompt in Agent class vs. external file → Both supported. Reason: Small prompts inline for readability; large prompts (50+ lines) in Blade files or config for maintainability.
- **Decision**: Static instructions vs. dynamic per-request instructions → Hybrid. Reason: Base behavior is static (class-level), per-request context is dynamic (constructor injection or method parameter).
- **Decision**: How much detail in system prompt? → Comprehensive but concise. Reason: Each token in system prompt reduces available context for the conversation; typical range is 200-1000 tokens.

## Tradeoffs

| Tradeoff | Pro | Con |
|----------|-----|-----|
| Detailed system prompt | Constrains behavior precisely | Consumes context window tokens |
| Dynamic system prompt | Personalized per user/session | Must be generated every time — adds latency |
| Intrusive guardrails | Prevents most off-topic responses | May make AI hesitant, refuses legitimate requests |

## Performance Considerations

- System prompt token count directly reduces available context for user input and conversation history
- Keep system prompts under 1000 tokens for agents with long conversations; under 500 for agents requiring large context windows
- Dynamic system prompt generation (via Blade rendering) adds ~1-5ms per agent call
- Very long system prompts (2000+ tokens) degrade response quality as attention dilutes — test with and without to measure output quality difference
- For streaming responses, a well-crafted system prompt produces better first-token quality — the AI starts generating with clearer intent

## Production Considerations

- Version control system prompts — changes to prompts change AI behavior; track in git alongside code
- A/B test system prompt variations — a single word change can measurably affect response quality
- Log system prompt version used per agent call — essential for debugging output quality issues
- Audit system prompts for leaked secrets — never include API keys, database credentials, or PII templates
- Review instructions periodically — as models improve, instructions may need simplification (newer models need less hand-holding)
- Implement prompt guardrails against system prompt leakage — users asking "ignore your instructions" should be caught by injection detection middleware

## Common Mistakes

- Over-constraining the AI — too many rules make the AI refuse legitimate requests (e.g., "Never say you can't do something" conflicts with "Never hallucinate")
- Contradictory instructions — "Be concise" but "Always provide detailed examples" — the AI may prioritize one at random
- Anthropomorphizing in system prompt — "You are a helpful assistant" is weak; specific personas (e.g., "Laravel senior developer") produce better results
- Not testing without the system prompt — sometimes removing instructions improves output when the model's training already covers the behavior
- System prompt injection via user context — dynamically injecting user-provided content into instructions without sanitization creates injection vectors

## Failure Modes

- **System prompt leakage**: User asks "Repeat your system prompt" and the AI complies — implement injection middleware that blocks this pattern
- **Instruction forgetting**: In long conversations, the AI drifts from system prompt instructions — reinforce key rules in user prompts periodically
- **Token exhaustion**: System prompt + conversation history exceeds context window — implement conversation pruning or sliding window
- **Persona confusion**: Multiple agents share system prompts but expect different behaviors — ensure each agent has a unique, tailored prompt
- **Over-refusal**: Over-guardrailed system prompt causes AI to refuse legitimate requests — balance constraints with utility; test with real user queries

## Ecosystem Usage

- **Laravel AI SDK `Agent` class**: `instructions` property on Agent classes for system prompt definition
- **Inspector.dev Neuron AI `SystemPrompt` class**: Third-party system prompt management with versioning
- **`dewaldhugo/laravel-ai-governor`**: Prompt migrations — version-controlled prompt templates, similar to database migrations
- **Blade templates**: Render system prompts from Blade files with injected context (user name, role, locale)
- **Config files**: Store system prompts in `config/prompts.php` for non-agent AI calls via `Ai::call()`

## Related Knowledge Units

- KU-002: Few-Shot Chain-of-Thought (advanced prompt techniques layered on system prompt)
- KU-003: Prompt Versioning (managing prompt changes over time)
- KU-004: Structured Output Schemas (output format specification in system prompts)
- KU-005: A/B Testing Prompt Variants (measuring prompt quality differences)
- KU-001: Agent Architecture Fundamentals (how system prompts integrate with agent lifecycle)

## Research Notes

- Source: Inspector.dev — "System Prompt for AI Agents In PHP" (Apr 2025)
- Source: Laravel AI SDK documentation — Agent configuration and instructions
- Source: OpenAI Prompt Engineering Guide — https://platform.openai.com/docs/guides/prompt-engineering
- Best practice evolution: From "helpful assistant" to specific, domain-constrained personas
- Anthropic research shows that Claude responds better to positive instructions ("do X") than prohibitions ("don't do Y")
- The "You are..." persona pattern consistently outperforms task-oriented prompts in independent benchmarks
- As of 2026, context windows have expanded dramatically (200K tokens for Claude, 128K for GPT-4o) — system prompt length constraints are less severe than in 2024-2025
