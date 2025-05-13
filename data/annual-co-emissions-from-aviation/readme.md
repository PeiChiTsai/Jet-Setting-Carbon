# Annual CO₂ emissions from aviation - Data package

This data package contains the data that powers the chart ["Annual CO₂ emissions from aviation"](https://ourworldindata.org/grapher/annual-co-emissions-from-aviation?v=1&csvType=full&useColumnShortNames=false) on the Our World in Data website. It was downloaded on April 08, 2025.

### Active Filters

A filtered subset of the full data was downloaded. The following filters were applied:

## CSV Structure

The high level structure of the CSV file is that each row is an observation for an entity (usually a country or region) and a timepoint (usually a year).

The first two columns in the CSV file are "Entity" and "Code". "Entity" is the name of the entity (e.g. "United States"). "Code" is the OWID internal entity code that we use if the entity is a country or region. For normal countries, this is the same as the [iso alpha-3](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3) code of the entity (e.g. "USA") - for non-standard countries like historical countries these are custom codes.

The third column is either "Year" or "Day". If the data is annual, this is "Year" and contains only the year as an integer. If the column is "Day", the column contains a date string in the form "YYYY-MM-DD".

The final column is the data column, which is the time series that powers the chart. If the CSV data is downloaded using the "full data" option, then the column corresponds to the time series below. If the CSV data is downloaded using the "only selected data visible in the chart" option then the data column is transformed depending on the chart type and thus the association with the time series might not be as straightforward.

## Metadata.json structure

The .metadata.json file contains metadata about the data package. The "charts" key contains information to recreate the chart, like the title, subtitle etc.. The "columns" key contains information about each of the columns in the csv, like the unit, timespan covered, citation for the data etc..

## About the data

Our World in Data is almost never the original producer of the data - almost all of the data we use has been compiled by others. If you want to re-use data, it is your responsibility to ensure that you adhere to the sources' license and to credit them correctly. Please note that a single time series may have more than one source - e.g. when we stich together data from different time periods by different producers or when we calculate per capita metrics using population data from a second source.

## Detailed information about the data


## Total annual CO₂ emissions from aviation
Includes emissions from both domestic and international aviation. International aviation emissions are assigned to the country of departure. CO₂ emissions from commercial passenger flights only.
Last updated: March 11, 2025  
Next update: March 2026  
Date range: 2013–2024  
Unit: tonnes  


### How to cite this data

#### In-line citation
If you have limited space (e.g. in data visualizations), you can use this abbreviated in-line citation:  
OECD (2025) – processed by Our World in Data

#### Full citation
OECD (2025) – processed by Our World in Data. “Total annual CO₂ emissions from aviation” [dataset]. OECD, “Air transport CO2 emissions (experimental)” [original data].
Source: OECD (2025) – processed by Our World In Data

### What you should know about this data
* This data isn’t seasonally adjusted—summer travel increases emissions, but the actual impact may be lower as Northern Hemisphere plants absorb more CO₂ during this time.

### Source

#### OECD – Air transport CO2 emissions (experimental)
Retrieved on: 2025-03-11  
Retrieved from: https://data-explorer.oecd.org/vis?df[ds]=DisseminateFinalDMZ&df[id]=DSD_AIR_TRANSPORT%40DF_AIR_TRANSPORT&df[ag]=OECD.SDD.NAD.SEEA&dq=W%2BZWE%2BZMB%2BYEM%2BVNM%2BVEN%2BVUT%2BUZB%2BURY%2BARE%2BUKR%2BUGA%2BTUV%2BTKM%2BTUN%2BTTO%2BTON%2BTGO%2BTLS%2BTHA%2BTZA%2BTJK%2BSYR%2BTWN%2BSUR%2BSDN%2BLKA%2BSSD%2BZAF%2BSOM%2BSLB%2BSXM%2BSLE%2BSGP%2BSYC%2BSRB%2BSEN%2BSAU%2BSTP%2BSMR%2BWSM%2BVCT%2BLCA%2BKNA%2BRWA%2BRUS%2BROU%2BQAT%2BPHL%2BPER%2BPRY%2BPNG%2BPAN%2BPLW%2BPAK%2BOMN%2BMKD%2BNGA%2BNIU%2BNIC%2BNER%2BNRU%2BNPL%2BNAM%2BMMR%2BMOZ%2BMAR%2BMNE%2BMNG%2BMCO%2BMDA%2BFSM%2BMUS%2BMRT%2BMHL%2BMLT%2BMLI%2BMDV%2BMYS%2BMWI%2BMDG%2BMAC%2BLBY%2BLBR%2BLSO%2BLBN%2BLAO%2BKWT%2BKGZ%2BXKV%2BKIR%2BKEN%2BKAZ%2BJOR%2BJEY%2BJAM%2BIRQ%2BIDN%2BIRN%2BIND%2BHKG%2BHND%2BHTI%2BGUY%2BGNB%2BGIN%2BGTM%2BGRD%2BGHA%2BGEO%2BGMB%2BGAB%2BFJI%2BETH%2BSWZ%2BERI%2BGNQ%2BSLV%2BEGY%2BECU%2BDOM%2BDMA%2BCOD%2BDJI%2BPRK%2BCYP%2BCUB%2BHRV%2BCIV%2BCOK%2BCOG%2BCCK%2BCOM%2BCXR%2BCHN%2BTCD%2BCAF%2BCMR%2BKHM%2BCPV%2BBDI%2BBFA%2BBGR%2BBRN%2BBRA%2BBWA%2BBIH%2BBOL%2BBTN%2BBEN%2BBLZ%2BBLR%2BBRB%2BBGD%2BBHR%2BBHS%2BAZE%2BARM%2BARG%2BATG%2BAGO%2BDZA%2BALB%2BAFG%2BWXOECD%2BOECD%2BUSA%2BGBR%2BTUR%2BCHE%2BSWE%2BESP%2BSVN%2BSVK%2BPRT%2BPOL%2BNOR%2BNZL%2BNLD%2BMEX%2BLUX%2BLTU%2BLVA%2BKOR%2BJPN%2BITA%2BISR%2BIRL%2BISL%2BGRC%2BHUN%2BDEU%2BFIN%2BEST%2BDNK%2BCZE%2BCRI%2BCOL%2BCHL%2BBEL%2BCAN%2BAUT%2BAUS%2BFRA.M.....P.RES_TOTAL%2BTER_INT%2BTER_DOM%2BRES_ABROAD%2BNRES_TERR%2BNRES_INT_FROM%2BRES_INT_OUT%2BRES_INT_TO%2BRES_INT_FROM%2BNRES_DOM_IN%2BRES_DOM_OUT%2BRES_DOM_IN.&pd=2013-01%2C2024-12&to[TIME_PERIOD]=false&ly[cl]=TIME_PERIOD&ly[rw]=EMISSIONS_SOURCE%2CCOMBINED_UNIT_MEASURE%2CREF_AREA&vw=tb&format=csvfilewithlabels  


    