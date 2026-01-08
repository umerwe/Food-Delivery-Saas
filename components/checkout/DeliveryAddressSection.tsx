import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function DeliveryAddressSection() {
    return (
        <section className="space-y-6">
            <div className="flex items-center gap-3">
                <MapPin className="text-primary" size={28} />
                <h2 className="text-[24px] font-semibold text-gray-900">Delivery address</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-[30px]">
                <Card className="bg-primary border-none rounded-[10px] p-6 text-white cursor-pointer transition-transform hover:scale-[1.02]">
                    <div className="flex flex-col gap-4">
                        <MapPin size={30} />
                        <p className="text-base font-medium leading-relaxed">
                            Dno. 12-34-12, XYC Apartments, DOOR Colony, Hyderabad, Telangana
                        </p>
                    </div>
                </Card>

                <Card className="bg-white border-2 border-dashed border-primary rounded-[10px] p-6 text-gray-700 cursor-pointer transition-all hover:border-primary">
                    <div className="flex flex-col gap-4">
                        <MapPin size={30} className="text-gray-400" />
                        <p className="text-base font-medium leading-relaxed text-gray-700">
                            Dno. 12-34-12, XYC Apartments, DOOR Colony, Hyderabad, Telangana
                        </p>
                    </div>
                </Card>
            </div>
        </section>
    )
}
