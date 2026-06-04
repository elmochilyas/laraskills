# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** laravel-ai-sdk
**Knowledge Unit:** conversation-memory
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Chat history array
- [ ] Context budget
- [ ] Conversation ID from route
- [ ] Session for AI
- [ ] Temporary conversations
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Always Scope Conversations to Authenticated Users
- [ ] Implement Context Budget Management
- [ ] Implement Conversation Pruning
- [ ] Index agent_conversation_messages Table
- [ ] Pass Consistent Conversation ID Across Requests
- [ ] `RemembersConversations` trait applied to multi-turn agents
- [ ] Context budget managed for conversations >50 turns (summarize or truncate)
- [ ] Conversation IDs scoped to authenticated user (ownership validated)
- [ ] Add database indexes on `conversation_id` and `created_at` columns
- [ ] Apply `RemembersConversations` trait to multi-turn agent classes
- [ ] Associate conversations with the authenticated user and validate ownership
- [ ] Agent remembers context across turns within the same conversation

---

# Architecture Checklist

- [ ] Automatic context management vs. manual â†’ SDK handles context window limits by dropping oldest messages. Reason: Simplifies agent development; advanced users can implement custom context strategies
- [ ] Database storage vs. cache â†’ Database (with migration). Reason: Durable, queryable, scalable, supports per
- [ ] Separate tables vs. JSON column â†’ Dedicated tables with proper relational schema. Reason: Enables querying, filtering, prunability, and future migration to vector storage for conversational RAG
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom

---

# Implementation Checklist

- [ ] Chat history array
- [ ] Context budget
- [ ] Conversation ID from route
- [ ] Session for AI
- [ ] Temporary conversations
- [ ] User-scoped conversations
- [ ] Add database indexes on `conversation_id` and `created_at` columns
- [ ] Apply `RemembersConversations` trait to multi-turn agent classes
- [ ] Associate conversations with the authenticated user and validate ownership
- [ ] Generate a single conversation ID per session, pass consistently on every turn
- [ ] Implement a scheduled job to prune conversations older than 30-90 days
- [ ] Implement manual context management for conversations exceeding 50 turns

---

# Performance Checklist

- [ ] For high-traffic agents, consider Redis for ephemeral memory with DB archiving for persistence
- [ ] Index `conversation_id` and `created_at` columns for efficient queries
- [ ] Loading full conversation history on every request â€” for long conversations, consider summarization or sliding window
- [ ] Messages table grows with conversation length â€” implement TTL or archival after 30/90 days
- [ ] Use database indexes on `conversation_id` and `created_at` for query performance

---

# Security Checklist

- [ ] Associate conversations with authenticated users for retrieval and privacy compliance
- [ ] Consider summarization for very long conversations â€” periodically compress old turns into a summary message
- [ ] Export conversation data for model improvement / compliance if needed
- [ ] Implement conversation pruning: scheduled job deleting conversations older than N days
- [ ] Monitor `agent_conversation_messages` table size â€” grows proportionally to usage
- [ ] Run `php artisan migrate` to create memory tables before using `RemembersConversations`
- [ ] Always scope conversations to authenticated users; validate ownership on every request

---

# Reliability Checklist

- [ ] Associating all conversations with a generic ID â€” mixes user contexts, leaks data
- [ ] Never pruning old conversations â€” table grows indefinitely, slowing queries
- [ ] Not including the `RemembersConversations` trait but expecting multi-turn memory
- [ ] Not passing the same conversation ID on subsequent requests â€” creates new conversations instead of resuming
- [ ] Relying on automatic context management for very long conversations â€” old critical context may be silently dropped
- [ ] Agent appears amnesiac
- [ ] Critical early context lost
- [ ] Custom memory implementation
- [ ] Data leakage between users
- [ ] Slow message loading

---

# Testing Checklist

- [ ] `RemembersConversations` trait applied to multi-turn agents
- [ ] Agent remembers context across turns within the same conversation
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Context budget managed for conversations >50 turns (summarize or truncate)
- [ ] Conversation IDs scoped to authenticated user (ownership validated)
- [ ] Conversations are properly scoped to authenticated users
- [ ] Core concepts are understood and applied correctly.
- [ ] Database queries are performant with proper indexes
- [ ] Indexes on `conversation_id` and `created_at` columns

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Using Agent Without RemembersConversations Trait Expecting Multi-Turn Persistence]
- [ ] [No Conversation Pruning â€” Unbounded History Growth]
- [ ] [Storing Full Conversation History in a Single JSON Column]
- [ ] [Not Scoping Conversations by User/Session]
- [ ] [Relying on Conversation Memory for Large Context Beyond Model Limits]
- [ ] Context window overflow
- [ ] Conversation corruption
- [ ] Cross-user data leakage
- [ ] Message table bloat

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


