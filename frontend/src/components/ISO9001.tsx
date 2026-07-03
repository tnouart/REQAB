import React, { useEffect, useRef } from 'react';

const ISO9001Page: React.FC = () => {
  const anchorNavRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const anchorNav = anchorNavRef.current;
    const anchorLinks = anchorNav?.querySelectorAll('.anchor-link') || [];
    const sections = sectionsRef.current?.querySelectorAll('[data-section-id]') || [];

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = (entry.target as HTMLElement).dataset.sectionId;
          anchorLinks.forEach(l => {
            const link = l as HTMLElement;
            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { rootMargin: '-52px 0px -60% 0px', threshold: 0 });

    sections.forEach(s => observer.observe(s));

    const handleAnchorClick = (e: Event) => {
      const target = e.currentTarget as HTMLAnchorElement;
      const hash = target.getAttribute('href')?.substring(1);
      if (hash) {
        e.preventDefault();
        const el = document.querySelector(`[data-section-id="${hash}"]`) as HTMLElement;
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          anchorLinks.forEach(l => l.classList.remove('active'));
          target.classList.add('active');
          history.pushState(null, '', `#${hash}`);
        }
      }
    };

    anchorLinks.forEach(link => {
      link.addEventListener('click', handleAnchorClick);
    });

    return () => {
      anchorLinks.forEach(link => {
        link.removeEventListener('click', handleAnchorClick);
      });
    };
  }, []);

  return (
    <div style={{ fontFamily: 'var(--font-ui)', background: 'var(--white)', minHeight: '100vh' }}>
      {/* TOPBAR */}
      <div className="topbar">
        <a className="logo" href="#">
          <div className="logo-ic">📋</div>
          <div className="logo-tx">GED Qualité · ENSP</div>
        </a>
        <span className="topbar-sep">/</span>
        <span className="topbar-page"><strong>Conformité ISO 9001:2015</strong></span>
      </div>

      {/* NAVIGATION ANCRES */}
      <nav className="anchor-nav" ref={anchorNavRef}>
        <a className="anchor-link active" href="#maitrise"><span className="al-dot" style={{ background: '#00A878' }}></span>Maîtrise documentaire</a>
        <a className="anchor-link" href="#cycle-vie"><span className="al-dot" style={{ background: '#D97706' }}></span>§7.5.3 — Cycle de vie</a>
        <a className="anchor-link" href="#diffusion"><span className="al-dot" style={{ background: '#00A878' }}></span>§4.4 — Accès & diffusion</a>
        <a className="anchor-link" href="#tracabilite"><span className="al-dot" style={{ background: '#7C3AED' }}></span>§9.1 — Traçabilité</a>
        <a className="anchor-link" href="#amelioration"><span className="al-dot" style={{ background: '#DC2626' }}></span>§10 — Amélioration</a>
      </nav>

      {/* HERO */}
      <div className="hero">
        <div className="hero-watermark">ISO</div>
        <div className="hero-inner">
          <div className="hero-eyebrow">
            <span>📋</span> Documentation officielle · ENSP · Version 1.0
          </div>
          <h1 className="hero-title">
            Conformité à la norme<br />
            <em>ISO 9001:2015</em>
          </h1>
          <p className="hero-desc">
            Ce document décrit la Gestion Électronique des Documents Qualité de l'ENSP, son architecture fonctionnelle, et la correspondance précise entre chaque exigence de la norme ISO 9001:2015 et son implémentation dans le système.
          </p>
          <div className="hero-metrics">
            <div className="hero-metric">
              <div className="hm-val green">100%</div>
              <div className="hm-lbl">Conformité §7.5<br />Informations documentées</div>
            </div>
            <div className="hero-metric">
              <div className="hm-val green">8</div>
              <div className="hm-lbl">Articles ISO couverts<br />dans l'application</div>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE BODY */}
      <div className="page-body" ref={sectionsRef}>
        {/* MAÎTRISE */}
        <section className="conformite-section reveal" data-section-id="maitrise" id="maitrise">
          <div className="theme-header">
            <div className="theme-num">7.5</div>
            <div className="theme-title-block">
              <div className="theme-eyebrow">Exigences normatives · Chapitres §7.5.1 à §7.5.3</div>
              <h2 className="theme-title">Maîtrise des informations documentées</h2>
              <p className="theme-subtitle">La norme exige que l'organisme maîtrise les informations documentées requises par son système de management de la qualité et par la norme elle-même.</p>
              <div className="iso-refs">
                <span className="iso-ref">ISO 9001:2015 §7.5.1</span>
                <span className="iso-ref">ISO 9001:2015 §7.5.2</span>
                <span className="iso-ref">ISO 9001:2015 §7.5.3</span>
                <span className="badge-conform bc-full">✓ Pleinement conforme</span>
              </div>
            </div>
          </div>

          <div className="compare-grid">
            <div className="norm-col">
              <div className="norm-block" data-article="7.5.1">
                <div className="norm-article">ISO 9001:2015 · Article 7.5.1</div>
                <div className="norm-block-title">Généralités</div>
                <div className="norm-quote">
                  Le système de management de la qualité de l'organisme doit inclure <strong>les informations documentées exigées par la présente Norme internationale</strong> ainsi que celles que l'organisme juge nécessaires à l'efficacité de son SMQ.
                </div>
              </div>
              <div className="norm-block" data-article="7.5.2">
                <div className="norm-article">ISO 9001:2015 · Article 7.5.2</div>
                <div className="norm-block-title">Création et mise à jour</div>
                <div className="norm-quote">
                  Lors de la création et de la mise à jour des informations documentées, l'organisme doit s'assurer de manière appropriée <strong>de l'identification et de la description</strong>, du <strong>format et du support</strong>, et de la <strong>revue et approbation quant à la pertinence et à l'adéquation</strong>.
                </div>
              </div>
            </div>
            <div className="impl-col">
              <div className="impl-block">
                <div className="impl-header">
                  <div className="impl-icon ii-green">🏷️</div>
                  <div className="impl-header-title">Identification normalisée — codification automatique</div>
                </div>
                <div className="impl-body">
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Chaque document reçoit une codification unique générée automatiquement : <em>PRO.QHSE.GEN.001</em></div></div>
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Chaque révision porte un titre, une date de rédaction, d'approbation et d'application.</div></div>
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Fichiers stockés avec un <em>checksum SHA-256</em> garantissant l'intégrité.</div></div>
                </div>
              </div>
              <div className="impl-block">
                <div className="impl-header">
                  <div className="impl-icon ii-blue">🔍</div>
                  <div className="impl-header-title">Revue formelle — workflow d'approbation</div>
                </div>
                <div className="impl-body">
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Workflow ISO : Brouillon → En revue → Approuvé → Applicable.</div></div>
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Commentaire motivé requis à chaque transition.</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CYCLE DE VIE */}
        <section className="conformite-section reveal" data-section-id="cycle-vie" id="cycle-vie">
          <div className="theme-header">
            <div className="theme-num">7.5.3</div>
            <div className="theme-title-block">
              <div className="theme-eyebrow">Exigences normatives · §7.5.3.1 et §7.5.3.2</div>
              <h2 className="theme-title">Cycle de vie et gestion des versions</h2>
              <p className="theme-subtitle">La norme exige que l'organisme s'assure que seules les versions applicables/pertinentes sont disponibles.</p>
              <div className="iso-refs">
                <span className="iso-ref">ISO 9001:2015 §7.5.3.1 a</span>
                <span className="iso-ref">ISO 9001:2015 §7.5.3.1 b</span>
                <span className="iso-ref">ISO 9001:2015 §7.5.3.1 c</span>
                <span className="badge-conform bc-full">✓ Pleinement conforme</span>
              </div>
            </div>
          </div>
          <div className="compare-grid">
            <div className="norm-col">
              <div className="norm-block" data-article="7.5.3">
                <div className="norm-article">ISO 9001:2015 · Article 7.5.3.1</div>
                <div className="norm-block-title">Maîtrise des informations documentées</div>
                <div className="norm-quote">
                  L'organisme doit prendre en compte les activités suivantes : distribution, accès, récupération, utilisation, stockage et protection, maîtrise des modifications (gestion des versions), conservation et élimination.
                </div>
                <div className="norm-exigences">
                  <div className="norm-exigence"><strong>a)</strong> distribution, accès, récupération et utilisation ;</div>
                  <div className="norm-exigence"><strong>b)</strong> stockage et protection ;</div>
                  <div className="norm-exigence"><strong>c)</strong> maîtrise des modifications (gestion des versions) ;</div>
                </div>
              </div>
            </div>
            <div className="impl-col">
              <div className="impl-block">
                <div className="impl-header">
                  <div className="impl-icon ii-amber">📚</div>
                  <div className="impl-header-title">Gestion des versions — pivot revision_document</div>
                </div>
                <div className="impl-body">
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Chaque révision est un snapshot complet et indépendant.</div></div>
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Une contrainte unique garantit qu'une seule révision est APPLICABLE à la fois.</div></div>
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Bascule auto en OBSOLETE via trigger PostgreSQL.</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DIFFUSION */}
        <section className="conformite-section reveal" data-section-id="diffusion" id="diffusion">
          <div className="theme-header">
            <div className="theme-num">4.4</div>
            <div className="theme-title-block">
              <div className="theme-eyebrow">Exigences normatives · §4.4 / §7.5.3.1 a / §6.1</div>
              <h2 className="theme-title">Accès, diffusion et confidentialité</h2>
              <p className="theme-subtitle">La norme exige que les informations documentées soient disponibles là où elles sont nécessaires, avec un contrôle approprié des accès.</p>
              <div className="iso-refs">
                <span className="iso-ref">ISO 9001:2015 §4.4</span>
                <span className="iso-ref">ISO 9001:2015 §6.1</span>
                <span className="iso-ref">ISO 9001:2015 §7.5.3.1 a</span>
                <span className="badge-conform bc-full">✓ Pleinement conforme</span>
              </div>
            </div>
          </div>
          <div className="compare-grid">
            <div className="norm-col">
              <div className="norm-block" data-article="§7.5">
                <div className="norm-article">ISO 9001:2015 · Article 7.5.3.1 a</div>
                <div className="norm-block-title">Distribution et accès</div>
                <div className="norm-quote">
                  L'organisme doit prendre en compte la <strong>distribution, l'accès, la récupération et l'utilisation</strong> des informations documentées.
                </div>
              </div>
            </div>
            <div className="impl-col">
              <div className="impl-block">
                <div className="impl-header">
                  <div className="impl-icon ii-green">🎭</div>
                  <div className="impl-header-title">RBAC — Contrôle d'accès par rôle</div>
                </div>
                <div className="impl-body">
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">4 rôles (Admin, Resp. Qualité, Rédacteur, Lecteur) avec 11 permissions.</div></div>
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">3 niveaux de confidentialité : Public, Interne, Confidentiel.</div></div>
                </div>
              </div>
              <div className="impl-block">
                <div className="impl-header">
                  <div className="impl-icon ii-amber">⏰</div>
                  <div className="impl-header-title">Planification et alertes d'échéance</div>
                </div>
                <div className="impl-body">
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Chaque document dispose d'une date_prochaine_revision.</div></div>
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Le tableau de bord affiche les alertes pour le Responsable Qualité.</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRACABILITE */}
        <section className="conformite-section reveal" data-section-id="tracabilite" id="tracabilite">
          <div className="theme-header">
            <div className="theme-num">9.1</div>
            <div className="theme-title-block">
              <div className="theme-eyebrow">Exigences normatives · §9.1 / §7.1.5 / §8.7</div>
              <h2 className="theme-title">Surveillance et traçabilité</h2>
              <p className="theme-subtitle">La norme exige que l'organisme surveille, mesure, analyse et évalue son système de management.</p>
              <div className="iso-refs">
                <span className="iso-ref">ISO 9001:2015 §9.1.1</span>
                <span className="iso-ref">ISO 9001:2015 §9.1.3</span>
                <span className="badge-conform bc-full">✓ Pleinement conforme</span>
              </div>
            </div>
          </div>
          <div className="compare-grid">
            <div className="norm-col">
              <div className="norm-block" data-article="9.1">
                <div className="norm-article">ISO 9001:2015 · Article 9.1.1</div>
                <div className="norm-block-title">Surveillance et mesure</div>
                <div className="norm-quote">
                  L'organisme doit déterminer ce qu'il est nécessaire de surveiller et mesurer, et conserver des informations documentées comme preuves.
                </div>
              </div>
            </div>
            <div className="impl-col">
              <div className="impl-block">
                <div className="impl-header">
                  <div className="impl-icon ii-green">📜</div>
                  <div className="impl-header-title">Journal d'audit immuable</div>
                </div>
                <div className="impl-body">
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Toute action est enregistrée : création, soumission, approbation.</div></div>
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Horodatage précis, identité de l'acteur, contexte JSON.</div></div>
                </div>
              </div>
              <div className="impl-block">
                <div className="impl-header">
                  <div className="impl-icon ii-blue">📊</div>
                  <div className="impl-header-title">Indicateurs de performance qualité</div>
                </div>
                <div className="impl-body">
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Taux de conformité documentaire calculé en temps réel.</div></div>
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Distribution des révisions par mois.</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AMELIORATION */}
        <section className="conformite-section reveal" data-section-id="amelioration" id="amelioration">
          <div className="theme-header">
            <div className="theme-num">10</div>
            <div className="theme-title-block">
              <div className="theme-eyebrow">Exigences normatives · §10.1 / §10.2 / §10.3</div>
              <h2 className="theme-title">Amélioration continue</h2>
              <p className="theme-subtitle">La norme exige que l'organisme améliore en continu la pertinence et l'efficacité de son SMQ.</p>
              <div className="iso-refs">
                <span className="iso-ref">ISO 9001:2015 §10.1</span>
                <span className="iso-ref">ISO 9001:2015 §10.2</span>
                <span className="iso-ref">ISO 9001:2015 §10.3</span>
                <span className="badge-conform bc-partial">◐ Partiellement conforme</span>
              </div>
            </div>
          </div>
          <div className="compare-grid">
            <div className="norm-col">
              <div className="norm-block" data-article="10.3">
                <div className="norm-article">ISO 9001:2015 · Article 10.3</div>
                <div className="norm-block-title">Amélioration continue</div>
                <div className="norm-quote">
                  L'organisme doit <strong>améliorer en continu la pertinence, l'adéquation et l'efficacité</strong> du système de management de la qualité.
                </div>
              </div>
            </div>
            <div className="impl-col">
              <div className="impl-block">
                <div className="impl-header">
                  <div className="impl-icon ii-green">✅</div>
                  <div className="impl-header-title">Ce qui est implémenté</div>
                </div>
                <div className="impl-body">
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Le motif de révision capture systématiquement le déclencheur de chaque révision.</div></div>
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Le workflow de retour en brouillon formalise les non-conformités.</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TABLEAU DE CORRESPONDANCE */}
        <div className="divider"></div>
        <section className="mapping-section reveal" data-section-id="tableau" id="tableau">
          <h2>Tableau de correspondance ISO 9001:2015 ↔ Application</h2>
          <p className="subtitle">Synthèse de la couverture normative : chaque article, son exigence, les fonctionnalités décrites, et le niveau de conformité atteint.</p>

          <table className="mapping-table">
            <thead>
              <tr>
                <th style={{ width: '100px' }}>Article</th>
                <th>Intitulé normatif</th>
                <th>Fonctionnalités GED</th>
                <th style={{ width: '130px' }}>Conformité</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="art-cell">§7.5.1</td>
                <td><div className="art-title">Infos documentées — Généralités</div></td>
                <td><div className="feature-tags">
                  <span className="ftag">9 types de documents</span>
                  <span className="ftag">19 processus</span>
                </div></td>
                <td><span className="conform-pill cp-full">✓ Conforme</span></td>
              </tr>
              <tr>
                <td className="art-cell">§7.5.2</td>
                <td><div className="art-title">Création et mise à jour</div></td>
                <td><div className="feature-tags">
                  <span className="ftag">Workflow 4 étapes</span>
                  <span className="ftag">Verrou DB transitions</span>
                </div></td>
                <td><span className="conform-pill cp-full">✓ Conforme</span></td>
              </tr>
              <tr>
                <td className="art-cell">§7.5.3</td>
                <td><div className="art-title">Maîtrise des versions</div></td>
                <td><div className="feature-tags">
                  <span className="ftag">Unicité version APPLICABLE</span>
                  <span className="ftag">État à une date</span>
                </div></td>
                <td><span className="conform-pill cp-full">✓ Conforme</span></td>
              </tr>
              <tr>
                <td className="art-cell">§9.1.1</td>
                <td><div className="art-title">Surveillance et mesure</div></td>
                <td><div className="feature-tags">
                  <span className="ftag">Taux de conformité</span>
                  <span className="ftag">Rapports PDF</span>
                </div></td>
                <td><span className="conform-pill cp-full">✓ Conforme</span></td>
              </tr>
              <tr>
                <td className="art-cell">§10.2</td>
                <td><div className="art-title">Non-conformité et action corrective</div></td>
                <td><div className="feature-tags">
                  <span className="ftag">Motif de révision</span>
                  <span className="ftag" style={{ background: '#FEF3C7', color: '#B45309', borderColor: '#FCD34D' }}>🔜 Module NC prévu</span>
                </div></td>
                <td><span className="conform-pill cp-partial">◐ Partiel</span></td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      {/* FOOTER */}
      <div className="page-footer">
        <div className="footer-logo">
          <div className="logo-ic">📋</div>
          <div className="logo-tx">GED Qualité · ENSP</div>
        </div>
        <div className="footer-info">
          <p>Ce document reflète l'état d'implémentation du système au moment de sa consultation.</p>
        </div>
        <div className="footer-meta">
          <span>ISO 9001:2015</span>
          <span>GED v1.0</span>
          <span>Developed by <strong>9310L - NT</strong></span>
        </div>
      </div>
    </div>
  );
};

export default ISO9001Page;