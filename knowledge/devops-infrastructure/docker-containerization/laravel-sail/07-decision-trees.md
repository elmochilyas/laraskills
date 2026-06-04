# Decision Trees: Laravel Sail

## Local Development Approach

**Team OS distribution:**
- Mixed (Mac, Windows, Linux) → Sail provides consistent environment across all
- All Mac → Laravel Herd or Valet (lighter alternatives)
- All Linux → Native PHP or Sail (Docker optional)

**Production environment:**
- Docker-based → Sail ensures development-production parity
- Forge-managed → Sail still useful for dependency standardization
- Serverless → Sail for local, Cloud/Vapor CLI for production
