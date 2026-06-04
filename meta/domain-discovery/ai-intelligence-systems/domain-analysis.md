# Domain Analysis: AI & Intelligence Systems (Laravel/PHP Ecosystem)

## Domain Overview

The AI & Intelligence Systems domain within the Laravel/PHP ecosystem encompasses the tools, frameworks, and architectural patterns for integrating Large Language Models (LLMs), embeddings, vector search, agentic workflows, and AI orchestration into PHP applications. As of mid-2026, this domain has undergone a seismic shift with the release of the first-party **Laravel AI SDK** (`laravel/ai`, v0.4.2, shipped production-stable with Laravel 13 in March 2026), which provides a unified provider-agnostic API across 14 AI providers including OpenAI, Anthropic, Gemini, Groq, DeepSeek, Mistral, Ollama, and more.

Previously, PHP developers relied on fragmented third-party packages (OpenAI PHP client, community wrappers, Prism PHP, LLPhant) or spun up Python microservices. The Laravel AI SDK eliminates the Python sidecar for most use cases, bringing agents, tool calling, structured output, streaming, vector search (RAG), image generation, audio transcription, conversation memory, and provider failover into native Laravel conventions.

**Key maturity indicators:**
- Laravel AI SDK: 734+ GitHub stars, 60 contributors, 20 releases, MIT license
- LLPhant: 1,454+ stars, 60 contributors, 22 releases
- Ecosystem packages: 20+ specialized packages for cost tracking, security, observability, graph workflows
- Laravel 13 native: `vector` column type, `whereVectorSimilarTo()`, `Str::toEmbeddings()`

---

## Domain Scope

### In Scope

| Area | Coverage |
|------|----------|
| LLM Provider Integration | OpenAI, Anthropic, Gemini, Azure, Bedrock, Groq, xAI, DeepSeek, Mistral, Ollama, OpenRouter, Cohere, Jina, VoyageAI, ElevenLabs |
| Agent Frameworks | Laravel AI SDK Agents, Prism PHP, LLPhant, LarAgent, Conductor, SuperAgent, AgentGraph, LaraChain |
| Agentic Workflows | ReAct agents, multi-agent patterns (routing, parallelization, orchestration, chaining), sub-agents, tool calling |
| Vector Databases | pgvector (native Laravel 13 support), Qdrant, Pinecone, ChromaDB, Milvus, Weaviate, Redis, MongoDB Atlas, Upstash |
| RAG (Retrieval-Augmented Generation) | Document ingestion, chunking, embedding, similarity search, hybrid search, reranking, citation-grounded answers |
| AI Search | Semantic search, hybrid search (vector + full-text), AI-powered reranking, metadata filtering |
| Streaming | SSE, Livewire `wire:stream`, WebSocket broadcasting (Reverb), Vercel AI SDK protocol |
| AI Middleware & Gateways | Agent middleware pipeline, LiteLLM, Azure OpenAI Gateway, custom proxy gateways |
| Prompt Engineering | System prompt design, few-shot learning, chain-of-thought, structured output schemas, prompt versioning |
| Token Management & Cost Tracking | Token estimation, cost calculation per model, budget enforcement, usage metering, billing integration |
| AI Safety & Security | Prompt injection defense, PII pseudonymization, output guarding, input validation, OWASP LLM Top 10 |
| Observability | LLM monitoring, latency tracking, token usage dashboards, alerting, Filament dashboards |
| Local LLMs | Ollama, LM Studio, LocalAI, airLLM — development and production-local inference |

### Out of Scope

- Python-exclusive ML frameworks (PyTorch, TensorFlow, scikit-learn directly)
- LangSmith (Python-only observability tool)
- Model training/fine-tuning pipelines (requires Python ML ecosystem)
- Hardware-level GPU management, CUDA programming
- Non-PHP AI agent ecosystems (LangChain Python, CrewAI Python, AutoGen)

---

## Major Subdomains

### 1. LLM Provider Abstraction & Integration
Unified API across providers. The Laravel AI SDK abstracts differences behind `Agent` classes, `#[Provider]`, `#[Model]` attributes. OpenRouter provides multi-model access via single endpoint.

**Key packages:** `laravel/ai` (first-party), `prism-php/prism` (community), `openai-php/laravel`, `mozex/anthropic-laravel`, `claude-php/claude-php-sdk-laravel`

### 2. Agent Architecture & Orchestration
Agents are PHP classes encapsulating instructions, tools, memory, and output schemas. Multi-agent patterns include chaining, routing, parallelization, orchestrator-workers, and sub-agents. Graph-based workflows (LaraGraph, AgentGraph) enable durable, stateful, multi-step processes.

**Key packages:** `laravel/ai`, `cainydev/laragraph`, `heinergiehl/agent-graph`, `akoslabs/conductor`, `ForgeOmni/SuperAgent`, `subhashladumor1/larachain`

### 3. Retrieval-Augmented Generation (RAG)
Full pipeline: document ingestion -> chunking (character, sentence, semantic, markdown) -> embedding generation -> vector storage -> similarity search -> context injection -> LLM generation. Reranking (Cohere, Jina, VoyageAI) improves precision. AI-powered hybrid search combines vector + full-text.

**Key packages:** `laravel/ai`, `moneo/laravel-rag`, `thaolaptrinh/laravel-rag`, `kidiatoliny/laravel-rag`, `aanfarhan/laravel-rag`, `lemukarram/vector-search`

### 4. Vector Database Integration
pgvector is the default production choice. Qdrant offers open-source self-hosted alternative. Pinecone provides fully managed SaaS. The ecosystem supports driver-based architecture where vector stores are swappable via config.

**Key implementations:** Native Laravel 13 `vector()` column, HNSW indexes, cosine/ip/l2 distance operators, `whereVectorSimilarTo()`, `Spirit13/qdrant-laravel`, `wontonee/laravel-qdrant-sdk`

### 5. AI Safety & Security
OWASP LLM01 (Prompt Injection) is the #1 risk. Defense layers include: input sanitization, injection pattern detection (30+ patterns), PII pseudonymization, output guarding, tool argument validation, safety middleware. Static analysis taint tracking (Psalm plugin) catching tainted LLM flows.

**Key packages:** `fr3on/laravel-guardrail`, `MrPunyapal/laravel-ai-aegis`, `jay123anta/laravel-ai-guard`, `subhashladumor1/laravel-ai-guard`

### 6. Cost Management & Observability
Token tracking per-request, cost estimation before execution, budget enforcement (per-user, per-tenant), quota management, Stripe billing integration. Artisan commands for reporting. Filament dashboards for LLM observability.

**Key packages:** `subhashladumor1/laravel-ai-guard`, `ajooda/laravel-ai-metering`, `mubseoul/laravel-llm-observability`, `frolaxhq/laravel-llm-tokenkit`, `dewaldhugo/laravel-ai-governor`

### 7. Streaming & Real-Time AI Responses
SSE (Server-Sent Events), Livewire `wire:stream`, Reverb WebSocket broadcasting, Vercel AI SDK protocol compatibility. Critical for user experience — avoids blank-screen waits during multi-second generation.

**Key patterns:** `->stream()` on agents, `->broadcastOnQueue()`, `response()->stream()`, Prism `->asStream()`, Livewire `$this->stream()`

### 8. Local LLM Development
Ollama provides local open-source models (Llama 3, Mistral, Qwen). Zero API cost, no data leaving network, switch to cloud provider in production via env variable. LM Studio alternative for Windows GUI-based model management.

**Key packages:** `laravel/ai` (Ollama provider built-in), `shamimlaravel/Laravel-Local-LLM-SDK`, Ollama CLI

### 9. Prompt Engineering Systems
Versioned prompt templates as code (Blade or .txt files), system prompt design patterns, few-shot/chain-of-thought techniques, structured output schemas, A/B testing, prompt libraries.

**Key implementations:** `dewaldhugo/laravel-ai-governor` (Prompt Migrations), `CodewithPHP` patterns, Inspector.dev Neuron AI `SystemPrompt` class

### 10. AI Middleware & Gateway Architecture
Agent middleware pipeline intercepts/modifies prompts pre-send and responses post-receive. External AI gateways (LiteLLM, Azure OpenAI Gateway) centralize API key management, rate limiting, routing. LLM Router packages provide circuit-breaker failover chains.

**Key packages:** `laravel/ai` (HasMiddleware), `illuma-law/laravel-llm-router`, LiteLLM proxy, API7 AI Gateway

---

## Complete Knowledge Inventory

### Tier 1 — Core (Essential, shipping now)

| Knowledge Item | Source | Maturity |
|----------------|--------|----------|
| Laravel AI SDK Agent architecture | laravel.com/docs/13.x/ai-sdk | Stable (v0.4.2) |
| Multi-provider text generation | laravel/ai GitHub | Production-ready |
| Tool calling (custom PHP tools) | Laravel AI SDK docs | Stable |
| Structured output with JSON Schema | Laravel AI SDK docs | Stable |
| Conversation memory (RemembersConversations) | Laravel AI SDK docs | Stable |
| Streaming (SSE, Livewire wire:stream) | Laravel AI SDK + Livewire docs | Stable |
| pgvector vector column (Laravel 13 native) | Laravel 13 migration docs | Stable |
| Embedding generation & similarity search | Laravel AI SDK docs | Stable |
| RAG pipeline with SimilaritySearch tool | Laravel AI SDK docs | Stable |
| Provider failover (multi-provider arrays) | Laravel AI SDK docs | Stable |
| Queued agent execution (->queue()) | Laravel AI SDK docs | Stable |
| Testing with fakes (FakeAi, AgentFake) | Laravel AI SDK docs | Stable |
| Ollama local LLM integration | Laravel AI SDK docs | Stable |
| OpenRouter multi-model gateway | OpenRouter docs + Laravel AI SDK | Stable |

### Tier 2 — Important (Well-established, widely used)

| Knowledge Item | Source | Maturity |
|----------------|--------|----------|
| Multi-agent patterns (chaining, routing, parallel) | Laravel AI SDK blog | Stable |
| Agent middleware pipeline | Laravel AI SDK docs | Stable |
| Prompt injection defense (Aegis, Guardrail) | GitHub packages | Stable (v1.x) |
| Cost tracking & budget enforcement | laravel-ai-guard, ai-metering | Stable |
| Document chunking strategies | moneo/laravel-rag docs | Stable |
| HNSW index tuning for pgvector | PostgreSQL pgvector docs | Mature |
| Reranking (Cohere, Jina, VoyageAI) | Laravel AI SDK docs | Stable |
| Image generation & audio (TTS/STT) | Laravel AI SDK docs | Stable |
| LLPhant framework (RAG, embeddings, agents) | LLPhant docs | Mature (v0.11.16) |
| Prism PHP (tool calling, streaming) | Prism PHP docs | Mature |
| Livewire streaming integration | Livewire docs + blog posts | Stable |
| OpenTelemetry for AI traces | Various packages | Emerging |

### Tier 3 — Specialized (Niche or emerging)

| Knowledge Item | Source | Maturity |
|----------------|--------|----------|
| Graph-based workflows (LaraGraph, AgentGraph) | GitHub packages | Emerging (v0.x) |
| Durable agent runtime with checkpoints | heinergiehl/agent-graph | Emerging (MVP) |
| LLM Router circuit-breaker (illuma-law) | Packagist | Emerging (v0.1.4) |
| MCP (Model Context Protocol) connectors | goldenpathdigital/laravel-claude | Emerging |
| Extended thinking (Claude reasoning) | Anthropic API + Laravel AI SDK | Beta |
| Structured output with tool fallback | Laravel AI SDK PR #309 | Recent addition |
| SQLite-vec for local RAG dev | moneo/laravel-rag | Experimental |
| AirLLM / LM Studio local drivers | shamimlaravel/Laravel-Local-LLM-SDK | Early stage |
| Psalm taint analysis for LLM injection | psalm/psalm-plugin-laravel #484 | Proposed |
| AI Bridge (BYOK, CLI bridge, WebSocket) | tetrixdev/laravel-ai-bridge | Stable |
| LarAgent (LangChain-inspired agent builder) | laravel.io article, GitHub | Stable |
| SuperAgent (enterprise multi-agent SDK) | ForgeOmni/SuperAgent | Stable (v0.8.6) |

### Tier 4 — Adjacent (Related but not AI-specific)

| Knowledge Item | Relevance |
|----------------|-----------|
| Laravel Queue architecture (Horizon, Redis) | Required for async AI processing |
| Laravel Broadcasting (Reverb) | Required for WebSocket AI streaming |
| PostgreSQL administration (extensions, indexes) | Required for pgvector management |
| Elasticsearch / Meilisearch | Traditional search overlapping with AI search |
| Redis caching strategies | Embedding caching, conversation caching |
| Nginx proxy buffering configuration | Critical for SSE streaming through proxies |
| Laravel Octane limitations | Incompatible with Livewire wire:stream |
| Docker Compose / Laravel Sail | Local vector DB + Ollama infrastructure |
| CI/CD pipeline configuration | AI fakes vs real API keys in CI |

---

## Knowledge Classification

### By Maturity

| Maturity Level | Items | % |
|----------------|-------|---|
| **Stable / Production** | Agent architecture, text gen, tool calling, streaming, pgvector, RAG, embeddings, Ollama, failover, testing fakes | 45% |
| **Mature (1+ year)** | HNSW tuning, LLPhant, Prism PHP, OpenAI PHP client, conversation history | 20% |
| **Emerging** | Graph workflows, durable runtimes, MCP, LLM routers, taint analysis, SQLite-vec | 25% |
| **Experimental** | AirLLM, extended thinking with some providers, checkpoint replay/fork | 10% |

### By Complexity

| Complexity | Items |
|------------|-------|
| **Low** | Basic text generation, simple chat completion, OpenAI/Anthropic single-call |
| **Medium** | Agent with tools, conversation memory, RAG pipeline, streaming, single-provider |
| **High** | Multi-agent workflows, hybrid search with reranking, durable graph runs, multi-tenant cost metering |
| **Very High** | Production multi-provider failover + circuit breaker + observability + security + cost enforcement + streaming across provider types |

### By Risk

| Risk Category | Items | Mitigation |
|---------------|-------|------------|
| **Security** | Prompt injection, tool argument injection, PII leakage, output injection | Aegis, Guardrail, input validation, Psalm taint analysis |
| **Cost** | Token runaway, unbounded generation, model cascading cost | Budget enforcement, `MaxSteps`, `UseCheapestModel`, rate limiting |
| **Reliability** | Provider outages, rate limits, model deprecation | Failover chains, LLM Router, circuit breakers, queued retries |
| **Latency** | Synchronous AI blocking HTTP workers, streaming through buffering proxies | Queue jobs, SSE, dedicated worker clusters, proxy config |
| **Compliance** | GDPR data sent to US providers, HIPAA PII in prompts | Local LLM (Ollama), PII redaction gateway, sovereign tenant routing |

---

## Dependency Map

```
User Application
│
├── Laravel AI SDK (laravel/ai)
│   ├── Agent classes (app/Ai/Agents/)
│   │   ├── Tools (app/Ai/Tools/)
│   │   ├── Middleware (app/Ai/Middleware/)
│   │   └── Schemas (structured output)
│   ├── Prism PHP (underlying abstraction, v0.99+)
│   └── Provider Gateways
│       ├── OpenAI Gateway
│       ├── Anthropic Gateway (direct, not Prism)
│       ├── Gemini Gateway
│       ├── Ollama Gateway
│       └── Others (Groq, Mistral, DeepSeek, xAI, Azure, Bedrock)
│
├── Vector Database
│   ├── pgvector (native Laravel 13) ← PostgreSQL ← Laravel migrations
│   ├── Qdrant (self-hosted) ← qdrant-laravel PHP SDK
│   ├── Pinecone (managed SaaS) ← HTTP API
│   ├── ChromaDB (local dev)
│   └── MongoDB Atlas (via LLPhant)
│
├── Specialized Packages
│   ├── Cost/Budget: laravel-ai-guard, ai-metering, llm-observability, llm-tokenkit
│   ├── Security: laravel-guardrail, laravel-ai-aegis, laravel-ai-guard (crawler)
│   ├── Workflow: laragraph, agent-graph, conductor, larachain
│   ├── Observability: llm-observability (Filament), ai-metering (Stripe billing)
│   └── Routing: llm-router
│
├── Infrastructure
│   ├── Queue (Redis/Database) — async AI processing
│   ├── Broadcasting (Reverb) — WebSocket streaming
│   ├── Cache (Redis) — embedding caching, conversation cache
│   ├── PostgreSQL — pgvector, conversation storage
│   └── Nginx — SSE proxy buffering config
│
└── Deployment
    ├── Laravel Cloud (managed PostgreSQL + pgvector, Reverb, queue workers)
    ├── Forge (self-managed servers)
    ├── Vapor (serverless — SSE limitations)
    └── Docker Compose (local dev with Ollama + pgvector)
```

---

## Missing Knowledge Risk Analysis

### Critical Gaps

| Gap | Impact | Risk Level |
|-----|--------|------------|
| No comprehensive production runbook for Laravel AI SDK deployments | Teams lack operational guidance for failover, cost spikes, streaming issues | **High** |
| Mixed embedding models in same index not detected until retrieval fails | Silent quality degradation | **High** |
| No standardized prompt injection benchmark for PHP middleware packages | Cannot compare Aegis vs Guardrail efficacy | **High** |
| Laravel Octane incompatibility with Livewire wire:stream not well-documented | Teams unknowingly build non-functional streaming | **Medium** |

### Moderate Gaps

| Gap | Impact | Risk Level |
|-----|--------|------------|
| Chunking strategy decision framework absent | Teams default to wrong chunk size, degrade RAG quality | **Medium** |
| Multi-tenant vector isolation patterns not documented | Cross-tenant data leakage in shared pgvector indexes | **Medium** |
| Cost modeling for multi-provider failover chains unclear | Failover to expensive model causes budget surprise | **Medium** |
| No Laravel-native tokenizer for offline token counting | Dependency on external estimation (~4 chars/token) | **Medium** |

### Low Gaps

| Gap | Impact | Risk Level |
|-----|--------|------------|
| A/B testing framework for prompt variants | Manual evaluation only | **Low** |
| Benchmark data comparing Qdrant vs pgvector for Laravel-specific workloads | Anecdotal evidence only | **Low** |
| Standardized error taxonomy for AI provider failures | Each team invents own error handling | **Low** |

---

## Research Findings

### Key Finding 1: Laravel AI SDK Is the New Standard
The release of `laravel/ai` as a first-party package (February 2026 beta, March 2026 stable with Laravel 13) fundamentally changes the landscape. It deprecates the need for most third-party AI abstraction packages. It uses Prism PHP under the hood but adds Laravel-native conventions: Artisan generators (`make:agent`, `make:tool`, `make:agent-middleware`), Facade integration, config files, migration publishing, and a full test-faking layer.

**Implication:** New Laravel AI projects should default to `laravel/ai`. Only reach for community packages when specific gaps exist (cost tracking, security middleware, graph workflows).

### Key Finding 2: pgvector Dominates for Laravel RAG
For 95% of Laravel applications, pgvector is the correct vector database choice. It runs on existing PostgreSQL infrastructure, supports ACID transactions, enables hybrid search (vector + full-text `tsvector`) in a single query, and now has native Laravel 13 support (`$table->vector()`, `whereVectorSimilarTo()`, `Str::toEmbeddings()`). Managed vector DBs (Pinecone, Qdrant Cloud) are only justified at >50M vector scale or when PostgreSQL isn't available.

### Key Finding 3: Agentic Patterns Are Production-Ready
The Laravel AI SDK ships five multi-agent patterns based on Anthropic research: chaining, routing, parallelization, orchestrator-workers, and sub-agents. These are not theoretical — they have working implementations with tool calling, memory, failover, and queue support. Graph-based workflow engines (LaraGraph, AgentGraph) extend this to durable, stateful, multi-step processes with checkpoints, human-in-the-loop, and parallel fan-out.

### Key Finding 4: AI Security Is the #1 Production Gap
OWASP ranks prompt injection as LLM01:2025 — the top risk. The Laravel ecosystem has multiple security packages (Aegis, Guardrail, AI Guard) but no clear "standard" or official recommendation from the Laravel team. The `laravel/ai` SDK has zero built-in sanitization. Tool calling is the highest-risk vector because LLM-controlled arguments flow directly into PHP methods. A Psalm plugin proposal (#484) would add static analysis taint tracking for LLM flows.

### Key Finding 5: Cost Management Tooling Is Maturing
The ecosystem now has four dedicated packages for token/cost management:
- **laravel-ai-guard**: Budget enforcement + estimation + reporting (most comprehensive)
- **ai-metering**: Stripe billing integration + quotas + multi-tenancy
- **llm-observability**: Filament dashboard + alerting + webhooks
- **llm-tokenkit**: Stateless token estimation + cost calculation + context window building

The Laravel AI SDK itself adds `UseCheapestModel` and `UseSmartestModel` attributes for automatic cost optimization.

### Key Finding 6: Streaming Requires Infrastructure Awareness
AI streaming in Laravel works via SSE, but production deployment requires:
- Nginx: `proxy_buffering off;` or `X-Accel-Buffering: no`
- PHP-FPM worker sizing (streaming holds worker for duration)
- No Octane support for Livewire `wire:stream`
- Separate SSE vs WebSocket (Reverb) vs Livewire decision per use case

### Key Finding 7: Local LLM Development Is Viable
Ollama integration in the Laravel AI SDK enables zero-cost local development with models like Llama 3.2, Qwen 2.5 Coder, Mistral. The recommended pattern is Ollama locally, cloud provider in production, switched via `.env`: `AI_PROVIDER=ollama` / `AI_MODEL=llama3.2`. This eliminates API cost during development and supports offline/protected-data workflows.

---

## Future Expansion Opportunities

### 1. Official Laravel AI Security Package
Given the gap in first-party security tooling, an official `laravel/ai-security` or security middleware integrated into the SDK would address the #1 production risk. Could bundle prompt injection detection, PII redaction, and output validation.

### 2. AI Observability Dashboard (Laravel Pulse Integration)
Native Laravel Pulse card for AI metrics (token usage, cost per model, latency, error rates, injection blocks). Currently only available via third-party Filament packages (llm-observability).

### 3. Durable Workflow Engine
Graph-based workflows (LaraGraph-style) becoming a first-party feature or recommended package. Human-in-the-loop approval gates, checkpoints, long-running agent sessions with persistence.

### 4. Multi-Modal Expansion
Extend Laravel AI SDK beyond text/image/audio to video understanding (Gemini Veo), real-time voice, computer vision, and document layout analysis.

### 5. AI Gateway as a Service
LiteLLM-style proxy packaged as a Laravel Cloud add-on or Forge recipe: centralized key management, rate limiting, cost aggregation across projects and environments.

### 6. Laravel + MCP (Model Context Protocol)
As Anthropic's MCP standardizes AI-tool communication, Laravel packages providing MCP servers and clients (already emerging in goldenpathdigital/laravel-claude and tetrixdev/laravel-ai-bridge) will grow.

### 7. AI-Powered Laravel Internals
Automatic AI features within the framework: AI-generated migrations, AI-optimized queries, AI-suggested refactoring, AI-powered validation messages.

### 8. Edge AI / Serverless AI
Running local LLMs (via Ollama or WASM-based models) on edge deployment platforms, or serverless AI workers with cold-start mitigation for Vapor.

### 9. Federated AI Agents
Cross-application agent communication (A2A protocol emerging in MonkeysLegion-Apex). Laravel agents communicating with other Laravel/non-Laravel agent systems.

### 10. Compliance & Audit Tooling
GDPR/HIPAA/SOC2-specific AI audit trails: immutable prompt/response logging, data residency enforcement via sovereign routing, automated compliance reporting.

---

## Sources Consulted

### Tier 1 — Official Documentation & Primary Sources

1. Laravel AI SDK Documentation — https://laravel.com/docs/13.x/ai-sdk (Laravel 13.x, June 2026)
2. Laravel AI SDK GitHub — https://github.com/laravel/ai (v0.4.2, March 2026)
3. Laravel AI Overview — https://laravel.com/ai (First-party AI toolkit)
4. "Building AI Agents with Laravel: No Python Required" — https://laravel.com/blog/building-ai-agents-with-laravel-no-python-required (May 2026)
5. "Laravel AI Integration: Build a Document Search Agent" — https://laravel.com/blog/laravel-ai-integration-build-a-document-search-agent (May 2026)
6. LLPhant GitHub — https://github.com/theodo-group/llphant (v0.11.16, April 2026)
7. LLPhant Documentation — https://llphant.readthedocs.org
8. Livewire wire:stream Documentation — https://livewire.laravel.com/docs/4.x/wire-stream
9. OWASP LLM01:2025 Prompt Injection — https://genai.owasp.org/llmrisk/llm01-prompt-injection/
10. Ollama Anthropic Compatibility — https://docs.ollama.com/api/anthropic-compatibility

### Tier 2 — Authoritative Community Resources & Articles

11. "Mastering the New Laravel AI SDK in Laravel 12" — n1n.ai (Feb 2026)
12. "Laravel 13 AI SDK: Complete Getting Started Guide" — Laracopilot (Apr 2026)
13. "Laravel AI SDK + OpenRouter: Build Production-Ready AI Features" — Polash.dev (Apr 2026)
14. "Laravel AI Integration: A Production-Ready Architecture Guide" — DEV/dewaldhugo (Apr 2026)
15. "RAG with pgvector and Laravel: Production Guide (2026)" — Bishrul Haq (May 2026)
16. "Laravel Vector Database: pgvector & RAG Guide" — Origin Main (Jan 2026)
17. "Laravel RAG Pipeline with pgvector — AI SDK Guide" — RichDynamix (Apr 2026)
18. "LLPhant: A PHP Generative AI Framework Inspired by LangChain" — Laravel News (Apr 2026)
19. "LLPhant: Bringing Generative AI to PHP Developers" — Medium/Sandeeppant (Apr 2026)
20. "Building Agentic Laravel Apps with Prism PHP" — DEV/dewaldhugo (May 2026)
21. "Prism Streaming with Livewire wire:stream — A Practical Guide" — RichDynamix (May 2026)
22. "Ship AI with Laravel: Real-Time Streaming Chat UI with Livewire" — Laravel News (May 2026)
23. "LarAgent: An Open-source Package to Build & Manage AI Agents" — Laravel.io (Apr 2025)
24. "Running Laravel AI SDK in Production: The Complete Guide" — Delaney Industries (Feb 2026)
25. "Integrating AI APIs in Laravel: OpenAI, Claude, Bedrock" — Richard Porter (Jan 2026)
26. "Laravel AI SDK: What It Changes, Why It Matters" — DEV/hafiz619 (Feb 2026)
27. "Inspector.dev Neuron, Laravel AI SDK, and Prism PHP: A Practical Comparison" — DEV/raheelshan (May 2026)
28. "System Prompt for AI Agents In PHP" — Inspector.dev (Apr 2025)
29. "Laravel OpenAI Integration: The Complete Production Guide" — DEV/dewaldhugo (Apr 2026)
30. "Laravel AI Integration with OpenAI & OpenRouter" — Polash.dev (Dec 2025)
31. "How to Master Prompt Engineering Basics for PHP Developers" — QCode (Mar 2026)
32. "Building a RAG Pipeline in Laravel with pgvector" — Al Amin Ahamed (Apr 2025)
33. "The PHP Workflow Architect Prompt" — Tim Dietrich (Jan 2026)
34. "Qdrant vs Pinecone: Vector Databases for AI Apps" — Qdrant Blog (Feb 2024)
35. "What's the Best Vector Database for Building AI Products" — Liveblocks Blog (Sep 2025)

### Tier 3 — Package Repositories & Technical References

36. Laravel AI SDK Pull Request #309 (Anthropic direct gateway) — GitHub (Mar 2026)
37. Psalm Plugin Laravel Issue #484 (Taint analysis for LLM injection) — GitHub
38. LaraChain (subhashladumor1/larachain) — Packagist
39. LangChain Laravel (YourWisemaker/langchain-laravel) — GitHub
40. LaraGraph (cainydev/laragraph) — GitHub (Mar 2026)
41. AgentGraph (heinergiehl/agent-graph) — GitHub (May 2026)
42. Conductor (akoslabs/conductor) — GitHub (Mar 2026)
43. Laravel Guardrail (fr3on/laravel-guardrail) — GitHub (Apr 2026)
44. Laravel AI Aegis (MrPunyapal/laravel-ai-aegis) — GitHub (Mar 2026)
45. Laravel AI Guard (subhashladumor1/laravel-ai-guard) — GitHub (Feb 2026)
46. Laravel AI Metering (ajooda/laravel-ai-metering) — GitHub (Dec 2025)
47. Laravel LLM Observability (mubseoul/laravel-llm-observability) — GitHub (Feb 2026)
48. Laravel TokenKit (frolaxhq/laravel-llm-tokenkit) — GitHub (Feb 2026)
49. Laravel AI Governor (dewaldhugo/laravel-ai-governor) — GitHub (Mar 2026)
50. Laravel AI Bridge (tetrixdev/laravel-ai-bridge) — GitHub (May 2026)
51. Laravel LLM Router (illuma-law/laravel-llm-router) — Packagist (Apr 2026)
52. SuperAgent (ForgeOmni/SuperAgent) — GitHub (Mar 2026)
53. Laravel RAG (moneo/laravel-rag) — GitHub (Mar 2026)
54. Laravel RAG (thaolaptrinh/laravel-rag) — GitHub (Mar 2026)
55. Laravel RAG (kidiatoliny/laravel-rag) — GitHub (Dec 2025)
56. Laravel RAG (aanfarhan/laravel-rag) — GitHub (Jun 2025)
57. Vector Search (lemukarram/vector-search) — GitHub (Nov 2025)
58. Qdrant Laravel (Spirit13/qdrant-laravel) — GitHub (Apr 2026)
59. Laravel Qdrant SDK (wontonee/laravel-qdrant-sdk) — GitHub (May 2025)
60. Laravel Local LLM SDK (shamimlaravel/Laravel-Local-LLM-SDK) — GitHub (Mar 2026)
61. Anthropic Laravel (mozex/anthropic-laravel) — GitHub (v1.3.3, Mar 2026)
62. Claude PHP SDK Laravel (claude-php/claude-php-sdk-laravel) — GitHub (v0.6.0, Nov 2025)
63. Laravel Claude (goldenpathdigital/laravel-claude) — GitHub (Dec 2025)
64. Laravel LLM Client (lzhx00/laravel-llm-client) — GitHub (Jul 2025)
65. Laravel OpenAI (shawnveltman/laravel-openai) — GitHub (Nov 2023)
66. MonkeysLegion-Apex (MonkeysCloud/MonkeysLegion-Apex) — GitHub (Apr 2026)
67. LangGraph PHP (hqzhon/langgraph-php) — GitHub (Sep 2025)
68. "From Zero to RAG: Implementing RAG in Laravel" — DEV/emongmarcc (Mar 2026)
69. "Building Intelligent Knowledge Assistants: Laravel AI SDK Meets RAG" — Fakhar Khan (Feb 2026)
70. "Laravel 13 Semantic Search: Add Smart Search to Your Blog" — QadrLabs (Mar 2026)

### Tier 4 — Background & Adjacent Knowledge

71. "How AI Gateways Enforce Security and Compliance for LLMs" — API7.ai (Nov 2025)
72. "Mitigating Indirect Prompt Injection Attacks on LLMs" — Solo.io (Jun 2025)
73. Azure OpenAI Gateway Documentation — Microsoft Learn
74. LiteLLM Proxy Documentation — litellm.vercel.app
75. OpenAI Best Practices for Prompt Engineering — help.openai.com
76. pgvector GitHub Repository — github.com/pgvector/pgvector
77. "Using the Qdrant Vector Database for Semantic Search in Laravel" — aiwithlaravel.com
78. MongoDB + LLPhant Integration Guide — MongoDB Docs
79. Laravel 13 Release Notes — laravel.com/docs/13.x/releases
80. Laravel Cloud Documentation — cloud.laravel.com/docs
