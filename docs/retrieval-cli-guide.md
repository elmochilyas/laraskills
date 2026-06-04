# ECC Retrieval CLI Guide

## Overview

The retrieval CLI provides deterministic, explainable access to the Laravel ECC knowledge system. It is designed for both AI coding agents and human developers.

## Prerequisites

- Node.js >= 18
- The Laravel ECC repository cloned locally (for intelligence JSON files)

## Installation

The retrieval commands are part of the `laravel-ecc` package. The npm package does not include intelligence files.

### Usage from GitHub Clone

```bash
# Clone the repository
git clone https://github.com/elmochilyas/laravel-ecc.git
cd laravel-ecc

# Run retrieval commands from the repo root
npx laravel-ecc retrieve "your task"
```

### Usage from Any Directory

```bash
# Point to the cloned repo
npx laravel-ecc retrieve "your task" --ecc-root C:\path\to\laravel-ecc

# Or set environment variable
set ECC_ROOT=C:\path\to\laravel-ecc
npx laravel-ecc retrieve "your task"
```

## Commands

### `retrieve`

Get a full ECC context bundle for a task.

```bash
npx laravel-ecc retrieve "Build a multi-tenant REST API using Sanctum and queued notifications"

npx laravel-ecc retrieve "Optimize an N+1 query" --mode compact

npx laravel-ecc retrieve "Add vector search with PostgreSQL" --format json

npx laravel-ecc retrieve "Fix slow database queries" --mode deep --max-kus 15
```

**Options:**

| Option | Default | Description |
|---|---|---|
| `--mode` | `standard` | Bundle size: `compact`, `standard`, or `deep` |
| `--format` | `markdown` | Output format: `markdown` or `json` |
| `--ecc-root <path>` | (auto) | Path to laravel-ecc repository |
| `--max-kus <n>` | 10 | Max knowledge units |
| `--max-rules <n>` | 5 | Max rules |
| `--max-skills <n>` | 5 | Max skills |
| `--max-related <n>` | 5 | Max related topics |
| `--max-prerequisites <n>` | 5 | Max prerequisites |
| `--prerequisite-depth <n>` | 1 | Graph expansion depth |
| `--related-depth <n>` | 1 | Graph expansion depth |
| `--budget <n>` | 4096 | Estimated token budget |

### `search`

Search for knowledge units.

```bash
npx laravel-ecc search "Policies versus Gates"

npx laravel-ecc search "Sanctum tenant authentication" --limit 20

npx laravel-ecc search "database indexing" --domain data-storage-systems --format json
```

### `get`

Inspect a specific knowledge unit.

```bash
npx laravel-ecc get security-identity-engineering/authentication/sanctum-spa-authentication

npx laravel-ecc get data-storage-systems/indexes/composite-indexes --include-content

npx laravel-ecc get ai-intelligence-systems/rag-retrieval-augmented-generation/rag-architecture-fundamentals --format json
```

### `prerequisites`

Show prerequisite chain for a knowledge unit.

```bash
npx laravel-ecc prerequisites data-storage-systems/sharding/hash-based-sharding

npx laravel-ecc prerequisites data-storage-systems/indexes/composite-indexes --depth 2
```

### `related`

Show related topics for a knowledge unit.

```bash
npx laravel-ecc related ai-intelligence-systems/rag-retrieval-augmented-generation/rag-pipeline

npx laravel-ecc related security-identity-engineering/authentication/sanctum-spa-authentication --limit 20
```

### `validate`

Validate the intelligence layer's structural integrity.

```bash
npx laravel-ecc validate

npx laravel-ecc validate --format json
```

## Retrieval Modes

### Compact Mode

Best for quick agent routing. Returns:
- Top domains
- Top 5 KUs
- Essential rules and skills
- Top checklist
- Source paths
- Short explanations

### Standard Mode (Default)

Best for general use. Returns:
- Compact content
- Decision trees
- Anti-patterns
- Prerequisites
- Bounded related topics
- External concepts

### Deep Mode

Best for complex engineering research. Returns:
- Standard content
- Selected Markdown artifact content (in future)
- Expanded related topics
- Greater prerequisite depth

## Output Formats

### Markdown (default)

Human-readable, agent-friendly structured output with clear sections, bullet lists, and score annotations.

### JSON

Machine-readable, stable schema suitable for programmatic consumption and future MCP adapter integration.

## Exit Codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | Error or validation failure |
