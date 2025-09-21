DROP TABLE IF EXISTS kunden;

CREATE TABLE IF NOT EXISTS kunden (
    kundennummer           text PRIMARY KEY,
    nachname               text,
    vorname                text,
    strasse                text,
    hnr                    text,
    plz                    text,
    ort                    text,
    telefon                text,
    mobil                  text,
    geburtstag             date,
    kennung                text,
    start                  date,
    ende                   date,
    auftraege              text,
    serviceberater         text,
    besuchrhythmus         text,
    qs_besuch_datum        date,
    qs_besuch_art          text,
    qs_besuch_historik     date,
    qs_besuch_hinweis_1    text,
    qs_besuch_hinweis_2    text,
    geom                   geometry(Point,4326),
    planmonat              date,
    termin                 timestamptz,
    termindauer_min        integer,
    terminstatus           text,
    termingrund            text,
    reihenfolge_nr         integer,
    parken                 text,
    bemerkung              text,
    datenfehler            boolean NOT NULL DEFAULT false,
    begruendung_datenfehler text,
    aktiv                  boolean NOT NULL DEFAULT true
);

CREATE INDEX kunden_geom_gix ON kunden USING GIST (geom);
