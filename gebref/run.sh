echo "##############"
echo "Initialize Database"
echo "##############"

cd ~/Developer/tpgis_healthcare/tpgis/gebref

curl -O https://www.opengeodata.nrw.de/produkte/geobasis/lk/akt/gebref_txt/gebref_EPSG25832_ASCII.zip

unzip gebref_EPSG25832_ASCII.zip

cd ~/Developer/tpgis_healthcare/tpgis

docker cp gebref/gebref.txt db:/tmp/gebref/gebref.txt
docker cp gebref/load_data.sql db:/tmp/gebref/load_data.sql
docker cp plz db:/tmp/plz

docker exec -it db bash
cd /tmp

psql -U app -d tpgis_healthcare -f gebref/load_data.sql
psql -U app -d tpgis_healthcare -f plz/load_plz.sql

exit

cd ~/Developer/tpgis_healthcare/tpgis/gebref
rm -r gebref_*.txt
rm -r gebref_*.zip
rm -r gebref.txt

echo ""
echo "##############"
echo "Init Done"
echo "##############"





