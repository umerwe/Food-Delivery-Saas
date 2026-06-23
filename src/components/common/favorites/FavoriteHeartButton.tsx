"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { toast } from "sonner";

import {
  useCustomerFavorites,
  useToggleFavorite,
} from "@/hooks/useCustomerFavorites";
import { useAuthContext } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type FavoriteHeartButtonProps = {
  menuItemId?: string | number | null;
  className?: string;
};

export function FavoriteHeartButton({
  menuItemId,
  className,
}: FavoriteHeartButtonProps) {
  const router = useRouter();
  const { token } = useAuthContext();
  const { data: favorites } = useCustomerFavorites();
  const toggleFavorite = useToggleFavorite();
  const resolvedMenuItemId = String(menuItemId ?? "");
  const isFavorite = favorites?.favoriteIds.has(resolvedMenuItemId) ?? false;

  if (!resolvedMenuItemId) {
    return null;
  }

  const handleToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!token) {
      toast.error("Please login to save favourites.");
      router.push("/auth/login");
      return;
    }

    toggleFavorite.mutate({
      menuItemId: resolvedMenuItemId,
      isFavorite,
    });
  };

  return (
    <button
      type="button"
      aria-label={isFavorite ? "Remove from favourites" : "Add to favourites"}
      title={isFavorite ? "Remove from favourites" : "Add to favourites"}
      onClick={handleToggle}
      disabled={toggleFavorite.isPending}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70",
        isFavorite ? "text-primary" : "text-gray-700 hover:text-primary",
        className,
      )}
    >
      <Heart size={17} fill={isFavorite ? "currentColor" : "none"} />
    </button>
  );
}
