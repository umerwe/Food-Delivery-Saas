export const resolveHttpsImageUrl = (imageUrl: string | null | undefined, fallback: string) => {
  return imageUrl?.startsWith("https") ? imageUrl : fallback;
};
