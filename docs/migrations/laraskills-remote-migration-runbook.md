# LaraSkills Remote Migration Runbook

Run these steps only after the local preparation pull request is reviewed,
merged, and verified. None of these actions are part of local preparation.

## 1. Rename the GitHub Repository

Rename:

```text
elmochilyas/laravel-ecc
```

to:

```text
elmochilyas/laraskills
```

## 2. Update the Local Git Remote

```bash
git remote set-url origin https://github.com/elmochilyas/laraskills.git
git remote -v
```

## 3. Optionally Rename the Local Checkout

Rename the local folder from `laravel-ecc` to `laraskills` after all shells and
editors release the checkout.

## 4. Publish the New npm Package

```bash
npm publish --tag beta --access public
```

Confirm the published artifact is `laraskills@1.0.0-beta.15`.

## 5. Verify npm Install and CLI

```bash
npm install -g laraskills
laraskills --help
laraskills setup
laraskills doctor
laraskills validate
```

## 6. Verify LaraSkills MCP

```bash
laraskills-mcp
```

Verify initialization, `tools/list`, and `validate_ecc` through an MCP client.

## 7. Move npm Distribution Tags

After verification:

```bash
npm dist-tag add laraskills@1.0.0-beta.15 beta
npm dist-tag add laraskills@1.0.0-beta.15 latest
```

## 8. Create and Push the Release Tag

```bash
git tag v1.0.0-beta.15
git push origin v1.0.0-beta.15
```

## 9. Deprecate the Old npm Package

Only after the new package and binaries are verified:

```bash
npm deprecate "laravel-ecc@*" "laravel-ecc has moved to laraskills"
```

Do not deprecate the old package before the LaraSkills package, CLI, MCP
server, documentation, and repository redirect are confirmed.
