export const uploadAvatarFile = async (uploadUrl: string, file: File, headers?: Record<string, string>) => {
  await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
      ...(headers ?? {}),
    },
    body: file,
  });
};
