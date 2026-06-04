---
id: KU-047 (Future)
title: "Future Trends - Rules"
subdomain: "future-trends"
ku-type: "strategic"
date-created: "2026-06-02"
---

## Rules for Future Trends

### R1: Design current architecture to support multi-modal inputs even if only text is used today
- **Category:** Strategy
- **Rule:** Architect the provider abstraction layer to accept multi-modal content (text, image, audio, video) from the start, even if the current implementation only handles text; never design a text-only architecture that requires breaking changes for multi-modal support.
- **Reason:** Multi-modal support is becoming standard across all major LLM providers. A text-only abstraction that uses `string $text` parameters for prompt input will require a breaking change to support image inputs. Plans for backward-compatible extensibility avoid rework.
- **Bad Example:** `interface AiProvider { public function chat(string $message): string; }` — adding image support requires a new method signature, breaking all implementations.
- **Good Example:** `interface AiProvider { public function chat(array $messages): Response; }` where `$messages` supports `TextPart`, `ImagePart`, `AudioPart` from the start.
- **Exceptions:** Short-lived projects with <6 month lifespan.
- **Consequences of Violation:** Adding multi-modal support later requires breaking changes to all provider implementations and all consumers; migrating to a multi-modal architecture costs significant development time.

### R2: Implement cost-aware routing that tracks token prices per model and adjusts routing dynamically
- **Category:** Cost Management
- **Rule:** Build the routing layer to use token prices from the provider's pricing API (or a maintained price table) when making routing decisions; never use static price assumptions in routing logic.
- **Reason:** Provider prices change frequently (price cuts, new model tiers, promotional pricing). Static price assumptions become outdated within months, and the routing layer makes suboptimal cost decisions based on stale data.
- **Bad Example:** A routing table with hardcoded prices from January 2025 — after a June 2025 price drop on gpt-4o-mini, the router still sends traffic to more expensive models.
- **Good Example:** A weekly cron that fetches current pricing from `https://api.openai.com/v1/models/pricing` and updates the routing cost table automatically.
- **Exceptions:** Fixed-price enterprise agreements with locked pricing.
- **Consequences of Violation:** Cost routing decisions are based on outdated prices; the application pays more than necessary while cheaper model alternatives go unused.

### R3: Prepare for agent-to-agent communication protocols by implementing standard message envelope formats
- **Category:** Strategy
- **Rule:** Structure agent messages with a standard envelope (`{ from, to, type, id, timestamp, payload, trace_id }`) compatible with emerging agent communication protocols (A2A, ANP); never use proprietary agent message formats.
- **Reason:** Multi-agent systems are emerging as a key architecture pattern. Proprietary message formats will require migration when agents need to communicate with external agents (other teams, partner companies). A standard envelope from the start avoids locked-in designs.
- **Bad Example:** An agent message format: `{ "text": "hello", "sender": "agent1" }` — incompatible with any standard protocol and missing essential fields (trace_id, timestamp, message type).
- **Good Example:** `{ "from": "agent1", "to": "agent2", "type": "request", "id": "msg_abc123", "timestamp": "2026-06-02T10:00:00Z", "payload": { "content": "hello" }, "trace_id": "trace_xyz789" }` — compatible with emerging standards and extensible.
- **Exceptions:** Single-agent applications with no inter-agent communication need.
- **Consequences of Violation:** When agent-to-agent communication becomes necessary, all existing message formats must be rewritten or adapted with transformers; interoperability with external agents is blocked.
