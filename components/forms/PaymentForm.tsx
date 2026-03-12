import { Button } from "../ui/button"; // button
import { Checkbox } from "../ui/checkbox"; // checkbox
import { Input } from "../ui/input"; // input

export default function PaymentForm({ type }: { type?: "payment" | "history" }) {
    return (
        <div className={`${type !== "history" && "border border-gray-300 shadow-sm"} rounded-xl px-[24px] py-[40px]`}>
            <div className="space-y-[24px]">
                <div>
                    <label className="block text-lg font-medium mb-[12px]">Card Number</label>
                    <Input
                        placeholder="1234 5678 9101 1121"
                        className="px-4 border-2 border-gray-300 bg-white focus-visible:bg-white"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-lg font-medium mb-[12px]">Expiration Date</label>
                        <Input
                            placeholder="MM/YY"
                            className="px-4 border-2 border-gray-300 bg-white focus-visible:bg-white"
                        />
                    </div>
                    <div>
                        <label className="block text-lg font-medium mb-[12px]">CVV</label>
                        <Input
                            placeholder="123"
                            className="px-4 border-2 border-gray-300 bg-white focus-visible:bg-white"
                        />
                    </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                        className="
                        w-4 h-4
                        shrink-0
                        flex items-center justify-center
                        rounded-[2px]
                        border border-gray-300
                        "
                    />                    <span className="text-gray-400 text-base">Save card details</span>
                </label>
                <p className="text-sm text-gray-400 leading-relaxed mb-[48px]">
                    Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our privacy policy.
                </p>
                <Button
                    variant="primary"
                    className="w-full rounded-lg text-lg">
                    Save Details
                </Button>
            </div>
        </div>
    )
};