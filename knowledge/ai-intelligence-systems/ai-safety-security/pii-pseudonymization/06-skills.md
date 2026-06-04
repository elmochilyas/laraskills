# Skills

## Skill 1: Implement PII pseudonymization with persistent token mapping for AI prompts

### Purpose
Replace PII in prompts with reversible tokens before sending to LLM providers, using established NLP libraries for detection and persistent storage for multi-session token mapping, enabling GDPR-compliant AI interactions with third-party providers.

### When To Use
- Use when sending user data to third-party LLM providers (OpenAI, Anthropic, etc.)
- Use when GDPR, HIPAA, or other privacy regulations apply to AI processing
- Use when you need to prevent PII from leaving your application boundaries
- Use when multi-session conversations need consistent PII token mapping
- Use when using PII detection in agent middleware for pre-send prompt transformation

### When NOT To Use
- Do NOT use when running local models (Ollama) — data never leaves your machine
- Do NOT use when using anonymization (irreversible removal) — use for pseudonymization only
- Do NOT use without a well-maintained PII detection library — custom regex is error-prone
- Do NOT use when multi-session PII consistency is not needed — in-memory mapping is simpler

### Prerequisites
- PII detection library (Microsoft Presidio, spacy-transformers, or regex-based)
- Pseudonymization service in the agent middleware pipeline
- Token mapping storage (encrypted Redis or database)
- Understanding of PII categories relevant to the application
- Re-insertion mechanism for LLM responses

### Inputs
- User prompt text containing PII
- PII detection configuration (entity types to detect and replace)
- Session or conversation identifier for token consistency
- Token mapping store (for persistent multi-session mapping)

### Workflow
1. Integrate an established PII detection library (e.g., `microsoft/presidio-analyzer`)
2. Configure the analyzer for relevant PII types: EMAIL, PHONE, CREDIT_CARD, US_SSN, NAME, ADDRESS, IP, DOB
3. Implement pseudonymization middleware in the agent pipeline (pre-send):
   - Scan prompt for PII entities
   - Replace each entity with a reversible token: `[PII_NAME_1]`, `[PII_EMAIL_1]`
   - Store the `token -> original_value` mapping in persistent storage
4. Use persistent (session-scoped) token mapping for multi-session conversations:
   - Encrypted Redis store: `{ session_id, original_value, token }`
   - Same TTL as conversation history
5. Implement re-insertion middleware (post-receive):
   - Scan LLM response for pseudonymized tokens
   - Replace tokens with original PII values for the authenticated user
6. Add context-limited replacement: only pseudonymize PII that the agent actually needs
7. Configure encryption for the token mapping store

### Validation Checklist
- [ ] PII detection covers all relevant entity types (name, email, phone, address, SSN, credit card, IP, DOB)
- [ ] Established NLP library is used (not custom regex)
- [ ] Token mapping is stored in persistent, encrypted storage
- [ ] Multi-session mapping preserves token consistency across sessions
- [ ] Re-insertion correctly restores original PII in responses
- [ ] Only necessary PII is pseudonymized (context-limited)
- [ ] Token mapping store has appropriate TTL matching conversation history
- [ ] Edge cases: partial PII, non-standard formats, mixed-language PII
- [ ] Re-insertion fails gracefully (returns token if mapping not found)

### Common Failures
- **Custom regex detection**: Misses non-standard formats (international phone numbers) — use maintained library
- **In-memory mapping**: Token mapping lost between requests — multi-session conversations break
- **Over-pseudonymization**: Replaces PII the agent needs for context — use context-limited replacement
- **Re-insertion missing**: Tokens left in response — user sees `[NAME_1]` instead of their name
- **Token collision**: Same token maps to different values across sessions — use session-scoped mapping

### Decision Points
- **PII detection library**: Microsoft Presidio (comprehensive, multi-language) vs. spacy (lighter, faster)
- **Pseudonymization vs. anonymization**: Pseudonymization (reversible) for personalized responses, anonymization (irreversible) for analytics
- **Persistence scope**: Session-scoped (conversation-length) vs. user-scoped (permanent) — privacy vs. convenience
- **Context limitation scope**: Only PII needed for the agent's task vs. all detected PII

### Performance Considerations
- PII detection adds 5-500ms depending on library (Presidio is heavier than regex-only)
- Persistent token mapping lookups add <5ms (Redis)
- Encryption/decryption of mapping store adds <1ms
- Post-receive re-insertion is fast (<1ms) — token replacement is a string operation
- Cache PII detection results for identical inputs

### Security Considerations
- PII detection library must run locally — never send data to an external PII detection API
- Token mapping store must be encrypted at rest and in transit
- Access to token mappings must be restricted to the re-insertion service
- Logs must not contain original PII values (log tokens only)
- Token mapping store TTL should match or be shorter than conversation retention period
- Re-insertion must verify the requesting user is the PII owner

### Related Rules
- R1: Never implement in-house PII detection when a well-maintained NLP library is available
- R2: Always map pseudonymized tokens in persistent storage for multi-session conversations

### Related Skills
- Build an agent middleware pipeline for AI security concerns
- Implement prompt injection defense with semantic firewalls
- Implement multi-stage output guarding with programmatic post-processing
- Configure OWASP LLM Top 10 compliance for AI applications

### Success Criteria
- PII detection catches 95%+ of all PII instances across supported entity types
- Token mapping persists across sessions with consistent token-to-value mapping
- Re-insertion restores 100% of original PII for the authenticated user
- No PII reaches the LLM provider in production
- Pseudonymization adds <100ms overhead to request pipeline
- Multi-session conversations maintain consistent PII reference
