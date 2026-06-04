# Knowledge Packaging Recommendation

**Date:** 2026-06-04
**Repository:** laravel-ecc@1.0.0-beta.7

---

## Current Situation

```
npm pack --dry-run
  package size:   196.6 kB (compressed)
  unpacked size:  679.5 kB
  total files:    112
```

The knowledge layer (`knowledge/`, `intelligence/`, `agent/`, `docs/`, `meta/`) is **not included** in the npm package. The `package.json` `files` field explicitly scopes to:

- `skills/`, `rules/`, `agents/` — core AI content
- `commands/`, `hooks/`, `mcp-configs/` — CLI harness
- `.opencode/`, `.claude/`, `.cursor/` — AI configs
- `scripts/`, `install.*`, `update.*` — tooling
- `AGENTS.md`, `CLAUDE.md`, `README.md`, `VERSION`

---

## Option A: Include Knowledge Layer in Main Package

| Metric | Current | With Knowledge |
|--------|---------|----------------|
| Compressed size | 196.6 kB | ~25–35 MB |
| Unpacked size | 679.5 kB | ~70–80 MB |
| File count | 112 | ~10,000+ |
| Install time | <1s | 30–60s |
| npm publish | Simple | Complex (size limits) |

**npm size limit:** npm packages have a 50 MB compressed upload limit and a 250 MB unpacked size limit. Including the full knowledge layer would approach these limits.

**Verdict:** ❌ Not recommended. Package becomes impractical to install and publish.

---

## Option B: Keep Current (Lightweight Package + Git Clone)

| Aspect | Rating |
|--------|--------|
| Install speed | ✅ Fast (<1s) |
| Knowledge access | ❌ Requires separate Git clone |
| Update complexity | ✅ Single source of truth |
| CI/CD integration | ✅ Easy (npm install) |
| User experience | ⚠️ Requires two-step setup |

**Verdict:** ✅ Recommended as default approach. Good for most users.

---

## Option C: Separate Optional Package (`laravel-ecc-knowledge`)

| Aspect | Rating |
|--------|--------|
| Install speed | ⚠️ Moderate (npm install laravel-ecc-knowledge) |
| Knowledge access | ✅ Available via npm |
| Update complexity | ⚠️ Two packages to version |
| CI/CD integration | ✅ Both packages available via npm |
| Maintenance burden | ⚠️ Two repos/packages to maintain |

**Verdict:** ⚠️ Viable but adds maintenance overhead. Consider if knowledge layer has independent consumers.

---

## Recommendation

### Primary: Option B (Keep Current)

Keep `laravel-ecc` as a lightweight CLI/agent-config package (196 kB). Document that the knowledge layer requires a Git clone.

### Secondary: GitHub Release Artifact

Publish the knowledge layer as a downloadable `.zip` artifact with each GitHub release:

```
laravel-ecc-knowledge-v1.0.0-beta.7.zip
  └── knowledge/
  └── intelligence/
  └── agent/
  └── docs/
  └── meta/
```

Add a CLI command to download and extract:

```bash
laravel-ecc knowledge install
```

This provides the best experience:
- Package stays lightweight (196 kB, <1s install)
- Knowledge is available on-demand (~30s download)
- Single versioning and release process
- No separate package to maintain

### Future Considerations

If knowledge layer consumers grow independently:
- Split into `laravel-ecc-knowledge` package on npm
- Or provide knowledge as a CDN-hosted JSON API
- Or use Git submodules for monorepo setups
