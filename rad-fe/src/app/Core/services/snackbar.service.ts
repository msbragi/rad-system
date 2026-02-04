import { Injectable } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MessageLangService } from "./message-lang.service";

export enum SnackbarTypes {
  SUCCESS = "success-snackbar",
  WARNING = "warning-snackbar",
  ERROR = "error-snackbar",
  INFO = "info-snackbar",
}

@Injectable({
  providedIn: "root",
})
export class SnackbarService {
  constructor(
    private snackBar: MatSnackBar,
    private messageLangService: MessageLangService,
  ) {}

  open(message: string, duration?: number): void {
    const displayMessage = this.messageLangService.translateMessage(message);
    this.snackBar.open(displayMessage, "Close", {
      duration: duration || 3000,
      panelClass: [SnackbarTypes.INFO],
    });
  }

  show(message: string, type: SnackbarTypes, duration?: number): void {
    const displayMessage = this.messageLangService.translateMessage(message);
    this.snackBar.open(displayMessage, "Close", {
      duration: duration || 3000,
      panelClass: [type],
    });
  }

  success(message: string, duration?: number): void {
    this.show(message, SnackbarTypes.SUCCESS, duration);
  }

  warning(message: string, duration?: number): void {
    this.show(message, SnackbarTypes.WARNING, duration);
  }

  error(message: string, duration?: number): void {
    this.show(message, SnackbarTypes.ERROR, duration || 15000);
  }

  info(message: string, duration?: number): void {
    this.show(message, SnackbarTypes.INFO, duration);
  }

  close(): void {
    this.snackBar.dismiss();
  }
}
