import React, { useEffect, useRef } from 'react';

const ISO45001Page: React.FC = () => {
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
          <div className="logo-ic">🛡️</div>
          <div className="logo-tx">GED Qualité · ENSP</div>
        </a>
        <span className="topbar-sep">/</span>
        <span className="topbar-page"><strong>Conformité ISO 45001:2018</strong></span>
      </div>

      <nav className="anchor-nav" ref={anchorNavRef}>
        <a className="anchor-link active" href="#ohs"><span className="al-dot" style={{ background: '#00A878' }}></span>Système OH&S</a>
        <a className="anchor-link" href="#risques"><span className="al-dot" style={{ background: '#D97706' }}></span>§6.1 — Risques & opportunités</a>
        <a className="anchor-link" href="#formation"><span className="al-dot" style={{ background: '#00A878' }}></span>§7.2 — Formation OH&S</a>
        <a className="anchor-link" href="#ohs-aspects"><span className="al-dot" style={{ background: '#7C3AED' }}></span>§6.1.2 — Aspects OH&S</a>
        <a className="anchor-link" href="#ohs-surveillance"><span className="al-dot" style={{ background: '#DC2626' }}></span>§9.1 — Surveillance OH&S</a>
      </nav>

      <div className="hero">
        <div className="hero-watermark">ISO</div>
        <div className="hero-inner">
          <div className="hero-eyebrow">
            <span>🛡️</span> Documentation officielle · ENSP · Version 1.0
          </div>
          <h1 className="hero-title">
            Conformité à la norme<br />
            <em>ISO 45001:2018</em>
          </h1>
          <p className="hero-desc">
            Système de management de la santé et sécurité au travail de l'ENSP. Correspondance entre les exigences de la norme ISO 45001:2018 et son implémentation dans le GED.
          </p>
          <div className="hero-metrics">
            <div className="hero-metric">
              <div className="hm-val green">90%</div>
              <div className="hm-lbl">Conformité §7.5<br />Documents OH&S</div>
            </div>
            <div className="hero-metric">
              <div className="hm-val amber">11</div>
              <div className="hm-lbl">Articles ISO couverts<br />dans l'application</div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-body" ref={sectionsRef}>
        <section className="conformite-section reveal" data-section-id="ohs" id="ohs">
          <div className="theme-header">
            <div className="theme-num">4.1</div>
            <div className="theme-title-block">
              <div className="theme-eyebrow">Exigences normatives · Chapitres §4.1 à §4.4</div>
              <h2 className="theme-title">Système de management OH&S</h2>
              <p className="theme-subtitle">Compréhension du contexte de l'organisation et leadership.</p>
              <div className="iso-refs">
                <span className="iso-ref">ISO 45001:2018 §4.1</span>
                <span className="iso-ref">ISO 45001:2018 §4.2</span>
                <span className="iso-ref">ISO 45001:2018 §4.3</span>
                <span className="iso-ref">ISO 45001:2018 §4.4</span>
                <span className="badge-conform bc-full">✓ Pleinement conforme</span>
              </div>
            </div>
          </div>

          <div className="compare-grid">
            <div className="norm-col">
              <div className="norm-block">
                <div className="norm-article">ISO 45001:2018 · Article 4.4</div>
                <div className="norm-block-title">Planification du SMS</div>
                <div className="norm-quote">
                  L'organisation doit planifier les actions nécessaires à la mise en œuvre de son SMS OH&S.
                </div>
              </div>
            </div>
            <div className="impl-col">
              <div className="impl-block">
                <div className="impl-header">
                  <div className="impl-icon ii-green">🏷️</div>
                  <div className="impl-header-title">Documents OH&S — codification AUTO.OHS.</div>
                </div>
                <div className="impl-body">
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Documents OH&S avec préfixe AUTO.OHS.</div></div>
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Workflow SPV/OH&S avec validation hiérarchique.</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="conformite-section reveal" data-section-id="risques" id="risques">
          <div className="theme-header">
            <div className="theme-num">6.1</div>
            <div className="theme-title-block">
              <div className="theme-eyebrow">Exigences normatives · §6.1</div>
              <h2 className="theme-title">Actions pour traiter les risques et opportunities</h2>
              <p className="theme-subtitle">Planification des actions pour traiter les risques et opportunities OH&S.</p>
              <div className="iso-refs">
                <span className="iso-ref">ISO 45001:2018 §6.1.1</span>
                <span className="iso-ref">ISO 45001:2018 §6.1.2</span>
                <span className="badge-conform bc-partial">◐ Partiellement conforme</span>
              </div>
            </div>
          </div>
          <div className="compare-grid">
            <div className="norm-col">
              <div className="norm-block">
                <div className="norm-article">ISO 45001:2018 · Article 6.1.2</div>
                <div className="norm-block-title">Élimination et réduction des risques</div>
                <div className="norm-quote">
                  L'organisation doit éliminer les hazards ou réduire les OH&S risques aux niveaux les plus bas.
                </div>
              </div>
            </div>
            <div className="impl-col">
              <div className="impl-block">
                <div className="impl-header">
                  <div className="impl-icon ii-amber">📋</div>
                  <div className="impl-header-title">Registre des risques OH&S</div>
                </div>
                <div className="impl-body">
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Matrice des risques professionnels disponible.</div></div>
                  <div className="impl-point"><div className="ip-check"></div><div className="ip-text" style={{ color: 'var(--text-muted)' }}>Analyse quantitative détaillée — à intégrer.</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="conformite-section reveal" data-section-id="formation" id="formation">
          <div className="theme-header">
            <div className="theme-num">7.2</div>
            <div className="theme-title-block">
              <div className="theme-eyebrow">Exigences normatives · §7.2</div>
              <h2 className="theme-title">Formation et compétences</h2>
              <p className="theme-subtitle">Détermination des compétences requises et évaluation des connaissances.</p>
              <div className="iso-refs">
                <span className="iso-ref">ISO 45001:2018 §7.2</span>
                <span className="badge-conform bc-full">✓ Conforme</span>
              </div>
            </div>
          </div>
          <div className="compare-grid">
            <div className="norm-col">
              <div className="norm-block">
                <div className="norm-article">ISO 45001:2018 · Article 7.2</div>
                <div className="norm-block-title">Formation et compétences</div>
                <div className="norm-quote">
                  L'organisation doit s'assurer que les collaborateurs sont formés pertinement aux risques OH&S.
                </div>
              </div>
            </div>
            <div className="impl-col">
              <div className="impl-block">
                <div className="impl-header">
                  <div className="impl-icon ii-green">🎓</div>
                  <div className="impl-header-title">Registre de formation OH&S</div>
                </div>
                <div className="impl-body">
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Formation sécurité liée aux documents.</div></div>
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Planning des formations PPSPP intégré.</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="conformite-section reveal" data-section-id="ohs-aspects" id="ohs-aspects">
          <div className="theme-header">
            <div className="theme-num">6.1.2</div>
            <div className="theme-title-block">
              <div className="theme-eyebrow">Exigences normatives · §6.1.2</div>
              <h2 className="theme-title">Aspects OH&S et risques</h2>
              <p className="theme-subtitle">Identification et évaluation des hazards et OH&S risques.</p>
              <div className="iso-refs">
                <span className="iso-ref">ISO 45001:2018 §6.1.2</span>
                <span className="badge-conform bc-partial">◐ Partiellement conforme</span>
              </div>
            </div>
          </div>
          <div className="compare-grid">
            <div className="norm-col">
              <div className="norm-block">
                <div className="norm-article">ISO 45001:2018 · Article 6.1.2</div>
                <div className="norm-block-title">OH&S risques et opportunités</div>
                <div className="norm-quote">
                  L'organisation doit déterminer les OH&S risques et opportunités existants.
                </div>
              </div>
            </div>
            <div className="impl-col">
              <div className="impl-block">
                <div className="impl-header">
                  <div className="impl-icon ii-amber">📊</div>
                  <div className="impl-header-title">Cartographie des hazards</div>
                </div>
                <div className="impl-body">
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Inventaire des dangers professionnels.</div></div>
                  <div className="impl-point"><div className="ip-check"></div><div className="ip-text" style={{ color: 'var(--text-muted)' }}>Fiches de poste OH&S — en développement.</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="conformite-section reveal" data-section-id="ohs-surveillance" id="ohs-surveillance">
          <div className="theme-header">
            <div className="theme-num">9.1</div>
            <div className="theme-title-block">
              <div className="theme-eyebrow">Exigences normatives · §9.1</div>
              <h2 className="theme-title">Surveillance, mesure, analyse et évaluation</h2>
              <p className="theme-subtitle">Évaluation de la performance OH&S et conformité.</p>
              <div className="iso-refs">
                <span className="iso-ref">ISO 45001:2018 §9.1.1</span>
                <span className="iso-ref">ISO 45001:2018 §9.1.2</span>
                <span className="badge-conform bc-partial">◐ Partiellement conforme</span>
              </div>
            </div>
          </div>
          <div className="compare-grid">
            <div className="norm-col">
              <div className="norm-block">
                <div className="norm-article">ISO 45001:2018 · Article 9.1.1</div>
                <div className="norm-block-title">Évaluation de la performance</div>
                <div className="norm-quote">
                  L'organisation doit évaluer la performance OH&S pour la direction du SMS.
                </div>
              </div>
            </div>
            <div className="impl-col">
              <div className="impl-block">
                <div className="impl-header">
                  <div className="impl-icon ii-blue">📊</div>
                  <div className="impl-header-title">Indicateurs OH&S</div>
                </div>
                <div className="impl-body">
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Traçabilité des fiches d'incident.</div></div>
                  <div className="impl-point"><div className="ip-check"></div><div className="ip-text" style={{ color: 'var(--text-muted)' }}>KPI OH&S automatisés — à implémenter.</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="page-footer">
        <div className="footer-logo">
          <div className="logo-ic">🛡️</div>
          <div className="logo-tx">GED Qualité · ENSP</div>
        </div>
        <div className="footer-info">
          <p>Document reflétant l'état d'implémentation du système OH&S.</p>
        </div>
        <div className="footer-meta">
          <span>ISO 45001:2018</span>
          <span>GED v1.0</span>
          <span>Developed by <strong>9310L - NT</strong></span>
        </div>
      </div>
    </div>
  );
};

export default ISO45001Page;