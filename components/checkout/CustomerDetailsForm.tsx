import { Input } from '@/components/ui/input'

const CustomerDetailsForm = () => {
    return (
        <section className="space-y-[36px] -mt-[20px]">
            <h2 className="text-[24px] font-semibold text-gray-900 pt-[8px] border-b-2 border-gray-300">Customer Details</h2>
            <div className="space-y-[36px]">
                <div className="space-y-[16px]">
                    <label className="text-lg font-medium text-gray-900">Name</label>
                    <Input
                        placeholder="Jhon Smith"
                        className="h-[55px] rounded-sm text-gray-900 placeholder:text-gray-900 bg-white focus-visible:bg-white border-3 border-gray-300 mt-[16px]"

                    />
                </div>
                <div className="space-y-[16px]">
                    <label className="text-lg font-medium text-gray-900">Contact</label>
                    <Input
                        placeholder="+92 3364 236672"
                        className="h-[55px] rounded-sm text-gray-900 placeholder:text-gray-900 bg-white focus-visible:bg-white border-3 border-gray-300 mt-[16px]"
                    />
                </div>
                <div className="space-y-[16px]">
                    <label className="text-lg font-medium text-gray-900">Email</label>
                    <Input
                        placeholder="Jhonsmith@gmail.com"
                        className="h-[55px] rounded-sm text-gray-700 placeholder:text-gray-900 bg-white focus-visible:bg-white border-3 border-gray-300 mt-[16px]"
                    />
                </div>
            </div>
        </section>
    )
}

export default CustomerDetailsForm