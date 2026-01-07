import { Twitter, Instagram, Linkedin, Globe } from 'lucide-react';

const Footer = ({ isHome = false }: { isHome?: boolean }) => {
  const quickLinks = ['Menu', 'Gallery', 'Contact', 'Order Now'];
  const companyLinks = ['About', 'Terms', 'Privacy Policy', 'Refund Policy'];

  // Dynamic color classes based on the theme
  const textColor = isHome ? 'text-gray-800' : 'text-gray-300';
  const headingColor = isHome ? 'text-[#2D2D2D]' : 'text-white';
  const borderColor = isHome ? 'border-gray-200' : 'border-gray-800';

  return (
    <footer className={`${!isHome ? 'bg-[#111116]' : ''} pt-[94.39px] pb-8 px-4 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          {/* Brand Section */}
          <div className="flex flex-col">
            <h2 className={`text-[28px] font-bold ${headingColor}`}>FoodLover.club</h2>
            <p className={`${textColor} text-sm leading-relaxed max-w-[300px] mt-[16px] mb-[24px]`}>
              A perfect place for perfect food, all kind of parties and any other gathering as well, for our guests to simply unwind and relax in complete serenity.
            </p>
            {/* Social Icons */}
            <div className="flex gap-4">
              {[Globe, Twitter, Instagram, Linkedin].map((Icon, index) => (
                <div
                  key={index}
                  className={`w-10 h-10 rounded-full ${isHome ? 'bg-[#FDEEE9]' : 'bg-[#29292D]'} flex items-center justify-center cursor-pointer hover:bg-[#F15A2B15] transition-colors`}
                >
                  <Icon size={18} className={`${isHome ? 'text-primary' : 'text-white'}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className='lg:pl-30'>
            <h3 className={`text-xl font-bold ${headingColor} mb-[26px]`}>Quick Links</h3>
            <ul className="flex flex-col gap-[22px]">
              {quickLinks.map((link) => (
                <li key={link}>
                  <a href="#" className={`${textColor} text-base hover:text-primary transition-colors`}>
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div className='lg:pl-10'>
            <h3 className={`text-xl font-bold ${headingColor} mb-[26px]`}>Company</h3>
            <ul className="flex flex-col gap-[22px]">
              {companyLinks.map((link) => (
                <li key={link}>
                  <a href="#" className={`${textColor} text-base hover:text-primary transition-colors`}>
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className={`text-xl font-bold ${headingColor} mb-[26px]`}>Contact</h3>
            <div className="flex flex-col gap-[22px] text-base">
              <p className={`${headingColor} font-medium`}>
                Call : <span className={`${textColor} font-normal`}>+91 9512212240</span>
              </p>
              <p className={`${headingColor} font-medium`}>
                Email : <span className={`${textColor} font-normal`}>foodloversksb@gmail.com</span>
              </p>
              <p className={`${headingColor} font-medium leading-relaxed`}>
                Address : <span className={`${textColor} font-normal`}>
                  Food Lovers, The Family Garden Restaurant, Kuwarda Chowkdi, Kosamba.
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={`border-t ${borderColor} pt-8 mt-8`}>
          <p className={`text-center ${textColor} text-sm md:text-base`}>
            Copyright © 2021 Food Lovers All Rights Reserved Designed By Ajay Mongia
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;