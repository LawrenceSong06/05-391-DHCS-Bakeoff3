import json
import sys
import numpy as np


def softmax_weights(losses, temperature):
    """Convert losses to weights via softmax with temperature scaling."""
    losses = np.array(losses, dtype=float)
    # Negative because lower loss = better = higher weight
    logits = -losses / temperature
    # Numerically stable softmax
    logits -= logits.max()
    weights = np.exp(logits)
    weights /= weights.sum()
    return weights


def weighted_params(samples, weights, param_names):
    """Compute weighted average of parameters."""
    result = {}
    for p in param_names:
        values = np.array([s["params"][p] for s in samples])
        result[p] = float(np.dot(weights, values))
    return result


def compute_thermodynamic_params(data, temperature, index):
    samples = data["samples"]
    param_names = list(samples[0]["params"].keys())
    losses = [s["loss"] for s in samples]
    n = len(samples)

    # Resolve index into a slice
    # Positive index: use samples[0:index] (first `index` samples)
    # Negative index: use samples[index:] (last `|index|` samples)
    if index >= 0:
        subset = samples[:index] if index > 0 else samples
        label = f"first {index} samples" if index > 0 else "all samples"
    else:
        subset = samples[index:]
        label = f"last {abs(index)} samples"

    if len(subset) == 0:
        print(f"Error: index {index} results in an empty subset (total samples: {n})")
        sys.exit(1)

    subset_losses = [s["loss"] for s in subset]
    weights = softmax_weights(subset_losses, temperature)
    params  = weighted_params(subset, weights, param_names)

    # Stats
    best_in_subset  = subset[np.argmin(subset_losses)]
    effective_n     = 1.0 / np.sum(weights ** 2)  # entropy-based effective sample size

    print(f"\nThermodynamic parameter estimate")
    print(f"  Temperature:      {temperature}")
    print(f"  Subset:           {label}  ({len(subset)} samples)")
    print(f"  Loss range:       {min(subset_losses)} – {max(subset_losses)}")
    print(f"  Effective N:      {effective_n:.1f}  (1 = winner-takes-all, {len(subset)} = uniform)")
    print(f"\n  {'Parameter':<40} {'Weighted avg':>14}  {'Best in subset':>14}  {'Delta':>10}")
    print("  " + "-" * 82)
    for p in param_names:
        wavg  = params[p]
        best  = best_in_subset["params"][p]
        delta = wavg - best
        print(f"  {p:<40} {wavg:>14.6f}  {best:>14.6f}  {delta:>+10.6f}")

    print(f"\n  Best loss in subset: {min(subset_losses)}")
    print(f"  Weighted loss:       {np.dot(weights, subset_losses):.2f}")

    return params, weights


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python thermodynamic_params.py <input.json> <temperature> <index>")
        print()
        print("  temperature  Controls how sharply to favour low-loss samples.")
        print("               Low  (e.g. 1)    → near winner-takes-all")
        print("               High (e.g. 1000) → nearly uniform average")
        print()
        print("  index        Which samples to include.")
        print("               Positive N → first N samples  (e.g. 10  = samples 0–9)")
        print("               Negative N → last  N samples  (e.g. -10 = last 10)")
        print("               0          → all samples")
        sys.exit(1)

    json_path   = sys.argv[1]
    temperature = float(sys.argv[2])
    index       = int(sys.argv[3])

    with open(json_path) as f:
        data = json.load(f)

    compute_thermodynamic_params(data, temperature, index)