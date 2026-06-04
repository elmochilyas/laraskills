# Knowledge Unit: Laravel AI SDK Architecture

## Metadata

- **ID:** KU-001
- **Subdomain:** LLM Provider Abstraction & Integration
- **Slug:** laravel-ai-sdk-architecture
- **Version:** 1.0.0
- **Maturity:** Stable (v0.7.2 as of May 2026)
- **Status:** Published

## Executive Summary

The Laravel AI SDK (`laravel/ai`) is a first-party, MIT-licensed package providing a unified provider-agnostic API across 14 AI providers. Released February 2026 (beta), production-stable March 2026 with Laravel 13. It uses Prism PHP under the hood as a lower-level abstraction but adds Laravel-native conventions: Artisan generators, Facade integration, config files, migration publishing, and a full test-faking layer. The SDK eliminates Python sidecars for most PHP AI use cases.

## Core Concepts

- `Agent` class: PHP class implementing `Agent` contract, encapsulating instructions, tools, memory, and output schema
- `Promptable` trait: Adds `prompt()`, `stream()`, `queue()` methods to agent classes
- `HasTools` interface: Agents declare available tools via `tools()` method
- `HasStructuredOutput` interface: Agents return typed, validated JSON via `schema()` method
- `RemembersConversations` trait: Automatic DB-persisted conversation history
- `#[Provider]` / `#[Model]` attributes: Declare provider and model at class level
- `FakeAi` / `AgentFake`: Testing fakes that prevent real API calls in tests
- `SimilaritySearch`: Built-in tool for pgvector-powered RAG queries
- 14 providers: OpenAI, Anthropic, Gemini, Azure, Bedrock, Groq, xAI, DeepSeek, Mistral, Ollama, OpenRouter, Cohere, Jina, VoyageAI, ElevenLabs

## Mental Models

- **Eloquent for AI**: Just as Eloquent abstracts database drivers behind a unified query builder, the AI SDK abstracts AI providers behind a unified Agent interface. Switching providers requires changing a config value, not rewriting application code.
- **Agent as Controller**: An Agent class mirrors a Laravel controller — it receives input, delegates to services (tools), and returns structured responses. Testing agents mirrors testing controllers with fakes.
- **Provider as Database Driver**: Providers are swappable config-driven backends. The SDK handles the adapter pattern internally; the developer writes against the contract.

## Internal Mechanics

The SDK architecture layers:
1. **Public API layer**: `Agent` interface, `Facades\Ai`, Artisan commands
2. **Agent runtime**: Manages instruction execution, tool dispatch, memory persistence, streaming, queueing
3. **Provider abstraction**: Prism PHP core handles HTTP transport, request signing, response parsing per provider
4. **Provider gateways**: Direct HTTP implementations for each provider (OpenAI Gateway, Anthropic Gateway, etc.)

The `make:agent` command generates a stub class. The `Ai` facade provides `Ai::call()` for stateless text generation. The agent runtime resolves via the service container, injecting dependencies automatically.

Conversation memory stores messages in `agent_conversations` and `agent_conversation_messages` tables. The `MaxSteps` attribute (default 10) prevents infinite agent loops.

## Patterns

- **Agent-as-Class pattern**: Each AI capability is a dedicated PHP class with single responsibility
- **Attribute-driven configuration**: `#[Provider('anthropic')]`, `#[Temperature(0.7)]`, `#[MaxTokens(4096)]` on the agent class — no separate config files per agent
- **Fake-Driven Testing**: Call `Ai::fake(['agent-conversations' => $responses])` before tests, `preventStrayPrompts()` to assert no real API calls leak
- **Constructor Injection for Context**: Pass user IDs, tenant scopes, or session data via constructor — tools never read from the session, preventing injection attacks

## Architectural Decisions

- **Decision**: Bundle Prism PHP vs. write from scratch → Bundled Prism as low-level transport but built agent layer on top. Reason: Prism already handled provider diversity; SDK adds Laravel conventions without reinventing HTTP transport.
- **Decision**: Native pgvector support vs. abstract vector store interface → Native pgvector with `SimilaritySearch` tool. Reason: pgvector covers 95% of Laravel RAG workloads; abstraction added later if demand justifies it.
- **Decision**: Attribute-based configuration vs. method-based → Attributes. Reason: Declarative configuration is more readable, testable, and enables static analysis.
- **Decision**: Separate tables for conversation storage vs. generic JSON column → Dedicated `agent_conversations` and `agent_conversation_messages` tables with migrations. Reason: Enables querying, pruning, and analysis of conversation data.

## Tradeoffs

| Tradeoff | Pro | Con |
|----------|-----|-----|
| Tight Prism coupling | Leverages proven provider abstraction | Migration path if Prism diverges from Laravel direction |
| Agent as class (not callable) | Clear DI, testable, extensible | More ceremony than simple closures |
| Database memory by default | Persistent, queryable, scalable | Requires migration, not suitable for ephemeral stateless agents |

## Performance Considerations

- Agent class resolution via container is cached in production (no repeated reflection)
- Conversation history grows unbounded — configure `agent_conversations` TTL or implement pruning
- Streaming holds PHP-FPM worker for duration — use dedicated worker pools for streaming endpoints
- Tool call execution is synchronous within the agent loop — offload slow tools to queues

## Production Considerations

- Publish config and migrations via `php artisan vendor:publish --provider="Laravel\Ai\AiServiceProvider"`
- Configure `AI_PROVIDER` and `AI_MODEL` env vars per environment
- Set `MaxSteps` to prevent runaway agent loops (default 10, adjust per use case)
- Use `->queue()` for any agent call exceeding 5 seconds expected runtime
- Register `AiServiceProvider` in `bootstrap/providers.php`
- Monitor `agent_conversations` table size and implement retention policies
- Cache embedding vectors — avoid regenerating for unchanged content

## Common Mistakes

- Using `prompt()` for requests exceeding 30s — blocks worker; use `stream()` or `queue()`
- Forgetting to set `AI_PROVIDER` env var — SDK silently fails or uses wrong provider
- Not implementing `MaxSteps` — agent loops indefinitely on complex tool chains
- Using agent without `RemembersConversations` trait but expecting multi-turn persistence
- Testing without `Ai::fake()` — real API calls during test suite, accruing costs and flakiness

## Failure Modes

- **Provider credential failure**: SDK throws `Laravel\Ai\Exceptions\ProviderException` — wrap agent calls in try/catch with fallback provider logic
- **Token limit exceeded**: Provider returns 400/413 — reduce context window or switch to larger-context model
- **Tool execution timeout**: Tool `handle()` hangs — set timeout on tool's HTTP calls or database queries
- **Conversation table bloat**: Millions of rows slow inserts — implement archiving or Pg partitioning

## Ecosystem Usage

- **Laravel 13+**: Native framework integration
- **Laravel Cloud**: Managed PostgreSQL + pgvector, Reverb, queue workers
- **Forge**: Self-managed deployment with supervisor config for queue workers
- **Vapor**: Serverless — SSE limitations; prefer queue-based responses

## Related Knowledge Units

- KU-002: Multi-Provider Text Generation
- KU-006: Tool Calling
- KU-007: Conversation Memory
- KU-011: Agent Architecture Fundamentals
- KU-016: RAG Pipeline with SimilaritySearch

## Research Notes

- GitHub: 956+ stars, 250 forks, 37 releases (v0.7.2 as of May 2026), 514 commits, 60+ contributors
- Docs: https://laravel.com/docs/13.x/ai-sdk
- Blog: https://laravel.com/blog/building-ai-agents-with-laravel-no-python-required
- The SDK uses Prism PHP internally as a dependency but the team plans to make the provider abstraction layer increasingly independent over time
- PR #309 added Anthropic direct gateway (not through Prism) — signaling a move toward independent provider implementations
