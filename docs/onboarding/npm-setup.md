# npm Setup

## Install

```bash
npm install -g laravel-ecc
```

Or install locally in a project:

```bash
npm install --save-dev laravel-ecc
```

## Configure ECC Root

The npm package contains the CLI and MCP adapter. Retrieval requires access to a full Laravel ECC checkout.

```bash
# Configure the path to your checkout
laravel-ecc setup --ecc-root "/path/to/laravel-ecc"

# Verify configuration
laravel-ecc doctor
```

### Windows PowerShell

```powershell
laravel-ecc setup --ecc-root "C:\path\to\laravel-ecc"
```

### Linux / macOS

```bash
laravel-ecc setup --ecc-root "/home/user/projects/laravel-ecc"
```

## ECC_ROOT Environment Variable

As an alternative to persisted configuration, set the `ECC_ROOT` environment variable:

```bash
# Windows (PowerShell)
$env:ECC_ROOT = "C:\path\to\laravel-ecc"

# Linux / macOS
export ECC_ROOT=/path/to/laravel-ecc
```

## Persisted Configuration

Configuration is saved to a user-level JSON file:

- **Windows:** `%APPDATA%\laravel-ecc\config.json`
- **Linux/macOS:** `~/.config/laravel-ecc/config.json` or `$XDG_CONFIG_HOME/laravel-ecc/config.json`

To update the path:

```bash
laravel-ecc setup --ecc-root "/new/path/to/laravel-ecc"
```

## Root Discovery Precedence

1. `--ecc-root <path>` CLI argument
2. `ECC_ROOT` environment variable
3. Persisted user configuration (`config.json`)
4. Current working directory and parent-directory walkup
5. Actionable error with fix instructions

## Next Steps

```bash
# Verify everything is healthy
laravel-ecc doctor

# Retrieve context for a Laravel task
laravel-ecc retrieve "Build a CRUD REST API with policies"

# Search knowledge units
laravel-ecc search "Sanctum authentication"

# Validate intelligence layer
laravel-ecc validate
```
