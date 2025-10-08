// apps/backend/src/imports/imports.types.ts

/**
 * Roh-Datensatz im **Staging**-Bereich (aus Importen).
 *
 * @remarks
 * - Repräsentiert eine einzelne Zeile aus einer Importquelle (z. B. XLSX).
 * - Die meisten Felder sind **Strings**, auch wenn sie semantisch Daten/Zeiten sind.
 *   Die eigentliche Typisierung/Umwandlung erfolgt später in der Pipeline (Normalisierung/DTO).
 * - `imported_at` ist bereits als `Date` gesetzt (Zeitpunkt des Imports im System).
 *
 * @example
 * ```ts
 * const row: StagingDto = {
 *   import_id: '1759862061432',
 *   imported_at: new Date(),
 *   imported_by: 'leon',
 *   kunde: 'Mustermann, Max',
 *   strasse: 'Musterstr. 12a',
 *   plz: '12345',
 *   ort: 'Musterstadt',
 *   telefon: '+49 (0) 201 123456',
 *   mobil: null,
 *   geburtstag: '1980-01-01',
 *   kennung: 'Pflegegrad 3',
 *   start: '2025-01-10',
 *   ende: null,
 *   auftraege: '§ 36 SGB XI',
 *   serviceberater: 'Erika Musterfrau',
 *   besuchrhythmus: '3 Monate',
 *   qs_besuch_datum: '2025-03-05',
 *   qs_besuch_art: 'Vor-Ort',
 *   qs_besuch_historik: '2024-12-05',
 *   qs_besuch_hinweis_1: null,
 *   qs_besuch_hinweis_2: null,
 * };
 * ```
 */
export type StagingDto = {
  /** Importlauf-ID (z. B. Timestamp-basiert), gruppiert die Zeilen eines Imports. */
  import_id: string;

  /** Zeitpunkt, zu dem die Zeile ins Staging übernommen wurde. */
  imported_at: Date;

  /** Benutzer/Konto, das den Import durchgeführt hat. */
  imported_by: string;

  /** Rohwert für "Kunde" (oft im Format "Nachname, Vorname"). */
  kunde: string | null;

  /** Straßenangabe (unsaniert). */
  strasse: string | null;

  /** Postleitzahl (als Text, da führende Nullen möglich). */
  plz: string | null;

  /** Ort/ Stadt (unsaniert). */
  ort: string | null;

  /** Festnetznummer (Rohwert). */
  telefon: string | null;

  /** Mobilnummer (Rohwert). */
  mobil: string | null;

  /** Geburtstag als String (z. B. "YYYY-MM-DD"); Parsing erfolgt später. */
  geburtstag: string | null;

  /** Interne Kennung, z. B. "Pflegegrad 3". */
  kennung: string | null;

  /** Startdatum als String (z. B. "YYYY-MM-DD"). */
  start: string | null;

  /** Endedatum als String (z. B. "YYYY-MM-DD"). */
  ende: string | null;

  /** Beauftragte Leistungen (Rohtext). */
  auftraege: string | null;

  /** Zuständige/r Serviceberater/in (Rohtext). */
  serviceberater: string | null;

  /** Besuchsrhythmus (z. B. "3 Monate"). */
  besuchrhythmus: string | null;

  /** QS-Besuchsdatum als String. */
  qs_besuch_datum: string | null;

  /** QS-Besuchsart als String (frei). */
  qs_besuch_art: string | null;

  /** QS-Besuch: Historik-Datum als String. */
  qs_besuch_historik: string | null;

  /** QS-Besuch: Hinweisfeld 1 (Rohtext). */
  qs_besuch_hinweis_1: string | null;

  /** QS-Besuch: Hinweisfeld 2 (Rohtext). */
  qs_besuch_hinweis_2: string | null;
};

/**
 * Struktur eines **Validierungsfehlers** im Staging.
 *
 * @remarks
 * - `field` verweist auf das betroffene Feld in {@link StagingDto}.
 * - `message` ist die menschenlesbare Fehlermeldung.
 * - `row` (optional) kann die Zeilennummer aus der Quelle tragen (1-basiert o. ä.).
 *
 * @example
 * ```ts
 * const err: ValidationError = {
 *   field: 'besuchrhythmus',
 *   message: 'Kein Besuchrhythmus angegeben',
 *   row: 42,
 * };
 * ```
 */
export type ValidationError = {
  /** Name des betroffenen Felds im Staging-Datensatz. */
  field: keyof StagingDto;

  /** Fehlerbeschreibung für UI/Logging. */
  message: string;

  /** Optionale Referenz auf die Quellzeile (z. B. Excel-Zeile). */
  row?: number;
};

/**
 * Abbildung von **Import-Spaltennamen** (aus verschiedenen Quellen) auf Staging-Felder.
 *
 * @remarks
 * - Key (string) ist der erkannte/sprachliche Spaltenname aus der Quelle.
 * - `db` gibt an, **welches Feld** im {@link StagingDto} beschrieben wird.
 * - `aliases` enthält alternative Bezeichnungen (z. B. "PLZ", "Postleitzahl", "ZIP").
 * - `transform` kann den Rohwert der Quelle in einen passenden Zielwert überführen
 *   (z. B. Date-Parsing, Trimmen, Normalisieren).
 *
 * @example
 * ```ts
 * const columns: ColumnMap = {
 *   'Kunde': { db: 'kunde', aliases: ['Name', 'Kundenname'], transform: v => String(v).trim() },
 *   'Straße': { db: 'strasse', aliases: ['Strasse','Str.'] },
 *   'PLZ': { db: 'plz', aliases: ['Postleitzahl','ZIP'], transform: v => String(v).padStart(5,'0') },
 *   'Geburtstag': { db: 'geburtstag', aliases: ['Geb.-Datum'], transform: toIsoDateString },
 * };
 * ```
 */
export type ColumnMap = Record<
  string,
  {
    /** Zielspalte im {@link StagingDto}. */
    db: keyof StagingDto;

    /** Alternative Spaltenbezeichnungen aus der Quelle (Case/Whitespace-Varianz einkalkuliert). */
    aliases: string[];

    /**
     * Optionaler Transformationsschritt vom Rohwert zum Zielwert.
     * @param v Beliebiger Quellwert
     * @returns Transformierter Wert (typischerweise `string | null`)
     */
    transform?: (v: any) => any;
  }
>;
