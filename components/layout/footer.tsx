import React from 'react';
import { Twitter, Instagram, Linkedin, Globe } from 'lucide-react';

const Footer = () => {
  const quickLinks = ['Menu', 'Gallery', 'Contact', 'Order Now'];
  const companyLinks = ['About', 'Terms', 'Privacy Policy', 'Refund Policy'];

  return (
    <footer className="bg-[#F9F9F9] pt-16 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand Section */}
          <div className="flex flex-col">
            <h2 className="text-[28px] font-bold text-[#2D2D2D]">FoodLover.club</h2>
            <p className="text-gray-800 text-sm leading-relaxed max-w-[300px] mt-[16px] mb-[24px]">
              A perfect place for perfect food, all kind of parties and any other gathering as well, for our guests to simply unwind and relax in complete serenity.
            </p>
            {/* Social Icons */}
            <div className="flex gap-4">
              {[Globe, Twitter, Instagram, Linkedin].map((Icon, index) => (
                <div 
                  key={index} 
                  className="w-10 h-10 rounded-full bg-[#FDEEE9] flex items-center justify-center cursor-pointer hover:bg-[#F15A2B15] transition-colors"
                >
                  <Icon size={18} className="text-[#F15A2B]" />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-[26px]">Quick Links</h3>
            <ul className="flex flex-col gap-4">
              {quickLinks.map((link) => (
                <li key={link}>
                  <a href="#" className="text-gray-800 text-base hover:text-primary transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-[26px]">Company</h3>
            <ul className="flex flex-col gap-4">
              {companyLinks.map((link) => (
                <li key={link}>
                  <a href="#" className="text-gray-800 text-base hover:text-primary transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-[26px]">Contact</h3>
            <div className="flex flex-col gap-6 text-base">
              <p className="text-gray-800 font-medium">
                Call : <span className="text-gray-800 font-normal">+91 9512212240</span>
              </p>
              <p className="text-gray-800 font-medium">
                Email : <span className="text-gray-800 font-normal">foodloversksb@gmail.com</span>
              </p>
              <p className="text-gray-800 font-medium leading-relaxed">
                Address : <span className="text-gray-800 font-normal">
                  Food Lovers, The Family Garden Restaurant, Kuwarda Chowkdi, Kosamba.
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-8 mt-8">
          <p className="text-center text-gray-800 text-sm md:text-base">
            Copyright © 2021 Food Lovers All Rights Reserved Designed By Ajay Mongia
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;