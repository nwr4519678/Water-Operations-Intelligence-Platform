import pandas as pd

def export_station_readings(station_readings):
    df = pd.DataFrame(station_readings)

    aggreagation_rule = {
        "Gage height" : "mean",
        "Streamflow" : "mean",
        "Temperature" : "mean",
        "Precipitation" : "sum"
    }

    safe_rules = {column: rule for column, rule in aggreagation_rule.items() if column in df.columns}

    hourly_df = df.resample("1h").agg(safe_rules)

    hourly_df.to_csv("Hourly_Telemetry_Readings.csv")