import Image from 'next/image';
import { Search, ShoppingBag, User } from 'lucide-react';
import Link from 'next/link';

const Navbar = () => {
  return (
      <nav className="flex items-center justify-between px-6 2xl:px-46 py-4">
        <div className="flex items-center gap-2">
          <Link
          href={'/'}
           className="relative w-[190px] h-[36.77px]">
            <Image
              src="/nav-logo.png"
              alt="Logo"
              fill
              className="object-contain" />
          </Link>
        </div>

        <nav className="hidden md:flex text-lg items-center gap-8 font-semibold text-[#424242]">
          <button className="flex items-center gap-2 hover:text-primary transition-colors">
            <Search size={20} className="text-primary" strokeWidth={3} />
            Search Food
          </button>
          <Link href={'/cart'} className="flex items-center text-primary gap-2 hover:text-primary transition-colors">
            <ShoppingBag size={20} strokeWidth={3} />
            Cart
          </Link>
          <Link href={'/auth/login'} className="flex items-center text-primary gap-2 hover:text-primary transition-colors">
            <User size={20} strokeWidth={3} />
            Login
          </Link>
        </nav>
      </nav>
  )
}

export default Navbar