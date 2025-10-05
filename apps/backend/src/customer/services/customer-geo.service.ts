import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CustomerGeoService {
  constructor(private readonly http: HttpService) {}

  async findGeomViaApi(
    strasse: string,
    hnr: string,
    plz: string,
    ort: string,
  ): Promise<{ lon: number; lat: number } | null> {
    const bbox_param =
      'bbox=6.470947,51.288547,7.051849,51.599254&bbox-crs=http%3A%2F%2Fwww.opengis.net%2Fdef%2Fcrs%2FOGC%2F1.3%2FCRS84&crs=http%3A%2F%2Fwww.opengis.net%2Fdef%2Fcrs%2FOGC%2F1.3%2FCRS84';

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

    if (!strasse || !hnr || !plz || !ort) {
      return null;
    }

    try {
      const url = `https://ogc-api.nrw.de/gebref/v1/collections/gebref/items?${bbox_param}&str=${encodeURI(strasse)}&hnr=${encodeURI(hnr)}`;
      let res = await firstValueFrom(this.http.get(url));

      if (!res.data.features.length) {
        const [hnr1, adz] = splitHnr(hnr);
        // console.log(strasse, hnr1, adz);
        if (!adz || !hnr1) return null;
        const url_zusatz = `https://ogc-api.nrw.de/gebref/v1/collections/gebref/items?${bbox_param}&str=${encodeURI(strasse)}&hnr=${encodeURI(hnr1)}&adz=${encodeURI(adz)}`;
        res = await firstValueFrom(this.http.get(url_zusatz));
      }

      if (!res.data.features.length) return null;

      // Feature mit höchster Score oder bestem Match
      const feature = res.data.features[0];
      const coords = feature.geometry.coordinates;

      if (!coords || coords.length < 2) {
        return null;
      }

      // const [lon, lat] = coords;
      // console.log(`lon:${lon}\nlat:${lat}`);

      return { lon: coords[0], lat: coords[1] };
    } catch (err) {
      return null;
    }
  }
}
