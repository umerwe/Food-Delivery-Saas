"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { FaFacebook } from "react-icons/fa"
import { FcGoogle } from "react-icons/fc"
import { toast } from "sonner"

import { MUTED_TEXT_CLASS } from "@/components/common/common-classes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "../ui/checkbox"
import { useAuthContext } from "@/hooks/useAuth"
import { getAuthErrorMessage } from "@/lib/auth"
import { getStoredGroupOrderCode } from "@/lib/group-order"
import { roboto } from "@/lib/fonts"
import { guestLoginCustomer, loginCustomer } from "@/services/auth"
import {
  guestLoginSchema,
  loginSchema,
  type GuestLoginFormValues,
  type LoginFormValues,
} from "@/validations/auth"

export default function LoginForm() {
  const router = useRouter()
  const { login } = useAuthContext()

  const [isLoading, setIsLoading] = useState(false)
  const [isGuestMode, setIsGuestMode] = useState(false)

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      restaurantId: "",
    },
  })

  const guestForm = useForm<GuestLoginFormValues>({
    resolver: zodResolver(guestLoginSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      restaurantId: "",
    },
  })

const getGroupOrderCode = () => getStoredGroupOrderCode();

  // ================= NORMAL LOGIN =================
  const onSubmit = async (values: LoginFormValues) => {
    try {
      setIsLoading(true)

      const data = await loginCustomer(values)

      login(data)

      toast.success("Login successful")
const code = getGroupOrderCode();

setTimeout(() => {
  if (code) {
    router.push("/categories");
  } else {
    router.push("/");
  }
}, 1000);
    } catch (error) {
      toast.error(getAuthErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  // ================= GUEST LOGIN =================
  const onGuestSubmit = async (values: GuestLoginFormValues) => {
    try {
      setIsLoading(true)

      const data = await guestLoginCustomer(values)

      login(data)

      toast.success("Guest session started")

   const code = getGroupOrderCode();

setTimeout(() => {
  if (code) {
    router.push("/categories");
  } else {
    router.push("/");
  }
}, 1000);
    } catch (error) {
      toast.error(getAuthErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full lg:mr-[79px]">

      <div className="space-y-1">
        <h1 className="text-headline-sm font-bold font-roboto text-primary">
          {isGuestMode ? "Guest Login" : "Login"}
        </h1>
        <p className={MUTED_TEXT_CLASS}>
          {isGuestMode
            ? "Continue as guest"
            : "Please, fill in this form to login"}
        </p>
      </div>

      {/* FORM */}
      <form
        onSubmit={isGuestMode ? guestForm.handleSubmit(onGuestSubmit) : loginForm.handleSubmit(onSubmit)}
        className="space-y-[16px] mt-[35px] mb-[19px]"
        noValidate
      >
        {isGuestMode ? (
          <>
            <Input
              id="guestFirstName"
              placeholder="First Name"
              {...guestForm.register("firstName")}
            />
            <Input
              id="guestLastName"
              placeholder="Last Name"
              {...guestForm.register("lastName")}
            />
            <Input
              id="guestPhone"
              placeholder="Phone"
              {...guestForm.register("phone")}
            />
            <Input
              id="guestRestaurantId"
              placeholder="Restaurant Id"
              {...guestForm.register("restaurantId")}
            />

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-[50px] text-lg font-semibold bg-primary text-white"
            >
              {isLoading ? "Starting..." : "Sign in as Guest"}
            </Button>
          </>
        ) : (
          <>
            <Input
              id="email"
              type="email"
              placeholder="Email"
              {...loginForm.register("email")}
            />
            <Input
              id="password"
              type="password"
              placeholder="Password"
              {...loginForm.register("password")}
            />
            <Input
              id="restaurantId"
              placeholder="Restaurant Id"
              {...loginForm.register("restaurantId")}
            />

            <div className="flex items-center justify-between text-sm my-7">
              <label className="flex items-center gap-2 cursor-pointer text-gray-500">
                <Checkbox checked />
                Remember me
              </label>

              <Link
                href="/auth/forgot-password"
                className="text-primary hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-[50px] text-lg font-semibold bg-primary text-white"
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </>
        )}
      </form>

      {/* SOCIAL + GUEST TOGGLE */}
      <div className="space-y-5 flex flex-col items-center">
        <button
          type="button"
          className="w-[345px] flex items-center justify-center h-[54px] bg-blue text-white rounded-[10px]"
        >
          <FaFacebook className="w-[23px] h-[23px] mr-[15px]" />
          <span className={`${roboto.className} text-xl`}>
            Sign In with Facebook
          </span>
        </button>

        <button
          type="button"
        className="w-[345px] flex items-center justify-center h-[54px] font-medium bg-transparent rounded-[10px] hover:bg-gray-100 shadow-sm border border-gray-200"
        >
          <FcGoogle className="w-[24px] h-[24px] mr-[15px]" />
          <span className={`${roboto.className} text-xl text-gray-500`}>
            Sign In with Google
          </span>
        </button>

        {/*  GUEST BUTTON */}
        <button
          type="button"
          onClick={() => setIsGuestMode(true)}
          className="text-primary underline text-sm"
        >
          Sign in as Guest
        </button>

        {/* BACK TO LOGIN */}
        {isGuestMode && (
          <button
            type="button"
            onClick={() => setIsGuestMode(false)}
            className="text-gray-500 text-sm underline"
          >
            Back to Login
          </button>
        )}
      </div>

      {/* SIGNUP */}
      <p className="text-center text-sm text-muted-foreground mt-[40px]">
        Don't have an account?{" "}
        <Link href="/auth/signup" className="text-blue hover:underline">
          Sign up now
        </Link>
      </p>
    </div>
  )
}
