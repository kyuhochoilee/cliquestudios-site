/**
 * SVG filters for the risograph look. Rendered once, zero-size, kept in the
 * DOM (Safari ignores filters inside display:none).
 *
 * riso-ink:     ink bleed + pinholes on the wordmark.
 * riso-edge:    rough, slightly fat edges on the blob bodies (static seed).
 * riso-edge-sm: the same with a gentler displacement for the small blobs.
 */
export default function RisoDefs() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter
          id="riso-ink"
          x="-6%"
          y="-40%"
          width="112%"
          height="180%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence type="fractalNoise" baseFrequency="0.14" numOctaves="2" seed="3" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="1.8" xChannelSelector="R" yChannelSelector="G" result="ragged" />
          <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" seed="7" result="grain" />
          <feComponentTransfer in="grain" result="coverage">
            <feFuncA type="table" tableValues="0 0 0 1 1 1 1 1 1 1" />
          </feComponentTransfer>
          <feComposite in="ragged" in2="coverage" operator="in" />
        </filter>

        <filter id="riso-edge" x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
          <feMorphology in="SourceGraphic" operator="dilate" radius="0.4" result="fat" />
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" seed="2" result="n" />
          <feDisplacementMap in="fat" in2="n" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>

        <filter id="riso-edge-sm" x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
          <feMorphology in="SourceGraphic" operator="dilate" radius="0.4" result="fat" />
          <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="3" seed="5" result="n" />
          <feDisplacementMap in="fat" in2="n" scale="2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
