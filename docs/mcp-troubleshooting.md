# MCP Troubleshooting

## "OpenCode cannot connect to laravel-ecc"

**Symptom:** `opencode mcp list` shows `laravel-ecc    failed`.

**Cause:** The server exited before completing the MCP `initialize` handshake, or stderr contains a fatal error.

**Fix:**

1. Run the server manually to see the error:
   ```powershell
   node scripts\laravel-ecc-mcp.mjs
   ```
2. Confirm the path to the script is absolute (no relative paths inside `opencode.json`).
3. Confirm the `ECC_ROOT` environment variable points to a directory that contains `intelligence/json/knowledge-units.json`.

## "ECC intelligence files were not found"

**Symptom:** Every tool call returns `isError: true` with the message starting `ECC intelligence files were not found.`

**Cause:** The server could not resolve a directory that contains `intelligence/json/` using (in order): `--ecc-root` flag, `ECC_ROOT` env var, current working directory, or parent-directory discovery.

**Fix:**

- Set `ECC_ROOT` to the laravel-ecc repo path in your OpenCode `mcp.laravel-ecc.environment` block.
- Or pass `--ecc-root` explicitly in the `command` array.
- Or `cd` into the laravel-ecc repo before running OpenCode.

Example actionable error text:

```
ECC intelligence files were not found.
Explicit --ecc-root path failed: C:\bad\path
Set ECC_ROOT to the full Laravel ECC repository path:
  ECC_ROOT=C:\path\to\laravel-ecc
or start the MCP server with:
  node scripts/laravel-ecc-mcp.mjs --ecc-root C:\path\to\laravel-ecc
```

## "MCP server starts but every tool returns an error"

**Symptom:** The Inspector or OpenCode shows the server as connected, but every tool call errors out with the same message as above.

**Cause:** Same as above — the server started, but `findEccRoot` failed at startup. The server intentionally stays up so agents can see the actionable error inline.

**Fix:** Same as above — set `ECC_ROOT` or `--ecc-root`.

## "Tool returns isError: 'Knowledge unit not found: ...'"

**Symptom:** A specific `get_knowledge_unit` or `get_graph_context` call returns `isError: true`.

**Cause:** The `id` argument does not match any canonical KU.

**Fix:** Use `search_ecc` to discover a valid ID, or look it up in `intelligence/indexes/knowledge-unit-index.md`.

## "Timeout when OpenCode connects"

**Symptom:** OpenCode reports a timeout when launching the laravel-ecc MCP server.

**Cause:** The default 5000 ms is not enough for first-startup catalog load on Windows.

**Fix:** Set `timeout: 10000` (or higher) in the MCP config:

```jsonc
"laravel-ecc": {
  "type": "local",
  "command": ["node", "C:\\path\\to\\laravel-ecc\\scripts\\laravel-ecc-mcp.mjs"],
  "enabled": true,
  "timeout": 10000,
  "environment": { "ECC_ROOT": "C:\\path\\to\\laravel-ecc" }
}
```

## "Inspector shows non-JSON output on stdout"

**Symptom:** The Inspector warns that it cannot parse the server's stdout.

**Cause:** Some custom startup code wrote to `stdout` (the protocol channel).

**Fix:** This should not happen with the shipped `scripts/laravel-ecc-mcp.mjs` — the stdio-cleanliness test enforces it. If you fork the server, never use `console.log`; use `console.error` or `process.stderr.write` instead.

## "Module not found" when starting the server

**Symptom:** `Error: Cannot find module '@modelcontextprotocol/sdk/server/mcp.js'`.

**Cause:** The npm dependencies are not installed in the laravel-ecc checkout.

**Fix:**

```powershell
cd C:\path\to\laravel-ecc
npm install
```

## "Permission denied" / "EPERM" on Windows

**Symptom:** The MCP server fails to spawn on Windows.

**Fix:**

- Run OpenCode in a shell that has execute permission for `node` (PowerShell 5.1+ works).
- Avoid mounting the laravel-ecc repo under a OneDrive-synced folder that locks files.
- Confirm that the path in `opencode.json` does not contain a trailing backslash inside the JSON string (use `\\` escaping).

## Tests fail with "EADDRINUSE" or process-leak warnings

**Cause:** A previous test process did not close cleanly.

**Fix:** `node --test` uses a fresh subprocess for every test transport, so this is rare. If you see it, run the test file in isolation:

```powershell
node --test tests/retrieval/mcp.test.mjs
```

## CLI fallback

If MCP integration is not available, use the CLI directly:

```bash
npx laravel-ecc retrieve "Build a CRUD API" --mode compact
npx laravel-ecc search "Sanctum" --limit 5
npx laravel-ecc validate
```

CLI and MCP semantics are identical — they call the same core functions.
