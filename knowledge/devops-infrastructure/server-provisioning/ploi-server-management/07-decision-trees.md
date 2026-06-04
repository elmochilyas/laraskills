# Decision Trees: Ploi Server Management

## Forge vs Ploi Selection

**Does the team need Docker-native server management?**
- Yes → Choose Ploi
- No → Proceed

**Is the team already using Forge with Envoyer?**
- Yes → Stay with Forge (migration cost outweighs benefits)
- No → Proceed

**Is a free tier important for initial deployment?**
- Yes → Evaluate Ploi (free tier available)
- No → Evaluate both

**Is agent-based management preferred over SSH?**
- Yes → Choose Ploi
- No → Choose Forge

## Docker vs Traditional LEMP on Ploi

**Is the application already containerized for development?**
- Yes → Use Docker server setup on Ploi
- No → Proceed

**Does the team have Docker production experience?**
- Yes → Use Docker server setup
- No → Use traditional LEMP setup

**Are there non-PHP services that need containerization?**
- Yes → Use Docker server setup
- No → Traditional LEMP is sufficient
