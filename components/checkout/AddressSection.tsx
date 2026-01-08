import { Calendar, MapPin } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function PickupAddressSection() {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3 mb-[53px]">
        <MapPin className="text-primary" size={28} />
        <h2 className="text-[24px] font-semibold text-gray-900">Pickup address</h2>
      </div>

      <Button
        variant="outline"
      >
        <Calendar size={20} className="text-black" />
        Schedule your pickup
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[30px]">
        <Card className="bg-primary border-none rounded-[10px] p-6 text-white cursor-pointer transition-transform hover:scale-[1.02]">
          <div className="flex flex-col gap-4">
            <MapPin size={30} />
            <p className="text-base font-medium leading-relaxed">
              Dno. 12-34-12, XYC Apartments, DOOR Colony, Hyderabad, Telangana
            </p>
          </div>
        </Card>
      </div>
    </section>
  )
}
