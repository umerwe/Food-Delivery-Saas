import { uploadAvatarFile as uploadStorageFile } from "@/services/storage";

export const MAX_UPLOAD_FILE_SIZE_MB = 20;
export const MAX_UPLOAD_FILE_SIZE_BYTES = MAX_UPLOAD_FILE_SIZE_MB * 1024 * 1024;
import type { AuthSession, AuthUser } from "@/types/auth";
import type { ProfileFormValues } from "@/validations/profile";

export type ApiClient = {
  get: (endpoint: string) => Promise<unknown>;
  del: (endpoint: string) => Promise<unknown>;
  patch: (endpoint: string, body: unknown) => Promise<unknown>;
  post: (endpoint: string, body: unknown) => Promise<unknown>;
};

export type ProfileUpdatePayload = Pick<
  ProfileFormValues,
  "firstName" | "lastName" | "avatarUrl" | "phone" | "bio"
>;

export type AddressRecord = {
  id: string;
  street?: string;
  houseNumber?: string;
  area?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
  lat?: string;
  lng?: string;
  isDefault?: boolean;
};

export type WalletSummary = {
  balance: number;
  currency: string | null;
  transactionCount: number;
};

export type PresignedUploadResponse = {
  uploadUrl: string;
  fileUrl: string;
  headers?: Record<string, string>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getData = (value: unknown) => (isRecord(value) ? value.data : undefined);

const getString = (value: unknown) => (typeof value === "string" ? value : "");

const getCoordinateString = (value: unknown) => {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);

  return "";
};

const getNumber = (value: unknown, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

export const getProfileDefaults = (user: AuthUser | null | undefined): ProfileFormValues => ({
  firstName: user?.profile?.firstName || "",
  lastName: user?.profile?.lastName || "",
  email: user?.email || "",
  phone: user?.profile?.phone || "",
  bio: user?.profile?.bio || "",
  avatarUrl: user?.profile?.avatarUrl || "",
  gender: "",
  country: "",
  language: "",
});

export const getProfileUpdatePayload = (values: ProfileFormValues): ProfileUpdatePayload => ({
  firstName: values.firstName,
  lastName: values.lastName,
  avatarUrl: values.avatarUrl,
  phone: values.phone,
  bio: values.bio,
});

export const getFullName = (values: ProfileFormValues) => `${values.firstName} ${values.lastName}`;

export const fetchWalletSummary = async (api: Pick<ApiClient, "get">): Promise<WalletSummary> => {
  const res = await api.get("/customer-app/wallet");

  if (isRecord(res) && res.error) {
    return {
      balance: 0,
      currency: null,
      transactionCount: 0,
    };
  }

  const data = getData(res);
  const history = isRecord(data) ? data.history : undefined;

  return {
    balance: isRecord(data) ? getNumber(data.balance) : 0,
    currency: isRecord(data) ? getString(data.currency) || null : null,
    transactionCount: Array.isArray(history) ? history.length : 0,
  };
};

export const fetchAddresses = async (api: Pick<ApiClient, "get">): Promise<AddressRecord[]> => {
  const res = await api.get("/v1/addresses");
  const data = getData(res);

  return Array.isArray(data) ? data.filter(isRecord).map((address) => ({
    id: getString(address.id),
    street: getString(address.street),
    houseNumber: getString(address.houseNumber),
    area: getString(address.houseNumber) || getString(address.area),
    postalCode: getString(address.postalCode),
    city: getString(address.city),
    state: getString(address.state),
    country: getString(address.country),
    lat: getCoordinateString(address.lat),
    lng: getCoordinateString(address.lng),
    isDefault: address.isDefault === true,
  })) : [];
};

export const deleteAddress = (api: Pick<ApiClient, "del">, id: string) =>
  api.del(`/v1/addresses/${id}`);

export const updateProfile = (api: Pick<ApiClient, "patch">, payload: ProfileUpdatePayload) =>
  api.patch("/v1/auth/me/profile", payload);

export const requestPresignedAvatarUpload = async (
  api: Pick<ApiClient, "post">,
  file: File
): Promise<PresignedUploadResponse> => {
  const presigned = await api.post("/v1/storage/presigned-upload", {
    fileName: file.name,
    contentType: file.type,
    fileSize: file.size,
  });

  const data = getData(presigned);

  if (!isRecord(data)) {
    throw new Error("Invalid upload response");
  }

  const uploadUrl = getString(data.uploadUrl);
  const fileUrl = getString(data.fileUrl);
  const rawHeaders = data.headers;

  if (!uploadUrl || !fileUrl) {
    throw new Error("Invalid upload response");
  }

  const headers = isRecord(rawHeaders)
    ? Object.fromEntries(
        Object.entries(rawHeaders).filter((entry): entry is [string, string] =>
          typeof entry[1] === "string"
        )
      )
    : undefined;

  return {
    uploadUrl,
    fileUrl,
    headers,
  };
};

export const uploadAvatarFile = (upload: PresignedUploadResponse, file: File) =>
  uploadStorageFile(upload.uploadUrl, file, upload.headers);

export const mergeUpdatedProfileAuth = (
  auth: AuthSession,
  values: ProfileUpdatePayload
): AuthSession => ({
  ...auth,
  user: {
    ...auth.user,
    profile: {
      ...auth.user.profile,
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      bio: values.bio,
      avatarUrl: values.avatarUrl,
    },
  },
});
