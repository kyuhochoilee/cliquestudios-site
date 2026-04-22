import AsciiGlimmer from "@/components/AsciiGlimmer";

export default function Home() {
  return (
    <main
      style={{
        position: "relative",
        width: "100%",
        // svh handles mobile Safari's dynamic bottom bar; dvh is the modern fallback
        height: "100svh",
        minHeight: "100dvh",
        overflow: "hidden",
        // Safe-area insets for notch + home indicator
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
        background: "var(--color-bg)",
      }}
    >
      {/* Background: pulsing ASCII glimmer */}
      <AsciiGlimmer />

      {/* Content — centered over the glimmer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          zIndex: 1,
        }}
      >
        <div
          style={{
            maxWidth: "34rem",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem",
            textAlign: "center",
          }}
        >
          {/* Eyebrow — tiny, all-caps */}
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "0.7rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              color: "var(--color-muted)",
              margin: 0,
            }}
          >
            Clique Studios
          </p>

          {/* Mysterious headline — GT Alpina serif, medium weight */}
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
              fontWeight: 400,
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
              color: "var(--color-fg)",
              margin: 0,
              maxWidth: "26rem",
            }}
          >
            a studio for smaller, warmer rooms.
          </h1>

          {/* Subtitle — muted, short */}
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "0.9rem",
              color: "var(--color-muted)",
              lineHeight: 1.5,
              margin: 0,
              maxWidth: "22rem",
            }}
          >
            people-first creative software, built for communities.
            <br />
            san francisco.
          </p>

          {/* Contact — just the email, subtle underline */}
          <a
            href="mailto:hi@cliquestudios.org"
            className="contact-email-link"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "0.85rem",
              color: "var(--color-fg)",
              textDecoration: "underline",
              textUnderlineOffset: "5px",
              textDecorationThickness: "1px",
              letterSpacing: "0.02em",
              marginTop: "0.5rem",
            }}
          >
            hi@cliquestudios.org
          </a>
        </div>
      </div>
    </main>
  );
}
