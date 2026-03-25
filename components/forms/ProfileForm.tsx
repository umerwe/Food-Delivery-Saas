"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Pencil,
  Trash2,
  MapPin,
  Plus,
} from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast } from "sonner";
import AddressModal from "./AddressModal";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { useAuthContext } from "@/context/AuthContext";

export default function ProfileForm() {
  const { token, user } = useAuth();
const { login } = useAuthContext();

  const [isEditing, setIsEditing] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
const { get, del, patch, post } = useApi(token);
const fileRef = useRef<HTMLInputElement | null>(null);
const [updating, setUpdating] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    avatarUrl: "",
    gender: "",
    country: "",
    bio: "", 
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
}, [user, token]);


  const fetchAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const res = await get("/v1/addresses");
      setAddresses(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await del(`/v1/addresses/${id}`);
      toast.success("Address deleted");
      fetchAddresses();
    } catch (err) {
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

    // 1️⃣ Get presigned URL
    const presigned = await post("/v1/storage/presigned-upload", {
      fileName: file.name,
      contentType: file.type,
      // resourceType: "avatar",
    });

    const { uploadUrl, fileUrl, headers } = presigned.data;

    // 2️⃣ Upload to S3
    await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
        ...headers,
      },
      body: file,
    });

    // 3️⃣ Save URL in state
    setProfile((prev) => ({
      ...prev,
      avatarUrl: fileUrl,
    }));

    toast.success("Avatar uploaded");
  } catch (err) {
    console.error(err);
    toast.error("Upload failed");
  } finally {
    setUpdating(false);
  }
};

const handleSubmit = async () => {
  try {
    setUpdating(true);

    const payload = {
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatarUrl: profile.avatarUrl,
      phone: profile.phone,
      bio: profile.bio,
    };

    await patch("/v1/auth/me/profile", payload);

    // ✅ update localStorage (important)
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

  // update localStorage (for persistence)
  localStorage.setItem("auth", JSON.stringify(updatedAuth));

  // ✅ update global context
  login(updatedAuth);
}
    toast.success("Profile updated successfully");
    setIsEditing(false);
  } catch (err) {
    console.error(err);
    toast.error("Update failed");
  } finally {
    setUpdating(false);
  }
};
  const fullName = `${profile.firstName} ${profile.lastName}`;

  return (
    <div className="flex flex-col items-center max-w-[979px] mx-auto">

      {/* MODAL */}
      <AddressModal
        open={addressOpen}
        onOpenChange={setAddressOpen}
        onSuccess={fetchAddresses}
        editData={selectedAddress}
      />

      {/* AVATAR */}
<div className="relative mb-6">
     <div onClick={() => isEditing && fileRef.current?.click()} className="w-[100px] h-[100px] rounded-full overflow-hidden"> 
        <Image src={ profile.avatarUrl?.startsWith("http") ? profile.avatarUrl : "/profile-user.png" } alt="profile" fill className="object-cover" /> 
<input
  type="file"
  ref={fileRef}
  className="hidden"
  accept="image/*"
  onChange={handleFileUpload}
/>
    </div> 
    
    {isEditing && ( 
        <button className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow">
             <Camera size={18} /> </button> )}
             </div>

      {/* HEADER */}
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold">{fullName}</h2>
        <p className="text-gray-400">{profile.email}</p>

        {!isEditing && (
          <Button className="mt-4" onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        )}
      </div>

      {/* VIEW MODE */}
      {!isEditing ? (
        <div className="w-full space-y-6">

          {/* PROFILE CARD */}
          <div className="bg-white p-6 rounded-xl shadow grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-gray-400">Full Name</p>
              <p className="font-medium">{fullName}</p>
            </div>

            <div>
              <p className="text-gray-400">Email</p>
              <p className="font-medium">{profile.email}</p>
            </div>

            <div>
              <p className="text-gray-400">Phone</p>
              <p className="font-medium">{profile.phone || "-"}</p>
            </div>
          </div>

          {/* ADDRESS SECTION */}
          <div className="bg-white p-6 rounded-xl shadow">

            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin size={18} /> Addresses
              </h3>

              <Button
                size="sm"
                onClick={() => {
                  setSelectedAddress(null);
                  setAddressOpen(true);
                }}
              >
                <Plus size={16} /> Add
              </Button>
            </div>

            {loadingAddresses ? (
              <p>Loading...</p>
            ) : addresses.length === 0 ? (
              <p className="text-gray-400">No addresses found</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="rounded-xl p-4 shadow-lg transition group relative"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold">{addr.street}</p>
                      <p className="text-sm text-gray-500">
                        {addr.area}, {addr.city}
                      </p>
                      <p className="text-sm text-gray-500">
                        {addr.state}, {addr.country}
                      </p>
                    </div>

                    {/* ACTION ICONS */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => {
                          setSelectedAddress(addr);
                          setAddressOpen(true);
                        }}
                        className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        onClick={() => handleDelete(addr.id)}
                        className="p-2 bg-red-100 rounded-lg hover:bg-red-200"
                      >
                        <Trash2 size={14} className="text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* EDIT MODE */
        <form
          className="w-full space-y-10"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="grid md:grid-cols-2 gap-4">

            <Input
              value={profile.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              placeholder="First Name"
            />

            <Input
              value={profile.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              placeholder="Last Name"
            />

            <Input
              value={profile.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="Phone"
            />

            <Input
  value={profile.bio}
  onChange={(e) => handleChange("bio", e.target.value)}
  placeholder="Bio"
/>

          </div>

          <Button type="submit">Update Profile</Button>
        </form>
      )}
    </div>
  );
}