from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List, Dict, Any


@dataclass(frozen=True)
class RawMeasurement:
    station_id: str
    parameter: str
    device_timestamp: datetime
    value: float
    unit: str


@dataclass(frozen=True)
class DahitiStationInfo:
    dahiti_id: int
    target_name: str
    water_body_type: str
    latitude: float
    longitude: float
    country: str = "Egypt"
    continent: str = "Africa"


@dataclass(frozen=True)
class DahitiRawObservation:
    dahiti_id: int
    target_name: str
    timestamp: str
    wse: float  # Water Surface Elevation in meters
    wse_u: float  # Uncertainty in meters
    satellite_mission: str


@dataclass
class AnomalyDatasetRecord:
    dahiti_id: int
    target_name: str
    water_body_type: str
    latitude: float
    longitude: float
    timestamp: str
    wse: float
    wse_u: float
    satellite_mission: str
    rolling_mean_7d: float
    rolling_std_7d: float
    rolling_zscore_7d: float
    rolling_mean_30d: float
    rolling_std_30d: float
    rolling_zscore_30d: float
    dwse_dt: float
    seasonal_climatology_median: float
    seasonal_anomaly: float
    uncertainty_ratio: float
    iqr_outlier_flag: int
    is_anomaly: int
    anomaly_category: str


@dataclass
class WaterLevelDatasetRecord:
    dahiti_id: int
    target_name: str
    water_body_type: str
    latitude: float
    longitude: float
    timestamp: str
    wse: float
    is_interpolated: int
    day_of_year: int
    month: int
    quarter: int
    sin_month: float
    cos_month: float
    wse_lag1: Optional[float]
    wse_lag3: Optional[float]
    wse_lag7: Optional[float]
    wse_lag14: Optional[float]
    wse_lag30: Optional[float]
    wse_max_30d: float
    wse_min_30d: float
    wse_mean_30d: float
    upstream_wse: Optional[float]
    target_wse_1d: Optional[float]
    target_wse_7d: Optional[float]
    target_wse_14d: Optional[float]
    target_wse_30d: Optional[float]
    water_level_state: str

