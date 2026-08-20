import requests, json

def usgs():
    site_id = "09504500"

    url = f"https://waterservices.usgs.gov/nwis/iv/?format=json&sites={site_id}&siteStatus=all"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        data = response.json()
        
        with open("api_response.json", "w") as file:
            json.dump(data, file, indent=4)
            
        print("Data successfully saved to api_response.json")
        
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")

if __name__ == "__main__":
    usgs()