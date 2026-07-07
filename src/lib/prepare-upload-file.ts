const WEBP_CONTENT_TYPE = "image/webp";
const WEBP_QUALITY = 0.82;
const MAX_IMAGE_DIMENSION = 2048;

export type PreparedUploadFile = {
  file: File;
  originalFile: File;
};

export const isImageUploadFile = (file: File): boolean => file.type.startsWith("image/");

export const getWebpUploadFileName = (fileName: string): string => {
  const trimmedName = fileName.trim() || "upload";
  const lastSlashIndex = Math.max(trimmedName.lastIndexOf("/"), trimmedName.lastIndexOf("\\"));
  const pathPrefix = lastSlashIndex >= 0 ? trimmedName.slice(0, lastSlashIndex + 1) : "";
  const baseName = trimmedName.slice(lastSlashIndex + 1);
  const dotIndex = baseName.lastIndexOf(".");
  const nameWithoutExtension = dotIndex > 0 ? baseName.slice(0, dotIndex) : baseName;

  return `${pathPrefix}${nameWithoutExtension || "upload"}.webp`;
};

const createImageElement = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error("Unable to decode image before upload"));
    };

    image.src = imageUrl;
  });

const getTargetDimensions = (width: number, height: number) => {
  const longestSide = Math.max(width, height);

  if (longestSide <= MAX_IMAGE_DIMENSION) {
    return { width, height };
  }

  const scale = MAX_IMAGE_DIMENSION / longestSide;

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

const canvasToWebpBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to encode image as WebP"));
          return;
        }

        resolve(blob);
      },
      WEBP_CONTENT_TYPE,
      WEBP_QUALITY
    );
  });

export const prepareUploadFile = async (file: File): Promise<PreparedUploadFile> => {
  if (!isImageUploadFile(file)) {
    return { file, originalFile: file };
  }

  const image = await createImageElement(file);
  const { width, height } = getTargetDimensions(image.naturalWidth || image.width, image.naturalHeight || image.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to prepare image for upload");
  }

  context.drawImage(image, 0, 0, width, height);
  const webpBlob = await canvasToWebpBlob(canvas);
  const webpFile = new File([webpBlob], getWebpUploadFileName(file.name), {
    type: WEBP_CONTENT_TYPE,
    lastModified: file.lastModified,
  });

  return { file: webpFile, originalFile: file };
};
