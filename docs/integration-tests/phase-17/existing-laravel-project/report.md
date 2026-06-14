# Phase 17 - Existing Laravel Project Validation

## Conclusion

**PASS** for the Phase 17 existing-project release gate.

The previous result was **FAIL** because retrieval ranked unrelated database
replication guidance first and `get --include-content` omitted the standardized
knowledge body. Both defects were fixed, a corrected artifact was built, and
the complete existing-project scenario was rerun on June 14, 2026.

The corrected artifact passes installation, retrieval, canonical content,
Laravel behavior, package validation, and production dependency checks. Local
coverage remains unavailable because PHP has neither Xdebug nor PCOV. Per the
rerun policy, that environment limitation is not treated as a code failure.

## Paths And Artifact

- Lab root used: `C:\LaraSkills Phase 17 Lab`
- Existing project path: `C:\LaraSkills Phase 17 Lab\existing-laravel-project`
- Evidence path: `C:\LaraSkills Phase 17 Lab\evidence\existing`
- LaraSkills package: `laraskills@1.0.0-beta.15`
- Corrected package artifact:
  `C:\LaraSkills Phase 17 Lab\package\laraskills-1.0.0-beta.15.tgz`
- Corrected package SHA-256:
  `76E452207F3CF92756F1550F48F2993954037388C55BD67C202B48C1A96FCEF9`
- Corrected package source HEAD:
  `f3e583f88844cbf49b3a21e7097637102c26600f`
- The source working tree contained the reviewed Phase 17 fix diff when packed;
  `rerun-source-status.txt` records the exact state.
- Original failing artifact SHA-256:
  `62A5DEDEA372A631D75FC8E99EEEF29AFBB3DC60B77C252A5AEF1E6BBB1F6E70`
- Original package source commit:
  `840aecb26d4270c5f1598cd54362d4a864df298a`

The test application is a separate Git repository under the lab root. It was
not added to the LaraSkills repository.

## Starting State Before LaraSkills

The project was created as a separate Laravel 13 application, then made
non-empty before LaraSkills was installed:

- Laravel skeleton `v13.0.0`
- Laravel framework `v13.15.0`
- PHP `8.4.22`
- Laravel Breeze `v2.4.2` with Blade authentication
- Pest `v4.7.3`
- SQLite database
- Vite/Tailwind frontend build

The starting state was documented in the project's `BASELINE.md` and committed
before LaraSkills installation:

- Baseline commit: `d2e095396f7a6fc41fb9ed7b7e7d474b21d9078b`
- Commit message: `chore: establish existing Laravel app baseline`
- Baseline branch: `main`
- Validation branch: `phase-17-laraskills-validation`
- Status before LaraSkills: clean

Baseline checks passed:

- 29 Pest tests passed with 73 assertions
- Pint passed
- 25 routes were registered
- SQLite migrations passed
- Vite production build passed

## Existing Features Before LaraSkills

- Breeze registration, login, logout, password reset, email verification, and
  profile management
- Authenticated notes page
- Per-user note listing
- Validated note creation through `StoreNoteRequest`
- Existing `Note` model and `User::notes()` relationship
- Notes migration and factory
- `NoteController`
- Authenticated note routes
- Blade notes view and navigation link
- Pest tests for guest access, ownership filtering, creation, and validation

This satisfied the requirement for existing model, migration, controller,
route, Blade view, and Pest test coverage before LaraSkills was applied.

## Feature Tested With LaraSkills

The maintenance task added note archiving to the existing notes feature:

- Add nullable `archived_at` to notes
- Allow an owner to archive their note
- Return HTTP 403 for a cross-user archive attempt
- Hide archived notes from the normal notes page
- Render an Archive action in the existing Blade view
- Preserve existing note creation and listing behavior
- Keep the change within existing controller, model, route, Blade, policy, and
  Pest conventions

The regression tests were written first. The RED run had three expected
failures: the archive route did not exist and the `archived_at` column did not
exist. The four existing note tests remained passing.

The implementation added:

- Additive `archived_at` migration
- `Note` datetime cast
- Auto-discovered `NotePolicy::archive`
- Server-side `Gate::authorize('archive', $note)` enforcement
- Authenticated PATCH archive route
- Active-note query filtering
- Blade archive form guarded by `@can`
- Owner, forbidden, hidden-note, and visible-action assertions

## LaraSkills Installation And Retrieval

The original packed beta.15 artifact used by the fresh-project scenario was
installed as a development dependency during the first run. The corrected
beta.15 artifact was then rebuilt at the same lab path, force-reinstalled, and
verified from `node_modules/laraskills`. LaraSkills was rerun with the `core`
profile.

Installation-only review showed:

- Modified: `package.json`, `package-lock.json`
- Added: `.laraskills-state.json`, `skills/`, `rules/`, `agents/`, `hooks/`,
  and `mcp-configs/`
- No existing Laravel application, Composer, route, view, or test file was
  overwritten
- State file recorded version `1.0.0-beta.15` and profile `core`
- `laraskills doctor` returned `Status: HEALTHY`
- `laraskills validate --format json` returned `valid: true`, 2,321 knowledge
  units, 427 dependency edges, 3,513 relationship edges, and no issues

Corrected-artifact verification showed:

- The installed formatter contains `readStandardizedKnowledge`.
- The installed ranker no longer contains the unconditional `aliasTarget`
  signal.
- Compact and standard retrieval no longer rank
  `data-storage-systems/replication/laravel-read-write-config` first. That KU
  was absent from both returned top-K bundles for the original archive task.
- Targeted search ranked
  `security-identity-engineering/authorization/policies-model` first and
  `testing-reliability-engineering/feature-http-testing/http-test-helpers`
  second.
- Both canonical `get --include-content` commands returned a
  `## Standardized Knowledge` section and the actual source body.

Targeted search returned useful canonical IDs:

- `security-identity-engineering/authorization/policies-model`
- `testing-reliability-engineering/feature-http-testing/http-test-helpers`

Useful guidance applied:

- Enforce policies on the server; Blade visibility is not authorization
- Test both allowed and forbidden authorization paths
- Exercise the full HTTP middleware path
- Use named routes
- Assert visible Blade behavior rather than brittle HTML structure

## Commands Used

```powershell
composer create-project laravel/laravel "C:\LaraSkills Phase 17 Lab\existing-laravel-project" "^13.0" --prefer-dist --no-interaction
composer require laravel/breeze --dev --no-interaction
php artisan breeze:install blade --pest --no-interaction
php artisan make:model Note --migration --factory --no-interaction
php artisan make:controller NoteController --no-interaction
php artisan make:request StoreNoteRequest --no-interaction
php artisan make:test --pest NoteTest --no-interaction
php artisan migrate --force
php artisan test
vendor\bin\pint.bat --test
npm run build
git init -b main
git add -A
git commit -m "chore: establish existing Laravel app baseline"
git switch -c phase-17-laraskills-validation
npm install --save-dev "C:\LaraSkills Phase 17 Lab\package\laraskills-1.0.0-beta.15.tgz"
node_modules\.bin\laraskills.cmd install --profile core
node_modules\.bin\laraskills.cmd doctor
node_modules\.bin\laraskills.cmd validate --format json
node_modules\.bin\laraskills.cmd retrieve "<archive task>" --mode compact
node_modules\.bin\laraskills.cmd retrieve "<archive task>" --mode standard
node_modules\.bin\laraskills.cmd search "Eloquent policy owner authorization archive timestamp Pest feature test" --limit 10 --format json
node_modules\.bin\laraskills.cmd get "security-identity-engineering/authorization/policies-model" --include-content
node_modules\.bin\laraskills.cmd get "testing-reliability-engineering/feature-http-testing/http-test-helpers" --include-content
php artisan make:migration add_archived_at_to_notes_table --table=notes --no-interaction
php artisan make:policy NotePolicy --model=Note --no-interaction
php artisan test tests/Feature/NoteTest.php
php artisan test
php artisan test --coverage --min=80 tests/Feature/NoteTest.php
php artisan route:list -v
composer audit --locked
npm audit --audit-level=high
```

## Corrected Artifact Rerun Commands

```powershell
npm pack --pack-destination "C:\LaraSkills Phase 17 Lab\package"
Get-FileHash -Algorithm SHA256 `
  "C:\LaraSkills Phase 17 Lab\package\laraskills-1.0.0-beta.15.tgz"

npm install --save-dev --force `
  "C:\LaraSkills Phase 17 Lab\package\laraskills-1.0.0-beta.15.tgz"
npm ls laraskills

node_modules\.bin\laraskills.cmd install --profile core
node_modules\.bin\laraskills.cmd doctor
node_modules\.bin\laraskills.cmd validate --format json
node_modules\.bin\laraskills.cmd retrieve "<original archive task>" --mode compact
node_modules\.bin\laraskills.cmd retrieve "<original archive task>" --mode standard
node_modules\.bin\laraskills.cmd search `
  "Eloquent policy owner authorization archive timestamp Pest feature test" `
  --limit 10 --format json
node_modules\.bin\laraskills.cmd get `
  "security-identity-engineering/authorization/policies-model" `
  --include-content
node_modules\.bin\laraskills.cmd get `
  "testing-reliability-engineering/feature-http-testing/http-test-helpers" `
  --include-content

php -m
php --ri xdebug
php --ri pcov
php artisan migrate --force
php artisan test tests/Feature/NoteTest.php
php artisan test
vendor\bin\pint.bat --test
php artisan route:list -v
npm run build
composer audit --locked
npm audit --json
npm audit --omit=dev --json
php artisan test --coverage --min=80 tests/Feature/NoteTest.php

npm test
npm run benchmark
npm run verify:packed-install
npm run verify:mcp
node scripts/laraskills.mjs validate --format json --laraskills-root .
```

`LARASKILLS_CONFIG_DIR` was set to
`C:\LaraSkills Phase 17 Lab\config`, and `LARASKILLS_ROOT` was set to the local
full LaraSkills checkout for doctor, validation, retrieval, search, and get
commands.

## Tests And Checks Run

| Check | Result |
|---|---|
| Baseline migration | PASS |
| Baseline full Pest suite | PASS: 29 tests, 73 assertions |
| Baseline Pint | PASS |
| Baseline route list | PASS: 25 routes |
| Baseline Vite build | PASS |
| LaraSkills core installation | PASS, no application-file overwrite |
| LaraSkills doctor | PASS: HEALTHY |
| LaraSkills graph validation | PASS |
| RED note regression run | Expected RED: 3 failed, 4 passed |
| Final targeted note tests | PASS: 7 tests, 21 assertions |
| Final full Pest suite | PASS: 32 tests, 82 assertions |
| Final migration | PASS |
| Final Pint | PASS |
| Final route list | PASS: 26 routes |
| Final Vite build | PASS |
| Composer audit | PASS: no security advisories |
| Initial npm audit capture | PASS: 0 vulnerabilities at the original run |
| PHPStan | Not installed in the project |
| Targeted coverage | INCOMPLETE: no Xdebug or PCOV driver |
| Post-fix focused retrieval/CLI tests | PASS: 13 tests |
| Post-fix full LaraSkills test suite | PASS: 201 tests |
| Post-fix retrieval benchmark | PASS: 72/72, 100% |
| Post-fix MCP smoke verification | PASS |
| Post-fix packed-install verification | PASS, including both Phase 17 regressions |
| Post-fix LaraSkills validation | PASS: valid, 2,321 KUs, 427 dependency edges, 3,513 relationship edges, no issues |
| Corrected artifact install | PASS: local beta.15 tarball reinstalled |
| Corrected artifact SHA-256 | PASS: `76E452207F3CF92756F1550F48F2993954037388C55BD67C202B48C1A96FCEF9` |
| Corrected compact retrieval | PASS: unrelated read/write replication KU not first or in top K |
| Corrected standard retrieval | PASS: unrelated read/write replication KU not first or in top K |
| Corrected targeted search | PASS: policy first, HTTP test helpers second |
| Corrected policy KU content | PASS: real standardized knowledge returned |
| Corrected HTTP test KU content | PASS: real standardized knowledge returned |
| Corrected targeted note tests | PASS: 7 tests, 21 assertions |
| Corrected full Pest suite | PASS: 32 tests, 82 assertions |
| Corrected migration | PASS: nothing pending |
| Corrected Pint | PASS |
| Corrected route list | PASS: 26 routes |
| Corrected Vite build | PASS |
| Corrected Composer audit | PASS: no advisories |
| Corrected full npm audit | BASELINE CONDITION: 5 dev-tool advisories already present before LaraSkills |
| Corrected production npm audit | PASS: 0 vulnerabilities |
| Corrected coverage attempt | ENVIRONMENT LIMITATION: no Xdebug or PCOV |

## Issues Found

### 1. Irrelevant Retrieval Ranking - FIXED

Both compact and standard retrieval ranked
`data-storage-systems/replication/laravel-read-write-config` first with score
190 for the note-archiving task. The result came from a partial alias match and
is unrelated to the requested model policy, timestamp, Blade, and Pest work.
Relevant policy guidance was found only through targeted search.

The cause was two invalid ranking signals: a multi-token alias could match from
one shared token, and every KU with any alias received an unconditional
`aliasTarget` bonus. Both signals were removed. The original archive-task
rerun excludes read/write replication guidance from the returned top-K
results. Targeted search and regression fixtures rank
`security-identity-engineering/authorization/policies-model` first.

### 2. `get --include-content` Omits Content - FIXED

Both selected canonical IDs resolved successfully, but
`laraskills get <id> --include-content` returned metadata, dependencies, and
relationships only. The corresponding `04-standardized-knowledge.md` files
exist and contain detailed guidance, but beta.15 did not include that content
in CLI output.

The formatter now resolves the KU content path beneath the selected LaraSkills
root and appends the actual `04-standardized-knowledge.md` body. CLI, MCP, and
packed-install regressions verify the policy KU returns its standardized
knowledge content.

### 3. Coverage Driver Missing - ENVIRONMENT LIMITATION

`php artisan test --coverage --min=80 tests/Feature/NoteTest.php` could not run
because the PHP installation has neither Xdebug nor PCOV. Behavioral tests
passed. Driver detection explicitly reported:

- `php -m`: no Xdebug or PCOV module
- `php --ri xdebug`: extension not present
- `php --ri pcov`: extension not present

The coverage command was still executed and returned the expected
`Code coverage driver not available` error. This is not treated as a code
failure for the final rerun.

### 4. Sandbox-Specific Windows File Operations

SQLite journal writes, Blade compiled-view atomic renames, Git lock-file
renames, and esbuild process spawning were denied in the restricted sandbox.
The same commands passed outside the sandbox without application changes.
This was an execution-environment issue, not a Laravel or LaraSkills runtime
failure.

### 5. npm Dev-Tool Advisory Drift - NON-BLOCKING BASELINE CONDITION

The live full `npm audit` endpoint reported five advisories in the existing
project's development toolchain:

- `vite` / `esbuild`
- `laravel-vite-plugin`
- `concurrently` / `shell-quote`

The baseline commit already contained the affected versions before LaraSkills
was installed (`vite` 7.3.5, `laravel-vite-plugin` 2.1.0, `concurrently` 9.2.1,
and `shell-quote` 1.8.3). The findings were therefore not introduced by the
corrected artifact. `npm audit --omit=dev --json` returned zero production
vulnerabilities, Composer returned no advisories, and the production frontend
build passed. No unrelated major dependency upgrade was made during this
bounded validation.

## Fixes Applied

- Added the bounded archive feature and regression tests to the isolated
  existing application.
- Used server-side policy authorization plus Blade `@can` visibility.
- Preserved the pre-existing notes architecture and behavior.
- Reran filesystem/process-sensitive checks outside the restricted sandbox.
- Removed unsafe one-token partial alias matching.
- Removed the unconditional alias-target ranking bonus.
- Implemented standardized knowledge-file loading for `get --include-content`.
- Added CLI, alias resolver, MCP, and packed-install regression coverage.
- Revalidated the graph and retrieval benchmark after the fixes.
- Did not install or modify system PHP extensions, so coverage remains
  incomplete.
- Built and installed a corrected beta.15 artifact in the original lab.
- Repeated compact/standard retrieval and both canonical content reads.
- Repeated all application and package-level validation checks.

## Final Result

The existing application remained healthy after the corrected LaraSkills
installation:

- No pre-existing tests regressed
- Existing application files were not silently overwritten
- The new archive behavior is authorized and tested
- Full tests, Pint, migrations, routes, build, Composer audit, and production
  npm audit pass
- The original replication-ranking defect is absent
- Canonical `get --include-content` returns real standardized knowledge
- The test application remains outside the LaraSkills repository

The previous result was **FAIL**. The corrected-artifact rerun result is
**PASS**. The unavailable local coverage driver is the only remaining scenario
limitation and is explicitly classified as an environment limitation, not a
code failure.

This existing-project scenario no longer blocks the Phase 17 release gate.
Separate Phase 17 scenarios retain their own evidence and conclusions.
