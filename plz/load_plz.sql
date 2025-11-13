--https://opendata-esridech.hub.arcgis.com/datasets/5b203df4357844c8a6715d7d411a8341_0/explore

set search_path = static_data,public;

set client_encoding = 'utf-8';

create temp table temp_plz
(
    val text
);

\copy temp_plz(val) from 'PLZ_Gebiete.geojson' with (format text);

begin;

truncate table plz;

with j as (select translate(val, chr(9) || chr(10) || chr(13), '   ')::json val from temp_plz),
     f as (select json_array_elements(val -> 'features') feature from j),
     fp as (select st_geomfromgeojson(feature -> 'geometry') geom, feature -> 'properties' properties from f)
insert
into plz (plz, shape)
select --(properties ->> 'OBJECTID')::int,
       properties ->> 'plz',
       --properties ->> 'note',
       --(properties ->> 'einwohner')::int,
       --(properties ->> 'qkm')::numeric,
       st_transform(geom, 25832)
from fp;

-- Relevant: wird benutzt für Kundenadressen
-- Aktiv: wird angezeigt

update plz
set relevant = plz = any
      ('{47198,47055,45476,47259,47119,47059,47279,47051,47226,47053,47057,47179,47139,47249,45468,47058,45470,45473,45472,45475,45478,45481,45479,47138,47167,47229,47228,47239,47269,40885}'::text[]),
     aktiv = plz = any
      ('{47055,45476,47259,47279,47051,47226,47053,47057,47249,45468,47058,45470,45473,45472,45475,45478,45481,45479,47229,47228,47239,47269}'::text[]);

commit;