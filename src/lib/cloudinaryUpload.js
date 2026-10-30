const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ses-upload-preset";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export class MediaValidationError extends Error {}

export function validateMediaFile(file) {
  const isImage = file?.type.startsWith("image/");
  const isVideo = file?.type.startsWith("video/");

  if (!isImage && !isVideo) {
    throw new MediaValidationError("unsupportedType");
  }
  if (isImage && file.size > MAX_IMAGE_BYTES) {
    throw new MediaValidationError("imageTooLarge");
  }
  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    throw new MediaValidationError("videoTooLarge");
  }
}

export function uploadPostMedia(file, { onProgress, userId, signal } = {}) {
  if (!cloudName) {
    return Promise.reject(
      new Error("Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME in your .env file."),
    );
  }
  if (!file || !/^(image|video)\//.test(file.type)) {
    return Promise.reject(new MediaValidationError("unsupportedType"));
  }
  try {
    validateMediaFile(file);
  } catch (error) {
    return Promise.reject(error);
  }

  const resourceType = file.type.startsWith("video/") ? "video" : "image";
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  if (userId) formData.append("folder", `ses-posts/${userId}`);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const cleanupSignal = () => signal?.removeEventListener("abort", abortUpload);
    const abortUpload = () => xhr.abort();
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException("Upload cancelled.", "AbortError"));
      return;
    }
    signal?.addEventListener("abort", abortUpload, { once: true });
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${resourceType}/upload`,
    );
    xhr.upload.onprogress = (event) => {
      if (onProgress && event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onerror = () => {
      cleanupSignal();
      reject(new Error("Network error while uploading media."));
    };
    xhr.onabort = () => {
      cleanupSignal();
      reject(signal?.reason ?? new DOMException("Upload cancelled.", "AbortError"));
    };
    xhr.onload = () => {
      cleanupSignal();
      let result;
      try {
        result = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error("Cloudinary returned an unexpected response."));
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        const detail = result?.error?.message || `Cloudinary returned HTTP ${xhr.status}.`;
        if (/upload preset.*not found/i.test(detail)) {
          reject(new Error(
            `Cloudinary could not find unsigned preset "${uploadPreset}" in cloud "${cloudName}". ` +
            "Check that the cloud name and preset match the same Cloudinary environment.",
          ));
          return;
        }
        reject(new Error(`Cloudinary upload failed: ${detail}`));
        return;
      }

      if (!result.secure_url || !result.public_id) {
        reject(new Error("Cloudinary upload succeeded without returning a secure media URL."));
        return;
      }

      resolve({
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format ?? null,
        width: result.width ?? null,
        height: result.height ?? null,
        bytes: result.bytes ?? null,
      });
    };
    xhr.send(formData);
  });
}

export function cloudinaryImageUrl(url, transformation) {
  if (!url || !transformation) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.hostname !== "res.cloudinary.com") return url;
    const segments = parsed.pathname.split("/");
    const uploadIndex = segments.lastIndexOf("upload");
    if (uploadIndex < 0) return url;
    segments.splice(uploadIndex + 1, 0, transformation);
    parsed.pathname = segments.join("/");
    return parsed.toString();
  } catch {
    return url;
  }
}
