import os
import json
import logging
from typing import Dict, Any
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.linear_model import LinearRegression

from app.models.anomaly_model import EnhancedAnomalyModel
from app.models.water_level_model import EnhancedWaterLevelModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def benchmark_anomaly_detection(dataset_csv_path: str) -> Dict[str, Any]:
    df = pd.read_csv(dataset_csv_path)
    actuals = df["is_anomaly"].astype(int).tolist()

    preds_z3 = (df["rolling_zscore_7d"].abs() > 3.0).astype(int).tolist()
    preds_iqr = df["iqr_outlier_flag"].astype(int).tolist()

    model = EnhancedAnomalyModel()
    preds_model = [model.predict_single_with_z(row)[0] for _, row in df.iterrows()]

    def calc_metrics(preds, actuals):
        tp = sum(1 for p, a in zip(preds, actuals) if p == 1 and a == 1)
        fp = sum(1 for p, a in zip(preds, actuals) if p == 1 and a == 0)
        fn = sum(1 for p, a in zip(preds, actuals) if p == 0 and a == 1)
        tn = sum(1 for p, a in zip(preds, actuals) if p == 0 and a == 0)

        acc = (tp + tn) / max(1, len(actuals))
        prec = tp / max(1, tp + fp)
        rec = tp / max(1, tp + fn)
        f1 = 2 * prec * rec / max(1e-6, prec + rec)
        fpr = fp / max(1, fp + tn)
        return {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "false_positive_rate": round(fpr, 4)
        }

    m_z3 = calc_metrics(preds_z3, actuals)
    m_iqr = calc_metrics(preds_iqr, actuals)
    m_our = calc_metrics(preds_model, actuals)

    def relative_lift(value: float, baseline: float) -> float | None:
        # A zero-F1 baseline has no meaningful relative percentage lift.
        return None if baseline == 0 else round((value - baseline) / baseline * 100, 2)

    f1_lift_z3 = relative_lift(m_our["f1_score"], m_z3["f1_score"])
    f1_lift_iqr = relative_lift(m_our["f1_score"], m_iqr["f1_score"])

    return {
        "dataset_samples": len(df),
        "anomaly_positive_samples": sum(actuals),
        "baselines": {
            "zscore_3.0_baseline": m_z3,
            "iqr_1.5x_baseline": m_iqr,
            "our_enhanced_anomaly_model": m_our
        },
        "performance_gain": {
            "f1_lift_vs_zscore_3.0_percent": f1_lift_z3,
            "f1_lift_vs_iqr_1.5x_percent": f1_lift_iqr
        }
    }


def benchmark_water_level_forecasting(dataset_csv_path: str) -> Dict[str, Any]:
    df = pd.read_csv(dataset_csv_path)
    # Backward compatibility for the former daily/interpolated fixture used
    # by older tests. The production benchmark uses the monthly-organized
    # original-observation schema and follows the branch below unchanged.
    if "observed_at" not in df.columns:
        # The legacy daily/interpolated table is retained only for older
        # callers. Do not run the expensive modern model comparison on it.
        legacy = df.dropna(subset=["target_wse_7d"]).copy()
        y_true = legacy["target_wse_7d"].astype(float).values
        y_pred = legacy["wse"].astype(float).values
        errors = y_true - y_pred
        legacy_metrics = {
            "mae_meters": round(float(np.mean(np.abs(errors))), 3),
            "rmse_meters": round(float(np.sqrt(np.mean(errors ** 2))), 3),
            "r2_score": round(float(1 - np.sum(errors ** 2) / max(1e-6, np.sum((y_true - y_true.mean()) ** 2))), 4),
        }
        return {
            "evaluated_samples": len(legacy),
            "horizon": "legacy 7-day interpolated compatibility dataset; not used for production benchmarking",
            "baselines": {"persistence": legacy_metrics},
            "performance_gain": {"mae_error_reduction_vs_persistence_percent": None},
        }
    else:
        df["observed_at"] = pd.to_datetime(df["observed_at"], utc=True)
        df["target_observed_at"] = pd.to_datetime(df["target_observed_at"], utc=True)
    df = df.sort_values(["dahiti_id", "observed_at"]).reset_index(drop=True)
    valid = df.dropna(subset=["target_wse_7d", "target_observed_at"]).copy()
    # Chronological holdout independently inside every station.
    valid["is_test"] = valid.groupby("dahiti_id", group_keys=False).cumcount() >= (
        valid.groupby("dahiti_id")["dahiti_id"].transform("size") * 0.8
    )
    train = valid[~valid["is_test"]].copy()
    test = valid[valid["is_test"]].copy()
    feature_cols = ["wse", "wse_lag1", "wse_lag3", "wse_lag7", "wse_lag14", "wse_lag30", "sin_month", "cos_month", "day_of_year"]
    X_train = train[feature_cols].fillna(train["wse"], axis=0).fillna(0.0)
    X_test = test[feature_cols].fillna(test["wse"], axis=0).fillna(0.0)
    y_train = train["target_wse_7d"].astype(float)
    y_true = test["target_wse_7d"].astype(float).values

    regressors = {
        "linear_regression": LinearRegression(),
        "random_forest": RandomForestRegressor(
            n_estimators=100, random_state=42, n_jobs=1, max_depth=12, min_samples_leaf=10
        ),
        "hist_gradient_boosting": HistGradientBoostingRegressor(random_state=42, max_iter=250, l2_regularization=0.1),
    }
    predictions = {"persistence": test["wse"].astype(float).values}
    for name, regressor in regressors.items():
        regressor.fit(X_train, y_train)
        predictions[name] = regressor.predict(X_test)

    enhanced = EnhancedWaterLevelModel()
    enhanced.fit_random_forest(train, random_state=42)
    # Batch prediction keeps the benchmark deterministic and avoids thousands
    # of one-row sklearn calls. This is the same estimator and same features
    # used by the production model.
    predictions["enhanced_model"] = enhanced.estimators["target_wse_7d"].predict(X_test)

    def calc_reg_metrics(y_pred, y_true):
        mae = float(np.mean(np.abs(y_true - y_pred)))
        rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
        ss_res = np.sum((y_true - y_pred) ** 2)
        ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
        r2 = float(1 - (ss_res / max(1e-6, ss_tot)))
        return {"mae_meters": round(mae, 3), "rmse_meters": round(rmse, 3), "r2_score": round(r2, 4)}

    metrics = {name: calc_reg_metrics(pred, y_true) for name, pred in predictions.items()}
    best_name = min(metrics, key=lambda name: metrics[name]["mae_meters"])
    test["horizon_bucket"] = pd.cut(test["horizon_days"], [-np.inf, 30, 90, 180, 365, np.inf], labels=["0-30d", "31-90d", "91-180d", "181-365d", ">365d"])
    horizon_metrics = {}
    for bucket, subset in test.groupby("horizon_bucket", observed=True):
        idx = subset.index
        positions = test.index.get_indexer(idx)
        horizon_metrics[str(bucket)] = {
            "samples": len(subset),
            "median_horizon_days": round(float(subset["horizon_days"].median()), 1),
            "mae_meters": {name: round(float(np.mean(np.abs(y_true[positions] - pred[positions]))), 3) for name, pred in predictions.items()},
        }
    station_metrics = {}
    for station_id, subset in test.groupby("dahiti_id"):
        positions = test.index.get_indexer(subset.index)
        station_metrics[str(int(station_id))] = {
            "samples": len(subset),
            "median_horizon_days": round(float(subset["horizon_days"].median()), 1),
            "mae_meters": {name: round(float(np.mean(np.abs(y_true[positions] - pred[positions]))), 3) for name, pred in predictions.items()},
        }

    return {
        "total_valid_samples": len(valid), "train_samples": len(train), "test_samples": len(test),
        "horizon": "7th-next-observation; actual elapsed days are measured per row",
        "overall_metrics": metrics,
        "best_by_mae": best_name,
        "horizon_metrics": horizon_metrics,
        "station_metrics": station_metrics,
    }


def run_full_benchmark():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))

    anomaly_csv = os.path.join(base_dir, "data-engineering", "Output_Data", "processed", "dahiti_egypt_anomaly_dataset.csv")
    if not os.path.exists(anomaly_csv):
        anomaly_csv = os.path.join(base_dir, "data-engineering", "data", "processed", "dahiti_egypt_anomaly_dataset.csv")

    wl_csv = os.path.join(base_dir, "data-engineering", "Output_Data", "processed", "dahiti_egypt_water_level_training_dataset.csv")
    if not os.path.exists(wl_csv):
        wl_csv = os.path.join(base_dir, "data-engineering", "data", "processed", "dahiti_egypt_water_level_training_dataset.csv")

    anomaly_bench = benchmark_anomaly_detection(anomaly_csv)
    wl_bench = benchmark_water_level_forecasting(wl_csv)

    bench_file = os.path.join(os.path.dirname(__file__), "..", "models", "artifacts", "benchmark_summary.json")
    os.makedirs(os.path.dirname(bench_file), exist_ok=True)
    with open(bench_file, "w", encoding="utf-8") as f:
        json.dump({"anomaly_benchmark": anomaly_bench, "water_level_benchmark": wl_bench}, f, indent=2)

    logger.info(f"Saved benchmark summary to {bench_file}")
    return anomaly_bench, wl_bench


if __name__ == "__main__":
    run_full_benchmark()
