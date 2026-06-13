# MCP Troubleshooting

## "OpenCode cannot connect to laraskills"

**Symptom:** `opencode mcp list` shows `laraskills    failed`.

**Cause:** The server exited before completing the MCP `initialize` handshake, or stderr contains a fatal error.

**Fix:**

1. Run the server manually to see the error:
   ```powershell
   node scripts\laraskills-mcp.mjs
   ```
2. Confirm the path to the script is absolute (no relative paths inside `opencode.json`).
3. Confirm the `LARASKILLS_ROOT` environment variable points to a directory that contains `intelligence/json/knowledge-units.json`.

## "LaraSkills intelligence files were not found"

**Symptom:** Every tool call returns `isError: true` with the message starting `LaraSkills intelligence files were not found.`

**Cause:** The server could not resolve a directory that contains `intelligence/json/` using (in order): `--laraskills-root` flag, `LARASKILLS_ROOT` env var, current working directory, or parent-directory discovery.

**Fix:**

- Set `LARASKILLS_ROOT` to the laraskills repo path in your OpenCode `mcp.laraskills.environment` block.
- Or pass `--laraskills-root` explicitly in the `command` array.
- Or `cd` into the laraskills repo before running OpenCode.

Example actionable error text:

```
LaraSkills intelligence files were not found.
Explicit --laraskills-root path failed: C:\bad\path
Set LARASKILLS_ROOT to the full LaraSkills repository path:
  LARASKILLS_ROOT=C:\path\to\laraskills
or start the MCP server with:
  node scripts/laraskills-mcp.mjs --laraskills-root C:\path\to\laraskills
```

## "MCP server starts but every tool returns an error"

**Symptom:** The Inspector or OpenCode shows the server as connected, but every tool call errors out with the same message as above.

**Cause:** Same as above — the server started, but `findEccRoot` failed at startup. The server intentionally stays up so agents can see the actionable error inline.

**Fix:** Same as above — set `LARASKILLS_ROOT` or `--laraskills-root`.

## "Tool returns isError: 'Knowledge unit not found: ...'"

**Symptom:** A specific `get_knowledge_unit` or `get_graph_context` call returns `isError: true`.

**Cause:** The `id` argument does not match any canonical KU.

**Fix:** Use `search_ecc` to discover a valid ID, or look it up in `intelligence/indexes/knowledge-unit-index.md`.

## "Timeout when OpenCode connects"

**Symptom:** OpenCode reports a timeout when launching the laraskills MCP server.

**Cause:** The default 5000 ms is not enough for first-startup catalog load on Windows.

**Fix:** Set `timeout: 10000` (or higher) in the MCP config:

```jsonc
"laraskills": {
  "type": "local",
  "command": ["node", "C:\\path\\to\\laraskills\\scripts\\laraskills-mcp.mjs"],
  "enabled": true,
  "timeout": 10000,
  "environment": { "LARASKILLS_ROOT": "C:\\path\\to\\laraskills" }
}
```

## "Inspector shows non-JSON output on stdout"

**Symptom:** The Inspector warns that it cannot parse the server's stdout.

**Cause:** Some custom startup code wrote to `stdout` (the protocol channel).

**Fix:** This should not happen with the shipped `scripts/laraskills-mcp.mjs` — the stdio-cleanliness test enforces it. If you fork the server, never use `console.log`; use `console.error` or `process.stderr.write` instead.

## "Module not found" when starting the server

**Symptom:** `Error: Cannot find module '@modelcontextprotocol/sdk/server/mcp.js'`.

**Cause:** The npm dependencies are not installed in the laraskills checkout.

**Fix:**

```powershell
cd C:\path\to\laraskills
npm install
```

## "Permission denied" / "EPERM" on Windows

**Symptom:** The MCP server fails to spawn on Windows.

**Fix:**

- Run OpenCode in a shell that has execute permission for `node` (PowerShell 5.1+ works).
- Avoid mounting the laraskills repo under a OneDrive-synced folder that locks files.
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
npx laraskills retrieve "Build a CRUD API" --mode compact
npx laraskills search "Sanctum" --limit 5
npx laraskills validate
```

CLI and MCP semantics are identical — they call the same core functions.
