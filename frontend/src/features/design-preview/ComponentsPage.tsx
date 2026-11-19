/**
 * /__design/components — page des composants (sera complétée en phase 4).
 * Mode maquette uniquement.
 */
export function ComponentsPage() {
  return (
    <div className="dp-page">
      <div className="dp-wrap">
        <header className="dp-header">
          <h1>Lumio — Composants</h1>
          <p>
            <a href="/__design">← Retour aux pistes</a>
          </p>
          <span className="dp-banner">Page /__design/components — absente du build de production</span>
        </header>
        <section className="dp-piste">
          <h2>Composants</h2>
          <p className="dp-pitch">
            Cette page affichera chaque composant dans chacun de ses états, pour chaque thème
            (6-8, 9-14, admin). Remplie en phase 4.
          </p>
        </section>
      </div>
    </div>
  );
}
