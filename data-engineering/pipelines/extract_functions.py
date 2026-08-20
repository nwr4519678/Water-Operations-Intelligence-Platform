import requests, json

def extract_telemetry_readings(site_id: str, start_dt: str, end_dt: str):
    """
    Pulls telemetry readings
    Parameters:
    00065 : Water Level
    00060 : Flow Rate
    00010 : Water temp.
    00045 : Precipitation 
    """


    url = (
        f"https://waterservices.usgs.gov/nwis/iv/?format=json&sites={site_id}"
        f"&startDT={start_dt}&endDT={end_dt}&parameterCd=00065,00060,00010,00045"
    )

    try:
        response = requests.get(url)
        response.raise_for_status()
            
        data = response.json()

        return data
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")

