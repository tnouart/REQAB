// src/App.tsx
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DocumentList from './components/DocumentList';
import DocumentView from './components/DocumentView';
import NewDocument from './components/NewDocument';
import Login from './components/Login';
import RevisionDueList from './components/RevisionDueList';
import Workflow from './components/Workflow';
import EditDocument from './components/EditDocument';
import AuditTrail from './components/AuditTrail';
import Reports from './components/Reports';
import References from './components/References';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import ISO9001 from './components/ISO9001';
import ISO14001 from './components/ISO14001';
import ISO45001 from './components/ISO45001';
import Help from './components/Help';
import NonConformities from './components/NonConformities';
import Notifications from './components/Notifications';
import RapportRevueDirection from './components/RapportRevueDirection';
import type { WorkflowDocument, Revision } from './services/api';
import { useUser } from './contexts/UserContext';
import { fetchWorkflowDocuments } from './services/api';
import { useToast } from './contexts/ToastContext';
import PTW from './components/PTW';

type View = 'dashboard' | 'documents' | 'workflow' | 'revisions' | 'audit' | 'rapports' | 'rapport' | 'notifications' | 'utilisateurs' | 'referentiels' | 'new' | 'about' | 'aide' | 'iso14001' | 'iso45001' | 'non-conformites' | 'ptw';

const DEFAULT_VIEW: View = 'dashboard';

const loadInitialView = (): View => {
  try {
    const stored = localStorage.getItem('ged_active_view');
    if (stored && (['dashboard','documents','workflow','revisions','audit','rapports','rapport','notifications','utilisateurs','referentiels','new','about','aide','iso14001','iso45001','non-conformites','ptw'] as View[]).includes(stored as View)) {
      return stored as View;
    }
  } catch {
    // ignore
  }
  return DEFAULT_VIEW;
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(loadInitialView);
  const [selectedDoc, setSelectedDoc] = useState<WorkflowDocument | null>(null);
  const [editingDoc, setEditingDoc] = useState<WorkflowDocument | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, login, hasPermission } = useUser();

  useEffect(() => {
    try {
      localStorage.setItem('ged_active_view', activeView);
    } catch {
      // ignore
    }
    window.scrollTo(0, 0);
    history.pushState(null, '', window.location.pathname);
  }, [activeView]);

  if (!user) {
    return <Login onLogin={login} />;
  }

  return (
    <div className="app app-with-sidebar">
      <Sidebar activeView={activeView} onViewChange={(v) => setActiveView(v as View)} />
      
      <main className="main">
        {activeView === 'documents' && (
          <>
            <div className="topbar">
              <div className="topbar-title">Documents <span>Procédures</span></div>
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Chercher par titre, codification…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
<button className="btn btn-ghost" disabled={!hasPermission('read')}>⬇ Exporter</button>
               <button className="btn btn-primary" onClick={() => setActiveView('new')} disabled={!hasPermission('write')}>+ Nouveau document</button>
            </div>

            <div className="content-area">
              <DocumentList
                key={refreshKey}
                onAdd={() => setActiveView('new')}
                onView={(doc) => { setEditingDoc(null); setSelectedDoc(doc); }}
                onEdit={(doc) => setEditingDoc(doc)}
                searchTerm={searchTerm}
                selectedId={(editingDoc ?? selectedDoc)?.document_id ?? null}
              />
              {editingDoc ? (
                <EditDocument
                  document={editingDoc}
                  onBack={() => setEditingDoc(null)}
                  onSaved={(updated) => {
                    setEditingDoc(null);
                    setSelectedDoc(updated);
                    setRefreshKey((k) => k + 1);
                  }}
                />
              ) : selectedDoc ? (
                <DocumentView
                  document={selectedDoc}
                  onEdit={() => setEditingDoc(selectedDoc)}
                  onBack={() => { setSelectedDoc(null); setEditingDoc(null); }}
                  onDelete={() => { setSelectedDoc(null); setRefreshKey(k => k + 1); }}
                  onRevisionCreated={() => setRefreshKey(k => k + 1)}
                />
              ) : (
                <div className="detail-pane">
                  <div className="empty-state">
                    <div className="empty-state-icon">📄</div>
                    <p className="empty-state-title">Sélectionnez un document</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        
        {activeView === 'new' && (
          <NewDocument onBack={() => setActiveView('documents')} onSuccess={(docId) => { setSelectedDoc(null); setRefreshKey(k => k + 1); if (docId) { /* TODO: select newly created doc */ } }} />
        )}
        
        {activeView === 'dashboard' && <Dashboard />}
        
        {activeView === 'revisions' && (
          <div className="detail-pane">
            <h2>Révisions à planifier</h2>
            <p className="text-secondary">Ces documents nécessitent une révision dans les 30 jours.</p>
            <RevisionDueList onOpenDocument={async (id) => {
              try {
                const docs = await fetchWorkflowDocuments();
                const fullDoc = docs.find((d: any) => d.document_id === id || d.id === id);
                if (fullDoc) {
                  setSelectedDoc(fullDoc);
                  setActiveView('documents');
                }
              } catch (err) {
                console.error(err);
              }
            }} />
          </div>
        )}
        
        {activeView === 'workflow' && (
          <Workflow onEditDocument={async (doc: any) => {
            try {
              const docs = await fetchWorkflowDocuments();
              const fullDoc = docs.find((d: any) => d.document_id === doc.id || d.id === doc.id);
              if (fullDoc) {
                setEditingDoc(fullDoc);
                setActiveView('documents');
              }
            } catch (err) {
              console.error(err);
            }
          }} />
        )}

        {activeView === 'audit' && <AuditTrail />}

        {activeView === 'rapports' && <Reports />}

{activeView === 'referentiels' && <References />}

          {activeView === 'utilisateurs' && <Users />}

         {activeView === 'non-conformites' && <NonConformities />}

         {activeView === 'ptw' && <PTW />}

         {activeView === 'notifications' && <Notifications />}

         {activeView === 'rapport' && <RapportRevueDirection />}

         {activeView === 'about' && <ISO9001 />}

         {activeView === 'aide' && <Help />}

         {activeView === 'iso14001' && <ISO14001 />}

         {activeView === 'iso45001' && <ISO45001 />}

         {/* <footer className="global-footer">
           Developed by <strong>9310L - NT</strong>
         </footer> */}
       </main>
     </div>
   );
 };

 export default App;