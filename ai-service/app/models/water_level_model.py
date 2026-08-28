import logging
from typing import Dict, Any, List, Tuple
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor

logger = logging.getLogger(__name__)


class EnhancedWaterLevelModel:
    """Production Multi-Horizon Water Level Forecaster and Risk Classifier."""

    def __init__(self, weights: Dict[str, Any] = None):
        self.weights = weights or {
            "lag1_weight": 0.45,
            "lag7_weight": 0.25,
            "lag30_weight": 0.15,
            "upstream_weight": 0.15,
            "decay_factor_7d": 0.98,
            "decay_factor_14d": 0.95,
            "decay_factor_30d": 0.90
        }
        self.state_labels = ["Low_Water", "Normal", "High_Water", "Critical_Flood"]
        self.features = [
            "wse", "wse_lag1", "wse_lag3", "wse_lag7", "wse_lag14",
            "wse_lag30", "upstream_wse", "sin_month", "cos_month", "day_of_year"
        ]
        self.targets = ["target_wse_1d", "target_wse_7d", "target_wse_14d", "target_wse_30d", "water_level_state"]
        self.model_name = "EnhancedWaterLevelModel"
        self.model_version = "1.1.0"
        self.metrics = {}
        self.estimators = {}
        # Selected by time-based validation: keeps the latest holdout gain
        # over persistence while materially reducing the train/test gap.
        self.rf_config = {"n_estimators": 100, "max_depth": 12, "min_samples_leaf": 10, "n_jobs": 1}
        self.feature_columns = [
            "wse", "wse_lag1", "wse_lag3", "wse_lag7", "wse_lag14",
            "wse_lag30", "sin_month", "cos_month", "day_of_year"
        ]

    def fit_random_forest(self, df: pd.DataFrame, random_state: int = 42) -> None:
        """Fit one RF regressor per real observation horizon."""
        x = df[self.feature_columns].copy()
        x = x.fillna(df["wse"], axis=0).fillna(0.0)
        for offset in (1, 3, 7, 14, 30):
            target = f"target_wse_{offset}d"
            valid = df[target].notna()
            if valid.sum() < 10:
                continue
            estimator = RandomForestRegressor(random_state=random_state, **self.rf_config)
            estimator.fit(x.loc[valid], df.loc[valid, target].astype(float))
            self.estimators[target] = estimator

    def _rf_features(self, wse, lag1, lag7, lag30, upstream_wse, extra=None):
        extra = extra or {}
        row = {
            "wse": wse, "wse_lag1": lag1, "wse_lag3": extra.get("wse_lag3", lag1),
            "wse_lag7": lag7, "wse_lag14": extra.get("wse_lag14", lag7),
            "wse_lag30": lag30, "sin_month": extra.get("sin_month", 0.0),
            "cos_month": extra.get("cos_month", 1.0), "day_of_year": extra.get("day_of_year", 1)
        }
        return pd.DataFrame([row], columns=self.feature_columns)

    def predict_single(self, wse: float, lag1: float, lag7: float, lag30: float,
                       upstream_wse: float, extra: Dict[str, Any] = None) -> Tuple[Dict[str, float], str]:
        """Generate multi-horizon water level forecasts and risk state classification."""
        if self.estimators:
            features = self._rf_features(wse, lag1, lag7, lag30, upstream_wse, extra)
            forecasts = {
                f"target_wse_{offset}d": round(float(self.estimators[f"target_wse_{offset}d"].predict(features)[0]), 3)
                if f"target_wse_{offset}d" in self.estimators else round(float(wse), 3)
                for offset in (1, 7, 14, 30)
            }
            state = self._classify_state(wse)
            return forecasts, state

        w = self.weights
        base_estimate = (
            w["lag1_weight"] * lag1 +
            w["lag7_weight"] * lag7 +
            w["lag30_weight"] * lag30 +
            w["upstream_weight"] * (upstream_wse if upstream_wse < 100 else wse)
        )

        delta = wse - base_estimate

        forecast_1d = round(wse + 0.5 * delta, 3)
        forecast_7d = round(wse + 0.8 * delta * w["decay_factor_7d"], 3)
        forecast_14d = round(wse + 0.6 * delta * w["decay_factor_14d"], 3)
        forecast_30d = round(wse + 0.4 * delta * w["decay_factor_30d"], 3)

        # DAHITI stations use different local elevation datums. Keep the
        # operational state thresholds conservative; station-specific limits
        # belong in the backend profile rather than being inferred globally.
        state = self._classify_state(wse)

        forecasts = {
            "target_wse_1d": forecast_1d,
            "target_wse_7d": forecast_7d,
            "target_wse_14d": forecast_14d,
            "target_wse_30d": forecast_30d
        }

        return forecasts, state

    @staticmethod
    def _classify_state(wse: float) -> str:
        if wse < 20.0:
            return "Low_Water"
        if wse > 180.5:
            return "Critical_Flood"
        if wse > 179.5:
            return "High_Water"
        return "Normal"

    def fit_and_evaluate(self, df: pd.DataFrame, test_size: float = 0.20, seed: int = 42) -> Dict[str, Any]:
        """Perform train-test split, evaluate forecasting regression and risk state classification."""
        df_shuffled = df.sample(frac=1.0, random_state=seed).reset_index(drop=True)
        split_idx = int(len(df_shuffled) * (1 - test_size))

        train_df = df_shuffled.iloc[:split_idx]
        test_df = df_shuffled.iloc[split_idx:]

        def evaluate_subset(subset_df):
            y_true_7d, y_pred_7d = [], []
            state_true, state_pred = [], []

            for _, r in subset_df.iterrows():
                wse = float(r["wse"])
                lag1 = float(r["wse_lag1"]) if pd.notna(r["wse_lag1"]) else wse
                lag7 = float(r["wse_lag7"]) if pd.notna(r["wse_lag7"]) else wse
                lag30 = float(r["wse_lag30"]) if pd.notna(r["wse_lag30"]) else wse
                upstream = float(r["upstream_wse"]) if pd.notna(r["upstream_wse"]) else wse

                fc, pred_state = self.predict_single(
                    wse=wse, lag1=lag1, lag7=lag7, lag30=lag30, upstream_wse=upstream
                )

                if pd.notna(r.get("target_wse_7d")):
                    y_true_7d.append(float(r["target_wse_7d"]))
                    y_pred_7d.append(fc["target_wse_7d"])

                if pd.notna(r.get("water_level_state")):
                    state_true.append(str(r["water_level_state"]))
                    state_pred.append(pred_state)

            errors_7d = np.abs(np.array(y_true_7d) - np.array(y_pred_7d)) if y_true_7d else np.array([0.0])
            mae_7d = float(np.mean(errors_7d))
            rmse_7d = float(np.sqrt(np.mean(errors_7d ** 2)))

            ss_res = np.sum(errors_7d ** 2)
            ss_tot = np.sum((np.array(y_true_7d) - np.mean(y_true_7d)) ** 2) if len(y_true_7d) > 1 else 1.0
            r2_7d = float(1.0 - (ss_res / max(1e-6, ss_tot)))

            state_matches = sum(1 for t, p in zip(state_true, state_pred) if t == p)
            state_sample_count = len(state_true)
            state_acc = state_matches / state_sample_count if state_sample_count else None

            classes = list(set(state_true + state_pred))
            f1s, precs, recs = [], [], []
            for cls in classes:
                tp = sum(1 for t, p in zip(state_true, state_pred) if t == cls and p == cls)
                fp = sum(1 for t, p in zip(state_true, state_pred) if t != cls and p == cls)
                fn = sum(1 for t, p in zip(state_true, state_pred) if t == cls and p != cls)

                prec = tp / max(1, tp + fp)
                rec = tp / max(1, tp + fn)
                f1 = 2 * prec * rec / max(1e-6, prec + rec)
                precs.append(prec)
                recs.append(rec)
                f1s.append(f1)

            macro_prec = float(np.mean(precs)) if state_sample_count else None
            macro_rec = float(np.mean(recs)) if state_sample_count else None
            macro_f1 = float(np.mean(f1s)) if state_sample_count else None

            return {
                "sample_count": len(subset_df),
                "state_evaluation_samples": state_sample_count,
                "mae_target_7d_meters": round(mae_7d, 3),
                "rmse_target_7d_meters": round(rmse_7d, 3),
                "r2_score_7d": round(r2_7d, 4),
                "state_accuracy": round(state_acc, 4) if state_acc is not None else None,
                "state_precision": round(macro_prec, 4) if macro_prec is not None else None,
                "state_recall": round(macro_rec, 4) if macro_rec is not None else None,
                "state_f1_score": round(macro_f1, 4) if macro_f1 is not None else None
            }

        test_metrics = evaluate_subset(test_df)
        full_metrics = evaluate_subset(df)

        self.metrics = {
            "test_split_evaluation": test_metrics,
            "full_dataset_evaluation": full_metrics
        }

        return self.metrics
