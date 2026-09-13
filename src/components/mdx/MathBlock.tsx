import React from 'react';
import katex from 'katex';
import { assertSafeMathUrls, isTrustedMathUrl } from '@/lib/math-safety';

interface MathBlockProps {
  equation: string;
  id?: string;
  label?: string;
}

/**
 * MathBlock component for displaying numbered equations using KaTeX.
 *
 * Safety: `equation` is fail-closed through `assertSafeMathUrls` (dangerous
 * `\href{}`/`\url{}` schemes throw at build time) and rendered with a
 * least-privilege `trust` callback, so only http(s) links become `<a>`.
 */
export const MathBlock: React.FC<MathBlockProps> = ({ equation, id, label }) => {
  assertSafeMathUrls(equation, "MathBlock equation");
  const html = katex.renderToString(equation, {
    displayMode: true,
    throwOnError: false,
    strict: true,
    trust: isTrustedMathUrl,
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
