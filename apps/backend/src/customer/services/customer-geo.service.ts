// src/customer/services/customer-geo.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CustomerGeoService {
  constructor(private readonly http: HttpService) {}

  /**
   * **Fallback-Geokodierung** über die öffentliche **NRW OGC API – Gebäudereferenz**.
   *
   * @remarks
   * - Primärer Versuch: Suche mit Straße + Hausnummer.
   * - Fallback: Splittet Hausnummer in **numerischen Teil** und **Zusatz** (z. B. `12a` → `12` + `a`)
   *   und versucht `&hnr=<num>&adz=<suffix>`.
   * - Der **BBox-Parameter** schränkt die Suche auf NRW/Raum Duisburg/Mülheim ein (CRS84/WGS84).
   * - Liefert `null`, wenn kein geeignetes Feature gefunden wird oder bei Request-Fehlern.
   *
   * @param strasse Straßenname (wie eingegeben)
   * @param hnr Hausnummer (z. B. "12", "12a", "12-14")
   * @param plz Postleitzahl (wird aktuell nicht im Request genutzt, gehört aber zur Vollständigkeit dazu)
   * @param ort Ort (wird aktuell nicht im Request genutzt)
   * @returns `{ lon, lat }` bei Erfolg, sonst `null`
   */
  async findGeomViaApi(
    strasse: string,
    hnr: string,
    plz: string,
    ort: string,
  ): Promise<{ lon: number; lat: number } | null> {
    // Fester Bounding-Box-Ausschnitt (CRS84/WGS84) für die Anfrage – hält die Ergebnisse lokal/relevant.
    const bbox_param =
      'bbox=6.470947,51.288547,7.051849,51.599254&bbox-crs=http%3A%2F%2Fwww.opengis.net%2Fdef%2Fcrs%2FOGC%2F1.3%2FCRS84&crs=http%3A%2F%2Fwww.opengis.net%2Fdef%2Fcrs%2FOGC%2F1.3%2FCRS84';

    /**
     * Zerlegt eine Hausnummer in **numerischen Teil** und **Zusatz**.
     *
     * Unterstützte Fälle:
     * - `"12"`, `"12a"`, `"12 a"`, `"12-14"`, `"12-14b"`, `"2n"`
     * - Fallback: erste Zahl = Hausnummer, Rest als Zusatz
     *
     * @returns `[nummerOderBereich, zusatzOderNull]`
     */
    const splitHnr = (hnr: string) => {
      const s = hnr
        .trim()
        .replace(/[–—−]/g, '-') // verschiedene Gedankenstriche → "-"
        .replace(/\s+/g, ' ');

      // Fälle: "12", "12a", "12 a", "12-14", "12-14b", "2n"
      const m = s.match(/^(\d+(?:\s*[-/]\s*\d+)*)(?:\s*([A-Za-z]{1,3}))?$/);
      if (m) {
        return [
          m[1].replace(/\s+/g, ''), // "12-14" oder "12"
          m[2] ? m[2].toLowerCase() : null, //
        ];
      }

      // Fallback: nimm erste Zahl als HNR, Rest als Zusatz
      const m2 = s.match(/^(\d+)(.*)$/);
      if (m2) {
        return [m2[1], m2[2].trim().toLowerCase() || null];
      }

      // gar keine Zahl erkannt → alles als "hnr"
      return [s, null];
    };

    // Minimalvalidierung – ohne vollständige Adressdaten macht eine Anfrage keinen Sinn.
    if (!strasse || !hnr || !plz || !ort) {
      return null;
    }

    try {
      // 1) Primäre Suche: Straße + Hausnummer (wie angegeben)
      const url = `https://ogc-api.nrw.de/gebref/v1/collections/gebref/items?${bbox_param}&str=${encodeURI(strasse)}&hnr=${encodeURI(hnr)}`;
      let res = await firstValueFrom(this.http.get(url));

      // 2) Fallback: Hausnummer splitten und mit Zusatz (`adz`) versuchen
      if (!res.data.features.length) {
        const [hnr1, adz] = splitHnr(hnr);
        if (!adz || !hnr1) return null;
        const url_zusatz = `https://ogc-api.nrw.de/gebref/v1/collections/gebref/items?${bbox_param}&str=${encodeURI(strasse)}&hnr=${encodeURI(hnr1)}&adz=${encodeURI(adz)}`;
        res = await firstValueFrom(this.http.get(url_zusatz));
      }

      // 3) Kein Feature → kein Treffer
      if (!res.data.features.length) return null;

      // 4) Bestes Feature wählen (hier: erstes; API enthält ggf. Score/Sortierung)
      const feature = res.data.features[0];
      const coords = feature.geometry.coordinates;

      // 5) Koordinaten validieren
      if (!coords || coords.length < 2) {
        return null;
      }

      // Erfolgreich: LON/LAT zurückgeben (CRS84/WGS84)
      return { lon: coords[0], lat: coords[1] };
    } catch (err) {
      // Network-/API-/Parsing-Fehler → defensiv: null zurückgeben (keine Exception nach außen).
      return null;
    }
  }
}
