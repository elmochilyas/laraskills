# Skills

## Skill 1: Implement offline and air-gapped LLM deployment with self-contained inference

### Purpose
Package and deploy local LLMs in air-gapped or offline environments by pre-downloading all model artifacts, dependencies, and container images, configuring self-contained inference servers with no external calls, and establishing offline update mechanisms.

### When To Use
- Use when deploying AI in environments without internet access (security, compliance, remote)
- Use when data privacy regulations require all AI processing on-premise with no external communication
- Use when building AI features for field operations, military, or disconnected environments
- Use when you need both LLM and embedding models running entirely offline for RAG

### When NOT To Use
- Do NOT use when cloud LLMs are acceptable and internet is available
- Do NOT use without a plan for model updates in the air-gapped environment
- Do NOT use when the application requires up-to-date model knowledge (cannot download new checkpoints)
- Do NOT use when the hardware doesn't meet model requirements (offline environments often have limited hardware)

### Prerequisites
- Air-gapped or offline environment with network isolation
- Physical media or one-way data transfer mechanism for model and software transfer
- Inference server software downloaded for offline transfer (Ollama, llama.cpp, LocalAI)
- All dependencies pre-downloaded (Composer packages, Docker images, model files)
- Local embedding model for RAG (if vector search is needed)
- Sufficient hardware (RAM, VRAM, storage) in the target environment

### Inputs
- Model artifact files (GGUF, safetensors, tokenizer files)
- Docker images for inference runtime and application
- Composer packages for Laravel application
- Configuration files for offline operation
- Offline embedding model files (if RAG is needed)

### Workflow
1. Assess the target environment's hardware and constraints before packaging
2. Set up a mirror/download workstation with internet access
3. Package all software artifacts:
   - Download inference runtime packages (Ollama, llama.cpp)
   - Pull Docker images: `docker pull ollama/ollama:0.3.12` → save as tar
   - Download model files via Ollama/Hugging Face → save to transfer media
   - Run `composer install` and cache packages
4. Package model artifacts:
   - Bundle model weights, tokenizer, and configuration
   - Include checksums for verification
   - Document model version and provenance
5. Configure self-contained inference:
   - Set inference server to no-external-calls mode
   - Disable telemetry, license checks, and online features
   - Disable automatic model downloads
   - Point to local embedding model for RAG
6. Transfer to air-gapped environment via physical media
7. Load models and start inference server
8. Verify offline operation: no external network calls

### Validation Checklist
- [ ] Air-gapped environment has no internet access (verified)
- [ ] All required software is pre-downloaded and packaged
- [ ] Model files include checksums for integrity verification
- [ ] Inference server configured with no external network calls
- [ ] Offline embedding model is available for RAG
- [ ] Application runs without any network-dependent features
- [ ] All Composer packages are pre-installed (no remote resolves)
- [ ] Docker images are loaded from local tar files
- [ ] Model update mechanism is documented
- [ ] Offline operation is verified with end-to-end test

### Common Failures
- **Missing dependency**: Requirement discovered only after offline deployment — comprehensive checklist needed
- **Telemetry blocked**: Inference runtime crashes because it can't phone home — disable telemetry
- **Licensing check**: Model license requires online activation — use open-source models only
- **Disk space**: Model files + Docker images exceed available storage — plan for 10-50GB
- **Update mechanism missing**: Model needs update but no process for physical transfer
- **No offline embeddings**: RAG requires embeddings but only cloud embedding provider configured

### Decision Points
- **Transfer mechanism**: USB drive (standard), DVD (large capacity), or point-to-point network (one-way)
- **Model update policy**: Quarterly updates via physical media vs. no updates (use current only)
- **Embedding strategy**: Local embedding model (sentence-transformers) vs. sparse embeddings (BM25)
- **Containerization**: Full Docker stack vs. native binaries — Docker is portable, native is simpler

### Performance Considerations
- Local model inference on air-gapped hardware may be slower than cloud
- Hardware in offline environments is often older/limited — test model compatibility
- Disk space planning: models (5-50GB), Docker images (2-10GB), app code (1-5GB)
- RAG on offline embedding models may have lower accuracy than cloud embeddings
- Cache pre-computed embeddings for static documents to reduce inference load

### Security Considerations
- Physical security of transfer media (models can be sensitive)
- Model files should be checksum-verified after transfer (tamper detection)
- Air-gapped environment must remain air-gapped after deployment
- Inference server logs should be auditable without external network
- Model provenance documents ensure supply chain security
- USB drives used for transfer should be sanitized

### Related Rules
- R1: Never run a model at the highest available quantization without benchmarking quality degradation
- R2: Match quantization precision to the available VRAM, not the model's native precision

### Related Skills
- Set up local LLM infrastructure matching model size to hardware
- Select and quantize local models for hardware constraints
- Set up Docker Sail AI infrastructure with Ollama and pgvector
- Configure semantic caching for LLM responses

### Success Criteria
- All software and models are pre-packaged and verified with checksums
- Inference server starts and serves requests without any external network calls
- Application operates fully offline with no internet-dependent features
- RAG works with local embedding model (if vector search is needed)
- Model update process is documented and testable
- Air-gapped verification confirms no external network communication
- Disk space requirements are within target environment capacity
