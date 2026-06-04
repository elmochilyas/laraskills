# Skill: Evaluate and Integrate Community AI Packages
## Purpose
Systematically evaluate, select, and integrate community PHP packages that extend the laravel/ai SDK, ensuring maintenance quality, security, and architectural compatibility.
## When To Use
- When laravel/ai SDK lacks a needed feature (security middleware, cost tracking, graph workflows)
- Evaluating alternative provider abstractions (Prism PHP, LLPhant) for gaps in laravel/ai
- Adding observability, cost management, or security packages to production AI systems
## When NOT To Use
- When laravel/ai SDK already provides the needed feature
- Installing multiple packages that serve the same purpose
- Niche unmaintained packages (<100 stars, no commits in 6 months)
- Packages requiring Python sidecar (defeats PHP-native AI development)
## Prerequisites
- Laravel application with laravel/ai SDK installed
- Clear understanding of the missing capability
- Composer and familiarity with PHP package management
## Inputs
- List of candidate packages for evaluation
- Package evaluation criteria (stars, last commit, test suite, Laravel version support)
- Application's PHP and Laravel version requirements
## Workflow (numbered)
1. Identify the capability gap not covered by laravel/ai SDK
2. Search Packagist/GitHub for candidate packages (min 100 stars, active within 3 months)
3. Evaluate each candidate: last release date, PHP version support, Laravel 13 support, test suite, open issues
4. Review source code for security issues (exec functions, API key handling, logging practices)
5. Check license compatibility (prefer MIT, avoid AGPL for commercial projects if restrictive)
6. Pin exact minor version (`^0.4`) in composer.json
7. Test package in isolation with application's provider configuration
8. Integrate via agent middleware pattern (not provider replacement)
9. Run `composer audit` to verify zero vulnerabilities
10. Document package configuration in central `config/ai.php`
## Validation Checklist
- [ ] Package pinned to specific minor version in composer.json
- [ ] No overlapping packages for the same concern
- [ ] Package has active maintenance (commits within last 3 months)
- [ ] Test suite passes with package installed
- [ ] `composer audit` shows zero vulnerabilities
- [ ] Service provider boot order validated (no duplicate facade registrations)
- [ ] Package configuration documented in central location
- [ ] License compatibility checked (OSI-approved open-source preferred)
- [ ] Integration uses middleware pattern over provider replacement
- [ ] Upgrade path documented (changelog read, migration steps known)
## Common Failures
- Installing 3+ packages that do the same thing
- Not checking package license — some are AGPL with commercial restrictions
- Assuming all packages support the same PHP/Laravel version range
- Using a package not updated in >6 months for AI SDK integration
- Overlooking package test coverage (0% coverage means unknown regressions)
- Not reading CHANGELOG before updating — breaking changes are frequent
## Decision Points
- **Middleware vs provider replacement**: Prefer packages that integrate via agent middleware over those requiring custom providers
- **Single comprehensive vs multiple specialized**: One comprehensive security package beats three overlapping ones
- **Community vs build in-house**: Community if active and mature; build in-house only for highly specific needs
## Performance Considerations
- Security middleware (Aegis): 5-15ms per call
- Budget enforcement: 2-5ms per call (cached Eloquent check)
- Graph node transition: 10-30ms per node
- Adding 2-3 packages adds 15-45ms overhead per AI call in middleware
- Package autoloading overhead: ~5-15ms additional Composer class loading
## Security Considerations
- Community packages may introduce transitive vulnerabilities — vet dependencies thoroughly
- Some packages register API routes — test in isolated environment
- Security middleware packages complement, not replace, input validation
- Packages with WebSocket servers need proper authentication and rate limiting
- Check that packages don't log sensitive prompt/response data by default
## Related Rules (from 05-rules.md)
- Always verify package maintenance status before adoption
- Never install AI packages that require exec/shell_exec in production
- Prefer packages implementing provider abstraction pattern over provider-specific packages
## Related Skills
- Layer Community Packages on laravel/ai SDK
- Implement Security Middleware for AI Calls
- Implement Cost Tracking and Budget Enforcement
## Success Criteria
- Community package fills verified gap without overlap
- Package passes maintenance, security, and license evaluation
- Integration test suite passes with package installed
- Package upgrade path documented and tested

---

# Skill: Layer Community Packages on laravel/ai SDK
## Purpose
Integrate community packages as middleware layers on top of the laravel/ai SDK, ensuring they consume SDK interfaces rather than replacing them for maximum compatibility and upgradeability.
## When To Use
- Adding security, cost tracking, or observability middleware to AI agents
- Extending laravel/ai with community-provided middleware implementations
- Building middleware stacks that compose multiple cross-cutting concerns
## When NOT To Use
- When the community package requires replacing the entire provider abstraction
- When the middleware functionality is already available in laravel/ai SDK
## Prerequisites
- laravel/ai SDK installed and configured
- Community package installed and registered
- Understanding of agent middleware pipeline pattern
## Inputs
- Agent instance from laravel/ai SDK
- Community middleware class implementing the middleware contract
- Middleware ordering requirements (security first, then cost, then logging)
## Workflow (numbered)
1. Ensure community package consumes laravel/ai interfaces (Agent, Provider, Middleware contracts)
2. Register package service provider — use `$defer = true` where possible
3. Configure middleware in `config/ai.php` providers.middleware array
4. Order middleware correctly: security first, cost tracking, observability last
5. Normalize package configuration into `config/ai.php` where possible
6. Test with laravel/ai `FakeAi` and `AgentFake` for deterministic testing
7. Verify middleware pipeline processes in correct order
8. Document middleware stack configuration and behavior
## Validation Checklist
- [ ] Package consumes laravel/ai interfaces, not replaces them
- [ ] Service provider registered with correct order
- [ ] Middleware ordering matches dependency requirements
- [ ] Tests pass with FakeAi in middleware pipeline
- [ ] Configuration unified in central config/ai.php
- [ ] No duplicate facade registrations across packages
- [ ] Middleware pipeline performance overhead measured
## Common Failures
- Package replaces provider instead of layering as middleware
- Incorrect middleware order causing security checks after cost tracking
- Package registering conflicting facades with other packages
- Forgetting to test with fakes — real API calls in test suite
- Configuration scattered across multiple package config files
## Decision Points
- **Middleware order**: Security/PII first, cost/budget second, logging last
- **Config unification**: Centralize all AI config in config/ai.php or keep package-specific?
- **Facade conflicts**: Use aliases to avoid conflicts when multiple packages register similar facades
## Performance Considerations
- Each middleware layer adds 2-15ms per AI call
- Order middleware so expensive checks (logging) don't run if cheap checks (security) fail early
- Cache middleware evaluation results where possible (e.g., budget check cached for 60s)
## Security Considerations
- Security middleware must run before cost or logging to prevent sensitive data exposure
- Middleware that modifies prompts (PII redaction) must not break prompt structure
- Logging middleware must redact sensitive data before persistence
## Related Rules (from 05-rules.md)
- Prefer packages that implement the provider abstraction pattern over provider-specific packages
- Never install AI packages that require exec/shell_exec in production
## Related Skills
- Evaluate and Integrate Community AI Packages
- Implement Security Middleware for AI Calls
- Implement Cost Tracking and Budget Enforcement
## Success Criteria
- Community middleware integrates as transparent layer in agent pipeline
- Switching providers requires no changes to middleware configuration
- Middleware pipeline testable with FakeAi in isolation
- Configuration centralized and documented for team reference
