# Skills

## Skill 1: Implement prompt versioning with version-controlled prompt files

### Purpose
Manage AI prompts as version-controlled, deployable artifacts stored in separate YAML/JSON files outside application code, with prompt migration support, environment-specific version pinning, and cryptographic hash verification for drift detection.

### When To Use
- Use when you need to track prompt changes across team members
- Use when you want to deploy prompt updates independently of code releases
- Use when you need to roll back problematic prompts without code revert
- Use when A/B testing prompt variations in production
- Use when you need audit trails for who changed what prompt and when

### When NOT To Use
- Do NOT use for trivial one-line prompts used only in tests
- Do NOT use when the prompt is a single, stable sentence unlikely to change
- Do NOT use when a full prompt versioning infrastructure adds more overhead than benefit

### Prerequisites
- `dewaldhugo/laravel-ai-governor` (or equivalent prompt management package)
- Prompts stored in a version-controlled directory (e.g., `prompts/`)
- Code review process for prompt changes
- Observability pipeline for prompt version logging
- Team agreement on prompt modification workflow

### Inputs
- Current production prompt text
- New prompt version text
- Prompt metadata (id, version, hash, author, date, changelog)
- Environment target (staging, production)
- Test results for the new prompt version

### Workflow
1. Create a `prompts/` directory in your project root to store prompt files
2. Define each prompt as a versioned YAML/JSON file with metadata:
   ```yaml
   # prompts/customer-support/v3.yaml
   id: customer-support
   version: 3
   hash: sha256:a3f2c9e...
   author: "developer@example.com"
   date: "2026-06-01"
   prompt: |
     You are a customer support agent...
   ```
3. Never define prompts as PHP strings in controllers or services
4. Implement a `PromptRepository` that loads prompts by version tag at runtime:
   ```php
   $prompt = PromptRepository::load('customer-support', 'v3');
   ```
5. Configure environment-specific version pinning: staging uses v2, production uses v1
6. Use prompt migrations for structured, timestamped changes (like DB migrations)
7. Record the prompt version hash in every LLM request log:
   ```json
   { "prompt_version": "a3f2c9e", "response": "...", "latency": 1200, "tokens": 150 }
   ```
8. Implement rollback by updating the registry to point to previous version
9. Add CI checks that fail if prompt content hash doesn't match metadata hash

### Validation Checklist
- [ ] Prompts are stored in version-controlled files, not hardcoded in PHP code
- [ ] Each prompt file has metadata: id, version, hash, author, date
- [ ] Prompt version is logged with every LLM request for correlation
- [ ] Environment-specific version pinning works correctly
- [ ] Prompt migration system supports creation, upgrade, and rollback
- [ ] Version hash verification catches drift between deployed and expected prompt
- [ ] Rollback restores previous prompt version without code revert
- [ ] CI validates prompt hash matches metadata
- [ ] Prompt changes go through code review

### Common Failures
- **Hardcoded prompts**: Strings embedded in Agent classes — cannot version-track or roll back independently
- **No version logging**: Cannot correlate responses to prompt versions — quality regressions undebuggable
- **Environment misalignment**: Staging and production using different prompt versions unknowingly
- **Hash drift**: Deployed prompt content differs from metadata hash — CI should catch this
- **Missing rollback plan**: Registry points to v2, need rollback to v1 — but v1 files were deleted

### Decision Points
- **Prompt file format**: YAML (human-readable with metadata) vs. Markdown (direct editing in editors)
- **Storage location**: Git-tracked `prompts/` directory vs. database (database enables runtime editing)
- **Migration strategy**: Timestamped migrations (like Laravel DB migrations) vs. simple file replacement
- **Version granularity**: Per-agent versioning vs. global prompt version — per-agent is more flexible

### Performance Considerations
- Prompt loading from files is cached in memory after first load
- Version hash computation adds no per-request overhead (computed at deploy time)
- Registry lookups are sub-millisecond with cached resolution
- Prompt files should be <10KB each to avoid slow file I/O

### Security Considerations
- Prompt files may contain business logic — restrict repository access appropriately
- Never include API keys or secrets in prompt files — use environment variables for any sensitive values
- Version logging includes metadata only, not full prompt text
- Prompt review process should include security review for injection vulnerabilities

### Related Rules
- R1: Store prompts in version-controlled files (YAML/JSON) separate from application code, never hardcoded
- R2: Always include a version hash in logged metadata to correlate responses with the exact prompt version used

### Related Skills
- Design system prompts with persona and guardrails
- Implement A/B testing for prompt variants
- Design structured output schemas for agent responses
- Design few-shot examples and chain-of-thought prompts

### Success Criteria
- All prompts are version-controlled files with full change history
- Prompt version is logged for every LLM request for traceability
- Rollback of any prompt version takes <5 minutes without code deploy
- Environment pinning ensures staging tests new prompts before production
- Hash verification prevents deployment of corrupted prompts
- Prompt changes have audit trail (who, what, when, why)
