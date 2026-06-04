# Knowledge Unit: RAG Pipeline Architecture

## Metadata

- **ID:** K069
- **Subdomain:** RAG Search Pipelines
- **Source:** LangChain / LlamaIndex / General
- **Maturity:** New
- **Laravel Relevance:** Full pipeline design

## Executive Summary

RAG (Retrieval-Augmented Generation) pipeline architecture combines vector retrieval with LLM generation to answer queries based on indexed knowledge. The standard pipeline: 1) Index documents (chunk → embed → store), 2) Retrieve (embed query → ANN search → top-K documents), 3) Augment (format context + query into prompt), 4) Generate (LLM produces answer). In Laravel, this is typically built as a custom service integrating Scout/pgvector for retrieval and HTTP clients for LLM API calls.

## Core Concepts

- **Indexing Pipeline**: Document ingestion → chunking → embedding → vector store. Runs offline/batch.
- **Query Pipeline**: User query → embed query → ANN search → retrieve chunks → format prompt → LLM → answer.
- **Retrieval**: Hybrid search (keyword + vector) is preferred for production RAG.
- **Augmentation**: Retrieved documents are formatted into a prompt that instructs the LLM to answer from context.
- **Generation**: The LLM produces a natural language answer, optionally with source citations.
- **Re-ranking**: Optional cross-encoder step between retrieval and generation to improve context quality.

## Internal Mechanics

The indexing pipeline processes documents through a chunker, generates embeddings via an embedding model, and stores vectors in a vector DB (pgvector, Qdrant, Pinecone). The query pipeline embeds the user query, retrieves top-K chunks from the vector DB, optionally re-ranks them, constructs a prompt with the chunks as context, sends the prompt to an LLM, and returns the generated answer along with source references.

## Patterns

- **Naive RAG**: Simple retrieve → generate. No query transformation, no re-ranking.
- **Query Transformation**: Rewrite user query for better retrieval (HyDE, query expansion).
- **Multi-Hop RAG**: Break complex questions into sub-questions, answer each, synthesize final answer.
- **Agentic RAG**: LLM decides when to retrieve, which tools to use, and how to combine information.
- **Self-RAG**: LLM evaluates whether retrieved documents are relevant before generating.

## Architectural Decisions

RAG architecture must balance retrieval quality (recall), generation quality (grounding), latency, and cost. The embedding dimension, chunk size, top-K, and LLM model size are the primary levers.

## Tradeoffs

| Decision | Impact |
|---|---|
| Retrieve top-3 vs top-10 | More context → better answers, more tokens → higher latency/cost |
| With vs without re-ranker | Re-ranker improves context quality, adds 50-200ms latency |
| LLM size (7B vs 70B params) | Larger model → better answers, higher latency, higher cost |
| API vs local LLM | API: better quality, higher cost, privacy concerns. Local: lower quality, fixed cost, private |

## Performance Considerations

- Total RAG latency = embedding (50-200ms) + retrieval (10-100ms) + optional re-ranking (50-200ms) + generation (500-5000ms).
- Generation dominates latency. Streaming the LLM response reduces perceived latency.
- Hybrid retrieval increases recall but adds latency (two searches instead of one).
- Caching frequent query embeddings reduces retrieval pipeline latency.

## Production Considerations

- **Monitor retrieval quality**: If the LLM frequently says "no relevant context found," retrieval needs improvement.
- **Implement citation**: Always include source document references in generated answers.
- **Handle out-of-scope queries**: The LLM should say "I don't have information about that" rather than hallucinate.
- **Stream responses**: Use streaming for better UX with generation latency.
- **Test with adversarial queries**: Ensure the LLM doesn't leak its prompt or generate harmful content.
- **Set up fallback**: If the LLM is unavailable, return raw search results.

## Common Mistakes

- Not testing retrieval quality before adding generation — garbage in, garbage out.
- Using insufficient context — single retrieved chunk often lacks enough information.
- Overloading context — sending 20 chunks exceeds context window or dilutes relevant info.
- Not instructing the LLM to answer from context only — leads to hallucination.
- Ignoring prompt injection risks — user queries could attempt to manipulate the LLM.

## Failure Modes

- **Hallucination**: LLM ignores context and generates false information.
- **Context window overflow**: Retrieved chunks exceed the LLM's token limit.
- **Retrieval failure**: No relevant documents found — LLM has no grounding.
- **Latency SLO breach**: Generation latency exceeds acceptable thresholds.
- **Prompt injection**: Malicious user query manipulates LLM behavior.

## Ecosystem Usage

The standard architecture for AI-powered search in Laravel. Typically built custom using:
- pgvector/Qdrant for vector store
- OpenAI API for embeddings and generation
- Laravel HTTP client for API calls
- Custom service classes for pipeline orchestration

## Related Knowledge Units

- K067 (Embedding generation strategies)
- K068 (Chunking strategies for RAG)
- K029 (Meilisearch RAG)
- K062 (Cross-encoder re-ranking)
- K061 (RRF - Reciprocal Rank Fusion)

## Research Notes

Sources: LangChain docs, LlamaIndex docs, OpenAI RAG guide, industry best practices. RAG has rapidly become the standard approach for grounding LLM responses in private/custom data. The Laravel ecosystem lacks a first-party RAG package — most implementations are custom services using Scout/pgvector for retrieval and HTTP clients for LLM API calls. LangChain PHP (community) provides some RAG abstractions but is less mature than the Python original.


## Mental Models

- **Library Analogy**: Think of the RAG pipeline as a library. Documents are books, the embedding model creates the card catalog, vector search finds the right shelves, and the LLM is the librarian who reads the relevant books to answer your question.
- **Assembly Line**: Each stage of the pipeline (chunk → embed → store → retrieve → generate) is a station on an assembly line. Optimizing one station without considering the others creates bottlenecks.
- **Funnel Model**: The pipeline narrows from millions of documents to hundreds of chunks to tens of context windows to a single answer. Each stage must preserve the signal while discarding noise.

