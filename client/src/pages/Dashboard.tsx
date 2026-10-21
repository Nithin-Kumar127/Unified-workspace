// client/src/pages/Dashboard.tsx
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import api from "../services/api";

interface Project {
  id: number;
  name: string;
  description: string;
  role: string;
  created_at: string;
}

/* ── Helpers ────────────────────────────────────────────────── */
const PROJECT_COLORS = [
  ['#6366f1','#8b5cf6'],['#06b6d4','#0284c7'],['#f59e0b','#d97706'],
  ['#10b981','#059669'],['#ec4899','#db2777'],['#f97316','#ea580c'],
];
const projectColor = (id: number) => PROJECT_COLORS[id % PROJECT_COLORS.length];
const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/* ── Icons ──────────────────────────────────────────────────── */
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const FolderIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
  </svg>
);
const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

export default function Dashboard() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  useEffect(() => {
    if (auth?.user) fetchProjects();
  }, [auth?.user]);

  const fetchProjects = async () => {
    try {
      const response = await api.get("/projects");
      setProjects(response.data);
    } catch (err) {
      console.error("Failed to fetch projects", err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      await api.post("/projects", { name, description });
      setShowModal(false);
      setName("");
      setDescription("");
      fetchProjects();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  if (!auth?.user) return <Navigate to="/login" />;

  const firstName = auth.user.name.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{
      minHeight: 'calc(100vh - 56px)',
      background: '#09090b',
      padding: '40px 48px',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Ambient background */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: '500px', height: '500px', background: 'radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)' }}/>
        <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '500px', height: '500px', background: 'radial-gradient(ellipse, rgba(139,92,246,0.05) 0%, transparent 70%)' }}/>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <p style={{ fontSize: '13px', color: '#52525b', marginBottom: '4px', fontWeight: 500 }}>
              {greeting},
            </p>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fafafa', letterSpacing: '-0.03em', margin: 0 }}>
              {firstName} 👋
            </h1>
            <p style={{ fontSize: '14px', color: '#71717a', marginTop: '6px' }}>
              {projects.length === 0
                ? "You don't have any projects yet. Create one to get started."
                : `You have ${projects.length} project${projects.length !== 1 ? 's' : ''} in your workspace.`}
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
              color: '#fff', border: 'none', borderRadius: '10px',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 2px 16px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
              transition: 'all 200ms',
              fontFamily: "'Inter', sans-serif",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.12)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 16px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.12)'; }}
          >
            <PlusIcon />
            New Project
          </button>
        </div>

        {/* Stats row */}
        {projects.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
            {[
              { label: 'Total Projects', value: projects.length, color: '#6366f1' },
              { label: 'Owner', value: projects.filter(p => p.role === 'owner').length, color: '#10b981' },
              { label: 'Collaborating', value: projects.filter(p => p.role !== 'owner').length, color: '#06b6d4' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                background: 'rgba(24,24,27,0.7)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '12px', padding: '20px 24px',
                backdropFilter: 'blur(12px)',
              }}>
                <p style={{ fontSize: '12px', color: '#71717a', marginBottom: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                <p style={{ fontSize: '28px', fontWeight: 700, color: '#fafafa', letterSpacing: '-0.04em', margin: 0 }}>
                  <span style={{ color }}>{value}</span>
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Section label */}
        {projects.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
              Your Projects
            </h2>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }}/>
          </div>
        )}

        {/* Empty state */}
        {projects.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '80px 24px', gap: '16px', textAlign: 'center',
            background: 'rgba(24,24,27,0.4)', borderRadius: '16px',
            border: '1px dashed rgba(255,255,255,0.08)',
          }}>
            <div style={{ color: '#3f3f46', marginBottom: '8px' }}><FolderIcon /></div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#a1a1aa', margin: 0 }}>No projects yet</h3>
            <p style={{ fontSize: '14px', color: '#52525b', maxWidth: '300px', lineHeight: 1.6 }}>
              Create your first project to start collaborating with your team.
            </p>
            <button
              onClick={() => setShowModal(true)}
              style={{
                marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                color: '#fff', border: 'none', borderRadius: '10px',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                boxShadow: '0 2px 16px rgba(99,102,241,0.35)',
              }}
            >
              <PlusIcon /> Create Project
            </button>
          </div>
        ) : (
          /* Project grid */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {projects.map((project) => {
              const [c1, c2] = projectColor(project.id);
              const isHovered = hoveredId === project.id;
              return (
                <div
                  key={project.id}
                  onClick={() => navigate(`/project/${project.id}`)}
                  onMouseEnter={() => setHoveredId(project.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    background: 'rgba(24,24,27,0.7)',
                    border: isHovered ? `1px solid rgba(99,102,241,0.35)` : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '14px', padding: '24px',
                    cursor: 'pointer',
                    transition: 'all 220ms cubic-bezier(0.22,1,0.36,1)',
                    transform: isHovered ? 'translateY(-3px)' : 'none',
                    boxShadow: isHovered ? '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.2)' : '0 2px 8px rgba(0,0,0,0.2)',
                    backdropFilter: 'blur(12px)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Color strip */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                    background: `linear-gradient(90deg, ${c1}, ${c2})`,
                    opacity: isHovered ? 1 : 0.6,
                    transition: 'opacity 220ms',
                  }}/>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    {/* Avatar */}
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                      background: `linear-gradient(135deg, ${c1}, ${c2})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', fontWeight: 700, color: '#fff',
                      boxShadow: `0 4px 12px ${c1}40`,
                    }}>
                      {initials(project.name)}
                    </div>
                    {/* Role badge */}
                    <span style={{
                      padding: '3px 10px', borderRadius: '999px',
                      fontSize: '11px', fontWeight: 500,
                      background: project.role === 'owner' ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.05)',
                      color: project.role === 'owner' ? '#818cf8' : '#71717a',
                      border: project.role === 'owner' ? '1px solid rgba(99,102,241,0.25)' : '1px solid rgba(255,255,255,0.07)',
                      textTransform: 'capitalize',
                    }}>
                      {project.role}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fafafa', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                    {project.name}
                  </h3>
                  <p style={{
                    fontSize: '13px', color: '#71717a', lineHeight: 1.5, margin: '0 0 16px',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {project.description || "No description provided."}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#52525b' }}>
                      {formatDate(project.created_at)}
                    </span>
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      fontSize: '12px', fontWeight: 500,
                      color: isHovered ? '#818cf8' : '#52525b',
                      transition: 'color 200ms',
                    }}>
                      Open <ArrowRightIcon />
                    </span>
                  </div>
                </div>
              );
            })}

            {/* New project card */}
            <div
              onClick={() => setShowModal(true)}
              style={{
                background: 'rgba(99,102,241,0.04)',
                border: '1px dashed rgba(99,102,241,0.20)',
                borderRadius: '14px', padding: '24px',
                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '10px',
                minHeight: '160px', transition: 'all 200ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(99,102,241,0.08)';
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(99,102,241,0.04)';
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.20)';
              }}
            >
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8',
              }}>
                <PlusIcon />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#818cf8' }}>New Project</span>
            </div>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '440px',
              background: '#18181b',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '18px', padding: '32px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
              animation: 'slideUp 250ms cubic-bezier(0.34,1.56,0.64,1) both',
            }}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fafafa', margin: 0, letterSpacing: '-0.02em' }}>
                  New Project
                </h2>
                <p style={{ fontSize: '13px', color: '#71717a', marginTop: '4px' }}>
                  Set up your workspace project
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#71717a' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fafafa'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#71717a'; }}
              >
                <XIcon />
              </button>
            </div>

            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#a1a1aa', marginBottom: '6px' }}>
                  Project name <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  type="text" placeholder="e.g. Marketing Website Q4"
                  value={name} onChange={(e) => setName(e.target.value)} required
                  style={{
                    width: '100%', padding: '10px 14px',
                    background: '#111113', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px', color: '#fafafa', fontSize: '13px',
                    fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 150ms, box-shadow 150ms',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#a1a1aa', marginBottom: '6px' }}>
                  Description <span style={{ color: '#52525b', fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  placeholder="Briefly describe what this project is about…"
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 14px',
                    background: '#111113', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px', color: '#fafafa', fontSize: '13px',
                    fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box',
                    resize: 'none', transition: 'border-color 150ms, box-shadow 150ms',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)', color: '#f87171', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{
                    flex: 1, padding: '10px', background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
                    color: '#a1a1aa', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif", transition: 'all 150ms',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fafafa'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#a1a1aa'; }}
                >
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  style={{
                    flex: 2, padding: '10px',
                    background: creating ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #7c3aed)',
                    border: 'none', borderRadius: '10px',
                    color: '#fff', fontSize: '13px', fontWeight: 600, cursor: creating ? 'not-allowed' : 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    boxShadow: creating ? 'none' : '0 2px 12px rgba(99,102,241,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'all 200ms',
                  }}
                >
                  {creating ? (
                    <>
                      <svg style={{ animation: 'spin 1s linear infinite' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                      </svg>
                      Creating…
                    </>
                  ) : (
                    <><PlusIcon /> Create Project</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

