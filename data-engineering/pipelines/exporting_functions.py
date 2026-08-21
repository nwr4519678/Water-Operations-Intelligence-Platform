import pandas as pd
from pathlib import Path

def evaluate_station_health(row):
    flag_cols = [c for c in row.index if c.endswith('_qa_flag')]
    if not flag_cols or any(row[col] != "VALID" for col in flag_cols):
        return pd.Series(['Critical', 'CRITICAL_ALARM: Sensor data missing or invalid'])
    
    streamflow = row.get('Streamflow')
    if pd.notna(streamflow):
        if streamflow < 10.0:
            return pd.Series(['Warning', 'WARN: Low flow rate detected'])
        elif streamflow > 500.0:
            return pd.Series(['Warning', 'WARN: High flow rate detected (Flood risk)'])
        
    return pd.Series(['Online', 'Resolved: Operating normally'])

def export_station_readings(station_name, station_readings):
    if isinstance(station_readings, pd.DataFrame):
        df = station_readings.copy()
    else:
        df = pd.DataFrame(station_readings)

    if not isinstance(df.index, pd.DatetimeIndex):
        time_col = None
        for col in df.columns:
            if 'time' in col.lower() or 'date' in col.lower():
                time_col = col
                break
                
        if time_col:
            df[time_col] = pd.to_datetime(df[time_col], utc=True)
            df.set_index(time_col, inplace=True)
        else:
            print(f"\nCRITICAL ERROR: No time column found for {station_name}!")
            print(f"Available columns received from transform step: {df.columns.tolist()}")
            raise KeyError("Missing time column to resample.")

    safe_rules = {}
    for col in df.columns:
        if col.endswith("_qa_flag"):
            safe_rules[col] = "last"
        elif "Precipitation" in col:
            safe_rules['Precipitation'] = lambda x: x.sum(min_count=1)
        else:
            safe_rules[col] = "mean"

    hourly_df = df.resample("1h").agg(safe_rules)
    hourly_df.dropna(axis=1, how='all', inplace=True)
    
    hourly_df[['Station_State', 'Active_Alarms']] = hourly_df.apply(evaluate_station_health, axis=1)
    
    data_year = hourly_df.index[0].year
    safe_name = station_name.replace(" ", "_").replace(",", "").replace("/", "_")
    
    current_script_dir = Path(__file__).parent
    output_dir = current_script_dir.parent / "CSVs"
    output_dir.mkdir(parents=True, exist_ok=True)

    flag_cols = [c for c in hourly_df.columns if c.endswith("_qa_flag")]
    quarantine_mask = hourly_df[flag_cols].apply(lambda x: x != "VALID").any(axis=1)
    
    quarantine_df = hourly_df[quarantine_mask]
    clean_df = hourly_df[~quarantine_mask] 

    clean_path = output_dir / f"CLEAN_{safe_name}_{data_year}.csv"
    clean_df.to_csv(clean_path)

    quarantine_path = output_dir / f"QUARANTINE_{safe_name}_{data_year}.csv"
    quarantine_df.to_csv(quarantine_path)

    total_records = len(hourly_df)
    quarantine_count = len(quarantine_df)
    clean_count = len(clean_df)
    
    report_content = (
        f"--- VALIDATION REPORT: {station_name} ---\n"
        f"Total Hourly Records Processed: {total_records}\n"
        f"Clean Records: {clean_count}\n"
        f"Quarantined Records: {quarantine_count}\n"
        f"Data Completeness: {(clean_count / total_records) * 100:.2f}%\n"
        f"Sensors Tracked: {[c for c in hourly_df.columns if not c.endswith('_qa_flag')]}\n"
    )
    
    with open(output_dir / f"VALIDATION_REPORT_{safe_name}_{data_year}.txt", "w") as f:
        f.write(report_content)

    return hourly_df

def export_pump_rul_data(hourly_df: pd.DataFrame):
    current_script_dir = Path(__file__).parent
    output_dir = current_script_dir.parent / "CSVs"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    output_path = output_dir / "AI_READY_Hourly_Pump_RUL.csv"
    
    hourly_df.to_csv(output_path)
    
    print(f"Final dataset exported to: {output_path}")
    return hourly_df