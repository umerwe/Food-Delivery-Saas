"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation" // Import useRouter for navigation
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FcGoogle } from "react-icons/fc"
import { FaFacebook } from "react-icons/fa"
import { roboto } from "@/lib/fonts"

export default function LoginForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
                
        if (!formData.email || !formData.password) {
            alert("Please enter both email and password")
            return
        }

        setIsLoading(true)

        setTimeout(() => {
            localStorage.setItem("isAuth", "true")
            
            setIsLoading(false)
            
            router.push("/")
        }, 1000)
    }

    return (
        <div className="w-full lg:mr-[79px]">
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

                {/* Login Button */}
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
                <button
                    type="button"
                    onClick={() => {
                        localStorage.setItem("isAuth", "true")
                        router.push("/")
                    }}
                    className="w-[345px] flex items-center justify-center h-[54px] font-medium bg-blue rounded-[10px] hover:bg-blue/90 text-white shadow-lg"
                >
                    <FaFacebook className="w-[23px] h-[23px] mr-[15px]" />
                    <span className={`${roboto.className} font-medium text-xl`}>SignIn with Facebook</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        localStorage.setItem("isAuth", "true")
                        router.push("/")
                    }}
                    className="w-[345px] flex items-center justify-center h-[54px] font-medium bg-transparent rounded-[10px] hover:bg-gray-100 shadow-sm border border-gray-200"
                >
                    <FcGoogle className="w-[24px] h-[24px] mr-[15px]" />
                    <p className={`${roboto.className} font-medium text-xl text-gray-500`}>Sign In with Google</p>
                </button>
            </div>

            {/* Sign Up Link */}
            <p className="text-center text-sm text-muted-foreground mt-[68px]">
                Don't have an account?{" "}
                <Link href="/auth/signup" className="text-blue hover:underline">
                    Sign up now
                </Link>
            </p>
        </div>
    )
}