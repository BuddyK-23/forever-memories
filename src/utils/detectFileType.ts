export const detectFileType = (file: File): { type: number; error?: string } => {
    const { type, size } = file;
  
    // Define size limits
    const IMAGE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB
    const VIDEO_SIZE_LIMIT = 20 * 1024 * 1024; // 20MB
  
    // Check file type and size
    if (type === "image/jpeg" || type === "image/png") {
      if (size > IMAGE_SIZE_LIMIT) {
        return { type: 1, error: "Image file size exceeds 10MB." };
      }
      return { type: 1 }; // Image type
    } else if (type === "video/mp4" || type === "video/avi") {
      if (size > VIDEO_SIZE_LIMIT) {
        return { type: 2, error: "Video file size exceeds 20MB." };
      }
      return { type: 2 }; // Video type
    }
  
    return { type: 0, error: "Unsupported file type." };
  };
  