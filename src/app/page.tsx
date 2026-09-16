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
        <h1 className="wordmark" data-text="Clique Studios">
          Clique Studios
        </h1>
      </div>

      <Blobs />
    </main>
  );
}
