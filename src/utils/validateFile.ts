export const validateFile = (
  file: File
): { type: number; error?: string; isValid: boolean } => {
  if (!file) {
    return { type: 0, error: "No file provided", isValid: false };
  }

  const { type: mimeType, size } = file;

  // Define size limits
  const IMAGE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB
  const VIDEO_SIZE_LIMIT = 100 * 1024 * 1024; // 100MB
  const DOCUMENT_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB

  if (
    mimeType === "image/jpeg" || 
    mimeType === "image/png" || 
    mimeType === "image/webp" || 
    mimeType === "image/gif"
  ) {
    if (size > IMAGE_SIZE_LIMIT) {
      return { type: 1, error: "Image file size exceeds 10MB", isValid: false };
    }
    return { type: 1, isValid: true }; // Image type
  } else if (
    mimeType === "video/mp4" || 
    mimeType === "video/avi" || 
    mimeType === "video/webm"
  ) {
    if (size > VIDEO_SIZE_LIMIT) {
      return { type: 2, error: "Video file size exceeds 100MB", isValid: false };
    }
    return { type: 2, isValid: true }; // Video type
  } else if (
    mimeType === "application/pdf" || 
    mimeType === "application/msword"
  ) {
    if (size > DOCUMENT_SIZE_LIMIT) {
      return { type: 3, error: "Document file size exceeds 10MB", isValid: false };
    }
    return { type: 3, isValid: true }; // Document type
  } else {
    return { type: -1, error: "Unsupported file type", isValid: false };
  }
};