import { CommonModule } from "@angular/common";
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { TranslocoModule } from "@jsverse/transloco";
import { LoadingService } from "../../Core/services/loading.service";
import {
  FileUploadConfig,
  FileUploadEvent,
  IFileItem,
} from "../../Models/upload.model";
import { StoreService } from "../../Core/services/store.service";
import { ContentTypeHelper } from "../../Utils/content-type.helper";

@Component({
  selector: "tc-drop-upload",
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    TranslocoModule,
  ],
  templateUrl: "./drop-upload.component.html",
  styleUrl: "./drop-upload.component.scss",
})
export class DropUploadComponent implements OnInit {
  @Input() config!: FileUploadConfig;
  @Input() placeholder: string = "Click or drop here to upload a file";

  @Output() fileSelected = new EventEmitter<FileUploadEvent>();
  @Output() fileRemoved = new EventEmitter<void>();
  @Output() uploadRequested = new EventEmitter<FileUploadEvent>();

  @ViewChild("fileInput") fileInput!: ElementRef<HTMLInputElement>;

  isDragging = false;
  error: string | null = null;
  currentFile: File | null = null;
  filePreview: string | null = null;
  private allowedExtensions: string[] = [];

  constructor(public loadingService: LoadingService) {}

  ngOnInit(): void {
    const config = StoreService.getUploadConfig();
    this.config = {
      ...this.config,
      ...config,
    };

    // Set allowed extensions based on config
    if (this.config.acceptedFileTypes === "*/*") {
      this.allowedExtensions = ContentTypeHelper.getAllSafeExtensions();
    } else if (this.config.acceptedFileTypes) {
      this.allowedExtensions = this.config.acceptedFileTypes
        .split(",")
        .map((type) => type.trim().replace(".", "").toLowerCase())
        .filter((type) => type.length > 0);
    }
  }

  onFileDropped(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;

    if (!event.dataTransfer?.files.length) return;

    // Use only the first file if multiple selection is not allowed
    // For now, we only support single file upload
    if (this.config.allowMultiple) {
      console.warn(
        "Multiple file support is not fully implemented yet, using only first file",
      );
    }
    const file = event.dataTransfer.files[0];
    this.processFile(file);
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (!target.files?.length) return;

    const file = target.files[0];
    this.processFile(file);
  }

  processFile(file: File): void {
    // Reset previous state
    this.error = null;
    this.filePreview = null;

    // Validate file
    if (!this.validateFile(file)) {
      return;
    }

    // Set current file
    this.currentFile = file;

    // Generate preview for image files
    if (file.type.startsWith("image/")) {
      this.createImagePreview(file);
    }

    // Read file as base64 for upload
    this.readAsBase64(file);
  }

  validateFile(file: File): boolean {
    // Check file size
    if (file.size > (this.config.maxFileSize || 5) * 1024 * 1024) {
      this.error = `File to big. Max ${this.config.maxFileSize} MB.`;
      this.fileSelected.emit({ file, error: this.error });
      return false;
    }

    // Check file type using the precomputed allowed extensions
    if (this.allowedExtensions.length > 0) {
      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.split(".").pop() || "";

      if (!this.allowedExtensions.includes(fileExtension)) {
        this.error = `File extension '${fileExtension}' is not allowed`;
        this.fileSelected.emit({ file, error: this.error });
        return false;
      }

      // Additional MIME type validation for security
      if (
        file.type &&
        !this.isMimeTypeConsistentWithExtension(
          file.type.toLowerCase(),
          fileExtension,
        )
      ) {
        this.error = `File content type does not match extension`;
        this.fileSelected.emit({ file, error: this.error });
        return false;
      }
    }

    return true;
  }

  /**
   * Basic MIME type consistency check
   * @param mimeType The MIME type reported by the browser
   * @param extension The file extension
   * @returns True if MIME type is roughly consistent with extension
   */
  private isMimeTypeConsistentWithExtension(
    mimeType: string,
    extension: string,
  ): boolean {
    // Basic checks for common inconsistencies
    if (
      extension.match(/^(jpg|jpeg|png|gif|webp|svg|bmp|ico|tiff|tif)$/) &&
      !mimeType.startsWith("image/")
    ) {
      return false;
    }
    if (
      extension.match(/^(mp4|avi|mov|wmv|flv|webm|mkv|3gp|ogv)$/) &&
      !mimeType.startsWith("video/")
    ) {
      return false;
    }
    if (
      extension.match(/^(mp3|wav|flac|aac|ogg|wma|m4a|opus)$/) &&
      !mimeType.startsWith("audio/")
    ) {
      return false;
    }

    // For other types, allow more flexibility as MIME detection can be inconsistent
    return true;
  }

  createImagePreview(file: File): void {
    const reader = new FileReader();

    reader.onload = (e) => {
      this.filePreview = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  }

  readAsBase64(file: File): void {
    this.loadingService.startLoading();
    const reader = new FileReader();

    reader.onload = (e) => {
      const base64Content = e.target?.result as string;
      // Get the base64 string without the "data:*/*;base64," prefix
      const base64 = base64Content.split(",")[1];

      this.loadingService.stopLoading();
      this.fileSelected.emit({ file, base64 });
    };

    reader.onerror = () => {
      this.loadingService.resetLoading();
      this.error = "Error reading file.";
      this.fileSelected.emit({ file, error: this.error });
    };

    reader.readAsDataURL(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  removeFile(): void {
    this.currentFile = null;
    this.filePreview = null;
    this.error = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = "";
    }
    this.fileRemoved.emit();
  }

  triggerFileInput(): void {
    if (!this.currentFile) {
      this.fileInput.nativeElement.click();
    }
  }

  uploadFile(): void {
    if (!this.currentFile) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const base64Content = e.target?.result as string;
      const base64 = base64Content.split(",")[1];

      this.uploadRequested.emit({ file: this.currentFile!, base64 });
    };

    reader.readAsDataURL(this.currentFile);
  }

  formatFileSize(bytes: number): string {
    return ContentTypeHelper.formatFileSize(bytes);
  }

  getFileIcon(file: File): string {
    return ContentTypeHelper.getIcon({ contentType: file.type } as IFileItem);
  }
}
