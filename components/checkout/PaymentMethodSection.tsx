import { Plus } from 'lucide-react'

const PaymentMethodSection = () => {
    return (
        <section className="space-y-[25px]">
            <h2 className="text-[24px] font-semibold text-gray-900 pt-[8px] border-b-2 border-gray-300">Select Payment Method</h2>

            <div className="space-y-3">
                <div className="flex items-center justify-between p-5 bg-[#F9F9F9] rounded-[12px] border border-gray-100 cursor-pointer">
                    <div className="flex items-center gap-4">
                        <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                            <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                        </div>
                        <span className="text-sm text-gray-800">Credit Cards</span>
                    </div>
                </div>

                <div className="flex items-center justify-between p-5 bg-white rounded-[12px] border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        <span className="text-sm text-gray-800">PayPal</span>
                    </div>
                </div>
            </div>

            <div className="w-[45px] h-[45px] rounded-[12px] bg-[#E8F1FF] border-none text-blue hover:bg-[#D1E3FF] flex items-center justify-center">
                <Plus width={24} height={24} />
            </div>
        </section>
    )
}

export default PaymentMethodSection