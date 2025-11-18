set client_encoding = 'utf-8';
begin;
truncate table static_data.gebaeude;
\ copy static_data.gebaeude(
    nba,
    oid,
    qua,
    landschl,
    land,
    regbezschl,
    regbez,
    kreisschl,
    kreis,
    gmdschl,
    gmd,
    ottschl,
    ott,
    strschl,
    str,
    hnr,
    adz,
    zone,
    ostwert,
    nordwert,
    datum
)
from 'gebref.txt' delimiter ';';
commit;