"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  Camera,
  Pencil,
  Trash2,
  Plus,
  Building2,
  ArrowUpRight,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import { CARD_PANEL_CLASS } from "@/components/common/common-classes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import AddressModal from "./AddressModal";
import useProfileApi from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import {
  getFullName,
  getProfileDefaults,
  getProfileUpdatePayload,
  type AddressRecord,
  type WalletSummary,
} from "@/services/profile";
import {
  profileSchema,
  type ProfileFormValues,
} from "@/validations/profile";

export function ProfileForm() {
  const { token, user } = useAuth();
  const {
    deleteAddress,
    fetchAddresses: fetchProfileAddresses,
    fetchWallet: fetchProfileWallet,
    updateProfile,
    uploadAvatar,
  } = useProfileApi(token);

  const fileRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: getProfileDefaults(null),
  });

  const profile = {
    ...getProfileDefaults(user),
    ...useWatch({ control: form.control }),
  };

  const [isEditing, setIsEditing] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<AddressRecord | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletCurrency, setWalletCurrency] = useState("USD");
  const [walletTxns, setWalletTxns] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [addresses, setAddresses] = useState<AddressRecord[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const addressesLoadedRef = useRef(false);

  const fetchWallet = useCallback(async (skipStateUpdate = false): Promise<WalletSummary | null> => {
    try {
      const summary = await fetchProfileWallet();

      if (!skipStateUpdate) {
        setWalletBalance(summary.balance);
        setWalletCurrency(summary.currency);
        setWalletTxns(summary.transactionCount);
      }

      return summary;
    } catch {
      toast.error("Failed to load wallet");
      return null;
    }
  }, [fetchProfileWallet]);

  const fetchAddresses = useCallback(async (skipStateUpdate = false) => {
    const shouldShowLoading = !skipStateUpdate && !addressesLoadedRef.current;

    try {
      if (shouldShowLoading) {
        setLoadingAddresses(true);
      }
      const addressList = await fetchProfileAddresses();

      if (!skipStateUpdate) {
        setAddresses(addressList);
        addressesLoadedRef.current = true;
        setAddressesLoaded(true);
      }
    } catch (error) {
    } finally {
      if (shouldShowLoading) {
        setLoadingAddresses(false);
      }
    }
  }, [fetchProfileAddresses]);

  useEffect(() => {
    if (!user) return;

    form.reset(getProfileDefaults(user));

    const loadAddresses = () => fetchAddresses();
    const loadWallet = () => fetchWallet();

    void loadAddresses();
    void loadWallet();
  }, [fetchAddresses, fetchWallet, form, user, token]);

  const handleDelete = async (id: string) => {
    try {
      await deleteAddress(id);
      toast.success("Address deleted");
      fetchAddresses();
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUpdating(true);

      const fileUrl = await uploadAvatar(file);

      form.setValue("avatarUrl", fileUrl, { shouldDirty: true, shouldValidate: true });

      toast.success("Avatar uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUpdating(false);
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      setUpdating(true);

      const payload = getProfileUpdatePayload(values);

      await updateProfile(payload);

      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch {
      toast.error("Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const fullName = getFullName(profile);

  return (
  <div
    className="max-w-[1280px] mx-auto p-6 md:p-8 rounded-[20px] border border-black/5 bg-white shadow-[0_4px_100px_0_rgba(0,0,0,0.05)]"
  >
    <AddressModal
      open={addressOpen}
      onOpenChange={setAddressOpen}
      onSuccess={fetchAddresses}
      editData={selectedAddress}
    />

    {/* TOP HEADER */}
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
      <div className="flex items-center gap-4">
        <div className="relative w-[88px] h-[88px] rounded-full overflow-hidden">
          <Image
            fill
            alt="profile"
            className="object-cover"
            src={
              profile.avatarUrl?.startsWith("http")
                ? profile.avatarUrl
                : "/profile-user.png"
            }
          />

          {isEditing && (
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center"
            >
              <Camera size={14} />
            </button>
          )}

          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
          />
        </div>

        <div>
          <h2 className="text-[34px] font-medium text-[#1a1a1a] leading-none">
            {fullName}
          </h2>
          <p className="text-[#8A8A8A] mt-2 font-normal">{profile.email}</p>

          <span className="inline-block mt-2 text-[11px] bg-[#f2f2f2] px-3 py-1 rounded-full text-[#8a8a8a] uppercase">
            User
          </span>
        </div>
      </div>

      {!isEditing && (
        <Button
          onClick={() => setIsEditing(true)}
          className="rounded-full bg-primary  text-white border border-black/10 px-6 font-medium"
        >
          Edit Profile
        </Button>
      )}
    </div>

    {/* ROW 1 */}
    <div className="grid lg:grid-cols-[1fr_320px] gap-5 mb-5">
      {/* PERSONAL INFO */}
      <div className={CARD_PANEL_CLASS}>
        {!isEditing ? (
          <>
            <h3 className="text-[22px] font-medium text-[#222] mb-6">
              Personal Information
            </h3>

            <div className="grid md:grid-cols-2 gap-y-6 gap-x-10">
              <div>
                <p className="text-[11px] text-[#9A9A9A] uppercase">
                  Full Name
                </p>
                <p className="mt-1 font-normal text-[#303030]">{fullName}</p>
              </div>

              <div>
                <p className="text-[11px] text-[#9A9A9A] uppercase">
                  Email Address
                </p>
                <p className="mt-1 font-normal text-[#303030]">
                  {profile.email}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-[#9A9A9A] uppercase">
                  Phone Number
                </p>
                <p className="mt-1 font-normal text-[#303030]">
                  {profile.phone || "-"}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-[#9A9A9A] uppercase">Bio</p>
                <p className="mt-1 font-normal text-[#303030]">
                  {profile.bio || "-"}
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-[22px] font-medium text-[#222] mb-6">
              Edit Profile
            </h3>

            <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                id="firstName"
                placeholder="First Name"
                {...form.register("firstName")}
              />

              <Input
                id="lastName"
                placeholder="Last Name"
                {...form.register("lastName")}
              />

              <Input
                id="phone"
                placeholder="Phone"
                {...form.register("phone")}
              />

              <Input
                id="bio"
                placeholder="Bio"
                {...form.register("bio")}
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={updating}
                className="bg-red-600 hover:bg-red-700"
              >
                {updating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
            </form>
          </>
        )}
      </div>

     {/* BALANCE */}
<div
  className="rounded-[20px] p-6 text-white h-full"
  style={{
    background:
      "linear-gradient(135deg, var(--primary), #a91114)",
  }}
>
  <div className="flex items-center justify-between">
    <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center">
      <Wallet size={20} />
    </div>

    <Link
      href="/payments-history"
      className="px-3 py-1.5 rounded-full bg-white text-red-600 text-sm font-medium hover:bg-white"
    >
      View Wallet
    </Link>
  </div>

  <p className="uppercase text-[11px] tracking-[0.18em] text-white/75 mt-5 font-normal">
    Current Balance
  </p>

  <h3 className="text-[38px] md:text-[42px] font-semibold mt-2 leading-none">
    {walletCurrency} {Number(walletBalance || 0).toFixed(2)}
  </h3>

  <div className="grid grid-cols-2 gap-3 mt-8">
    <div className="rounded-2xl bg-white/10 px-4 py-3">
      <p className="text-[11px] uppercase text-white/70">
        Transactions
      </p>
      <p className="text-[22px] font-semibold mt-1">
        {walletTxns}
      </p>
    </div>

    <div className="rounded-2xl bg-white/10 px-4 py-3">
      <p className="text-[11px] uppercase text-white/70">
        Status
      </p>
      <p className="text-[16px] font-medium mt-2 flex items-center gap-1">
        Active
        <ArrowUpRight size={14} />
      </p>
    </div>
  </div>

  <p className="text-xs text-white/70 mt-5">
    Manage wallet funds & payment activity anytime.
  </p>
</div>
    </div>

    {/* ROW 2 */}
    <div className={CARD_PANEL_CLASS}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-[28px] font-medium text-[#222]">
            Your Addresses
          </h3>
          <p className="text-[#8A8A8A] text-sm font-normal">
            Manage where you want your deliveries delivered.
          </p>
        </div>

        <Button
          onClick={() => {
            setSelectedAddress(null);
            setAddressOpen(true);
          }}
          className="rounded-full bg-[#1A1C1C] hover:bg-[#1A1C1C] text-white px-5 font-medium"
        >
          <Plus size={14} className="mr-1" />
          New Address
        </Button>
      </div>

      {loadingAddresses && !addressesLoaded ? (
        <p>Loading...</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="relative bg-white rounded-[16px] border border-black/5 p-5 min-h-[185px]"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#f3f3f3] flex items-center justify-center">
                  <Building2 size={18} className="text-[#555]" />
                </div>

                <p className="font-medium text-[#222]">
                  Saved Address
                </p>
              </div>

              <p className="text-sm text-[#7A7A7A]">{addr.street}</p>
              <p className="text-sm text-[#7A7A7A]">
                {addr.area}, {addr.city}
              </p>
              <p className="text-sm text-[#7A7A7A]">
                {addr.state}, {addr.country}
              </p>

              <div className="absolute bottom-4 right-4 flex gap-3">
                <button
                  onClick={() => {
                    setSelectedAddress(addr);
                    setAddressOpen(true);
                  }}
                >
                  <Pencil size={15} className="text-[#666]" />
                </button>

                <button
                  onClick={() => handleDelete(addr.id)}
                >
                  <Trash2
                    size={15}
                    className="text-red-500"
                  />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => {
              setSelectedAddress(null);
              setAddressOpen(true);
            }}
            className="rounded-[12px] border-2 border-dashed border-[#D1D5DB] bg-[#F0F0F0] min-h-[185px] flex flex-col items-center justify-center text-[#8A8A8A]"
          >
            <Plus />
            <span className="mt-2 font-medium">
              Add New Location
            </span>
          </button>
        </div>
      )}
    </div>
  </div>
);
}
