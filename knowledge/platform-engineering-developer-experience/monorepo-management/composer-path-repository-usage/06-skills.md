# Skills: Composer Path Repository Usage

## Metadata
- **Domain:** Platform Engineering & Developer Experience
- **Subdomain:** Monorepo Management
- **KU:** Composer Path Repository Usage
- **Phase:** 6 (Skill Extraction)

---

## Skill 1: Configure Composer Path Repositories for Monorepo Development

### Purpose
Set up Composer path repositories to enable local symlink-based development of interdependent packages in a Laravel monorepo.

### When To Use
Developing multiple interdependent Laravel packages in a monorepo; testing a package change against a real application before publishing; need real-time feedback for cross-package changes.

### When NOT To Use
Single package development with no cross-package dependencies; production or CI environments where remote resolution is required; Windows environments without admin privileges (symlink issues).

### Prerequisites
- Composer 2.x installed
- Monorepo with packages in a structured directory (e.g., `packages/*`)
- Root `composer.json` at monorepo root
- Basic understanding of Composer repository resolution

### Inputs
- List of monorepo packages with their directory paths
- Root `composer.json` content
- CI and production build configuration

### Workflow
1. Organize packages in a consistent directory (e.g., `packages/package-a`, `packages/package-b`)
2. Add path repository to root `composer.json`: `"repositories": [{"type": "path", "url": "packages/*"}]` (use relative paths)
3. Require all packages with `"*"` version constraint: `"require": {"my-org/package-a": "*", "my-org/package-b": "*"}`
4. Add `"replace"` declarations to prevent Composer from downloading from Packagist: `{"my-org/package-a": "self.version"}`
5. Run `composer install` and verify packages are symlinked: `readlink vendor/my-org/package-a` shows local path
6. Configure CI: use path repos for build speed; add separate job testing remote resolution
7. Handle lock file portability: either regenerate lock in CI, use env-specific lock files, or configure `COMPOSER_ROOT_VERSION`
8. For production build: strip path repo configuration; run `composer install --no-dev` with remote repos only
9. Validate with remote resolution in CI: run a job that resolves without path repos to catch version mismatch

### Validation Checklist
- [ ] Path repos use relative paths, not absolute
- [ ] Root `composer.json` uses `"*"` version constraint for monorepo packages
- [ ] `"replace"` pattern used in root to prevent Packagist resolution
- [ ] `composer install` creates symlinks to local packages
- [ ] Changes to package source are immediately reflected without `composer update`
- [ ] CI has separate job for remote resolution validation
- [ ] Lock file portability is handled (regenerate in CI or env-specific)
- [ ] Production build strips path repo configuration
- [ ] Developers on Windows are aware of symlink requirements (admin/Developer Mode)
- [ ] File watchers configured to follow symlinks for path-resolved packages

### Common Failures
| Failure | Symptom | Solution |
|---------|---------|----------|
| Absolute paths in repos | Broken for other developers | Use relative paths: `"url": "packages/*"` |
| Committed path repo lock on production | `composer install` fails with "path not found" | Strip path repos for production; regenerate lock |
| Version constraint mismatch | Dev resolves different version than production | Keep local version aligned with expected constraint |
| Missing `"replace"` | Composer still downloads from Packagist | Add `"replace": {"my-org/core": "self.version"}` |
| Lock file not portable | Each developer generates different lock | Regenerate in CI or use env-specific lock files |

### Decision Points
- `"*"` constraint is recommended; avoid explicit version constraints for local packages
- Replace pattern prevents remote resolution; essential when package names match remote packages
- Lock file strategy: regenerate in CI for consistency; use `COMPOSER_ROOT_VERSION` for version alignment
- CI approach: path repos for speed, separate remote validation job for correctness

### Performance Considerations
- Symlink overhead is negligible; Composer generates correct autoloader for symlinked packages
- Path repos eliminate Packagist download time — monorepo install drops from ~60s to ~10s for 10+ packages
- `composer dump-autoload -o` time unchanged regardless of path repository usage
- Ensure file watchers (IDE, Laravel) are configured to follow symlinks

### Security Considerations
- Path-referenced packages may expose source code to unintended consumers; ensure no secrets in path repos
- Strip path repo configuration before production build
- Path repos bypass Packagist package signing; validate integrity for security-sensitive deployments
- Windows symlinks require admin privileges or Developer Mode

### Related Rules
- PATH-RULE-001 (Use relative paths)
- PATH-RULE-002 (Never commit path repos to production)
- PATH-RULE-003 (Use `*` version constraint)
- PATH-RULE-004 (Validate with remote resolution in CI)
- PATH-RULE-005 (Handle lock file portability)
- PATH-RULE-006 (Repository definition pattern)
- PATH-RULE-007 (Replace pattern)
- PATH-RULE-009 (No secrets in path repos)

### Related Skills
- Extract Shared Libraries from a Monorepo
- Manage Dependencies Across a Monorepo
- Configure Laravel Monorepo Tools
- Set Up Private Packagist / Satis

### Success Criteria
- Developers edit a package and see changes reflected immediately in consuming packages
- `composer install` runs in under 15 seconds for 10+ packages in the monorepo
- CI pipeline validates both path repo and remote resolution paths
- Production `composer install` succeeds without path repo configuration
- All team members can set up the monorepo without manual symlink configuration
