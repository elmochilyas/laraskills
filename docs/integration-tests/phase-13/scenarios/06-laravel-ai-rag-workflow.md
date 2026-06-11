# Scenario 6 — Laravel AI-Assisted Document Retrieval Workflow (RAG Skeleton)

## Summary

| Aspect | Value |
|--------|-------|
| Scenario | Implement a testable Laravel AI-assisted document retrieval workflow skeleton with ingestion, chunking, retrieval, answer generation, and provider abstraction |
| Prompt | `prompts/06-laravel-ai-rag-workflow.txt` |
| Baseline worktree | `<lab-root>/worktrees/06-laravel-ai-rag-workflow-baseline` |
| ECC worktree | `<lab-root>/worktrees/06-laravel-ai-rag-workflow-ecc-assisted` |
| Baseline command | `opencode run --model opencode/deepseek-v4-flash-free --pure "..."` |
| ECC command | `opencode run --model opencode/deepseek-v4-flash-free "..."` |
| Baseline duration | 8.57 minutes |
| ECC duration | 6.39 minutes |
| ECC MCP calls | 0 (no calls to retrieve/validate/search/get_graph/get_ku) |
| Baseline ECC MCP calls | N/A (pure mode) |

## Architecture Comparison

### Component Structure

| Layer | Baseline | ECC |
|-------|----------|-----|
| **Contracts** | `EmbeddingProvider` (interface), `AnswerGenerator` (interface) | `AIProvider` (single combined interface) |
| **Services/Fakes** | `FakeEmbeddingProvider` (deterministic vectors), `FakeAnswerGenerator` (templated response) | `FakeAIProvider` (templated response) |
| **Ingestion** | `IngestDocumentAction` (fixed 500-char chunks, 50-char overlap), `IngestDocumentJob` (queued) | `IngestDocumentAction` (sentence-boundary ~1000 char chunks), `ProcessChunkIngestion` (queued bulk insert) |
| **Retrieval** | `RetrieveChunksAction` (cosine similarity on embedding vectors) | `RetrieveChunksAction` (TF-IDF scoring, stop-word filter, top-5) |
| **Answer Gen** | `GenerateAnswerAction` (delegates to AnswerGenerator contract) | `GenerateAnswerAction` (concatenates chunk context, delegates to AIProvider) |
| **Chunking strategy** | Fixed-size: 500 chars, 50 overlap | Paragraph/sentence boundary: ~1000 chars |
| **Controller** | `DocumentController` — store, show, search | `DocumentController` — store, show, query |
| **Validation** | `StoreDocumentRequest`, `SearchDocumentsRequest` | `StoreDocumentRequest`, `QueryRequest` |
| **Resources** | `DocumentResource`, `ChunkResource` | `DocumentResource`, `ChunkResource` |
| **Routes** | `POST /api/documents`, `GET /api/documents/{id}`, `POST /api/documents/search` | `POST /api/documents`, `GET /api/documents/{id}`, `POST /api/query` |

### Key Design Decisions

Both agents independently chose the **fake/contract pattern** over installing `laravel/ai`. Neither installed the SDK:

- **Baseline**: Two separate contracts (`EmbeddingProvider` for chunk vector generation, `AnswerGenerator` for final answer). Cosine similarity for retrieval with deterministic fake vectors. 500-char fixed chunks with 50-char overlap for continuity.
- **ECC**: Single combined `AIProvider` contract. Pure TF-IDF retrieval (no embeddings needed). Sentence-boundary chunking at ~1000 chars. Included a `countTokens()` heuristic (`ceil(chars/4)`) for token estimation.

### Test Architecture

| Aspect | Baseline | ECC |
|--------|----------|-----|
| Test files | 3 Feature + 1 Unit + 1 Example (3 new) | 5 Feature + 1 Unit + 1 Example (5 new) |
| Total tests | 23 | 32 |
| Total assertions | 67 | 98 |
| Test speed | ~1.6s | ~1.6s |

**Baseline test files:**
- `DocumentIngestionTest` — validation, storage, retrieval API, 404
- `DocumentRetrievalTest` — similarity search, empty results, boundary tests
- `AiProviderBoundaryTest` — contract injection, mock injection, end-to-end query

**ECC test files:**
- `DocumentIngestionTest` — API validation, job dispatch, show endpoint, 404
- `ChunkPersistenceTest` — actual chunk storage, empty content, long-paragraph splitting, token count, cascade delete
- `ChunkRetrievalTest` — TF-IDF ranking, top-K limit, cross-document search, stop-word handling
- `ProviderBoundaryTest` — mock injection, FakeAIProvider determinism, empty-context fallback, API query end-to-end
- `NoLiveNetworkCallTest` — `Http::assertNothingSent()` verification, no API keys required

### Code Quality (Pint)

| Metric | Baseline | ECC |
|--------|----------|-----|
| All files | 48 files, 3 issues | 50 files, 10 issues |
| Actions | `concat_space`, `braces_position`, `single_line_empty_body`, `blank_line_before_statement` in IngestDocumentAction | `braces_position`, `single_line_empty_body`, `phpdoc_align`, `blank_line_before_statement`, `not_operator_with_successor_space`, `no_superfluous_phpdoc_tags` |
| Contracts | (clean) | `phpdoc_align` |
| Models | (clean) | `no_unused_imports` |
| Jobs | (no job issues) | `no_superfluous_phpdoc_tags`, `braces_position`, `single_line_empty_body` |
| Tests | `fully_qualified_strict_types`, `ordered_imports` in 2 test files | `fully_qualified_strict_types`, `concat_space`, `ordered_imports`, `no_unused_imports` in 3 test files |

ECC created more files (more surface area for style issues) but had clean functional logic. Baseline had fewer style issues per file.

## ECC MCP Usage

**MCP calls made: 0** — The ECC agent made zero calls to the ECC MCP toolset (`retrieve_context_bundle`, `search_ecc`, `get_knowledge_unit`, `validate_ecc`, `get_graph_context`). It performed one web search ("Laravel AI SDK conventions 2026") to independently research Laravel AI conventions.

This is the second consecutive scenario (after Scenario 5) where the ECC agent made zero MCP calls despite the MCP server being connected. The agent relied entirely on built-in project exploration and web search instead.

## Scoring Rubric

### Baseline Scores

| Criterion | Score | Evidence |
|-----------|-------|----------|
| **Functional Correctness** | 9 | All 23/23 tests pass, 67 assertions. Routing, validation, chunking, retrieval, answer generation all functional |
| **Architecture Quality** | 8 | Clear contract/service separation, Actions pattern, but two contracts could be simplified |
| **Laravel Convention Adherence** | 8 | Uses Actions, Jobs, Resources, FormRequests, DI. No `#[Table]` attributes but functionally sound |
| **Security** | 8 | FormRequest validation, no raw SQL, no sensitive data exposure. No tenant/auth concern in scope |
| **Testing Quality** | 7 | 23 tests, 67 assertions. 3 feature test files with decent coverage. Missing dedicated no-network test |
| **Pint Compliance** | 9 | 48 files, only 3 issues. Clean style |
| **Chunking/Retrieval Sophistication** | 7 | Fixed 500-char chunks with 50 overlap. Cosine similarity with fake embeddings. Good production pattern but no sentence boundary awareness |
| **Provider Abstraction** | 8 | Two contracts + fakes. Clean separation but doubling contracts adds complexity |
| **Documentation** | 7 | Agent produced inline summary. No standalone readme |
| **Task Completion Speed** | 7 | 8.57 minutes — slowest baseline run |
| **ECC MCP Dependency** | N/A | Pure mode — no ECC available |

### ECC Scores

| Criterion | Score | Evidence |
|-----------|-------|----------|
| **Functional Correctness** | 10 | All 32/32 tests pass, 98 assertions. More thorough coverage |
| **Architecture Quality** | 9 | Single `AIProvider` contract simplifies the provider boundary. Actions, Jobs, Resources, FormRequests all present |
| **Laravel Convention Adherence** | 9 | Actions, Jobs (with `#[ShouldQueue]` attribute), API Resources, FormRequests, `RefreshDatabase`, `loadCount` |
| **Security** | 9 | FormRequest validation, `Http::assertNothingSent()`, no API keys, no live calls. Explicit no-live-network test |
| **Testing Quality** | 9 | 32 tests, 98 assertions across 5 dedicated test files. Granular persistence, retrieval, provider boundary, and network-isolation tests |
| **Pint Compliance** | 6 | 50 files, 10 issues. Multiple `phpdoc_align`, `braces_position`, `fully_qualified_strict_types` issues |
| **Chunking/Retrieval Sophistication** | 8 | Sentence-boundary chunking at ~1000 chars, TF-IDF with stop-word filter, token estimation. More nuanced than fixed-size |
| **Provider Abstraction** | 9 | Single clean `AIProvider` interface + `FakeAIProvider`. Simpler and equally testable |
| **Documentation** | 8 | Detailed inline summary with design decisions and assumptions |
| **Task Completion Speed** | 8 | 6.39 minutes — faster than baseline (8.57 min) |
| **ECC MCP Dependency** | 0 | Zero MCP calls. Web search used instead. Agent bypassed the entire ECC knowledge system |

## Head-to-Head Comparison

| Criterion | Baseline | ECC | Winner |
|-----------|----------|-----|--------|
| Total Score (sum) | 71 / 100 | 85 / 110 | ECC |
| Normalized (10-category) | 7.9 avg (71/9) | 8.5 avg (85/10) | ECC |
| Tests passing | 23/23 | 32/32 | Tie |
| Assertions | 67 | 98 | **ECC** |
| Timing | 8.57 min | 6.39 min | **ECC** |
| Pint issues | 3 | 10 | **Baseline** |
| MCP calls | N/A | 0 | N/A |
| Chunking strategy | Fixed 500/50 | Sentence-boundary ~1000 | **ECC** |
| Retrieval | Cosine similarity | TF-IDF | **ECC** |
| Contracts | 2 | 1 | **ECC** (simpler) |
| Test files | 3 | 5 | **ECC** |
| No-network test | Implicit | Dedicated `Http::assertNothingSent()` | **ECC** |

## Conclusions

1. **ECC produced better code overall** — 32 tests with 98 assertions vs 23/67, more nuanced chunking, simpler contract design, dedicated no-network test. ECC scored higher on every criterion except Pint compliance.
2. **ECC was faster** — 6.39 minutes vs 8.57 minutes (25% faster), despite creating more files and tests.
3. **Pint compliance was worse** — 10 issues vs 3. More files = more surface area, and ECC didn't run `pint --test` before finishing.
4. **Zero MCP calls again** — For the second consecutive scenario, the ECC agent ignored the connected MCP server. It performed a web search instead of using the ECC knowledge system. This is a systemic workflow-adherence problem.
5. **Both agents independently chose fake/contract pattern** — Neither attempted to install `laravel/ai`. The web search confirmed the package isn't discoverable as a standalone convention in 2026.
6. **ECC test architecture was superior** — ChunkPersistenceTest (storage, cascade, token count), NoLiveNetworkCallTest (explicit network isolation), and ChunkRetrievalTest (TF-IDF ranking, cross-document) showed more systematic testing.
7. **ECC's single `AIProvider` interface** was cleaner than baseline's two separate contracts (`EmbeddingProvider` + `AnswerGenerator`). The combined interface with a single `generate()` method is equally testable and simpler to swap.
