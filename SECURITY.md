# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest beta (`1.x`) | ✅ Supported |
| Older beta releases | ⚠️ Best-effort (no active backports) |

The latest beta release receives security updates. If you are on an older beta,
please upgrade to the latest version first.

## Reporting a Vulnerability

LaraSkills uses **GitHub private vulnerability reporting**. To report a security
issue:

1. Go to the repository's **Security** tab.
2. Click **Report a vulnerability**.
3. Fill in the details (see below).

We do not currently monitor a dedicated security email — please use the GitHub
Security tab.

### What to include

To help us triage and fix the issue quickly, please include:

- The affected version(s) of LaraSkills.
- A clear description of the vulnerability and its impact.
- Steps to reproduce the issue (minimal reproduction preferred).
- Any suggested fix or mitigation (optional).
- Relevant logs, stack traces, or proof-of-concept code (redact any secrets).

### Response process

| Step | Expected timeline |
|------|-------------------|
| Acknowledgment | Within 48 hours of submission |
| Initial assessment | Within 5 business days |
| Fix timeline | Communicated after assessment |
| Disclosure | Coordinated after a fix is released |

We will keep you informed throughout the process and coordinate disclosure
timing with you.

## Scope

The following are **in scope** for security reports:

- The LaraSkills CLI (`laraskills` and `laraskills-mcp` commands)
- The MCP server (`laraskills-mcp`)
- The retrieval engine and graph validation
- The `knowledge/` and `intelligence/` layer content
- The install, update, and setup scripts
- The operating-layer files installed into projects (`skills/`, `rules/`,
  `agents/`, `hooks/`, `mcp-configs/`)

The following are **out of scope**:

- The Laravel or PHP project code that consumes LaraSkills (that code is the
  user's responsibility)
- Third-party dependencies — report those to their respective maintainers
- Theoretical attacks with no practical impact
- Social engineering, phishing, or physical attacks against maintainers
- Vulnerabilities in outdated or unsupported versions

## Preferred languages

We prefer English for security reports. French or Arabic are also accepted.
