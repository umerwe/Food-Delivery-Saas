import { SECTION_TITLE_CLASS } from '@/components/common/common-classes'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ExternalLink, ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

interface Props {
  customer: {
    name: string
    phone: string
    email: string
  }
  setCustomer: (value: {
    name: string
    phone: string
    email: string
  }) => void
  editable?: boolean
  privacyPolicyAccepted?: boolean
  setPrivacyPolicyAccepted?: (value: boolean) => void
  privacyPolicy?: {
    title: string
    content: string
    policyLink: string
  } | null
  privacyPolicyLoading?: boolean
}

const CustomerDetailsForm = ({
  customer,
  setCustomer,
  editable = false,
  privacyPolicyAccepted = false,
  setPrivacyPolicyAccepted,
  privacyPolicy,
  privacyPolicyLoading = false,
}: Props) => {
  const t = useTranslations("checkout")
  const [isPolicyOpen, setIsPolicyOpen] = useState(false)
  const policyTitle = privacyPolicy?.title || t("privacyPolicyDialogTitle")
  const policyContent = privacyPolicy?.content || t("guestPrivacyPolicyFallback")

  const updateCustomerField = (field: keyof Props["customer"], value: string) => {
    setCustomer({
      ...customer,
      [field]: value,
    })
  }

  return (
    <section className="space-y-[36px] -mt-[20px]">
      <h2 className={`${SECTION_TITLE_CLASS} pt-[8px] border-b-2 border-gray-300`}>
        {t("customerDetails")}
      </h2>

      <div className="space-y-[36px]">

        {/* Name */}
       <div className="space-y-[16px]">
  <label className="text-md font-medium text-gray-900">
    {t("name")}
  </label>

  {editable ? (
    <input
      type="text"
      value={customer.name}
      onChange={(event) => updateCustomerField("name", event.target.value)}
      placeholder={t("namePlaceholder")}
      className="mt-3 flex h-[55px] w-full items-center rounded-md border border-gray-200 bg-white px-4 text-gray-900 outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
    />
  ) : (
    <div className="h-[55px] flex items-center px-4 bg-gray-50 border border-gray-200 rounded-md text-gray-900 mt-3">
      {customer.name || "—"}
    </div>
  )}
</div>

        {/* Contact */}
     <div className="space-y-[16px]">
  <label className="text-md font-medium text-gray-900">
    {t("contact")}
  </label>

  {editable ? (
    <input
      type="tel"
      value={customer.phone}
      onChange={(event) => updateCustomerField("phone", event.target.value)}
      placeholder={t("phonePlaceholder")}
      className="mt-3 flex h-[55px] w-full items-center rounded-md border border-gray-200 bg-white px-4 text-gray-900 outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
    />
  ) : (
    <div className="h-[55px] flex items-center px-4 bg-gray-50 border border-gray-200 rounded-md text-gray-900 mt-3">
      {customer.phone || "—"}
    </div>
  )}
</div>
        {/* Email */}
      <div className="space-y-[16px]">
  <label className="text-md font-medium text-gray-900">
    {t("email")}
  </label>

  {editable ? (
    <input
      type="email"
      value={customer.email}
      onChange={(event) => updateCustomerField("email", event.target.value)}
      placeholder={t("emailPlaceholder")}
      className="mt-3 flex h-[55px] w-full items-center rounded-md border border-gray-200 bg-white px-4 text-gray-900 outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
    />
  ) : (
    <div className="h-[55px] flex items-center px-4 bg-gray-50 border border-gray-200 rounded-md text-gray-700 mt-3">
      {customer.email || "—"}
    </div>
  )}
</div>

<p className="text-sm text-gray-500 mt-2">
  {editable ? t("guestCustomerDetailsRequired") : t("customerDetailsAutoFilled")}
</p>

{editable ? (
  <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-white to-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        checked={privacyPolicyAccepted}
        onChange={(event) => setPrivacyPolicyAccepted?.(event.target.checked)}
        className="mt-1 size-5 rounded border-gray-300 text-primary accent-primary focus:ring-primary/30"
      />
      <div className="min-w-0 flex-1 space-y-3 text-sm text-gray-700">
        <label className="block cursor-pointer font-medium text-gray-950">
          {t("guestPrivacyPolicyConsent")}
        </label>
        <p className="line-clamp-3 leading-6 text-gray-600">
          {privacyPolicyLoading ? t("guestPrivacyPolicyLoading") : policyContent}
        </p>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setIsPolicyOpen(true)}
          className="h-auto rounded-full px-0 py-0 font-semibold text-primary hover:bg-transparent hover:text-primary/85"
        >
          {t("viewPrivacyPolicy")}
          <ExternalLink className="size-4" />
        </Button>
      </div>
    </div>

    <Dialog open={isPolicyOpen} onOpenChange={setIsPolicyOpen}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-hidden rounded-2xl border-0 p-0 shadow-[0_30px_90px_rgba(15,23,42,0.28)] sm:max-w-2xl">
        <DialogHeader className="border-b border-gray-100 bg-gradient-to-br from-primary/10 via-white to-white px-6 py-5 text-left">
          <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </div>
          <DialogTitle className="text-2xl font-semibold leading-tight text-gray-950">
            {policyTitle}
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-gray-600">
            {t("privacyPolicyDialogDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[55dvh] overflow-y-auto px-6 py-5">
          <div className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
            {privacyPolicyLoading ? t("guestPrivacyPolicyLoading") : policyContent}
          </div>
        </div>

        <DialogFooter className="border-t border-gray-100 bg-gray-50/80 px-6 py-4">
          <Button
            type="button"
            onClick={() => {
              setPrivacyPolicyAccepted?.(true)
              setIsPolicyOpen(false)
            }}
            className="h-11 rounded-full px-6 font-semibold"
          >
            {t("acceptPrivacyPolicy")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
) : null}
      </div>
    </section>
  )
}

export { CustomerDetailsForm }
