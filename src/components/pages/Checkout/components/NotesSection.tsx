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
        className="min-h-[120px] rounded-[12px] border border-gray-200 bg-white p-4 pl-[25px] text-sm placeholder:text-gray-400 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/10"
      />
    </section>
  )
}
