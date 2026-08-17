"""Stable contracts shared by data pipelines and downstream consumers."""

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class RawMeasurement:
    station_id: str
    parameter: str
    device_timestamp: datetime
    value: float
    unit: str
