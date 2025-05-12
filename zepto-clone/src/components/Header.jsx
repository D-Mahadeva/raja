// src/components/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Phone, HelpCircle } from 'lucide-react';

const Header = () => {
  return (
    <header className="sticky top-0 w-full bg-white border-b z-10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <div className="mr-2 font-bold text-xl text-[#8025fb]">
            zepto
          </div>
        </Link>
        
        {/* Delivery Info */}
        <div className="flex items-center text-xs">
          <div className="flex items-center mr-4">
            <Clock size={14} className="mr-1 text-[#8025fb]" />
            <span>Delivered in 8 minutes</span>
          </div>
          <div className="flex items-center">
            <MapPin size={14} className="mr-1 text-[#8025fb]" />
            <span>Bengaluru, 560001</span>
          </div>
        </div>
        
        {/* Support */}
        <div className="flex items-center space-x-4">
          <a href="tel:18002100000" className="flex items-center text-sm">
            <Phone size={16} className="mr-1 text-[#8025fb]" />
            <span>Support</span>
          </a>
          <a href="#" className="flex items-center text-sm">
            <HelpCircle size={16} className="mr-1 text-[#8025fb]" />
            <span>Help</span>
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;