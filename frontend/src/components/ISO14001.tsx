import React, { useEffect, useRef } from 'react';

const ISO14001Page: React.FC = () => {
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
      <div className="topbar">
        <a className="logo" href="#">
          <div className="logo-ic">🌱</div>
          <div className="logo-tx">GED Qualité · ENSP</div>
        </a>
        <span className="topbar-sep">/</span>
        <span className="topbar-page"><strong>Conformité ISO 14001:2015</strong></span>
      </div>

      <nav className="anchor-nav" ref={anchorNavRef}>
        <a className="anchor-link active" href="#maitrise"><span className="al-dot" style={{ background: '#00A878' }}></span>Maîtrise environnementale</a>
        <a className="anchor-link" href="#aspects"><span className="al-dot" style={{ background: '#D97706' }}></span>§6.1.2 — Aspects environnementaux</a>
        <a className="anchor-link" href="#conformite"><span className="al-dot" style={{ background: '#00A878' }}></span>§6.1.3 — Conformité légale</a>
        <a className="anchor-link" href="#objectifs"><span className="al-dot" style={{ background: '#7C3AED' }}></span>§6.2 — Objectifs environnementaux</a>
        <a className="anchor-link" href="#surveillance"><span className="al-dot" style={{ background: '#DC2626' }}></span>§9.1 — Surveillance environnementale</a>
      </nav>

      <div className="hero">
        <div className="hero-watermark">ISO</div>
        <div className="hero-inner">
          <div className="hero-eyebrow">
            <span>🌱</span> Documentation officielle · ENSP · Version 1.0
          </div>
          <h1 className="hero-title">
            Conformité à la norme<br />
            <em>ISO 14001:2015</em>
          </h1>
          <p className="hero-desc">
            Système de management environnemental de l'ENSP. Correspondance entre les exigences de la norme ISO 14001:2015 et son implémentation dans le GED.
          </p>
          <div className="hero-metrics">
            <div className="hero-metric">
              <div className="hm-val green">95%</div>
              <div className="hm-lbl">Conformité §7.5<br />Documents environnementaux</div>
            </div>
            <div className="hero-metric">
              <div className="hm-val amber">12</div>
              <div className="hm-lbl">Articles ISO couverts<br />dans l'application</div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-body" ref={sectionsRef}>
        <section className="conformite-section reveal" data-section-id="maitrise" id="maitrise">
          <div className="theme-header">
            <div className="theme-num">7.5</div>
            <div className="theme-title-block">
              <div className="theme-eyebrow">Exigences normatives · Chapitres §7.5</div>
              <h2 className="theme-title">Maîtrise des documents environnementaux</h2>
              <p className="theme-subtitle">La norme exige que l'organisme maîtrise les documents requis par son SMS et les exigences environnementales.</p>
              <div className="iso-refs">
                <span className="iso-ref">ISO 14001:2015 §7.5.1</span>
                <span className="iso-ref">ISO 14001:2015 §7.5.2</span>
                <span className="iso-ref">ISO 14001:2015 §7.5.3</span>
                <span className="badge-conform bc-full">✓ Pleinement conforme</span>
              </div>
            </div>
          </div>

          <div className="compare-grid">
            <div className="norm-col">
              <div className="norm-block">
                <div className="norm-article">ISO 14001:2015 · Article 7.5.1</div>
                <div className="norm-block-title">Généralités</div>
                <div className="norm-quote">
                  Le SMS doit inclure les documents requis par la présente Norme ainsi que ceux que l'organisme juge nécessaires.
                </div>
              </div>
            </div>
            <div className="impl-col">
              <div className="impl-block">
                <div className="impl-header">
                  <div className="impl-icon ii-green">🏷️</div>
                  <div className="impl-header-title">Identification environnementale — codification AUTO.ENV.</div>
                </div>
                <div className="impl-body">
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Documents environnementaux avec préfixe AUTO.ENV.</div></div>
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Révisions avec suivi des échéances environnementales.</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="conformite-section reveal" data-section-id="aspects" id="aspects">
          <div className="theme-header">
            <div className="theme-num">6.1.2</div>
            <div className="theme-title-block">
              <div className="theme-eyebrow">Exigences normatives · §6.1.2</div>
              <h2 className="theme-title">Aspects environnementaux</h2>
              <p className="theme-subtitle">Identification des aspects environnementaux significatifs liés à ses activités, produits et services.</p>
              <div className="iso-refs">
                <span className="iso-ref">ISO 14001:2015 §6.1.2</span>
                <span className="badge-conform bc-partial">◐ Partiellement conforme</span>
              </div>
            </div>
          </div>
          <div className="compare-grid">
            <div className="norm-col">
              <div className="norm-block">
                <div className="norm-article">ISO 14001:2015 · Article 6.1.2</div>
                <div className="norm-block-title">Aspects significatifs</div>
                <div className="norm-quote">
                  L'organisme doit déterminer les aspects environnementaux significatifs ayant un impact ou un risque.
                </div>
              </div>
            </div>
            <div className="impl-col">
              <div className="impl-block">
                <div className="impl-header">
                  <div className="impl-icon ii-amber">📊</div>
                  <div className="impl-header-title">Enregistrement des aspects</div>
                </div>
                <div className="impl-body">
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Tableau d'aspects environnementaux disponible.</div></div>
                  <div className="impl-point"><div className="ip-check"></div><div className="ip-text" style={{ color: 'var(--text-muted)' }}>Analyse quantitative des impacts — à renforcer.</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="conformite-section reveal" data-section-id="conformite" id="conformite">
          <div className="theme-header">
            <div className="theme-num">6.1.3</div>
            <div className="theme-title-block">
              <div className="theme-eyebrow">Exigences normatives · §6.1.3</div>
              <h2 className="theme-title">Conformité légale et autre exigences</h2>
              <p className="theme-subtitle">Identification, accès et conservation des exigences légales applicables.</p>
              <div className="iso-refs">
                <span className="iso-ref">ISO 14001:2015 §6.1.3</span>
                <span className="badge-conform bc-full">✓ Conforme</span>
              </div>
            </div>
          </div>
          <div className="compare-grid">
            <div className="norm-col">
              <div className="norm-block">
                <div className="norm-article">ISO 14001:2015 · Article 6.1.3</div>
                <div className="norm-block-title">Conformité légale</div>
                <div className="norm-quote">
                  L'organisme doit identifier les exigences légales et autres exigences applicables.
                </div>
              </div>
            </div>
            <div className="impl-col">
              <div className="impl-block">
                <div className="impl-header">
                  <div className="impl-icon ii-green">📋</div>
                  <div className="impl-header-title">Registre des exigences légales</div>
                </div>
                <div className="impl-body">
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Registre des normes environnementales (REACH, CLP, etc.).</div></div>
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Alertes de révision légale automatiques.</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="conformite-section reveal" data-section-id="objectifs" id="objectifs">
          <div className="theme-header">
            <div className="theme-num">6.2</div>
            <div className="theme-title-block">
              <div className="theme-eyebrow">Exigences normatives · §6.2</div>
              <h2 className="theme-title">Objectifs environnementaux</h2>
              <p className="theme-subtitle">Établissement, mise en œuvre et suivi des objectifs environnementaux.</p>
              <div className="iso-refs">
                <span className="iso-ref">ISO 14001:2015 §6.2.1</span>
                <span className="iso-ref">ISO 14001:2015 §6.2.2</span>
                <span className="badge-conform bc-partial">◐ Partiellement conforme</span>
              </div>
            </div>
          </div>
          <div className="compare-grid">
            <div className="norm-col">
              <div className="norm-block">
                <div className="norm-article">ISO 14001:2015 · Article 6.2.1</div>
                <div className="norm-block-title">Objectifs environnementaux</div>
                <div className="norm-quote">
                  L'organisme doit établir des objectifs environnementaux adaptés à son SMS.
                </div>
              </div>
            </div>
            <div className="impl-col">
              <div className="impl-block">
                <div className="impl-header">
                  <div className="impl-icon ii-blue">🎯</div>
                  <div className="impl-header-title">Suivi des KPI environnementaux</div>
                </div>
                <div className="impl-body">
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Suivi consommation énergie, déchets, eaux.</div></div>
                  <div className="impl-point"><div className="ip-check"></div><div className="ip-text" style={{ color: 'var(--text-muted)' }}>Tableau de bord environnemental — en développement.</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="page-footer">
        <div className="footer-logo">
          <div className="logo-ic">🌱</div>
          <div className="logo-tx">GED Qualité · ENSP</div>
        </div>
        <div className="footer-info">
          <p>Document reflétant l'état d'implémentation du système environnemental.</p>
        </div>
        <div className="footer-meta">
          <span>ISO 14001:2015</span>
          <span>GED v1.0</span>
          <span>Developed by <strong>9310L - NT</strong></span>
        </div>
      </div>
    </div>
  );
};

export default ISO14001Page;