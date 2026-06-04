# Skill: Manage Conversation Memory for Multi-Turn Agents

## Purpose
Provide persistent, session-scoped conversation history for multi-turn agent interactions using the `RemembersConversations` trait with proper scoping, pruning, and context management.

## When To Use
- Multi-turn chat agents that need to remember previous context
- Support assistants that reference earlier conversation history
- Any agent interaction spanning more than one request

## When NOT To Use
- One-turn, stateless interactions (classification, translation)
- Ephemeral agents that don't need to persist history

## Prerequisites
- Agent class with `RemembersConversations` trait applied
- `agent_conversations` and `agent_conversation_messages` tables migrated
- Conversation ID strategy for session scoping

## Inputs
- Authenticated user ID for conversation scoping
- Conversation ID for session continuity
- Context management strategy (sliding window, summarization)

## Workflow
1. Apply `RemembersConversations` trait to multi-turn agent classes
2. Generate a single conversation ID per session, pass consistently on every turn
3. Associate conversations with the authenticated user and validate ownership
4. Pass conversation ID via `->withConversationId($id)` on each request
5. Implement a scheduled job to prune conversations older than 30-90 days
6. Add database indexes on `conversation_id` and `created_at` columns
7. Implement manual context management for conversations exceeding 50 turns
8. Use summarization or sliding window instead of relying on automatic oldest-message dropping

## Validation Checklist
- [ ] `RemembersConversations` trait applied to multi-turn agents
- [ ] Conversation IDs scoped to authenticated user (ownership validated)
- [ ] Same conversation ID passed on every turn of a session
- [ ] Pruning job configured for conversations older than 30-90 days
- [ ] Indexes on `conversation_id` and `created_at` columns
- [ ] Context budget managed for conversations >50 turns (summarize or truncate)
- [ ] Stateless agents omit the `RemembersConversations` trait

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| Agent appears amnesiac | New conversation ID per turn | Pass consistent ID across requests |
| Data leakage between users | No user scoping | Associate conversations with authenticated user |
| Table bloat slows queries | No pruning | Implement scheduled pruning (30-90 days) |
| Slow message loading | No indexes | Index `conversation_id` + `created_at` |
| Critical early context lost | Relies on automatic dropping | Implement summarization for long conversations |
| Custom memory implementation | No built-in trait | Use `RemembersConversations` trait |

## Decision Points
- **Retention period:** 30 days vs 90 days vs 1 year (compliance-dependent)
- **Pruning strategy:** Hard delete vs archive to cold storage
- **Context management:** Sliding window (last N messages) vs summarization vs hybrid
- **User scoping:** Authenticated user vs session-only vs no scoping (public chat)

## Performance/Security Considerations
- Always scope conversations to authenticated users; validate ownership on every request
- Implement conversation pruning to prevent table bloat and slow queries
- Use database indexes on `conversation_id` and `created_at` for query performance
- Long conversations (50+ turns) require explicit context management
- Conversation history may contain sensitive data; ensure table access is restricted

## Related Rules
- conversation-memory/05-rules.md (all rules)

## Related Skills
- Build Agents with the Laravel AI SDK
- Implement Tool Calling with Agents
- Manage Provider Configuration and Environment

## Success Criteria
- Agent remembers context across turns within the same conversation
- Conversations are properly scoped to authenticated users
- Old conversations are pruned automatically (30-90 day retention)
- Long conversations (>50 turns) use summarization for context management
- Database queries are performant with proper indexes
