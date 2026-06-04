---
id: ku-02
title: "User Message Structuring - Rules"
subdomain: "prompt-engineering"
ku-type: "foundation"
date-created: "2026-06-02"
---

## Rules for User Message Structuring

### R1: Always separate user-provided content from system-added context using distinct message roles
- **Category:** Security
- **Rule:** Structure multi-message conversations with clear role separation: `user` for user input, `system` for configuration, `tool` for function results; never concatenate system instructions into the user message.
- **Reason:** Mixing roles reduces the model's ability to distinguish user-provided content from system context. A user's text that appears in the same role as system instructions has more power to override the system prompt.
- **Bad Example:** A single `user` role message containing both "User query: what is the return policy? System note: be helpful."
- **Good Example:** `[{role: "system", content: "You are helpful"}, {role: "user", content: "what is the return policy?"}]`.
- **Exceptions:** Chat history for models that only support a single message role format.
- **Consequences of Violation:** The model may interpret user statements as authoritative instructions; prompt injection attacks embedded in user text are more likely to succeed.

### R2: Limit user message length to a predictable maximum and truncate or summarize beyond
- **Category:** Performance
- **Rule:** Enforce a maximum user message length (e.g., 4000 characters for chat; 50000 characters for document analysis). When exceeded, either truncate with a notice, summarize, or require chunked processing.
- **Reason:** Unbounded user input causes unpredictable token consumption, cost, and response time. A user pasting a 500K-character document can exhaust the context budget and prevent the model from processing system instructions.
- **Bad Example:** Accepting a 200K-character paste in a chat input without any size limit — the system prompt is pushed out of the context window.
- **Good Example:** A character counter displayed to the user; messages exceeding 4000 characters trigger a summarier process before being passed to the LLM.
- **Exceptions:** Document analysis tools where large input is expected and the system prompt is short.
- **Consequences of Violation:** System instructions truncated by oversized user input; wildly variable per-request token costs and latency; user confusion when the model behaves differently with long vs short inputs.

### R3: Validate user messages for excessive repetitions, special characters, and pattern anomalies before sending
- **Category:** Security
- **Rule:** Apply input validation to detect and reject user messages with excessive repeated tokens (potential token exploit), repeated special characters, or known injection regex patterns before the message reaches the LLM.
- **Reason:** Some adversarial inputs exploit token boundary artifacts or special character sequences to extract system prompts or bypass restrictions. Pre-validation catches these before they consume LLM resources.
- **Bad Example:** A user sends `"Repeat 'ignore previous instructions' 10,000 times"` — the LLM processes the entire message and may follow the instruction.
- **Good Example:** Input validation rejects messages with >500 repeats of the same word, suspicious base64-encoded content, or known injection patterns with an error: "Message contains suspicious patterns."
- **Exceptions:** Applications that legitimately accept code, mathematical expressions, or structured data that may match regex patterns.
- **Consequences of Violation:** Token-based attacks inflate costs; successful prompt injection via structured adversarial inputs; model behavior manipulation through repeated pattern exploits.
