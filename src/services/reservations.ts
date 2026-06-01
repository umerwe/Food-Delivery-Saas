import { createDomainApiService } from "@/services/domain-api";
import type { ApiResult } from "@/services/http";
import type { BranchRecord } from "@/types/branch-selector";

export type ReservationStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW" | string;

export type ReservationBranch = BranchRecord & {
  coverImage?: string | null;
  description?: string | null;
};

export type Reservation = {
  id: string;
  branchId?: string | null;
  branch?: ReservationBranch | null;
  reservationDate: string;
  guestCount: number;
  note?: string | null;
  status: ReservationStatus;
};

export type ReservationPayload = {
  branchId: string;
  reservationDate: string;
  guestCount: number;
  note?: string;
};

export type ReservationMeta = {
  page?: number;
  totalPages?: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
};

const reservationsService = createDomainApiService();

export const getReservations = reservationsService.get;
export const postReservations = reservationsService.post;
export const patchReservations = reservationsService.patch;
export const deleteReservations = reservationsService.del;

const getRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const normalizeReservationList = (response: ApiResult): Reservation[] => {
  const data = response.data;
  const dataRecord = getRecord(data);
  const nestedData = getRecord(dataRecord?.data);

  const candidate = Array.isArray(data)
    ? data
    : Array.isArray(dataRecord?.data)
      ? dataRecord.data
      : Array.isArray(dataRecord?.items)
        ? dataRecord.items
        : Array.isArray(nestedData?.items)
          ? nestedData.items
          : [];

  return candidate as Reservation[];
};

const normalizeReservationMeta = (response: ApiResult): ReservationMeta | null => {
  const dataRecord = getRecord(response.data);
  const nestedData = getRecord(dataRecord?.data);
  const meta = dataRecord?.meta || dataRecord?.pagination || nestedData?.meta || nestedData?.pagination || response.meta;

  return getRecord(meta) as ReservationMeta | null;
};

export const fetchReservations = async (token?: string | null) => {
  const response = await getReservations("/customer-app/table-reservations", token);

  return {
    response,
    reservations: response?.error ? [] : normalizeReservationList(response),
    meta: response?.error ? null : normalizeReservationMeta(response),
  };
};

export const createReservation = ({
  customerId,
  payload,
  token,
}: {
  customerId: string;
  payload: ReservationPayload;
  token?: string | null;
}) => postReservations(`/customer-app/table-reservations?customerId=${customerId}`, payload, token);

export const cancelReservation = ({
  reservationId,
  token,
}: {
  reservationId: string;
  token?: string | null;
}) => postReservations(`/customer-app/table-reservations/${reservationId}/cancel`, {}, token);

export const fetchReservationBranch = async ({
  branchId,
  token,
}: {
  branchId: string;
  token?: string | null;
}) => {
  const response = await getReservations(`/v1/branches/${branchId}`, token);
  const dataRecord = getRecord(response.data);
  const nestedData = getRecord(dataRecord?.data);

  return {
    response,
    branch: (nestedData || dataRecord) as BranchRecord | null,
  };
};

export const fetchReservationBranches = ({
  restaurantId,
  search,
  page,
  token,
}: {
  restaurantId?: string | number | null;
  search?: string;
  page?: number;
  token?: string | null;
}) =>
  getReservations(
    `/v1/branches?restaurantId=${restaurantId ?? ""}&search=${search ?? ""}&page=${page ?? 1}`,
    token
  );
