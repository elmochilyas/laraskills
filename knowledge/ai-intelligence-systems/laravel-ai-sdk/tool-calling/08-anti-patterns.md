# ECC Anti-Patterns — Tool Calling

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Laravel AI SDK |
| **Knowledge Unit** | Tool Calling |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Passing User ID as Tool Argument (Prompt Injection Vector)
2. Returning Entire Eloquent Model as Tool Output
3. No Result Set Size Limiting — Context Window Overflow
4. Overlapping Tool Descriptions — LLM Hallucinates Wrong Tool
5. No MaxSteps Limit — Runaway Tool Chain

---

## Repository-Wide Anti-Patterns

- Tool timeout — handle() without timeout for HTTP or DB calls blocks agent loop
- Schema mismatch — LLM generates invalid arguments, not validated before execution

---

## Anti-Pattern 1: Passing User ID as Tool Argument (Prompt Injection Vector)

### Category
Security

### Description
Accepting `$userId` as a parameter from the LLM's argument JSON instead of injecting it via the tool constructor — the LLM can be manipulated to pass any user ID.

### Why It Happens
Developers design tools as generic data-access methods without considering that the LLM controls the argument values.

### Warning Signs
- Tool `handle(int $userId)` that accepts user ID from LLM
- No authorization check inside tool
- User A can query User B's data through the tool

### Why It Is Harmful
The LLM generates tool arguments based on the conversation context. A prompt injection attack can trick the LLM into passing `userId: 99999` as a tool argument, gaining access to another user's data. Since the application framework authenticates the user at the HTTP layer, the tool has no visibility into who the authenticated user is — it trusts the LLM-provided argument. This is the highest-risk security vector in the AI SDK.

### Preferred Alternative
Inject authenticated user identity via the tool constructor. Never accept user identifiers as LLM-provided arguments.

### Detection Checklist
- [ ] User ID as tool argument parameter
- [ ] No authorization check in handle()
- [ ] Cross-user data access possible

### Related Rules
Inject User Context via Constructor, Never via Prompt (05-rules.md)

---

## Anti-Pattern 2: Returning Entire Eloquent Model as Tool Output

### Category
Security

### Description
Tool returns `User::find($id)->toArray()` — serializes all attributes including password hashes, API keys, internal notes.

### Preferred Alternative
Explicitly select only needed columns: `User::select('id', 'name', 'email')->find($id)`.

### Detection Checklist
- [ ] `->toArray()` on Eloquent model in tool output
- [ ] Sensitive attributes in tool response
- [ ] Serialized model visible to LLM

---

## Anti-Pattern 3: No Result Set Size Limiting

### Category
Performance

### Description
Tool returns all matching records without `limit()` — massive output blows context window and token budget.

### Preferred Alternative
Always apply `limit()` to tool queries. Cap at 10–20 results max.

### Detection Checklist
- [ ] No `limit()` on tool queries
- [ ] Large result sets in conversation context
- [ ] Token costs spike per agent step

---

## Anti-Pattern 4: Overlapping Tool Descriptions

### Category
Reliability

### Description
Two tools with similar descriptions (e.g., "search orders" and "lookup orders") — LLM cannot choose correctly.

### Preferred Alternative
Write precise, mutually exclusive tool descriptions. Each tool should have a unique, clearly scoped purpose.

### Detection Checklist
- [ ] Tool description overlap
- [ ] LLM calls wrong tool
- [ ] Hallucinated tool names

---

## Anti-Pattern 5: No MaxSteps Limit

### Category
Reliability

### Description
Agent with tools but no step limit — LLM can chain tool calls indefinitely without producing final answer.

### Preferred Alternative
Set `#[MaxSteps]` on every agent with tools. Default 10, adjust per use case.

### Detection Checklist
- [ ] No `#[MaxSteps]` attribute
- [ ] Runaway tool chains
- [ ] Unbounded token consumption
