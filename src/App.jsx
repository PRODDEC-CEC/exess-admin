import React, { useState, useEffect } from 'react';
import { 
  auth, db 
} from './firebase';
import { supabase } from './supabase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { 
  LogOut, Plus, Edit2, Trash2, Image, Cpu, Loader2, Lock, User, ChevronRight, Settings, UploadCloud, MessageSquare, Save, Mail, Calendar, MapPin
} from 'lucide-react';

const iconList = ['Cpu', 'Radio', 'Wifi', 'Zap', 'Globe', 'Github'];

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Dashboard state
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'projects' | 'team' | 'messages' | 'settings'
  const [events, setEvents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [team, setTeam] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentActiveYear, setCurrentActiveYear] = useState('2025-2026');
  const [dataLoading, setDataLoading] = useState(false);

  // Contact Config State
  const [contactConfig, setContactConfig] = useState({
    email: 'exess@ceconline.edu',
    address: 'Dept. of ECE, College of Engineering Chengannur, Kerala - 689121',
    instagram: 'https://instagram.com/exess.cec',
    linkedin: 'https://linkedin.com/company/exess-cec',
    github: '#'
  });

  // Form Modals
  const [showEventModal, setShowEventModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // File Upload State
  const [uploadProgress, setUploadProgress] = useState(null);

  // Event Form Fields
  const [eventForm, setEventForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    date: '',
    time: '',
    location: '',
    category: 'Workshop',
    status: 'upcoming',
    color: 'bg-primary',
    image: '',
    tags: '',
    highlights: '',
    registrationUrl: ''
  });

  // Project Form Fields
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    tags: '',
    icon: 'Cpu',
    status: 'Ongoing',
    team: '4 Members',
    year: new Date().getFullYear().toString(),
    color: 'from-primary to-secondary',
    image: '',
    details: '',
    githubUrl: '',
    demoUrl: ''
  });

  // Execom / Team Form Fields
  const [teamForm, setTeamForm] = useState({
    name: '',
    role: '',
    image: '',
    linkedin: '',
    order: 0,
    committeeYear: '2025-2026'
  });

  // Year Config management state
  const [newYearTerm, setNewYearTerm] = useState('');

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        fetchDashboardData();
      }
    });
    return unsubscribe;
  }, []);

  // Fetch Firestore Data
  const fetchDashboardData = async () => {
    setDataLoading(true);
    try {
      // Events
      const eventsSnap = await getDocs(collection(db, 'events'));
      const evs = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(evs);

      // Projects
      const projsSnap = await getDocs(collection(db, 'projects'));
      const prjs = projsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(prjs);

      // Execom Config
      try {
        const configSnap = await getDoc(doc(db, 'settings', 'execom_config'));
        if (configSnap.exists()) {
          setCurrentActiveYear(configSnap.data().currentYear || '2025-2026');
        }
      } catch (err) {
        console.warn("No active year setting document found yet:", err);
      }

      // Contact Config
      try {
        const contactSnap = await getDoc(doc(db, 'settings', 'contact_config'));
        if (contactSnap.exists()) {
          setContactConfig(prev => ({ ...prev, ...contactSnap.data() }));
        }
      } catch (err) {
        console.warn("No contact settings found yet.");
      }

      // Team
      const teamSnap = await getDocs(collection(db, 'team'));
      const tm = teamSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      tm.sort((a, b) => (a.order || 0) - (b.order || 0));
      setTeam(tm);

      // Messages
      const msgSnap = await getDocs(collection(db, 'messages'));
      const msgs = msgSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort messages descending by timestamp
      msgs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      setMessages(msgs);
    } catch (err) {
      console.error("Error fetching Firestore collections:", err);
    } finally {
      setDataLoading(false);
    }
  };

  // Sign In Admin
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setAuthError(err.message.includes('auth/invalid-credential') ? 'Invalid email or password.' : err.message);
    }
  };

  // Log Out Admin
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setEvents([]);
      setProjects([]);
      setTeam([]);
      setMessages([]);
    } catch (err) {
      console.error(err);
    }
  };

  // Direct File Uploader to Supabase
  const handleFileDirectUpload = async (file, type) => {
    if (!file) return;

    setUploadProgress(10);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `${type}/${fileName}`;

      // Upload file to the public 'exess-assets' bucket in Supabase
      const { data, error } = await supabase.storage
        .from('exess-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      setUploadProgress(60);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('exess-assets')
        .getPublicUrl(filePath);

      setUploadProgress(100);

      if (type === 'events') {
        setEventForm(prev => ({ ...prev, image: publicUrl }));
      } else if (type === 'projects') {
        setProjectForm(prev => ({ ...prev, image: publicUrl }));
      } else if (type === 'team') {
        setTeamForm(prev => ({ ...prev, image: publicUrl }));
      }
    } catch (err) {
      console.error("Supabase upload error:", err);
      alert("Upload failed: " + err.message);
    } finally {
      setTimeout(() => setUploadProgress(null), 1000);
    }
  };

  // Change Handler wrapper for standard input
  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) handleFileDirectUpload(file, type);
  };

  // Submit Event Form (Add/Update)
  const handleEventSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...eventForm,
        tags: eventForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        highlights: eventForm.highlights.split('\n').map(h => h.trim()).filter(Boolean)
      };

      if (editingItem) {
        await updateDoc(doc(db, 'events', editingItem.id), data);
      } else {
        await addDoc(collection(db, 'events'), data);
      }

      setShowEventModal(false);
      setEditingItem(null);
      resetEventForm();
      fetchDashboardData();
    } catch (err) {
      alert("Error saving event: " + err.message);
    }
  };

  // Submit Project Form (Add/Update)
  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...projectForm,
        tags: projectForm.tags.split(',').map(t => t.trim()).filter(Boolean)
      };

      if (editingItem) {
        await updateDoc(doc(db, 'projects', editingItem.id), data);
      } else {
        await addDoc(collection(db, 'projects'), data);
      }

      setShowProjectModal(false);
      setEditingItem(null);
      resetProjectForm();
      fetchDashboardData();
    } catch (err) {
      alert("Error saving project: " + err.message);
    }
  };

  // Submit Team Form (Add/Update)
  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    try {
      // Calculate initials automatically from name
      const nameParts = teamForm.name.trim().split(' ');
      const initialsVal = nameParts.length > 1 
        ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
        : nameParts[0][0]?.toUpperCase() || 'EX';

      const data = {
        name: teamForm.name,
        role: teamForm.role,
        initials: initialsVal,
        image: teamForm.image,
        order: Number(teamForm.order) || 0,
        committeeYear: teamForm.committeeYear,
        socials: {
          linkedin: teamForm.linkedin || ''
        }
      };

      if (editingItem) {
        await updateDoc(doc(db, 'team', editingItem.id), data);
      } else {
        await addDoc(collection(db, 'team'), data);
      }

      setShowTeamModal(false);
      setEditingItem(null);
      resetTeamForm();
      fetchDashboardData();
    } catch (err) {
      alert("Error saving member: " + err.message);
    }
  };

  // Set current active Execom Year configuration
  const handleSetActiveYear = async (year) => {
    try {
      await setDoc(doc(db, 'settings', 'execom_config'), {
        currentYear: year
      });
      setCurrentActiveYear(year);
      alert(`Current Execom Term successfully updated to: ${year}`);
    } catch (err) {
      alert("Failed to update active term: " + err.message);
    }
  };

  // Save Contact configuration
  const handleSaveContactConfig = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'contact_config'), contactConfig);
      alert("Footer contact details updated successfully!");
    } catch (err) {
      alert("Failed to save settings: " + err.message);
    }
  };

  // Toggle Message read status
  const handleToggleMessageRead = async (msg) => {
    try {
      await updateDoc(doc(db, 'messages', msg.id), {
        read: !msg.read
      });
      fetchDashboardData();
    } catch (err) {
      alert("Failed to update message: " + err.message);
    }
  };

  // Delete Item
  const handleDeleteItem = async (id, collectionName) => {
    if (window.confirm(`Are you sure you want to delete this ${collectionName.slice(0, -1)}?`)) {
      try {
        await deleteDoc(doc(db, collectionName, id));
        fetchDashboardData();
      } catch (err) {
        alert("Delete failed: " + err.message);
      }
    }
  };

  // Open edit event modal
  const startEditEvent = (ev) => {
    setEditingItem(ev);
    setEventForm({
      title: ev.title || '',
      subtitle: ev.subtitle || '',
      description: ev.description || '',
      date: ev.date || '',
      time: ev.time || '',
      location: ev.location || '',
      category: ev.category || 'Workshop',
      status: ev.status || 'upcoming',
      color: ev.color || 'bg-primary',
      image: ev.image || '',
      tags: ev.tags ? ev.tags.join(', ') : '',
      highlights: ev.highlights ? ev.highlights.join('\n') : '',
      registrationUrl: ev.registrationUrl || ''
    });
    setShowEventModal(true);
  };

  // Open edit project modal
  const startEditProject = (proj) => {
    setEditingItem(proj);
    setProjectForm({
      title: proj.title || '',
      description: proj.description || '',
      tags: proj.tags ? proj.tags.join(', ') : '',
      icon: proj.iconName || proj.icon?.name || 'Cpu',
      status: proj.status || 'Ongoing',
      team: proj.team || '4 Members',
      year: proj.year || new Date().getFullYear().toString(),
      color: proj.color || 'from-primary to-secondary',
      image: proj.image || '',
      details: proj.details || '',
      githubUrl: proj.githubUrl || '',
      demoUrl: proj.demoUrl || ''
    });
    setShowProjectModal(true);
  };

  // Open edit team modal
  const startEditTeam = (member) => {
    setEditingItem(member);
    setTeamForm({
      name: member.name || '',
      role: member.role || '',
      image: member.image || '',
      linkedin: member.socials?.linkedin || '',
      order: member.order || 0,
      committeeYear: member.committeeYear || '2025-2026'
    });
    setShowTeamModal(true);
  };

  const resetEventForm = () => {
    setEventForm({
      title: '',
      subtitle: '',
      description: '',
      date: '',
      time: '',
      location: '',
      category: 'Workshop',
      status: 'upcoming',
      color: 'bg-primary',
      image: '',
      tags: '',
      highlights: '',
      registrationUrl: ''
    });
  };

  const resetProjectForm = () => {
    setProjectForm({
      title: '',
      description: '',
      tags: '',
      icon: 'Cpu',
      status: 'Ongoing',
      team: '4 Members',
      year: new Date().getFullYear().toString(),
      color: 'from-primary to-secondary',
      image: '',
      details: '',
      githubUrl: '',
      demoUrl: ''
    });
  };

  const resetTeamForm = () => {
    setTeamForm({
      name: '',
      role: '',
      image: '',
      linkedin: '',
      order: 0,
      committeeYear: '2025-2026'
    });
  };

  // Collect all unique years in the database to show in settings options
  const uniqueTeamYears = [...new Set(team.map(m => m.committeeYear).filter(Boolean))];
  if (!uniqueTeamYears.includes('2025-2026')) {
    uniqueTeamYears.push('2025-2026');
  }
  uniqueTeamYears.sort().reverse();

  const unreadCount = messages.filter(m => !m.read).length;

  if (authLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b0f19' }}>
        <Loader2 className="animate-spin" size={48} style={{ color: '#06b6d4' }} />
      </div>
    );
  }

  // ----------------- LOGIN VIEW -----------------
  if (!user) {
    return (
      <div className="admin-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', minHeight: '100vh' }}>
        <div className="glow-blob" style={{ top: '20%', left: '20%' }}></div>
        <div className="glow-blob" style={{ bottom: '20%', right: '20%', background: 'radial-gradient(circle, rgba(6,182,212,0.3) 0%, rgba(30,107,147,0.05) 70%)' }}></div>
        
        <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', position: 'relative', zIndex: 10 }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div className="logo-container" style={{ justifyContent: 'center', marginBottom: '0.5rem' }}>
              <span>Ex<span className="logo-highlight">ESS</span> Admin</span>
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-secondary)' }}>
              SYSTEM ACCESS GATEWAY
            </p>
          </div>

          {authError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1.5rem', fontSize: '0.8rem', color: 'var(--danger)' }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>ADMIN EMAIL</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  required 
                  placeholder="admin@exess-cec.org" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label>PASSCODE</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.9rem' }}>
              INITIATE SESSION <ChevronRight size={16} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ----------------- DASHBOARD VIEW -----------------
  return (
    <div className="admin-container">
      <header>
        <div className="logo-container">
          <span style={{ fontWeight: 'bold' }}>Ex<span className="logo-highlight">ESS</span></span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>// ADMIN PANEL</span>
        </div>
        <div className="nav-user">
          <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            Session: <strong style={{ color: 'white' }}>{user.email}</strong>
          </span>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
            <LogOut size={14} /> LOGOUT
          </button>
        </div>
      </header>

      <main style={{ flexGrow: 1, padding: '2rem 3rem', maxWidth: '1400px', width: '100%', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        
        {/* Navigation & Add Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="tabs" style={{ marginBottom: 0, flexWrap: 'wrap' }}>
            <button 
              className={`tab ${activeTab === 'events' ? 'active' : ''}`}
              onClick={() => setActiveTab('events')}
            >
              EVENTS ARCHIVE
            </button>
            <button 
              className={`tab ${activeTab === 'projects' ? 'active' : ''}`}
              onClick={() => setActiveTab('projects')}
            >
              HARDWARE PROJECTS
            </button>
            <button 
              className={`tab ${activeTab === 'team' ? 'active' : ''}`}
              onClick={() => setActiveTab('team')}
            >
              EXECOM DIRECTORY
            </button>
            <button 
              className={`tab ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveTab('messages')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              SIGNAL INCOMING
              {unreadCount > 0 && (
                <span style={{ background: 'var(--accent)', color: 'black', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '9999px', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                  {unreadCount}
                </span>
              )}
            </button>
            <button 
              className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              SYSTEM SETTINGS
            </button>
          </div>

          <div>
            {activeTab === 'events' && (
              <button 
                onClick={() => { setEditingItem(null); resetEventForm(); setShowEventModal(true); }}
                className="btn btn-primary"
              >
                <Plus size={16} /> NEW EVENT LOG
              </button>
            )}
            {activeTab === 'projects' && (
              <button 
                onClick={() => { setEditingItem(null); resetProjectForm(); setShowProjectModal(true); }}
                className="btn btn-primary"
              >
                <Plus size={16} /> NEW PROJECT PROFILE
              </button>
            )}
            {activeTab === 'team' && (
              <button 
                onClick={() => { setEditingItem(null); resetTeamForm(); setShowTeamModal(true); }}
                className="btn btn-primary"
              >
                <Plus size={16} /> NEW MEMBER PROFILE
              </button>
            )}
          </div>
        </div>

        {/* Loading Spinner for data */}
        {dataLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <Loader2 className="animate-spin" size={36} style={{ color: '#06b6d4' }} />
          </div>
        ) : (
          <>
            {/* EVENTS VIEW */}
            {activeTab === 'events' && (
              <div>
                {events.length === 0 ? (
                  <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No events found in Cloud Firestore. Click "NEW EVENT LOG" to add your first event.
                  </div>
                ) : (
                  <div className="item-grid">
                    {events.map((ev) => (
                      <div key={ev.id} className="glass-card dashboard-card">
                        {ev.image && <img src={ev.image} alt="" className="dashboard-card-image" />}
                        <div className="card-content">
                          <span className="card-meta">{ev.category} • {ev.status}</span>
                          <h3 className="card-title">{ev.title}</h3>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                            {ev.date} | {ev.location}
                          </span>
                          <p className="card-desc">{ev.description}</p>
                        </div>
                        <div className="card-actions">
                          <button onClick={() => startEditEvent(ev)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', flexGrow: 1 }}>
                            <Edit2 size={12} /> EDIT
                          </button>
                          <button onClick={() => handleDeleteItem(ev.id, 'events')} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PROJECTS VIEW */}
            {activeTab === 'projects' && (
              <div>
                {projects.length === 0 ? (
                  <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No projects found in Cloud Firestore. Click "NEW PROJECT PROFILE" to add one.
                  </div>
                ) : (
                  <div className="item-grid">
                    {projects.map((proj) => (
                      <div key={proj.id} className="glass-card dashboard-card">
                        {proj.image && <img src={proj.image} alt="" className="dashboard-card-image" />}
                        <div className="card-content">
                          <span className="card-meta">{proj.year} • {proj.status}</span>
                          <h3 className="card-title">{proj.title}</h3>
                          <p className="card-desc">{proj.description}</p>
                        </div>
                        <div className="card-actions">
                          <button onClick={() => startEditProject(proj)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', flexGrow: 1 }}>
                            <Edit2 size={12} /> EDIT
                          </button>
                          <button onClick={() => handleDeleteItem(proj.id, 'projects')} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TEAM/EXECOM VIEW */}
            {activeTab === 'team' && (
              <div>
                {team.length === 0 ? (
                  <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No Execom members found in Cloud Firestore. Click "NEW MEMBER PROFILE" to add one.
                  </div>
                ) : (
                  <div className="item-grid">
                    {team.map((member) => (
                      <div key={member.id} className="glass-card dashboard-card">
                        {member.image && <img src={member.image} alt="" className="dashboard-card-image" />}
                        <div className="card-content">
                          <span className="card-meta">Term: {member.committeeYear} | Order: {member.order}</span>
                          <h3 className="card-title">{member.name}</h3>
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                            {member.role}
                          </span>
                        </div>
                        <div className="card-actions">
                          <button onClick={() => startEditTeam(member)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', flexGrow: 1 }}>
                            <Edit2 size={12} /> EDIT
                          </button>
                          <button onClick={() => handleDeleteItem(member.id, 'team')} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* INCOMING MESSAGES VIEW */}
            {activeTab === 'messages' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {messages.length === 0 ? (
                  <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No messages or signal packets received from the website contact form yet.
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className="glass-card" 
                      style={{ 
                        padding: '1.5rem 2rem', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '1rem', 
                        borderLeft: msg.read ? '2px solid transparent' : '2px solid var(--accent)',
                        background: msg.read ? 'rgba(30,107,147,0.02)' : 'rgba(6,182,212,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <Mail size={16} style={{ color: msg.read ? 'var(--text-muted)' : 'var(--accent)' }} />
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontSize: '0.9rem' }}>{msg.email}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          <span>{msg.timestamp ? new Date(msg.timestamp).toLocaleString() : 'Date Unknown'}</span>
                          <button 
                            onClick={() => handleToggleMessageRead(msg)} 
                            className="btn btn-secondary" 
                            style={{ padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.65rem' }}
                          >
                            {msg.read ? 'MARK UNREAD' : 'MARK READ'}
                          </button>
                          <button 
                            onClick={() => handleDeleteItem(msg.id, 'messages')} 
                            className="btn btn-danger" 
                            style={{ padding: '0.25rem 0.5rem', borderRadius: '4px' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', color: msg.read ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                        {msg.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* SYSTEM CONFIGURATION SETTINGS VIEW */}
            {activeTab === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Active Year Term Controls */}
                <div className="glass-card" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glow)', paddingBottom: '0.75rem' }}>
                    <Calendar size={20} style={{ color: 'var(--accent)' }} />
                    <h3 style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Active Committee Configuration</h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2rem', flexWrap: 'wrap' }}>
                    {/* Select from existing years */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Set Default Term (Currently Active on Site)</label>
                      <select 
                        value={currentActiveYear} 
                        onChange={(e) => handleSetActiveYear(e.target.value)}
                        style={{ minWidth: '200px' }}
                      >
                        {uniqueTeamYears.map(yr => (
                          <option key={yr} value={yr}>{yr} (Active)</option>
                        ))}
                      </select>
                    </div>

                    {/* Add and activate a new year term */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Create & Activate New Term</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                          type="text" 
                          placeholder="e.g. 2026-2027" 
                          value={newYearTerm} 
                          onChange={(e) => setNewYearTerm(e.target.value)}
                          style={{ width: '150px', padding: '0.5rem' }}
                        />
                        <button 
                          type="button" 
                          onClick={() => {
                            if (!newYearTerm.trim()) return;
                            handleSetActiveYear(newYearTerm.trim());
                            setNewYearTerm('');
                          }}
                          className="btn btn-secondary" 
                          style={{ padding: '0.5rem 1rem' }}
                        >
                          ADD & ACTIVATE
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Dynamic Details Configuration */}
                <div className="glass-card" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glow)', paddingBottom: '0.75rem' }}>
                    <Settings size={20} style={{ color: 'var(--accent)' }} />
                    <h3 style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Footer Contact Settings</h3>
                  </div>

                  <form onSubmit={handleSaveContactConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div className="form-group">
                        <label>Public Contact Email</label>
                        <input 
                          type="email" required 
                          value={contactConfig.email} 
                          onChange={e => setContactConfig({...contactConfig, email: e.target.value})} 
                        />
                      </div>
                      <div className="form-group">
                        <label>Instagram URL</label>
                        <input 
                          type="url" 
                          value={contactConfig.instagram} 
                          onChange={e => setContactConfig({...contactConfig, instagram: e.target.value})} 
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div className="form-group">
                        <label>LinkedIn Company URL</label>
                        <input 
                          type="url" 
                          value={contactConfig.linkedin} 
                          onChange={e => setContactConfig({...contactConfig, linkedin: e.target.value})} 
                        />
                      </div>
                      <div className="form-group">
                        <label>GitHub Organization URL</label>
                        <input 
                          type="url" 
                          value={contactConfig.github} 
                          onChange={e => setContactConfig({...contactConfig, github: e.target.value})} 
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Physical Address / Workspace Details</label>
                      <input 
                        type="text" required 
                        value={contactConfig.address} 
                        onChange={e => setContactConfig({...contactConfig, address: e.target.value})} 
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                      <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                        <Save size={14} /> SAVE DETAILS
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ----------------- EVENTS FORM MODAL ----------------- */}
      {showEventModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingItem ? 'Edit Event Log' : 'New Event Log'}</h3>
              <button className="close-btn" onClick={() => setShowEventModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleEventSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Title *</label>
                  <input 
                    type="text" required 
                    value={eventForm.title} 
                    onChange={e => setEventForm({...eventForm, title: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>Subtitle</label>
                  <input 
                    type="text" 
                    value={eventForm.subtitle} 
                    onChange={e => setEventForm({...eventForm, subtitle: e.target.value})} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea 
                  required 
                  value={eventForm.description} 
                  onChange={e => setEventForm({...eventForm, description: e.target.value})} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Date * (e.g. March 15-17, 2026)</label>
                  <input 
                    type="text" required 
                    value={eventForm.date} 
                    onChange={e => setEventForm({...eventForm, date: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>Time (e.g. 9:00 AM - 6:00 PM)</label>
                  <input 
                    type="text" 
                    value={eventForm.time} 
                    onChange={e => setEventForm({...eventForm, time: e.target.value})} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Location *</label>
                <input 
                  type="text" required 
                  value={eventForm.location} 
                  onChange={e => setEventForm({...eventForm, location: e.target.value})} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Category</label>
                  <select 
                    value={eventForm.category} 
                    onChange={e => setEventForm({...eventForm, category: e.target.value})}
                  >
                    <option value="Hackathon">Hackathon</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Bootcamp">Bootcamp</option>
                    <option value="Talk">Talk</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select 
                    value={eventForm.status} 
                    onChange={e => setEventForm({...eventForm, status: e.target.value})}
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="past">Past</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Theme Badge Color</label>
                  <select 
                    value={eventForm.color} 
                    onChange={e => setEventForm({...eventForm, color: e.target.value})}
                  >
                    <option value="bg-primary">Primary (Blue)</option>
                    <option value="bg-secondary">Secondary (Teal)</option>
                    <option value="bg-accent">Accent (Cyan/Amber)</option>
                  </select>
                </div>
              </div>

              {/* Event Image Dropzone Section */}
              <div className="form-group">
                <label>Display Image *</label>
                <div 
                  className="dropzone"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) handleFileDirectUpload(file, 'events');
                  }}
                  onClick={() => document.getElementById('event-file-input').click()}
                >
                  <input 
                    type="file" 
                    id="event-file-input"
                    style={{ display: 'none' }} 
                    accept="image/*" 
                    onChange={e => handleFileUpload(e, 'events')} 
                  />
                  <UploadCloud size={28} style={{ color: 'var(--accent)', marginBottom: '0.25rem' }} />
                  <span className="dropzone-text">Drag & drop image here or click to browse</span>
                  <span className="dropzone-subtext">Supports PNG, JPG, WEBP from your desktop</span>
                </div>
                {uploadProgress !== null && (
                  <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent)', marginTop: '0.5rem', textAlign: 'center' }}>
                    Uploading: {uploadProgress}%
                  </div>
                )}
                {eventForm.image && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                    <img src={eventForm.image} className="preview-thumbnail" alt="Preview" />
                    <input 
                      type="text" 
                      value={eventForm.image} 
                      onChange={e => setEventForm({...eventForm, image: e.target.value})} 
                      style={{ fontSize: '0.75rem', height: '36px' }}
                      onClick={e => e.stopPropagation()} 
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Tags (Comma-separated)</label>
                <input 
                  type="text" placeholder="PCB Design, IoT, Arduino" 
                  value={eventForm.tags} 
                  onChange={e => setEventForm({...eventForm, tags: e.target.value})} 
                />
              </div>

              <div className="form-group">
                <label>Highlights / Points (One per line)</label>
                <textarea 
                  placeholder="₹10,000 Cash Prize&#10;Industry Mentorship&#10;Free Components" 
                  value={eventForm.highlights} 
                  onChange={e => setEventForm({...eventForm, highlights: e.target.value})} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label>Registration Link (URL)</label>
                <input 
                  type="url" placeholder="https://exess-cec.org/register" 
                  value={eventForm.registrationUrl} 
                  onChange={e => setEventForm({...eventForm, registrationUrl: e.target.value})} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEventModal(false)}>CANCEL</button>
                <button type="submit" className="btn btn-primary">SAVE LOG</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- PROJECTS FORM MODAL ----------------- */}
      {showProjectModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingItem ? 'Edit Project Profile' : 'New Project Profile'}</h3>
              <button className="close-btn" onClick={() => setShowProjectModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleProjectSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Project Title *</label>
                  <input 
                    type="text" required 
                    value={projectForm.title} 
                    onChange={e => setProjectForm({...projectForm, title: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>Year *</label>
                  <input 
                    type="text" required 
                    value={projectForm.year} 
                    onChange={e => setProjectForm({...projectForm, year: e.target.value})} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Short Description *</label>
                <input 
                  type="text" required 
                  value={projectForm.description} 
                  onChange={e => setProjectForm({...projectForm, description: e.target.value})} 
                />
              </div>

              <div className="form-group">
                <label>Detailed System Overview *</label>
                <textarea 
                  required 
                  value={projectForm.details} 
                  onChange={e => setProjectForm({...projectForm, details: e.target.value})} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Project Status</label>
                  <select 
                    value={projectForm.status} 
                    onChange={e => setProjectForm({...projectForm, status: e.target.value})}
                  >
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Team Composition</label>
                  <input 
                    type="text" 
                    value={projectForm.team} 
                    onChange={e => setProjectForm({...projectForm, team: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>Card Icon</label>
                  <select 
                    value={projectForm.icon} 
                    onChange={e => setProjectForm({...projectForm, icon: e.target.value})}
                  >
                    {iconList.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Color Theme (Gradient)</label>
                  <select 
                    value={projectForm.color} 
                    onChange={e => setProjectForm({...projectForm, color: e.target.value})}
                  >
                    <option value="from-primary to-secondary">Cyber Blue (from-primary to-secondary)</option>
                    <option value="from-secondary to-accent">Cyan-Green (from-secondary to-accent)</option>
                    <option value="from-accent to-primary">Orange-Teal (from-accent to-primary)</option>
                    <option value="from-purple-900 to-primary">Purple Cyber (from-purple-900 to-primary)</option>
                  </select>
                </div>
              </div>

              {/* Project Image Dropzone Section */}
              <div className="form-group">
                <label>Display Image *</label>
                <div 
                  className="dropzone"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) handleFileDirectUpload(file, 'projects');
                  }}
                  onClick={() => document.getElementById('project-file-input').click()}
                >
                  <input 
                    type="file" 
                    id="project-file-input"
                    style={{ display: 'none' }} 
                    accept="image/*" 
                    onChange={e => handleFileUpload(e, 'projects')} 
                  />
                  <UploadCloud size={28} style={{ color: 'var(--accent)', marginBottom: '0.25rem' }} />
                  <span className="dropzone-text">Drag & drop image here or click to browse</span>
                  <span className="dropzone-subtext">Supports PNG, JPG, WEBP from your desktop</span>
                </div>
                {uploadProgress !== null && (
                  <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent)', marginTop: '0.5rem', textAlign: 'center' }}>
                    Uploading: {uploadProgress}%
                  </div>
                )}
                {projectForm.image && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                    <img src={projectForm.image} className="preview-thumbnail" alt="Preview" />
                    <input 
                      type="text" 
                      value={projectForm.image} 
                      onChange={e => setProjectForm({...projectForm, image: e.target.value})} 
                      style={{ fontSize: '0.75rem', height: '36px' }}
                      onClick={e => e.stopPropagation()} 
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Tags (Comma-separated)</label>
                <input 
                  type="text" placeholder="VHDL, FPGA, DSP, High-Speed" 
                  value={projectForm.tags} 
                  onChange={e => setProjectForm({...projectForm, tags: e.target.value})} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div className="form-group">
                  <label>GitHub Repository URL</label>
                  <input 
                    type="url" placeholder="https://github.com/..." 
                    value={projectForm.githubUrl} 
                    onChange={e => setProjectForm({...projectForm, githubUrl: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>Live Demo URL</label>
                  <input 
                    type="url" placeholder="https://demo.exess-cec.org" 
                    value={projectForm.demoUrl} 
                    onChange={e => setProjectForm({...projectForm, demoUrl: e.target.value})} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowProjectModal(false)}>CANCEL</button>
                <button type="submit" className="btn btn-primary">SAVE PROFILE</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- TEAM FORM MODAL ----------------- */}
      {showTeamModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingItem ? 'Edit Member Profile' : 'New Member Profile'}</h3>
              <button className="close-btn" onClick={() => setShowTeamModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleTeamSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Member Name *</label>
                  <input 
                    type="text" required 
                    value={teamForm.name} 
                    onChange={e => setTeamForm({...teamForm, name: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>Initials (e.g. AK)</label>
                  <input 
                    type="text" maxLength="2" placeholder="AK"
                    value={teamForm.initials} 
                    onChange={e => setTeamForm({...teamForm, initials: e.target.value.toUpperCase()})} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Role * (e.g. Chairperson)</label>
                <input 
                  type="text" required 
                  value={teamForm.role} 
                  onChange={e => setTeamForm({...teamForm, role: e.target.value})} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Committee Term * (e.g. 2025-2026)</label>
                  <input 
                    type="text" required placeholder="2025-2026"
                    value={teamForm.committeeYear} 
                    onChange={e => setTeamForm({...teamForm, committeeYear: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>Display Order * (Sort weight)</label>
                  <input 
                    type="number" required 
                    value={teamForm.order} 
                    onChange={e => setTeamForm({...teamForm, order: e.target.value})} 
                  />
                </div>
              </div>

              {/* Team Image Dropzone Section */}
              <div className="form-group">
                <label>Avatar Image *</label>
                <div 
                  className="dropzone"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) handleFileDirectUpload(file, 'team');
                  }}
                  onClick={() => document.getElementById('team-file-input').click()}
                >
                  <input 
                    type="file" 
                    id="team-file-input"
                    style={{ display: 'none' }} 
                    accept="image/*" 
                    onChange={e => handleFileUpload(e, 'team')} 
                  />
                  <UploadCloud size={28} style={{ color: 'var(--accent)', marginBottom: '0.25rem' }} />
                  <span className="dropzone-text">Drag & drop image here or click to browse</span>
                  <span className="dropzone-subtext">Supports PNG, JPG, WEBP from your desktop</span>
                </div>
                {uploadProgress !== null && (
                  <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent)', marginTop: '0.5rem', textAlign: 'center' }}>
                    Uploading: {uploadProgress}%
                  </div>
                )}
                {teamForm.image && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                    <img src={teamForm.image} className="preview-thumbnail" alt="Preview" />
                    <input 
                      type="text" 
                      value={teamForm.image} 
                      onChange={e => setTeamForm({...teamForm, image: e.target.value})} 
                      style={{ fontSize: '0.75rem', height: '36px' }}
                      onClick={e => e.stopPropagation()} 
                    />
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label>LinkedIn Profile Link</label>
                <input 
                  type="url" placeholder="https://linkedin.com/in/..." 
                  value={teamForm.linkedin} 
                  onChange={e => setTeamForm({...teamForm, linkedin: e.target.value})} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTeamModal(false)}>CANCEL</button>
                <button type="submit" className="btn btn-primary">SAVE MEMBER</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
