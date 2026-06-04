# Skills

## Skill 1: Implement a WebSocket-based AI bridge for BYOK and external process communication

### Purpose
Create a WebSocket bridge using `tetrixdev/laravel-ai-bridge` to enable bidirectional communication between Laravel and external AI processes (Python, Node.js), supporting Bring Your Own Key (BYOK) architectures, CLI-based AI tool integration, and real-time streaming without HTTP polling.

### When To Use
- Use when you need to integrate external AI processes running in Python, Node.js, or Go with Laravel
- Use when implementing Bring Your Own Key (BYOK) — customers bring their own AI API keys
- Use when you need real-time bidirectional communication with AI services beyond HTTP request-response
- Use when executing AI-related CLI commands (Ollama, llama.cpp) with streaming output from Laravel

### When NOT To Use
- Do NOT use when standard HTTP-based AI SDK integration suffices
- Do NOT use without a strict command allowlist for CLI bridge features
- Do NOT use when BYOK is not required — simpler HTTP integration is preferable
- Do NOT use when encryption key management for BYOK is not set up

### Prerequisites
- Laravel application with WebSocket support (Laravel Reverb or Pusher)
- `tetrixdev/laravel-ai-bridge` package installed
- External AI process that can communicate over WebSockets or CLI
- For BYOK: secrets management solution (Vault, AWS KMS)
- Process management capabilities (supervisor or Docker)

### Inputs
- AI request payload (prompt, parameters, model selection)
- WebSocket connection configuration
- Command allowlist configuration (for CLI bridge)
- BYOK customer API key (encrypted)

### Workflow
1. Install and configure `tetrixdev/laravel-ai-bridge` package
2. Set up WebSocket server endpoint for bridging AI requests
3. Configure the external AI process to connect to the bridge endpoint
4. Implement message protocol (JSON-based) for AI requests/responses
5. For BYOK:
   - Accept customer API keys via secure UI
   - Encrypt keys using KMS or APP_KEY-derived encryption
   - Store encrypted keys in database, encryption key in Vault/KMS
   - Send keys through the bridge (never touch Laravel application directly)
6. For CLI bridge:
   - Define a strict allowlist of permitted commands and arguments
   - Use `CommandAllowlist::only(['ollama', 'llama.cpp'])` with arg schemas
   - Implement process lifecycle management (spawn, monitor, timeout, kill)
   - Stream CLI output back through WebSocket
7. Implement error propagation and reconnection logic
8. Set up process manager for external AI process lifecycle

### Validation Checklist
- [ ] WebSocket bridge connects and passes messages bidirectionally
- [ ] BYOK keys are encrypted at rest and decrypted only in secure memory
- [ ] Encryption keys are stored separately from encrypted data (KMS/Vault)
- [ ] CLI bridge has strict command allowlist with argument schemas
- [ ] Process manager handles spawn, timeout, and kill correctly
- [ ] Streaming output from CLI is delivered in real-time
- [ ] Reconnection logic works on connection drops
- [ ] Error messages are propagated correctly to Laravel application
- [ ] No sensitive data leaks in logs or error messages

### Common Failures
- **Command injection**: User-influenced values reach shell execution — always use allowlist with arg schemas
- **BYOK key co-location**: Encryption keys stored in same database as encrypted keys — separate storage required
- **Process leak**: CLI processes not killed on timeout — use process manager with guaranteed cleanup
- **Connection drop**: WebSocket disconnects mid-stream — implement auto-reconnect with state recovery
- **Memory leak**: Long-running bridge processes accumulate memory — implement process restart scheduling

### Decision Points
- **BYOK vs. platform keys**: BYOK (complex security) vs. platform-managed keys (simpler) — choose based on customer requirements
- **WebSocket vs. CLI bridge**: WebSocket for persistent AI processes (Python servers), CLI for one-shot local models
- **Process restart strategy**: Time-based (restart every N hours) vs. memory-based (restart above threshold)

### Performance Considerations
- WebSocket bridge eliminates HTTP polling overhead for real-time communication
- CLI bridge spawn overhead is significant (seconds) — batch requests when possible
- Persistent WebSocket connections scale to thousands per server
- BYOK decryption adds ~5ms per request — cache decrypted keys in memory per session

### Security Considerations
- CLI bridge must have a strict command allowlist — RCE is the #1 risk
- BYOK encryption keys must be in separate storage from encrypted keys
- WebSocket connections must authenticate before accepting AI requests
- All data passing through the bridge should be treated as untrusted
- Implement rate limiting on bridge endpoints
- Log all bridge operations for audit trail

### Related Rules
- R1: Never expose CLI bridge without a strict command allowlist
- R2: Never store BYOK decryption keys in the same database as the encrypted keys

### Related Skills
- Configure agent middleware pipeline for AI concerns
- Implement prompt injection defense with semantic firewalls
- Configure PII pseudonymization for AI prompts and responses
- Set up OpenTelemetry tracing for AI request lifecycle

### Success Criteria
- WebSocket bridge enables bidirectional AI communication with <50ms latency
- BYOK implementation passes security review (keys encrypted, separate storage)
- CLI bridge executes only allowed commands with validated arguments
- Process management handles lifecycle reliably (no orphaned processes)
- Bridge can recover from connection drops without data loss
- Full audit trail exists for all bridge operations
