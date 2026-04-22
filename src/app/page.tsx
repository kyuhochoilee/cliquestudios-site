import Header from "@/components/Header";
import Footer from "@/components/Footer";

const BUILDS = [
  {
    title: "Personal ops",
    description:
      "Fitness and finance dashboards for people who want their data in one place without handing it to a SaaS.",
  },
  {
    title: "Community infrastructure",
    description:
      "Recurring-contribution pages, alumni networks, and the plumbing tight-knit groups need to keep the lights on.",
  },
  {
    title: "Everyday tools",
    description:
      "Small, sharp utilities — like a walking-path optimizer that accounts for the hills your commute actually has.",
  },
];

export default function Home() {
  return (
    <>
      <Header />

      <main style={{ paddingTop: "56px" }}>
        {/* ── Hero ── */}
        <section
          style={{
            padding: "6rem 1.5rem 5rem",
          }}
        >
          <div style={{ maxWidth: "48rem", margin: "0 auto" }}>
            <p className="subheading" style={{ marginBottom: "1.25rem" }}>
              Clique Studios LLC
            </p>
            <h1
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                fontWeight: 700,
                lineHeight: "var(--leading-tight)",
                letterSpacing: "var(--tracking-tight)",
                color: "var(--color-fg)",
                marginBottom: "1.5rem",
              }}
            >
              An independent studio building tools, dashboards, and community
              infrastructure.
            </h1>
            <p
              style={{
                fontSize: "var(--text-lg)",
                color: "var(--color-muted)",
                lineHeight: "var(--leading-relaxed)",
                maxWidth: "38rem",
              }}
            >
              We design and ship software for personal operations, small
              communities, and the underserved edges of the web. Everything we
              build solves a real problem we were losing sleep over.
            </p>
          </div>
        </section>

        {/* ── What we build ── */}
        <section
          style={{
            backgroundColor: "var(--color-surface)",
            borderTop: "1px solid var(--color-border)",
            borderBottom: "1px solid var(--color-border)",
            padding: "5rem 1.5rem",
          }}
        >
          <div style={{ maxWidth: "48rem", margin: "0 auto" }}>
            <p className="subheading" style={{ marginBottom: "2.5rem" }}>
              What we build
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "2.5rem",
              }}
            >
              {BUILDS.map((item) => (
                <div key={item.title}>
                  <h3
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--text-base)",
                      fontWeight: 600,
                      color: "var(--color-fg)",
                      letterSpacing: "var(--tracking-tight)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "var(--text-sm)",
                      color: "var(--color-muted)",
                      lineHeight: "var(--leading-relaxed)",
                    }}
                  >
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── About ── */}
        <section
          style={{
            padding: "5rem 1.5rem",
          }}
        >
          <div style={{ maxWidth: "48rem", margin: "0 auto" }}>
            <p className="subheading" style={{ marginBottom: "2rem" }}>
              About
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              <p
                style={{
                  fontSize: "var(--text-base)",
                  color: "var(--color-fg)",
                  lineHeight: "var(--leading-relaxed)",
                }}
              >
                Clique Studios LLC is a California limited liability company
                founded by Kyuho Choi Lee. We&rsquo;re based in San Francisco
                and build software we want to use. Occasionally we let other
                people use it too.
              </p>
              <p
                style={{
                  fontSize: "var(--text-base)",
                  color: "var(--color-muted)",
                  lineHeight: "var(--leading-relaxed)",
                }}
              >
                Current focuses: a foot-optimal route tool for dense urban
                commutes, a recurring-contribution platform for alumni of Penn
                Keynotes A Cappella, and a self-hosted life dashboard for
                tracking health and finances without surrendering the data.
              </p>
            </div>
          </div>
        </section>

        {/* ── Contact ── */}
        <section
          style={{
            backgroundColor: "var(--color-surface)",
            borderTop: "1px solid var(--color-border)",
            borderBottom: "1px solid var(--color-border)",
            padding: "5rem 1.5rem",
          }}
        >
          <div style={{ maxWidth: "48rem", margin: "0 auto" }}>
            <p className="subheading" style={{ marginBottom: "1.5rem" }}>
              Contact
            </p>
            <a
              href="mailto:ops@cliquestudios.org"
              className="contact-email-link"
              style={{
                display: "block",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-xl)",
                fontWeight: 600,
                color: "var(--color-fg)",
                textDecoration: "none",
                letterSpacing: "var(--tracking-tight)",
                marginBottom: "0.5rem",
              }}
            >
              ops@cliquestudios.org
            </a>
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-muted)",
              }}
            >
              San Francisco, California
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
