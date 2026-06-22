const msg = `
  LaraSkills installed.
  Project setup: npx laraskills init
  Diagnostics: npx laraskills doctor
  Retrieval: npx laraskills retrieve "<task>"
  MCP server: npx laraskills-mcp

  No manual clone required. Packaged intelligence is ready.
  Run "laraskills setup --help" for advanced custom source override.
`;
process.stdout.write(msg);
