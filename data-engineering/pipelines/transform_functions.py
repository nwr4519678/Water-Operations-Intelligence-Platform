import pandas as pd

def transform_telemtry_readings(telemetry_readings):
    readings_dict = {}

    for series in telemetry_readings["value"]["timeSeries"]:
        variable_name = series["variable"]["variableName"].split(",")[0]

        time_lst = []
        values_lst = []
        qa_flags_lst = []  

        for val_container in series["values"]:
            for point in val_container["value"]:
                time_lst.append(point["dateTime"])
                
                if point["value"] == "-999999.0":
                    values_lst.append(None)
                    qa_flags_lst.append("ERR_SENTINEL_MISSING") # Quarantine reason code
                
                else:
                    val = float(point["value"])
                    
                    if variable_name == "Gage height":
                        val = val * 0.3048
                    elif variable_name == "Streamflow":
                        val = val * 0.0283168
                    elif variable_name == "Precipitation":
                        val = val * 25.4
                        
                    values_lst.append(val)
                    qa_flags_lst.append("VALID")

        dt_index = pd.to_datetime(time_lst, utc=True)
        readings_dict[variable_name] = pd.Series(values_lst, index=dt_index)
        
        readings_dict[f"{variable_name}_qa_flag"] = pd.Series(qa_flags_lst, index=dt_index)

    return readings_dict

def transform_pump_rul_data(df: pd.DataFrame):
    df.columns = df.columns.str.strip()

    time_col = "timestamp" 
    
    if time_col in df.columns:
        df[time_col] = pd.to_datetime(df[time_col])
        df.set_index(time_col, inplace=True)
        print("Standardized Timestamps.")
    else:
        print(f"\nCRITICAL ERROR: '{time_col}' not found!")
        print(f"Available columns in your CSV: {df.columns.tolist()[:10]}...")
        raise KeyError(f"Missing time column. Please update the 'time_col' variable.")

    print("Resampling data to 1-hour intervals...")
    hourly_df = df.resample("1h").mean()

    total_missing = hourly_df.isna().sum().sum()
    dead_sensors = [col for col in hourly_df.columns if hourly_df[col].nunique() <= 1]
    
    print("\n--- RUL DATASET VALIDATION ---")
    print(f"Total Missing Values: {total_missing}")
    if dead_sensors:
        print(f"Warning: Found static sensors with zero variance: {dead_sensors}")
    else:
        print("All sensors show variance.")

    return hourly_df

def evaluate_station_health(row):
    if pd.isna(row.get('Streamflow')) or row.get('Streamflow_qa_flag') != 'VALID':
        return pd.Series(['Offline', 'CRITICAL_ALARM: Sensor data missing or invalid'])
    
    streamflow = row['Streamflow']
    if streamflow < 10.0:
        return pd.Series(['Warning', 'WARN: Low flow rate detected'])
    elif streamflow > 500.0:
        return pd.Series(['Warning', 'WARN: High flow rate detected (Flood risk)'])
        
    return pd.Series(['Online', 'Resolved: Operating normally'])