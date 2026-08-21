# Water Telemetry Data Sources

## Source Comparison Table

| Source | Coverage | Time Range | Sampling Rate | License |
| :--- | :--- | :--- | :--- | :--- |
| **USGS Water Data API** <br>*(Recommended Primary Dataset)* | US rivers, lakes, groundwater wells (per station) | Ongoing, years of history | 15-min continuous + daily aggregates | Public domain - fully redistributable, no restriction, no attribution required |
| **Kaggle: Water Level Sambir (Anna Haiovych)** <br>*(Fallback Fixture)* | Dniester River at Sambir, Ukraine | Full year 2024 | Hourly, but only hours 0–8 each day (partial daily coverage, not 24h continuous) | CC BY-SA 4.0 - redistributable with attribution, and any redistributed/derivative version must carry the same CC BY-SA 4.0 license (share-alike) |

## Provenance & License Notes

* **USGS:** Agency-documented sensor network, per-station metadata, parameter codes[cite: 1].
* **Water Level Sambir:** Single-river, single-location dataset (Dniester River, western Ukraine) — real operational water-level data[cite: 1].
* **CC BY-SA 4.0:** Specifically means you can commit it to the repo, but you must (a) credit the original author/dataset, and (b) if you publish any transformed/derived version of the data, that derivative also has to be shared under CC BY-SA 4.0 — this is stricter than USGS's public domain[cite: 1].

## Redistribution Status

* **USGS data:** Can be redistributed inside the repository (public domain)[cite: 1].
* **Water Level Sambir:** Can be redistributed inside the repository under CC BY-SA 4.0, with attribution to the original Kaggle dataset/author included in repo data documentation[cite: 1].

## Sources URLs

* **USGS Water Data API:** [https://api.waterdata.usgs.gov/](https://api.waterdata.usgs.gov/)[cite: 1]
* **Kaggle Water Level Sambir:** [https://www.kaggle.com/datasets/annhaiovych/water-level](https://www.kaggle.com/datasets/annhaiovych/water-level)[cite: 1]