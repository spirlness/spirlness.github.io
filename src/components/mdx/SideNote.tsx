"use client";

import React, { useState } from 'react';

interface SideNoteProps {
  children: React.ReactNode;
  label?: string;
}

export const SideNote: React.FC<SideNoteProps> = ({ children, label = "Note" }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Mobile view: collapsible inline note */}
      <div className="lg:hidden my-4 border-l-4 border-orange-200 bg-orange-50/30 p-4 rounded-r-md">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full text-sm font-medium text-orange-800"
        >
          <span>{label}</span>
          <span className="text-lg leading-none">{isOpen ? '−' : '+'}</span>
        </button>
        {isOpen && (
          <div className="mt-2 text-sm text-gray-700 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
            {children}
          </div>
        )}
      </div>

      {/* Desktop view: side note */}
      <aside className="hidden lg:block absolute left-[calc(100%+2.5rem)] top-0 w-[240px] text-sm text-gray-500 italic border-l-2 border-orange-100 pl-4 leading-relaxed h-full">
        <div className="sticky top-8">
          {children}
        </div>
      </aside>
    </div>
  );
};

export default SideNote;
