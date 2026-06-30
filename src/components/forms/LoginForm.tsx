"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { FcGoogle } from "react-icons/fc"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { Eye, EyeOff } from "lucide-react"

import { MUTED_TEXT_CLASS } from "@/components/common/common-classes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "../ui/checkbox"
import { useAuthContext } from "@/hooks/useAuth"
import { getAuthErrorMessage } from "@/lib/auth"
import { getStoredGroupOrderCode } from "@/lib/group-order"
import { roboto } from "@/lib/fonts"
import { googleLoginCustomer, guestLoginCustomer, loginCustomer } from "@/services/auth"
import {
  createGuestLoginSchema,
  createLoginSchema,
  type AuthValidationMessages,
  type GuestLoginFormValues,
  type LoginFormValues,
} from "@/validations/auth"

type GoogleCredentialResponse = { credential?: string }

type GoogleAccounts = {
  id?: {
    initialize: (config: {
      client_id: string
      callback: (response: GoogleCredentialResponse) => void
    }) => void
    prompt: () => void
  }
}

type GoogleWindow = Window & { google?: { accounts?: GoogleAccounts } }

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""

const loadGoogleIdentityScript = () =>
  new Promise<void>((resolve, reject) => {
    if ((window as GoogleWindow).google?.accounts?.id) {
      resolve()
      return
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    )

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true })
      existingScript.addEventListener("error", () => reject(new Error("Google login failed to load")), {
        once: true,
      })
      return
    }

    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Google login failed to load"))
    document.head.appendChild(script)
  })

const getGroupOrderCode = () => getStoredGroupOrderCode()

const useAuthValidationMessages = (): AuthValidationMessages => {
  const t = useTranslations("validation")

  return useMemo(
    () => ({
      emailRequired: t("emailRequired"),
      emailInvalid: t("emailInvalid"),
      passwordRequired: t("passwordRequired"),
      restaurantIdRequired: t("restaurantIdRequired"),
      firstNameRequired: t("firstNameRequired"),
      lastNameRequired: t("lastNameRequired"),
      phoneRequired: t("phoneRequired"),
      confirmPasswordRequired: t("confirmPasswordRequired"),
      acceptTermsRequired: t("acceptTermsRequired"),
      passwordsDoNotMatch: t("passwordsDoNotMatch"),
      otpRequired: t("otpRequired"),
      newPasswordRequired: t("newPasswordRequired"),
      restaurantIdMissing: t("restaurantIdMissing"),
    }),
    [t]
  )
}

export function LoginForm() {
  const t = useTranslations("auth")
  const router = useRouter()
  const { login } = useAuthContext()

  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)
  const [isGuestMode, setIsGuestMode] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const validationMessages = useAuthValidationMessages()
  const translatedLoginSchema = useMemo(
    () => createLoginSchema(validationMessages),
    [validationMessages]
  )
  const translatedGuestLoginSchema = useMemo(
    () => createGuestLoginSchema(validationMessages),
    [validationMessages]
  )

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(translatedLoginSchema),
    defaultValues: {
      email: "",
      password: "",
      restaurantId: "",
    },
  })

  const guestForm = useForm<GuestLoginFormValues>({
    resolver: zodResolver(translatedGuestLoginSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      restaurantId: "",
    },
  })

  const redirectAfterLogin = () => {
    const code = getGroupOrderCode()

    setTimeout(() => {
      if (code) {
        router.push("/items")
      } else {
        router.push("/")
      }
    }, 1000)
  }

  // ================= NORMAL LOGIN =================
  const onSubmit = async (values: LoginFormValues) => {
    try {
      setIsLoading(true)

      const data = await loginCustomer(values)

      login(data)

      toast.success(t("loginSuccessful"))
      redirectAfterLogin()
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

      toast.success(t("guestSessionStarted"))
      redirectAfterLogin()
    } catch (error) {
      toast.error(getAuthErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    const restaurantId = loginForm.getValues("restaurantId").trim()

    if (!restaurantId) {
      toast.error(validationMessages.restaurantIdRequired)
      loginForm.setFocus("restaurantId")
      return
    }

    if (!googleClientId) {
      toast.error(t("googleClientMissing"))
      return
    }

    try {
      setIsGoogleSubmitting(true)
      await loadGoogleIdentityScript()
      const googleId = (window as GoogleWindow).google?.accounts?.id

      if (!googleId) {
        throw new Error(t("googleUnavailable"))
      }

      googleId.initialize({
        client_id: googleClientId,
        callback: async (response: GoogleCredentialResponse) => {
          try {
            if (!response.credential) {
              throw new Error(t("googleCredentialMissing"))
            }

            const data = await googleLoginCustomer({
              idToken: response.credential,
              restaurantId,
            })

            login(data)
            toast.success(t("loginSuccessful"))
            redirectAfterLogin()
          } catch (error) {
            toast.error(getAuthErrorMessage(error))
          } finally {
            setIsGoogleSubmitting(false)
          }
        },
      })

      googleId.prompt()
    } catch (error) {
      setIsGoogleSubmitting(false)
      toast.error(error instanceof Error ? error.message : getAuthErrorMessage(error))
    }
  }

  return (
    <div className="w-full lg:mr-[79px]">

      <div className="space-y-1">
        <h1 className="text-headline-sm font-bold font-roboto text-primary">
          {isGuestMode ? t("guestLogin") : t("login")}
        </h1>
        <p className={MUTED_TEXT_CLASS}>
          {isGuestMode
            ? t("continueAsGuest")
            : t("loginDescription")}
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
              placeholder={t("firstName")}
              {...guestForm.register("firstName")}
            />
            <Input
              id="guestLastName"
              placeholder={t("lastName")}
              {...guestForm.register("lastName")}
            />
            <Input
              id="guestPhone"
              placeholder={t("phone")}
              {...guestForm.register("phone")}
            />
            <Input
              id="guestRestaurantId"
              placeholder={t("restaurantId")}
              {...guestForm.register("restaurantId")}
            />

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-[50px] text-lg font-semibold bg-primary text-white"
            >
              {isLoading ? t("starting") : t("signInAsGuest")}
            </Button>
          </>
        ) : (
          <>
            <Input
              id="email"
              type="email"
              placeholder={t("email")}
              {...loginForm.register("email")}
            />
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t("password")}
                className="pr-12"
                {...loginForm.register("password")}
              />
              <button
                type="button"
                aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-500 transition hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
            <Input
              id="restaurantId"
              placeholder={t("restaurantId")}
              {...loginForm.register("restaurantId")}
            />

            <div className="flex items-center justify-between text-sm my-7">
              <label className="flex items-center gap-2 cursor-pointer text-gray-500">
                <Checkbox checked />
                {t("rememberMe")}
              </label>

              <Link
                href="/auth/forgot-password"
                className="text-primary hover:underline"
              >
                {t("forgotPassword")}
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-[50px] text-lg font-semibold bg-primary text-white"
            >
              {isLoading ? t("loggingIn") : t("login")}
            </Button>
          </>
        )}
      </form>

      {/* SOCIAL + GUEST TOGGLE */}
      <div className="space-y-5 flex flex-col items-center">
        <button
          type="button"
          disabled={isLoading || isGoogleSubmitting}
          onClick={handleGoogleLogin}
          className="w-[345px] flex items-center justify-center h-[54px] font-medium bg-transparent rounded-[10px] hover:bg-gray-100 shadow-sm border border-gray-200"
        >
          <FcGoogle className="w-[24px] h-[24px] mr-[15px]" />
          <span className={`${roboto.className} text-xl text-gray-500`}>
            {isGoogleSubmitting ? t("loggingIn") : t("signInWithGoogle")}
          </span>
        </button>

        {/*  GUEST BUTTON */}
        <button
          type="button"
          onClick={() => setIsGuestMode(true)}
          className="text-primary underline text-sm"
        >
          {t("signInAsGuest")}
        </button>

        {/* BACK TO LOGIN */}
        {isGuestMode && (
          <button
            type="button"
            onClick={() => setIsGuestMode(false)}
            className="text-gray-500 text-sm underline"
          >
            {t("backToLogin")}
          </button>
        )}
      </div>

      {/* SIGNUP */}
      <p className="text-center text-sm text-muted-foreground mt-[40px]">
        {t("dontHaveAccount")}{" "}
        <Link href="/auth/signup" className="text-blue hover:underline">
          {t("signUpNow")}
        </Link>
      </p>
    </div>
  )
}
