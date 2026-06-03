import { Textarea } from '@/components/ui/textarea'
import { useTranslations } from "next-intl"

interface Props {
  note: string
  setNote: (value: string) => void
}

export default function NotesSection({ note, setNote }: Props) {
  const t = useTranslations("checkout")

  return (
    <section className="space-y-[20px] mt-[6px]">
      <h3 className="text-lg font-medium text-gray-900">
        {t("notesTitle")}
      </h3>

      <Textarea
        value={note} //  controlled value
        onChange={(e) => setNote(e.target.value)} //  update parent state
        placeholder={t("notesPlaceholder")}
        className="min-h-[120px] placeholder:text-gray-400 bg-white border-3 border-gray-400 rounded-[12px] pl-[25px] p-4 text-sm"
      />
    </section>
  )
}
