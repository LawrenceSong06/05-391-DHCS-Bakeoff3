import json
import sys
import numpy as np
from numpy.linalg import inv
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score
from sklearn.utils import resample
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec


def load_json(path):
    with open(path) as f:
        return json.load(f)


def fit_local_linear_model(data, output_path="loss_sensitivity.png", n_bootstrap=1000):
    samples = data["samples"]
    param_names = list(samples[0]["params"].keys())

    X = np.array([[s["params"][p] for p in param_names] for s in samples])
    y = np.array([s["loss"] for s in samples])

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # --- Fit main model ---
    model = Ridge(alpha=1.0)
    model.fit(X_scaled, y)

    y_pred = model.predict(X_scaled)
    r2 = r2_score(y, y_pred)
    residuals = y - y_pred

    # --- Analytic coefficient uncertainty (sandwich estimator for Ridge) ---
    n, p = X_scaled.shape
    rss = np.sum(residuals ** 2)
    sigma2 = rss / (n - p - 1)
    alpha = model.alpha
    XtX = X_scaled.T @ X_scaled
    XtX_ridge = XtX + alpha * np.eye(p)
    cov_beta = sigma2 * inv(XtX_ridge) @ XtX @ inv(XtX_ridge)
    analytic_se = np.sqrt(np.diag(cov_beta))

    # --- Bootstrap coefficient uncertainty ---
    boot_coefs = []
    for _ in range(n_bootstrap):
        X_b, y_b = resample(X_scaled, y, random_state=None)
        m = Ridge(alpha=1.0).fit(X_b, y_b)
        boot_coefs.append(m.coef_)
    boot_coefs = np.array(boot_coefs)
    ci_low  = np.percentile(boot_coefs, 2.5,  axis=0)
    ci_high = np.percentile(boot_coefs, 97.5, axis=0)
    boot_se = boot_coefs.std(axis=0)

    # --- Console summary ---
    print(f"\nLinear model: loss ~ intercept + sum(coef_i * param_i)")
    print(f"Intercept:    {model.intercept_:.2f}")
    print(f"R²:           {r2:.4f}  (1.0 = perfect fit, 0.0 = no better than mean)")
    print(f"Residual σ:   {np.sqrt(sigma2):.2f}")
    print(f"Bootstrap iterations: {n_bootstrap}\n")

    header = f"{'Parameter':<40} {'Coef':>10} {'Analytic SE':>12} {'Boot SE':>10} {'CI 95% low':>12} {'CI 95% high':>12} {'Sig':>5}"
    print(header)
    print("-" * len(header))

    sorted_indices = np.argsort(np.abs(model.coef_))[::-1]
    for i in sorted_indices:
        name  = param_names[i]
        coef  = model.coef_[i]
        ase   = analytic_se[i]
        bse   = boot_se[i]
        lo    = ci_low[i]
        hi    = ci_high[i]
        sig   = "*" if not (lo < 0 < hi) else ""
        print(f"{name:<40} {coef:>+10.4f} {ase:>12.4f} {bse:>10.4f} {lo:>12.4f} {hi:>12.4f} {sig:>5}")

    # --- Plot ---
    fig = plt.figure(figsize=(18, 16), facecolor="#0f1117")
    fig.suptitle(f"Loss — Local Linear Model  (R² = {r2:.3f})",
                 fontsize=17, color="white", fontweight="bold", y=0.99)

    gs = gridspec.GridSpec(3, 2, figure=fig, hspace=0.5, wspace=0.35,
                           height_ratios=[1.4, 1, 1])

    BG    = "#1a1d2e"
    SPINE = "#333"

    # 1. Coefficient bar chart with bootstrap CIs (top, full width)
    ax_coef = fig.add_subplot(gs[0, :])
    order = np.argsort(model.coef_)
    names_sorted  = [param_names[i] for i in order]
    coefs_sorted  = model.coef_[order]
    ci_low_sorted = ci_low[order]
    ci_hi_sorted  = ci_high[order]
    colors = ["#ff6b6b" if c > 0 else "#51cf66" for c in coefs_sorted]
    yerr_low  = coefs_sorted - ci_low_sorted
    yerr_high = ci_hi_sorted - coefs_sorted

    bars = ax_coef.barh(names_sorted, coefs_sorted, color=colors,
                        edgecolor="#444", linewidth=0.6, zorder=2)
    ax_coef.errorbar(coefs_sorted, names_sorted,
                     xerr=[yerr_low, yerr_high],
                     fmt="none", color="white", linewidth=1.2,
                     capsize=4, capthick=1.2, zorder=3, alpha=0.8)
    ax_coef.axvline(0, color="#888", linewidth=1)
    ax_coef.set_title(
        "Standardized Coefficients with 95% Bootstrap CIs  (* = CI doesn't cross zero)",
        color="white", fontsize=11, fontweight="bold"
    )
    ax_coef.set_xlabel("Coefficient (std units)", color="#aaa", fontsize=9)
    ax_coef.set_facecolor(BG)
    ax_coef.tick_params(colors="white", labelsize=9)
    ax_coef.spines[:].set_color(SPINE)
    for i, (bar, coef, lo, hi) in enumerate(zip(bars, coefs_sorted, ci_low_sorted, ci_hi_sorted)):
        sig = "*" if not (lo < 0 < hi) else ""
        if sig:
            ax_coef.text(
                coef + (0.003 if coef >= 0 else -0.003),
                bar.get_y() + bar.get_height() / 2,
                sig, va="center",
                ha="left" if coef >= 0 else "right",
                color="#ffd43b", fontsize=12, fontweight="bold"
            )

    # 2. Bootstrap coefficient distributions for top 4 params by |coef|
    top4 = np.argsort(np.abs(model.coef_))[::-1][:4]
    for plot_i, param_i in enumerate(top4):
        ax = fig.add_subplot(gs[1, plot_i % 2] if plot_i < 2 else gs[2, plot_i % 2])
        vals = boot_coefs[:, param_i]
        ax.hist(vals, bins=40, color="#74c0fc", edgecolor="#333", linewidth=0.4, alpha=0.85)
        ax.axvline(model.coef_[param_i], color="#ffd43b", linewidth=2, label="Fitted coef")
        ax.axvline(ci_low[param_i],  color="#ff6b6b", linewidth=1.5, linestyle="--", label="95% CI")
        ax.axvline(ci_high[param_i], color="#ff6b6b", linewidth=1.5, linestyle="--")
        ax.axvline(0, color="#aaa", linewidth=1, linestyle=":")
        ax.set_title(f"{param_names[param_i]}", color="white", fontsize=10, fontweight="bold")
        ax.set_xlabel("Coefficient value", color="#aaa", fontsize=8)
        ax.set_ylabel("Bootstrap count", color="#aaa", fontsize=8)
        ax.set_facecolor(BG)
        ax.tick_params(colors="#aaa", labelsize=8)
        ax.spines[:].set_color(SPINE)
        if plot_i == 0:
            ax.legend(fontsize=8, facecolor=BG, labelcolor="white")

    # 3. Predicted vs actual (bottom left if top4 only uses 4 slots)
    ax_pred = fig.add_subplot(gs[2, 0]) if len(top4) < 4 else None
    ax_res  = fig.add_subplot(gs[2, 1]) if len(top4) < 4 else None

    # Always add predicted vs actual and residuals in remaining space
    # Reuse gs rows if top4 filled slots, otherwise append
    if ax_pred is None:
        # Add a new row
        gs2 = gridspec.GridSpec(4, 2, figure=fig, hspace=0.5, wspace=0.35,
                                height_ratios=[1.4, 1, 1, 1])
        ax_pred = fig.add_subplot(gs2[3, 0])
        ax_res  = fig.add_subplot(gs2[3, 1])

    ax_pred.scatter(y, y_pred, color="#74c0fc", alpha=0.7,
                    edgecolors="#333", linewidth=0.5, s=50)
    mn, mx = min(y.min(), y_pred.min()), max(y.max(), y_pred.max())
    ax_pred.plot([mn, mx], [mn, mx], color="#ffd43b", linewidth=1.5,
                 linestyle="--", label="Perfect fit")
    ax_pred.set_title("Predicted vs Actual Loss", color="white", fontsize=11, fontweight="bold")
    ax_pred.set_xlabel("Actual loss", color="#aaa", fontsize=9)
    ax_pred.set_ylabel("Predicted loss", color="#aaa", fontsize=9)
    ax_pred.set_facecolor(BG)
    ax_pred.tick_params(colors="white", labelsize=8)
    ax_pred.spines[:].set_color(SPINE)
    ax_pred.legend(fontsize=8, facecolor=BG, labelcolor="white")

    ax_res.scatter(y_pred, residuals, color="#da77f2", alpha=0.7,
                   edgecolors="#333", linewidth=0.5, s=50)
    ax_res.axhline(0, color="#ffd43b", linewidth=1.5, linestyle="--")
    ax_res.set_title("Residuals (actual − predicted)", color="white", fontsize=11, fontweight="bold")
    ax_res.set_xlabel("Predicted loss", color="#aaa", fontsize=9)
    ax_res.set_ylabel("Residual", color="#aaa", fontsize=9)
    ax_res.set_facecolor(BG)
    ax_res.tick_params(colors="white", labelsize=8)
    ax_res.spines[:].set_color(SPINE)

    plt.savefig(output_path, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    print(f"\nSaved plot to: {output_path}")

    return model, scaler, param_names, r2, model.coef_, ci_low, ci_high


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python model_loss.py <input.json> [output.png] [n_bootstrap]")
        sys.exit(1)

    json_path   = sys.argv[1]
    out_path    = sys.argv[2] if len(sys.argv) > 2 else "loss_sensitivity.png"
    n_bootstrap = int(sys.argv[3]) if len(sys.argv) > 3 else 1000

    data = load_json(json_path)
    fit_local_linear_model(data, out_path, n_bootstrap)