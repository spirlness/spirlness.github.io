import React from 'react';
import katex from 'katex';

interface MathBlockProps {
  equation: string;
  id?: string;
  label?: string;
}

/**
 * MathBlock component for displaying numbered equations using KaTeX.
 *
 * Safety: `equation` comes from repo-controlled MDX content, not user input.
 * KaTeX's `throwOnError: false` renders parse errors as inline text rather
 * than throwing, and KaTeX itself escapes all input — it does not produce
 * arbitrary HTML. The `dangerouslySetInnerHTML` usage is therefore scoped
 * to KaTeX's own sanitized output.
 */
export const MathBlock: React.FC<MathBlockProps> = ({ equation, id, label }) => {
  const html = katex.renderToString(equation, {
    displayMode: true,
    throwOnError: false,
    strict: true,
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
