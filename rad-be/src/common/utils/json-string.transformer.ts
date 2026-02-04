import { ValueTransformer } from 'typeorm';

export class JsonStringTransformer implements ValueTransformer {
  /**
   * Converte il dato PRIMA di scriverlo nel database.
   * Se riceve un oggetto, lo trasforma in stringa.
   * Se riceve già una stringa (dal nostro frontend), la lascia così com'è.
   */
  to(value: any): string {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return value;
  }

  /**
   * Converte il dato DOPO averlo letto dal database.
   * Prende la stringa dalla colonna 'json' e la trasforma in un oggetto.
   */
  from(value: string): any {
    if (typeof value === 'string') {
      try {
        // Questo è il JSON.parse() automatico che ci serviva!
        return JSON.parse(value);
      } catch (error) {
        // Se per qualche motivo il dato non è JSON valido, lo restituisce com'è.
        return value;
      }
    }
    return value;
  }
}