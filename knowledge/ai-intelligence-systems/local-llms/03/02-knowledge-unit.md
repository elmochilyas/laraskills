# Knowledge Unit: Model Selection & Quantization

## Metadata

- **ID:** ku-03
- **Subdomain:** Local LLMs
- **Slug:** model-selection---quantization
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Model selection and quantization are the two most critical decisions in local LLM deployment. The model determines output quality, latency, and memory footprint. Quantization compresses the model to fit available hardware at the cost of some quality degradation. The selection process involves matching model capabilities to task requirements, hardware constraints (RAM/VRAM), latency SLAs, and quality thresholds. In the Laravel AI ecosystem, model selection is codified in configuration and the provider abstraction layer, while quantization is handled by the inference engine.

## Core Concepts

- **Model Size (Parameters):** Number of parameters in billions (e.g., 7B, 13B, 70B). Larger models generally produce higher quality outputs but require more memory.
- **Quantization:** Representing model weights with fewer bits â€” 4-bit (QLoRA), 8-bit (FP8), 16-bit (FP16/BF16). Lower bit = smaller, faster, less accurate.
- **Perplexity:** A quality metric measuring how well the model predicts text. Lower perplexity is better. Used to compare quantization quality.
- **Quantization-Aware Training (QAT):** Training the model with quantization in mind. Better quality than post-training quantization (PTQ).
- **K-quant vs. IQ-quant:** Different quantization methods (llama.cpp). K-quant (K_4, K_5, K_6) balances quality and size; IQ (I-Quant) offers better quality at very low bitrates.
- **Memory Footprint:** The amount of RAM/VRAM required to load and run the model. Rough formula: parameters Ã— bytes_per_param (FP16 = 2 bytes, 4-bit = 0.5 bytes).
- **Context Window Memory:** Additional memory proportional to context size Ã— model dimensions. Long contexts can double memory usage.
- **Model Architecture:** Transformer variants (LLaMA, Mistral, Phi, Qwen, DeepSeek) â€” each has different performance characteristics.

## Mental Models

- **Model Size (Parameters):** Number of parameters in billions (e.g., 7B, 13B, 70B). Larger models generally produce higher quality outputs but require more memory.
- **Quantization:** Representing model weights with fewer bits â€” 4-bit (QLoRA), 8-bit (FP8), 16-bit (FP16/BF16). Lower bit = smaller, faster, less accurate.
- **Perplexity:** A quality metric measuring how well the model predicts text. Lower perplexity is better. Used to compare quantization quality.


## Internal Mechanics

The internal mechanics of Model Selection & Quantization follow established patterns within the Local LLMs domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Benchmark on your specific task.** General benchmarks (MMLU, HumanEval) don't predict performance on your use case.
- **Match quantization to hardware.** 4-bit is the sweet spot for consumer GPUs (RTX 3090/4090). 8-bit for datacenter GPUs (A100, H100).
- **Test multiple quantization levels** on your task. The quality gap between 4-bit and 8-bit is small for most tasks but significant for reasoning.
- **Consider the context window budget.** A model with 32K context at FP16 may only fit 8K at 4-bit after memory accounting.
- **Monitor for quality regressions** after changing quantization. Automate quality evaluation with test suites.
- **Prefer models with the same architecture** as your production model for better dev/prod parity.

## Patterns

- **Benchmark on your specific task.** General benchmarks (MMLU, HumanEval) don't predict performance on your use case.
- **Match quantization to hardware.** 4-bit is the sweet spot for consumer GPUs (RTX 3090/4090). 8-bit for datacenter GPUs (A100, H100).
- **Test multiple quantization levels** on your task. The quality gap between 4-bit and 8-bit is small for most tasks but significant for reasoning.
- **Consider the context window budget.** A model with 32K context at FP16 may only fit 8K at 4-bit after memory accounting.
- **Monitor for quality regressions** after changing quantization. Automate quality evaluation with test suites.
- **Prefer models with the same architecture** as your production model for better dev/prod parity.

## Architectural Decisions

- Store model selection and quantization configuration in **environment-specific config files**, not hardcoded.
- Implement a **model benchmark pipeline** that runs periodically (weekly) to evaluate new model releases.
- Use a **model registry** to manage available models with metadata (size, quantization, benchmark scores, memory usage).
- For production local deployment, use **multi-model serving** (vLLM) to serve different models for different tasks.
- Automate model download and validation â€” the deployment pipeline should verify model checksums and benchmark against baseline.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Memory-optimal: 4-bit quantization fits a 70B model in ~40GB (one A100). FP16 would need ~140GB.
- Speed optimal: 8-bit quantization is faster than 4-bit on most hardware (less decompression overhead).
- CPU vs. GPU: 4-bit models on CPU with llama.cpp achieve 5-15 t/s for 7B models; GPU achieves 30-60 t/s.
- Quantization overhead: 4-bit requires dequantization during inference, adding 5-15% overhead vs. FP16 native.
- Batch processing: quantized models benefit less from batching (dequantization dominates per-token cost).

## Production Considerations

- **Model provenance:** Download models from trusted sources (Hugging Face official repos, Ollama library). Verify checksums.
- **Quantization integrity:** Ensure quantization doesn't introduce bias or safety degradations. Test with safety evaluation suite.
- **Model poisoning:** Fine-tuned or quantized models from untrusted sources may contain backdoors. Use only trusted model sources.
- **Side-channel attacks:** Quantized models may leak information through timing or power differences (theoretical â€” not a practical concern for most deployments).
- **License compliance:** Different models have different licenses (MIT, Apache 2.0, LLaMA 2 Community, CC-BY-NC). Ensure compliance with your use case.

## Common Mistakes

- Using FP16 when 4-bit is sufficient â€” wastes 4x memory for marginal quality gain.
- Using a model that's too large for the available VRAM â€” causes swapping to system RAM, 10-100x slowdown.
- Not benchmarking on the specific task â€” a model that scores high on MMLU may perform poorly on your use case.
- Ignoring context window memory â€” the model fits but the context window doesn't.
- Selecting a model solely on parameter count â€” architecture matters (a well-trained 7B can outperform a poorly-trained 13B).

## Failure Modes

- **Bigger-is-Better:** Always choosing the largest model that barely fits. A smaller, faster model with higher quantization often provides better user experience.
- **Quantization Obsession:** Spending days optimizing quantization for a 1% quality improvement that users won't notice.
- **No Benchmark Baseline:** Making model changes without a quality baseline. Every change should be measured against a fixed test set.
- **Vendor Lock-In to One Model Family:** Only considering LLaMA models when Mistral, Phi, Qwen, or DeepSeek may be better for the task.
- **Stale Model Selection:** Choosing a model once and never revisiting. The open-source model landscape evolves monthly.

## Ecosystem Usage

### Model Benchmark Results
```php
$benchmarks = [
    'llama3.2-8b-q4' => [
        'params' => '8B',
        'quant' => 'Q4_K_M',
        'memory_gb' => 5.2,
        'tokens_per_second' => 45.3,  // RTX 4090
        'perplexity' => 6.82,
        'context_limit' => 8192,
    ],
    'mistral-7b-q4' => [
        'params' => '7B',
        'quant' => 'Q4_K_M',
        'memory_gb' => 4.5,
        'tokens_per_second' => 52.1,
        'perplexity' => 6.95,
        'context_limit' => 8192,
    ],
    'phi-3-mini-q4' => [
        'params' => '3.8B',
        'quant' => 'Q4_K_M',
        'memory_gb' => 2.8,
        'tokens_per_second' => 78.4,
        'perplexity' => 7.42,
        'context_limit' => 4096,
    ],
];
```

### Quantization Selection
```php
class QuantizationSelector {
    public function recommend(int $vramGB, string $preference = 'quality'): string {
        return match(true) {
            $vramGB >= 48 => match($preference) {
                'quality' => 'Q8_0',  // 8-bit, best quality
                'speed' => 'Q4_K_M',  // 4-bit, fastest
            },
            $vramGB >= 16 => 'Q4_K_M',
            $vramGB >= 8 => 'Q4_K_S', // Smaller 4-bit variant
            default => 'IQ4_XS',       // Extremely compressed
        };
    }
}
```

## Related Knowledge Units

- ku-01 (Local LLM Setup): Hardware requirements informed by model selection.
- ku-02 (Development Workflow): Using selected models in development.
- ku-04 (Offline & Air-Gapped Deployment): Model selection for disconnected environments.
- llm-provider-abstraction/ku-01: Provider abstraction for local models.
- prompt-engineering-systems/ku-01: Prompt patterns adapted to model capabilities.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

