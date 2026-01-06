import { Injectable } from "@angular/core";
import { SnackbarService } from "./snackbar.service";
import * as QRCode from "qrcode";

export interface ShareOptions {
  title?: string;
  text?: string;
  url: string;
}

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  title?: string;
  autoCloseDelay?: number;
}

@Injectable({
  providedIn: "root",
})
export class ShareService {
  constructor(private snackbarService: SnackbarService) {}

  /**
   * Generates a geo URI for location sharing
   * @param lat Latitude
   * @param lng Longitude
   * @param label Optional label for the location
   * @returns geo: URI string
   */
  generateGeoUri(lat: number, lng: number, label?: string): string {
    const labelParam = label ? `?q=${encodeURIComponent(label)}` : "";
    return `geo:${lat},${lng}${labelParam}`;
  }

  /**
   * Copies text to clipboard with user feedback
   * @param text Text to copy
   * @param successMessage Optional success message
   * @param errorMessage Optional error message
   */
  async copyToClipboard(
    text: string,
    successMessage = "Copied to clipboard",
    errorMessage = "Failed to copy to clipboard",
  ): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      this.snackbarService.success(successMessage);
      return true;
    } catch (error) {
      this.snackbarService.error(errorMessage);
      return false;
    }
  }

  /**
   * Share content using Web Share API with fallback to clipboard
   * @param options Share options
   * @param fallbackMessage Message to show when falling back to clipboard
   */
  async share(
    options: ShareOptions,
    fallbackMessage = "Link copied to clipboard (share not supported)",
  ): Promise<boolean> {
    if (navigator.share) {
      try {
        await navigator.share(options);
        return true;
      } catch (error) {
        // User cancelled or share failed, fall back to clipboard
        return this.copyToClipboard(options.url, fallbackMessage);
      }
    } else {
      // No native share support, use clipboard
      return this.copyToClipboard(options.url, fallbackMessage);
    }
  }

  /**
   * Generates and displays a QR code in a modal overlay
   * @param text Text to encode in QR code
   * @param options QR code display options
   */
  async showQRCode(text: string, options: QRCodeOptions = {}): Promise<void> {
    const {
      width = 300,
      margin = 2,
      title = "Scan QR Code",
      autoCloseDelay = 10000,
    } = options;

    try {
      const dataUrl = await QRCode.toDataURL(text, {
        width,
        margin,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      this.createQRCodeModal(dataUrl, title, autoCloseDelay);
    } catch (error) {
      this.snackbarService.error("Failed to generate QR code");
    }
  }

  /**
   * Creates a modal overlay to display QR code
   * @param dataUrl QR code data URL
   * @param title Modal title
   * @param autoCloseDelay Auto-close delay in milliseconds
   */
  private createQRCodeModal(
    dataUrl: string,
    title: string,
    autoCloseDelay: number,
  ): void {
    // Create modal backdrop
    const backdrop = document.createElement("div");
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Create modal content
    const modal = document.createElement("div");
    modal.style.cssText = `
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      text-align: center;
      max-width: 90vw;
      max-height: 90vh;
      position: relative;
    `;

    // Create QR code image
    const qrImage = new Image();
    qrImage.src = dataUrl;
    qrImage.style.cssText = `
      max-width: 100%;
      height: auto;
      border-radius: 4px;
    `;

    // Create close button
    const closeButton = document.createElement("button");
    closeButton.innerHTML = "Close";
    closeButton.style.cssText = `
      background: #1976d2;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 16px;
      font-size: 14px;
    `;

    // Add hover effect to close button
    closeButton.addEventListener("mouseenter", () => {
      closeButton.style.background = "#1565c0";
    });
    closeButton.addEventListener("mouseleave", () => {
      closeButton.style.background = "#1976d2";
    });

    // Close modal function
    const closeModal = () => {
      if (document.body.contains(backdrop)) {
        document.body.removeChild(backdrop);
      }
    };

    // Event listeners
    closeButton.addEventListener("click", closeModal);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        closeModal();
      }
    });

    // ESC key to close
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
        document.removeEventListener("keydown", handleKeydown);
      }
    };
    document.addEventListener("keydown", handleKeydown);

    // Build modal content
    modal.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #333; font-size: 18px;">${title}</h3>
      <div style="margin: 16px 0;">${qrImage.outerHTML}</div>
    `;
    modal.appendChild(closeButton);

    // Add to DOM
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    // Auto-close after delay
    if (autoCloseDelay > 0) {
      setTimeout(() => {
        closeModal();
        document.removeEventListener("keydown", handleKeydown);
      }, autoCloseDelay);
    }
  }

  /**
   * Share location with QR code, copy, and native share options
   * @param lat Latitude
   * @param lng Longitude
   * @param label Optional location label
   */
  async shareLocation(
    lat: number,
    lng: number,
    label = "Location",
  ): Promise<void> {
    const geoUri = this.generateGeoUri(lat, lng, label);

    await this.share({
      title: label,
      text: `Check out this location: ${label}`,
      url: geoUri,
    });
  }

  /**
   * Show QR code for location
   * @param lat Latitude
   * @param lng Longitude
   * @param label Optional location label
   */
  async showLocationQRCode(
    lat: number,
    lng: number,
    label = "Location",
  ): Promise<void> {
    const geoUri = this.generateGeoUri(lat, lng, label);

    await this.showQRCode(geoUri, {
      title: `Scan to Open ${label}`,
      width: 300,
    });
  }

  /**
   * Copy location to clipboard
   * @param lat Latitude
   * @param lng Longitude
   * @param label Optional location label
   */
  async copyLocation(
    lat: number,
    lng: number,
    label = "Location",
  ): Promise<boolean> {
    const geoUri = this.generateGeoUri(lat, lng, label);
    return this.copyToClipboard(geoUri, `${label} copied to clipboard`);
  }
}
