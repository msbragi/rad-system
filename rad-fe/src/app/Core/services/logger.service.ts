import { Injectable } from "@angular/core";
import { StoreService } from "./store.service";

@Injectable({
  providedIn: "root",
})
export class LoggerService {
  private logMode: string = "none"; // Default log mode
  private static _console = console; // Original console reference
  private static logBuffer: string[] = []; // Buffer to store log messages
  private readonly bufferLimit: number = 500; // Maximum buffer size

  constructor() {
    this.logMode = StoreService.getLogMode() || "none"; // Get initial log mode from StoreService
  }

  /**
   * Overrides the standard console.log to use the LoggerService's log method.
   */
  private overrideConsoleLog(): void {
    const originalConsoleLog = console.log;
    console.log = (message?: any, ...optionalParams: any[]): void => {
      this.log(message);
      if (this.logMode.includes("console")) {
        // If 'console' is in logMode, call the original console.log
        originalConsoleLog.apply(console, [message, ...optionalParams]);
      }
    };
  }

  /**
   * Logs a message based on the current logMode.
   * @param message The message to log.
   */
  log(message: any): void {
    if (this.logMode === "none") {
      return; // No logging
    }

    const shouldLogToConsole = this.logMode.includes("console");
    const shouldLogToFile = this.logMode.includes("file");

    if (shouldLogToConsole) {
      // Already handled by the overridden console.log
    }

    if (shouldLogToFile) {
      this.logToBuffer(message);
    }
  }

  /**
   * Logs a message to the in-memory buffer.
   * @param message The message to log.
   */
  private logToBuffer(message: any): void {
    const buffer = LoggerService.logBuffer;
    const logEntry = `${new Date().toISOString()} - ${typeof message === "object" ? JSON.stringify(message) : message}`;
    if (buffer.length >= this.bufferLimit) {
      // Remove the oldest log entry (FIFO behavior)
      buffer.shift();
    }
    buffer.push(logEntry);
  }

  /**
   * Displays all the buffer contents and clears the buffer.
   * @returns The current buffer contents.
   */
  static displayBuffer(): string[] {
    const bufferContents = [...this.logBuffer]; // Copy the buffer contents
    this.logBuffer.length = 0; // Clear the buffer
    return bufferContents;
  }

  /**
   * Static method to force logging directly to the console, bypassing logMode.
   * This method behaves like the standard console.log, accepting multiple arguments of any type.
   * @param args The arguments to log.
   */
  static forceLog(...args: any[]): void {
    LoggerService._console.log(...args);
  }
}
