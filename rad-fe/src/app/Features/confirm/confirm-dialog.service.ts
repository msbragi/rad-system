import { Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Observable } from "rxjs";
import {
  ConfirmDialogComponent,
  IConfirmData,
} from "./confirm-dialog.component";

/**
 * Servizio per la richiesta di conferme con messaggi predefiniti per consistenza tra i vari componenti
 */
@Injectable({
  providedIn: "root",
})
export class ConfirmDialogService {
  constructor(private dialog: MatDialog) {}

  /**
   * Generic open
   * @param data (Vedi interfaccia)
   * @returns
   */
  open(data: IConfirmData): Observable<boolean> {
    const options = { data, width: "400px", disableClose: true };
    return this.dialog.open(ConfirmDialogComponent, options).afterClosed();
  }

  /**
   * Generic message per richiesta di cancellazione
   * @param id
   * @param name
   * @returns
   */
  delete(id: number, name?: string) {
    name = name ? ` (${name})` : "";
    const data = <IConfirmData>{
      title: "Conferma eliminazione",
      message: `Attenzione! La conferma comporterà l'eliminazione del record #${id} ${name} e di tutti i records eventualmente collegati.`,
    };
    return this.open(data);
  }

  /**
   * Generic message per abort di un operazione
   * @returns
   */
  abort() {
    const data = <IConfirmData>{
      title: "Conferma operazione",
      message: `Attenzione! La conferma comporterà la perdita di tutte le modifiche effettuate.`,
    };
    return this.open(data);
  }

  /**
   * Generic logout
   * @returns
   */
  logout() {
    const data = {
      title: "Conferma uscita?",
      message: 'Conferma uscita dall\'applicazione "Report Manager Admin"?',
    };
    return this.open(data);
  }

  operation(message?: string) {
    const data = {
      title: "Conferma?",
      message: message ? message : "Conferma l'operazione selezionata\"?",
    };
    return this.open(data);
  }
}
