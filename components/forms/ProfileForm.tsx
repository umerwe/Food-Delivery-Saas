"use client"

import { useState } from "react";
import { Camera, ChevronDown } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export default function ProfileForm() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="flex flex-col items-center max-w-[979px] mx-auto">
      <div className="relative mb-[22px]">
        <div className="w-[94px] h-[94px] rounded-full overflow-hidden relative">
          <Image
            src="/profile-user.png"
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

      {/* 2. User Identity */}
      <div className="text-center mb-[37px]">
        <h2 className="text-xl font-medium text-gray-900">Alexa Rawles</h2>
        <p className="text-gray-400 text-base mb-[22px]">alexarawles@gmail.com</p>

        {!isEditing && (
          <Button
            variant="primary"
            className="h-[50px] w-[194px] rounded-lg font-normal"
            onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        )}
      </div>

      {!isEditing ? (
        <div className="w-full bg-white rounded-[10px] shadow-lg px-[54px] py-[51px] border border-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-[40px]">
            <div className="space-y-[20px]">
              <p className="text-gray-400 text-base">Full Name</p>
              <p className="text-base font-medium text-gray-900">Alexa Rawles</p>
            </div>
            <div className="space-y-[20px]">
              <p className="text-gray-400 text-base">Email</p>
              <p className="text-base font-medium text-gray-900">food@gmail.com</p>
            </div>
            <div className="space-y-[20px]">
              <p className="text-gray-400 text-base">Address</p>
              <p className="text-base font-medium text-gray-900">South California East Bay Street 2</p>
            </div>
            <div className="space-y-[20px]">
              <p className="text-gray-400 text-base">Phone</p>
              <p className="text-base font-medium text-gray-900">+07 74653948757</p>
            </div>
          </div>
        </div>
      ) : (
        <form className="w-full space-y-[60px]" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[40px] gap-y-[30px] w-full">

            <div className="flex flex-col">
              <label className="text-base text-gray-500 mb-2.5 ml-1">Full Name</label>
              <Input
                placeholder="Your Full Name"
                className="text-gray-500 placeholder:text-gray-800 bg-[#F9F9F9]"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-base text-gray-500 mb-2.5 ml-1">Phone Number</label>
              <Input
                placeholder="Mobile Number"
                className="text-gray-500 placeholder:text-gray-800 bg-[#F9F9F9]"
              />
            </div>

            {/* Gender SELECT */}
            <div className="flex flex-col">
              <label className="text-base text-gray-500 mb-2.5 ml-1">Gender</label>
              <div className="relative">
                <select className="w-full h-[56px] px-6 bg-[#F9F9F9] rounded-[10px] border-none outline-none text-base appearance-none cursor-pointer focus:ring-1 focus:ring-primary/20">
                  <option value="">Choose gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={24} />
              </div>
            </div>

            {/* Country SELECT */}
            <div className="flex flex-col">
              <label className="text-base text-gray-500 mb-2.5 ml-1">Country</label>
              <div className="relative">
                <select className="w-full h-[56px] px-6 bg-[#F9F9F9] rounded-[10px] text-base appearance-none cursor-pointer focus:ring-1 focus:ring-primary/20">
                  <option value="">Select country</option>
                  <option value="us">United States</option>
                  <option value="uk">United Kingdom</option>
                  <option value="fr">France</option>
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={24} />
              </div>
            </div>

            {/* Language SELECT */}
            <div className="flex flex-col">
              <label className="text-base text-gray-500 mb-2.5 ml-1">Language</label>
              <div className="relative">
                <select className="w-full h-[56px] px-6 bg-[#F9F9F9] rounded-[10px] text-base appearance-none cursor-pointer">
                  <option value="">Select Language</option>
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={24} />
              </div>
            </div>

            {/* Address */}
            <div className="flex flex-col">
              <label className="text-base text-gray-500 mb-2.5 ml-1">Address</label>
              <div className="relative">
                <Input
                  placeholder="South California East Bay Street 2"
                  className="text-gray-500 placeholder:text-gray-800 bg-[#F9F9F9]"
                />
                <button
                  type="button"
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-primary font-medium text-sm hover:underline"
                >
                  Change
                </button>
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            className="rounded-lg w-[226px] h-[50px]"
            type="submit"
            onClick={() => setIsEditing(false)}
          >
            Update Changes
          </Button>
        </form>
      )}
    </div>
  );
}