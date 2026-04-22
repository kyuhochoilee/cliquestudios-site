export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--color-border)",
        padding: "2rem 1.5rem",
        marginTop: "auto",
      }}
    >
      <div
        style={{
          maxWidth: "56rem",
          margin: "0 auto",
        }}
      >
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-muted)",
            letterSpacing: "var(--tracking-tight)",
          }}
        >
          &copy; 2026 Clique Studios LLC. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
