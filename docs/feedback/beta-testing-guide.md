# Beta testing guide

This guide walks you through testing LaraSkills in a real Laravel project and providing actionable feedback.

## What is LaraSkills?

LaraSkills provides two layers of Laravel engineering support for AI coding agents:

1. **Operating layer** — Skills, rules, agents, hooks, and harness configurations that train your AI tool on Laravel 13 conventions and security patterns.
2. **Knowledge intelligence layer** — 2,321 curated knowledge units spanning 21 engineering domains, accessible through a deterministic CLI and MCP server.

## 1. Install LaraSkills in a Laravel project

### Prerequisites

- Node.js 18 or newer
- A Laravel 13 project (PHP 8.3+)
- Git (for the full knowledge checkout)

### Install the npm package

```bash
cd your-laravel-project
npm install --save-dev laraskills
```

### Install the operating layer

```bash
npx laraskills install --profile core
```

This writes skills, rules, agents, hooks, and MCP configs into your project.

### Set up retrieval (optional but recommended)

Retrieval requires a full Git checkout of the repository:

```bash
git clone https://github.com/elmochilyas/laraskills.git ../laraskills-source
npx laraskills setup --laraskills-root ../laraskills-source
```

Verify the setup:

```bash
npx laraskills doctor
```

Expected output includes `Status: HEALTHY`.

## 2. Run the diagnostic commands

All of these should complete without errors:

```bash
# Validate the knowledge graph
npx laraskills validate

# Retrieve guidance for a specific task
npx laraskills retrieve "Optimize Eloquent queries with eager loading" --mode compact

# Search for a knowledge unit
npx laraskills search "composite index" --domain data-storage-systems

# Inspect a specific knowledge unit
npx laraskills get \
  laravel-eloquent-domain-modeling/query-performance/n-plus-one \
  --include-content
```

## 3. Test LaraSkills with your AI tool

### With an AI coding agent

Open your Laravel project in your preferred AI coding tool. The installed operating layer files (skills, rules, agents, hooks) should automatically influence agent behavior.

If you configured the retrieval root, the agent can use `retrieve`, `search`, and `get` to fetch expert-level Laravel guidance during a session.

### With the MCP server

Add the MCP server to your editor or AI tool configuration:

```json
{
  "mcpServers": {
    "laraskills": {
      "command": "npx",
      "args": [
        "laraskills-mcp",
        "--laraskills-root", "/path/to/laraskills"
      ]
    }
  }
}
```

See [`docs/mcp-server-guide.md`](/docs/mcp-server-guide.md) for detailed setup instructions.

### What to try

- Build a CRUD feature with policies, Form Requests, API Resources, and Pest tests
- Optimize an Eloquent query with eager loading
- Design a multi-tenant data model
- Add Sanctum API authentication
- Write and run a database migration with composite indexes
- Secure a controller with authorization gates and policies

## 4. What feedback to report

We want to hear about everything, but these areas are especially valuable:

| Area | What to look for |
|------|-----------------|
| **Skills** | Did the agent follow the skill guidance? Was the advice correct for Laravel 13? |
| **Rules** | Did the AI tool respect the rules? Were any rules overly restrictive or incorrect? |
| **Agents** | Did the agent definitions steer the AI tool appropriately? |
| **Retrieval quality** | Did `retrieve` return relevant knowledge units? Were critical KUs missing? |
| **Installation** | Was `npx laraskills install` smooth? Any file conflicts? |
| **MCP server** | Did the MCP tools work in your editor/AI tool? |
| **Documentation** | Were instructions clear and complete? |
| **Performance** | How fast were retrieval and validation commands? |

### What to include in your report

- LaraSkills version (`npx laraskills --version`)
- Node.js version (`node --version`)
- Operating system
- AI coding tool and version
- Installation profile used (`minimal`, `core`, `full`)
- Output of `npx laraskills doctor` (if available)
- Output of `npx laraskills validate --format json` (if available)
- Steps to reproduce any issues
- Screenshots or logs if relevant

## 5. How to submit feedback

Open an issue on the [GitHub repository](https://github.com/elmochilyas/laraskills/issues/new/choose):

- **Bug report** — Something is broken or behaves unexpectedly.
- **Feature request** — Something missing that would improve the project.
- **Beta feedback** — General testing experience, survey-style feedback.

See the [tester checklist](tester-checklist.md) for a structured walkthrough before filing.
