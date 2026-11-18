export function ResearchMap() {
  return (
    <figure className="relative overflow-hidden rounded-[1.25rem] bg-[#153635] text-white shadow-[0_24px_60px_-32px_rgba(21,54,53,0.65)]">
      <div className="flex items-center justify-between border-b border-white/15 px-5 py-4 font-sans text-xs text-white/70 sm:px-6">
        <span>Research atlas</span>
        <span>Structure → learning → generalization</span>
      </div>
      <svg
        viewBox="0 0 560 400"
        role="img"
        aria-labelledby="research-map-title research-map-description"
        className="block h-auto w-full"
      >
        <title id="research-map-title">A map connecting symmetry, dynamics and generalization</title>
        <desc id="research-map-description">A conceptual diagram showing symmetric trajectories transformed into a learned representation, then extended beyond observed data.</desc>
        <defs>
          <marker id="map-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#9dbeb4" />
          </marker>
          <pattern id="map-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#c2d6cc" strokeOpacity="0.07" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="560" height="400" fill="url(#map-grid)" />

        <g fontFamily="var(--font-sans)" fontSize="12" fill="#e2ece5">
          <text x="34" y="45">01 / Symmetry</text>
          <text x="222" y="45">02 / Representation</text>
          <text x="422" y="45">03 / Generalization</text>
        </g>

        <g transform="translate(98 178)" fill="none">
          <ellipse rx="62" ry="86" stroke="#8baea3" strokeWidth="1" transform="rotate(38)" />
          <ellipse rx="62" ry="86" stroke="#8baea3" strokeWidth="1" transform="rotate(-38)" />
          <ellipse rx="62" ry="62" stroke="#d38b68" strokeWidth="1.5" strokeDasharray="3 6" />
          <path d="M-52 31C-62-23-13-68 22-50C57-31 67 12 32 44C-3 76-48 52-52 31Z" stroke="#e6b197" strokeWidth="2" />
          <circle r="5" fill="#f0c5ad" />
          <circle cx="22" cy="-50" r="4" fill="#e6b197" />
          <circle cx="32" cy="44" r="4" fill="#e6b197" />
        </g>
        <text x="98" y="290" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="12" fill="#aac5bb">Invariances in physical systems</text>

        <path d="M174 178H210" stroke="#9dbeb4" strokeWidth="1" markerEnd="url(#map-arrow)" />
        <g transform="translate(283 178)">
          <path d="M-31-64L31-64L31-10L-31-10ZM-31 12L31 12L31 66L-31 66Z" fill="#204846" stroke="#547b70" />
          <g stroke="#b4cec0" strokeWidth="1.2">
            <path d="M-31-52L31-26M-31-26L31-52M-31 26L31 53M-31 53L31 26" />
            <path d="M-31-26L-31 26M31-26L31 26" strokeDasharray="3 4" />
          </g>
          <g fill="#e6b197">
            <circle cx="-31" cy="-52" r="4" /><circle cx="31" cy="-52" r="4" />
            <circle cx="-31" cy="-26" r="4" /><circle cx="31" cy="-26" r="4" />
            <circle cx="-31" cy="26" r="4" /><circle cx="31" cy="26" r="4" />
            <circle cx="-31" cy="53" r="4" /><circle cx="31" cy="53" r="4" />
          </g>
        </g>
        <text x="283" y="290" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="12" fill="#aac5bb">Learning with constraints</text>

        <path d="M352 178H386" stroke="#9dbeb4" strokeWidth="1" markerEnd="url(#map-arrow)" />
        <g transform="translate(454 178)" fill="none">
          <path d="M-50 75V-75M-50 75H55" stroke="#70968a" strokeWidth="1" />
          <path d="M-42 44C-21 38-21-3 0-11C21-19 19-47 44-58" stroke="#e6b197" strokeWidth="2" />
          <path d="M5-14C24-21 22-51 49-67" stroke="#e6b197" strokeWidth="2" strokeDasharray="4 5" />
          <path d="M-42 56C-20 47-9 8 8-4C26-18 27-33 44-39" stroke="#88afa0" strokeWidth="1.5" />
          <g fill="#e6b197">
            <circle cx="-42" cy="44" r="3" /><circle cx="-19" cy="17" r="3" />
            <circle cx="0" cy="-11" r="3" />
          </g>
          <circle cx="44" cy="-58" r="4" fill="#153635" stroke="#e6b197" />
        </g>
        <text x="454" y="290" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="12" fill="#aac5bb">Beyond the observed regime</text>

        <path d="M34 332H526" stroke="#52796e" />
        <text x="34" y="360" fontFamily="var(--font-serif)" fontSize="17" fontStyle="italic" fill="#e2ece5">Can the structure of nature teach models how to learn?</text>
      </svg>
      <figcaption className="border-t border-white/15 px-5 py-4 font-sans text-xs leading-relaxed text-white/65 sm:px-6">
        A conceptual map of the research themes explored here.
      </figcaption>
    </figure>
  );
}
