# Skills

## Skill 1: Configure Psalm taint analysis for LLM injection detection

### Purpose
Configure Psalm static analysis to track tainted data from external sources through AI SDK entry points to security-sensitive sinks, detecting code paths where unsanitized user input or LLM output flows into SQL queries, shell execution, or HTTP responses.

### When To Use
- Use when you want static analysis to catch injection paths at build time
- Use when LLM output is used in database queries, file operations, or system commands
- Use when user input reaches LLM calls without sanitization
- Use when enforcing security policies across a team with static analysis gates in CI
- Use when preventing stored injection attacks (poisoned database data reaching LLM)

### When NOT To Use
- Do NOT use for projects not using Psalm/PHPStan static analysis
- Do NOT use when custom taint sinks and sources are not configured
- Do NOT use when only `$_GET`/`$_POST` are considered — database reads are also taint sources
- Do NOT use without understanding that static analysis complements but does not replace runtime guards

### Prerequisites
- Psalm or PHPStan installed and configured for the project
- PHP 8.1+ support for attributes (if using attribute-based taint annotations)
- Psalm plugin for Laravel (psalm/psalm-plugin-laravel)
- Knowledge of application's AI SDK entry points
- List of security-sensitive sinks in the application

### Inputs
- Psalm configuration file (psalm.xml)
- Application codebase
- AI SDK method signatures (to mark as taint sinks)
- Data source methods (to mark as taint sources)
- Banned methods/operations (sinks)

### Workflow
1. Identify all methods that send data to LLM providers (e.g., `Ai::chat()`, `Ai::complete()`, `Ollama::generate()`, custom `Agent::run()`)
2. Configure custom taint sinks in Psalm configuration:
   ```xml
   <taintSink name="ai-sink" type="TaintedInput"/>
   ```
   Add `#[TaintedSink('ai-sink')]` attribute on Agent's execute method
3. Identify all methods that load external data (database queries, file reads, HTTP API calls)
4. Add taint source annotations:
   ```php
   #[TaintSource('database')]
   public function getProduct(int $id): array
   ```
5. Mark LLM response types as tainted sources (output from LLM is untrusted):
   ```php
   /** @psalm-taint-source input */
   public function chat(array $messages): Response
   ```
6. Configure security-sensitive sinks to detect LLM-to-database/SQL/shell flows:
   - Database query methods, shell execution, file writes, HTTP responses
7. Set up Psalm in CI with taint analysis enabled: `psalm --taint-analysis`
8. Review and fix all taint warnings — treat tainted-to-sink flows as security bugs
9. Update taint configuration when new AI endpoints or data sources are added

### Validation Checklist
- [ ] All AI SDK entry points are configured as taint sinks
- [ ] Database read methods are annotated as taint sources
- [ ] File read methods are annotated as taint sources
- [ ] LLM response types are annotated as taint sources
- [ ] Security-sensitive sinks (SQL, shell, filesystem) are configured
- [ ] Psalm taint analysis runs in CI and fails on new warnings
- [ ] All existing taint warnings are triaged and either fixed or documented
- [ ] Configuration is updated when new AI methods are added
- [ ] False positives are suppressed only with justification

### Common Failures
- **Default sinks only**: Psalm's default configuration doesn't know about AI methods — custom sinks required
- **$_GET-only sources**: Only user input is marked as tainted — database reads and file reads ignored
- **No response taint**: LLM output is trusted by default — must mark as tainted
- **CI not enforced**: Taint warnings exist but don't fail CI — they're ignored
- **False positive suppression**: Too many suppressed warnings hide real issues — justify each suppression

### Decision Points
- **Psalm vs. PHPStan**: Psalm has built-in taint analysis; PHPStan requires custom plugins
- **Attribute vs. XML configuration**: Attributes are code-adjacent (more discoverable), XML is centralized
- **Taint severity**: Error (block CI) vs. warning (documented risk) — error for SQL/shell sinks
- **Suppression policy**: Never suppress without explicit justification and review

### Performance Considerations
- Taint analysis adds 30-120 seconds to CI pipeline depending on codebase size
- Incremental analysis can reduce runtime for small changes
- Cache Psalm results between runs when possible
- Taint analysis is a build-time check, not a runtime concern

### Security Considerations
- Taint analysis is a static check — it cannot catch runtime dynamic flows
- Stored injection (database data reaching LLM) is a critical taint path that static analysis can catch
- False negatives exist — taint analysis does not replace runtime input validation
- Regular review of taint configuration is needed as code evolves
- Treat every taint warning as a potential security vulnerability until proven otherwise

### Related Rules
- R1: Configure custom taint sinks for all AI SDK entry points in your Psalm/PHPStan configuration
- R2: Add taint source annotations to all methods that load external data (database, files, APIs)

### Related Skills
- Implement prompt injection defense with semantic firewalls
- Implement tool argument validation with strict schemas
- Configure OWASP LLM Top 10 compliance for AI applications
- Implement multi-stage output guarding with programmatic post-processing

### Success Criteria
- All AI SDK entry points are registered as taint sinks in Psalm configuration
- All data source methods (database reads, file reads, API calls) are annotated with taint sources
- LLM response objects are recognized as tainted
- CI pipeline fails on tainted-to-sink flows
- No taint warnings exist for SQL or shell execution sinks without justified suppression
- New AI methods automatically trigger taint sink configuration update
