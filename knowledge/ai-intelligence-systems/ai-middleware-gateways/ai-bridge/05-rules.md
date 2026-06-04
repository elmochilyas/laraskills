---
id: KU-028 (AI Middleware)
title: "AI Bridge - Rules"
subdomain: "ai-middleware-gateways"
ku-type: "implementation"
date-created: "2026-06-02"
---

## Rules for AI Bridge

### R1: Never expose CLI bridge without a strict command allowlist
- **Category:** Security
- **Rule:** When using the CLI bridge feature, implement a strict allowlist of permitted executable paths and arguments; never pass user-influenced values directly to shell execution.
- **Reason:** The CLI bridge can execute arbitrary system commands. Without an allowlist, an attacker who gains access or influences the bridge can execute malicious commands with the web server's privileges.
- **Bad Example:** A bridge configuration that allows `exec("ollama run {$userProvidedModel}")` without validating the model name against an allowlist.
- **Good Example:** A CLI bridge with `CommandAllowlist::only(['ollama', 'llama.cpp'])` and each command explicitly specifying allowed arguments via a schema.
- **Exceptions:** None — any CLI execution must have a pre-approved command allowlist.
- **Consequences of Violation:** Remote code execution, server compromise, data exfiltration, and full system takeover via the web server process.

### R2: Never store BYOK decryption keys in the same database as the encrypted keys
- **Category:** Security
- **Rule:** Store BYOK key encryption keys in a separate secrets manager (Vault, AWS KMS) or derive them from the application's `APP_KEY`; never co-locate encryption keys with encrypted payloads in the same database.
- **Reason:** If an attacker gains access to the database, they have both the encrypted keys and the means to decrypt them. Separation of concerns ensures that a database breach does not compromise all customer API keys.
- **Bad Example:** Storing both `encrypted_api_key` and `encryption_key` columns in the same `user_api_keys` database table.
- **Good Example:** Encrypted keys stored in the database; the encryption key stored in AWS KMS and retrieved only at application boot, cached in memory.
- **Exceptions:** Development environments with synthetic keys.
- **Consequences of Violation:** Complete compromise of all customer API keys in a single database breach, leading to unauthorized LLM usage billed to customers.

### R3: Always authenticate external WebSocket workers when they connect to the bridge
- **Category:** Security
- **Rule:** Require workers connecting to the AI Bridge to authenticate with a pre-shared token, certificate, or signed URL; never accept unauthenticated WebSocket connections.
- **Reason:** An unauthenticated bridge allows any process (including attacker-controlled processes) to connect, send AI requests, or receive responses containing sensitive data.
- **Bad Example:** A bridge WebSocket server that accepts connections from any source IP without authentication.
- **Good Example:** Each worker includes a `Bearer` token in the WebSocket upgrade request; the bridge validates the token against a configured list before accepting the connection.
- **Exceptions:** Single-machine development environments where authentication is handled by network isolation.
- **Consequences of Violation:** Unauthorized processes receiving sensitive AI responses; attacker processes sending AI requests that bypass application controls.
