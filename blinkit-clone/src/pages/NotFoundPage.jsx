// blinkit-clone/src/pages/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-[#0C831F] text-6xl font-bold mb-4">404</div>
      <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
      <p className="text-gray-600 max-w-md mb-6">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link 
        to="/"
        className="px-6 py-2.5 bg-[#0C831F] text-white rounded-lg flex items-center hover:bg-[#0A7319] transition-colors"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back to Home
      </Link>
    </div>
  );
};

export default NotFoundPage;