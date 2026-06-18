"use client";

import EditorialSection from '@/components/pages/Contact/components/EditorialSection'
import FAQSection from '@/components/pages/Contact/components/FAQSection'
import HelpCenterSection from '@/components/pages/Contact/components/HelpCenterSection'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { queryKeys } from '@/config/query-keys'
import { useAuth } from '@/hooks/useAuth'
import { getApiErrorMessage } from '@/lib/errors'
import { resolveHomeBranchId, resolveHomeRestaurantId } from '@/lib/home'
import { fetchCustomerFaqs, fetchHelpSupportContent, submitContactForm } from '@/services/public-content'
import { createContactMessageSchema, type ContactMessageFormValues } from '@/validations/contact'

const ContactPage = () => {
  const t = useTranslations("contact.form")
  const validationT = useTranslations("validation")
  const { user, restaurantId: authRestaurantId } = useAuth()
  const restaurantId = resolveHomeRestaurantId(user, authRestaurantId)
  const branchId = resolveHomeBranchId(user)
  const [submitting, setSubmitting] = useState(false)
  const helpSupportQuery = useQuery({
    queryKey: queryKeys.home.helpSupport(restaurantId, branchId),
    queryFn: () => fetchHelpSupportContent(restaurantId, branchId),
    enabled: Boolean(restaurantId),
    staleTime: 5 * 60 * 1000,
  })
  const faqsQuery = useQuery({
    queryKey: queryKeys.home.faqs(restaurantId, branchId),
    queryFn: () => fetchCustomerFaqs(restaurantId, branchId),
    enabled: Boolean(restaurantId),
    staleTime: 5 * 60 * 1000,
  })
  const schema = useMemo(
    () =>
      createContactMessageSchema({
        nameRequired: validationT("contactNameRequired"),
        emailRequired: validationT("contactEmailRequired"),
        subjectRequired: validationT("contactSubjectRequired"),
        messageRequired: validationT("contactMessageRequired"),
      }),
    [validationT]
  )
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactMessageFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  })

  const onSubmit = async (values: ContactMessageFormValues) => {
    if (submitting) return

    if (!restaurantId) {
      toast.error(t("missingRestaurant"))
      return
    }

    try {
      setSubmitting(true)
      const response = await submitContactForm(restaurantId, branchId, values)

      if (!response || response.success === false) {
        toast.error(getApiErrorMessage(response))
        return
      }

      toast.success(t("success"))
      reset()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
    <HelpCenterSection supportContent={helpSupportQuery.data} />
    <section className="bg-[#F4F4F4] px-6 md:px-12 lg:px-20 pb-16">
      <div className="max-w-[760px] mx-auto bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900">{t("title")}</h2>
        <p className="mt-2 text-sm text-gray-500">{t("description")}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4">
          <div className="grid md:grid-cols-2 gap-4">
            <FieldError message={errors.name?.message}>
              <input {...register("name")} placeholder={t("name")} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary" />
            </FieldError>
            <FieldError message={errors.email?.message}>
              <input {...register("email")} placeholder={t("email")} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary" />
            </FieldError>
          </div>
          <FieldError message={errors.subject?.message}>
            <input {...register("subject")} placeholder={t("subject")} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary" />
          </FieldError>
          <FieldError message={errors.message?.message}>
            <textarea {...register("message")} placeholder={t("message")} rows={5} className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary" />
          </FieldError>
          <button disabled={submitting} className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
            {submitting ? t("sending") : t("send")}
          </button>
        </form>
      </div>
    </section>
    <FAQSection supportContent={helpSupportQuery.data} faqs={faqsQuery.data?.items} />
    <EditorialSection />
    </>
  )
}

function FieldError({ children, message }: { children: ReactNode; message?: string }) {
  return (
    <label className="block">
      {children}
      {message ? <span className="mt-1 block text-xs text-red-500">{message}</span> : null}
    </label>
  )
}

export { ContactPage }
