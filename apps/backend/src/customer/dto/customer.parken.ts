// customer.parken.ts
/**
 * Parksituation am Einsatzort.
 *
 * @remarks
 * Werte sind als **anzeigefertige Strings** hinterlegt und werden 1:1 in UI/Reports verwendet.
 * (Hinweis: Schreibweise/Orthografie der Werte wurde nicht verändert.)
 */
export enum CUSTOMER_PARKEN {
  /** Parkhaus in der Nähe / vorgesehen. */
  PARKHAUS = 'Parkhaus',

  /** Parken an der Straße. */
  STRASSE = 'Strasse',

  /** Ausgewiesener Parkplatz vorhanden. */
  PARKPLATZ = 'Parkplatz',

  /** Keine Parkmöglichkeit. */
  KEIN = 'Keine Parkmöglichkeit',

  /** Parkmöglichkeiten sind schwierig. */
  SCHWER = 'Parkmöglichkeiten schwieirg',
}
