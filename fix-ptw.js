const fs = require('fs');
const path = 'frontend/src/components/PTW.tsx';
let s = fs.readFileSync(path, 'utf8');

const oldFetch = `  fetchPTW, createPTW, updatePTW, deletePTW, fetchPTWStats, type PTWRecord`;
const newFetch = `  fetchPTW, createPTW, updatePTW, deletePTW, fetchPTWStats, fetchProcessus, type PTWRecord`;
if (!s.includes(oldFetch)) { console.log('oldFetch not found'); process.exit(1); }
s = s.replace(oldFetch, newFetch);

const oldForm = `    responsable: '',
    date_debut: '',
`;
const newForm = `    responsable: '',
    processus: '',
    date_debut: '',
`;
if (!s.includes(oldForm)) { console.log('oldForm not found'); process.exit(1); }
s = s.replace(oldForm, newForm);

const stateInsert = `  useEffect(() => { loadData(); }, []);\n\n  const loadData = async () => {`;
const newStateInsert = `  useEffect(() => { loadData(); }, []);\n\n  const [processusList, setProcessusList] = useState<{ id: number; label: string }[]>([]);\n  const [checkItems, setCheckItems] = useState<{ label: string; ok: boolean }[]>([]);\n  const [checkInput, setCheckInput] = useState('');\n\n  const DEFAULT_CHECKLISTS: Record<string, { label: string; ok: boolean }[]> = {\n    chaud: [\n      { label: 'Zone délimitée et balisée', ok: false },\n      { label: 'Extinction incendio positionnée', ok: false },\n      { label: 'Analyse atmosphérique effectuée', ok: false },\n      { label: 'Consignation équipements vérifiée', ok: false },\n      { label: 'Communication urgence testée', ok: false },\n    ],\n    electr: [\n      { label: 'Consignation LOTO effectuée', ok: false },\n      { label: 'VAT vérification absence tension', ok: false },\n      { label: 'Zone de travail isolée', ok: false },\n      { label: 'Habilitation électrique vérifiée', ok: false },\n    ],\n    confine: [\n      { label: 'Analyse O2 >= 19,5%', ok: false },\n      { label: 'LEL < 10% vérifié', ok: false },\n      { label: 'Surveillant de surface désigné', ok: false },\n      { label: 'Moyen de récupération opérationnel', ok: false },\n    ],\n    hauteur: [\n      { label: \"Point d'ancrage vérifié\", ok: false },\n      { label: 'Harnais antichute porté', ok: false },\n      { label: 'Filet de sécurité installé', ok: false },\n      { label: 'Zone de travail balisée', ok: false },\n    ],\n    general: [\n      { label: 'Zone de travail délimitée', ok: false },\n      { label: 'Consignes de sécurité lues', ok: false },\n      { label: 'EPI vérifiés', ok: false },\n    ],\n  };\n\n  useEffect(() => {\n    if (showForm) {\n      setCheckItems(DEFAULT_CHECKLISTS[form.type_travail] ? JSON.parse(JSON.stringify(DEFAULT_CHECKLISTS[form.type_travail])) : []);\n      setCheckInput('');\n    }\n  }, [showForm, form.type_travail]);\n\n  const loadData = async () => {`;
if (!s.includes(stateInsert)) { console.log('stateInsert not found'); process.exit(1); }
s = s.replace(stateInsert, newStateInsert);

const oldLoad = `    const [ptwsData, statsData] = await Promise.all([fetchPTW(), fetchPTWStats()]);`;
const newLoad = `    const [ptwsData, statsData, processusData] = await Promise.all([fetchPTW(), fetchPTWStats(), fetchProcessus()]);`;
if (!s.includes(oldLoad)) { console.log('oldLoad not found'); process.exit(1); }
s = s.replace(oldLoad, newLoad);

const oldSetStats = `    setStats(statsData);
    setLoading(false);
  };`;
const newSetStats = `    setStats(statsData);
    setProcessusList(processusData);
    setLoading(false);
  };`;
if (!s.includes(oldSetStats)) { console.log('oldSetStats not found'); process.exit(1); }
s = s.replace(oldSetStats, newSetStats);

const oldCreateReset = `      setForm({ type_travail: 'chaud', titre: '', zone: '', description: '', responsable: '', date_debut: '', date_fin: '', urgence: 'norm', risques: '', epi: '' });
      loadData();`;
const newCreateReset = `      setForm({ type_travail: 'chaud', titre: '', zone: '', description: '', responsable: '', processus: '', date_debut: '', date_fin: '', urgence: 'norm', risques: '', epi: '' });
      setCheckItems([]);
      setCheckInput('');
      loadData();`;
if (!s.includes(oldCreateReset)) { console.log('oldCreateReset not found'); process.exit(1); }
s = s.replace(oldCreateReset, newCreateReset);

const oldChecks = `      checks: [],`;
const newChecks = `      checks: checkItems,`;
if (!s.includes(oldChecks)) { console.log('oldChecks not found'); process.exit(1); }
s = s.replace(oldChecks, newChecks);

const oldProcessusField = `              <div className="form-field">
                <label>Date début <span style={{ color: 'var(--danger)' }}>•</span></label>`;
const newProcessusField = `              <div className="form-field">
                <label>Processus</label>
                <select value={form.processus} onChange={e => setForm({ ...form, processus: e.target.value })}>
                  <option value="">-- Sélectionner --</option>
                  {processusList.map(p => <option key={p.id} value={p.label}>{p.label}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Date début <span style={{ color: 'var(--danger)' }}>•</span></label>`;
if (!s.includes(oldProcessusField)) { console.log('oldProcessusField not found'); process.exit(1); }
s = s.replace(oldProcessusField, newProcessusField);

const oldEPIField = `              <div className="form-field">
                <label>Risques (1 par ligne)</label>
                <textarea rows={3} value={form.risques} onChange={e => setForm({ ...form, risques: e.target.value })} />
              </div>`;
const newEPIField = `              <div className="form-field">
                <label>EPI (1 par ligne)</label>
                <textarea rows={3} value={form.epi} onChange={e => setForm({ ...form, epi: e.target.value })} />
              </div>
              <div className="form-field">
                <label>Risques (1 par ligne)</label>
                <textarea rows={3} value={form.risques} onChange={e => setForm({ ...form, risques: e.target.value })} />
              </div>`;
if (!s.includes(oldEPIField)) { console.log('oldEPIField not found'); process.exit(1); }
s = s.replace(oldEPIField, newEPIField);

const oldModal = `<div style={{ background: 'var(--white)', borderRadius: 14, padding: 24, width: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--sh3)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Nouveau permis de travail</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>Remplir tous les champs obligatoires.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>`;

const newModal = `<div style={{ background: 'var(--white)', borderRadius: 14, width: 640, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--sh3)' }}>
            <div style={{ padding: 24, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Nouveau permis de travail</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Remplir tous les champs obligatoires.</div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>`;
if (!s.includes(oldModal)) { console.log('oldModal not found'); process.exit(1); }
s = s.replace(oldModal, newModal);

const oldButtons = `            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setForm({ type_travail: 'chaud', titre: '', zone: '', description: '', responsable: '', date_debut: '', date_fin: '', urgence: 'norm', risques: '', epi: '' }); }}>Annuler</button>
              <button className="btn btn-p btn-sm" onClick={handleCreate}>📤 Soumettre pour approbation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};`;

const newButtons = `          </div>
            <div className=\"form-field form-full\">
                <label>
                  Checklist de vérification avant approbation
                  <span style={{ color: 'var(--danger)' }}>•</span>
                </label>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>
                  Vérifications obligatoires avant activation du permis. Appliquez un modèle par défaut, puis ajustez les items.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--muted)' }}>Modèle par défaut</div>
                    <button type=\"button\" className=\"btn btn-p btn-sm\" onClick={() => { if (DEFAULT_CHECKLISTS[form.type_travail]) setCheckItems(JSON.parse(JSON.stringify(DEFAULT_CHECKLISTS[form.type_travail]))); showToast('success', 'Checklist par défaut appliquée'); }}>📋 Appliquer le modèle</button>
                    <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.5 }}>
                      Applique un modèle standardisé selon le type de travaux sélectionné en haut. Vous pourrez ensuite modifier, ajouter ou supprimer des items dans la zone de droite.
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--muted)' }}>Checklist courante</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input value={checkInput} onChange={e => setCheckInput(e.target.value)} placeholder=\"ex: Zone délimitée et balisée\" onKeyDown={e => { if (e.key === 'Enter') { if (!checkInput.trim()) return; setCheckItems([...checkItems, { label: checkInput.trim(), ok: false }]); setCheckInput(''); }}} />
                      <button type=\"button\" className=\"btn btn-ghost btn-sm\" onClick={() => { if (!checkInput.trim()) return; setCheckItems([...checkItems, { label: checkInput.trim(), ok: false }]); setCheckInput(''); }}>+ Ajouter</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                      {checkItems.map((c, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: c.ok ? 'var(--teal-l)' : 'var(--white)', borderRadius: 7, fontSize: 12, border: \`1px solid \${c.ok ? 'rgba(0,212,170,.3)' : 'var(--border)'}\` }}>
                          <div style={{ width: 16, height: 16, borderRadius: 3, border: \`2px solid \${c.ok ? 'var(--teal)' : 'var(--border)'}\`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, background: c.ok ? 'var(--teal)' : 'transparent', color: c.ok ? '#fff' : 'transparent', cursor: 'pointer', flexShrink: 0 }} onClick={() => setCheckItems(checkItems.map((x, idx) => idx === i ? { ...x, ok: !x.ok } : x))}>{c.ok ? '✓' : ''}</div>
                          <div style={{ flex: 1, textDecoration: c.ok ? 'line-through' : 'none', color: c.ok ? 'var(--muted)' : 'var(--text)' }}>{c.label}</div>
                          <button type=\"button\" className=\"btn btn-ghost btn-sm\" style={{ padding: '2px 8px', fontSize: 10 }} onClick={() => setCheckItems(checkItems.filter((_, idx) => idx !== i))}>✕</button>
                        </div>
                      ))}
                      {checkItems.length === 0 && <div style={{ fontSize: 11, color: 'var(--light)', textAlign: 'center', padding: 10 }}>Aucun item de checklist</div>}
                    </div>
                  </div>
                </div>
              </div>
          </div>
          <div style={{ padding: 24, borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className=\"btn btn-ghost btn-sm\" onClick={() => { setShowForm(false); setForm({ type_travail: 'chaud', titre: '', zone: '', description: '', responsable: '', processus: '', date_debut: '', date_fin: '', urgence: 'norm', risques: '', epi: '' }); setCheckItems([]); setCheckInput(''); }}>Annuler</button>
            <button className=\"btn btn-p btn-sm\" onClick={handleCreate}>📤 Soumettre pour approbation</button>
          </div>
        </div>
      )}
    </div>
  );
};`;
if (!s.includes(oldButtons)) { console.log('oldButtons not found'); process.exit(1); }
s = s.replace(oldButtons, newButtons);

fs.writeFileSync(path, s);
console.log('Updated PTW.tsx');
