"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { FcGoogle } from "react-icons/fc"
import { FaFacebook } from "react-icons/fa"
import { roboto } from "@/lib/fonts"

export default function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1000)
  }

  return (
    <div className="w-full lg:mr-[79px]">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-headline-sm font-bold font-roboto text-primary">Sign Up</h1>
        <p className="text-sm text-muted-foreground">Please, fill in this form to sign up</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 my-6">
        {/* Name Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Input
              id="firstName"
              name="firstName"
              type="text"
              placeholder="First name"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Input
              id="lastName"
              name="lastName"
              type="text"
              placeholder="Last name"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <div className="relative">
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <div className="relative">
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="relative">
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-center gap-2 py-[9.5px]">
          <Checkbox
            id="terms"
            name="acceptTerms"
            checked={formData.acceptTerms}
            className="border-gray-400 border-2 rounded-none"
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, acceptTerms: checked as boolean }))}
          />
          <label htmlFor="terms" className="text-sm text-gray-500 cursor-pointer">
            I accept the{" "}
            <Link href="#" className="hover:underline">
              Terms of use
            </Link>
            {" & "}
            <Link href="#" className="hover:underline">
              privacy policy
            </Link>
          </label>
        </div>

        {/* Sign Up Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-[50px] text-lg font-semibold bg-primary hover:bg-primary/90 text-white rounded-base transition-colors mb-[10px]"
        >
          {isLoading ? "Signing up..." : "Sign Up"}
        </Button>
      </form>

      <div className="space-y-9 flex flex-col items-center">
        <Link
          href="/auth/login"
          type="button"
          className="w-[345px] flex items-center justify-center h-[54px] font-medium bg-blue rounded-[10px] hover:bg-blue/90 text-white shadow-lg"
        >
          <FaFacebook className="w-[23px] h-[23px] mr-[15px]" />
          <span className={`${roboto.className} font-medium text-xl`}>SignIn with Facebook</span>
        </Link>

        <Link
          href="/auth/login"
          type="button"
          className="w-[345px] flex items-center justify-center h-[54px] font-medium bg-transparent rounded-[10px] hover:bg-gray-100 shadow-sm border border-gray-200"
        >
          <FcGoogle className="w-[24px] h-[24px] mr-[15px]" />
          <p className={`${roboto.className} font-medium text-xl text-gray-500`}>Sign In with Google</p>
        </Link>
      </div>

      {/* Sign In Link */}
      <p className="text-center text-sm text-muted-foreground mt-2">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-blue hover:underline">
          Login now
        </Link>
      </p>
    </div>
  )
}
