import { SECTION_TITLE_CLASS } from '@/components/common/common-classes'
import { useTranslations } from "next-intl"

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
}

const CustomerDetailsForm = ({ customer, setCustomer }: Props) => {
  const t = useTranslations("checkout")

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

  <div className="h-[55px] flex items-center px-4 bg-gray-50 border border-gray-200 rounded-md text-gray-900 mt-3">
    {customer.name || "—"}
  </div>
</div>

        {/* Contact */}
     <div className="space-y-[16px]">
  <label className="text-md font-medium text-gray-900">
    {t("contact")}
  </label>

  <div className="h-[55px] flex items-center px-4 bg-gray-50 border border-gray-200 rounded-md text-gray-900 mt-3">
    {customer.phone || "—"}
  </div>
</div>
        {/* Email */}
      <div className="space-y-[16px]">
  <label className="text-md font-medium text-gray-900">
    {t("email")}
  </label>

  <div className="h-[55px] flex items-center px-4 bg-gray-50 border border-gray-200 rounded-md text-gray-700 mt-3">
    {customer.email || "—"}
  </div>
</div>

<p className="text-sm text-gray-500 mt-2">
  {t("customerDetailsAutoFilled")}
</p>
      </div>
    </section>
  )
}

export default CustomerDetailsForm
