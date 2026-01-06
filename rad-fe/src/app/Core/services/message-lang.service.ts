import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { TranslocoService } from "@jsverse/transloco";
import { catchError, of } from "rxjs";

interface LangMessages {
  [key: string]: string;
}

interface MessageLangMap {
  [lang: string]: LangMessages;
}

@Injectable({
  providedIn: "root",
})
export class MessageLangService {
  private fullMessagesMap: MessageLangMap = {};
  private currentMessagesMap: LangMessages = {};
  private loaded = false;

  constructor(
    private http: HttpClient,
    private translocoService: TranslocoService,
  ) {
    this.loadMessages();
    // Listen for language changes
    this.translocoService.langChanges$.subscribe(() => {
      this.updateCurrentMessages();
    });
  }

  /**
   * Translate a message to the current language
   * @param message - Original error message in English
   * @returns Translated error message
   */
  translateMessage(msg: string): string {
    // If not loaded yet or message is empty, return original
    if (!this.loaded || !msg) {
      return msg;
    }
    // Remove chars not valid as json keys
    const message = msg.toUpperCase().replace(/[.,!?:]/g, "");

    // Look up in current language messages first
    if (this.currentMessagesMap[message]) {
      return this.currentMessagesMap[message];
    }

    return msg;
  }

  /**
   * Update the current messages map when language changes
   */
  private updateCurrentMessages(): void {
    const currentLang = this.translocoService.getActiveLang();
    this.currentMessagesMap = {};

    // Add English messages as fallback
    if (this.fullMessagesMap["en"]) {
      Object.assign(this.currentMessagesMap, this.fullMessagesMap["en"]);
    }

    // Overlay current language messages (if different from English)
    if (currentLang !== "en" && this.fullMessagesMap[currentLang]) {
      Object.assign(this.currentMessagesMap, this.fullMessagesMap[currentLang]);
    }
  }

  /**
   * Load messages from JSON file
   */
  private loadMessages(): void {
    this.http
      .get<MessageLangMap>("assets/i18n/messages.json")
      .pipe(
        catchError((error) => {
          console.error("Failed to load error messages:", error);
          return of({} as MessageLangMap);
        }),
      )
      .subscribe((errorLangMap) => {
        this.fullMessagesMap = errorLangMap;
        this.updateCurrentMessages();
        this.loaded = true;
      });
  }
}
