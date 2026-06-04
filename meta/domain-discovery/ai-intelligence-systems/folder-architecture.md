# Folder Architecture: AI & Intelligence Systems

```
ai-intelligence-systems/
│
├── domain-analysis.md                          # Full domain analysis (this file)
│
├── 01-provider-integration/
│   ├── overview.md                             # Multi-provider strategy
│   ├── openai/
│   │   ├── setup.md                            # OpenAI API key, config, Laravel SDK
│   │   ├── chat-completions.md                 # Text generation, models (GPT-4o, GPT-4o-mini, o-series)
│   │   ├── streaming.md                        # SSE streaming with OpenAI
│   │   ├── embeddings.md                       # text-embedding-3-small/large
│   │   ├── structured-output.md                # JSON mode, response_format
│   │   ├── function-calling.md                 # Tool/function calling
│   │   ├── image-generation.md                 # DALL-E 3, gpt-image-1
│   │   ├── audio.md                            # Whisper (STT), TTS
│   │   ├── cost-pricing.md                     # Token pricing per model
│   │   └── troubleshooting.md                  # Rate limits, timeouts, errors
│   ├── anthropic/
│   │   ├── setup.md                            # Anthropic API key, config
│   │   ├── messages-api.md                     # Messages endpoint, models (Claude Opus/Sonnet/Haiku)
│   │   ├── streaming.md                        # SSE streaming
│   │   ├── extended-thinking.md                # Reasoning tokens, budget_tokens
│   │   ├── tool-use.md                         # Tool calling with Claude
│   │   ├── prompt-caching.md                   # Cache system prompts for cost savings
│   │   ├── structured-outputs.md               # output_config with structured-outputs beta
│   │   ├── mcp-connector.md                    # Model Context Protocol (MCP) servers
│   │   ├── batches-api.md                      # Async batch processing
│   │   ├── token-counting.md                   # count_tokens endpoint
│   │   └── cost-pricing.md                     # Per-model pricing, caching savings
│   ├── google-gemini/
│   │   ├── setup.md                            # Gemini API key, config
│   │   ├── text-generation.md                  # Gemini models (2.5 Pro, 2.5 Flash)
│   │   ├── long-context.md                     # 1M+ token context window
│   │   ├── multimodal.md                       # Vision, audio, video input
│   │   ├── embeddings.md                       # Gemini embedding models
│   │   ├── streaming.md
│   │   └── cost-pricing.md
│   ├── mistral/
│   │   ├── setup.md
│   │   ├── text-generation.md                  # Mistral Large, Small, Codestral
│   │   ├── embeddings.md
│   │   └── cost-pricing.md
│   ├── deepseek/
│   │   ├── setup.md
│   │   ├── text-generation.md                  # DeepSeek-V3, R1 (reasoner)
│   │   ├── streaming.md
│   │   └── cost-pricing.md                     # Cache hit/miss pricing
│   ├── groq/
│   │   ├── setup.md
│   │   ├── text-generation.md                  # Fast inference models
│   │   └── cost-pricing.md
│   ├── xai-grok/
│   │   ├── setup.md
│   │   └── text-generation.md
│   ├── cohere/
│   │   ├── setup.md
│   │   ├── embeddings.md                       # Cohere embedding models
│   │   ├── reranking.md                        # Cohere Rerank (cross-encoder)
│   │   └── cost-pricing.md
│   ├── jina/
│   │   ├── setup.md
│   │   ├── embeddings.md
│   │   └── reranking.md
│   ├── voyage-ai/
│   │   ├── setup.md
│   │   ├── embeddings.md                       # voyage-3, voyage-code-3
│   │   ├── reranking.md                        # rerank-2.5
│   │   └── cost-pricing.md
│   ├── elevenlabs/
│   │   ├── setup.md                            # TTS (text-to-speech)
│   │   └── audio.md
│   ├── azure-openai/
│   │   ├── setup.md                            # Azure endpoint, key, deployment
│   │   └── configuration.md
│   ├── aws-bedrock/
│   │   ├── setup.md
│   │   └── configuration.md
│   └── openrouter/
│       ├── setup.md                            # OpenRouter as OpenAI-compatible gateway
│       ├── model-routing.md                    # 100+ models via single API key
│       ├── free-models.md                      # Development with free-tier models
│       └── cost-comparison.md                  # Cross-provider cost comparison
│
├── 02-laravel-ai-sdk/
│   ├── overview.md                             # Architecture, Prism PHP dependency
│   ├── installation.md                         # composer require laravel/ai, vendor:publish
│   ├── configuration.md                        # config/ai.php, .env, provider setup
│   ├── agents/
│   │   ├── agent-architecture.md               # Agent class anatomy, Promptable trait
│   │   ├── creating-agents.md                  # php artisan make:agent
│   │   ├── instructions.md                     # System prompt design via instructions()
│   │   ├── prompting.md                        # prompt() method, message types
│   │   ├── structured-output.md               # HasStructuredOutput, schema enforcement
│   │   ├── conversation-memory.md              # RemembersConversations trait
│   │   ├── tools/
│   │   │   ├── custom-tools.md                 # Tool classes, handle(), schema()
│   │   │   ├── similarity-search.md            # SimilaritySearch for RAG
│   │   │   ├── provider-tools.md              # WebSearch, WebFetch, FileSearch
│   │   │   └── security.md                    # Tool argument validation, authorization
│   │   ├── middleware/
│   │   │   ├── overview.md                     # HasMiddleware, agent middleware pipeline
│   │   │   ├── creating-middleware.md          # php artisan make:agent-middleware
│   │   │   ├── logging-middleware.md           # Prompt/response logging
│   │   │   ├── cost-tracking-middleware.md     # Token/cost recording
│   │   │   ├── security-middleware.md          # Injection detection, PII redaction
│   │   │   └── rate-limiting-middleware.md     # Per-user/tenant rate limits
│   │   ├── attributes.md                       # #[Provider], #[Model], #[Temperature], etc.
│   │   ├── cost-optimization.md                # #[UseCheapestModel], #[UseSmartestModel]
│   │   ├── failover.md                         # Multi-provider failover arrays
│   │   ├── streaming.md                        # ->stream(), StreamableAgentResponse
│   │   ├── queueing.md                         # ->queue(), broadcastOnQueue()
│   │   ├── provider-options.md                # HasProviderOptions for provider-specific config
│   │   └── multi-agent/
│   │       ├── overview.md                     # Five multi-agent patterns (Anthropic research)
│   │       ├── chaining.md                     # Sequential: A -> B -> C
│   │       ├── routing.md                      # Classifier -> Specialist agent
│   │       ├── parallelization.md              # Concurrency::run() with parallel agents
│   │       ├── orchestrator-workers.md         # Coordinator delegates to worker tools
│   │       ├── sub-agents.md                   # Agent-as-tool pattern
│   │       └── when-to-use.md                  # Decision guide per pattern
│   ├── embeddings/
│   │   ├── overview.md                         # Embeddings::for(), generation
│   │   ├── storage.md                          # vector columns, pgvector setup
│   │   ├── caching.md                          # Embedding cache, deduplication
│   │   └── querying.md                         # whereVectorSimilarTo()
│   ├── vector-stores/
│   │   ├── overview.md                         # File uploads, indexing, searching
│   │   ├── creating-stores.md
│   │   ├── adding-files.md
│   │   └── file-search.md                      # FileSearch provider tool
│   ├── reranking.md                            # Cohere, Jina, VoyageAI reranking
│   ├── image-generation.md                     # Laravel\Ai\Image class
│   ├── audio/
│   │   ├── text-to-speech.md                  # OpenAI, ElevenLabs, Gemini
│   │   └── speech-to-text.md                  # OpenAI Whisper, ElevenLabs, Mistral, Gemini
│   ├── testing/
│   │   ├── fake-ai.md                          # FakeAi facade, shouldFake()
│   │   ├── faking-agents.md                   # Agent fakes, withResponse(), assertPrompted()
│   │   ├── faking-tools.md                    # Tool fakes
│   │   ├── preventing-stray-prompts.md        # preventStrayPrompts()
│   │   └── ci-configuration.md                # API key management in CI
│   ├── artisan-commands.md                     # make:agent, make:tool, make:agent-middleware, ai:install
│   └── upgrade-guides/
│       ├── laravel-11-to-12.md
│       ├── laravel-12-to-13.md
│       └── prism-to-ai-sdk-migration.md
│
├── 03-agentic-workflows/
│   ├── architecture-patterns/
│   │   ├── single-agent.md                     # Simple prompt -> response
│   │   ├── tool-calling-agent.md               # Agent with tools, automatic execution loop
│   │   ├── conversational-agent.md             # Multi-turn with memory
│   │   ├── rag-agent.md                        # Agent with SimilaritySearch tool
│   │   ├── multi-agent-systems.md             # Coordination patterns
│   │   └── agent-as-tool.md                   # Sub-agent pattern
│   ├── lagraph-workflows/
│   │   ├── overview.md                         # Stateful graph-based workflows
│   │   ├── state-graph.md                      # StateGraph definition, nodes, edges
│   │   ├── workflow-runs.md                    # WorkflowRun persistence, state tracking
│   │   ├── nodes/
│   │   │   ├── agent-node.md                  # AsGraphNode trait for Laravel AI agents
│   │   │   ├── tool-node.md                   # Manual routing tool node
│   │   │   ├── barrier-node.md                # Synchronization barrier
│   │   │   └── send-node.md                   # Dynamic fan-out / map-reduce
│   │   ├── human-in-the-loop.md               # Interrupt/resume, approval gates
│   │   ├── parallel-execution.md              # Concurrent node execution via queue
│   │   └── sub-graphs.md                      # Native sub-workflow embedding
│   ├── agentgraph-runtime/
│   │   ├── overview.md                         # Durable agent graph runtime
│   │   ├── checkpoints.md                     # Run checkpointing and resume
│   │   ├── interrupts.md                      # Pause/resume with expiry
│   │   ├── scoped-memory.md                   # Namespaced memory per run
│   │   ├── idempotent-tasks.md                # Task deduplication via leases
│   │   ├── traces.md                          # Run event observation
│   │   ├── graphs-as-tools.md                 # Embedding workflows as agent tools
│   │   └── retry-policies.md                  # Per-node retry/timeout/concurrency policies
│   ├── conductor-workflows/
│   │   ├── overview.md                         # Fluent workflow builder
│   │   ├── step-definitions.md                # Steps with dependencies
│   │   ├── conditionals.md                    # Conditional branching
│   │   ├── human-approval.md                  # Approval gates
│   │   ├── parallel-steps.md                  # Concurrent step execution
│   │   └── retries.md                         # Step retry configuration
│   └── best-practices/
│       ├── step-limits.md                     # withMaxSteps() safety valve
│       ├── token-budgeting.md                 # Per-workflow token budgets
│       ├── error-handling.md                  # Fallback chains, retry strategies
│       └── observability.md                   # Workflow tracing, logging
│
├── 04-rag-retrieval-augmented-generation/
│   ├── overview.md                             # RAG architecture, when to use
│   ├── architecture.md                         # Ingest -> Chunk -> Embed -> Store -> Retrieve -> Generate
│   ├── document-ingestion/
│   │   ├── file-parsing.md                    # PDF, DOCX, TXT, Markdown, CSV
│   │   ├── queue-processing.md                # Async ingestion jobs
│   │   ├── content-hashing.md                 # SHA-256 deduplication for idempotent re-ingestion
│   │   └── metadata-extraction.md             # Source, date, author, category
│   ├── chunking-strategies/
│   │   ├── overview.md                         # Chunking decision framework
│   │   ├── character-chunking.md              # Fixed-size character splits
│   │   ├── sentence-chunking.md               # Sentence boundary splits
│   │   ├── recursive-splitting.md             # RecursiveCharacterTextSplitter pattern
│   │   ├── semantic-chunking.md               # Embedding-based semantic boundaries
│   │   ├── markdown-chunking.md               # Header/section-based splits
│   │   └── overlap-configuration.md           # Sliding window overlap (50-200 tokens)
│   ├── embedding-generation/
│   │   ├── batch-embedding.md                 # Batch API calls (32-128 per request)
│   │   ├── embedding-models.md                # Model selection (voyage-3, text-embedding-3, etc.)
│   │   ├── caching.md                         # Content-hash based embedding cache (60-80% savings)
│   │   └── model-mixing-warning.md            # Never mix embedding models in one index
│   ├── vector-databases/
│   │   ├── pgvector/
│   │   │   ├── setup.md                       # Extension install, column types
│   │   │   ├── migrations.md                  # Laravel 13 vector() column, HNSW indexes
│   │   │   ├── querying.md                   # <=> cosine distance, whereVectorSimilarTo()
│   │   │   ├── indexing.md                   # HNSW vs IVFFlat, ef_search, ef_construction
│   │   │   ├── hybrid-search.md              # Vector + full-text (tsvector) with RRF
│   │   │   └── maintenance.md                # REINDEX, vacuum, partition by tenant
│   │   ├── qdrant/
│   │   │   ├── setup.md                      # Docker, cloud, configuration
│   │   │   ├── collections.md                # Create, configure, manage
│   │   │   ├── querying.md                   # Similarity search, payload filtering
│   │   │   └── scaling.md                    # Sharding, replication
│   │   ├── pinecone/
│   │   │   ├── setup.md                      # Serverless vs pod architecture
│   │   │   ├── indexes.md                    # Create, configure, namespaces
│   │   │   ├── querying.md                   # Query, metadata filtering
│   │   │   └── cost-pricing.md               # Per-vector pricing, serverless vs pods
│   │   ├── chromadb/
│   │   │   ├── setup.md                      # Local development setup
│   │   │   └── usage.md
│   │   ├── mongodb-atlas/
│   │   │   ├── setup.md                      # Atlas vector search index
│   │   │   └── llphant-integration.md        # Via LLPhant MongoDB vector store
│   │   ├── redis/
│   │   │   ├── setup.md                      # Redis Stack with RediSearch
│   │   │   └── usage.md
│   │   └── comparison.md                     # Decision matrix: pgvector vs Qdrant vs Pinecone
│   ├── retrieval/
│   │   ├── similarity-search.md               # ANN search, cosine distance
│   │   ├── hybrid-search.md                  # RRF combining semantic + keyword scores
│   │   ├── metadata-filtering.md             # Tenant, category, date, access level filters
│   │   ├── reranking.md                      # Cross-encoder rerank (Cohere Rerank, VoyageAI)
│   │   ├── agentic-rag.md                    # Iterative retrieval with sufficiency evaluation
│   │   └── threshold-tuning.md               # minSimilarity tuning per domain
│   ├── generation/
│   │   ├── context-injection.md              # Prompt construction with retrieved chunks
│   │   ├── citation-grounded-answers.md      # Chunk ID citations for verifiability
│   │   ├── temperature-settings.md           # Low temperature (0.1-0.3) for RAG
│   │   ├── no-hallucination-prompting.md     # "Using ONLY the context provided below"
│   │   └── fallback-behavior.md              # "I couldn't find relevant information"
│   ├── evaluation/
│   │   ├── retrieval-quality.md              # Precision, recall, MRR metrics
│   │   ├── citation-rate-tracking.md         # % of answers with valid chunk citations
│   │   ├── chunk-size-benchmarking.md        # A/B test different chunk sizes
│   │   └── eval-datasets.md                  # Creating and maintaining eval sets
│   ├── patterns/
│   │   ├── simple-rag.md                     # Single-shot: retrieve -> generate
│   │   ├── agentic-rag.md                    # Agent decides when to retrieve (SimilaritySearch tool)
│   │   ├── multi-query-rag.md                # Transform query -> multiple searches -> aggregate
│   │   ├── parent-document-retrieval.md      # Retrieve chunk, return parent document
│   │   └── contextual-retrieval.md           # Prepend chunk context before embedding
│   └── packages/
│       ├── moneo-laravel-rag.md              # Driver-based RAG with pgvector + sqlite-vec
│       ├── thaolaptrinh-laravel-rag.md       # Provider-agnostic RAG with OpenAI-compatible APIs
│       ├── kidiatoliny-laravel-rag.md        # RAG with PrismPHP + Spatie Data
│       └── aanfarhan-laravel-rag.md          # Multi-provider RAG with Alpine.js UI
│
├── 05-vector-databases/
│   ├── comparison.md                          # Full feature comparison matrix
│   ├── pgvector/
│   │   ├── architecture.md                   # How pgvector works under the hood
│   │   ├── installation.md                   # PostgreSQL extension setup
│   │   ├── column-types.md                   # vector(1536), vector(1024), etc.
│   │   ├── index-types.md
│   │   │   ├── hnsw.md                       # HNSW: m=16, ef_construction=64, ef_search
│   │   │   └── ivfflat.md                    # IVFFlat: lists, probes (legacy)
│   │   ├── distance-operators.md             # <-> (L2), <=> (cosine), <#> (inner product)
│   │   ├── hybrid-search.md                  # Combining with tsvector full-text search
│   │   ├── performance-tuning.md             # ef_search, probes, partitioning
│   │   ├── multi-tenancy.md                  # Tenant ID columns, separate indexes
│   │   ├── migration-strategies.md           # Adding/dropping vector columns, re-indexing
│   │   ├── backup-and-restore.md             # pg_dump with vector data
│   │   └── managed-providers.md              # RDS, Supabase, Neon, Cloud SQL
│   ├── qdrant/
│   │   ├── architecture.md                   # Rust-based, HNSW, payload indexing
│   │   ├── self-hosted.md                    # Docker Compose setup
│   │   ├── qdrant-cloud.md                   # Managed service setup
│   │   ├── collections.md                    # Create, configure, optimize
│   │   ├── payload-filtering.md              # Keyword, numerical, geo, nested filters
│   │   ├── quantization.md                   # Scalar/product quantization
│   │   └── scaling.md                        # Sharding, replication, hybrid cloud
│   ├── pinecone/
│   │   ├── architecture.md                   # Pod vs serverless
│   │   ├── setup.md                          # Index creation, namespaces
│   │   ├── querying.md                       # Query with metadata filtering
│   │   ├── sparse-dense.md                   # Hybrid search with sparse vectors
│   │   └── cost-management.md                # Pod sizing, serverless auto-scaling
│   ├── chromadb/
│   │   ├── setup.md                          # Local Python/PHP setup
│   │   └── usage.md
│   ├── milvus/
│   │   ├── setup.md
│   │   └── usage.md
│   ├── weaviate/
│   │   ├── setup.md
│   │   └── usage.md
│   ├── mongodb-atlas/
│   │   ├── setup.md                          # Atlas Vector Search index
│   │   └── llphant.md                        # LLPhant MongoDB vector store driver
│   ├── upstash/
│   │   ├── setup.md                          # Serverless vector database
│   │   └── usage.md
│   ├── sqlite-vec/
│   │   ├── setup.md                          # Local dev only (Docker/Linux)
│   │   └── limitations.md                    # macOS Herd/Homebrew incompatibility
│   └── decision-framework.md                 # When to use which vector database
│
├── 06-ai-search/
│   ├── overview.md                            # Semantic search vs keyword search
│   ├── semantic-search/
│   │   ├── architecture.md                    # Embedding -> ANN search pipeline
│   │   ├── laravel-13-native.md              # whereVectorSimilarTo(), Str::toEmbeddings()
│   │   ├── manual-approach.md                # Raw <=> operator, DB::select
│   │   └── multi-lingual.md                  # Cross-language semantic search
│   ├── hybrid-search/
│   │   ├── overview.md                        # Vector + keyword combined scoring
│   │   ├── rrf-scoring.md                    # Reciprocal Rank Fusion algorithm
│   │   ├── weight-tuning.md                  # 60/40 vector/keyword default, per-domain tuning
│   │   ├── pgvector-implementation.md        # Single SQL query with both distances
│   │   └── when-to-use.md                    # Code/SKU searches need keyword weight
│   ├── ai-powered-reranking/
│   │   ├── overview.md                        # Cross-encoder re-ranking
│   │   ├── cohere-rerank.md                  # Cohere Rerank API
│   │   ├── voyage-rerank.md                  # VoyageAI Rerank API
│   │   ├── jina-rerank.md                    # Jina Rerank API
│   │   └── implementation.md                 # Retrieve top-K, rerank top-N
│   ├── search-features/
│   │   ├── metadata-filtering.md             # Filter before/after vector search
│   │   ├── faceted-search.md                 # Combine AI search with facets
│   │   ├── search-analytics.md               # Query logging, click tracking
│   │   └── autocomplete.md                   # AI-powered query suggestions
│   └── comparison.md                         # AI search vs Meilisearch vs Elasticsearch vs Algolia
│
├── 07-streaming/
│   ├── overview.md                            # Streaming architecture decisions
│   ├── transport-comparison.md               # SSE vs WebSocket vs Livewire vs Polling
│   ├── server-sent-events/
│   │   ├── overview.md                        # SSE fundamentals, Content-Type
│   │   ├── laravel-implementation.md         # response()->stream(), chunk handling
│   │   ├── ai-sdk-streaming.md               # ->stream(), StreamableAgentResponse
│   │   ├── evitng-buffering.md              # Nginx proxy_buffering off, X-Accel-Buffering
│   │   ├── php-fpm-considerations.md         # Worker pool sizing for long-held requests
│   │   └── vercel-ai-protocol.md             # ->usingVercelDataProtocol() for Next.js
│   ├── livewire-wire-stream/
│   │   ├── overview.md                        # wire:stream attribute, append vs replace
│   │   ├── component-architecture.md         # Splitting submit from stream
│   │   ├── streaming-patterns.md             # $this->stream(), partial updates
│   │   ├── octane-limitation.md              # Not compatible with Laravel Octane
│   │   ├── fallback-strategies.md            # SSE route + Alpine.js if Octane
│   │   └── troubleshooting.md               # Telescope interference, Nginx buffering
│   ├── websocket-broadcasting/
│   │   ├── overview.md                        # Laravel Reverb setup
│   │   ├── ai-sdk-broadcasting.md            # ->broadcastOnQueue()
│   │   ├── multi-client.md                   # Broadcast to multiple users
│   │   └── reverb-production.md              # Scaling Reverb, SSL, clustering
│   ├── prism-streaming/
│   │   ├── overview.md                        # Prism ->asStream(), ->asEventStreamResponse()
│   │   ├── stream-events.md                  # StreamEvent types (TextDelta, etc.)
│   │   ├── callback-patterns.md             # Completion callback for persistence
│   │   └── broadcast.md                      # ->asBroadcast() via Reverb
│   ├── frontend-integration/
│   │   ├── alpine-js.md                      # fetch + ReadableStream SSE parsing
│   │   ├── vanilla-js.md                     # EventSource API
│   │   └── react-vue.md                      # Third-party framework consumption
│   └── production-checklist.md                # Proxy config, timeout, worker sizing, error handling
│
├── 08-cost-token-management/
│   ├── overview.md                            # AI cost management landscape
│   ├── token-fundamentals/
│   │   ├── what-are-tokens.md                # Tokenization basics
│   │   ├── token-estimation.md               # ~4 chars/token heuristic vs tokenizer
│   │   ├── context-windows.md                # Model context limits (128K, 200K, 1M+)
│   │   └── input-vs-output.md               # Output tokens typically 2-4x input cost
│   ├── pricing-models/
│   │   ├── openai-pricing.md                 # Per-model rates (GPT-4o, GPT-4o-mini, o-series)
│   │   ├── anthropic-pricing.md              # Claude Sonnet/Opus/Haiku rates
│   │   ├── gemini-pricing.md                 # Gemini Pro/Flash rates
│   │   ├── caching-pricing.md               # Prompt caching savings (50-90%)
│   │   ├── modality-pricing.md              # Image, audio, video token costs
│   │   └── embedding-pricing.md             # Per-token embedding costs
│   ├── laravel-ai-guard/
│   │   ├── overview.md                        # Budget enforcement, estimation, tracking
│   │   ├── installation.md
│   │   ├── configuration.md                  # Pricing tables, budgets, estimation params
│   │   ├── budget-enforcement.md             # checkAllBudgets(), recordAndApplyBudget()
│   │   ├── token-estimation.md               # Estimation before API call
│   │   ├── usage-recording.md               # recordFromResponse(), streaming support
│   │   ├── advanced-pricing.md               # Context caching, modality, long context
│   │   ├── multi-tenant.md                   # Per-user, per-tenant budgets
│   │   ├── kill-switch.md                    # ai_disabled config
│   │   ├── artisan-commands.md              # ai-guard:report, ai-guard:reset-budgets
│   │   └── middleware.md                     # ai.guard route middleware
│   ├── llm-tokenkit/
│   │   ├── overview.md                        # Stateless token estimation
│   │   ├── token-estimation.md               # estimateTokens() for text/chat messages
│   │   ├── cost-calculation.md              # Cost based on provider-specific pricing
│   │   ├── context-window.md                 # buildContext() with truncation strategies
│   │   └── configuration.md                  # pricing per model, wildcard matching
│   ├── ai-metering/
│   │   ├── overview.md                        # Usage metering + Stripe billing
│   │   ├── installation.md
│   │   ├── usage-tracking.md                 # Automatic token/cost tracking
│   │   ├── quota-management.md              # Per-plan, per-tenant limits
│   │   ├── billing-integration.md           # Stripe/Cashier, credit-based, subscription
│   │   └── multi-tenancy.md
│   ├── llm-observability/
│   │   ├── overview.md                        # Filament dashboard, alerting, webhooks
│   │   ├── installation.md
│   │   ├── dashboard.md                      # Real-time metrics, request logs, analytics
│   │   ├── quota-enforcement.md             # Request/token/cost limits, middleware
│   │   ├── alerting.md                      # Cost thresholds, error rates, latency spikes
│   │   └── filament-integration.md
│   ├── ai-governor/
│   │   ├── overview.md                        # Prompt versioning + token governance
│   │   ├── prompt-migrations.md              # Version-controlled prompt definitions
│   │   ├── budget-enforcement.md             # Eloquent model budget, soft/hard limits
│   │   └── ci-integration.md                 # Deploy script with prompt sync
│   ├── model-cascading/
│   │   ├── overview.md                        # Cheap model first, escalate on need
│   │   ├── implementation.md                 # Router with model tiers
│   │   ├── use-cheapest-model.md            # Laravel AI SDK #[UseCheapestModel]
│   │   └── task-routing.md                   # Route simple tasks to cheap models
│   └── best-practices/
│       ├── caching-strategies.md             # Redis prompt caching, embedding caching
│       ├── max-tokens-limits.md             # Setting safe output token caps
│       ├── rate-limiting.md                  # User-level throttle (20/min)
│       ├── budget-alerts.md                  # Daily/weekly/monthly soft limits
│       └── cost-monitoring-dashboard.md      # Aggregating cost data for finance
│
├── 09-ai-middleware-gateways/
│   ├── overview.md                            # AI gateway role in production
│   ├── laravel-agent-middleware/
│   │   ├── overview.md                        # HasMiddleware, middleware pipeline
│   │   ├── creating-middleware.md            # php artisan make:agent-middleware
│   │   ├── prompt-interception.md            # Modify prompt before provider
│   │   ├── response-interception.md          # Process response after provider (.then())
│   │   └── use-cases.md                      # Logging, cost tracking, security, rate limiting
│   ├── llm-router/
│   │   ├── overview.md                        # Circuit-breaker failover chains
│   │   ├── configuration.md                  # Tiers (small/large), priority overrides
│   │   ├── failover-strategies.md            # Transient retry, rate-limit failover, terminal stop
│   │   ├── tenant-aware-routing.md           # Sovereign tenant -> Ollama
│   │   └── laravel-ai-integration.md         # Seamless with laravel/ai SDK
│   ├── lite-llm-proxy/
│   │   ├── overview.md                        # Open-source LLM gateway proxy
│   │   ├── setup.md                           # Docker deployment
│   │   ├── configuration.md                  # Provider routing, key management
│   │   ├── rate-limiting.md                  # Per-key, per-model limits
│   │   ├── cost-tracking.md                  # Spend tracking across providers
│   │   └── laravel-integration.md            # Custom base URL in config/ai.php
│   ├── azure-openai-gateway/
│   │   ├── overview.md                        # Enterprise gateway for Azure OpenAI
│   │   └── configuration.md
│   ├── api7-ai-gateway/
│   │   ├── overview.md                        # Content-aware AI gateway
│   │   ├── prompt-injection-defense.md       # Semantic filtering, prompt hardening
│   │   ├── pii-redaction.md                  # In-transit PII detection and redaction
│   │   ├── audit-logging.md                  # Immutable prompt/response audit trail
│   │   └── compliance.md                     # GDPR, HIPAA, SOC2
│   └── custom-gateway-patterns/
│       ├── proxy-service.md                  # Custom proxy for API key centralization
│       ├── multi-tenant-routing.md            # Tenant-aware provider selection
│       └── canary-deployments.md             # Route % traffic to new model/provider
│
├── 10-prompt-engineering/
│   ├── overview.md                            # Prompt engineering principles
│   ├── system-prompt-design/
│   │   ├── role-definition.md                # Background, persona, constraints
│   │   ├── instruction-structure.md          # Steps, rules, boundaries
│   │   ├── output-format.md                  # Explicit format specification
│   │   ├── guardrails.md                     # What to avoid, refusal behavior
│   │   └── constitution-pattern.md           # Agent constitution design
│   ├── techniques/
│   │   ├── zero-shot.md                      # Task description without examples
│   │   ├── few-shot.md                       # Input-output examples (positive + negative)
│   │   ├── chain-of-thought.md              # Step-by-step reasoning
│   │   ├── self-consistency.md               # Multiple reasoning paths, majority vote
│   │   ├── role-playing.md                   # Persona assignment, tone specification
│   │   ├── structured-outputs.md             # JSON, XML, Markdown, CSV formats
│   │   ├── delimiters.md                     # Separating instructions from data
│   │   └── leading-words.md                  # Nudge model toward specific patterns
│   ├── prompt-versioning/
│   │   ├── file-based-templates.md           # Blade / .txt prompt templates in resources/
│   │   ├── database-storage.md               # Versioned prompts in DB (ai-governor)
│   │   ├── a-b-testing.md                    # Prompt variant comparison
│   │   └── ci-pipeline-integration.md        # Prompts as part of deployment
│   ├── token-optimization/
│   │   ├── length-reduction.md               # Removing redundancy, abbreviations
│   │   ├── priority-structuring.md           # Critical instructions first
│   │   ├── truncation-strategies.md          # Intelligent truncation preserving structure
│   │   └── context-window-management.md      # Budgeting tokens for prompt + completion
│   ├── testing-and-evaluation/
│   │   ├── prompt-test-harness.md            # 20-30 example eval set
│   │   ├── accuracy-scoring.md               # Structured output accuracy
│   │   ├── regression-testing.md             # Prevent regressions on prompt changes
│   │   └── temperature-tuning.md             # 0.1 for structured, 0.7+ for creative
│   └── injection-defense/
│       ├── input-sanitization.md             # Strip known attack patterns
│       ├── prompt-hardening.md               # System prompt reinforcement
│       ├── context-isolation.md              # Untrusted content tagging
│       ├── output-validation.md              # Validate model output before use
│       └── defense-in-depth.md               # Multi-layer security approach
│
├── 11-ai-safety-security/
│   ├── overview.md                            # OWASP LLM Top 10 for Laravel
│   ├── prompt-injection/
│   │   ├── attack-vectors.md
│   │   │   ├── direct-injection.md           # User input overrides system prompt
│   │   │   ├── indirect-injection.md         # Malicious content in retrieved documents
│   │   │   ├── tool-call-injection.md        # LLM-controlled tool arguments
│   │   │   ├── conversation-history-poisoning.md # Via shared/persisted conversations
│   │   │   └── encoded-payloads.md           # Base64, multi-language, emoji
│   │   ├── defense-packages/
│   │   │   ├── laravel-ai-aegis.md           # Bidirectional PII pseudonymization, injection detection
│   │   │   ├── laravel-guardrail.md          # Input/output guarding, violation logging
│   │   │   ├── laravel-ai-guard-crawler.md   # 365 bot signatures, honeypot traps
│   │   │   └── building-custom.md            # Custom middleware-based defense
│   │   ├── defense-strategies/
│   │   │   ├── input-validation.md           # Validate types, lengths, patterns
│   │   │   ├── output-filtering.md           # Scan for system prompt leakage
│   │   │   ├── least-privilege-tools.md      # Restrict tool availability and permissions
│   │   │   ├── human-in-the-loop.md          # Approval for high-risk actions
│   │   │   └── static-analysis.md            # Psalm taint tracking (proposed)
│   │   └── testing/
│   │       ├── red-teaming.md                # Adversarial prompt testing
│   │       ├── injection-benchmarks.md        # Test suite against known patterns
│   │       └── artisan-test-command.md       # php artisan aegis:test
│   ├── pii-data-protection/
│   │   ├── detection-patterns.md             # Email, phone, SSN, credit card, IP, API keys
│   │   ├── pseudonymization.md               # Replace -> {{AEGIS_TOKEN}} -> Restore
│   │   ├── redaction.md                      # Permanent removal
│   │   └── compliance.md                     # GDPR, HIPAA, SOC2 considerations
│   ├── output-guarding/
│   │   ├── topic-drift.md                    # LLM stays on topic
│   │   ├── toxicity-detection.md             # Harmful content filtering
│   │   ├── prompt-leakage.md                 # Detect system prompt in output
│   │   └── xss-prevention.md                 # Sanitize LLM output before HTML render
│   ├── tool-security/
│   │   ├── argument-validation.md            # Server-side validation of LLM-supplied args
│   │   ├── authorization.md                 # Tool permission scoped to user
│   │   ├── schema-constraints.md            # Schema tells provider, handler enforces
│   │   ├── event-logging.md                 # InvokingTool / ToolInvoked events
│   │   └── output-sanitization.md           # Tool results as untrusted input to model
│   ├── conversation-security/
│   │   ├── access-control.md                 # Conversation ownership
│   │   ├── data-retention.md                 # Message pruning and deletion
│   │   └── injection-via-history.md          # Past messages affecting future responses
│   ├── static-analysis/
│   │   ├── psalm-taint-tracking.md           # Proposed taint sources/sinks for LLM
│   │   ├── taint-sources.md                  # Agent::prompt(), stream(), response->text
│   │   ├── taint-sinks.md                    # SQL queries, HTML output, shell commands
│   │   └── tool-argument-tracking.md         # Tool arguments sourced from LLM output
│   └── compliance-audit/
│       ├── audit-logging.md                  # Immutable prompt/response/action logs
│       ├── data-residency.md                 # Sovereign tenant routing to local models
│       ├── retention-policies.md             # Log pruning schedules
│       └── regulatory-reporting.md           # GDPR data processing records
│
├── 12-observability-monitoring/
│   ├── overview.md                            # Why AI observability matters
│   ├── metrics-to-track.md                   # Tokens, latency, cost, error rate, injection rate
│   ├── llm-observability-package/
│   │   ├── overview.md                        # Full Filament dashboard
│   │   ├── tracking.md                       # Automatic per-request capture
│   │   ├── dashboard.md                      # Real-time metrics, request logs
│   │   ├── alerts.md                         # Threshold-based notifications
│   │   ├── quotas.md                         # Request/token/cost limits
│   │   └── webhooks.md                       # External integration
│   ├── structured-logging/
│   │   ├── prompt-response-logs.md           # Every AI call logged
│   │   ├── cost-audit-log.md                # Per-request cost attribution
│   │   ├── error-logging.md                 # Provider errors, injection detections
│   │   └── latency-tracking.md              # p50/p95/p99 latency per provider/model
│   ├── alerting/
│   │   ├── cost-spikes.md                    # Detect anomalous token usage
│   │   ├── error-rate.md                     # Provider failure rate thresholds
│   │   ├── latency-degradation.md            # Slow response detection
│   │   └── budget-exceeded.md               # Hard/soft budget crossing
│   ├── dashboard-examples/
│   │   ├── filament-dashboard.md             # LLM Observability Filament cards
│   │   ├── laravel-pulse-card.md             # Custom Pulse card for AI metrics
│   │   └── grafana-integration.md            # Export metrics to Grafana
│   └── cost-analysis/
│       ├── per-feature-cost.md               # Cost attribution by feature
│       ├── per-user-cost.md                  # Cost attribution by user/tenant
│       ├── per-model-cost.md                 # Cost by provider/model
│       └── trend-analysis.md                 # Week-over-week cost trends
│
├── 13-local-llms/
│   ├── overview.md                            # Local LLM strategy for Laravel
│   ├── ollama/
│   │   ├── installation.md                   # Download, install, run
│   │   ├── model-management.md              # ollama pull, list, rm, cp
│   │   ├── recommended-models.md
│   │   │   ├── llama-3.2.md                 # 3B/8B general purpose
│   │   │   ├── qwen-2.5-coder.md            # 7B code-specific
│   │   │   ├── mistral.md                    # 7B fast instruction following
│   │   │   └── phi-4.md                      # Microsoft small model
│   │   ├── laravel-ai-sdk-config.md         # Provider config, no API key
│   │   ├── dev-vs-prod-switching.md          # .env-based provider switching
│   │   ├── embedding-support.md              # Embedding via Ollama
│   │   ├── limitations.md                    # No image/audio generation
│   │   ├── team-shared-instance.md           # Central Ollama for dev team
│   │   └── anthropic-compatibility.md        # Using Ollama with Claude Code
│   ├── lm-studio/
│   │   ├── installation.md
│   │   ├── model-download.md
│   │   └── laravel-integration.md            # OpenAI-compatible endpoint
│   ├── local-llm-sdk-package/
│   │   ├── overview.md                        # Multi-driver local LLM package
│   │   ├── drivers.md                        # Ollama, LM Studio, AirLLM, OpenAI-compatible
│   │   ├── auto-detection.md                 # Detect available local engines
│   │   ├── failover.md                       # Fallback between local drivers
│   │   └── metrics.md                        # Prometheus-compatible monitoring
│   ├── airllm/
│   │   └── overview.md                        # Memory-efficient local inference
│   ├── use-cases/
│   │   ├── development.md                     # No API cost development
│   │   ├── private-data.md                    # Sensitive data never leaves network
│   │   ├── offline-scenarios.md              # Air-gapped deployments
│   │   └── testing.md                        # Local models in CI
│   └── production-ollama/
│       ├── gpu-setup.md                       # GPU passthrough, VRAM requirements
│       ├── scaling.md                         # Multiple Ollama instances
│       └── monitoring.md                      # Model performance metrics
│
├── 14-ecosystem-packages/
│   ├── comparison-matrix.md                   # All packages compared
│   ├── prism-php/
│   │   ├── overview.md                        # Community provider abstraction
│   │   ├── installation.md
│   │   ├── configuration.md
│   │   ├── text-generation.md                # Prism::text() fluent interface
│   │   ├── tool-calling.md                   # Tool definition, withMaxSteps()
│   │   ├── agentic-loop.md                   # Full control over agent loop
│   │   ├── streaming.md                      # ->asStream(), ->asEventStreamResponse()
│   │   ├── rag-with-pgvector.md              # Prism + pgvector RAG pipeline
│   │   ├── structured-output.md
│   │   └── laravel-ai-sdk-comparison.md      # When to use Prism vs SDK
│   ├── llphant/
│   │   ├── overview.md                        # LangChain-inspired PHP framework
│   │   ├── installation.md
│   │   ├── chat-models.md                    # Unified LLM interface
│   │   ├── embeddings.md                     # Multiple embedding generators
│   │   ├── vector-stores.md                  # Doctrine, MongoDB, Qdrant, Redis, etc.
│   │   ├── rag-pipeline.md                   # QuestionAnswering class
│   │   ├── agents.md                         # AutoPHP agent system
│   │   ├── streaming.md
│   │   ├── function-calling.md
│   │   └── laravel-integration.md
│   ├── laragent/
│   │   ├── overview.md                        # LangChain-inspired agent builder
│   │   ├── agent-creation.md
│   │   ├── tools.md                          # Attribute-based, Facade-based, class-based
│   │   ├── chat-history.md                   # Multiple storage backends
│   │   ├── structured-output.md
│   │   ├── event-system.md                   # Lifecycle hooks
│   │   └── parallel-tools.md                 # Parallel tool execution
│   ├── superagent/
│   │   ├── overview.md                        # Enterprise multi-agent SDK
│   │   ├── multi-agent-orchestration.md
│   │   ├── cli-interface.md                  # Standalone CLI (Claude-Code-style)
│   │   ├── provider-patterns.md              # sameProvider, crossProvider, failoverChain
│   │   └── sub-agents.md
│   ├── conductor/
│   │   ├── overview.md                        # Workflow + agent orchestration
│   │   ├── agents.md                         # Builder vs class-based
│   │   ├── workflows.md                      # Steps, conditionals, parallel, approval
│   │   └── rag.md                            # Document ingestion + search
│   ├── langchain-laravel/
│   │   ├── overview.md                        # Multi-provider with agent framework
│   │   └── features.md                       # Text gen, code analysis, translation
│   ├── larachain/
│   │   ├── overview.md                        # LangChain-inspired with LCEL piping
│   │   └── features.md                       # ReAct agents, RAG, memory drivers
│   └── ai-bridge/
│       ├── overview.md                        # Unified streaming interface
│       ├── byok-mode.md                      # Bring your own key
│       ├── managed-mode.md
│       ├── cli-bridge.md                     # WebSocket bridge to local CLI tools
│       └── websocket-server.md               # Dedicated WS server for bridge
│
├── 15-future-trends/
│   ├── mcp-model-context-protocol.md          # Standardizing AI-tool communication
│   ├── a2a-agent-to-agent.md                  # Cross-agent communication protocols
│   ├── edge-ai.md                             # Serverless edge LLM inference
│   ├── ai-powered-laravel-internals.md        # AI features within framework itself
│   ├── federated-agents.md                    # Cross-application agent collaboration
│   ├── compliance-tooling.md                  # Automated AI compliance reporting
│   └── roadmap.md                             # Ecosystem maturity outlook 2026-2027
│
└── references/
    ├── official-docs.md                       # Tier 1 source links
    ├── community-articles.md                  # Tier 2 source links
    ├── packages.md                            # Tier 3 source links
    ├── background.md                          # Tier 4 source links
    └── glossary.md                            # AI/Laravel terminology
```

---

## Architecture Notes

### Layer Structure

```
┌──────────────────────────────────────────────────────────────┐
│                    Application Layer                          │
│  Controllers, Livewire Components, Artisan Commands, Jobs    │
├──────────────────────────────────────────────────────────────┤
│                    Service / Orchestration Layer              │
│  RAG Pipelines, Multi-Agent Workflows, Graph Workflows       │
├──────────────────────────────────────────────────────────────┤
│                    AI Abstraction Layer                       │
│  Laravel AI SDK Agents, Prism PHP, LLPhant, Custom Adapters  │
├──────────────────────────────────────────────────────────────┤
│                    Middleware / Governance Layer               │
│  Security (Aegis/Guardrail), Cost (AI Guard), Observability  │
├──────────────────────────────────────────────────────────────┤
│                    Infrastructure Layer                       │
│  PostgreSQL/pgvector, Qdrant, Redis, Queue, Broadcasting     │
└──────────────────────────────────────────────────────────────┘
```

### File Naming Conventions
- `lowercase-with-hyphens.md` for all files
- Each folder has `overview.md` as entry point
- `setup.md` for installation/configuration
- Reference implementations in pattern folders

### Cross-Reference Strategy
- Files reference each other via relative paths: `../../09-ai-middleware-gateways/overview.md`
- Key terms link to glossary in `references/glossary.md`
- Each package folder references the official package documentation
