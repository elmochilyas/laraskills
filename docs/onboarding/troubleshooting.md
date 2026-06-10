# Troubleshooting

## ECC Root Not Found

**Symptom:** `laravel-ecc doctor` shows "Resolved ECC root: NOT FOUND"

**Fix:**
```bash
laravel-ecc setup --ecc-root "/path/to/laravel-ecc"
```

The path must point to the root of a full Laravel ECC checkout containing `intelligence/json/knowledge-units.json`.

## ECC_ROOT Invalid

**Symptom:** Settings like `ECC_ROOT=C:\path\to\laravel-ecc` but retrieval fails.

**Fix:** Verify the path contains `intelligence/json/knowledge-units.json`:

```bash
dir "$env:ECC_ROOT\intelligence\json\knowledge-units.json"
```

If the file is missing, you need the full repository:
```bash
git clone https://github.com/elmochilyas/laravel-ecc.git
```

## Persisted Config Malformed

**Symptom:** `laravel-ecc doctor` shows "Config ECC root: ERROR"

**Fix:** Delete the config file and rerun setup:

```bash
# Windows
del %APPDATA%\laravel-ecc\config.json

# Linux/macOS
rm ~/.config/laravel-ecc/config.json

# Rerun setup
laravel-ecc setup --ecc-root "/path/to/laravel-ecc"
```

## Intelligence Files Missing

**Symptom:** `laravel-ecc doctor` shows "Intelligence files: FAIL"

**Fix:** The configured ECC root is missing required files. Re-run:

```bash
laravel-ecc setup --ecc-root "/path/to/complete/laravel-ecc-checkout"
```

Required files: `knowledge-units.json`, `dependencies.json`, `relationships.json`, `rules.json`, `skills.json`, `checklists.json`, `anti-patterns.json`, `decision-trees.json` in `intelligence/json/`.

## MCP Server Cannot Resolve Root

**Symptom:** MCP server starts but every tool returns an error about missing intelligence files.

**Fix:** Set `ECC_ROOT` in the MCP environment block:

```jsonc
"environment": {
  "ECC_ROOT": "/path/to/laravel-ecc"
}
```

Or run `laravel-ecc setup` first so the persisted configuration is available.

## npm Package Installed but Retrieval Unavailable

**Symptom:** `laravel-ecc retrieve` fails with "ECC intelligence files were not found".

**Explanation:** The npm package is intentionally lightweight. It does not include the knowledge layer. Retrieval requires access to a full GitHub checkout.

**Fix:**
```bash
# Configure your checkout path
laravel-ecc setup --ecc-root "/path/to/laravel-ecc"

# Or set environment variable
export ECC_ROOT=/path/to/laravel-ecc
```

## Windows Path Quoting

When using MCP configuration on Windows, escape backslashes:

```jsonc
{
  "command": ["node", "C:\\path\\to\\laravel-ecc\\scripts\\laravel-ecc-mcp.mjs"],
  "environment": { "ECC_ROOT": "C:\\path\\to\\laravel-ecc" }
}
```

## Linux / macOS Path Quoting

No special escaping needed:

```jsonc
{
  "command": ["node", "/path/to/laravel-ecc/scripts/laravel-ecc-mcp.mjs"],
  "environment": { "ECC_ROOT": "/path/to/laravel-ecc" }
}
```

## How to Rerun Setup

```bash
laravel-ecc setup --ecc-root "/new/path/to/laravel-ecc"
```

This overwrites the previous configuration.

## How to Run Doctor

```bash
laravel-ecc doctor
```

This checks the full configuration and reports the resolution source and status.

## Clone the Full Repository

To clone the full repository with all intelligence files:

```bash
git clone https://github.com/elmochilyas/laravel-ecc.git
cd laravel-ecc
npm install
```

Then configure:

```bash
laravel-ecc setup --ecc-root "./laravel-ecc"
```
