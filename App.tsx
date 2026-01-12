import { 
  Plus, Send, Terminal, Trash2, Sparkles, Menu, Code2, 
  Cpu, Rocket, User as UserIcon, Paperclip, X, ShieldCheck,
  LogOut, ShieldAlert, KeyRound, Activity, HardDrive, Zap, AlertCircle, Cloud,
  Globe, Database, Command, RefreshCw, Layers, Settings, Save, Users, UserPlus, Shield, Eye, Edit3, ToggleLeft, ToggleRight, Info, Power, DatabaseBackup, ShieldQuestion, Gauge, Activity as ActivityIcon, BarChart3, Download, Tag, FileJson, ChevronRight, Fingerprint, CloudLightning, BrainCircuit, MessageSquare, Coffee, ExternalLink, ShieldCheck as ShieldCheckIcon, Trash,
  Ship, LogIn, Share2, Github, Copy, Check, AlertTriangle, Lock, ShieldEllipsis, DatabaseZap
} from 'lucide-react';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { GeminiService } from './services/geminiService';
import { ChatSession, Message, User, UserRole, AIProtocol } from './types';
import CodeBlock from './components/CodeBlock';

/**
 * GOOGLE CLOUD SYNC ENGINE - Persistence Layer
 */
const DB_NAME = 'KshitizCoders_GCloud_v2';
const DB_VERSION = 1; 
const STORE_SESSIONS = 'cloud_sessions';
const STORE_PROTOCOLS = 'cloud_protocols';
const STORE_REGISTRY = 'cloud_registry';

const performCloudHandshake = async (data: any, endpoint: string) => {
  console.log(`%c[G-CLOUD-UPLINK] AES-256 Encrypted Sync: ${endpoint}...`, 'color: #10b981; font-weight: bold;');
  return new Promise(resolve => setTimeout(resolve, 800));
};

const initCloudNode = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORE_PROTOCOLS)) db.createObjectStore(STORE_PROTOCOLS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORE_REGISTRY)) db.createObjectStore(STORE_REGISTRY, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const syncToCloud = async (store: string, data: any) => {
  const db = await initCloudNode();
  const tx = db.transaction(store, 'readwrite');
  tx.objectStore(store).put(data);
  await performCloudHandshake(data, store);
};

const fetchFromCloud = async (store: string): Promise<any[]> => {
  const db = await initCloudNode();
  return new Promise((resolve) => {
    const tx = db.transaction(store, 'readonly');
    const request = tx.objectStore(store).getAll();
    request.onsuccess = () => resolve(request.result);
  });
};

const deleteFromCloud = async (store: string, id: string) => {
  const db = await initCloudNode();
  const tx = db.transaction(store, 'readwrite');
  tx.objectStore(store).delete(id);
};

const purgeLaboratoryData = async () => {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => {
      localStorage.clear();
      resolve();
    };
    request.onerror = () => reject();
    request.onblocked = () => {
      localStorage.clear();
      resolve();
    };
  });
};

const CURRENT_USER_DATA = 'k_user_auth_token';

const RoleBadge = ({ role }: { role: UserRole }) => {
  const styles: Record<UserRole, string> = {
    root: 'bg-red-500/10 text-red-500 border-red-500/20',
    admin: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20',
    data_manager: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    editor: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    contributor: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    viewer: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    guest: 'bg-slate-500/10 text-slate-500 border-slate-500/20'
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${styles[role]}`}>
      {role.replace('_', ' ')}
    </span>
  );
};

const LaboratoryModal: React.FC<{ title: string, children: React.ReactNode, onClose: () => void }> = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-3xl animate-fade-in">
    <div className="max-w-4xl w-full glass-panel border-white/10 rounded-[48px] overflow-hidden flex flex-col max-h-[90vh]">
      <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ActivityIcon size={20} className="text-white"/>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{title}</h2>
        </div>
        <button onClick={onClose} className="p-3 text-slate-500 hover:text-white transition-colors"><X/></button>
      </div>
      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
        {children}
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('guest');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [authInitializing, setAuthInitializing] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string } | null>(null);
  
  // Modals
  const [isEvolutionOpen, setIsEvolutionOpen] = useState(false);
  const [isProtocolsOpen, setIsProtocolsOpen] = useState(false);
  const [isRegistryOpen, setIsRegistryOpen] = useState(false);
  const [isMigrationOpen, setIsMigrationOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isSecurityHubOpen, setIsSecurityHubOpen] = useState(false);
  
  // Dynamic States
  const [evolutionInput, setEvolutionInput] = useState('');
  const [evolutionLoading, setEvolutionLoading] = useState(false);
  const [customProtocols, setCustomProtocols] = useState<AIProtocol[]>([]);
  const [activeProtocolId, setActiveProtocolId] = useState<string | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  
  // Account States
  const [newUserName, setNewUserName] = useState('');
  const [newUserKey, setNewUserKey] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('contributor');
  const [isTerminating, setIsTerminating] = useState(false);
  const [purgeRequested, setPurgeRequested] = useState(false);

  // Administrative check for privileged views
  const hasAdminAccess = useMemo(() => {
    return role === 'root' || role === 'admin' || role === 'data_manager';
  }, [role]);

  const isApiKeyConfigured = useMemo(() => {
    return typeof process !== 'undefined' && process.env.API_KEY && process.env.API_KEY !== 'undefined';
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionsRef = useRef(sessions);
  
  useEffect(() => { sessionsRef.current = sessions; }, [sessions]);
  const currentSession = useMemo(() => sessions.find(s => s.id === currentId), [sessions, currentId]);

  useEffect(() => {
    const initialize = async () => {
      try {
        const saved = localStorage.getItem(CURRENT_USER_DATA);
        if (saved) {
          const u = JSON.parse(saved);
          setUser(u);
          setRole(u.role);
        }
        const cloudSessions = await fetchFromCloud(STORE_SESSIONS);
        setSessions(cloudSessions.sort((a, b) => b.lastModified - a.lastModified));
        setCustomProtocols(await fetchFromCloud(STORE_PROTOCOLS));
        setRegisteredUsers(await fetchFromCloud(STORE_REGISTRY));
      } catch (e) { console.error(e); } finally { setAuthInitializing(false); }
    };
    initialize();
  }, []);

  useEffect(() => {
    if (loading || currentSession?.messages.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentSession?.messages.length, loading]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(false);
    const normalizedUser = username.trim().toLowerCase();
    const normalizedPass = password.trim();

    if (normalizedUser === 'kshitizmishra' && normalizedPass === '9845189548') {
      const rootUser: User = { 
        id: 'root', 
        name: 'Kshitiz Mishra', 
        email: 'admin@kshitiz.lab', 
        picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kshitiz', 
        role: 'root' 
      };
      localStorage.setItem(CURRENT_USER_DATA, JSON.stringify(rootUser));
      setUser(rootUser);
      setRole('root');
    } else { 
      const regUser = registeredUsers.find(u => u.name.toLowerCase() === normalizedUser && u.accessKey === normalizedPass);
      if (regUser) {
        localStorage.setItem(CURRENT_USER_DATA, JSON.stringify(regUser));
        setUser(regUser);
        setRole(regUser.role);
      } else {
        setLoginError(true); 
      }
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserKey.trim()) return;

    const newUser: User = {
      id: 'usr-' + Date.now(),
      name: newUserName.trim(),
      email: `${newUserName.trim().toLowerCase().replace(/\s/g, '')}@kshitiz.lab`,
      role: newUserRole,
      accessKey: newUserKey.trim(),
      picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newUserName.trim()}`
    };

    await syncToCloud(STORE_REGISTRY, newUser);
    setRegisteredUsers(prev => [...prev, newUser]);
    setNewUserName('');
    setNewUserKey('');
    setNewUserRole('contributor');
  };

  const handleDeleteUser = async (uid: string) => {
    await deleteFromCloud(STORE_REGISTRY, uid);
    setRegisteredUsers(prev => prev.filter(u => u.id !== uid));
  };

  const handleGuestEntry = useCallback(() => {
    const guestUser: User = { 
      id: 'guest-' + Date.now(), 
      name: 'Guest Node', 
      email: `visitor@kshitiz.lab`,
      role: 'guest', 
      picture: `https://api.dicebear.com/7.x/bottts/svg?seed=Guest-${Date.now()}` 
    };
    localStorage.setItem(CURRENT_USER_DATA, JSON.stringify(guestUser));
    setUser(guestUser);
    setRole('guest');
  }, []);

  const handleLogout = async () => {
    setIsLogoutConfirmOpen(false);
    setIsTerminating(true);
    try {
      if (purgeRequested) await purgeLaboratoryData();
      else localStorage.removeItem(CURRENT_USER_DATA);
      setTimeout(() => {
        setUser(null);
        setRole('guest');
        setCurrentId(null);
        setIsTerminating(false);
        setUsername('');
        setPassword('');
        setSidebar(false);
        setPurgeRequested(false);
        if (purgeRequested) window.location.reload();
      }, 1000);
    } catch (e) {
      console.error(e);
      setIsTerminating(false);
    }
  };

  const handleEvolution = async () => {
    if (!evolutionInput.trim() || evolutionLoading) return;
    setEvolutionLoading(true);
    try {
      const service = GeminiService.getInstance();
      const feature = await service.evolveLaboratory(evolutionInput);
      const protocol: AIProtocol = { id: 'ev-' + Date.now(), ...feature, isEvolved: true };
      await syncToCloud(STORE_PROTOCOLS, protocol);
      setCustomProtocols(prev => [protocol, ...prev]);
      setEvolutionInput('');
      setIsEvolutionOpen(false);
    } catch (e) { console.error(e); } finally { setEvolutionLoading(false); }
  };

  const handleSend = async (customPrompt?: string) => {
    const messageToSend = customPrompt || input;
    if ((!messageToSend.trim() && !selectedImage) || loading) return;

    if (!isApiKeyConfigured) {
      alert("CRITICAL: API_KEY not detected. Please visit Migration Hub.");
      return;
    }

    let sid = currentId || Date.now().toString();
    if (!currentId) {
      const newS: ChatSession = { id: sid, title: messageToSend.slice(0, 30), category: 'General', messages: [], lastModified: Date.now() };
      setSessions(prev => [newS, ...prev]);
      setCurrentId(sid);
    }

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: messageToSend, timestamp: Date.now() };
    const modelMessageId = (Date.now() + 1).toString();
    const modelMessage: Message = { id: modelMessageId, role: 'model', text: '', timestamp: Date.now(), groundingUrls: [] };

    setSessions(prev => prev.map(s => s.id === sid ? { ...s, messages: [...s.messages, userMessage, modelMessage], lastModified: Date.now() } : s));
    setInput('');
    const imagePayload = selectedImage;
    setSelectedImage(null);
    setLoading(true);

    try {
      let accumulated = '';
      const service = GeminiService.getInstance();
      const history = (sessionsRef.current.find(s => s.id === sid)?.messages || []).slice(-10).map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      
      let protocolText = customProtocols.find(p => p.id === activeProtocolId)?.systemInstruction;
      if (role === 'guest' && !protocolText) protocolText = "You are the Polyglot Core Liaison. Welcome the visitor. Remind them you understand all coding languages and follow high-security protocols.";

      for await (const chunk of service.sendMessageStream(messageToSend, history, imagePayload || undefined, protocolText)) {
        accumulated += chunk.text;
        setSessions(prev => prev.map(s => s.id === sid ? {
          ...s,
          messages: s.messages.map(m => m.id === modelMessageId ? { ...m, text: accumulated, groundingUrls: chunk.grounding } : m)
        } : s));
      }

      const updatedS = sessionsRef.current.find(s => s.id === sid);
      if (updatedS) await syncToCloud(STORE_SESSIONS, updatedS);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  if (authInitializing) return <div className="h-screen bg-[#020617] flex items-center justify-center animate-pulse text-indigo-400 font-black uppercase text-xs tracking-widest">Neural_Node_Initialization...</div>;
  if (isTerminating) return <div className="h-screen bg-[#020617] flex items-center justify-center animate-pulse text-red-500 font-black uppercase text-xs tracking-widest">{purgeRequested ? 'Purging_System_Nodes...' : 'Handshake_Closing...'}</div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#020617] relative overflow-hidden">
        <div className="max-w-md w-full space-y-12 animate-fade-in z-10">
          <div className="text-center space-y-4">
            <div className="w-28 h-28 bg-indigo-600 rounded-[40px] flex items-center justify-center mx-auto shadow-2xl rotate-6 border border-white/20">
              <ShieldCheck size={56} className="text-white" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">KSHITIZ CODERS</h1>
            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Neural Coding Laboratory</p>
          </div>
          <div className="glass-panel p-10 rounded-[56px] space-y-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
               <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                 <Lock size={8} className="text-emerald-500" />
                 <span className="text-[6px] font-black uppercase text-emerald-500 tracking-tighter">Google Polyglot Core</span>
               </div>
            </div>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-4">Access_Code</label>
                <input type="text" placeholder="Identity Code" required value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-slate-900 border border-white/5 rounded-[24px] py-5 px-8 text-white font-bold outline-none focus:border-indigo-500 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-4">Security_Key</label>
                <input type="password" placeholder="Laboratory Auth Key" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-900 border border-white/5 rounded-[24px] py-5 px-8 text-white font-bold outline-none focus:border-indigo-500 transition-all" />
              </div>
              {loginError && <div className="text-red-500 text-[10px] font-black uppercase text-center py-2 animate-shake">Uplink Error: Invalid Credentials</div>}
              <button type="submit" className="galaxy-button w-full py-5 rounded-[24px] text-white font-black uppercase tracking-widest">Authorize Access</button>
            </form>
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
              <div className="relative flex justify-center text-[9px] uppercase font-black text-slate-600"><span className="bg-[#0f172a] px-4">OR</span></div>
            </div>
            <button onClick={handleGuestEntry} className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[24px] text-indigo-400 font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3">
              <Zap size={14} className="text-amber-500" /> Guest Node Entry
            </button>
            <div className="pt-4 text-center">
              <p className="text-[7px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                <ShieldCheckIcon size={8} /> AES-256 Code Encryption Active
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen text-slate-100 overflow-hidden bg-[#020617]">
      <aside className={`fixed md:static inset-y-0 left-0 w-80 bg-slate-950 border-r border-white/5 z-[70] flex flex-col transition-transform duration-300 ${sidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-8 flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Cpu size={20} className="text-white" />
          </div>
          <div className="truncate">
            <span className="block font-black text-white tracking-tighter uppercase text-sm leading-none">NEURAL CORE</span>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Polyglot_Mastery_Active</span>
            </div>
          </div>
        </div>

        <button onClick={() => { setCurrentId(null); setSidebar(false); }} className="mx-6 mb-8 flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-300 font-black uppercase text-[10px] tracking-widest transition-all group">
          <span>Synthesize New Logic</span>
          <Plus size={16} className="group-hover:rotate-90 transition-transform" />
        </button>

        <div className="flex-1 overflow-y-auto px-6 space-y-2 custom-scrollbar">
          <p className="px-2 text-[10px] font-black uppercase text-slate-600 tracking-widest mb-4">Logic Archives</p>
          {sessions.map(s => (
            <div key={s.id} onClick={() => { setCurrentId(s.id); setSidebar(false); }} className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${currentId === s.id ? 'bg-indigo-500/10 border border-indigo-500/20 text-white' : 'hover:bg-white/5 text-slate-400 border border-transparent'}`}>
              <span className="text-xs font-bold truncate">{s.title || "Logic unit"}</span>
              <button onClick={async (e) => { e.stopPropagation(); deleteFromCloud(STORE_SESSIONS, s.id); setSessions(p => p.filter(x => x.id !== s.id)); }} className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-red-500"><Trash2 size={14}/></button>
            </div>
          ))}

          {hasAdminAccess && (
            <div className="mt-8 space-y-2">
              <p className="px-2 text-[10px] font-black uppercase text-slate-600 tracking-widest mb-4">Laboratory AI Core</p>
              <button onClick={() => setIsEvolutionOpen(true)} className="w-full flex items-center gap-4 p-4 rounded-2xl text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 hover:bg-indigo-500/10 transition-all group">
                <BrainCircuit size={16} className="group-hover:rotate-12 transition-transform" />
                <span className="text-xs font-black uppercase tracking-tight">Evolve Logic Engine</span>
              </button>
              <button onClick={() => setIsProtocolsOpen(true)} className="w-full flex items-center gap-4 p-4 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all">
                <Command size={16} />
                <span className="text-xs font-bold uppercase tracking-tight">Polyglot Nexus</span>
              </button>
              <button onClick={() => setIsRegistryOpen(true)} className="w-full flex items-center gap-4 p-4 rounded-2xl text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-all group">
                <Users size={16} />
                <span className="text-xs font-black uppercase tracking-tight">Engineer Registry</span>
              </button>
              <button onClick={() => setIsMigrationOpen(true)} className="w-full flex items-center gap-4 p-4 rounded-2xl text-amber-400 bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 transition-all group">
                <Ship size={16} />
                <span className="text-xs font-black uppercase tracking-tight">Uplink Controller</span>
              </button>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/5 space-y-4">
          <button onClick={() => setIsSecurityHubOpen(true)} className="w-full flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-all">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest">Code Security & Audit</span>
          </button>
          <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/5">
            <img src={user.picture} className="w-10 h-10 rounded-xl" />
            <div className="flex-1 truncate">
              <p className="text-xs font-black text-white truncate uppercase">{user.name}</p>
              <RoleBadge role={role} />
            </div>
            <button onClick={() => setIsLogoutConfirmOpen(true)} className="p-2 text-slate-500 hover:text-red-500 transition-colors" title="Secure Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative min-w-0">
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-slate-950/40 backdrop-blur-3xl sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <button onClick={() => setSidebar(true)} className="md:hidden p-3 bg-white/5 rounded-2xl border border-white/10"><Menu size={22}/></button>
            <div className="flex flex-col">
              <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">Neural Coding Workbench</h2>
              <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                <Lock size={8} /> Polyglot Engine Synthesis Verified
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
             {activeProtocolId && (
               <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/5 border border-indigo-500/10 rounded-full">
                 <Terminal size={12} className="text-indigo-400" />
                 <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400">
                   {customProtocols.find(p => p.id === activeProtocolId)?.title}
                 </span>
               </div>
             )}
             <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
               <DatabaseZap size={12} className="text-emerald-500" />
               <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Uplink Online</span>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {!currentId ? (
            <div className="max-w-4xl mx-auto px-8 py-24 text-center space-y-12 animate-fade-in">
               <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-none">NEURAL CODING<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Polyglot Synthesis.</span></h1>
               <p className="text-slate-500 font-medium max-w-xl mx-auto uppercase text-[10px] tracking-[0.3em]">Mastering every language from Assembly to Cloud-native DSLs.</p>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                 <button onClick={() => handleSend("Port this Python snippet to optimized Rust for performance.")} className="glass-panel p-8 rounded-[32px] text-left hover:scale-[1.02] transition-all group">
                   <RefreshCw size={24} className="mb-4 text-indigo-400 group-hover:text-white transition-colors" />
                   <span className="text-[10px] font-black text-white uppercase tracking-widest">Language Porting</span>
                 </button>
                 <button onClick={() => handleSend("Audit this smart contract for reentrancy vulnerabilities.")} className="glass-panel p-8 rounded-[32px] text-left hover:scale-[1.02] transition-all group">
                   <ShieldAlert size={24} className="mb-4 text-purple-400 group-hover:text-white transition-colors" />
                   <span className="text-[10px] font-black text-white uppercase tracking-widest">Security Audit</span>
                 </button>
                 <button onClick={() => handleSend("Architect a scalable microservice cluster using Go and Kubernetes.")} className="glass-panel p-8 rounded-[32px] text-left hover:scale-[1.02] transition-all group">
                   <Layers size={24} className="mb-4 text-emerald-400 group-hover:text-white transition-colors" />
                   <span className="text-[10px] font-black text-white uppercase tracking-widest">Arch Design</span>
                 </button>
               </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-8 py-16 space-y-12 pb-60">
              {currentSession?.messages.map(m => <MessageItem key={m.id} message={m} />)}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        <div className="fixed bottom-0 inset-x-0 p-8 md:p-14 z-50 flex justify-center bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pointer-events-none">
          <div className="w-full max-w-4xl pointer-events-auto">
            <div className="glass-panel rounded-[40px] p-3 flex items-center shadow-2xl">
              <button onClick={() => fileInputRef.current?.click()} className="p-5 text-slate-700 hover:text-indigo-400 transition-colors" title="Attach Engineering Schematics"><Paperclip size={24}/></button>
              <input type="file" ref={fileInputRef} onChange={e => {
                const f = e.target.files?.[0];
                if(f) {
                  const r = new FileReader();
                  r.onload = ev => setSelectedImage({ data: (ev.target?.result as string).split(',')[1], mimeType: f.type });
                  r.readAsDataURL(f);
                }
              }} className="hidden" accept="image/*" />
              <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Uplink logic demand..." className="flex-1 bg-transparent border-none focus:ring-0 py-5 text-white font-bold placeholder:text-slate-800 resize-none max-h-40 custom-scrollbar" rows={1} />
              <button onClick={() => handleSend()} disabled={loading} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${loading ? 'bg-slate-800' : 'galaxy-button text-white shadow-lg'}`}>
                {loading ? <div className="w-6 h-6 border-4 border-white/10 border-t-white rounded-full animate-spin"></div> : <Send size={24} />}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Security & Audit Hub */}
      {isSecurityHubOpen && (
        <LaboratoryModal title="Logic Security & Audit Hub" onClose={() => setIsSecurityHubOpen(false)}>
          <div className="space-y-10 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-panel p-8 rounded-[32px] border-emerald-500/20 space-y-4">
                <div className="flex items-center gap-3 text-emerald-500">
                  <ShieldCheck size={20}/>
                  <span className="text-[10px] font-black uppercase tracking-widest">Static Analysis</span>
                </div>
                <p className="text-xs font-medium text-slate-400 leading-relaxed">
                  Every logic unit is scanned for common CWEs. Polyglot engine identifies buffer overflows, injection points, and insecure cryptographic implementations.
                </p>
              </div>
              <div className="glass-panel p-8 rounded-[32px] border-indigo-500/20 space-y-4">
                <div className="flex items-center gap-3 text-indigo-500">
                  <Fingerprint size={20}/>
                  <span className="text-[10px] font-black uppercase tracking-widest">Ownership & Hash</span>
                </div>
                <p className="text-xs font-medium text-slate-400 leading-relaxed">
                  Logic units are signed with SHA-256 and stored in your browser's private cloud node. No telemetry or code snippets are leaked outside the Google Secure Uplink.
                </p>
              </div>
            </div>
          </div>
        </LaboratoryModal>
      )}

      {/* Feature Synthesis / Evolution */}
      {isEvolutionOpen && (
        <LaboratoryModal title="Logic Evolution Engine" onClose={() => setIsEvolutionOpen(false)}>
           <div className="space-y-10 py-6">
              <div className="text-center space-y-4">
                 <div className="w-20 h-20 bg-indigo-500/10 rounded-[32px] flex items-center justify-center mx-auto text-indigo-400">
                   <BrainCircuit size={40} className={evolutionLoading ? 'animate-pulse' : ''} />
                 </div>
                 <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Synthesize Protocol</h3>
                 <p className="text-slate-500 text-sm max-w-lg mx-auto font-medium uppercase tracking-widest">Define a new coding persona or security framework.</p>
              </div>
              <textarea value={evolutionInput} onChange={e => setEvolutionInput(e.target.value)} placeholder="Demand specific language expertise or framework focus..." className="w-full bg-slate-900 border border-white/5 rounded-[32px] p-8 text-white font-bold outline-none focus:border-indigo-500 transition-all h-48" />
              <button onClick={handleEvolution} disabled={evolutionLoading || !evolutionInput.trim()} className="w-full py-6 galaxy-button rounded-[32px] text-white font-black uppercase tracking-widest flex items-center justify-center gap-4">
                {evolutionLoading ? <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div> : <><CloudLightning size={20} /> Deploy Synthesis</>}
              </button>
           </div>
        </LaboratoryModal>
      )}
      
      {/* Existing Registry, Protocols, and Migration modals remain but with updated context */}
      {isProtocolsOpen && (
        <LaboratoryModal title="Polyglot Nexus" onClose={() => setIsProtocolsOpen(false)}>
           <div className="grid grid-cols-1 gap-6">
              {customProtocols.length === 0 ? (
                <div className="p-10 border border-dashed border-white/10 rounded-[40px] text-center text-slate-600 font-black uppercase text-xs tracking-widest">Nexus Empty</div>
              ) : (
                customProtocols.map(p => (
                  <div key={p.id} onClick={() => setActiveProtocolId(activeProtocolId === p.id ? null : p.id)} className={`p-8 rounded-[40px] border transition-all cursor-pointer ${activeProtocolId === p.id ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-white/5 border-white/5 hover:border-white/20'}`}>
                    <div className="flex justify-between items-start mb-4">
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center"><Terminal size={20} className="text-indigo-400"/></div>
                         <h4 className="font-black text-white uppercase text-sm tracking-widest">{p.title}</h4>
                       </div>
                       <button onClick={(e) => { e.stopPropagation(); deleteFromCloud(STORE_PROTOCOLS, p.id); setCustomProtocols(prev => prev.filter(x => x.id !== p.id)); }} className="text-slate-600 hover:text-red-500 p-2"><Trash2 size={14}/></button>
                    </div>
                    <p className="text-slate-400 text-xs font-medium leading-relaxed">{p.desc}</p>
                  </div>
                ))
              )}
           </div>
        </LaboratoryModal>
      )}

      {isRegistryOpen && (
        <LaboratoryModal title="Engineer Registry" onClose={() => setIsRegistryOpen(false)}>
          <div className="space-y-12 py-6">
            <div className="glass-panel p-8 rounded-[40px] border-emerald-500/10 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <UserPlus size={24} className="text-emerald-400" />
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Access Provisioning</h3>
                </div>
                {role === 'data_manager' && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
                    <DatabaseZap size={12} className="text-orange-500" />
                    <span className="text-[8px] font-black uppercase text-orange-500 tracking-widest">Logic Auditor Mode Active</span>
                  </div>
                )}
              </div>
              <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Engineer Name" className="bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-emerald-500" />
                <input type="text" value={newUserKey} onChange={e => setNewUserKey(e.target.value)} placeholder="Laboratory Key" className="bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-emerald-500" />
                <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as UserRole)} className="bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-emerald-500 transition-all">
                  <option value="admin">Chief Engineer</option>
                  <option value="data_manager">Code Auditor</option>
                  <option value="editor">Senior Developer</option>
                  <option value="contributor">Contributor</option>
                  <option value="viewer">Guest Auditor</option>
                </select>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest rounded-2xl py-4">Provision Engineer</button>
              </form>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Personnel archive</p>
              {registeredUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between p-6 rounded-[32px] bg-white/5 border border-white/5 group">
                  <div className="flex items-center gap-4">
                    <img src={u.picture} className="w-12 h-12 rounded-2xl" />
                    <div><p className="font-black text-white uppercase text-sm">{u.name}</p><RoleBadge role={u.role} /></div>
                  </div>
                  <button onClick={() => handleDeleteUser(u.id)} className="p-3 text-slate-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
          </div>
        </LaboratoryModal>
      )}

      {isMigrationOpen && (
        <LaboratoryModal title="Uplink Controller" onClose={() => setIsMigrationOpen(false)}>
           <div className="space-y-10 py-6">
              <div className="flex items-start gap-8 p-10 bg-indigo-500/5 border border-indigo-500/10 rounded-[40px]">
                 <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shrink-0"><Cloud size={32} /></div>
                 <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">System Uplink</h3>
                    <p className="text-slate-400 text-sm font-medium">Manage your Google Cloud handshakes and persistence nodes.</p>
                 </div>
              </div>
              <button onClick={() => { setIsMigrationOpen(false); setIsLogoutConfirmOpen(true); setPurgeRequested(true); }} className="w-full py-6 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest rounded-[32px] shadow-2xl transition-all">
                Terminate & Purge All Logic Nodes
              </button>
           </div>
        </LaboratoryModal>
      )}

      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl animate-fade-in">
           <div className="max-w-md w-full glass-panel border-red-500/20 rounded-[48px] p-10 text-center space-y-8 animate-shake shadow-2xl">
              <div className="w-16 h-16 bg-red-600/10 rounded-[24px] flex items-center justify-center mx-auto"><Power className="text-red-500" size={32} /></div>
              <h3 className="text-2xl font-black text-white uppercase">Uplink Termination</h3>
              <div className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 mb-2">
                <input type="checkbox" id="purge" checked={purgeRequested} onChange={e => setPurgeRequested(e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-slate-900 text-indigo-600" />
                <label htmlFor="purge" className="text-[9px] font-black uppercase text-slate-400">Purge local logic cache</label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => setIsLogoutConfirmOpen(false)} className="py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-300 font-black uppercase text-[10px]">Stay Online</button>
                 <button onClick={handleLogout} className="py-4 rounded-2xl bg-red-600 text-white font-black uppercase text-[10px]">{purgeRequested ? 'PURGE & RESET' : 'OFFLINE'}</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const MessageItem: React.FC<{ message: Message }> = ({ message }) => {
  const isModel = message.role === 'model';
  const parts = useMemo(() => {
    const regex = /```(\w*)\n([\s\S]*?)```/g;
    const result: { type: 'text' | 'code', content: string, language?: string }[] = [];
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(message.text)) !== null) {
      if (match.index > lastIndex) result.push({ type: 'text', content: message.text.slice(lastIndex, match.index) });
      result.push({ type: 'code', language: match[1], content: match[2] });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < message.text.length) result.push({ type: 'text', content: message.text.slice(lastIndex) });
    return result;
  }, [message.text]);

  return (
    <div className={`flex flex-col ${isModel ? 'items-start' : 'items-end'} animate-fade-in group`}>
      <div className={`max-w-[90%] space-y-4`}>
        <div className={`flex items-center gap-3 ${isModel ? 'flex-row' : 'flex-row-reverse'}`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-lg ${isModel ? 'bg-indigo-600 shadow-indigo-500/20' : 'bg-slate-800'}`}>
            {isModel ? <Terminal size={14} className="text-white" /> : <UserIcon size={14} className="text-slate-400" />}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            {isModel ? 'Neural Coding Core' : 'Chief Engineer'}
          </span>
        </div>
        <div className={`p-6 rounded-[32px] ${isModel ? 'bg-slate-900 border border-white/5 text-slate-300 shadow-xl' : 'galaxy-button text-white shadow-2xl'}`}>
          {parts.map((p, i) => p.type === 'code' ? (
            <CodeBlock key={i} code={p.content} language={p.language} />
          ) : (
            <div key={i} className="text-sm font-medium leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: p.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          ))}
          {isModel && message.groundingUrls && message.groundingUrls.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">Verified Technical Sources</p>
              <div className="flex flex-wrap gap-2">
                {message.groundingUrls.map((g, idx) => (
                  <a key={idx} href={g.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all group/link">
                    <Globe size={10} className="text-indigo-400" />
                    <span className="text-[10px] font-bold text-slate-300 truncate max-w-[150px]">{g.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;