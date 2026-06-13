# Migrating from Laravel ECC to LaraSkills

## What Changed

Laravel ECC is now **LaraSkills**. The rebrand changes the npm package, primary
CLI and MCP binaries, repository URL, environment variables, and persisted user
config location. The Laravel knowledge and retrieval capabilities remain the
same.

## New npm Package

Replace:

```bash
npm install -g laravel-ecc
```

with:

```bash
npm install -g laraskills
```

The new package starts at `laraskills@1.0.0-beta.15`.

## New CLI Commands

Use `laraskills` as the primary command:

```bash
laraskills setup --laraskills-root /path/to/laraskills
laraskills doctor
laraskills validate
laraskills retrieve "Build tenant-isolated CRUD endpoints"
laraskills search "tenant isolation"
```

`--ecc-root` remains a deprecated alias for `--laraskills-root` during the
compatibility window.

## New MCP Configuration

Use the `laraskills` server label and the renamed MCP entrypoint:

```json
{
  "mcp": {
    "laraskills": {
      "type": "local",
      "command": [
        "node",
        "<checkout>/scripts/laraskills-mcp.mjs"
      ],
      "enabled": true,
      "environment": {
        "LARASKILLS_ROOT": "<checkout>"
      }
    }
  }
}
```

Global installations can use `laraskills-mcp`.

## New Environment Variables

Preferred variables:

```text
LARASKILLS_ROOT
LARASKILLS_CONFIG_DIR
```

Temporary fallbacks:

```text
ECC_ROOT
LARAVEL_ECC_CONFIG_DIR
```

Preferred variables take precedence. `laraskills doctor` reports when a legacy
fallback is active.

## Config File Migration

The preferred config locations are:

```text
Windows: %APPDATA%/laraskills/config.json
Unix:   ~/.config/laraskills/config.json
```

The preferred config shape is:

```json
{
  "laraskillsRoot": "/path/to/laraskills"
}
```

Existing files under `laravel-ecc/config.json` and the old `eccRoot` field are
read as fallbacks. Running the new setup command writes the preferred config.

Root resolution order:

1. `--laraskills-root`
2. `--ecc-root` legacy alias
3. `LARASKILLS_ROOT`
4. `ECC_ROOT` legacy fallback
5. new LaraSkills config
6. old Laravel ECC config
7. current-working-directory discovery
8. actionable failure

## Legacy Compatibility Window

`1.0.0-beta.15` exposes these temporary binary aliases:

```text
laravel-ecc
laravel-ecc-mcp
```

They invoke the new LaraSkills entrypoints. Legacy root variables, the old
config path, and `--ecc-root` are also supported temporarily. New integrations
should not use these aliases. Their eventual removal will be announced in a
future release.

## GitHub Repository Rename

The intended repository location is:

```text
https://github.com/elmochilyas/laraskills
```

The GitHub rename is a manual post-merge action. This local release-preparation
change does not rename the remote repository.

## Upgrade Steps

1. Install `laraskills@1.0.0-beta.15`.
2. Replace `laravel-ecc` commands with `laraskills`.
3. Replace `laravel-ecc-mcp` with `laraskills-mcp`.
4. Rename MCP server labels to `laraskills`.
5. Set `LARASKILLS_ROOT`.
6. Run `laraskills setup --laraskills-root <checkout>`.
7. Run `laraskills doctor`.
8. Run `laraskills validate`.
9. Remove old variables after all clients use the new names.

## Troubleshooting

Run:

```bash
laraskills doctor
```

If doctor reports a legacy fallback, migrate the reported flag, environment
variable, or config file. If no checkout is found, clone the full repository
and configure it with `--laraskills-root`. The npm package intentionally omits
the heavy knowledge and intelligence layers.
