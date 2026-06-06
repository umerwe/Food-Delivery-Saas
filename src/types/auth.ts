import type { BranchAddress, BranchOrderType } from "@/types/branches";

export type AuthBranch = {
  id: string;
  name: string;
  isActive?: boolean;
  restaurantId?: string | null;
  address?: BranchAddress;
  distanceKm?: number | null;
  selectedOrderType?: BranchOrderType;
};

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  tenantId: string;
  restaurantId?: string | null;
  branchId?: string | null;
  branch?: AuthBranch | null;
  selectedOrderType?: BranchOrderType | null;
  profile?: {
    firstName: string;
    lastName: string;
    avatarUrl: string;
    phone?: string | null;
    bio?: string;
    createdAt?: string;
  };
};

export type AuthSession = {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
};

export type LoginCustomerPayload = {
  email: string;
  password: string;
  restaurantId: string;
};

export type GuestLoginCustomerPayload = {
  firstName: string;
  lastName: string;
  phone: string;
  restaurantId: string;
};

export type SignupCustomerPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  restaurantId: string;
};

export type VerifySignupOtpPayload = {
  otp: string;
};

export type ForgotPasswordPayload = {
  email: string;
  restaurantId: string;
};

export type ResetPasswordPayload = {
  email: string;
  otp: string;
  newPassword: string;
  restaurantId: string;
};

export type RefreshTokenPayload = {
  refreshToken: string;
};

export type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (data: AuthSession) => void;
  logout: () => void;
  updateUser: (user: AuthUser | null | ((user: AuthUser | null) => AuthUser | null)) => void;
  setUser: (user: AuthUser | null | ((user: AuthUser | null) => AuthUser | null)) => void;
};
