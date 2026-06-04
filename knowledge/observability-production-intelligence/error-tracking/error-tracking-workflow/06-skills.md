# Skill: Implement Error Tracking Workflow in Laravel

## Purpose
Implement the full error tracking lifecycle (capture → group → triage → resolve → release) for Laravel applications to reduce MTTR and improve production reliability.

## When To Use
- Production Laravel applications requiring structured error management
- Teams wanting automated regression detection through error tracking
- SLA-bound services needing MTTR improvement

## When NOT To Use
- Internal low-criticality tooling
- Development-only projects

## Prerequisites
- Error tracking SDK installed (Sentry, Flare, Bugsnag)
- VCS integration (GitHub, GitLab, Bitbucket)
- CI/CD pipeline for release tracking

## Inputs
- List of exception types in the application
- Deployment frequency and release version format
- Team structure for triage assignments

## Workflow
1. **Configure capture**: Install error tracking SDK. Register service provider. Set DSN via environment variable. Configure auto-instrumentation for queries, HTTP calls, queue jobs.
2. **Configure release tracking**: Set `SENTRY_RELEASE` environment variable in CI/CD deployment step. Enable VCS integration in error tracking dashboard.
3. **Define fingerprinting rules**: Create custom fingerprint resolvers for exception types with dynamic messages. Test grouping with sample data.
4. **Set up breadcrumbs**: Enable relevant breadcrumb collectors. Disable noisy collectors. Set buffer limits.
5. **Configure triage routing**: Map severity levels. Create team notification rules. Integrate with ticketing system (Jira, Linear).
6. **Implement resolution workflow**: Define process for fix → deploy → verify → resolve. Add deployment verification step.
7. **Configure monitoring**: Set up crash-free rate dashboards. Create alert rules for error spikes. Define regression detection thresholds.

## Validation Checklist
- [ ] SDK captures unhandled exceptions automatically
- [ ] Release version sent with every error event
- [ ] Breadcrumbs collected for queries and HTTP calls
- [ ] Custom fingerprint rules group related errors
- [ ] Source maps uploaded for frontend errors
- [ ] Crash-free rate dashboard configured
- [ ] Alert rules for error spikes active
- [ ] Resolution workflow documented and followed
- [ ] DSN stored in environment variable, not committed
- [ ] PII scrubbing configured via before_send

## Common Failures
- **No release tracking:** Errors cannot be tied to deployments. Cannot answer "when was this introduced?"
- **No fingerprint customization:** Dynamic errors create thousands of separate issues. Grouping is broken.
- **No breadcrumb limits:** 200 slots fill with noise (health check queries, cache hits). Real context is lost.
- **No source maps:** Frontend errors show minified stack traces. Useless for debugging.

## Decision Points
- **Sentry vs Flare vs Bugsnag:** Sentry for comprehensive workflow; Flare for Laravel-native DX; Bugsnag for cross-platform teams.
- **Release version format:** git SHA for precision; semantic version for readability; CI build number for automation.
- **Breadcrumb auto-instrumentation:** Enable all for development; selective for production (queries + HTTP + navigation).

## Performance Considerations
- SDK overhead: 5-10ms per error capture
- Breadcrumb collection: < 1ms per event, memory proportional to buffer size
- Batch reporting reduces network calls during error bursts
- Performance tracing sampling rate independent of error capture

## Security Considerations
- Strip PII from error payloads via `before_send` callback
- DSN in `.env`, never committed
- User email and IP scrubbed by default
- Error tracking dashboard access restricted to engineering team
- Session replay data redacted per privacy policy

## Related Skills
- Sentry Laravel Integration
- Flare & BugSnag Alternatives
- Log Context & Correlation

## Success Criteria
- All unhandled exceptions captured with full context
- Error grouping works correctly — no duplicate issues for same root cause
- Each error can be traced to the release that introduced it
- MTTR tracked and trending downward
- Crash-free rate monitored per release
