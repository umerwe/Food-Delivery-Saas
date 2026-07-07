"use client";

import { useCallback, useMemo } from "react";

import { queryKeys } from "@/config/query-keys";
import { useAuthContext } from "@/hooks/useAuth";
import { useDomainApi } from "@/hooks/useDomainApi";
import { useFileUpload } from "@/hooks/useFileUpload";
import { readAuthSession, saveAuthSession } from "@/lib/auth";
import { prepareUploadFile } from "@/lib/prepare-upload-file";
import {
  deleteAddress as deleteProfileAddress,
  fetchAddresses as fetchProfileAddresses,
  fetchWalletSummary,
  mergeUpdatedProfileAuth,
  requestPresignedAvatarUpload,
  updateProfile as updateProfileRequest,
  type AddressRecord,
  type ProfileUpdatePayload,
  type WalletSummary,
} from "@/services/profile";
import { deleteProfileApi, getProfileApi, patchProfileApi, postProfileApi } from "@/services/profile-api";

const service = {
  get: getProfileApi,
  post: postProfileApi,
  patch: patchProfileApi,
  del: deleteProfileApi,
};

export type ProfileActions = {
  loading: boolean;
  fetchWallet: () => Promise<WalletSummary>;
  fetchAddresses: () => Promise<AddressRecord[]>;
  deleteAddress: (id: string) => Promise<void>;
  updateProfile: (payload: ProfileUpdatePayload) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
};

export const useProfile = (token: string | null): ProfileActions => {
  const api = useDomainApi(token, { service, requestKey: queryKeys.profile.request });
  const { uploadAvatarFile } = useFileUpload();
  const { login } = useAuthContext();
  const apiClient = useMemo(
    () => ({
      get: api.get,
      post: api.post,
      patch: api.patch,
      del: api.del,
    }),
    [api.del, api.get, api.patch, api.post]
  );

  const fetchWallet = useCallback(() => fetchWalletSummary(apiClient), [apiClient]);

  const fetchAddresses = useCallback(() => fetchProfileAddresses(apiClient), [apiClient]);

  const deleteAddress = useCallback(
    async (id: string) => {
      await deleteProfileAddress(apiClient, id);
    },
    [apiClient]
  );

  const updateProfile = useCallback(
    async (payload: ProfileUpdatePayload) => {
      await updateProfileRequest(apiClient, payload);

      const auth = readAuthSession();

      if (auth) {
        const updatedAuth = mergeUpdatedProfileAuth(auth, payload);
        saveAuthSession(updatedAuth);
        login(updatedAuth);
      }
    },
    [apiClient, login]
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
      const prepared = await prepareUploadFile(file);
      const upload = await requestPresignedAvatarUpload(apiClient, prepared.file);
      await uploadAvatarFile(upload, prepared.file);
      return upload.fileUrl;
    },
    [apiClient, uploadAvatarFile]
  );

  return useMemo(
    () => ({
      loading: api.loading,
      fetchWallet,
      fetchAddresses,
      deleteAddress,
      updateProfile,
      uploadAvatar,
    }),
    [api.loading, deleteAddress, fetchAddresses, fetchWallet, updateProfile, uploadAvatar]
  );
};

export default useProfile;
