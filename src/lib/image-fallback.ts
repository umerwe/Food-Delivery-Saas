export const resolveHttpsImageUrl = (imageUrl: string | null | undefined, fallback: string) => {
  return imageUrl?.startsWith("https") ? imageUrl : fallback;
};

export const isRemoteHttpsImageUrl = (imageUrl: string | null | undefined) => {
  return imageUrl?.startsWith("https") ?? false;
};
