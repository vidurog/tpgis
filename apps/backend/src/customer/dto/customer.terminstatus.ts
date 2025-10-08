// customer.terminstatus.ts
/**
 * Status eines konkret geplanten Termins.
 *
 * @remarks
 * Dient zur Prozesssteuerung (Angebot → Bestätigung → ggf. Absage).
 */
export enum CUSTOMER_TERMINSTATUS {
  /** Termin wurde angeboten, aber noch nicht bestätigt. */
  ANGEBOTEN = 'angeboten',

  /** Termin ist bestätigt. */
  BESTAETIGT = 'bestaetigt',

  /** Termin wurde abgesagt. */
  ABGESAGT = 'abgesagt',
}
