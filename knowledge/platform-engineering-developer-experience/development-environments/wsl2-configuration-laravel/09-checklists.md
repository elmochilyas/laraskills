# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** development-environments
**Knowledge Unit:** wsl2-configuration-laravel
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] WSL2 Ubuntu distro installed and running
- [ ] `.wslconfig` configured with memory limit
- [ ] Projects stored on WSL2 filesystem (not `/mnt/c/`)
- [ ] Docker Desktop WSL2 backend enabled
- [ ] VS Code Remote - WSL works
- [ ] Sail commands run correctly from WSL2
- [ ] Windows Terminal configured with Ubuntu profile
- [ ] Performance: - WSL2 ext4: 3-5x faster than NTFS for Docker bind mounts
- [ ] Performance: - Docker performance: near-native (within 5% of Linux)
- [ ] Performance: - Startup: 2-5s cold boot; 30-60s Sail environment

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Install Ubuntu 24.04 LTS via `wsl --install -d Ubuntu-24.04`
- [ ] Architecture guideline: - Docker Desktop: enable WSL2 backend, integrate with Ubuntu
- [ ] Architecture guideline: - .wslconfig in `%UserProfile%\.wslconfig` for memory/CPU limits
- [ ] Architecture guideline: - VS Code: install Remote - WSL extension
- [ ] Architecture guideline: - Git: configure `core.autocrlf false` in WSL2

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Configure WSL2 for Laravel Development

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - WSL2 ext4: 3-5x faster than NTFS for Docker bind mounts
- [ ] - Docker performance: near-native (within 5% of Linux)
- [ ] - Startup: 2-5s cold boot; 30-60s Sail environment
- [ ] - Memory: 4-8GB typical allocation; limit via .wslconfig

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - WSL2 shares Windows network; services on localhost accessible from Windows
- [ ] - Don't run production workloads in WSL2
- [ ] - Environment variable differences between Windows and Linux â€” use .env explicitly

# Reliability Checklist (from 04/05/06)
- [ ] Error handling covers all failure modes
- [ ] Database transactions wrap multi-step operations
- [ ] Stateless design enforced (no mutable per-request state)
- [ ] Logging is configured for debugging without leaking sensitive data

# Testing Checklist (from 04/06)
- [ ] Unit tests cover happy path
- [ ] Unit tests cover error/exception paths
- [ ] Tests are isolated (no shared mutable state between tests)
- [ ] Test coverage includes edge cases
- [ ] Architecture tests enforce patterns (Pest arch tests)
- [ ] WSL2 Ubuntu distro installed and running
- [ ] `.wslconfig` configured with memory limit
- [ ] Projects stored on WSL2 filesystem (not `/mnt/c/`)
- [ ] Docker Desktop WSL2 backend enabled
- [ ] VS Code Remote - WSL works
- [ ] Sail commands run correctly from WSL2
- [ ] Windows Terminal configured with Ubuntu profile

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Editing WSL2 files from Windows apps -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Running Sail from Windows drive -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern

# Production Readiness Checklist
- [ ] All configuration values have production-safe defaults
- [ ] Error responses do not leak stack traces or internals
- [ ] Logging level is appropriate for production (INFO/WARN/ERROR)
- [ ] Feature flags or toggles are in place for risky changes
- [ ] Migration rollback strategy is defined
- [ ] Rate limiting is applied where appropriate
- [ ] Monitoring/alerting is configured for failure modes
- [ ] Dependencies are up to date with no known vulnerabilities

# Final Approval Checklist
- [ ] All previous checklist sections have been reviewed and satisfied
- [ ] Code review has been completed by at least one peer
- [ ] The implementation matches the approved design/architecture
- [ ] Tests pass in CI environment
- [ ] Documentation is updated (if applicable)
- [ ] No known regressions introduced
- [ ] Change log entry is added (if applicable)

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
### Skills (from 06)
- Configure WSL2 for Laravel Development
### Anti-Patterns (from 08)
- Editing WSL2 files from Windows apps
- Running Sail from Windows drive
### Related Rules (from 06 skills)
- WSL-RULE-001: Store projects in WSL2 ext4 filesystem
- WSL-RULE-002: Configure .wslconfig
- WSL-RULE-003: Use VS Code Remote - WSL
- WSL-RULE-004: Use Windows Terminal
- WSL-RULE-005: Use Sail inside WSL2
- WSL-RULE-006: Shutdown WSL2 when not in use
### Related Skills (from 06 skills)
- Configure Laravel Sail
- Set Up Docker Compose for Laravel
- Configure Devcontainer for Laravel

