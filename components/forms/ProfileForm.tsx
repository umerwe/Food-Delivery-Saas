"use client"

import { useEffect, useState } from "react"
import { Camera, ChevronDown } from "lucide-react"
import Image from "next/image"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { toast } from "sonner"

export default function ProfileForm() {
  const [isEditing, setIsEditing] = useState(false)

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    avatarUrl: "",
    address: "",
    gender: "",
    country: "",
    language: "",
  })

  useEffect(() => {
    const authRaw = localStorage.getItem("auth")
    if (!authRaw) return

    try {
      const auth = JSON.parse(authRaw)

      setProfile((prev) => ({
        ...prev,
        firstName: auth?.user?.profile?.firstName || "",
        lastName: auth?.user?.profile?.lastName || "",
        email: auth?.user?.email || "",
        phone: auth?.user?.profile?.phone || "",
        avatarUrl: auth?.user?.profile?.avatarUrl || "",
      }))
    } catch (err) {
      console.error("Failed to parse auth", err)
    }
  }, [])

  const handleChange = (field: string, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }))
  }
const handleSubmit = () => {
  const authRaw = localStorage.getItem("auth")
  if (!authRaw) return

  try {
    const auth = JSON.parse(authRaw)

    // update values inside auth object
    auth.user.profile.firstName = profile.firstName
    auth.user.profile.lastName = profile.lastName
    auth.user.profile.phone = profile.phone
    auth.user.profile.avatarUrl = profile.avatarUrl

    // save back to localStorage
    localStorage.setItem("auth", JSON.stringify(auth))
window.dispatchEvent(new Event("userUpdated"))
    toast.success("Profile updated successfully")
  } catch (err) {
    console.error("Failed updating localStorage", err)
    toast.error("Something went wrong")
  }

  setIsEditing(false)
}
  const fullName = `${profile.firstName} ${profile.lastName}`

  return (
    <div className="flex flex-col items-center max-w-[979px] mx-auto">

      {/* Avatar */}
      <div className="relative mb-[22px]">
        <div className="w-[94px] h-[94px] rounded-full overflow-hidden relative">
          <Image
            src={profile.avatarUrl || "/profile-user.png"}
            alt="User Profile"
            fill
            className="object-cover"
          />
        </div>

        {isEditing && (
          <button className="absolute bottom-0 -right-2 p-1.5">
            <Camera size={22} className="text-gray-800 stroke-[3px]" />
          </button>
        )}
      </div>

      {/* Identity */}
      <div className="text-center mb-[37px]">
        <h2 className="text-xl font-medium text-gray-900">{fullName}</h2>
        <p className="text-gray-400 text-base mb-[22px]">{profile.email}</p>

        {!isEditing && (
          <Button
            variant="primary"
            className="h-[50px] w-[194px] rounded-lg font-normal"
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </Button>
        )}
      </div>

      {!isEditing ? (

        /* VIEW MODE */

        <div className="w-full bg-white rounded-[10px] shadow-lg px-[54px] py-[51px] border border-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-[40px]">

            <div className="space-y-[20px]">
              <p className="text-gray-400 text-base">Full Name</p>
              <p className="text-base font-medium text-gray-900">{fullName}</p>
            </div>

            <div className="space-y-[20px]">
              <p className="text-gray-400 text-base">Email</p>
              <p className="text-base font-medium text-gray-900">{profile.email}</p>
            </div>

            <div className="space-y-[20px]">
              <p className="text-gray-400 text-base">Phone</p>
              <p className="text-base font-medium text-gray-900">{profile.phone || "-"}</p>
            </div>

            <div className="space-y-[20px]">
              <p className="text-gray-400 text-base">Address</p>
              <p className="text-base font-medium text-gray-900">{profile.address || "-"}</p>
            </div>

          </div>
        </div>

      ) : (

        /* EDIT MODE */

        <form
          className="w-full space-y-[60px]"
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[40px] gap-y-[30px] w-full">

            {/* First Name */}
            <div className="flex flex-col">
              <label className="text-base text-gray-500 mb-2.5 ml-1">
                First Name
              </label>
              <Input
                value={profile.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                className="bg-[#F9F9F9]"
              />
            </div>

            {/* Last Name */}
            <div className="flex flex-col">
              <label className="text-base text-gray-500 mb-2.5 ml-1">
                Last Name
              </label>
              <Input
                value={profile.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                className="bg-[#F9F9F9]"
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col">
              <label className="text-base text-gray-500 mb-2.5 ml-1">
                Phone Number
              </label>
              <Input
                value={profile.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="bg-[#F9F9F9]"
              />
            </div>

            {/* Gender */}
            <div className="flex flex-col">
              <label className="text-base text-gray-500 mb-2.5 ml-1">
                Gender
              </label>
              <div className="relative">
                <select
                  value={profile.gender}
                  onChange={(e) => handleChange("gender", e.target.value)}
                  className="w-full h-[56px] px-6 bg-[#F9F9F9] rounded-[10px] appearance-none"
                >
                  <option value="">Choose gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>

                <ChevronDown
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400"
                  size={24}
                />
              </div>
            </div>

            {/* Country */}
            <div className="flex flex-col">
              <label className="text-base text-gray-500 mb-2.5 ml-1">
                Country
              </label>
              <Input
                value={profile.country}
                onChange={(e) => handleChange("country", e.target.value)}
                className="bg-[#F9F9F9]"
              />
            </div>

            {/* Language */}
            <div className="flex flex-col">
              <label className="text-base text-gray-500 mb-2.5 ml-1">
                Language
              </label>
              <Input
                value={profile.language}
                onChange={(e) => handleChange("language", e.target.value)}
                className="bg-[#F9F9F9]"
              />
            </div>

            {/* Address */}
            <div className="flex flex-col md:col-span-2">
              <label className="text-base text-gray-500 mb-2.5 ml-1">
                Address
              </label>
              <Input
                value={profile.address}
                onChange={(e) => handleChange("address", e.target.value)}
                className="bg-[#F9F9F9]"
              />
            </div>

          </div>

          <Button
            variant="primary"
            className="rounded-lg w-[226px] h-[50px]"
            type="submit"
          >
            Update Changes
          </Button>

        </form>
      )}
    </div>
  )
}