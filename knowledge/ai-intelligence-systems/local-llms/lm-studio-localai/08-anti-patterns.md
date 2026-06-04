# Anti-Patterns: LM Studio & LocalAI

## Metadata

| Attribute | Value |
|-----------|-------|
| **ID** | KU-051 |
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Local LLM Development |
| **Type** | Implementation |
| **Version** | 1.0.0 |
| **Status** | Standardized |

## Anti-Pattern Inventory

1. [Using LM Studio in Production](#1-using-lm-studio-in-production)
2. [Running Without GPU Acceleration](#2-running-without-gpu-acceleration)
3. [Expecting Full OpenAI API Compatibility](#3-expecting-full-openai-api-compatibility)
4. [CORS Configuration Ignored](#4-cors-configuration-ignored)
5. [Port Conflicts from Multiple Local Tools](#5-port-conflicts-from-multiple-local-tools)

---

## 1. Using LM Studio in Production

### Category
Deployment Misuse

### Description
Installing LM Studio (a desktop GUI application designed for Windows/macOS development) on a production server and expecting it to function as a reliable inference server. LM Studio lacks production features: no API authentication, no process supervision, no headless mode, no clustering, no monitoring. It's designed for interactive model experimentation, not server workloads.

### Why It Happens
- Familiarity: developer used LM Studio for development, tries to use it in production
- "It works on my machine" mentality extended to deployment
- No understanding of production inference server requirements
- LM Studio's GUI makes it seem easier than setting up vLLM or TGI
- "Just run it and leave it" without considering reliability

### Warning Signs
- Production inference server runs on Windows (LM Studio is Windows-native)
- GUI is installed and running on a server that should be headless
- No API authentication on the inference endpoint
- No process supervisor (systemd, supervisord) managing the service
- Manual restart required after crashes
- No monitoring or health checks for the inference service

### Why Harmful
- No automatic recovery: if LM Studio crashes, AI features are down until manual restart
- No authentication: anyone on the network can use the inference API
- Windows Server licensing costs for what could be a Linux container
- GUI consumes resources that should be used for inference
- No production-grade observability

### Real-World Consequences
- LM Studio crashes after 6 hours due to memory leak; no auto-restart
- Internal network attacker uses unauthenticated LM Studio API for free inference
- Windows Server updates require GUI login, causing downtime
- Cannot scale: single instance, no load balancing

### Preferred Alternative
Use production-grade inference servers for deployment: vLLM, TGI, or LocalAI with proper orchestration. Keep LM Studio strictly for local development and model experimentation. Use Docker containers with process supervision.

### Refactoring Strategy
1. Replace LM Studio with vLLM or LocalAI in production
2. Configure API authentication on the inference endpoint
3. Set up process supervision (systemd, Docker restart policies)
4. Implement monitoring and health checks
5. Keep LM Studio for development workstations only

### Detection Checklist
- [ ] Production inference uses production-grade server (not LM Studio)
- [ ] API authentication is enabled
- [ ] Process supervision is configured
- [ ] Monitoring and health checks exist

### Related Rules/Skills/Trees
- Skill: Implement LM Studio & LocalAI

---

## 2. Running Without GPU Acceleration

### Category
Performance Failure

### Description
Running LM Studio or LocalAI on CPU-only hardware for interactive AI tasks. Without GPU acceleration, inference is 10-50x slower, making even small models (3B-7B) produce response times of 30 seconds or more. Features that require real-time interaction become unusable.

### Why It Happens
- Developer's machine has no compatible GPU (integrated graphics only)
- No awareness of the performance difference between CPU and GPU inference
- LM Studio defaults to CPU mode if no GPU is detected
- Assumption that "it's a small model, CPU should be fine"
- No benchmarking before committing to CPU-only workflow

### Warning Signs
- Response times >10 seconds for short outputs
- CPU usage at 100% during inference
- LM Studio shows "CPU" (not "CUDA" or "Metal") in the status
- Developer avoids using AI features because they're too slow
- Team members with GPU have significantly different experiences

### Why Harmful
- Unacceptable user experience for interactive AI features
- Developers cannot effectively test or iterate on prompts (too slow)
- Local AI development is abandoned because "it doesn't work"
- Team reverts to cloud models for development, losing cost benefits
- CPU-bound inference wastes electricity with minimal throughput

### Real-World Consequences
- 30-second response time for a 100-token response on CPU
- Developer gives up on local testing after waiting 2 minutes for a prompt iteration
- Team ships untested prompts because local testing takes too long
- $50/month in cloud API costs because local testing was too slow

### Preferred Alternative
Use GPU acceleration for LM Studio and LocalAI. If no GPU is available, use the smallest possible model (1-3B parameters) with maximum quantization. Consider cloud-based development testing as an alternative.

### Refactoring Strategy
1. Verify GPU compatibility: NVIDIA (CUDA), AMD (ROCm), Apple (Metal)
2. Configure LM Studio to use the correct GPU backend
3. If no GPU available, switch to a 1-3B parameter model
4. Use maximum quantization (Q4_K_M or IQ4_XS) for CPU
5. Consider native (non-Docker) inference for better CPU performance

### Detection Checklist
- [ ] GPU acceleration is verified and configured
- [ ] CPU-only environments use appropriately small models
- [ ] Response times meet acceptable latency thresholds
- [ ] GPU backend is correctly configured for the hardware

### Related Rules/Skills/Trees
- Skill: Implement LM Studio & LocalAI

---

## 3. Expecting Full OpenAI API Compatibility

### Category
Integration Assumption Failure

### Description
Assuming LM Studio or LocalAI exposes all OpenAI API features: tool calling, structured output, image inputs, streaming, embeddings. These features depend on the loaded model, not just the API server. A model that doesn't support tools will fail tool calls even though the API endpoint exists. Developers waste time debugging "broken" integrations that are actually model limitations.

### Why It Happens
- OpenAI API compatibility is marketed as a feature of both tools
- API endpoints exist for all features (even if model doesn't support them)
- Team tests with GPT-4o (supports everything) and assumes local works the same
- No model capability documentation checked before development
- Error messages from the inference server are often unhelpful

### Warning Signs
- Tool calling works in production (GPT-4) but fails locally
- Structured output fails with no clear error
- Image inputs are accepted but ignored or error
- Streaming works but with different format than expected
- Feature works on one local model but not another
- Developers say "the API is broken" when it's actually the model

### Why Harmful
- Developer time wasted debugging non-existent API issues
- False assumption that "local doesn't work" when it's just a model choice
- Features developed with cloud model, fail when tested locally
- Intermittent failures when switching between models
- Inconsistent development experience

### Real-World Consequences
- Developer spends 2 days debugging "broken tool calling" in LM Studio
- Feature ships with untested tool calling (tested locally, model didn't support it)
- Team abandons local testing because "it doesn't support our features"
- Local model chosen for speed, doesn't support structured output

### Preferred Alternative
Check model capabilities before expecting API feature support. Document which features work with which local models. Choose models that support required features. Test API features independently of model capabilities.

### Refactoring Strategy
1. Document API features required by the application
2. Match local models to required features
3. Test each API feature against the chosen local model
4. Implement graceful degradation for unsupported features
5. Provide clear error messages when a model doesn't support a feature

### Detection Checklist
- [ ] Local model supports required API features (tools, structured output)
- [ ] Feature compatibility matrix exists for local models
- [ ] Unsupported features degrade gracefully
- [ ] Error messages distinguish "API error" from "model doesn't support feature"

### Related Rules/Skills/Trees
- Skill: Implement LM Studio & LocalAI

---

## 4. CORS Configuration Ignored

### Category
Integration Failure

### Description
Not configuring Cross-Origin Resource Sharing (CORS) on the LM Studio API server when the Laravel application runs on a different origin (common with Sail on localhost vs. LM Studio on 127.0.0.1:1234). Browser-based requests from the Laravel frontend to the LM Studio API are blocked by CORS, appearing as mysterious network errors.

### Why It Happens
- CORS is a browser concept; API-focused developers may not think about it
- LM Studio's CORS settings default to restrictive (localhost only)
- Development often uses API clients (Postman) that don't enforce CORS
- Frontend developers notice the issue, backend doesn't
- "It works in curl" doesn't mean it works in the browser

### Warning Signs
- Network errors in browser DevTools: CORS-related
- Frontend can't reach the local inference endpoint
- "Connection refused" errors that work in curl/Postman
- Laravel app on localhost:80 can't reach LM Studio on localhost:1234
- No CORS configuration in LM Studio settings

### Why Harmful
- Frontend features that call AI directly from the browser fail
- Developers waste time debugging network issues that are CORS-related
- Browser-based AI demos don't work during development
- Team may implement unnecessary proxy workarounds
- Inconsistent: works in some tools, not in others

### Real-World Consequences
- Chat interface can't connect to local AI because of CORS
- Developer spends 3 hours debugging network before discovering CORS
- Team builds a PHP proxy just to bypass CORS
- Frontend AI features developed against cloud model only (CORS works in production)

### Preferred Alternative
Configure CORS in LM Studio settings to allow the Laravel development origin. Alternatively, route all AI calls through the Laravel backend (server-side proxy), which avoids browser CORS entirely.

### Refactoring Strategy
1. Configure LM Studio CORS settings: add Laravel dev origin (http://localhost)
2. If server-side routing is preferred, proxy AI calls through Laravel to avoid browser CORS
3. Document CORS configuration in development setup guide
4. Test browser-based AI calls during development environment verification
5. Add CORS configuration to automated environment setup

### Detection Checklist
- [ ] CORS is configured for development origins in LM Studio
- [ ] Or AI calls are proxied server-side (no browser CORS)
- [ ] Browser-based AI features work in development
- [ ] CORS configuration is documented

### Related Rules/Skills/Trees
- Skill: Implement LM Studio & LocalAI

---

## 5. Port Conflicts from Multiple Local Tools

### Category
Environment Configuration Failure

### Description
Running multiple local inference tools (Ollama on 11434, LM Studio on 1234, LocalAI on 8080) simultaneously, causing port conflicts when two tools attempt to bind to the same port, or confusing developers about which tool serves which port. Containers and native apps compete for ports, and the wrong tool receives the request.

### Why It Happens
- Team members experiment with different tools without coordination
- Docker containers and native apps both try to use default ports
- No standardized port assignments for the development team
- Tools started and left running in the background
- No awareness that multiple inference servers are running

### Warning Signs
- "Connection refused" on expected port (tool not started)
- "Port already in use" errors when starting a tool
- Unexpected responses from the inference server (wrong tool/model)
- Multiple inference processes running on the development machine
- Team members have different port configurations

### Why Harmful
- Confusing development environment: which tool is answering?
- Port conflicts prevent tools from starting
- Wrong model is used for testing (Ollama instead of LM Studio)
- Debugging time wasted on "why is the model responding differently"
- Environment setup becomes unreliable and machine-specific

### Real-World Consequences
- Developer starts Ollama, but LM Studio is already on port 11434
- Requests to localhost:11434 go to LM Studio instead of Ollama
- Team has inconsistent development configurations
- Fresh environment setup requires troubleshooting port conflicts

### Preferred Alternative
Standardize on one local inference tool for the team. Document the port assignment. Use Docker Compose to manage ports consistently. Stop unused inference services to free ports.

### Refactoring Strategy
1. Choose one primary local inference tool for the team
2. Standardize port assignments in docker-compose.yml
3. Document port usage in the development setup guide
4. Add port conflict detection to the setup script
5. Configure tools to run only when needed (not at system startup)

### Detection Checklist
- [ ] One primary inference tool is standardized for the team
- [ ] Port assignments are documented and consistent
- [ ] No port conflicts in default development configuration
- [ ] Setup script detects and reports port conflicts
