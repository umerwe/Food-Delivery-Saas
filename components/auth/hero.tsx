import Image from "next/image";

export function AuthHero() {
  return (
    <div className="hidden lg:block relative w-full h-full">
      <Image
        src="/auth-hero.jpg"
        alt="Brand hero image"
        fill
        // "object-cover" fills the area. 
        // Use "object-contain" if you want to see every single pixel of the image without cropping.
        className="object-cover" 
        priority
      />
    </div>
  )
}
