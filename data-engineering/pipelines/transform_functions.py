import pandas as pd


def transform_telemtry_readings(telemetry_readings):
    readings_dict = {}

    for series in telemetry_readings["value"]["timeSeries"]:
        variable_name = series["variable"]["variableName"].split(",")[0]

        time_lst = []
        values_lst = []

        for val_container in series["values"]:

            for point in val_container["value"]:
                if point["value"] == "-999999.0":
                    values_lst.append(None)
                else:
                    values_lst.append(float(point["value"]))

                time_lst.append(point["dateTime"])

        readings_dict[variable_name] = pd.Series(
            values_lst, index=pd.to_datetime(time_lst, utc=True)
        )

    return readings_dict