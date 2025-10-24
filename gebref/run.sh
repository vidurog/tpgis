curl -O https://www.opengeodata.nrw.de/produkte/geobasis/lk/akt/gebref_txt/gebref_EPSG25832_ASCII.zip

unzip gebref_EPSG25832_ASCII.zip

psql -f load_data.sql


