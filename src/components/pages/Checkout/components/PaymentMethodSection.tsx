import { useTranslations } from "next-intl";

interface Props {
  paymentMethod: string;
  setPaymentMethod: (value: string) => void;
  allowCashOnDelivery?: boolean;
}

const PaymentMethodSection = ({
  paymentMethod,
  setPaymentMethod,
  allowCashOnDelivery = true,
}: Props) => {
  const t = useTranslations("checkout");
  const options = [
    { key: "COD", label: t("cashOnDelivery") },
    { key: "PAYPAL", label: t("paypal") },
    { key: "STRIPE", label: t("onlineCard") },
    { key: "WALLET", label: t("wallet") },
  ].filter((option) => allowCashOnDelivery || option.key !== "COD");

  return (
    <section className="space-y-[25px]">
      <h2 className="text-[24px] font-semibold text-gray-900 pt-[8px] border-b-2 border-gray-300">
        {t("selectPaymentMethod")}
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


    </section>
  );
};

export { PaymentMethodSection };
