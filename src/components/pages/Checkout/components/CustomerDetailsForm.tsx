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
import { useMemo, useState } from "react"

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

const ALLOWED_POLICY_TAGS = new Set([
  "a",
  "b",
  "br",
  "em",
  "font",
  "h1",
  "h2",
  "h3",
  "h4",
  "i",
  "li",
  "ol",
  "p",
  "strong",
  "u",
  "ul",
])

const ALLOWED_POLICY_ATTRIBUTES = new Set(["color", "href", "rel", "target"])

const sanitizePolicyHtml = (value: string) => {
  let sanitized = value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\s*(script|style|iframe|object|embed|svg|math|form)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\/?(script|style|iframe|object|embed|svg|math|form|input|button|textarea|select|meta|link)[^>]*>/gi, "")
    .replace(/\s(on[a-z]+|style|src|srcset)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(href)\s*=\s*(["'])\s*(javascript:|data:)[^"']*\2/gi, "")

  sanitized = sanitized.replace(/<\/?([a-z][a-z0-9-]*)([^>]*)>/gi, (match, tagName: string, rawAttributes: string) => {
    const tag = tagName.toLowerCase()

    if (!ALLOWED_POLICY_TAGS.has(tag)) {
      return ""
    }

    const isClosingTag = match.startsWith("</")
    if (isClosingTag) {
      return `</${tag}>`
    }

    const attributes = Array.from(rawAttributes.matchAll(/\s([a-z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi))
      .map(([, name, doubleQuotedValue, singleQuotedValue, unquotedValue]) => {
        const attributeName = name.toLowerCase()
        const attributeValue = doubleQuotedValue ?? singleQuotedValue ?? unquotedValue ?? ""

        if (!ALLOWED_POLICY_ATTRIBUTES.has(attributeName)) {
          return null
        }

        if (attributeName === "href" && /^(javascript:|data:)/i.test(attributeValue.trim())) {
          return null
        }

        if (attributeName === "color" && !/^#[0-9a-f]{3,8}$/i.test(attributeValue.trim())) {
          return null
        }

        return `${attributeName}="${attributeValue.replace(/"/g, "&quot;")}"`
      })
      .filter(Boolean)
      .join(" ")

    const safeAttributes = attributes ? ` ${attributes}` : ""

    if (tag === "a") {
      const hasTarget = /\starget=/.test(safeAttributes)
      const hasRel = /\srel=/.test(safeAttributes)

      return `<${tag}${safeAttributes}${hasTarget ? "" : ' target="_blank"'}${hasRel ? "" : ' rel="noopener noreferrer"'}>`
    }

    return `<${tag}${safeAttributes}>`
  })

  return sanitized
}

const getPolicyPlainText = (value: string) => value
  .replace(/<[^>]*>/g, " ")
  .replace(/&nbsp;/gi, " ")
  .replace(/&amp;/gi, "&")
  .replace(/&lt;/gi, "<")
  .replace(/&gt;/gi, ">")
  .replace(/&quot;/gi, '"')
  .replace(/&#39;/gi, "'")
  .replace(/\s+/g, " ")
  .trim()

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
  const safePolicyContent = useMemo(() => sanitizePolicyHtml(policyContent), [policyContent])
  const policyPreviewText = useMemo(() => getPolicyPlainText(policyContent), [policyContent])

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
          {privacyPolicyLoading ? t("guestPrivacyPolicyLoading") : policyPreviewText}
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
          {privacyPolicyLoading ? (
            <p className="text-sm leading-7 text-gray-700">
              {t("guestPrivacyPolicyLoading")}
            </p>
          ) : (
            <div
              className="space-y-4 text-sm leading-7 text-gray-700 [&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:text-gray-950 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:leading-tight [&_h2]:text-gray-950 [&_h3]:pt-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-gray-950 [&_h4]:font-semibold [&_h4]:text-gray-950 [&_li]:ml-5 [&_li]:list-disc [&_ol_li]:list-decimal [&_p]:text-gray-700"
              dangerouslySetInnerHTML={{ __html: safePolicyContent }}
            />
          )}
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
