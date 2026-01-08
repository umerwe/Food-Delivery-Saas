"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FcGoogle } from "react-icons/fc"
import { FaFacebook } from "react-icons/fa"

export default function LoginForm() {
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
        <div className="w-[562px]">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-headline-sm font-bold font-roboto text-primary">Login</h1>
                <p className="text-sm text-muted-foreground">Please, fill in this form to login</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-[16px] mt-[35px] mb-[19px]">
                {/* Email */}
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

                {/* Password */}
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

                {/* Sign Up Button */}
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-[50px] text-lg font-semibold bg-primary hover:bg-primary/90 text-white rounded-base transition-colors mb-[15px]"
                >
                    {isLoading ? "Logging in..." : "Login"}
                </Button>
            </form>

            {/* Social Buttons */}
            <div className="space-y-9 flex flex-col items-center">
                <Button
                    type="button"
                    className="w-[345px] h-[54px] text-title-md bg-blue font-semibold hover:bg-blue/90 text-white font-bolsd rounded-base transition-colors"
                >
                    <FaFacebook className="w-[23px] h-[23px] mr-[15.5px]" />
                    SignIn with Facebook
                </Button>

                <Button
                    type="button"
                    className="w-[345px] h-[54px] text-title-md font-semibold bg-transparent hover:bg-gray-100 shadow-lg"
                >
                    <FcGoogle className="w-[24px] h-[24px] mr-[15px]" />
                    <p className="text-gray-500">SignIn with Google</p>
                </Button>
            </div>

            {/* Sign In Link */}
            <p className="text-center text-sm text-muted-foreground mt-[68px]">
                Don't have an account?{" "}
                <Link href="/auth/signup" className="text-blue hover:underline">
                    Sign up now
                </Link>
            </p>
        </div>
    )
}
