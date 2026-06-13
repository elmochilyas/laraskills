# Troubleshooting

## LaraSkills Root Not Found

**Symptom:** `laraskills doctor` shows "Resolved LaraSkills root: NOT FOUND"

**Fix:**
```bash
laraskills setup --laraskills-root "/path/to/laraskills"
```

The path must point to the root of a full LaraSkills checkout containing `intelligence/json/knowledge-units.json`.

## LARASKILLS_ROOT Invalid

**Symptom:** Settings like `LARASKILLS_ROOT=C:\path\to\laraskills` but retrieval fails.

**Fix:** Verify the path contains `intelligence/json/knowledge-units.json`:

```bash
dir "$env:LARASKILLS_ROOT\intelligence\json\knowledge-units.json"
```

If the file is missing, you need the full repository:
```bash
git clone https://github.com/elmochilyas/laraskills.git
```

## Persisted Config Malformed

**Symptom:** `laraskills doctor` shows "Config LaraSkills root: ERROR"

**Fix:** Delete the config file and rerun setup:

```bash
# Windows
del %APPDATA%\laraskills\config.json

# Linux/macOS
rm ~/.config/laraskills/config.json

# Rerun setup
laraskills setup --laraskills-root "/path/to/laraskills"
```

## Intelligence Files Missing

**Symptom:** `laraskills doctor` shows "Intelligence files: FAIL"

**Fix:** The configured LaraSkills root is missing required files. Re-run:

```bash
laraskills setup --laraskills-root "/path/to/complete/laraskills-checkout"
```

Required files: `knowledge-units.json`, `dependencies.json`, `relationships.json`, `rules.json`, `skills.json`, `checklists.json`, `anti-patterns.json`, `decision-trees.json` in `intelligence/json/`.

## MCP Server Cannot Resolve Root

**Symptom:** MCP server starts but every tool returns an error about missing intelligence files.

**Fix:** Set `LARASKILLS_ROOT` in the MCP environment block:

```jsonc
"environment": {
  "LARASKILLS_ROOT": "/path/to/laraskills"
}
```

Or run `laraskills setup` first so the persisted configuration is available.

## npm Package Installed but Retrieval Unavailable

**Symptom:** `laraskills retrieve` fails with "LaraSkills intelligence files were not found".

**Explanation:** The npm package is intentionally lightweight. It does not include the knowledge layer. Retrieval requires access to a full GitHub checkout.

**Fix:**
```bash
# Configure your checkout path
laraskills setup --laraskills-root "/path/to/laraskills"

# Or set environment variable
export LARASKILLS_ROOT=/path/to/laraskills
```

## Windows Path Quoting

When using MCP configuration on Windows, escape backslashes:

```jsonc
{
  "command": ["node", "C:\\path\\to\\laraskills\\scripts\\laraskills-mcp.mjs"],
  "environment": { "LARASKILLS_ROOT": "C:\\path\\to\\laraskills" }
}
```

## Linux / macOS Path Quoting

No special escaping needed:

```jsonc
{
  "command": ["node", "/path/to/laraskills/scripts/laraskills-mcp.mjs"],
  "environment": { "LARASKILLS_ROOT": "/path/to/laraskills" }
}
```

## How to Rerun Setup

```bash
laraskills setup --laraskills-root "/new/path/to/laraskills"
```

This overwrites the previous configuration.

## How to Run Doctor

```bash
laraskills doctor
```

This checks the full configuration and reports the resolution source and status.

## Clone the Full Repository

To clone the full repository with all intelligence files:

```bash
git clone https://github.com/elmochilyas/laraskills.git
cd laraskills
npm install
```

Then configure:

```bash
laraskills setup --laraskills-root "./laraskills"
```
