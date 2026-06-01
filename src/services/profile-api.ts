import { createDomainApiService } from "@/services/domain-api";

const profileService = createDomainApiService();

export const getProfileApi = profileService.get;
export const postProfileApi = profileService.post;
export const patchProfileApi = profileService.patch;
export const deleteProfileApi = profileService.del;
