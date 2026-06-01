"use client";

import { useCallback } from "react";

import { uploadAvatarFile as uploadStorageFile } from "@/services/storage";
import type { PresignedUploadResponse } from "@/services/profile";

export const useFileUpload = () => {
  const uploadAvatarFile = useCallback(
    (upload: PresignedUploadResponse, file: File) => uploadStorageFile(upload.uploadUrl, file, upload.headers),
    []
  );

  return {
    uploadAvatarFile,
  };
};
