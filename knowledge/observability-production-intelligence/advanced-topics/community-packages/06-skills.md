# Skill: Evaluate and Integrate Community Observability Packages for Laravel
## Purpose
Evaluate and integrate third-party community packages extending Laravel observability — such as Laravel Debugbar, Log Viewer, and model/query monitoring tools — to fill gaps in the observability stack.
## When To Use
- Filling specific observability gaps not covered by first-party tools
- Adding development-time debugging tools (Debugbar) to improve workflows
- Integrating specialized monitoring for specific Laravel components
## When NOT To Use
- Core observability tooling (APM, logging, tracing) — use established first-party tools
- Packages with poor maintenance history or security concerns
## Prerequisites
- Clear understanding of observability gaps (what's missing from current stack)
- Laravel application with defined observability needs
- Familiarity with Composer dependency management
## Inputs
- List of observable concerns (DB queries, model events, mail, notifications, etc.)
- Evaluation criteria: maintenance frequency, download stats, security, Laravel version compatibility
- Integration requirements per package
## Workflow
1. Audit current observability coverage: identify gaps (missing query monitoring, no mail preview, no model event tracking)
2. Research community packages per gap: Laravel Debugbar (barryvdh/laravel-debugbar), Log Viewer (opcodesio/log-viewer), Model Caching (genealabs/laravel-model-caching), Model Activity (spatie/laravel-activitylog)
3. Evaluate each package using criteria: Packagist downloads, last update, GitHub stars, open issues, security advisories, Laravel version compatibility
4. Install selected packages: `composer require <package>` with version constraint
5. Configure per environment: Debugbar in development only, Log Viewer in staging/production with auth
6. Test integration: verify package works without breaking existing functionality
7. Document integration: purpose, configuration, environment restrictions
## Validation Checklist
- [ ] Observability gaps identified and documented
- [ ] Candidate packages evaluated against criteria (downloads, maintenance, security, compatibility)
- [ ] Packages approved and installed with version constraints
- [ ] Environment-specific configuration (dev-only, prod with restrictions)
- [ ] No security vulnerabilities in installed packages
- [ ] Integration tested across environments
- [ ] Documentation added for team reference
- [ ] Package updates included in dependency management workflow
## Common Failures
- **Installing unmaintained packages:** No updates in 2+ years, incompatible with current Laravel.
- **Production exposure:** Dev-only tools (Debugbar) accidentally enabled in production.
- **Security vulnerabilities:** Package with known CVEs installed without audit.
- **Conflicts between packages:** Two packages trying to hook the same event/listener.
- **No documentation:** Installed but team doesn't know how to use or configure.
## Decision Points
- **Open-source vs custom:** Open-source for standard needs; custom for unique requirements.
- **Package A vs B for same gap:** Choose by: maintenance frequency + download count + Laravel version support.
- **Dev-only vs environment-agnostic:** Debugbar strictly dev; Log Viewer can be prod with auth.
## Performance Considerations
- Development packages (Debugbar) add significant overhead (50-300ms) — never enable in production
- Log Viewer scans log files — may be slow with huge log files
- Activity log packages write to DB on every event — can cause write amplification
## Security Considerations
- Enable Debugbar only in local/development, never staging or production
- Log Viewer requires authentication in production (restrict to admin users)
- Validate package doesn't introduce SQL injection or XSS
- Audit `composer audit` regularly for known vulnerabilities
## Related Skills
- Laravel Telescope (dashboards)
- Laravel Pulse (dashboards)
- Structured JSON Logging (logging)
- Error Tracking Workflow (error-tracking)
## Success Criteria
- Observability gaps filled with well-maintained community packages
- Packages evaluated and chosen by objective criteria (downloads, maintenance, security)
- Environment-specific configuration prevents production exposure
- Integration tested and documented for the team
- `composer audit` shows no known vulnerabilities in installed packages
