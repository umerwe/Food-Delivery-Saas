import { Input } from '@/components/ui/input'

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
  return (
    <section className="space-y-[36px] -mt-[20px]">
      <h2 className="text-[24px] font-semibold text-gray-900 pt-[8px] border-b-2 border-gray-300">
        Customer Details
      </h2>

      <div className="space-y-[36px]">

        {/* Name */}
        <div className="space-y-[16px]">
          <label className="text-lg font-medium text-gray-900">
            Name
          </label>
          <Input
            value={customer.name} // ✅ controlled
            onChange={(e) =>
              setCustomer({ ...customer, name: e.target.value })
            }
            placeholder="Jhon Smith"
            className="h-[55px] rounded-sm text-gray-900 placeholder:text-gray-900 bg-white focus-visible:bg-white border-3 border-gray-300 mt-[16px]"
          />
        </div>

        {/* Contact */}
        <div className="space-y-[16px]">
          <label className="text-lg font-medium text-gray-900">
            Contact
          </label>
          <Input
            value={customer.phone} // ✅ controlled
            onChange={(e) =>
              setCustomer({ ...customer, phone: e.target.value })
            }
            placeholder="+92 3364 236672"
            className="h-[55px] rounded-sm text-gray-900 placeholder:text-gray-900 bg-white focus-visible:bg-white border-3 border-gray-300 mt-[16px]"
          />
        </div>

        {/* Email */}
        <div className="space-y-[16px]">
          <label className="text-lg font-medium text-gray-900">
            Email
          </label>
          <Input
            value={customer.email} // ✅ controlled
            onChange={(e) =>
              setCustomer({ ...customer, email: e.target.value })
            }
            placeholder="Jhonsmith@gmail.com"
            className="h-[55px] rounded-sm text-gray-700 placeholder:text-gray-900 bg-white focus-visible:bg-white border-3 border-gray-300 mt-[16px]"
          />
        </div>

      </div>
    </section>
  )
}

export default CustomerDetailsForm