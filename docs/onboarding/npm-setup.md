# npm Setup

## Install

```bash
npm install -g laraskills
```

Or install locally in a project:

```bash
npm install --save-dev laraskills
```

## Configure LaraSkills Root

The npm package contains the CLI and MCP adapter. Retrieval requires access to a full LaraSkills checkout.

```bash
# Configure the path to your checkout
laraskills setup --laraskills-root "/path/to/laraskills"

# Verify configuration
laraskills doctor
```

### Windows PowerShell

```powershell
laraskills setup --laraskills-root "C:\path\to\laraskills"
```

### Linux / macOS

```bash
laraskills setup --laraskills-root "/home/user/projects/laraskills"
```

## LARASKILLS_ROOT Environment Variable

As an alternative to persisted configuration, set the `LARASKILLS_ROOT` environment variable:

```bash
# Windows (PowerShell)
$env:LARASKILLS_ROOT = "C:\path\to\laraskills"

# Linux / macOS
export LARASKILLS_ROOT=/path/to/laraskills
```

## Persisted Configuration

Configuration is saved to a user-level JSON file:

- **Windows:** `%APPDATA%\laraskills\config.json`
- **Linux/macOS:** `~/.config/laraskills/config.json` or `$XDG_CONFIG_HOME/laraskills/config.json`

To update the path:

```bash
laraskills setup --laraskills-root "/new/path/to/laraskills"
```

## Root Discovery Precedence

1. `--laraskills-root <path>` CLI argument
2. `LARASKILLS_ROOT` environment variable
3. Persisted user configuration (`config.json`)
4. Current working directory and parent-directory walkup
5. Actionable error with fix instructions

## Next Steps

```bash
# Verify everything is healthy
laraskills doctor

# Retrieve context for a Laravel task
laraskills retrieve "Build a CRUD REST API with policies"

# Search knowledge units
laraskills search "Sanctum authentication"

# Validate intelligence layer
laraskills validate
```
