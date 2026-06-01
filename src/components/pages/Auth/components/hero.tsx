import Image from "next/image"
// @ts-ignore
export function AuthHero() {
  return (
    <div className="hidden lg:flex w-1/2 relative">
      <Image
        src="/auth-hero.jpg"
        alt="Brand hero image"
        fill
        className="object-cover"
        priority
      />
    </div>
  )
}
