"use client";

export default function Header() {
  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        borderBottom: "1px solid var(--color-border)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        backgroundColor: "rgba(250, 250, 249, 0.85)",
      }}
    >
      <div
        style={{
          maxWidth: "56rem",
          margin: "0 auto",
          padding: "0 1.5rem",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo mark */}
        <a
          href="/"
          aria-label="Clique Studios"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 32 32"
            aria-hidden="true"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="16" cy="16" r="16" fill="var(--color-fg)" />
            <text
              x="16"
              y="21"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              fontSize="16"
              fontWeight="700"
              fill="var(--color-bg)"
              textAnchor="middle"
            >
              C
            </text>
          </svg>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              color: "var(--color-fg)",
              letterSpacing: "var(--tracking-tight)",
            }}
          >
            Clique Studios
          </span>
        </a>

        {/* Contact link */}
        <a
          href="mailto:ops@cliquestudios.org"
          className="header-contact-link"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-sm)",
            color: "var(--color-muted)",
            textDecoration: "none",
            transition: "color var(--duration-fast) var(--ease-out)",
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = "var(--color-fg)")}
          onMouseOut={(e) => (e.currentTarget.style.color = "var(--color-muted)")}
        >
          Contact
        </a>
      </div>
    </header>
  );
}
