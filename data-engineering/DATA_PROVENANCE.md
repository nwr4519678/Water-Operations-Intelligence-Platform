# Water Telemetry Data Sources

## Source Comparison Table

| Source | Coverage | Time Range | Sampling Rate | License |
| :--- | :--- | :--- | :--- | :--- |
| **USGS Water Data API** <br>*(Recommended Primary Dataset)* | US rivers, lakes, groundwater wells (per station)[cite: 3] | Ongoing, years of history[cite: 3] | 15-min continuous + daily aggregates[cite: 3] | Public domain - fully redistributable, no restriction, no attribution required[cite: 3] |
| **Kaggle: Water Level Sambir (Anna Haiovych)** <br>*(Fallback Fixture)* | Dniester River at Sambir, Ukraine[cite: 3] | Full year 2024[cite: 3] | Hourly, but only hours 0–8 each day (partial daily coverage, not 24h continuous)[cite: 3] | CC BY-SA 4.0 - redistributable with attribution, and any redistributed/derivative version must carry the same CC BY-SA 4.0 license (share-alike)[cite: 3] |
| **Kaggle: Water Pump RUL Predictive Maintenance (Ansel D'souza)** <br>*(Equipment Analytics)* | Single water pump telemetry | Operational lifecycle to failure | Continuous sensor data (RUL given in hours) | CC0: Public Domain - fully redistributable, no restriction |

## Provenance & License Notes

* **USGS:** Agency-documented sensor network, per-station metadata, parameter codes[cite: 3].
* **Water Level Sambir:** Single-river, single-location dataset (Dniester River, western Ukraine) — real operational water-level data[cite: 3].
* **Water Pump RUL:** Contains continuous sensor data from a water pump explicitly mapped to the Remaining Useful Life (RUL) in hours, designed for predictive maintenance modeling.
* **CC BY-SA 4.0:** Specifically means you can commit it to the repo, but you must (a) credit the original author/dataset, and (b) if you publish any transformed/derived version of the data, that derivative also has to be shared under CC BY-SA 4.0 — this is stricter than USGS's public domain[cite: 3].
* **CC0: Public Domain:** The RUL dataset has been dedicated to the public domain by the creator, meaning it can be copied, modified, and distributed without asking permission.

## Redistribution Status

* **USGS data:** Can be redistributed inside the repository (public domain)[cite: 3].
* **Water Pump RUL:** Can be safely redistributed inside the repository (CC0: Public Domain).
* **Water Level Sambir:** Can be redistributed inside the repository under CC BY-SA 4.0, with attribution to the original Kaggle dataset/author included in repo data documentation[cite: 3].

## Sources URLs

* **USGS Water Data API:** [https://api.waterdata.usgs.gov/](https://api.waterdata.usgs.gov/)[cite: 3]
* **Kaggle Water Level Sambir:** [https://www.kaggle.com/datasets/annhaiovych/water-level](https://www.kaggle.com/datasets/annhaiovych/water-level)[cite: 3]
* **Kaggle Water Pump RUL:** [https://www.kaggle.com/datasets/anseldsouza/water-pump-rul-predictive-maintenance](https://www.kaggle.com/datasets/anseldsouza/water-pump-rul-predictive-maintenance)