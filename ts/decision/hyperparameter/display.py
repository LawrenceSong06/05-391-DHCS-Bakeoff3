import json
import sys
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec

def load_json(path):
    with open(path) as f:
        return json.load(f)

def plot_optimizer_json(data, output_path="optimizer_plot.png"):
    samples = data["samples"]
    best = data["best"]
    best_params = best["params"]
    best_loss = best["loss"]
    param_names = list(best_params.keys())

    # Build time series
    run_losses = [s["loss"] for s in samples]
    running_best_losses = []
    current_best = float("inf")
    for loss in run_losses:
        current_best = min(current_best, loss)
        running_best_losses.append(current_best)

    run_param_series = {p: [s["params"][p] for s in samples] for p in param_names}

    # Compute running best params (tracks which sample had lowest loss so far)
    running_best_params = {p: [] for p in param_names}
    current_best_loss = float("inf")
    current_best_p = None
    for s in samples:
        if s["loss"] < current_best_loss:
            current_best_loss = s["loss"]
            current_best_p = s["params"]
        for p in param_names:
            running_best_params[p].append(current_best_p[p])

    xs = list(range(1, len(samples) + 1))

    # Layout
    n_params = len(param_names)
    n_cols = 3
    n_rows = (n_params + n_cols - 1) // n_cols + 1  # +1 for loss row

    fig = plt.figure(figsize=(18, n_rows * 3), facecolor="#0f1117")
    fig.suptitle("Optimizer Results — Parameter Convergence", fontsize=18,
                 color="white", fontweight="bold", y=0.99)

    gs = gridspec.GridSpec(n_rows, n_cols, figure=fig, hspace=0.55, wspace=0.35)

    # --- Loss panel (top, full width) ---
    ax_loss = fig.add_subplot(gs[0, :])
    ax_loss.plot(xs, run_losses, color="#ff6b6b", linewidth=1.4, alpha=0.7, label="Sample loss")
    ax_loss.plot(xs, running_best_losses, color="#51cf66", linewidth=2, label="Running best loss")
    ax_loss.axhline(best_loss, color="#ffd43b", linewidth=1.5, linestyle=":", label=f"Overall best ({best_loss})")
    ax_loss.fill_between(xs, run_losses, running_best_losses, alpha=0.08, color="#aaa")
    ax_loss.set_title("Loss", color="white", fontsize=13, fontweight="bold")
    ax_loss.set_facecolor("#1a1d2e")
    ax_loss.tick_params(colors="white")
    ax_loss.spines[:].set_color("#333")
    ax_loss.set_xlabel("Sample #", color="#aaa", fontsize=9)
    ax_loss.legend(fontsize=9, facecolor="#1a1d2e", labelcolor="white", framealpha=0.8)

    # --- Per-parameter panels ---
    colors_run = "#74c0fc"
    colors_best = "#ffd43b"

    for i, name in enumerate(param_names):
        row = (i // n_cols) + 1
        col = i % n_cols
        ax = fig.add_subplot(gs[row, col])

        values = run_param_series[name]
        best_so_far = running_best_params[name]

        ax.plot(xs, values, color=colors_run, linewidth=1.4, alpha=0.85, label="Sample")
        ax.plot(xs, best_so_far, color=colors_best, linewidth=1.8, linestyle="--", alpha=0.9, label="Best so far")
        ax.fill_between(xs, values, best_so_far, alpha=0.07, color="white")

        ax.set_title(name, color="white", fontsize=10, fontweight="bold")
        ax.set_facecolor("#1a1d2e")
        ax.tick_params(colors="#aaa", labelsize=7)
        ax.spines[:].set_color("#333")
        ax.set_xlabel("Sample #", color="#aaa", fontsize=7)

    # Shared legend for param plots
    handles = [
        plt.Line2D([0], [0], color=colors_run, linewidth=1.5, label="Sample value"),
        plt.Line2D([0], [0], color=colors_best, linewidth=1.8, linestyle="--", label="Best so far"),
    ]
    fig.legend(handles=handles, loc="lower center", ncol=2, fontsize=10,
               facecolor="#1a1d2e", labelcolor="white", framealpha=0.9,
               bbox_to_anchor=(0.5, 0.005))

    plt.savefig(output_path, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    print(f"Saved plot to: {output_path}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python plot_optimizer.py <input.json> [output.png]")
        sys.exit(1)

    json_path = sys.argv[1]
    out_path = sys.argv[2] if len(sys.argv) > 2 else "optimizer_plot.png"

    data = load_json(json_path)
    plot_optimizer_json(data, out_path)