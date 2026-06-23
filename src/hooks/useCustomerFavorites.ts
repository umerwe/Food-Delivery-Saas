"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAuthContext } from "@/hooks/useAuth";
import {
  addFavoriteItem,
  fetchFavoriteItems,
  removeFavoriteItem,
} from "@/services/favorites";
import type { MenuItem } from "@/components/pages/Items/types";

export const favoriteItemsQueryKey = ["customer-favorites"] as const;

type CustomerFavoritesData = {
  items: MenuItem[];
  favoriteIds: Set<string>;
};

const getMenuItemId = (item: MenuItem) => String(item?.id ?? "");

export const useCustomerFavorites = () => {
  const { token, user } = useAuthContext();
  const queryKey = [...favoriteItemsQueryKey, user?.id ?? "current"] as const;

  return useQuery<CustomerFavoritesData>({
    queryKey,
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) {
        return { items: [], favoriteIds: new Set<string>() };
      }

      const result = await fetchFavoriteItems({ token });
      const favoriteIds = new Set(
        result.items.map(getMenuItemId).filter(Boolean),
      );

      return {
        items: result.items,
        favoriteIds,
      };
    },
  });
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { token, user } = useAuthContext();
  const queryKey = [...favoriteItemsQueryKey, user?.id ?? "current"] as const;

  return useMutation({
    mutationFn: async ({
      menuItemId,
      isFavorite,
    }: {
      menuItemId: string;
      isFavorite: boolean;
    }) => {
      if (!token) {
        throw new Error("Please login to save favourites.");
      }

      return isFavorite
        ? removeFavoriteItem({ token, menuItemId })
        : addFavoriteItem({ token, menuItemId });
    },
    onMutate: async ({ menuItemId, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey });

      const previousFavorites =
        queryClient.getQueryData<CustomerFavoritesData>(queryKey);

      queryClient.setQueryData<CustomerFavoritesData>(
        queryKey,
        (current) => {
          const favoriteIds = new Set(current?.favoriteIds ?? []);

          if (isFavorite) {
            favoriteIds.delete(menuItemId);
          } else {
            favoriteIds.add(menuItemId);
          }

          return {
            items: isFavorite
              ? (current?.items ?? []).filter(
                  (item) => getMenuItemId(item) !== menuItemId,
                )
              : current?.items ?? [],
            favoriteIds,
          };
        },
      );

      return { previousFavorites };
    },
    onError: (error, _variables, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(
          queryKey,
          context.previousFavorites,
        );
      }

      const message =
        error instanceof Error
          ? error.message
          : "Unable to update favourites";

      toast.error(message);

      if (!token) {
        router.push("/auth/login");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: favoriteItemsQueryKey });
    },
  });
};
