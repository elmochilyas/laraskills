# Knowledge Unit: Split Testing for Monorepo Packages

## Metadata
- **Subdomain:** Monorepo Management
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** monorepo-management/split-testing-monorepo-packages
- **Maturity:** Maturing
- **Related Technologies:** symplify/monorepo-split, Git, GitHub Actions, Composer

## Executive Summary

Split testing is the process of extracting specific subdirectories of a monorepo into their own independent Git repositories, enabling independent versioning, CI/CD, and distribution of each component. The primary tool is `symplify/monorepo-split`, which uses Git subtree operations to push a subdirectory's history to a target repository. Each split repository maintains its own full Git history (filtered to that subdirectory's changes) and can be versioned and released independently. In the Laravel ecosystem, split testing enables teams to develop multiple packages in a monorepo while publishing them as independent Composer packages to Packagist.

## Core Concepts

- **Split Repository:** A standalone Git repository derived from a monorepo subdirectory; contains the full history of files within that subdirectory
- **Git Subtree Split:** The underlying Git operation that creates a branch containing only the history of a specific subdirectory; the split tool automates this and pushes it to the target repository
- **Split Mapping:** A configuration that maps each monorepo subdirectory to its target repository URL; the split tool reads this mapping to determine where to push each package
- **Tag Convention:** A naming convention for monorepo tags that encodes which package they belong to (e.g., `package-name/1.2.3`); the split tool uses this to push only the relevant package's tag to its repository

## Mental Models

- **Split as Monorepo Release:** Splitting is how a monorepo package is "released" to its distribution channel; without splitting, the package exists only in the monorepo
- **Monorepo as Development Ground Truth:** The monorepo is the authoritative source; split repositories are derived artifacts that can be regenerated
- **Tags as Release Triggers:** A tag in the monorepo triggers the split and push to the package repository, which in turn triggers the package's CI and Packagist publication
- **Split as Compilation Step:** Think of splitting as "compiling" the monorepo into distributable packages—it's a mechanical transformation, not a logical change

## Internal Mechanics

1. **Split Configuration:** `split-monorepo.php` (or similar config) defines directory → repository mappings: `'packages/laravel-api' => 'git@github.com:org/laravel-api.git'`, `'packages/laravel-admin' => 'git@github.com:org/laravel-admin.git'`.
2. **Split Execution:** Running `vendor/bin/monorepo-split` iterates each mapping, performs `git subtree split --prefix=packages/package-name --branch=split-branch`, then pushes `split-branch` to the target repository's main/default branch.
3. **Tag-Based Split:** When a tag like `laravel-api/1.2.3` is created in the monorepo, the split tool detects the tag prefix (`laravel-api/`), performs a subtree split for that package, creates the tag in the target repository, and pushes both the branch and the tag.
4. **History Preservation:** The split uses `git subtree split --rejoin` to maintain a squashed history that doesn't include the full monorepo history but preserves meaningful commits for the specific package.
5. **GitHub Action Integration:** A GitHub Action runs on tag push, executes the split, and pushes to all target repositories. Each target repository's CI then triggers on the push, running the package's test suite before publishing.

## Patterns

- **Tag-Triggered Split Pattern:** Only split on tag pushes (not on every commit). Tag convention: `{package-name}/{semver}`. This keeps split operations infrequent and intentional.
- **CI-Validated Split Pattern:** Before splitting, run CI on the monorepo to validate that all packages are consistent. Only proceed with the split if monorepo CI passes.
- **Split Validation Pattern:** After splitting, clone each target repository and verify: the expected files exist, the package structure is complete, and the `composer.json` is valid.
- **Protected Split Destination Pattern:** Protect the main branch of all split repositories; force-pushes from the monorepo are the only changes allowed. This prevents accidental commits directly to the split repo.
- **Scheduled Split Pattern:** For teams that don't use tag-driven releases, run the split on a schedule (nightly) to push the latest development state to split repositories.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Split trigger | Tag push vs commit push vs schedule | Tag push for releases; schedule for nightly dev builds |
| Split tool | symplify/monorepo-split vs git-subtree vs custom | symplify/monorepo-split for automated CI workflows |
| Tag convention | `{name}/{version}` vs `v{version}` vs `{name}-v{version}` | `{name}/{version}` (standard in symfony ecosystem) |
| Split branch | main vs develop vs separate split branch | main (the split repo's default branch) |
| Force push policy | Always allow vs never allow vs on tags only | Allow force pushes from the split tool only; disable direct pushes |

## Tradeoffs

- **Split History vs Clean History:** `git subtree split` with `--rejoin` creates merge commits in the monorepo to track split state; these can clutter the Git history. Squash splitting reduces history quality but keeps the monorepo clean.
- **Split Speed vs Frequency:** Splitting a large monorepo (10+ packages, 1000+ commits) takes 5-30 minutes. Frequent splits waste CI time; infrequent splits delay package releases.
- **Monorepo Dependency vs Split Independence:** Packages developed in the monorepo may depend on each other during development, but split packages are independent and cannot have monorepo-internal dependencies. Ensure split packages resolve their dependencies from Packagist.
- **Shared CI vs Separate CI:** Monorepo CI tests all packages together; split repos have their own CI. A split package's CI may pass (the package alone works) when monorepo CI fails (cross-package interaction broken). Coordinate CI expectations.

## Performance Considerations

- **Split Duration:** The primary bottleneck. For each package, `git subtree split` processes the full Git history. A monorepo with 5000 commits and 10 packages takes 10-30 minutes per split operation.
- **Monorepo History Growth:** Each split operation adds merge commits to track split state, growing the monorepo history. Over time, this increases clone and split times.
- **CI Runner Resources:** Split operations are CPU and I/O intensive. Dedicate adequate CI runner resources (4+ CPUs, SSD storage) for split jobs.
- **Frequency Optimization:** Run the split once per successful release (not per commit). For teams releasing weekly, the split runs once per week. For daily releases, consider automating the split as part of the release pipeline.

## Production Considerations

- **Authentication:** The split tool needs SSH key or GitHub token with push access to all split repositories. Use deploy keys per repository or a machine user with repository-scoped access tokens.
- **Split Failure Recovery:** If a split fails for one package (e.g., network error), the remaining packages should still split successfully. Design the split script to be resilient per-package: fail one, continue others.
- **Repository Consistency:** After a split, the split repository should be an exact mirror of the monorepo subdirectory. Verify this with a diff after each split. Any mismatch indicates a configuration error.
- **CI/CD Chain:** Monorepo tag → split → split repo pushes → split repo CI → Packagist (or private registry) publication. Automate the entire chain to ensure no manual steps between development and distribution.

## Common Mistakes

- **Splitting on every commit:** Every push triggers a split, overwhelming the CI system; use tag-based or scheduled triggers
- **No split validation:** The split succeeds but the package is missing files (wrong split prefix) or has broken autoloading; validate post-split
- **Conflicting tag names:** Two packages in the monorepo create tags with the same version (e.g., both `v1.0.0`); use prefix-based tags to distinguish
- **Splitting without CI pass:** Splitting a broken package and pushing to the distribution repo breaks downstream consumers; only split on green CI
- **Manual changes to split repos:** Someone commits directly to a split repository; the next split overwrites or conflicts with the manual change; protect split repo branches

## Failure Modes

- **Split Timeout:** Large monorepo with extensive history causes the `git subtree split` operation to timeout (30+ minutes). Mitigate: limit split history depth with `--annotate` or use shallow monorepo clones for splitting.
- **Split Conflict:** A force push to the monorepo or a complex rebase creates a situation where the split operation can't cleanly extract the subdirectory history. Mitigate: avoid rebasing pushed commits in the monorepo; use `git subtree split --rejoin` to maintain split consistency.
- **Authentication Failure:** Deploy key expired or GitHub token revoked; split push fails silently. Mitigate: pre-validate authentication before the split operation; monitor split failure logs.
- **Split Repository Divergence:** Two split operations happen concurrently (rare with proper locking) or from different monorepo states, causing the split repository to alternate between states. Mitigate: serialize split operations with a queue or lock mechanism.

## Ecosystem Usage

- **Symfony Framework:** The reference implementation for monorepo split testing; Symfony splits 50+ components from their monorepo using custom split scripts
- **Laravel Ecosystem:** Less common than in Symfony but used by several multi-package Laravel organizations for internal tooling distribution
- **Doctrine:** Uses split testing for their monorepo of ORM, DBAL, and common packages
- **symplify/monorepo-split:** The most popular tool in the PHP ecosystem for monorepo split testing; used by the Symplify project itself and several open-source PHP projects

## Related Knowledge Units

- laravel-monorepo-tools
- monorepo-ci-optimization
- composer-path-repository-usage
- dependency-management-across-monorepo

## Research Notes

- Split testing is an advanced monorepo pattern; most Laravel teams using monorepos do not implement split testing and instead publish packages manually from the monorepo
- The symplify/monorepo-split tool has evolved significantly from the original monorepo-builder; the split-only tool is simpler and more reliable
- Git subtree split is the only reliable Git operation for this purpose; no equivalent exists in Mercurial or other VCS
- The overhead of maintaining split configuration and CI is justified only when packages need independent versioning and distribution; teams that release all packages together can skip split testing
