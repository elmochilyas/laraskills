# LaraSkills Rebrand Audit

## Scope

This audit records the tracked legacy-name inventory before the
`1.0.0-beta.15` LaraSkills migration. The scan was run case-insensitively
against tracked content and tracked paths on
`release/1.0.0-beta.15-laraskills-rebrand`.

Patterns:

```text
Laravel ECC
laravel-ecc
laravel_ecc
laravel ecc
laravel-ecc-mcp
ECC_ROOT
LARAVEL_ECC_CONFIG_DIR
laravel-ecc@1.
github.com/elmochilyas/laravel-ecc
[laravel-ecc
```

Commands:

```powershell
git grep -niE "laravel[-_ ]?ecc|Laravel ECC|laravel-ecc-mcp|ECC_ROOT|LARAVEL_ECC_CONFIG_DIR|github\.com/elmochilyas/laravel-ecc"
git ls-files | Select-String -Pattern "laravel[-_]?ecc|Laravel ECC" -CaseSensitive:$false
```

Initial result:

- 766 tracked-content matches in 112 files.
- 2 tracked runtime paths containing the old package name.
- No case-insensitive legacy paths outside
  `scripts/laravel-ecc.mjs` and `scripts/laravel-ecc-mcp.mjs`.

## Classification Rules

1. **Active reference to rename**: current package metadata, runtime behavior,
   tests, CI, installation/update scripts, examples, onboarding, or maintained
   guidance.
2. **Compatibility reference intentionally retained temporarily**: old binary
   aliases, environment-variable fallbacks, `--ecc-root`, old config discovery,
   migration guidance, deprecation messages, and tests that prove those paths.
3. **Historical reference preserved for accuracy**: completed audit, phase,
   release, publication, remediation, and integration-test records describing
   the repository under its name at that time.

## Active References

All legacy matches in these files are active references to rename, except for
the compatibility tokens explicitly listed in the next section.

| Matches | File |
| ---: | --- |
| 1 | `.github/workflows/ci.yml` |
| 9 | `AGENTS.md` |
| 2 | `CLAUDE.md` |
| 29 | `README.md` |
| 19 | `docs/mcp-opencode-setup.md` |
| 24 | `docs/mcp-server-guide.md` |
| 1 | `docs/mcp-tool-reference.md` |
| 22 | `docs/mcp-troubleshooting.md` |
| 19 | `docs/onboarding/npm-setup.md` |
| 15 | `docs/onboarding/opencode-mcp-setup.md` |
| 28 | `docs/onboarding/troubleshooting.md` |
| 1 | `docs/repository-map.md` |
| 26 | `docs/retrieval-cli-guide.md` |
| 3 | `examples/opencode-mcp.linked.jsonc` |
| 3 | `examples/opencode-mcp.local.jsonc` |
| 9 | `install.ps1` |
| 8 | `install.sh` |
| 4 | `package-lock.json` |
| 11 | `package.json` |
| 14 | `scripts/laravel-ecc-mcp.mjs` |
| 49 | `scripts/laravel-ecc.mjs` |
| 9 | `scripts/mcp/handlers.mjs` |
| 2 | `scripts/verify-clean-clone.mjs` |
| 2 | `scripts/verify-mcp-smoke.mjs` |
| 9 | `scripts/verify-packed-install.mjs` |
| 5 | `src/retrieval/catalog-loader.mjs` |
| 6 | `src/retrieval/index.mjs` |
| 14 | `src/runtime/ecc-root-resolver.mjs` |
| 9 | `src/runtime/user-config.mjs` |
| 1 | `tests/phase-15/isolation-smoke.mjs` |
| 2 | `tests/phase-15/verify-mcp.mjs` |
| 15 | `tests/retrieval/cache-manager.test.mjs` |
| 12 | `tests/retrieval/catalog-loader.test.mjs` |
| 12 | `tests/retrieval/cli.test.mjs` |
| 2 | `tests/retrieval/context-bundler.test.mjs` |
| 22 | `tests/retrieval/ecc-root-resolver.test.mjs` |
| 3 | `tests/retrieval/encoding.test.mjs` |
| 2 | `tests/retrieval/graph-expander.test.mjs` |
| 14 | `tests/retrieval/mcp.test.mjs` |
| 2 | `tests/retrieval/ranker.test.mjs` |
| 2 | `tests/retrieval/run-benchmarks.mjs` |
| 6 | `tests/retrieval/run-performance-benchmarks.mjs` |
| 13 | `tests/retrieval/user-config.test.mjs` |
| 3 | `tests/retrieval/validator.test.mjs` |
| 8 | `update.ps1` |
| 8 | `update.sh` |

Active runtime paths to rename with `git mv`:

```text
scripts/laravel-ecc.mjs
scripts/laravel-ecc-mcp.mjs
```

## Planned Compatibility References

The following old names will remain only where they implement or document the
temporary migration bridge:

| Legacy reference | Retention reason |
| --- | --- |
| `laravel-ecc` binary key | Compatibility alias to `scripts/laraskills.mjs` |
| `laravel-ecc-mcp` binary key | Compatibility alias to `scripts/laraskills-mcp.mjs` |
| `--ecc-root` | Deprecated CLI/MCP alias after `--laraskills-root` |
| `ECC_ROOT` | Legacy root environment fallback |
| `LARAVEL_ECC_CONFIG_DIR` | Legacy config-directory environment fallback |
| `eccRoot` config field | Read compatibility for existing config files |
| `laravel-ecc/config.json` | Read-only old config-directory fallback |
| `.laravel-ecc-state.json` | Existing project-install state compatibility |
| old package/repository names | Migration guide, allowlist, deprecation, and runbook instructions |

The preferred replacements must take precedence. Doctor output and tests must
identify when a legacy fallback is active.

## Historical References

Every legacy match in the following files is classified as historical and is
preserved verbatim for accuracy. These files describe completed work performed
before the LaraSkills rebrand.

| Matches | File |
| ---: | --- |
| 1 | `docs/audits/agent-navigation-audit.md` |
| 1 | `docs/audits/architecture-audit.md` |
| 2 | `docs/audits/cli-retrieval-audit.md` |
| 4 | `docs/audits/cross-platform-audit.md` |
| 4 | `docs/audits/documentation-audit.md` |
| 4 | `docs/audits/full-certification-audit.md` |
| 4 | `docs/audits/git-and-repository-state.md` |
| 1 | `docs/audits/graph-integrity-audit.md` |
| 1 | `docs/audits/indexes-and-registry-audit.md` |
| 1 | `docs/audits/intelligence-json-audit.md` |
| 1 | `docs/audits/knowledge-layer-audit.md` |
| 2 | `docs/audits/mcp-adapter-audit.md` |
| 2 | `docs/audits/mcp-inspector-cli-audit.md` |
| 8 | `docs/audits/npm-package-audit.md` |
| 6 | `docs/audits/opencode-integration-audit.md` |
| 7 | `docs/audits/phase-11-2-1-remediation-report.md` |
| 3 | `docs/audits/phase-11-3-readiness-recheck.md` |
| 1 | `docs/audits/post-remediation-quality-backlog.md` |
| 4 | `docs/audits/real-project-readiness.md` |
| 1 | `docs/audits/rebuild-tooling-audit.md` |
| 3 | `docs/audits/security-scan.md` |
| 1 | `docs/audits/test-and-benchmark-audit.md` |
| 1 | `docs/duplicate-ku-resolution-report.md` |
| 1 | `docs/integration-tests/phase-11-3-final-report.md` |
| 4 | `docs/integration-tests/phase-11-3-mcp-usability.md` |
| 2 | `docs/integration-tests/phase-11-5-final-report.md` |
| 1 | `docs/integration-tests/phase-11-5-mcp-usability.md` |
| 2 | `docs/integration-tests/phase-13/phase-13-final-report.md` |
| 18 | `docs/integration-tests/phase-13/phase-13-manual-runbook.md` |
| 2 | `docs/integration-tests/phase-13/phase-13-mcp-usability.md` |
| 8 | `docs/integration-tests/phase-13/phase-13-methodology.md` |
| 1 | `docs/integration-tests/phase-13/phase-13-retrieval-quality.md` |
| 1 | `docs/integration-tests/phase-13/README.md` |
| 2 | `docs/integration-tests/phase-13-1/methodology.md` |
| 8 | `docs/integration-tests/phase-13-1/phase-13-1-runbook.md` |
| 5 | `docs/integration-tests/phase-13-1/phase-13-1-summary.md` |
| 2 | `docs/integration-tests/phase-13-1/prompts/required-retrieval-instruction.txt` |
| 1 | `docs/integration-tests/phase-14/phase-14-focused-rerun-report.md` |
| 12 | `docs/integration-tests/phase-14-1-ecc-root-resolver-regression-cleanup.md` |
| 1 | `docs/integration-tests/phase-15/final-report.md` |
| 2 | `docs/integration-tests/phase-15/README.md` |
| 1 | `docs/integration-tests/phase-16/phase-16-ci-matrix.md` |
| 1 | `docs/integration-tests/phase-16/phase-16-clean-clone-reproducibility.md` |
| 7 | `docs/knowledge-packaging-recommendation.md` |
| 16 | `docs/npm-retrieval-distribution-decision.md` |
| 4 | `docs/package-audit-report.md` |
| 2 | `docs/phase-10-1-json-rebuild-report.md` |
| 1 | `docs/phase-10-1-recovery-scan.md` |
| 2 | `docs/phase-10-1-reference-validation.md` |
| 1 | `docs/phase-10-2-final-remediation-report.md` |
| 1 | `docs/phase-10-5-5-documentation-sync-report.md` |
| 5 | `docs/phase-10-audit-report.md` |
| 1 | `docs/phase-11-1-2-dependency-validation-audit.md` |
| 1 | `docs/phase-11-1-2-dependency-validation-repair-report.md` |
| 1 | `docs/phase-11-1-3-encoding-cleanup-report.md` |
| 2 | `docs/phase-11-1-4-current-state-audit.md` |
| 5 | `docs/phase-11-1-4-pre-mcp-readiness-report.md` |
| 14 | `docs/phase-11-2-mcp-adapter-report.md` |
| 1 | `docs/phase-11-4-authorization-hardening-report.md` |
| 10 | `docs/phase-11-retrieval-implementation-report.md` |
| 9 | `docs/phase-12-distribution-onboarding-hardening-report.md` |
| 1 | `docs/phase-14-mcp-reliability-multi-tenant-hardening.md` |
| 4 | `docs/potential-missing-ku-backlog.md` |
| 5 | `docs/releases/1.0.0-beta.10.md` |
| 4 | `docs/releases/1.0.0-beta.11.md` |
| 22 | `docs/releases/1.0.0-beta.12.md` |
| 6 | `docs/releases/1.0.0-beta.13.md` |
| 10 | `docs/releases/1.0.0-beta.14.md` |
| 9 | `docs/releases/1.0.0-beta.9-publication-report.md` |
| 3 | `docs/releases/1.0.0-beta.9.md` |
| 1 | `docs/unmatched-reference-classification.md` |

## Migration Decision

The active surface will move to LaraSkills. Historical reports will not be
rewritten, and the old public names will remain elsewhere only when required
for the temporary compatibility bridge or migration documentation. A final
tracked-content audit and explicit allowlist will reconcile every remaining
legacy match before release preparation is complete.
