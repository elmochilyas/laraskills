# Skills: Private Packagist / Satis Setup

## Metadata
- **Domain:** Platform Engineering & Developer Experience
- **Subdomain:** Package Development & Shared Libraries
- **KU:** Private Packagist / Satis Setup
- **Phase:** 6 (Skill Extraction)

---

## Skill 1: Configure a Private Composer Registry for Internal Laravel Packages

### Purpose
Set up Private Packagist or Satis to distribute internal Laravel packages without publishing to public Packagist.

### When To Use
Organizations with 3+ internal packages needing private distribution; teams with compliance or air-gapped requirements; enterprises needing access control and security scanning.

### When NOT To Use
Teams with 1-2 internal packages (use path repositories); open-source packages for public consumption; teams without infrastructure for hosting.

### Prerequisites
- Composer installed on development and CI machines
- Internal packages with valid `composer.json`
- Access to either Private Packagist account or server for Satis
- Git repositories for each package

### Inputs
- List of internal packages (name, version, repository URL)
- Team member list (for Private Packagist user management)
- CI system type (GitHub Actions, GitLab CI, etc.)
- Target registry solution: Private Packagist vs Satis

### Workflow
1. Choose registry type: Private Packagist (SaaS, recommended) or Satis (self-hosted)
2. **For Private Packagist:** Create account, create organization, add packages via GitHub/GitLab integration
3. **For Satis:** Create `satis.json` with package sources, archive config, and output dir; run `satis build satis.json output/`; serve output via web server with auth
4. Configure `composer.json` in consuming projects: add `"repositories": [{"type": "composer", "url": "..."}]` as first entry
5. Set up authentication: create `auth.json` or set `COMPOSER_AUTH` environment variable in CI
6. Add `auth.json` to `.gitignore` in consuming projects
7. Configure CI secrets: `COMPOSER_AUTH` with token for private registry
8. Use organizational package prefix: `org-name/package-name` for all internal packages
9. For Satis: automate builds via CI on each push; configure archive generation
10. Verify resolution: run `composer install` and confirm internal packages resolve from private registry

### Validation Checklist
- [ ] Private registry URL listed first in `composer.json` `repositories` array
- [ ] `auth.json` in `.gitignore`, not committed
- [ ] `COMPOSER_AUTH` configured in CI/CD as a secret
- [ ] Internal packages use organizational prefix (`org-name/package-name`)
- [ ] Satis builds automated via CI, archives generated
- [ ] Satis web server access restricted with authentication
- [ ] API tokens rotated regularly, monitored for expiration
- [ ] `composer.lock` committed for consistent environments
- [ ] Documentation includes developer authentication instructions

### Common Failures
| Failure | Symptom | Solution |
|---------|---------|----------|
| Private registry after Packagist.org | Composer resolves public package instead of internal | Move private registry first in repositories array |
| Committed auth.json | Credentials in Git history exposed to all users | Add to .gitignore, use COMPOSER_AUTH in CI |
| Stale Satis build | Consumers install outdated package versions | Automate Satis builds via CI on each push |
| Missing archive config | Composer clones Git repos on each install | Add archive generation in satis.json |
| Naming conflict | Internal package has same name as public package | Use unique vendor prefix for all internal packages |

### Decision Points
- Private Packagist vs Satis: Private Packagist for feature-rich SaaS; Satis for air-gapped or cost-sensitive
- Auth method: API tokens for CI, SSH keys for developers, HTTP Basic for Satis
- Archive generation: enable for Satis to avoid Git cloning on each install
- Composite repos: use `type: composit` for multiple registry URLs during migration

### Performance Considerations
- Private registry adds to `composer update` time (additional repository queries)
- Pre-built Satis archives reduce install time vs resolving from Git sources
- Private Packagist serves packages via CDN, comparable speed to Packagist.org
- Composer caches downloaded packages globally; cache-busting only on version changes

### Security Considerations
- Store `auth.json` outside version control; use `.gitignore` and environment variables
- Use dedicated CI users with minimum required permissions
- Rotate API tokens regularly; separate tokens for CI and development
- Private Packagist provides security vulnerability scanning
- For Satis, restrict web server access with authentication

### Related Rules
- PRIVATE-RULE-001 (List private registry first)
- PRIVATE-RULE-002 (auth.json outside version control)
- PRIVATE-RULE-003 (Organizational package prefix)
- PRIVATE-RULE-004 (Automate Satis builds)
- PRIVATE-RULE-005 (Private Packagist for features)
- PRIVATE-RULE-006 (Satis for air-gapped)
- PRIVATE-RULE-007 (Archive generation)
- PRIVATE-RULE-009 (Auth in CI securely)
- PRIVATE-RULE-011 (Restrict Satis web server)

### Related Skills
- Configure Composer Path Repository Usage
- Implement Package Versioning with SemVer
- Design Package Skeleton Structure
- Manage Dependencies Across a Monorepo

### Success Criteria
- Internal packages resolve and install from private registry in development
- CI/CD pipeline authenticates and installs packages without manual intervention
- No credentials committed to version control
- Package naming conventions prevent conflicts with public packages
- Satis builds update automatically when packages are released
