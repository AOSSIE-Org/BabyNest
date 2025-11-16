import { Menu, X } from 'lucide-react';
import { useState } from 'react';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed w-full z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-emerald-400">BabyNest</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-300 hover:text-emerald-400 transition-colors">
              Features
            </a>
            <a href="#preview" className="text-gray-300 hover:text-emerald-400 transition-colors">
              Preview
            </a>
            <a href="#download" className="text-gray-300 hover:text-emerald-400 transition-colors">
              Download
            </a>
            <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-full transition-colors">
              Get Started
            </button>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-emerald-400"
              aria-label="Toggle navigation menu"
              aria-expanded={isOpen}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-800">
          <div className="px-4 pt-2 pb-4 space-y-3">
            <a
              href="#features"
              className="block text-gray-300 hover:text-emerald-400 py-2 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Features
            </a>
            <a
              href="#preview"
              className="block text-gray-300 hover:text-emerald-400 py-2 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Preview
            </a>
            <a
              href="#download"
              className="block text-gray-300 hover:text-emerald-400 py-2 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Download
            </a>
            <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-full transition-colors">
              Get Started
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
