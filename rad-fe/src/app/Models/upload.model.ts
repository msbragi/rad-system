export interface FileUploadConfig {
  maxFileSize?: number; // In MB
  acceptedFileTypes?: string;
  allowMultiple?: boolean;
  maxTotalFileSize: number;
  maxFilesUpload: number;
}

export interface FileUploadEvent {
  file: File;
  base64?: string;
  error?: string;
}

export interface IFileItem {
  filename: string;
  contentType: string;
  size?: number;
}
