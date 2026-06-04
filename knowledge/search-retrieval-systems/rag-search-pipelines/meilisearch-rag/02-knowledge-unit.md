# Knowledge Unit: Meilisearch RAG / Conversational Search

## Metadata

- **ID:** K029
- **Subdomain:** RAG Search Pipelines
- **Source:** Meilisearch Docs
- **Maturity:** New
- **Laravel Relevance:** LLM-grounded answers

## Executive Summary

Meilisearch RAG (Retrieval-Augmented Generation) enables conversational search by combining Meilisearch's hybrid search (keyword + vector) with an LLM for answer generation. When a user asks a question, Meilisearch retrieves relevant documents, and an LLM generates a grounded answer using those documents as context. This is available as a Meilisearch Cloud feature or can be built custom using the Meilisearch API.

## Core Concepts

- **Retrieval**: Meilisearch hybrid search finds relevant documents from the indexed corpus.
- **Augmentation**: Retrieved documents are formatted as context for the LLM prompt.
- **Generation**: An LLM (OpenAI, Anthropic, local) generates a natural language answer grounded in the retrieved context.
- **Grounded Answers**: The LLM is instructed to answer only from the provided context, reducing hallucination.
- **Source Attribution**: Answers can include references to source documents.

## Internal Mechanics

Meilisearch RAG pipeline: 1) User submits a natural language query. 2) Meilisearch performs hybrid search (keyword + vector) to retrieve top-K documents. 3) Retrieved document text is concatenated into a system prompt with instructions to answer from context only. 4) The prompt is sent to the configured LLM provider. 5) The LLM's response is returned alongside source citations.

## Patterns

- **Document Q&A**: Ask questions about indexed documentation, manuals, or knowledge bases.
- **Product Q&A**: Natural language queries about product catalogs.
- **Customer support FAQ**: Grounded answers from support documentation.
- **Enterprise knowledge search**: Natural language access to internal knowledge bases.

## Architectural Decisions

Meilisearch chose to integrate RAG as a cloud feature rather than an open-source plugin, positioning it as a premium capability. The retrieval step uses Meilisearch's existing hybrid search infrastructure, adding the LLM generation layer on top.

## Tradeoffs

- Cloud-only RAG feature: Requires Meilisearch Cloud subscription.
- LLM API costs: Each conversational query incurs embedding + generation API costs.
- Retrieval quality: RAG quality is bounded by the retrieval step's recall.

## Performance Considerations

- Total RAG latency = retrieval (50-200ms) + generation (500-3000ms depending on LLM and response length).
- Generation dominates latency — users expect 1-3 second response times for conversational AI.
- Embedding generation adds ~50-100ms per query (if not cached).

## Production Considerations

- **Configure LLM provider**: API key management for the generation model.
- **Monitor costs**: Each RAG query uses LLM tokens. Set budget alerts.
- **Tune retrieval parameters**: Ensure enough relevant context is retrieved for generation.
- **Implement streaming**: Stream the LLM response for better user experience (reduces perceived latency).
- **Test retrieval quality**: Poor retrieval produces poor answers — optimize hybrid search first.

## Common Mistakes

- Expecting RAG to fix poor retrieval — the answer is only as good as the retrieved context.
- Not including source citations — users need to verify AI-generated answers.
- Using insufficient context — small context windows limit answer quality.
- Not handling out-of-scope questions gracefully — the LLM should say "I don't know" instead of hallucinating.

## Failure Modes

- **LLM hallucination**: If the LLM ignores the "answer from context only" instruction.
- **Empty retrieval**: If no relevant documents are found, the answer will be ungrounded.
- **Context window overflow**: Retrieved documents exceed the LLM's context window.
- **LLM API outage**: RAG queries fail if the generation endpoint is unavailable.

## Ecosystem Usage

Adopted by Meilisearch Cloud customers who want AI-powered search without building a custom RAG pipeline. The feature is relatively new (2025-2026).

## Related Knowledge Units

- K028 (Meilisearch hybrid search)
- K067 (Embedding generation strategies)
- K068 (Chunking strategies for RAG)
- K069 (RAG pipeline architecture)

## Research Notes

Source: Meilisearch docs. Meilisearch RAG is the most accessible RAG implementation in the Scout ecosystem — it requires minimal custom code. However, it's cloud-only and incurs per-query LLM costs. The feature reflects the industry trend of embedding RAG into search platforms.


## Mental Models

- **Library Analogy**: Think of the RAG pipeline as a library. Documents are books, the embedding model creates the card catalog, vector search finds the right shelves, and the LLM is the librarian who reads the relevant books to answer your question.
- **Assembly Line**: Each stage of the pipeline (chunk → embed → store → retrieve → generate) is a station on an assembly line. Optimizing one station without considering the others creates bottlenecks.
- **Funnel Model**: The pipeline narrows from millions of documents to hundreds of chunks to tens of context windows to a single answer. Each stage must preserve the signal while discarding noise.

