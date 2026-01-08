import { Textarea } from '@/components/ui/textarea'

export default function NotesSection() {
    return (
        <section className="space-y-[20px] mt-[6px]">
            <h3 className="text-lg font-medium text-gray-900">Any Note for us?</h3>
            <Textarea
                placeholder="Type you note here"
                className="min-h-[120px] placeholder:text-gray-400 bg-white border-3 border-gray-400 rounded-[12px] pl-[25px] p-4 text-sm"
            />
        </section>
    )
}
