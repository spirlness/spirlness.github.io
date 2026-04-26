import React from 'react';
import katex from 'katex';

interface MathBlockProps {
  equation: string;
  id?: string;
  label?: string;
}

/**
 * MathBlock component for displaying numbered equations using KaTeX.
 */
export const MathBlock: React.FC<MathBlockProps> = ({ equation, id, label }) => {
  const html = katex.renderToString(equation, {
    displayMode: true,
    throwOnError: false,
  });

  return (
    <div className="my-8 relative group" id={id}>
      <div 
        dangerouslySetInnerHTML={{ __html: html }} 
        className="overflow-x-auto overflow-y-hidden py-2"
      />
      {label && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 text-sm text-gray-400 bg-white/80 px-1">
          ({label})
        </div>
      )}
    </div>
  );
};

export default MathBlock;
