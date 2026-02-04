import { IFileItem } from "../Models/upload.model";
/**
 * Interface for category configuration
 */
interface CategoryConfig {
  patterns: Array<{ type: string; value: string }>;
  extensions: string[];
  icon: string;
  translationKey: string;
  specificIcons?: Record<string, string>;
}

/**
 * Helper class for content type management
 * Uses a unified data structure for all content type operations
 */
export class ContentTypeHelper {
  /**
   * Pattern matching types for content type identification
   */
  private static readonly MATCH_TYPE = {
    STARTS_WITH: "startsWith",
    INCLUDES: "includes",
    EQUALS: "equals",
  };

  /**
   * Unified content type configuration
   * Single source of truth for all content type related operations
   */
  private static readonly CATEGORIES: Record<string, CategoryConfig> = {
    image: {
      patterns: [
        { type: ContentTypeHelper.MATCH_TYPE.STARTS_WITH, value: "image/" },
      ],
      extensions: [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "webp",
        "svg",
        "bmp",
        "ico",
        "tiff",
        "tif",
      ],
      icon: "image",
      translationKey: "filterImages",
    },
    video: {
      patterns: [
        { type: ContentTypeHelper.MATCH_TYPE.STARTS_WITH, value: "video/" },
      ],
      extensions: [
        "mp4",
        "avi",
        "mov",
        "wmv",
        "flv",
        "webm",
        "mkv",
        "3gp",
        "ogv",
      ],
      icon: "videocam",
      translationKey: "filterVideos",
    },
    audio: {
      patterns: [
        { type: ContentTypeHelper.MATCH_TYPE.STARTS_WITH, value: "audio/" },
      ],
      extensions: ["mp3", "wav", "flac", "aac", "ogg", "wma", "m4a", "opus"],
      icon: "audiotrack",
      translationKey: "filterAudio",
    },
    document: {
      patterns: [
        { type: ContentTypeHelper.MATCH_TYPE.EQUALS, value: "application/pdf" },
        { type: ContentTypeHelper.MATCH_TYPE.STARTS_WITH, value: "text/" },
        { type: ContentTypeHelper.MATCH_TYPE.INCLUDES, value: "word" },
        {
          type: ContentTypeHelper.MATCH_TYPE.EQUALS,
          value: "application/msword",
        },
        {
          type: ContentTypeHelper.MATCH_TYPE.EQUALS,
          value:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
        { type: ContentTypeHelper.MATCH_TYPE.INCLUDES, value: "excel" },
        {
          type: ContentTypeHelper.MATCH_TYPE.EQUALS,
          value: "application/vnd.ms-excel",
        },
        {
          type: ContentTypeHelper.MATCH_TYPE.EQUALS,
          value:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
        { type: ContentTypeHelper.MATCH_TYPE.INCLUDES, value: "powerpoint" },
        {
          type: ContentTypeHelper.MATCH_TYPE.EQUALS,
          value: "application/vnd.ms-powerpoint",
        },
        {
          type: ContentTypeHelper.MATCH_TYPE.EQUALS,
          value:
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        },
      ],
      extensions: [
        "pdf",
        "doc",
        "docx",
        "xls",
        "xlsx",
        "ppt",
        "pptx",
        "txt",
        "rtf",
        "odt",
        "ods",
        "odp",
      ],
      icon: "description",
      translationKey: "filterDocuments",
      specificIcons: {
        "application/pdf": "picture_as_pdf",
        "application/msword": "description",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          "description",
        "application/vnd.ms-excel": "table_chart",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
          "table_chart",
        "application/vnd.ms-powerpoint": "slideshow",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation":
          "slideshow",
        "text/": "text_snippet",
      },
    },
    other: {
      patterns: [
        { type: ContentTypeHelper.MATCH_TYPE.EQUALS, value: "application/zip" },
        {
          type: ContentTypeHelper.MATCH_TYPE.EQUALS,
          value: "application/x-rar-compressed",
        },
        {
          type: ContentTypeHelper.MATCH_TYPE.EQUALS,
          value: "application/x-7z-compressed",
        },
        {
          type: ContentTypeHelper.MATCH_TYPE.EQUALS,
          value: "application/x-tar",
        },
        {
          type: ContentTypeHelper.MATCH_TYPE.EQUALS,
          value: "application/gzip",
        },
      ],
      extensions: ["zip", "rar", "7z", "tar", "gz", "bz2", "xz"], // Safe archive formats only
      icon: "insert_drive_file",
      translationKey: "filterOthers",
      specificIcons: {
        zip: "archive",
        rar: "archive",
        "7z": "archive",
        tar: "archive",
        gz: "archive",
        bz2: "archive",
        xz: "archive",
      },
    },
  };

  /**
   * Get available filter categories with their display information
   * @returns Array of category configurations for UI display
   */
  static getFilterCategories(): {
    key: string;
    icon: string;
    translationKey: string;
  }[] {
    return Object.entries(this.CATEGORIES).map(([key, config]) => ({
      key,
      icon: config.icon,
      translationKey: config.translationKey,
    }));
  }

  /**
   * Get allowed extensions for specific categories
   * @param categories Array of category keys to get extensions for
   * @returns Array of allowed file extensions
   */
  static getAllowedExtensions(categories: string[]): string[] {
    const extensions = new Set<string>();

    categories.forEach((category) => {
      const config = this.CATEGORIES[category];
      if (config && config.extensions) {
        config.extensions.forEach((ext) => extensions.add(ext.toLowerCase()));
      }
    });

    return Array.from(extensions);
  }

  /**
   * Get all safe extensions from all categories
   * This method returns all extensions that are considered safe for upload
   * @returns Array of all allowed file extensions
   */
  static getAllSafeExtensions(): string[] {
    const extensions = new Set<string>();

    Object.values(this.CATEGORIES).forEach((category) => {
      if (category.extensions) {
        category.extensions.forEach((ext) => extensions.add(ext.toLowerCase()));
      }
    });

    return Array.from(extensions);
  }

  /**
   * Validate file type based on both MIME type and extension
   * This provides secure validation against file spoofing
   * @param file The file to validate
   * @param allowedExtensions Array of allowed extensions (optional, if not provided uses all categories)
   * @returns Object with validation result and details
   */
  static validateFileType(
    file: File,
    allowedExtensions?: string[],
  ): {
    isValid: boolean;
    category: string;
    reason?: string;
  } {
    if (!file) {
      return { isValid: false, category: "other", reason: "No file provided" };
    }

    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split(".").pop() || "";
    const mimeType = file.type.toLowerCase();

    // Find category based on MIME type (more secure than extension)
    const categoryKey = this.findCategoryKey(mimeType);
    const category = this.CATEGORIES[categoryKey];

    // If no allowed extensions specified, allow all known extensions
    if (!allowedExtensions || allowedExtensions.length === 0) {
      allowedExtensions = Object.values(this.CATEGORIES)
        .flatMap((cat) => cat.extensions)
        .map((ext) => ext.toLowerCase());
    } else {
      allowedExtensions = allowedExtensions.map((ext) => ext.toLowerCase());
    }

    // Check if file extension is in allowed list
    if (!allowedExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        category: categoryKey,
        reason: `File extension '${fileExtension}' is not allowed`,
      };
    }

    // Check if MIME type matches the extension (security check)
    if (
      mimeType &&
      !this.isMimeTypeConsistentWithExtension(mimeType, fileExtension)
    ) {
      return {
        isValid: false,
        category: categoryKey,
        reason: `File content type '${mimeType}' does not match extension '${fileExtension}'`,
      };
    }

    return { isValid: true, category: categoryKey };
  }

  /**
   * Check if MIME type is consistent with file extension
   * This helps prevent file spoofing attacks
   * @param mimeType The MIME type reported by the browser
   * @param extension The file extension
   * @returns True if MIME type is consistent with extension
   */
  private static isMimeTypeConsistentWithExtension(
    mimeType: string,
    extension: string,
  ): boolean {
    // Find which category the MIME type belongs to
    const mimeCategory = this.findCategoryKey(mimeType);

    // Find which category the extension belongs to
    const extensionCategory =
      Object.entries(this.CATEGORIES).find(([_, config]) =>
        config.extensions
          .map((ext) => ext.toLowerCase())
          .includes(extension.toLowerCase()),
      )?.[0] || "other";

    // They should match the same category
    return (
      mimeCategory === extensionCategory ||
      mimeCategory === "other" ||
      extensionCategory === "other"
    );
  }

  /**
   * Check if content type matches a pattern
   * @param contentType The content type to check
   * @param pattern The pattern to match against
   * @returns True if the content type matches the pattern
   */
  private static matchesPattern(
    contentType: string,
    pattern: { type: string; value: string },
  ): boolean {
    switch (pattern.type) {
      case this.MATCH_TYPE.STARTS_WITH:
        return contentType.startsWith(pattern.value);
      case this.MATCH_TYPE.INCLUDES:
        return contentType.includes(pattern.value);
      case this.MATCH_TYPE.EQUALS:
        return contentType === pattern.value;
      default:
        return false;
    }
  }

  /**
   * Find the category key for a given content type
   * @param contentType The content type to categorize
   * @returns The category key
   */
  private static findCategoryKey(contentType: string): string {
    if (!contentType) {
      return "other";
    }

    const normalizedContentType = contentType.toLowerCase();

    // Find the first category where any pattern matches the content type
    const categoryEntry = Object.entries(this.CATEGORIES).find(([_, config]) =>
      config.patterns.some((pattern) =>
        this.matchesPattern(normalizedContentType, pattern),
      ),
    );

    // Return the matching category key or 'other' as fallback
    return categoryEntry ? categoryEntry[0] : "other";
  }

  /**
   * Get file icon from content type or filename
   * @param item The library item to get an icon for
   * @returns The material icon name for the content type or file extension
   */
  static getIcon(item: IFileItem): string {
    const contentType = item.contentType?.toLowerCase();
    const fileName = (item as any).name?.toLowerCase() || "";
    const fileExtension = fileName.split(".").pop() || "";

    // First try to get icon based on content type
    if (contentType) {
      const categoryKey = this.findCategoryKey(contentType);
      const category = this.CATEGORIES[categoryKey];

      // Check for specific icon override
      if (category.specificIcons) {
        // Check for exact match
        if (category.specificIcons[contentType]) {
          return category.specificIcons[contentType];
        }

        // Check for prefix match
        const entries = Object.entries(category.specificIcons);
        for (let i = 0; i < entries.length; i++) {
          const [prefix, iconValue] = entries[i];
          if (contentType.startsWith(prefix)) {
            return iconValue;
          }
        }
      }

      // Return the default icon for the category
      if (category) {
        return category.icon;
      }
    }

    // Fallback: try to get icon based on file extension
    if (fileExtension) {
      // Check all categories for specific icon for this extension
      for (const categoryConfig of Object.values(this.CATEGORIES)) {
        if (
          categoryConfig.specificIcons &&
          categoryConfig.specificIcons[fileExtension]
        ) {
          return categoryConfig.specificIcons[fileExtension];
        }
      }

      // Check if extension belongs to any category and return category icon
      for (const [_, categoryConfig] of Object.entries(this.CATEGORIES)) {
        if (
          categoryConfig.extensions
            .map((ext) => ext.toLowerCase())
            .includes(fileExtension)
        ) {
          return categoryConfig.icon;
        }
      }
    }

    // Final fallback
    return this.CATEGORIES["other"].icon;
  }
  /*
   * Get category of file based on content type
   * @param item The library item to categorize
   * @returns The category key (image, video, audio, document, other)
   */
  static getCategory(item: IFileItem): string {
    if (!item.contentType) {
      return "other";
    }

    return this.findCategoryKey(item.contentType);
  }

  /**
   * Format file size in a human readable format
   * @param bytes The file size in bytes
   * @returns Formatted file size string
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Format the date in a readable format
   * @param date The date to format
   * @returns Formatted date string
   */
  static formatDate(date: Date | string | undefined): string {
    if (!date) {
      return "";
    }

    if (typeof date === "string") {
      date = new Date(date);
    }

    return date.toLocaleDateString();
  }
}
