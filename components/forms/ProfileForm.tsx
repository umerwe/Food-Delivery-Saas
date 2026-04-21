"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Pencil,
  Trash2,
  Plus,
  Home,
  Building2,
  ArrowUpRight,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast } from "sonner";
import AddressModal from "./AddressModal";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { useAuthContext } from "@/context/AuthContext";
import Link from "next/link";

export default function ProfileForm() {
  const { token, user } = useAuth();
  const { login } = useAuthContext();

  const { get, del, patch, post } = useApi(token);

  const fileRef = useRef<HTMLInputElement | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
const [walletBalance, setWalletBalance] = useState(0);
const [walletCurrency, setWalletCurrency] = useState("USD");
const [walletTxns, setWalletTxns] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    avatarUrl: "",
    bio: "",
    gender: "",
    country: "",
    language: "",
  });

  useEffect(() => {
    if (!user) return;

    setProfile({
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

    fetchAddresses();
    fetchWallet();
  }, [user, token]);

  const fetchWallet = async () => {
  try {
    const res = await get("/v1/customer-app/wallet");

    if (!res?.error) {
      setWalletBalance(res?.data?.balance || 0);
      setWalletCurrency(res?.data?.currency || "USD");
      setWalletTxns(res?.data?.history?.length || 0);
    }
  } catch (error) {
    console.error(error);
    toast.error("Failed to load wallet");
  }
};

  const fetchAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const res = await get("/v1/addresses");
      setAddresses(res?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await del(`/v1/addresses/${id}`);
      toast.success("Address deleted");
      fetchAddresses();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const handleChange = (field: string, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUpdating(true);

      const presigned = await post("/v1/storage/presigned-upload", {
        fileName: file.name,
        contentType: file.type,
      });

      const { uploadUrl, fileUrl, headers } = presigned.data;

      await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
          ...headers,
        },
        body: file,
      });

      setProfile((prev) => ({
        ...prev,
        avatarUrl: fileUrl,
      }));

      toast.success("Avatar uploaded");
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setUpdating(true);

      // ✅ EMAIL NOT SENT
      const payload = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatarUrl: profile.avatarUrl,
        phone: profile.phone,
        bio: profile.bio,
      };

      await patch("/v1/auth/me/profile", payload);

      const authRaw = localStorage.getItem("auth");

      if (authRaw) {
        const auth = JSON.parse(authRaw);

        const updatedUser = {
          ...auth.user,
          profile: {
            ...auth.user.profile,
            firstName: profile.firstName,
            lastName: profile.lastName,
            phone: profile.phone,
            bio: profile.bio,
            avatarUrl: profile.avatarUrl,
          },
        };

        const updatedAuth = {
          ...auth,
          user: updatedUser,
        };

        localStorage.setItem("auth", JSON.stringify(updatedAuth));
        login(updatedAuth);
      }

      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      toast.error("Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const fullName = `${profile.firstName} ${profile.lastName}`;

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
      <div className="bg-[#F5F5F5] rounded-[20px] p-6">
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

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                value={profile.firstName}
                onChange={(e) =>
                  handleChange("firstName", e.target.value)
                }
                placeholder="First Name"
              />

              <Input
                value={profile.lastName}
                onChange={(e) =>
                  handleChange("lastName", e.target.value)
                }
                placeholder="Last Name"
              />

              <Input
                value={profile.phone}
                onChange={(e) =>
                  handleChange("phone", e.target.value)
                }
                placeholder="Phone"
              />

              <Input
                value={profile.bio}
                onChange={(e) =>
                  handleChange("bio", e.target.value)
                }
                placeholder="Bio"
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
                onClick={handleSubmit}
                disabled={updating}
                className="bg-red-600 hover:bg-red-700"
              >
                {updating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
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
    <div className="bg-[#F5F5F5] rounded-[20px] p-6">
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

      {loadingAddresses ? (
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