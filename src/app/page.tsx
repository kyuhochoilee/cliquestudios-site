import Blobs from "@/components/Blobs";

const EMAIL = "hi@cliquestudios.org";

export default function Home() {
  return (
    <main className="page">
      <section className="note" data-keep>
        <span className="tape" aria-hidden="true" />
        <p>
          Clique Studios is a creative software studio in San Francisco. We
          take everyday things and sprinkle in a little bit of joy.
        </p>
        <p>
          Get in touch: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        </p>
      </section>

      <div className="wordmark-print" data-keep>
        <h1 className="wordmark" aria-label="Clique Studios">
          {/* three drums, each landing a hair off: the overlap prints dark, the edges show the inks */}
          <span className="pass pass-y" aria-hidden="true">Clique Studios</span>
          <span className="pass pass-p" aria-hidden="true">Clique Studios</span>
          <span className="pass pass-b" aria-hidden="true">Clique Studios</span>
        </h1>
      </div>

      <Blobs />
    </main>
  );
}
