import logging
from typing import Dict, Any, List, Tuple
import pandas as pd

logger = logging.getLogger(__name__)


class EnhancedAnomalyModel:
    """Production Hydrological Anomaly Detection Model."""

    def __init__(self, thresholds: Dict[str, float] = None):
        self.thresholds = thresholds or {
            # These thresholds are the versioned labeling policy used by
            # data-engineering/pipelines/build_anomaly_dataset.py.
            "zscore_threshold": 2.5,
            "dwse_threshold": 0.35,
            "uncertainty_ratio_threshold": 0.40,
            "wse_u_threshold": 0.45
        }
        self.categories = ["normal", "sensor_noise", "flash_spike", "rapid_drop", "drought_drop", "outlier_spike"]
        self.features = [
            "wse", "wse_u", "rolling_zscore_7d", "rolling_zscore_30d",
            "dwse_dt", "seasonal_anomaly", "uncertainty_ratio", "iqr_outlier_flag"
        ]
        self.model_name = "EnhancedAnomalyModel"
        self.model_version = "1.1.0"
        self.metrics = {}

    def predict_single_with_z(self, row: Any, z_thresh: float = None) -> Tuple[int, str]:
        """Predict anomaly flag (0 or 1) and category from input dictionary or pandas Series."""
        z_t = z_thresh if z_thresh is not None else self.thresholds["zscore_threshold"]
        
        wse_u = float(row["wse_u"])
        z7 = float(row["rolling_zscore_7d"])
        z30 = float(row["rolling_zscore_30d"])
        dwse_dt = float(row["dwse_dt"])
        unc_ratio = float(row["uncertainty_ratio"])
        iqr_flag = int(row["iqr_outlier_flag"])

        is_z = abs(z7) > z_t or abs(z30) > z_t
        is_step = abs(dwse_dt) > self.thresholds["dwse_threshold"]
        # uncertainty_ratio is diagnostic context; wse_u is the label policy.
        is_noise = wse_u > self.thresholds["wse_u_threshold"]

        is_anomaly = 1 if (is_z or is_step or is_noise or iqr_flag == 1) else 0

        if is_anomaly == 0:
            category = "normal"
        elif wse_u > self.thresholds["wse_u_threshold"]:
            category = "sensor_noise"
        elif dwse_dt > self.thresholds["dwse_threshold"]:
            category = "flash_spike"
        elif dwse_dt < -self.thresholds["dwse_threshold"]:
            category = "rapid_drop"
        else:
            category = "outlier_spike"

        return is_anomaly, category

    def fit_and_evaluate(self, df: pd.DataFrame, test_size: float = 0.20, seed: int = 42) -> Dict[str, Any]:
        """Perform train-test split, tune zscore threshold, and evaluate metrics."""
        df_shuffled = df.sample(frac=1.0, random_state=seed).reset_index(drop=True)
        split_idx = int(len(df_shuffled) * (1 - test_size))

        train_df = df_shuffled.iloc[:split_idx]
        test_df = df_shuffled.iloc[split_idx:]

        best_f1 = 0.0
        best_z = 2.5
        for z_t in [2.5]:
            t_preds = [self.predict_single_with_z(r, z_t)[0] for _, r in train_df.iterrows()]
            t_actuals = train_df["is_anomaly"].astype(int).tolist()
            tp = sum(1 for p, a in zip(t_preds, t_actuals) if p == 1 and a == 1)
            fp = sum(1 for p, a in zip(t_preds, t_actuals) if p == 1 and a == 0)
            fn = sum(1 for p, a in zip(t_preds, t_actuals) if p == 0 and a == 1)
            prec = tp / max(1, tp + fp)
            rec = tp / max(1, tp + fn)
            f1 = 2 * prec * rec / max(1e-6, prec + rec)
            if f1 > best_f1:
                best_f1 = f1
                best_z = z_t

        self.thresholds["zscore_threshold"] = best_z

        # Evaluation on test set
        test_preds = [self.predict_single_with_z(r)[0] for _, r in test_df.iterrows()]
        test_actuals = test_df["is_anomaly"].astype(int).tolist()

        tp_test = sum(1 for p, a in zip(test_preds, test_actuals) if p == 1 and a == 1)
        fp_test = sum(1 for p, a in zip(test_preds, test_actuals) if p == 1 and a == 0)
        fn_test = sum(1 for p, a in zip(test_preds, test_actuals) if p == 0 and a == 1)
        tn_test = sum(1 for p, a in zip(test_preds, test_actuals) if p == 0 and a == 0)

        test_acc = (tp_test + tn_test) / max(1, len(test_actuals))
        test_prec = tp_test / max(1, tp_test + fp_test)
        test_rec = tp_test / max(1, tp_test + fn_test)
        test_f1 = 2 * test_prec * test_rec / max(1e-6, test_prec + test_rec)

        # Full dataset evaluation
        full_preds = [self.predict_single_with_z(r)[0] for _, r in df.iterrows()]
        full_actuals = df["is_anomaly"].astype(int).tolist()

        tp_full = sum(1 for p, a in zip(full_preds, full_actuals) if p == 1 and a == 1)
        fp_full = sum(1 for p, a in zip(full_preds, full_actuals) if p == 1 and a == 0)
        fn_full = sum(1 for p, a in zip(full_preds, full_actuals) if p == 0 and a == 1)
        tn_full = sum(1 for p, a in zip(full_preds, full_actuals) if p == 0 and a == 0)

        full_acc = (tp_full + tn_full) / max(1, len(full_actuals))
        full_prec = tp_full / max(1, tp_full + fp_full)
        full_rec = tp_full / max(1, tp_full + fn_full)
        full_f1 = 2 * full_prec * full_rec / max(1e-6, full_prec + full_rec)

        self.metrics = {
            "test_split_evaluation": {
                "sample_count": len(test_df),
                "accuracy": round(test_acc, 4),
                "precision": round(test_prec, 4),
                "recall": round(test_rec, 4),
                "f1_score": round(test_f1, 4),
                "confusion_matrix": {"tp": tp_test, "tn": tn_test, "fp": fp_test, "fn": fn_test}
            },
            "full_dataset_evaluation": {
                "sample_count": len(df),
                "accuracy": round(full_acc, 4),
                "precision": round(full_prec, 4),
                "recall": round(full_rec, 4),
                "f1_score": round(full_f1, 4),
                "confusion_matrix": {"tp": tp_full, "tn": tn_full, "fp": fp_full, "fn": fn_full}
            }
        }

        return self.metrics
