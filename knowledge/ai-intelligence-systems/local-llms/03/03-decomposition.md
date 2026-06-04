# Decomposition: Model Selection & Quantization

## Topic Overview

Model selection and quantization are the two most critical decisions in local LLM deployment. The model determines output quality, latency, and memory footprint. Quantization compresses the model to fit available hardware at the cost of some quality degradation. The selection process involves matching model capabilities to task requirements, hardware constraints (RAM/VRAM), latency SLAs, and quality thresholds. In the Laravel AI ecosystem, model selection is codified in configuration and the provider abstraction layer, while quantization is handled by the inference engine.

## Decomposition Strategy

This Knowledge Unit is atomic. It covers a single well-bounded concept with independent decisions, tradeoffs, and architecture guidance.

## Proposed Folder Structure
```
ku-03/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory

### Model Selection & Quantization
- **Purpose:** Model selection and quantization are the two most critical decisions in local LLM deployment. The model determines output quality, latency, and memory footprint. Quantization compresses the model to fit available hardware at the cost of some quality degradation. The selection process involves matching model capabilities to task requirements, hardware constraints (RAM/VRAM), latency SLAs, and quality thresholds. In the Laravel AI ecosystem, model selection is codified in configuration and the provider abstraction layer, while quantization is handled by the inference engine.
- **Difficulty:** Intermediate
- **Dependencies:** ku-01, ku-02, ku-04, ku-01, ku-01

## Dependency Graph
**Depends on:**
- ku-01
- ku-02
- ku-04
- ku-01
- ku-01

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- **Model Size (Parameters):** Number of parameters in billions (e.g., 7B, 13B, 70B). Larger models generally produce higher quality outputs but require more memory.
- **Quantization:** Representing model weights with fewer bits â€” 4-bit (QLoRA), 8-bit (FP8), 16-bit (FP16/BF16). Lower bit = smaller, faster, less accurate.
- **Perplexity:** A quality metric measuring how well the model predicts text. Lower perplexity is better. Used to compare quantization quality.
- **Quantization-Aware Training (QAT):** Training the model with quantization in mind. Better quality than post-training quantization (PTQ).
- **K-quant vs. IQ-quant:** Different quantization methods (llama.cpp). K-quant (K_4, K_5, K_6) balances quality and size; IQ (I-Quant) offers better quality at very low bitrates.
- **Memory Footprint:** The amount of RAM/VRAM required to load and run the model. Rough formula: parameters Ã— bytes_per_param (FP16 = 2 bytes, 4-bit = 0.5 bytes).
- **Context Window Memory:** Additional memory proportional to context size Ã— model dimensions. Long contexts can double memory usage.
- **Model Architecture:** Transformer variants (LLaMA, Mistral, Phi, Qwen, DeepSeek) â€” each has different performance characteristics.

**Out of scope:**
- ku-01 topics covered in their respective KUs
- ku-02 topics covered in their respective KUs
- ku-04 topics covered in their respective KUs
- ku-01 topics covered in their respective KUs
- ku-01 topics covered in their respective KUs

## Future Expansion Opportunities
The topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

- No Knowledge Unit is overloaded
- No major concept is missing
- Boundaries are clear
- Future phases can operate on individual units
- The structure can scale without reorganization

