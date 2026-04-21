import { Plus } from "lucide-react";

interface Props {
  paymentMethod: string;
  setPaymentMethod: (value: string) => void;
}

const PaymentMethodSection = ({
  paymentMethod,
  setPaymentMethod,
}: Props) => {
  const options = [
    { key: "cod", label: "Cash on Delivery" },
    { key: "card", label: "Credit / Debit Card (Stripe)" },
    { key: "wallet", label: "Wallet" },
  ];

  return (
    <section className="space-y-[25px]">
      <h2 className="text-[24px] font-semibold text-gray-900 pt-[8px] border-b-2 border-gray-300">
        Select Payment Method
      </h2>

      <div className="space-y-3">
        {options.map((opt) => (
          <div
            key={opt.key}
            onClick={() => setPaymentMethod(opt.key)}
            className="flex items-center justify-between p-5 bg-[#F9F9F9] rounded-[12px] border border-gray-100 cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  paymentMethod === opt.key
                    ? "border-primary"
                    : "border-gray-300"
                }`}
              >
                {paymentMethod === opt.key && (
                  <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                )}
              </div>

              <span className="text-sm text-gray-800">
                {opt.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* future add method button */}
      <div className="w-[45px] h-[45px] rounded-[12px] bg-[#E8F1FF] flex items-center justify-center">
        <Plus width={24} height={24} />
      </div>
    </section>
  );
};

export default PaymentMethodSection;