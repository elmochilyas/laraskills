# Phase 17 - Real Laravel Usage Validation Plan

## Purpose

Phase 17 validates `laraskills` in real Laravel 13 usage before preparing
`1.0.0-rc.1`. This phase is for finding integration defects, unsafe installation
behavior, irrelevant retrieval, and MCP workflow failures. It is not a feature
development phase.

## Scope and Constraints

- Package under test: `laraskills`
- Package version under test: `1.0.0-beta.15`
- Source branch: `phase-17-real-usage-validation`
- Primary platform: Windows with PowerShell
- Laravel target: Laravel 13 on PHP 8.3 or later
- Do not change LaraSkills package code during initial validation.
- Do not change the npm version.
- Do not publish, tag, or deprecate any npm package.
- Build one local npm tarball from the exact commit under test and use that same
  tarball in all three scenarios.
- Run generated Laravel applications outside the LaraSkills repository.
- Keep secrets, local `.env` files, generated applications, and raw agent logs
  out of the LaraSkills repository.
- A missing evidence item is `INCOMPLETE`, not `PASS`.

## Result Classification

| Result | Meaning |
|---|---|
| `PASS` | All required evidence exists and every pass criterion is satisfied. |
| `FAIL` | LaraSkills behavior or LaraSkills-guided output violates a criterion. |
| `BLOCKED` | An external dependency prevents execution, such as unavailable OpenCode provider credentials. |

`BLOCKED` does not count as release-candidate evidence. The scenario must be
rerun successfully before `1.0.0-rc.1`.

## Common Windows Lab Setup

### Prerequisites

- Git
- Node.js 18, 20, or 22 and npm
- PHP 8.3 or later
- Composer
- SQLite PHP extension
- OpenCode with a configured model/provider for the MCP scenario
- Xdebug or PCOV when collecting the required coverage evidence

Use a lab path containing spaces so Windows path quoting is exercised.

```powershell
$LaraSkillsRoot = (Resolve-Path "C:\path\to\laraskills").Path
$LabRoot = "C:\LaraSkills Phase 17 Lab"
$PackageRoot = Join-Path $LabRoot "package"
$EvidenceRoot = Join-Path $LabRoot "evidence"
$ConfigRoot = Join-Path $LabRoot "config"

New-Item -ItemType Directory -Force -Path $PackageRoot | Out-Null
New-Item -ItemType Directory -Force -Path $EvidenceRoot | Out-Null
New-Item -ItemType Directory -Force -Path $ConfigRoot | Out-Null

$env:LARASKILLS_CONFIG_DIR = $ConfigRoot
$env:LARASKILLS_ROOT = $LaraSkillsRoot

Set-Location $LaraSkillsRoot
git status --short --branch | Tee-Object (Join-Path $EvidenceRoot "source-status.txt")
git rev-parse HEAD | Tee-Object (Join-Path $EvidenceRoot "source-commit.txt")
node --version | Tee-Object (Join-Path $EvidenceRoot "node-version.txt")
npm --version | Tee-Object (Join-Path $EvidenceRoot "npm-version.txt")
php --version | Tee-Object (Join-Path $EvidenceRoot "php-version.txt")
composer --version | Tee-Object (Join-Path $EvidenceRoot "composer-version.txt")

npm ci
npm pack --pack-destination $PackageRoot

$Tarball = (Resolve-Path (Join-Path $PackageRoot "laraskills-1.0.0-beta.15.tgz")).Path
Get-FileHash -Algorithm SHA256 $Tarball |
    Format-List |
    Out-File (Join-Path $EvidenceRoot "package-sha256.txt")
```

Before starting a scenario, create its evidence directory:

```powershell
New-Item -ItemType Directory -Force -Path (Join-Path $EvidenceRoot "fresh") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $EvidenceRoot "existing") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $EvidenceRoot "opencode-mcp") | Out-Null
```

Use `Tee-Object` to retain the complete output of every validation command and
record each command's exit code. Do not manually repair agent output before the
first verification run.

## 1. Fresh Laravel Project Test

### Objective

Prove that a new Laravel 13 project can install the packed LaraSkills release,
configure retrieval, receive useful task context, and use that context to
produce a secure, tested Laravel feature without relying on unpublished files
outside the declared LaraSkills root.

This scenario validates the CLI and the `full` project installation profile.
Do not enable LaraSkills MCP for this scenario; CLI evidence must remain
independent from the MCP scenario.

### Setup Steps

```powershell
$FreshRoot = Join-Path $LabRoot "fresh-laravel"
$FreshEvidence = Join-Path $EvidenceRoot "fresh"

composer create-project laravel/laravel $FreshRoot "^13.0" --prefer-dist --no-interaction
Set-Location $FreshRoot

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
}
if (-not (Test-Path "database\database.sqlite")) {
    New-Item -ItemType File -Path "database\database.sqlite" | Out-Null
}

php artisan key:generate --force
php artisan install:api --no-interaction
php artisan migrate --force

git init
git add -A
git commit -m "chore: fresh Laravel 13 baseline"

npm install --save-dev $Tarball 2>&1 |
    Tee-Object (Join-Path $FreshEvidence "npm-install.txt")

$LaraSkills = Join-Path $FreshRoot "node_modules\.bin\laraskills.cmd"
& $LaraSkills install --profile full 2>&1 |
    Tee-Object (Join-Path $FreshEvidence "laraskills-install.txt")
& $LaraSkills setup --laraskills-root $LaraSkillsRoot 2>&1 |
    Tee-Object (Join-Path $FreshEvidence "laraskills-setup.txt")
& $LaraSkills doctor 2>&1 |
    Tee-Object (Join-Path $FreshEvidence "laraskills-doctor.txt")
& $LaraSkills validate --format json 2>&1 |
    Tee-Object (Join-Path $FreshEvidence "laraskills-validate.json")

php artisan about 2>&1 |
    Tee-Object (Join-Path $FreshEvidence "laravel-about.txt")
composer show laravel/framework 2>&1 |
    Tee-Object (Join-Path $FreshEvidence "laravel-framework.txt")
```

Confirm that `.laraskills-state.json` reports version `1.0.0-beta.15`, profile
`full`, and the expected installed components. Review the installation-only
diff before starting application work.

### Validation Task

Use this fixed task so results are reproducible:

```text
Using TDD, build an authenticated Laravel 13 JSON API at /api/v1/products.

Requirements:
- Sanctum authentication.
- Product migration, model, factory, and ownership by the authenticated user.
- Form Requests for create and update validation.
- ProductPolicy authorization for view, update, and delete.
- API Resources for responses.
- Cursor pagination with a validated, capped per_page value.
- Rate limiting on API routes.
- Happy-path, validation, unauthenticated, and cross-user forbidden Pest tests.
- Direct Eloquent inside an Action or controller; do not add a repository layer.
- No secrets, external services, or live network calls.
```

Save the exact prompt as `fresh/task-prompt.txt`.

### LaraSkills Commands and Tools

Run retrieval before implementation:

```powershell
$Task = "Build an authenticated Laravel 13 products CRUD API with Sanctum, policies, Form Requests, API Resources, cursor pagination, rate limiting, and Pest tests"

& $LaraSkills retrieve $Task --mode compact 2>&1 |
    Tee-Object (Join-Path $FreshEvidence "retrieve-compact.md")
& $LaraSkills retrieve $Task --mode standard 2>&1 |
    Tee-Object (Join-Path $FreshEvidence "retrieve-standard.md")
& $LaraSkills search "Sanctum product policy cursor pagination feature tests" --limit 10 --format json 2>&1 |
    Tee-Object (Join-Path $FreshEvidence "search.json")
```

Select at least two relevant canonical IDs from `search.json`, then inspect
them with:

```powershell
& $LaraSkills get "<canonical-id-from-search>" --include-content 2>&1 |
    Tee-Object (Join-Path $FreshEvidence "knowledge-unit-1.md")
& $LaraSkills get "<second-canonical-id-from-search>" --include-content 2>&1 |
    Tee-Object (Join-Path $FreshEvidence "knowledge-unit-2.md")
```

Provide the standard bundle and inspected knowledge units to the coding agent.
The agent must write tests first, implement the feature, and report which
retrieved rules, anti-patterns, and checklists affected its decisions.

### Expected Evidence

- Exact source commit and tarball SHA-256
- Laravel, PHP, Composer, Node.js, and npm versions
- Local tarball installation log
- LaraSkills `full` profile state file and installation-only git diff
- `doctor` output ending in `Status: HEALTHY`
- `validate` JSON with a valid graph
- Compact and standard retrieval bundles
- Search output and at least two successful canonical-ID `get` results
- Exact task prompt and complete agent transcript
- First failing test output proving RED
- Final passing test output proving GREEN
- Coverage output
- Pint output
- Route list
- Composer audit output
- Final `git diff --stat`, `git diff`, and `git status --short`
- Manual security and architecture checklist

Run final verification:

```powershell
php artisan test 2>&1 |
    Tee-Object (Join-Path $FreshEvidence "tests.txt")
php artisan test --coverage --min=80 2>&1 |
    Tee-Object (Join-Path $FreshEvidence "coverage.txt")
.\vendor\bin\pint.bat --test 2>&1 |
    Tee-Object (Join-Path $FreshEvidence "pint.txt")
php artisan route:list -v 2>&1 |
    Tee-Object (Join-Path $FreshEvidence "routes.txt")
composer audit 2>&1 |
    Tee-Object (Join-Path $FreshEvidence "composer-audit.txt")
git diff --stat 2>&1 |
    Tee-Object (Join-Path $FreshEvidence "diff-stat.txt")
git diff 2>&1 |
    Tee-Object (Join-Path $FreshEvidence "diff.patch")
git status --short 2>&1 |
    Tee-Object (Join-Path $FreshEvidence "git-status.txt")
```

### Pass/Fail Criteria

**PASS only when all are true:**

- The app is Laravel 13 and runs on PHP 8.3 or later.
- The local tarball installs without registry fallback or package-source edits.
- The `full` profile installs its documented files and records
  `1.0.0-beta.15`.
- `doctor` is healthy and uses `LARASKILLS_ROOT` or the isolated persisted
  configuration, not a legacy fallback.
- `validate` reports `valid: true`, 2,321 KUs, 427 dependency edges, 3,513
  relationship edges, zero cycles, zero self-loops, and zero dangling edges.
- Retrieval returns actionable API, authentication, authorization, Eloquent,
  and testing guidance with at least two useful canonical IDs.
- The agent follows TDD and the final feature meets every task requirement.
- All tests pass and measured coverage is at least 80%.
- Pint passes and Composer reports no unresolved security advisory.
- No hardcoded secret, unsafe mass assignment, SQL injection, missing
  authorization, unbounded pagination, or unthrottled API route is present.
- The LaraSkills source repository remains unchanged.

**FAIL when any required condition fails**, including irrelevant retrieval,
broken Windows path handling, undocumented installation output, test failure,
coverage below 80%, or a security/authorization defect.

## 2. Existing Laravel Project Test

### Objective

Prove that LaraSkills can be introduced into a real, non-empty Laravel 13
project without damaging existing configuration or behavior, and that its
retrieval guidance helps complete one bounded real maintenance task.

The selected project must predate Phase 17 and contain meaningful application
code and tests. Do not use another freshly generated fixture for this scenario.

### Setup Steps

1. Select a Laravel 13 project using PHP 8.3 or later.
2. Choose one real backlog item or known defect. Good candidates are an N+1
   query, missing policy enforcement, weak validation, an unsafe webhook, or a
   missing negative-path test.
3. Create a disposable branch or worktree. Never run this scenario directly on
   the project's main branch.
4. Record the original commit, dependency versions, baseline status, complete
   test result, Pint result, route list, and PHPStan result when PHPStan exists.
5. If the baseline is already failing, record the failures before installing
   LaraSkills. New failures still fail Phase 17; pre-existing failures cannot
   be counted as LaraSkills regressions.

Example worktree setup:

```powershell
$ExistingSource = "C:\path\to\real-laravel-project"
$ExistingRoot = Join-Path $LabRoot "existing-laravel"
$ExistingEvidence = Join-Path $EvidenceRoot "existing"

git -C $ExistingSource worktree add -b phase-17-validation $ExistingRoot HEAD
Set-Location $ExistingRoot

git rev-parse HEAD | Tee-Object (Join-Path $ExistingEvidence "baseline-commit.txt")
git status --short | Tee-Object (Join-Path $ExistingEvidence "baseline-status.txt")
php artisan about 2>&1 | Tee-Object (Join-Path $ExistingEvidence "baseline-about.txt")
composer show laravel/framework 2>&1 |
    Tee-Object (Join-Path $ExistingEvidence "baseline-framework.txt")
php artisan test 2>&1 | Tee-Object (Join-Path $ExistingEvidence "baseline-tests.txt")
.\vendor\bin\pint.bat --test 2>&1 |
    Tee-Object (Join-Path $ExistingEvidence "baseline-pint.txt")
php artisan route:list -v 2>&1 |
    Tee-Object (Join-Path $ExistingEvidence "baseline-routes.txt")

if (Test-Path ".\vendor\bin\phpstan.bat") {
    .\vendor\bin\phpstan.bat analyse 2>&1 |
        Tee-Object (Join-Path $ExistingEvidence "baseline-phpstan.txt")
}
```

Install the same tarball with the narrower `core` profile:

```powershell
npm install --save-dev $Tarball 2>&1 |
    Tee-Object (Join-Path $ExistingEvidence "npm-install.txt")

$ExistingLaraSkills = Join-Path $ExistingRoot "node_modules\.bin\laraskills.cmd"
& $ExistingLaraSkills install --profile core 2>&1 |
    Tee-Object (Join-Path $ExistingEvidence "laraskills-install.txt")
& $ExistingLaraSkills doctor 2>&1 |
    Tee-Object (Join-Path $ExistingEvidence "laraskills-doctor.txt")

git diff --name-status 2>&1 |
    Tee-Object (Join-Path $ExistingEvidence "installation-diff.txt")
```

Review `installation-diff.txt` before starting the maintenance task. Any
pre-existing file overwritten without an explicit, reviewed decision is a
failure and must not be hidden by continuing the scenario.

### LaraSkills Commands and Tools

Save the exact maintenance task as `existing/task-prompt.txt`, then run:

```powershell
$ExistingTask = "<exact real maintenance task>"

& $ExistingLaraSkills retrieve $ExistingTask --mode compact 2>&1 |
    Tee-Object (Join-Path $ExistingEvidence "retrieve-compact.md")
& $ExistingLaraSkills retrieve $ExistingTask --mode standard 2>&1 |
    Tee-Object (Join-Path $ExistingEvidence "retrieve-standard.md")
& $ExistingLaraSkills search "<targeted keywords>" --limit 10 --format json 2>&1 |
    Tee-Object (Join-Path $ExistingEvidence "search.json")
& $ExistingLaraSkills get "<canonical-id-from-search>" --include-content 2>&1 |
    Tee-Object (Join-Path $ExistingEvidence "knowledge-unit.md")
```

The coding agent must inspect the existing conventions before editing, write a
regression test first, keep the change bounded to the selected task, and state
where it followed existing project conventions instead of generic guidance.

Run final verification:

```powershell
php artisan test 2>&1 |
    Tee-Object (Join-Path $ExistingEvidence "final-tests.txt")
php artisan test --coverage --min=80 "<task-test-path>" 2>&1 |
    Tee-Object (Join-Path $ExistingEvidence "task-coverage.txt")
.\vendor\bin\pint.bat --test 2>&1 |
    Tee-Object (Join-Path $ExistingEvidence "final-pint.txt")
php artisan route:list -v 2>&1 |
    Tee-Object (Join-Path $ExistingEvidence "final-routes.txt")
composer audit 2>&1 |
    Tee-Object (Join-Path $ExistingEvidence "composer-audit.txt")

if (Test-Path ".\vendor\bin\phpstan.bat") {
    .\vendor\bin\phpstan.bat analyse 2>&1 |
        Tee-Object (Join-Path $ExistingEvidence "final-phpstan.txt")
}

git diff --stat 2>&1 |
    Tee-Object (Join-Path $ExistingEvidence "diff-stat.txt")
git diff 2>&1 |
    Tee-Object (Join-Path $ExistingEvidence "diff.patch")
git status --short 2>&1 |
    Tee-Object (Join-Path $ExistingEvidence "git-status.txt")
```

### Expected Evidence

- Proof that the project existed before Phase 17
- Baseline commit, status, framework version, tests, Pint, routes, and PHPStan
  output when available
- Exact selected maintenance task and why it represents real project work
- Tarball installation and LaraSkills `core` profile logs
- Installation-only diff, including any collision with existing skill, rule,
  hook, MCP, or agent files
- Healthy `doctor` output
- Compact and standard bundles, targeted search, and successful KU inspection
- RED regression test and final GREEN run
- Complete agent transcript and final code diff
- Before/after query count, response behavior, security behavior, or another
  task-specific metric
- Final tests, coverage, Pint, routes, PHPStan when present, and Composer audit
- List of unrelated files confirmed unchanged

### Pass/Fail Criteria

**PASS only when all are true:**

- The selected project is a real Laravel 13 project, not a Phase 17 fixture.
- Baseline health and pre-existing failures are recorded before installation.
- Package installation and the `core` profile do not silently overwrite
  unrelated application or tool configuration.
- The state file records `1.0.0-beta.15` and the intended profile.
- Retrieval is relevant to the actual maintenance task and fits the existing
  architecture.
- The regression test fails before the fix and passes afterward.
- All previously passing tests remain passing.
- The final implementation introduces no unrelated refactor or dependency.
- Pint does not regress; PHPStan does not regress when present.
- New or changed code has at least 80% coverage, with the measurement method
  recorded.
- Task-specific correctness, security, authorization, and performance criteria
  are met.

**FAIL when any required condition fails**, especially destructive installation,
unexplained configuration replacement, generic or misleading retrieval,
regressed tests/static analysis, or a broad rewrite of existing code.

## 3. OpenCode MCP Workflow Test

### Objective

Prove that OpenCode can launch the MCP adapter from the packed npm package on
Windows, discover exactly five read-only tools, use all five in a real Laravel
implementation workflow, and complete the task without falling back to the
LaraSkills CLI.

### Setup Steps

Create a separate Laravel 13 project or a clean worktree from an untouched
Laravel 13 baseline. Install the same tarball as a development dependency.

```powershell
$McpRoot = Join-Path $LabRoot "opencode-mcp-laravel"
$McpEvidence = Join-Path $EvidenceRoot "opencode-mcp"

composer create-project laravel/laravel $McpRoot "^13.0" --prefer-dist --no-interaction
Set-Location $McpRoot

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
}
if (-not (Test-Path "database\database.sqlite")) {
    New-Item -ItemType File -Path "database\database.sqlite" | Out-Null
}

php artisan key:generate --force
php artisan migrate --force

npm install --save-dev $Tarball

$McpScript = (Resolve-Path "node_modules\laraskills\scripts\laraskills-mcp.mjs").Path

git init
git add -A
git commit -m "chore: OpenCode MCP Laravel baseline"
```

Create a project-local `opencode.json`. Use escaped backslashes in JSON:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "laraskills": {
      "type": "local",
      "command": [
        "node",
        "C:\\path\\to\\opencode-mcp-laravel\\node_modules\\laraskills\\scripts\\laraskills-mcp.mjs"
      ],
      "enabled": true,
      "timeout": 10000,
      "environment": {
        "LARASKILLS_ROOT": "C:\\path\\to\\laraskills"
      }
    }
  },
  "permission": {
    "mcp_*": "allow"
  }
}
```

Verify the connection before running the agent:

```powershell
opencode mcp list 2>&1 |
    Tee-Object (Join-Path $McpEvidence "mcp-list.txt")
```

Expected status:

```text
laraskills    connected    [tools: 5]
```

### MCP Tools Expected to Be Used

The OpenCode transcript must show this workflow:

1. `retrieve_context_bundle` - retrieve a `standard` bundle for the exact task.
2. `validate_ecc` - confirm the intelligence graph is valid.
3. `search_ecc` - find targeted webhook, HMAC, replay-protection, queue, and
   testing knowledge.
4. `get_knowledge_unit` - inspect at least one ID returned by `search_ecc`.
5. `get_graph_context` - inspect prerequisites and related topics for that same
   KU.

The canonical ID returned by `search_ecc` must round-trip successfully through
both `get_knowledge_unit` and `get_graph_context`.

### Validation Task

Use this fixed OpenCode prompt:

```text
Use the connected laraskills MCP server before editing this Laravel 13 project.

First:
1. Call retrieve_context_bundle in standard mode for this task.
2. Call validate_ecc.
3. Call search_ecc for signed webhook HMAC verification, replay protection,
   idempotency, queued processing, and Pest tests.
4. Use one canonical ID returned by search_ecc with get_knowledge_unit.
5. Use the same ID with get_graph_context.
6. Do not call the laraskills CLI or read the LaraSkills checkout directly.

Then use TDD to implement POST /api/webhooks/orders:
- Verify an HMAC SHA-256 signature over the raw request body.
- Use timing-safe comparison.
- Reject timestamps outside a configurable five-minute tolerance.
- Prevent replay by storing a unique external event ID.
- Dispatch a queued job only after verification and replay checks pass.
- Read the signing secret from configuration; never commit a secret.
- Add Pest tests for valid, invalid signature, stale timestamp, duplicate event,
  and no-dispatch-on-failure behavior.

Run tests and Pint. In the final response, list every LaraSkills MCP tool call,
the selected canonical ID, and the guidance that affected the implementation.
```

Execute with a fixed model and retain logs:

```powershell
$Prompt = @"
<paste the exact validation task above>
"@

opencode run --model "<provider/model>" --dir $McpRoot `
    --message $Prompt --print-logs 2>&1 |
    Tee-Object (Join-Path $McpEvidence "opencode-run.txt")
```

Run final verification without repairing the first agent result:

```powershell
Set-Location $McpRoot
php artisan test 2>&1 |
    Tee-Object (Join-Path $McpEvidence "tests.txt")
php artisan test --coverage --min=80 2>&1 |
    Tee-Object (Join-Path $McpEvidence "coverage.txt")
.\vendor\bin\pint.bat --test 2>&1 |
    Tee-Object (Join-Path $McpEvidence "pint.txt")
php artisan route:list -v 2>&1 |
    Tee-Object (Join-Path $McpEvidence "routes.txt")
composer audit 2>&1 |
    Tee-Object (Join-Path $McpEvidence "composer-audit.txt")
git diff --stat 2>&1 |
    Tee-Object (Join-Path $McpEvidence "diff-stat.txt")
git diff 2>&1 |
    Tee-Object (Join-Path $McpEvidence "diff.patch")
git status --short 2>&1 |
    Tee-Object (Join-Path $McpEvidence "git-status.txt")
```

### Expected Evidence

- OpenCode version and exact model identifier
- Project-local `opencode.json` with secrets removed
- `opencode mcp list` showing `laraskills` connected with five tools
- Complete OpenCode log with timestamps
- Successful responses from all five MCP tools
- Search result ID and successful get/graph round trip
- No `npx laraskills`, `laraskills`, or direct knowledge-file fallback
- Exact prompt, agent summary, and selected guidance
- RED and GREEN test output
- Pint output, route list, Composer audit, and final diff
- No MCP timeout, stdio corruption, path-resolution error, or legacy-name leak

### Pass/Fail Criteria

**PASS only when all are true:**

- OpenCode starts the adapter from
  `node_modules\laraskills\scripts\laraskills-mcp.mjs`.
- The server connects within the configured 10-second timeout and exposes
  exactly five tools.
- All five expected tools are called and return valid, task-relevant results.
- A canonical ID from search resolves through both KU and graph tools.
- The agent uses MCP rather than CLI or direct repository-file retrieval.
- The resulting webhook implementation passes all required tests, coverage is
  at least 80%, and Pint passes.
- Signature verification is timing-safe, timestamp tolerance is configurable,
  replay protection is durable, and failed verification never dispatches work.
- No secret or local absolute path is committed.

**FAIL when any required condition fails**, including connection instability,
tool discovery mismatch, malformed MCP output, CLI fallback, irrelevant
retrieval, missing tool adoption, or an insecure implementation.

## 4. Release Candidate Readiness Checklist

Do not publish `1.0.0-rc.1` until every applicable item is checked.

### Real Usage

- [ ] Fresh Laravel Project Test is `PASS`.
- [ ] Existing Laravel Project Test is `PASS`.
- [ ] OpenCode MCP Workflow Test is `PASS`.
- [ ] All three scenarios used the same tarball and recorded SHA-256.
- [ ] Windows paths containing spaces worked for CLI, package install, and MCP.
- [ ] No required evidence is missing or classified as `BLOCKED`.

### Installation and Compatibility

- [ ] `minimal`, `core`, and `full` profile expectations are documented and
      match observed installation output.
- [ ] Fresh installation does not require undeclared files.
- [ ] Existing-project installation does not silently overwrite unrelated
      project or harness configuration.
- [ ] `.laraskills-state.json` is accurate.
- [ ] `laraskills setup` and `laraskills doctor` work with isolated Windows
      configuration.
- [ ] Preferred LaraSkills names are used; legacy Laravel ECC fallbacks are not
      required for normal operation.

### CLI and Knowledge Quality

- [ ] `retrieve`, `search`, `get`, `doctor`, and `validate` succeed from the
      packed package.
- [ ] Compact and standard retrieval are relevant to both real project tasks.
- [ ] Search returns copyable canonical IDs.
- [ ] Canonical IDs resolve consistently.
- [ ] Validation reports the expected beta.15 graph counts and zero integrity
      defects.
- [ ] No high-severity wrong, unsafe, or obsolete Laravel guidance was found.

### MCP and OpenCode

- [ ] OpenCode discovers exactly five read-only tools.
- [ ] All five tools work from the packed package.
- [ ] Search-to-get-to-graph round trip succeeds.
- [ ] First-start connection is reliable within 10 seconds on Windows.
- [ ] MCP logs contain no protocol noise on stdout.
- [ ] OpenCode completes a real task using MCP without CLI fallback.

### Generated Laravel Quality

- [ ] Scenario tests pass.
- [ ] TDD RED and GREEN evidence exists.
- [ ] New or changed scenario code has at least 80% coverage.
- [ ] Pint passes.
- [ ] PHPStan does not regress where present.
- [ ] Composer audit has no unresolved advisory.
- [ ] Authorization, validation, rate limiting, secret handling, mass
      assignment, SQL injection, XSS, CSRF, and error disclosure were reviewed
      where applicable.
- [ ] No unnecessary repository abstraction or unrelated refactor was added.

### Package and Repository Gates

- [ ] All discovered Phase 17 defects are triaged with severity, reproduction,
      owner, and disposition.
- [ ] No open critical or high-severity defect remains.
- [ ] Medium-severity deferrals are explicitly documented and accepted.
- [ ] `npm ci` passes.
- [ ] `npm test` passes.
- [ ] `npm run benchmark` passes.
- [ ] `npm run verify:packed-install` passes.
- [ ] `npm run verify:mcp` passes.
- [ ] `npm run verify:clean-clone` passes.
- [ ] GitHub Actions is green on Windows, Ubuntu, and macOS for supported Node
      versions.
- [ ] The final repository diff contains only reviewed, intentional changes.
- [ ] No secret, machine-specific path, generated application, or raw private
      project artifact is committed.

### RC Publication Gate

- [ ] A Phase 17 final report links every evidence item and gives an explicit
      `GO` decision.
- [ ] Release notes describe validated workflows and known limitations.
- [ ] The package contents are reviewed with `npm pack --dry-run`.
- [ ] The version remains `1.0.0-beta.15` until Phase 17 receives `GO`.
- [ ] Only after `GO`, a separate release-preparation change updates the version
      to `1.0.0-rc.1`.
- [ ] `npm publish --dry-run` succeeds for the release-candidate package.
- [ ] No actual publish or tag occurs until the release-preparation review is
      approved.

## Completion Rule

Phase 17 is complete only when the three scenario results and the release
candidate checklist are backed by reproducible evidence. Passing package unit
tests alone is not sufficient; the decision must be based on observed behavior
inside fresh and existing Laravel applications and a live OpenCode MCP session.
