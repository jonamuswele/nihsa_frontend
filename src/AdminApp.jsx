// ╔══════════════════════════════════════════════════════════════════╗
// ║  NIHSA ADMIN PANEL  v2.0 — Production Grade                    ║
// ║  JWT Auth · CRUD · Live API · Role-based access                 ║
// ╚══════════════════════════════════════════════════════════════════╝

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from 'react-router-dom';
const _RAW_API = "";
const API_BASE = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api` 
  : "/api";
const TOKEN_KEY = "nihsa_token";

// ─── DESIGN ────────────────────────────────────────────────────────────────────
const C = {
  bg:'#020E1C', surface:'#061828', s2:'#091F32', s3:'#0C2640',
  border:'#123450', primary:'#0EA5E9', accent:'#38BDF8', gold:'#F59E0B',
  text:'#B0C8DE', bright:'#F1F5F9', muted:'#3D6A8A',
  danger:'#EF4444', warning:'#F97316', success:'#10B981', info:'#6366F1',
};

const RISK_COLOR = r => ({CRITICAL:'#EF4444',HIGH:'#F97316',MEDIUM:'#F59E0B',WATCH:'#EAB308',NORMAL:'#10B981'}[r]||'#3D6A8A');
const RISK_BG = r => ({CRITICAL:'#EF444415',HIGH:'#F9731615',MEDIUM:'#F59E0B15',WATCH:'#EAB30815',NORMAL:'#10B98115'}[r]||'#3D6A8A15');

// ─── API ───────────────────────────────────────────────────────────────────────
const api = {
  token: () => localStorage.getItem(TOKEN_KEY),
  headers: () => ({ 'Content-Type':'application/json', ...(localStorage.getItem(TOKEN_KEY)?{Authorization:`Bearer ${localStorage.getItem(TOKEN_KEY)}`}:{}) }),
  async req(method, path, body) {
    // Check if body is FormData
    const isFormData = body instanceof FormData;
    
    const headers = {};
    if (localStorage.getItem(TOKEN_KEY)) {
      headers['Authorization'] = `Bearer ${localStorage.getItem(TOKEN_KEY)}`;
    }
    
    // Only set Content-Type for non-FormData requests
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    const r = await fetch(API_BASE + path, { 
      method, 
      headers: headers,
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined)
    });
    
    if (r.status === 401) { 
      localStorage.removeItem(TOKEN_KEY); 
      window.location.reload(); 
      return null; 
    }
    if (!r.ok) { 
      const e = await r.json().catch(() => ({ detail: 'Server error' })); 
      throw new Error(e.detail || 'Error'); 
    }
    return r.json();
  },
  get: (p) => api.req('GET',p),
  post: (p,b) => api.req('POST',p,b),
  put: (p,b) => api.req('PUT',p,b),
  delete: (p) => api.req('DELETE',p),
  async login(email, password) {
    let r;
    try {
      const form = new URLSearchParams({username:email, password});
      r = await fetch(API_BASE+'/auth/login',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:form});
    } catch(networkErr) {
      throw new Error('Cannot reach the NIHSA server. Please ensure the backend service is running.');
    }
    if (!r.ok) {
      let msg = 'Incorrect email or password.';
      try {
        const e = await r.json();
        if (typeof e.detail === 'string') msg = e.detail;
        else if (Array.isArray(e.detail)) msg = e.detail.map(d => d.msg || JSON.stringify(d)).join(', ');
        else if (e.detail) msg = JSON.stringify(e.detail);
      } catch(_) {}
      throw new Error(msg);
    }
    const d = await r.json();
    if (!d.access_token) throw new Error('Login failed: server did not return a token.');
    localStorage.setItem(TOKEN_KEY, d.access_token);
    return d;
  },
  async upload(path, formData) {
    const token = localStorage.getItem(TOKEN_KEY);
    const r = await fetch(API_BASE + path, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},  // No Content-Type! Browser sets it with boundary
      body: formData,
    });
    if (r.status === 401) { localStorage.removeItem(TOKEN_KEY); window.location.reload(); return null; }
    if (!r.ok) { const e = await r.json().catch(() => ({ detail: 'Upload failed' })); throw new Error(e.detail || 'Upload failed'); }
    return r.json();
  },

};

// ─── HOOKS ─────────────────────────────────────────────────────────────────────
function useFetch(path, deps=[]) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async() => {
    setLoading(true);
    try { const d=await api.get(path); if(d!==null) setData(d); setError(null); }
    catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, [path]);

  useEffect(() => { load(); }, [load,...deps]);
  return { data, loading, error, reload: load, setData };
}

// ─── UI PRIMITIVES ─────────────────────────────────────────────────────────────
const Spinner = ({size=18}) => <div style={{width:size,height:size,border:`2px solid ${C.border}`,borderTopColor:C.primary,borderRadius:'50%',animation:'spin 0.7s linear infinite'}} />;

const Badge = ({level,children}) => (
  <span style={{display:'inline-flex',padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:700,letterSpacing:'0.05em',background:RISK_BG(level),color:RISK_COLOR(level),border:`1px solid ${RISK_COLOR(level)}35`}}>
    {children||level}
  </span>
);

const Table = ({cols, data, onRow, empty='No data available', loading, actions}) => (
  <div style={{overflowX:'auto'}}>
    <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
      <thead>
        <tr style={{borderBottom:`1px solid ${C.border}`}}>
          {cols.map(c=><th key={c.key||c} style={{padding:'9px 12px',textAlign:'left',color:C.muted,fontWeight:600,fontSize:11,letterSpacing:'0.05em',whiteSpace:'nowrap'}}>{c.label||c}</th>)}
          {actions && <th style={{padding:'9px 12px',color:C.muted,fontSize:11,fontWeight:600}}>ACTIONS</th>}
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <tr><td colSpan={cols.length+(actions?1:0)} style={{padding:20,textAlign:'center',color:C.muted}}><Spinner /></td></tr>
        ) : !data?.length ? (
          <tr><td colSpan={cols.length+(actions?1:0)} style={{padding:24,textAlign:'center',color:C.muted}}>{empty}</td></tr>
        ) : data.map((row,i)=>(
          <tr key={row.id||i} onClick={onRow?()=>onRow(row):undefined} style={{borderBottom:`1px solid ${C.border}18`,background:i%2?`${C.s2}50`:'transparent',cursor:onRow?'pointer':'default'}}>
            {cols.map(c=>(
              <td key={c.key||c} style={{padding:'9px 12px',color:C.text,whiteSpace:'nowrap'}}>
                {c.render ? c.render(row[c.key],row) : (row[c.key||c]??'—')}
              </td>
            ))}
            {actions && <td style={{padding:'9px 12px'}}>{actions(row)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Modal = ({title, children, onClose, wide}) => (
  <div style={{position:'fixed',inset:0,background:'#000C',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,width:'100%',maxWidth:wide?720:480,maxHeight:'90vh',overflowY:'auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 20px',borderBottom:`1px solid ${C.border}`}}>
        <div style={{fontSize:15,fontWeight:700,color:C.bright}}>{title}</div>
        <button onClick={onClose} style={{background:'none',border:'none',color:C.muted,fontSize:20,cursor:'pointer'}}>✕</button>
      </div>
      <div style={{padding:20}}>{children}</div>
    </div>
  </div>
);

const FormField = ({label, required, children, error}) => (
  <div style={{marginBottom:14}}>
    <label style={{display:'block',fontSize:11,fontWeight:700,color:C.muted,letterSpacing:'0.05em',marginBottom:5}}>
      {label}{required&&<span style={{color:C.danger}}> *</span>}
    </label>
    {children}
    {error && <div style={{fontSize:11,color:C.danger,marginTop:3}}>{error}</div>}
  </div>
);

const inp = {width:'100%',padding:'9px 12px',background:C.s2,border:`1px solid ${C.border}`,borderRadius:8,color:C.bright,fontSize:13,outline:'none',boxSizing:'border-box'};
const Inp = (props) => <input style={inp} {...props} />;
const Sel = ({children,...props}) => <select style={{...inp,cursor:'pointer'}} {...props}>{children}</select>;
const Txt = (props) => <textarea style={{...inp,resize:'vertical'}} rows={3} {...props} />;

const ActionBtn = ({color=C.primary, onClick, children, small, disabled}) => (
  <button onClick={onClick} disabled={disabled} style={{padding:small?'4px 10px':'7px 14px',background:`${color}20`,border:`1px solid ${color}40`,borderRadius:6,color,fontSize:small?11:12,fontWeight:600,cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.5:1}}>
    {children}
  </button>
);

const Confirm = ({msg, onConfirm, onCancel}) => (
  <Modal title="Confirm Action" onClose={onCancel}>
    <div style={{color:C.text,marginBottom:20,fontSize:14}}>{msg}</div>
    <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
      <ActionBtn onClick={onCancel}>Cancel</ActionBtn>
      <ActionBtn color={C.danger} onClick={onConfirm}>Confirm Delete</ActionBtn>
    </div>
  </Modal>
);

// ─── SECTIONS ─────────────────────────────────────────────────────────────────

// ── DASHBOARD OVERVIEW ──────────────────────────────────────────────
const OverviewSection = () => {
  const { data, loading } = useFetch('/dashboard/stats');
  const stats = data || {};

  const kpis = [
    { label:'Active Alerts', val: stats.active_alerts??'—', icon:'⚠️', c:C.danger },
    { label:'Gauges Online', val: stats.gauges_online??'—', icon:'📡', c:C.success },
    { label:'Pending Reports', val: stats.reports_pending??'—', icon:'📋', c:C.warning },
    { label:'Total Stations', val: stats.total_stations??358, icon:'📍', c:C.primary },
    { label:'Active Vanguards', val: stats.active_vanguards??'—', icon:'👥', c:C.info },
    { label:'Basins Monitored', val: stats.basins_monitored??70, icon:'🗺️', c:C.gold },
  ];

  return (
    <div>
      <SectionHeader title="Platform Overview" />
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:24}}>
        {kpis.map((k,i)=>(
          <div key={i} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:'16px 18px'}}>
            {loading ? <div style={{height:48,background:C.s2,borderRadius:6}} /> : (
              <>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <span style={{fontSize:22}}>{k.icon}</span>
                  <span style={{fontSize:10,color:C.muted,fontWeight:600,letterSpacing:'0.06em'}}>{k.label.toUpperCase()}</span>
                </div>
                <div style={{fontSize:28,fontWeight:800,color:k.c,fontFamily:'monospace'}}>{k.val}</div>
              </>
            )}
          </div>
        ))}
      </div>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:16,fontSize:13,color:C.muted}}>
        <b style={{color:C.bright}}>NIHSA Admin Panel v2.0</b> — All changes persist immediately to the live database. Actions are logged in the audit trail. Contact the system administrator for role changes.
      </div>
    </div>
  );
};

// ── GAUGE STATIONS ──────────────────────────────────────────────────
const GaugesSection = () => {
  const { data, loading, error, reload } = useFetch('/gauges');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);

  const stations = Array.isArray(data) ? data : [];

  const openAdd = () => { setForm({}); setErr(''); setModal('add'); };
  const openEdit = g => { setForm({...g}); setErr(''); setModal(g); };

  const save = async () => {
    if (!form.station_name || !form.lat || !form.lng) { setErr('Name, Latitude and Longitude are required'); return; }
    setSaving(true); setErr('');
    try {
      if (modal==='add') await api.post('/gauges', form);
      else await api.put(`/gauges/${form.station_id||form.id}`, form);
      reload(); setModal(null);
    } catch(e) { setErr(e.message); }
    setSaving(false);
  };

  const del = async (id) => {
    try { await api.delete(`/gauges/${id}`); reload(); setConfirmDel(null); }
    catch(e) { alert(e.message); }
  };

  const f = (key, label, type='text', required) => (
    <FormField label={label} required={required}>
      <Inp type={type} value={form[key]||''} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} />
    </FormField>
  );

  return (
    <div>
      <SectionHeader title="Gauge Stations" action={<ActionBtn onClick={openAdd}>+ Add Station</ActionBtn>} />
      {error && <ErrorBox msg={error} onRetry={reload} />}
      <Table loading={loading} data={stations} cols={[
        {key:'station_id',label:'ID'},
        {key:'station_name',label:'NAME'},
        {key:'river_name',label:'RIVER'},
        {key:'state',label:'STATE'},
        {key:'lat',label:'LAT',render:v=>v?.toFixed(4)??'—'},
        {key:'lng',label:'LNG',render:v=>v?.toFixed(4)??'—'},
        {key:'warning_level',label:'WARN (m)'},
        {key:'danger_level',label:'DANGER (m)'},
        {key:'is_active',label:'STATUS',render:v=><span style={{color:v?C.success:C.muted,fontSize:11,fontWeight:700}}>{v?'ACTIVE':'INACTIVE'}</span>},
      ]} actions={g=>(
        <div style={{display:'flex',gap:5}}>
          <ActionBtn small onClick={e=>{e.stopPropagation();openEdit(g);}}>Edit</ActionBtn>
          <ActionBtn small color={C.danger} onClick={e=>{e.stopPropagation();setConfirmDel(g.station_id||g.id);}}>Delete</ActionBtn>
        </div>
      )} empty="No gauge stations. Add your first station." />

      {modal && (
        <Modal title={modal==='add'?'Add Gauge Station':'Edit Gauge Station'} onClose={()=>setModal(null)} wide>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
            {f('station_id','Station ID','text',modal==='add')}
            {f('station_name','Station Name','text',true)}
            {f('river_name','River Name','text',true)}
            {f('state','State','text',true)}
            {f('lat','Latitude','number',true)}
            {f('lng','Longitude','number',true)}
            {f('warning_level','Warning Level (m)','number')}
            {f('danger_level','Danger Level (m)','number')}
          </div>
          <FormField label="Status">
            <Sel value={form.is_active??true} onChange={e=>setForm(p=>({...p,is_active:e.target.value==='true'}))}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Sel>
          </FormField>
          {err && <div style={{color:C.danger,fontSize:12,marginBottom:10,padding:'6px 10px',background:'#EF444415',borderRadius:6}}>{err}</div>}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:4}}>
            <ActionBtn onClick={()=>setModal(null)}>Cancel</ActionBtn>
            <ActionBtn color={C.success} onClick={save} disabled={saving}>{saving?'Saving...':'Save Station'}</ActionBtn>
          </div>
        </Modal>
      )}
      {confirmDel && <Confirm msg="Delete this gauge station? This cannot be undone." onConfirm={()=>del(confirmDel)} onCancel={()=>setConfirmDel(null)} />}
    </div>
  );
};

// ── GAUGE READINGS ──────────────────────────────────────────────────
const ReadingsSection = () => {
  const { data: stations } = useFetch('/gauges');
  const { data, loading, error, reload } = useFetch('/gauges/readings');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const readings = Array.isArray(data) ? data : (data?.items||[]);
  const gList = Array.isArray(stations) ? stations : [];

  const save = async () => {
    if (!form.station_id || !form.water_level) { setErr('Station and water level are required'); return; }
    setSaving(true); setErr('');
    try {
      await api.post('/gauges/readings', { ...form, water_level: parseFloat(form.water_level), discharge: parseFloat(form.discharge||0) });
      reload(); setModal(false);
    } catch(e) { setErr(e.message); }
    setSaving(false);
  };

  return (
    <div>
      <SectionHeader title="Gauge Readings" action={<ActionBtn onClick={()=>{setForm({});setErr('');setModal(true);}}>+ Add Reading</ActionBtn>} />
      {error && <ErrorBox msg={error} onRetry={reload}/>}
      <Table loading={loading} data={readings} cols={[
        {key:'station_id',label:'STATION'},
        {key:'water_level',label:'LEVEL (m)',render:v=><span style={{fontWeight:700,color:C.accent}}>{v?.toFixed(2)??'—'}m</span>},
        {key:'discharge',label:'FLOW (m³/s)',render:v=>v?v.toLocaleString():'—'},
        {key:'risk_level',label:'STATUS',render:(v,r)=><Badge level={v||r.status}>{v||r.status||'—'}</Badge>},
        {key:'recorded_at',label:'TIMESTAMP',render:v=>v?new Date(v).toLocaleString():'—'},
        {key:'source',label:'SOURCE'},
      ]} empty="No readings recorded." />

      {modal && (
        <Modal title="Add Gauge Reading" onClose={()=>setModal(false)}>
          <FormField label="Station" required>
            <Sel value={form.station_id||''} onChange={e=>setForm(p=>({...p,station_id:e.target.value}))}>
              <option value="">Select station...</option>
              {gList.map(g=><option key={g.station_id||g.id} value={g.station_id||g.id}>{g.station_name||g.name} ({g.river_name||g.river||'—'})</option>)}
            </Sel>
          </FormField>
          <FormField label="Water Level (m)" required>
            <Inp type="number" step="0.01" value={form.water_level||''} onChange={e=>setForm(p=>({...p,water_level:e.target.value}))} />
          </FormField>
          <FormField label="Discharge (m³/s)">
            <Inp type="number" value={form.discharge||''} onChange={e=>setForm(p=>({...p,discharge:e.target.value}))} />
          </FormField>
          <FormField label="Notes">
            <Txt value={form.notes||''} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} />
          </FormField>
          {err && <div style={{color:C.danger,fontSize:12,marginBottom:10,padding:'6px 10px',background:'#EF444415',borderRadius:6}}>{err}</div>}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <ActionBtn onClick={()=>setModal(false)}>Cancel</ActionBtn>
            <ActionBtn color={C.success} onClick={save} disabled={saving}>{saving?'Saving...':'Add Reading'}</ActionBtn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── FLOOD ALERTS ────────────────────────────────────────────────────
const AlertsSection = () => {
  const { data, loading, error, reload } = useFetch('/alerts?active_only=false');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);

  const alerts = Array.isArray(data) ? data : (data?.items||[]);

  const openAdd = () => { setForm({level:'WATCH',is_active:false,is_published:false,lgas_str:''}); setErr(''); setModal('add'); };
  const openEdit = a => { setForm({...a, lgas_str:(a.lgas||[]).join(', ')}); setErr(''); setModal(a); };

  const save = async () => {
    if (!form.title || !form.message || !form.level) { setErr('Title, message and level are required'); return; }
    setSaving(true); setErr('');
    try {
      const payload = {
        title: form.title, message: form.message, level: form.level,
        state: form.state || null,
        lgas: form.lgas_str ? form.lgas_str.split(',').map(s=>s.trim()).filter(Boolean) : [],
        is_active: form.is_active, is_published: form.is_published,
      };
      if (modal==='add') await api.post('/alerts', payload);
      else await api.put(`/alerts/${form.id}`, payload);
      reload(); setModal(null);
    } catch(e) { setErr(e.message); }
    setSaving(false);
  };

  const toggle = async (a, field) => {
    try {
      const id = a.alert_id || a.id;
      if (field === 'is_published' && !a.is_published) {
        await api.req('PATCH', `/alerts/${id}/publish`);
      } else if (field === 'is_active' && a.is_active) {
        await api.req('PATCH', `/alerts/${id}/deactivate`);
      } else {
        await api.put(`/alerts/${id}`, {[field]: !a[field]});
      }
      reload();
    } catch(e) { alert(e.message); }
  };

  const del = async id => {
    try { await api.delete(`/alerts/${id}`); reload(); setConfirmDel(null); }
    catch(e) { alert(e.message); }
  };

  return (
    <div>
      <SectionHeader title="Flood Alerts" action={<ActionBtn onClick={openAdd}>+ Create Alert</ActionBtn>} />
      {error && <ErrorBox msg={error} onRetry={reload}/>}
      <Table loading={loading} data={alerts} cols={[
        {key:'level',label:'LEVEL',render:v=><Badge level={v}/>},
        {key:'title',label:'TITLE',render:v=><span style={{color:C.bright,fontWeight:600}}>{v}</span>},
        {key:'state',label:'STATE',render:v=>v||'—'},
        {key:'lgas',label:'LGAs',render:v=>Array.isArray(v)&&v.length?v.join(', ').slice(0,40)+(v.join(', ').length>40?'…':''):'—'},
        {key:'is_active',label:'ACTIVE',render:(v,r)=>(
          <button onClick={e=>{e.stopPropagation();toggle(r,'is_active');}} style={{padding:'3px 8px',borderRadius:4,border:'none',background:v?'#10B98120':'#EF444415',color:v?C.success:C.muted,cursor:'pointer',fontSize:11,fontWeight:700}}>{v?'ACTIVE':'INACTIVE'}</button>
        )},
        {key:'is_published',label:'PUBLISHED',render:(v,r)=>(
          <button onClick={e=>{e.stopPropagation();toggle(r,'is_published');}} style={{padding:'3px 8px',borderRadius:4,border:'none',background:v?'#0EA5E920':'#3D6A8A20',color:v?C.primary:C.muted,cursor:'pointer',fontSize:11,fontWeight:700}}>{v?'LIVE':'DRAFT'}</button>
        )},
      ]} actions={a=>(
        <div style={{display:'flex',gap:5}}>
          <ActionBtn small onClick={e=>{e.stopPropagation();openEdit(a);}}>Edit</ActionBtn>
          <ActionBtn small color={C.danger} onClick={e=>{e.stopPropagation();setConfirmDel(a.alert_id||a.id);}}>Delete</ActionBtn>
        </div>
      )} empty="No alerts created. All clear." />

      {modal && (
        <Modal title={modal==='add'?'Create Flood Alert':'Edit Alert'} onClose={()=>setModal(null)} wide>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
            <div style={{gridColumn:'1/-1'}}>
              <FormField label="Alert Title" required>
                <Inp value={form.title||''} onChange={e=>setForm(p=>({...p,title:e.target.value}))} />
              </FormField>
            </div>
            <FormField label="Alert Level" required>
              <Sel value={form.level||'WATCH'} onChange={e=>setForm(p=>({...p,level:e.target.value}))}>
                {['NORMAL','WATCH','MEDIUM','HIGH','CRITICAL'].map(l=><option key={l}>{l}</option>)}
              </Sel>
            </FormField>
            <FormField label="Affected State">
              <Inp value={form.state||''} onChange={e=>setForm(p=>({...p,state:e.target.value}))} placeholder="e.g. Kogi State" />
            </FormField>
            <div style={{gridColumn:'1/-1'}}>
              <FormField label="Affected LGAs (comma-separated)">
                <Inp value={form.lgas_str||''} onChange={e=>setForm(p=>({...p,lgas_str:e.target.value}))} placeholder="e.g. Lokoja, Ajaokuta, Ibaji" />
              </FormField>
            </div>
            <div style={{gridColumn:'1/-1'}}>
              <FormField label="Alert Message" required>
                <Txt rows={4} value={form.message||''} onChange={e=>setForm(p=>({...p,message:e.target.value}))} />
              </FormField>
            </div>
            <div style={{gridColumn:'1/-1'}}>
              <FormField label="Recommended Actions">
                <Txt rows={4} value={form.recommended_actions||''} onChange={e=>setForm(p=>({...p,recommended_actions:e.target.value}))} placeholder="1. Evacuate low-lying areas&#10;2. ..." />
              </FormField>
            </div>
            <FormField label="Start Date">
              <Inp type="datetime-local" value={form.start_date?.slice(0,16)||''} onChange={e=>setForm(p=>({...p,start_date:e.target.value}))} />
            </FormField>
            <FormField label="End Date">
              <Inp type="datetime-local" value={form.end_date?.slice(0,16)||''} onChange={e=>setForm(p=>({...p,end_date:e.target.value}))} />
            </FormField>
            <FormField label="Active">
              <Sel value={String(form.is_active||false)} onChange={e=>setForm(p=>({...p,is_active:e.target.value==='true'}))}>
                <option value="true">Yes — Alert is active</option>
                <option value="false">No — Inactive</option>
              </Sel>
            </FormField>
            <FormField label="Published (visible to public)">
              <Sel value={String(form.is_published||false)} onChange={e=>setForm(p=>({...p,is_published:e.target.value==='true'}))}>
                <option value="true">Yes — Visible to public</option>
                <option value="false">No — Draft only</option>
              </Sel>
            </FormField>
          </div>
          {err && <div style={{color:C.danger,fontSize:12,marginBottom:10,padding:'6px 10px',background:'#EF444415',borderRadius:6}}>{err}</div>}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:4}}>
            <ActionBtn onClick={()=>setModal(null)}>Cancel</ActionBtn>
            <ActionBtn color={C.success} onClick={save} disabled={saving}>{saving?'Saving...':'Save Alert'}</ActionBtn>
          </div>
        </Modal>
      )}
      {confirmDel && <Confirm msg="Delete this alert permanently?" onConfirm={()=>del(confirmDel)} onCancel={()=>setConfirmDel(null)} />}
    </div>
  );
};

// ── FIELD REPORTS ───────────────────────────────────────────────────
const ReportsSection = ({ onAlertCreated }) => {
  const [filter, setFilter] = useState('pending');
  const { data, loading, error, reload } = useFetch(`/reports?status=${filter}&limit=200`);
  const [sel, setSel] = useState(null);
  const [saving, setSaving] = useState(null);
  const [reason, setReason] = useState('');
  const [alertBanner, setAlertBanner] = useState(null);
  const [confirmReject, setConfirmReject] = useState(null);
  const [mediaErrors, setMediaErrors] = useState({});

  const reports = Array.isArray(data) ? data : (data?.items||[]);

  // Helper to get file type from URL or filename
  const getFileType = (url) => {
    const urlLower = url.toLowerCase();
    if (urlLower.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return 'image';
    if (urlLower.match(/\.(mp4|webm|mov|avi)$/i)) return 'video';
    if (urlLower.match(/\.(mp3|wav|ogg|m4a)$/i) || urlLower.includes('voice')) return 'audio';
    return 'unknown';
  };

  // Handle media load error - mark as failed so we can show fallback
  const handleMediaError = (url, type) => {
    console.error(`Failed to load ${type}: ${url}`);
    setMediaErrors(prev => ({ ...prev, [url]: true }));
  };

  // Render media with proper players
  const renderMedia = (urls) => {
    if (!urls || urls.length === 0) {
      return (
        <div style={{padding:'20px',textAlign:'center',background:C.s2,borderRadius:8,color:C.muted}}>
          📭 No media attachments
        </div>
      );
    }

    return (
      <div style={{marginTop:12}}>
        <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:'0.06em',marginBottom:8}}>
          📎 MEDIA ATTACHMENTS ({urls.length} file{urls.length !== 1 ? 's' : ''})
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {urls.map((url, i) => {
            const fileName = url.split('/').pop() || `file_${i+1}`;
            
            // Determine file type for icon
            const urlLower = url.toLowerCase();
            let icon = '📄';
            let type = 'File';
            if (urlLower.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
              icon = '🖼️';
              type = 'Image';
            } else if (urlLower.match(/\.(mp4|webm|mov|avi)$/i)) {
              icon = '🎬';
              type = 'Video';
            } else if (urlLower.match(/\.(mp3|wav|ogg|m4a)$/i) || urlLower.includes('voice')) {
              icon = '🎙️';
              type = 'Audio';
            }
            
            return (
              <div key={i} style={{background:C.s2,border:`1px solid ${C.border}`,borderRadius:8,padding:12}}>
                <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                  <span style={{fontSize:20}}>{icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,color:C.bright,wordBreak:'break-all'}}>
                      {fileName}
                    </div>
                    <div style={{fontSize:10,color:C.muted}}>{type}</div>
                  </div>
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{
                      padding:'8px 16px',
                      background:C.primary,
                      border:'none',
                      borderRadius:6,
                      color:'#fff',
                      fontSize:12,
                      fontWeight:600,
                      textDecoration:'none',
                      cursor:'pointer',
                      display:'inline-flex',
                      alignItems:'center',
                      gap:6
                    }}
                  >
                    🔗 View / Download
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Verify report - creates alert
  const verify = async (id) => {
    setSaving(id);
    try {
      await api.req('PATCH', `/reports/${id}/verify`, {status: 'verified'});
      reload(); 
      setSel(null); 
      setAlertBanner('✅ Report verified — a live Flood Alert has been created!');
      setTimeout(() => setAlertBanner(null), 5000);
      if (onAlertCreated) onAlertCreated();
    } catch(e) { alert(e.message); }
    setSaving(null);
  };

  // Reject report - deletes media from R2
  const reject = async (id) => {
    setSaving(id);
    try {
      await api.req('PATCH', `/reports/${id}/verify`, {
        status: 'rejected', 
        rejection_reason: reason || 'No reason provided'
      });
      reload(); 
      setSel(null); 
      setReason('');
      setConfirmReject(null);
      setAlertBanner('❌ Report rejected. Media files have been deleted from storage.');
      setTimeout(() => setAlertBanner(null), 5000);
    } catch(e) { alert(e.message); }
    setSaving(null);
  };

  const STATUS_TABS = [
    {key:'pending', label:'Pending', color:C.warning},
    {key:'ai_review', label:'AI Review', color:C.info},
    {key:'verified', label:'Verified', color:C.success},
    {key:'rejected', label:'Rejected', color:C.muted},
    {key:'all', label:'All', color:C.primary},
  ];

  return (
    <div>
      <SectionHeader title="Field Reports" action={<ActionBtn onClick={reload}>↻ Refresh</ActionBtn>} />
      
      {alertBanner && (
        <div style={{padding:'10px 14px',background:`${C.success}18`,border:`1px solid ${C.success}40`,borderRadius:8,
          color:C.success,fontSize:12,fontWeight:600,marginBottom:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          {alertBanner}
          <button onClick={()=>setAlertBanner(null)} style={{background:'none',border:'none',color:C.success,cursor:'pointer',fontSize:16,lineHeight:1}}>×</button>
        </div>
      )}
      
      <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap'}}>
        {STATUS_TABS.map(s=>(
          <button key={s.key} onClick={()=>setFilter(s.key)} style={{
            padding:'6px 14px',borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:filter===s.key?700:400,
            border:`1px solid ${filter===s.key?s.color:C.border}`,
            background:filter===s.key?`${s.color}18`:'transparent',
            color:filter===s.key?s.color:C.muted,
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {error && <ErrorBox msg={error} onRetry={reload}/>}
      
      <Table loading={loading} data={reports} onRow={r=>{setSel(r);setReason('');}} cols={[
        {key:'status',label:'STATUS',render:v=>{
          const colors={pending:C.warning,ai_review:C.info,verified:C.success,rejected:C.muted};
          return <span style={{color:colors[v]||C.muted,fontWeight:700,fontSize:11,textTransform:'uppercase'}}>{v}</span>;
        }},
        {key:'address',label:'LOCATION',render:(v,r)=>v||`${r.state||''}${r.lga?', '+r.lga:''}`||'—'},
        {key:'description',label:'DESCRIPTION',render:v=><span style={{color:C.text}} title={v}>{v?.slice(0,60)}{v?.length > 60 ? '…' : ''}</span>},
        {key:'water_depth_m',label:'DEPTH',render:v=>v!=null?`${v}m`:'—'},
        {key:'media_urls',label:'MEDIA',render:v=>{
          if (!v || v.length === 0) return <span style={{color:C.muted,fontSize:11}}>No media</span>;
          const imgCount = v.filter(url => getFileType(url) === 'image').length;
          const vidCount = v.filter(url => getFileType(url) === 'video').length;
          const audCount = v.filter(url => getFileType(url) === 'audio').length;
          return (
            <span style={{color:C.success,fontSize:11,display:'flex',gap:4}}>
              {imgCount > 0 && <span>🖼️ {imgCount}</span>}
              {vidCount > 0 && <span>🎬 {vidCount}</span>}
              {audCount > 0 && <span>🎙️ {audCount}</span>}
            </span>
          );
        }},
        {key:'submitted_at',label:'SUBMITTED',render:v=>v?new Date(v).toLocaleString():'—'},
      ]} actions={r=>(
        <div style={{display:'flex',gap:5}}>
          {r.status === 'pending' || r.status === 'ai_review' ? (
            <>
              <ActionBtn small color={C.success} onClick={e=>{e.stopPropagation();verify(r.id)}} disabled={saving===r.id}>
                ✓ Verify
              </ActionBtn>
              <ActionBtn small color={C.warning} onClick={e=>{e.stopPropagation();setConfirmReject(r);}} disabled={saving===r.id}>
                ✗ Reject & Delete
              </ActionBtn>
            </>
          ) : (
            <ActionBtn small color={C.info} onClick={e=>{e.stopPropagation();setSel(r);}}>View Details</ActionBtn>
          )}
        </div>
      )} empty="No reports with this status." />

      {/* Report Details Modal */}
      {sel && (
        <Modal title="Report Details" onClose={()=>setSel(null)} wide>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 16px',fontSize:13,color:C.text,lineHeight:1.7,marginBottom:12}}>
            <div><b style={{color:C.muted}}>Report ID:</b> {sel.id?.slice(0,8)}…</div>
            <div><b style={{color:C.muted}}>Status:</b> 
              <span style={{textTransform:'uppercase',fontWeight:700,color:{
                pending:C.warning,verified:C.success,rejected:C.muted,ai_review:C.info
              }[sel.status]||C.info}}> {sel.status}</span>
            </div>
            <div><b style={{color:C.muted}}>Location:</b> {sel.address||'—'}</div>
            <div><b style={{color:C.muted}}>State / LGA:</b> {sel.state||'—'} / {sel.lga||'—'}</div>
            <div><b style={{color:C.muted}}>Depth:</b> {sel.water_depth_m!=null?`${sel.water_depth_m}m`:'Not specified'}</div>
            <div><b style={{color:C.muted}}>Risk Level:</b> {sel.risk_level||'—'}</div>
            <div><b style={{color:C.muted}}>Coordinates:</b> {sel.lat?.toFixed(4)||'—'}, {sel.lng?.toFixed(4)||'—'}</div>
            <div><b style={{color:C.muted}}>Submitted:</b> {sel.submitted_at ? new Date(sel.submitted_at).toLocaleString() : '—'}</div>
          </div>
          
          <div style={{padding:'10px 14px',background:C.s2,borderRadius:8,fontSize:13,color:C.text,lineHeight:1.6,marginBottom:8}}>
            <b style={{color:C.muted}}>Description:</b><br/>
            {sel.description}
          </div>
          
          {renderMedia(sel.media_urls)}
        </Modal>
      )}

      {/* Reject Confirmation Modal */}
      {confirmReject && (
        <Modal title="Reject & Delete Report" onClose={()=>setConfirmReject(null)}>
          <div style={{marginBottom:16}}>
            <div style={{padding:'12px',background:`${C.warning}12`,border:`1px solid ${C.warning}30`,borderRadius:8,fontSize:13,color:C.text,marginBottom:12}}>
              ⚠️ <b>Warning: This will permanently delete all media files!</b><br/><br/>
              Rejecting this report will:
              <ul style={{marginTop:8,marginBottom:0}}>
                <li>Mark the report as rejected</li>
                <li><b>Permanently delete all photos, videos, and voice recordings from Cloudflare R2</b></li>
                <li>The user will be notified of the rejection</li>
              </ul>
            </div>
            <FormField label="Rejection Reason" required>
              <Txt 
                value={reason} 
                onChange={e=>setReason(e.target.value)} 
                rows={3} 
                placeholder="Provide a clear reason for rejection (will be shown to the user)..." 
              />
            </FormField>
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <ActionBtn onClick={()=>{setConfirmReject(null); setReason('');}}>Cancel</ActionBtn>
            <ActionBtn color={C.warning} onClick={()=>reject(confirmReject.id)} disabled={!reason.trim()}>
              Confirm Reject & Delete Media
            </ActionBtn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── VANGUARD USERS ──────────────────────────────────────────────────
const VanguardsSection = () => {
  const { data, loading, error, reload } = useFetch('/vanguards');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);

  const vanguards = Array.isArray(data) ? data : (data?.items||[]);

  const save = async () => {
    if (!form.full_name || !form.email) { setErr('Name and email are required'); return; }
    setSaving(true); setErr('');
    try {
      if (modal==='add') await api.post('/vanguards', form);
      else await api.put(`/vanguards/${form.user_id||form.id}`, form);
      reload(); setModal(null);
    } catch(e) { setErr(e.message); }
    setSaving(false);
  };

  const del = async id => {
    try { await api.delete(`/vanguards/${id}`); reload(); setConfirmDel(null); }
    catch(e) { alert(e.message); }
  };

  return (
    <div>
      <SectionHeader title="Vanguard Users" action={<ActionBtn onClick={()=>{setForm({role:'vanguard',is_active:true});setErr('');setModal('add');}}>+ Add Vanguard</ActionBtn>} />
      {error && <ErrorBox msg={error} onRetry={reload}/>}
      <Table loading={loading} data={vanguards} cols={[
        {key:'full_name',label:'NAME',render:v=><span style={{fontWeight:700,color:C.bright}}>{v}</span>},
        {key:'email',label:'EMAIL'},
        {key:'role',label:'ROLE',render:v=><span style={{fontSize:11,color:C.info,fontWeight:700,textTransform:'uppercase'}}>{v}</span>},
        {key:'state',label:'STATE'},
        {key:'lga',label:'LGA'},
        {key:'phone',label:'PHONE'},
        {key:'is_active',label:'STATUS',render:v=><span style={{color:v?C.success:C.muted,fontWeight:700,fontSize:11}}>{v?'ACTIVE':'INACTIVE'}</span>},
      ]} actions={v=>(
        <div style={{display:'flex',gap:5}}>
          <ActionBtn small onClick={()=>{setForm({...v});setErr('');setModal(v);}}>Edit</ActionBtn>
          <ActionBtn small color={C.danger} onClick={()=>setConfirmDel(v.user_id||v.id)}>Delete</ActionBtn>
        </div>
      )} empty="No vanguards registered." />

      {modal && (
        <Modal title={modal==='add'?'Add Vanguard':'Edit Vanguard'} onClose={()=>setModal(null)} wide>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
            <FormField label="Full Name" required>
              <Inp value={form.full_name||''} onChange={e=>setForm(p=>({...p,full_name:e.target.value}))} />
            </FormField>
            <FormField label="Email" required>
              <Inp type="email" value={form.email||''} onChange={e=>setForm(p=>({...p,email:e.target.value}))} />
            </FormField>
            {modal==='add' && (
              <FormField label="Password" required>
                <Inp type="password" value={form.password||''} onChange={e=>setForm(p=>({...p,password:e.target.value}))} />
              </FormField>
            )}
            <FormField label="Role">
              <Sel value={form.role||'vanguard'} onChange={e=>setForm(p=>({...p,role:e.target.value}))}>
                <option value="vanguard">Vanguard</option>
                <option value="coordinator">Coordinator</option>
                <option value="government">Government</option>
                <option value="admin">Admin</option>
              </Sel>
            </FormField>
            <FormField label="State">
              <Inp value={form.state||''} onChange={e=>setForm(p=>({...p,state:e.target.value}))} />
            </FormField>
            <FormField label="LGA">
              <Inp value={form.lga||''} onChange={e=>setForm(p=>({...p,lga:e.target.value}))} />
            </FormField>
            <FormField label="Phone">
              <Inp value={form.phone||''} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} />
            </FormField>
            <FormField label="Active Status">
              <Sel value={String(form.is_active??true)} onChange={e=>setForm(p=>({...p,is_active:e.target.value==='true'}))}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Sel>
            </FormField>
          </div>
          {err && <div style={{color:C.danger,fontSize:12,marginBottom:10,padding:'6px 10px',background:'#EF444415',borderRadius:6}}>{err}</div>}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:4}}>
            <ActionBtn onClick={()=>setModal(null)}>Cancel</ActionBtn>
            <ActionBtn color={C.success} onClick={save} disabled={saving}>{saving?'Saving...':'Save'}</ActionBtn>
          </div>
        </Modal>
      )}
      {confirmDel && <Confirm msg="Remove this vanguard user?" onConfirm={()=>del(confirmDel)} onCancel={()=>setConfirmDel(null)} />}
    </div>
  );
};

// ── MODEL SETTINGS ──────────────────────────────────────────────────
const ModelSection = () => {
  const { data, loading } = useFetch('/model/settings');
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if(data) setForm(data); }, [data]);

  const save = async () => {
    setSaving(true);
    try {
      await api.post('/model/settings', form);
      setSaved(true); setTimeout(()=>setSaved(false),3000);
    } catch(e) { alert(e.message); }
    setSaving(false);
  };

  const defaults = {
    lookback_days:30, forecast_days:7, lstm_layers:2, lstm_units:128,
    learning_rate:0.001, dropout_rate:0.2, batch_size:64, epochs:100,
    num_features:57, num_basins:70, stage1_nse:0.925, stage2_nse:0.993,
    bias_correction:true, ensemble_members:10,
  };

  const settings = Object.keys(form).length ? form : defaults;

  const numFld = (key, label) => (
    <FormField key={key} label={label}>
      <Inp type="number" step="any" value={settings[key]??defaults[key]??''} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} />
    </FormField>
  );

  return (
    <div>
      <SectionHeader title="LSTM Model Settings" />
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:20,marginBottom:16}}>
        <div style={{fontSize:13,color:C.muted,marginBottom:16}}>Configure NIHSA LSTM flood forecast model parameters. Changes are stored and applied on next model run.</div>
        {loading ? <div style={{color:C.muted,fontSize:13}}>Loading model configuration…</div> : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'0 20px'}}>
            {numFld('lookback_days','Lookback Window (days)')}
            {numFld('forecast_days','Forecast Horizon (days)')}
            {numFld('lstm_layers','LSTM Layers')}
            {numFld('lstm_units','LSTM Units per Layer')}
            {numFld('learning_rate','Learning Rate')}
            {numFld('dropout_rate','Dropout Rate')}
            {numFld('batch_size','Batch Size')}
            {numFld('epochs','Training Epochs')}
            {numFld('num_features','Input Features')}
            {numFld('num_basins','Number of Basins')}
            {numFld('stage1_nse','Stage 1 NSE Target')}
            {numFld('stage2_nse','Stage 2 NSE Target')}
            <FormField label="Bias Correction">
              <Sel value={String(settings.bias_correction??true)} onChange={e=>setForm(p=>({...p,bias_correction:e.target.value==='true'}))}>
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </Sel>
            </FormField>
            {numFld('ensemble_members','Ensemble Members')}
          </div>
        )}
        <div style={{display:'flex',gap:8,alignItems:'center',marginTop:8}}>
          <ActionBtn color={C.success} onClick={save} disabled={saving}>{saving?'Saving...':'Save Model Settings'}</ActionBtn>
          {saved && <span style={{fontSize:12,color:C.success}}>✓ Saved successfully</span>}
        </div>
      </div>

      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:20}}>
        <div style={{fontSize:13,fontWeight:700,color:C.bright,marginBottom:12}}>Current Model Architecture</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:10,fontSize:12}}>
          {[
            ['Model Type','LSTM (Long Short-Term Memory)'],
            ['Training Period','1981–2026 (45 years)'],
            ['Input Features','57 (9 groups)'],
            ['Spatial Coverage','70 HYBAS Level-5 basins'],
            ['Stage 1 NSE','0.925 (all 70 basins)'],
            ['Stage 2 NSE','0.989–0.996 (3 NIHSA gauges)'],
            ['Lookback Window','30 days'],
            ['Forecast Horizon','7 days (Q05/Q50/Q95)'],
            ['Bias Correction','Stage 2 (frozen Stage 1)'],
            ['Key Predictor','Lagdo Dam upstream routing'],
          ].map(([k,v])=>(
            <div key={k} style={{padding:'8px 10px',background:C.s2,borderRadius:6}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:2}}>{k}</div>
              <div style={{color:C.bright,fontWeight:600}}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── DATA UPLOAD ─────────────────────────────────────────────────────
const DataUploadSection = () => {
  const [uploading, setUploading] = useState({});
  const [results, setResults] = useState({});

  const MAX_FILE_MB = 50;
  const ALLOWED_TYPES = {
    'gauges-csv': ['.csv', '.xlsx', '.xls'],
    'readings-csv': ['.csv'],
    'rivers-shp': ['.zip'],
    'basins-shp': ['.zip'],
    'rainfall-csv': ['.csv', '.xlsx'],
  };

  const upload = async (type, file) => {
    if (!file) return;
    // Validate file size
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setResults(p=>({...p,[type]:`❌ File too large. Maximum allowed size is ${MAX_FILE_MB}MB.`}));
      return;
    }
    // Validate file extension
    const fname = file.name.toLowerCase();
    const allowed = ALLOWED_TYPES[type] || [];
    if (allowed.length > 0 && !allowed.some(ext => fname.endsWith(ext))) {
      setResults(p=>({...p,[type]:`❌ Invalid file type. Allowed: ${allowed.join(', ')}`}));
      return;
    }
    setUploading(p=>({...p,[type]:true}));
    const fd = new FormData(); fd.append('file', file);
    try {
      const r = await fetch(`${API_BASE}/data/upload/${type}`, {
        method:'POST', headers:{Authorization:`Bearer ${api.token()}`}, body:fd
      });
      const d = await r.json();
      setResults(p=>({...p,[type]:r.ok?`✅ ${d.message||'Uploaded successfully'}`:`❌ ${d.detail||'Upload failed'}`}));
    } catch(e) {
      setResults(p=>({...p,[type]:`❌ ${e.message}`}));
    }
    setUploading(p=>({...p,[type]:false}));
  };

  const uploads = [
    {type:'gauges-csv',label:'Gauge Stations CSV',desc:'Upload station list with ID, name, river, state, lat, lng, warning/danger levels',accept:'.csv'},
    {type:'readings-csv',label:'Gauge Readings CSV',desc:'Bulk upload historical or daily discharge data',accept:'.csv'},
    {type:'rivers-shp',label:'River Network Shapefile',desc:'Upload rivers shapefile (ZIP containing .shp, .shx, .dbf)',accept:'.zip'},
    {type:'basins-shp',label:'HYBAS Basins Shapefile',desc:'Upload HYBAS Level-5 basin boundaries',accept:'.zip'},
    {type:'rainfall-csv',label:'Rainfall Data CSV',desc:'NASA POWER or NIMET rainfall data',accept:'.csv,.xlsx'},
  ];

  return (
    <div>
      <SectionHeader title="Data Upload" />
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:12}}>
        {uploads.map(u=>(
          <div key={u.type} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:16}}>
            <div style={{fontSize:13,fontWeight:700,color:C.bright,marginBottom:4}}>{u.label}</div>
            <div style={{fontSize:11,color:C.muted,marginBottom:12}}>{u.desc}</div>
            <label style={{display:'block',padding:'10px 14px',background:C.s2,border:`1px dashed ${C.border}`,borderRadius:8,cursor:'pointer',textAlign:'center',fontSize:12,color:C.muted}}>
              {uploading[u.type] ? '⏳ Uploading...' : '📎 Click to select file'}
              <input type="file" accept={u.accept} style={{display:'none'}} onChange={e=>upload(u.type, e.target.files[0])} />
            </label>
            {results[u.type] && (
              <div style={{marginTop:8,fontSize:11,color:results[u.type].startsWith('✅')?C.success:C.danger}}>
                {results[u.type]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── AUDIT LOG ───────────────────────────────────────────────────────
const AuditSection = () => {
  const { data, loading, error, reload } = useFetch('/audit/logs');
  const logs = Array.isArray(data) ? data : (data?.items||[]);

  return (
    <div>
      <SectionHeader title="Audit Logs" action={<ActionBtn onClick={reload}>Refresh</ActionBtn>} />
      {error && <ErrorBox msg={error} onRetry={reload}/>}
      <Table loading={loading} data={logs} cols={[
        {key:'user_email',label:'USER'},
        {key:'action',label:'ACTION',render:v=><span style={{color:C.accent,fontWeight:700,fontSize:11}}>{v}</span>},
        {key:'resource_type',label:'RESOURCE'},
        {key:'resource_id',label:'ID'},
        {key:'details',label:'DETAILS',render:v=>v?.slice(0,60)||'—'},
        {key:'created_at',label:'TIMESTAMP',render:v=>v?new Date(v).toLocaleString():'—'},
        {key:'ip_address',label:'IP'},
      ]} empty="No audit logs available." />
    </div>
  );
};

// ─── SHARED ────────────────────────────────────────────────────────────────────
const SectionHeader = ({title, action}) => (
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
    <div style={{fontSize:17,fontWeight:700,color:C.bright,fontFamily:'Rajdhani,sans-serif',letterSpacing:'0.02em'}}>{title}</div>
    {action}
  </div>
);

const ErrorBox = ({msg, onRetry}) => (
  <div style={{padding:'10px 14px',background:'#EF444415',border:'1px solid #EF444430',borderRadius:8,color:'#FCA5A5',fontSize:12,marginBottom:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
    <span>⚠ {msg}</span>
    {onRetry && <button onClick={onRetry} style={{background:'none',border:'none',color:C.primary,cursor:'pointer',fontSize:12}}>Retry</button>}
  </div>
);

// ── PERSONNEL SECTION (Unified: Users + Vanguard Profiles) ─────────
const SCOPE_LABELS = {
  surface_water:'Surface Water', groundwater:'Groundwater', water_quality:'Water Quality',
  coastal_marine:'Coastal & Marine', forecast:'Annual Forecast', forecast_weekly:'Weekly Forecast',
  reports:'Field Reports', alerts:'Flood Alerts', vanguards:'Personnel',
};

// ── PERSONNEL SECTION ─────────────────────────────────────────────────────────
const ROLE_COLORS = {
  admin:C.danger, sub_admin:C.warning, nihsa_staff:C.info,
  government:C.gold, vanguard:C.success, researcher:'#A855F7', citizen:C.muted,
};
const ROLE_FILTERS = [
  {id:'all',         label:'All'},
  {id:'vanguard',    label:'🦺 Flood Marshals'},
  {id:'nihsa_staff', label:'🏛 NIHSA Staff'},
  {id:'government',  label:'🏢 Government'},
  {id:'sub_admin',   label:'🔐 Sub-Admins'},
  {id:'citizen',     label:'👤 Citizens'},
  {id:'admin',       label:'🔴 Admins'},
];

const PersonnelSection = ({ isAdmin }) => {
  const { data, loading, error, reload } = useFetch('/auth/users');
  const [roleFilter, setRoleFilter] = useState('all');
  const [modal, setModal]   = useState(null);   // user being edited
  const [action, setAction] = useState('role'); // 'role' | 'delete'
  const [form, setForm]     = useState({role:'citizen', sub_admin_scope:''});
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [err, setErr]       = useState('');

  const allUsers = Array.isArray(data) ? data : [];
  const users = roleFilter === 'all' ? allUsers : allUsers.filter(u => u.role === roleFilter);

  const openRole = (u) => { setForm({role:u.role, sub_admin_scope:u.sub_admin_scope||''}); setErr(''); setModal(u); setAction('role'); };

  const saveRole = async () => {
    setSaving(true); setErr('');
    try {
      await api.put(`/auth/users/${modal.id}/role`, form);
      reload(); setModal(null);
    } catch(e) { setErr(e.message); }
    setSaving(false);
  };

  const deleteUser = async (u) => {
    try {
      await api.delete(`/auth/users/${u.id}`);
      reload(); setConfirmDel(null);
    } catch(e) { alert(e.message); }
  };

  return (
    <div>
      <SectionHeader title={`Personnel (${allUsers.length})`} action={<ActionBtn onClick={reload}>↻ Refresh</ActionBtn>} />

      {/* Role filter pills */}
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
        {ROLE_FILTERS.map(f => {
          const count = f.id === 'all' ? allUsers.length : allUsers.filter(u=>u.role===f.id).length;
          const active = roleFilter === f.id;
          return (
            <button key={f.id} onClick={()=>setRoleFilter(f.id)}
              style={{padding:'5px 12px',borderRadius:20,border:`1px solid ${active?C.primary:C.border}`,
                background:active?`${C.primary}25`:'transparent',
                color:active?C.accent:C.muted,cursor:'pointer',fontSize:11,fontWeight:active?700:400,
                display:'flex',gap:5,alignItems:'center'}}>
              {f.label}
              <span style={{fontSize:10,opacity:0.7}}>({count})</span>
            </button>
          );
        })}
      </div>

      {error && <ErrorBox msg={error} onRetry={reload}/>}

      <Table loading={loading} data={users} cols={[
        {key:'name',         label:'NAME',    render:v=><span style={{fontWeight:700,color:C.bright}}>{v}</span>},
        {key:'email',        label:'EMAIL',   render:v=>v||'—'},
        {key:'phone_number', label:'PHONE',   render:v=>v||'—'},
        {key:'role',         label:'ROLE',    render:v=>(
          <span style={{fontSize:11,fontWeight:700,color:ROLE_COLORS[v]||C.muted,textTransform:'uppercase',
            padding:'2px 7px',borderRadius:4,background:`${ROLE_COLORS[v]||C.muted}18`,border:`1px solid ${ROLE_COLORS[v]||C.muted}30`}}>
            {v?.replace('_',' ')}
          </span>
        )},
        {key:'sub_admin_scope', label:'SCOPE', render:v=>v?<span style={{fontSize:11,color:C.accent}}>{SCOPE_LABELS[v]||v}</span>:'—'},
        {key:'state',        label:'STATE',   render:v=>v||'—'},
        {key:'is_verified',  label:'STATUS',  render:v=><span style={{color:v?C.success:C.muted,fontSize:11,fontWeight:700}}>{v?'✓ Verified':'Pending'}</span>},
        {key:'created_at',   label:'JOINED',  render:v=>v?new Date(v).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'}):'—'},
      ]} actions={isAdmin ? u=>(
        <div style={{display:'flex',gap:5}}>
          <ActionBtn small onClick={()=>openRole(u)}>Role</ActionBtn>
          <ActionBtn small color={C.danger} onClick={()=>setConfirmDel(u)}>Delete</ActionBtn>
        </div>
      ) : null} empty="No users match this filter." />

      {/* Role assignment modal */}
      {modal && (
        <Modal title={`Edit User — ${modal.name}`} onClose={()=>setModal(null)}>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{padding:'10px 12px',background:C.s2,borderRadius:8,border:`1px solid ${C.border}`,fontSize:12}}>
              <div style={{fontWeight:700,color:C.bright,marginBottom:2}}>{modal.name}</div>
              <div style={{color:C.muted}}>{modal.email||modal.phone_number} · {modal.state||'No state'}</div>
            </div>
            <FormField label="Assign Role">
              <Sel value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value,sub_admin_scope:e.target.value==='sub_admin'?p.sub_admin_scope:''}))}>
                <option value="citizen">Citizen</option>
                <option value="vanguard">Flood Marshal (Vanguard)</option>
                <option value="nihsa_staff">NIHSA Staff</option>
                <option value="government">Government</option>
                <option value="sub_admin">Sub-Admin</option>
                <option value="admin">Super Admin</option>
              </Sel>
            </FormField>
            {form.role === 'sub_admin' && (
              <FormField label="Admin Scope (which section they manage)">
                <Sel value={form.sub_admin_scope} onChange={e=>setForm(p=>({...p,sub_admin_scope:e.target.value}))}>
                  <option value="">— Select scope —</option>
                  {Object.entries(SCOPE_LABELS).map(([k,v])=>(
                    <option key={k} value={k}>{v}</option>
                  ))}
                </Sel>
              </FormField>
            )}
            {err && <ErrorBox msg={err} />}
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <ActionBtn onClick={()=>setModal(null)}>Cancel</ActionBtn>
              <ActionBtn color={C.primary} onClick={saveRole}
                disabled={saving||(form.role==='sub_admin'&&!form.sub_admin_scope)}>
                {saving?'Saving…':'Save Role'}
              </ActionBtn>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      {confirmDel && (
        <Modal title="Delete User" onClose={()=>setConfirmDel(null)}>
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <div style={{padding:'12px',background:`${C.danger}12`,border:`1px solid ${C.danger}30`,borderRadius:8,fontSize:13,color:C.text}}>
              Are you sure you want to permanently delete <strong style={{color:C.bright}}>{confirmDel.name}</strong>?
              This cannot be undone.
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <ActionBtn onClick={()=>setConfirmDel(null)}>Cancel</ActionBtn>
              <ActionBtn color={C.danger} onClick={()=>deleteUser(confirmDel)}>Delete Permanently</ActionBtn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── LOGIN PAGE ────────────────────────────────────────────────────────────────
const LoginPage = ({ onAuth }) => {
  const [email, setEmail] = useState('admin@nihsa.gov.ng');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const attemptsRef = useRef(0);
  const lockUntilRef = useRef(0);

  const submit = async () => {
    const now = Date.now();
    if (now < lockUntilRef.current) {
      const wait = Math.ceil((lockUntilRef.current - now) / 1000);
      setErr(`Too many attempts. Account locked for ${wait} more seconds.`);
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr('Please enter a valid email address.'); return;
    }
    if (!password || password.length < 6) {
      setErr('Password is required.'); return;
    }
    setErr(''); setLoading(true);
    try {
      await api.login(email, password);
      onAuth();
    } catch(e) {
      attemptsRef.current += 1;
      if (attemptsRef.current >= 5) {
        lockUntilRef.current = Date.now() + 60000; // 60s lockout for admin
        attemptsRef.current = 0;
        setErr('Too many failed attempts. Access locked for 60 seconds.');
      } else {
        setErr('Incorrect email or password.');
      }
    }
    setLoading(false);
  };

  return (
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:40,width:380,maxWidth:'100%'}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{width:56,height:56,borderRadius:14,background:`linear-gradient(135deg,${C.primary},${C.info})`,margin:'0 auto 16px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26}}>🌊</div>
          <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:22,fontWeight:700,color:C.bright,letterSpacing:'0.04em'}}>NIHSA ADMIN</div>
          <div style={{fontSize:12,color:C.muted,marginTop:4}}>National Flood Intelligence Platform</div>
          <div style={{fontSize:11,color:C.muted,marginTop:2}}>Authorised Personnel Only</div>
        </div>

        <div style={{marginBottom:12}}>
          <label style={{fontSize:11,color:C.muted,fontWeight:700,display:'block',marginBottom:5}}>EMAIL ADDRESS</label>
          <Inp type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" />
        </div>
        <div style={{marginBottom:20}}>
          <label style={{fontSize:11,color:C.muted,fontWeight:700,display:'block',marginBottom:5}}>PASSWORD</label>
          <Inp type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} autoComplete="current-password" />
        </div>

        {err && <div style={{color:'#FCA5A5',fontSize:13,marginBottom:12,padding:'10px 12px',background:'#EF444420',borderRadius:6,border:'1px solid #EF444440'}}>{err}</div>}

        <button onClick={submit} disabled={loading} style={{width:'100%',padding:12,background:`linear-gradient(135deg,${C.primary},#0284C7)`,border:'none',borderRadius:8,color:'#fff',fontSize:14,fontWeight:700,cursor:loading?'not-allowed':'pointer',opacity:loading?0.7:1}}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        
      </div>
    </div>
  );
};

// ─── MAP LAYERS SECTION ────────────────────────────────────────────────────────
const GROUP_META = {
  surface_water:    {icon:'🌊', label:'Surface Water'},
  groundwater:      {icon:'🔵', label:'Groundwater'},
  water_quality:    {icon:'🧪', label:'Water Quality'},
  coastal_marine:   {icon:'🏖️', label:'Coastal & Marine'},
  forecast:         {icon:'📊', label:'Annual Forecast — AFO 2026'},
  forecast_weekly:  {icon:'📅', label:'Weekly Forecast'},
};

const MapLayersSection = ({ scopeFilter = null }) => {
  const [layers, setLayers]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(null);
  const [showAdd, setShowAdd]     = useState(false);
  const [editing, setEditing]     = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [uploading, setUploading] = useState({});   // layerId → true/false
  const [uploadMsg, setUploadMsg] = useState({});   // layerId → {ok, text}
  const [newLayer, setNewLayer]   = useState({
    name:'', group_key:'surface_water', layer_key:'', description:'',
    layer_type:'toggle', source_url:'', icon:'🗺️', is_active:true, default_visible:false,
  });

  const token = localStorage.getItem('nihsa_token');
  const headers = {'Content-Type':'application/json', Authorization: token ? `Bearer ${token}` : ''};

  const [syncing, setSyncing] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(API_BASE + '/map-layers/all', {headers})
      .then(r=>r.ok?r.json():[])
      .then(d=>{setLayers(d);setLoading(false);})
      .catch(()=>setLoading(false));
  };

  const syncFiles = async () => {
    setSyncing(true);
    await fetch(API_BASE + '/map-layers/sync-files', {method:'POST', headers});
    setSyncing(false);
    load();
  };

  useEffect(() => { load(); syncFiles(); }, []);

  const toggleField = async (layer, field) => {
    setSaving(layer.id + field);
    await fetch(API_BASE + `/map-layers/${layer.id}`, {
      method:'PATCH', headers,
      body: JSON.stringify({[field]: !layer[field]}),
    });
    setSaving(null);
    load();
  };

  const saveEdit = async (id) => {
    setSaving(id + 'edit');
    await fetch(API_BASE + `/map-layers/${id}`, {
      method:'PATCH', headers,
      body: JSON.stringify(editDraft),
    });
    setSaving(null);
    setEditing(null);
    load();
  };

  const addLayer = async () => {
    if (!newLayer.name || !newLayer.layer_key) return;
    await fetch(API_BASE + '/map-layers', {method:'POST', headers, body:JSON.stringify(newLayer)});
    setShowAdd(false);
    setNewLayer({name:'',group_key:'surface_water',layer_key:'',description:'',layer_type:'toggle',source_url:'',icon:'🗺️',is_active:true,default_visible:false});
    load();
  };

  const deleteLayer = async (id) => {
    if (!window.confirm('Delete this layer?')) return;
    await fetch(API_BASE + `/map-layers/${id}`, {method:'DELETE', headers});
    load();
  };

  const uploadLayerFile = async (layerId, file) => {
    const addMessage = (layerId, text, isError = false) => {
      setUploadMsg(prev => {
        const existing = prev[layerId] || { ok: true, text: '', history: [] };
        const history = existing.history || [];
        const timestamp = new Date().toLocaleTimeString();
        history.push({ text, isError, timestamp });
        while (history.length > 10) history.shift();
        return {
          ...prev,
          [layerId]: { ok: !isError, text: text, history: history }
        };
      });
    };
    
    setUploadMsg(prev => ({
      ...prev,
      [layerId]: { ok: true, text: 'Starting upload...', history: [] }
    }));
    
    addMessage(layerId, `🔵 START: ${file?.name || 'unknown'} (${Math.round(file?.size/1024 || 0)} KB)`);
    setUploading(p=>({...p,[layerId]:true}));
    
    const isZip = file.name.toLowerCase().endsWith('.zip');

    // CSV → read as text. ZIP → read as base64 (binary-safe for JSON transport)
    let fileContent;
    if (isZip) {
      addMessage(layerId, `📦 ZIP detected — reading as base64...`);
      fileContent = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result.split(',')[1]); // strip data: prefix
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      addMessage(layerId, `📦 Base64 encoded (${Math.round(fileContent.length / 1024)} KB encoded)`);
    } else {
      fileContent = await file.text();
    }
    
    addMessage(layerId, `🌐 URL: ${API_BASE}/map-layers/${layerId}/upload`);
    addMessage(layerId, `🔑 Token: ${api.token() ? '✓ Present' : '✗ MISSING!'}`);
    addMessage(layerId, `📡 Sending POST request...`);
    
    try {
      const startTime = Date.now();
      
      const response = await api.post(`/map-layers/${layerId}/upload`, {
        filename: file.name,
        content: fileContent,
        encoding: isZip ? 'base64' : 'utf8',
      });
      
      const elapsed = Date.now() - startTime;
      addMessage(layerId, `📡 Response received in ${elapsed}ms`);
      
      if (response && response.success !== false) {
        addMessage(layerId, `✅ SUCCESS! ${response.feature_count?.toLocaleString() || '?'} features · ${response.size_kb || '?'} KB`);
        addMessage(layerId, `✅ ${response.message || 'Upload complete!'}`);
        load();
      } else {
        addMessage(layerId, `❌ ERROR: ${response?.detail || response?.message || 'Upload failed'}`, true);
      }
    } catch(err) {
      addMessage(layerId, `❌ ERROR: ${err.message || 'Unknown error'}`, true);
    }
    
    addMessage(layerId, `🏁 Finished at ${new Date().toLocaleTimeString()}`);
    setUploading(p=>({...p,[layerId]:false}));
  };

  const byGroup = layers.reduce((acc, l) => {
    acc[l.group_key] = acc[l.group_key] || [];
    acc[l.group_key].push(l);
    return acc;
  }, {});

  const Tog = ({on, spin}) => spin
    ? <Spinner size={14}/>
    : (
      <span style={{display:'inline-flex',width:34,height:18,borderRadius:9,
        background:on?C.primary:C.border,alignItems:'center',
        justifyContent:on?'flex-end':'flex-start',padding:'0 2px',
        transition:'background 0.2s',cursor:'pointer',flexShrink:0}}>
        <span style={{width:14,height:14,borderRadius:'50%',background:'#fff',boxShadow:'0 1px 3px #0004'}}/>
      </span>
    );

  const FieldInput = ({label, val, onChange, mono}) => (
    <label style={{display:'flex',flexDirection:'column',gap:3}}>
      <span style={{fontSize:10,color:C.muted,textTransform:'uppercase',letterSpacing:'0.5px'}}>{label}</span>
      <input value={val} onChange={e=>onChange(e.target.value)}
        style={{padding:'6px 9px',background:C.s3,border:`1px solid ${C.border}`,borderRadius:6,
          color:C.bright,fontSize:12,outline:'none',fontFamily:mono?'monospace':'inherit'}}/>
    </label>
  );

  if (loading) return <div style={{padding:40,textAlign:'center'}}><Spinner size={28}/></div>;

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
        <div>
          <div style={{fontSize:17,fontWeight:700,color:C.bright}}>Map Layer Catalogue</div>
          <div style={{fontSize:12,color:C.muted,marginTop:4}}>
            {layers.length} layers across {Object.keys(byGroup).length} groups — toggle active state and default visibility per layer.
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={syncFiles} disabled={syncing}
            style={{padding:'8px 14px',background:'none',border:`1px solid ${C.border}`,borderRadius:8,
              color:C.muted,fontSize:12,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',
              opacity:syncing?0.6:1}}>
            {syncing?'Syncing…':'↻ Sync Files'}
          </button>
          {!scopeFilter && (
            <button onClick={()=>setShowAdd(p=>!p)}
              style={{padding:'8px 18px',background:C.primary,border:'none',borderRadius:8,
                color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>
              + Add Layer
            </button>
          )}
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{background:C.s2,border:`1px solid ${C.primary}40`,borderRadius:12,padding:20,marginBottom:28}}>
          <div style={{fontSize:13,fontWeight:700,color:C.bright,marginBottom:14}}>New Layer</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10}}>
            <FieldInput label="Name *" val={newLayer.name} onChange={v=>setNewLayer(p=>({...p,name:v}))}/>
            <FieldInput label="Layer Key *" val={newLayer.layer_key} onChange={v=>setNewLayer(p=>({...p,layer_key:v}))} mono/>
            <FieldInput label="Icon" val={newLayer.icon} onChange={v=>setNewLayer(p=>({...p,icon:v}))}/>
            <FieldInput label="Source URL" val={newLayer.source_url} onChange={v=>setNewLayer(p=>({...p,source_url:v}))} mono/>
            <label style={{display:'flex',flexDirection:'column',gap:3}}>
              <span style={{fontSize:10,color:C.muted,textTransform:'uppercase',letterSpacing:'0.5px'}}>Group</span>
              <select value={newLayer.group_key} onChange={e=>setNewLayer(p=>({...p,group_key:e.target.value}))}
                style={{padding:'6px 9px',background:C.s3,border:`1px solid ${C.border}`,borderRadius:6,color:C.bright,fontSize:12,outline:'none'}}>
                {Object.entries(GROUP_META).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </label>
            <label style={{display:'flex',flexDirection:'column',gap:3}}>
              <span style={{fontSize:10,color:C.muted,textTransform:'uppercase',letterSpacing:'0.5px'}}>Type</span>
              <select value={newLayer.layer_type} onChange={e=>setNewLayer(p=>({...p,layer_type:e.target.value}))}
                style={{padding:'6px 9px',background:C.s3,border:`1px solid ${C.border}`,borderRadius:6,color:C.bright,fontSize:12,outline:'none'}}>
                {['toggle','geojson_fc','geojson','atlas','wms'].map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          </div>
          <label style={{display:'block',marginTop:10}}>
            <span style={{fontSize:10,color:C.muted,textTransform:'uppercase',letterSpacing:'0.5px'}}>Description</span>
            <input value={newLayer.description} onChange={e=>setNewLayer(p=>({...p,description:e.target.value}))}
              style={{display:'block',width:'100%',marginTop:3,padding:'6px 9px',background:C.s3,border:`1px solid ${C.border}`,
                borderRadius:6,color:C.bright,fontSize:12,outline:'none',boxSizing:'border-box'}}/>
          </label>
          <div style={{display:'flex',gap:8,marginTop:14}}>
            <button onClick={addLayer}
              style={{padding:'7px 20px',background:C.primary,border:'none',borderRadius:7,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>
              Save Layer
            </button>
            <button onClick={()=>setShowAdd(false)}
              style={{padding:'7px 14px',background:'none',border:`1px solid ${C.border}`,borderRadius:7,color:C.muted,fontSize:12,cursor:'pointer'}}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Groups + individual layer cards */}
      {Object.entries(GROUP_META).filter(([gk]) => !scopeFilter || gk === scopeFilter).map(([gk, gm]) => {
        const glayers = byGroup[gk] || [];
        return (
          <div key={gk} style={{marginBottom:32}}>
            {/* Group header */}
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,
              paddingBottom:10,borderBottom:`2px solid ${C.border}`}}>
              <span style={{fontSize:20}}>{gm.icon}</span>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:C.bright}}>{gm.label}</div>
                <div style={{fontSize:11,color:C.muted}}>{glayers.length} layer{glayers.length!==1?'s':''}</div>
              </div>
            </div>

            {glayers.length === 0 && (
              <div style={{fontSize:12,color:C.muted,padding:'10px 14px',background:C.s2,borderRadius:8,
                border:`1px dashed ${C.border}`}}>No layers defined for this group.</div>
            )}

            {/* Each layer = its own card */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:14}}>
              {glayers.map(l => {
                const isEditing = editing === l.id;
                const isSavingEdit = saving === l.id+'edit';
                return (
                  <div key={l.id} style={{
                    background:C.s2,
                    border:`1px solid ${l.is_active ? C.border : '#EF444430'}`,
                    borderLeft:`4px solid ${l.is_active ? C.primary : '#EF4444'}`,
                    borderRadius:10,
                    padding:16,
                    display:'flex',
                    flexDirection:'column',
                    gap:12,
                    opacity: l.is_active ? 1 : 0.7,
                  }}>

                    {/* Card top: icon + name + status badge */}
                    <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                      <span style={{fontSize:22,flexShrink:0,lineHeight:1}}>{l.icon}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:700,color:C.bright,lineHeight:1.3}}>{l.name}</div>
                        <div style={{display:'flex',gap:6,marginTop:4,flexWrap:'wrap'}}>
                          <span style={{fontSize:10,padding:'1px 7px',borderRadius:4,fontWeight:600,
                            background:`${C.primary}20`,color:C.primary}}>{l.layer_type}</span>
                          <span style={{fontSize:10,padding:'1px 7px',borderRadius:4,fontWeight:600,
                            background: l.is_active?`${C.success||'#10B981'}20`:`${C.danger}20`,
                            color: l.is_active?C.success||'#10B981':C.danger}}>
                            {l.is_active?'Active':'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Fields — view or edit */}
                    {!isEditing ? (
                      <div style={{display:'flex',flexDirection:'column',gap:6}}>
                        <div style={{fontSize:11,color:C.muted,display:'flex',gap:6,alignItems:'baseline'}}>
                          <span style={{color:C.muted,flexShrink:0}}>Key:</span>
                          <span style={{fontFamily:'monospace',color:C.bright,fontSize:11,wordBreak:'break-all'}}>{l.layer_key}</span>
                        </div>
                        {l.description && (
                          <div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>{l.description}</div>
                        )}
                        {l.source_url && (
                          <div style={{fontSize:10,color:C.muted,display:'flex',gap:6,alignItems:'baseline'}}>
                            <span style={{flexShrink:0}}>URL:</span>
                            <span style={{fontFamily:'monospace',color:C.primary,wordBreak:'break-all'}}>{l.source_url}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{display:'flex',flexDirection:'column',gap:8}}>
                        <FieldInput label="Name" val={editDraft.name??l.name} onChange={v=>setEditDraft(p=>({...p,name:v}))}/>
                        <FieldInput label="Icon" val={editDraft.icon??l.icon} onChange={v=>setEditDraft(p=>({...p,icon:v}))}/>
                        <FieldInput label="Description" val={editDraft.description??l.description} onChange={v=>setEditDraft(p=>({...p,description:v}))}/>
                        <FieldInput label="Source URL" val={editDraft.source_url??l.source_url} onChange={v=>setEditDraft(p=>({...p,source_url:v}))} mono/>
                        <label style={{display:'flex',flexDirection:'column',gap:3}}>
                          <span style={{fontSize:10,color:C.muted,textTransform:'uppercase',letterSpacing:'0.5px'}}>Type</span>
                          <select value={editDraft.layer_type??l.layer_type} onChange={e=>setEditDraft(p=>({...p,layer_type:e.target.value}))}
                            style={{padding:'6px 9px',background:C.s3,border:`1px solid ${C.border}`,borderRadius:6,color:C.bright,fontSize:12,outline:'none'}}>
                            {['toggle','geojson_fc','geojson','atlas','wms'].map(t=><option key={t} value={t}>{t}</option>)}
                          </select>
                        </label>
                      </div>
                    )}

                    {/* Data file status + CSV upload */}
                    {(() => {
                      const meta = l.meta || {};
                      const hasData = !!meta.data_file;
                      const uploadedAt = meta.uploaded_at
                        ? new Date(meta.uploaded_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})
                        : null;
                      const msg = uploadMsg[l.id];
                      const isUp = uploading[l.id];
                      // Only show upload UI for layers that accept CSV
                      const uploadable = ['geojson_fc','geojson'].includes(l.layer_type);
                      if (!uploadable) return null;
                      
                      return (
                        <div style={{background:C.s3,borderRadius:8,padding:'10px 12px',display:'flex',flexDirection:'column',gap:8}}>
                          
                          {/* Status row - shows file info */}
                          <div style={{display:'flex',alignItems:'flex-start',gap:8}}>
                            <div style={{flex:1,minWidth:0}}>
                              {hasData ? (
                                <div style={{fontSize:11,color:'#10B981',display:'flex',flexWrap:'wrap',gap:6,alignItems:'center'}}>
                                  <span>📂</span>
                                  <span style={{fontFamily:'monospace'}}>{meta.data_file}</span>
                                  <span style={{color:C.muted}}>{(meta.feature_count||0).toLocaleString()} rows</span>
                                  <span style={{color:C.muted}}>·</span>
                                  <span style={{color:C.muted}}>{meta.file_size_kb||0} KB</span>
                                  {uploadedAt && <><span style={{color:C.muted}}>·</span><span style={{color:C.muted}}>{uploadedAt}</span></>}
                                  {(meta.rows_skipped||0) > 0 && (
                                    <span style={{color:C.warning,fontSize:10}}>⚠ {meta.rows_skipped} rows skipped (bad coords)</span>
                                  )}
                                  {meta.source_type === 'shapefile' && (
                                    <span style={{color:C.primary,fontSize:10,padding:'1px 5px',borderRadius:3,background:`${C.primary}20`}}>SHP→GeoJSON</span>
                                  )}
                                </div>
                              ) : (
                                <div style={{fontSize:11,color:C.muted}}>No data uploaded yet — upload a CSV or Shapefile ZIP to add data</div>
                              )}
                            </div>
                          </div>
                          
                          {/* Message log */}
                          {msg && (
                            <div style={{
                              background: msg.ok ? `${C.success}15` : `${C.danger}15`,
                              border: `1px solid ${msg.ok ? C.success : C.danger}30`,
                              borderRadius: 8, padding: '8px 10px', marginTop: 4,
                              fontSize: 10, fontFamily: 'monospace'
                            }}>
                              <div style={{color: msg.ok ? C.success : C.danger, fontWeight:'bold',
                                marginBottom: msg.history?.length ? 6 : 0,
                                paddingBottom: msg.history?.length ? 6 : 0,
                                borderBottom: msg.history?.length ? `1px solid ${C.border}` : 'none'}}>
                                📍 NOW: {msg.text}
                              </div>
                              {msg.history && msg.history.length > 0 && (
                                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                  {msg.history.map((historyItem, idx) => (
                                    <div key={idx} style={{display:'flex',gap:8,padding:'3px 0',
                                      borderBottom: idx < msg.history.length - 1 ? `1px solid ${C.border}30` : 'none',
                                      fontSize:9, color: historyItem.isError ? C.danger : C.text}}>
                                      <span style={{color:C.muted,width:'60px',flexShrink:0}}>{historyItem.timestamp}</span>
                                      <span style={{flex:1,wordBreak:'break-word'}}>{historyItem.text}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Action buttons */}
                          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                            {/* Template download */}
                            <a href={`/api/map-layers/${l.id}/template`}
                              style={{display:'inline-block',padding:'5px 12px',
                                background:'none',border:`1px solid ${C.border}`,borderRadius:6,
                                color:C.muted,fontSize:11,fontWeight:600,textDecoration:'none',flexShrink:0}}>
                              ⬇ CSV Template
                            </a>
                            
                            {/* CSV upload */}
                            <label style={{cursor:isUp?'default':'pointer',flexShrink:0}}>
                              <input type="file" accept=".csv"
                                style={{display:'none'}} disabled={isUp}
                                onChange={e=>{
                                  const f = e.target.files?.[0];
                                  if(f) uploadLayerFile(l.id, f);
                                  e.target.value='';
                                }}/>
                              <span style={{display:'inline-block',padding:'5px 14px',
                                background:isUp?`${C.primary}20`:C.primary,
                                border:'none',borderRadius:6,color:'#fff',fontSize:11,fontWeight:700,
                                opacity:isUp?0.6:1}}>
                                {isUp ? 'Uploading…' : '⬆ Upload CSV'}
                              </span>
                            </label>

                            {/* Shapefile ZIP upload */}
                            <label style={{cursor:isUp?'default':'pointer',flexShrink:0}}>
                              <input type="file" accept=".zip,application/zip,application/x-zip-compressed,application/octet-stream"
                                style={{display:'none'}} disabled={isUp}
                                onChange={e=>{
                                  const f = e.target.files?.[0];
                                  if(f) uploadLayerFile(l.id, f);
                                  e.target.value='';
                                }}/>
                              <span style={{display:'inline-block',padding:'5px 14px',
                                background:isUp?`${C.warning}20`:`${C.warning}DD`,
                                border:'none',borderRadius:6,color:'#fff',fontSize:11,fontWeight:700,
                                opacity:isUp?0.6:1}}>
                                {isUp ? 'Uploading…' : '🗺 Upload Shapefile (.zip)'}
                              </span>
                            </label>
                          </div>
                          
                          {/* Format hints */}
                          <div style={{fontSize:10,color:C.muted,lineHeight:1.6,background:C.s2,borderRadius:6,padding:'8px 10px'}}>
                            <div><strong style={{color:C.text}}>CSV:</strong> Must have <code style={{background:C.bg,padding:'1px 4px',borderRadius:3,color:C.bright}}>lat</code> and <code style={{background:C.bg,padding:'1px 4px',borderRadius:3,color:C.bright}}>lon</code> columns. Download template above.</div>
                            <div style={{marginTop:4}}><strong style={{color:C.text}}>Shapefile ZIP:</strong> ZIP containing <code style={{background:C.bg,padding:'1px 4px',borderRadius:3,color:C.bright}}>.shp</code> <code style={{background:C.bg,padding:'1px 4px',borderRadius:3,color:C.bright}}>.shx</code> <code style={{background:C.bg,padding:'1px 4px',borderRadius:3,color:C.bright}}>.dbf</code> (and optionally <code style={{background:C.bg,padding:'1px 4px',borderRadius:3,color:C.bright}}>.prj</code>). Supports Points, Polygons, MultiPolygons — auto-converted to GeoJSON.</div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Toggles row */}
                    <div style={{display:'flex',gap:14,alignItems:'center',
                      paddingTop:10,borderTop:`1px solid ${C.border}`}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer'}}
                        onClick={()=>toggleField(l,'is_active')}>
                        <Tog on={l.is_active} spin={saving===l.id+'is_active'}/>
                        <span style={{fontSize:11,color:C.muted}}>Active</span>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer'}}
                        onClick={()=>toggleField(l,'default_visible')}>
                        <Tog on={l.default_visible} spin={saving===l.id+'default_visible'}/>
                        <span style={{fontSize:11,color:C.muted}}>Default visible</span>
                      </div>
                      <div style={{flex:1}}/>
                      {/* Edit / Save / Delete */}
                      {!isEditing ? (
                        <>
                          <button onClick={()=>{setEditing(l.id);setEditDraft({});}}
                            style={{padding:'4px 12px',background:`${C.primary}18`,border:`1px solid ${C.primary}40`,
                              borderRadius:6,color:C.primary,fontSize:11,fontWeight:600,cursor:'pointer'}}>
                            Edit
                          </button>
                          <button onClick={()=>deleteLayer(l.id)}
                            style={{padding:'4px 10px',background:`${C.danger}18`,border:`1px solid ${C.danger}30`,
                              borderRadius:6,color:C.danger,fontSize:11,fontWeight:700,cursor:'pointer'}}>
                            ✕
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={()=>saveEdit(l.id)} disabled={isSavingEdit}
                            style={{padding:'4px 14px',background:C.primary,border:'none',
                              borderRadius:6,color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer',
                              opacity:isSavingEdit?0.6:1}}>
                            {isSavingEdit?'Saving…':'Save'}
                          </button>
                          <button onClick={()=>setEditing(null)}
                            style={{padding:'4px 10px',background:'none',border:`1px solid ${C.border}`,
                              borderRadius:6,color:C.muted,fontSize:11,cursor:'pointer'}}>
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── MAIN ADMIN APP ────────────────────────────────────────────────────────────

// ─── ML INTELLIGENCE SECTION ──────────────────────────────────────────────────
const MLIntelSection = () => {
  const [summary, setSummary]       = useState(null);
  const [thresholds, setThresholds] = useState([]);
  const [bulletin, setBulletin]     = useState(null);
  const [status, setStatus]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('status');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(API_BASE + '/forecast/ml/status').then(r=>r.ok?r.json():null).catch(()=>null),
      fetch(API_BASE + '/forecast/ml/summary').then(r=>r.ok?r.json():null).catch(()=>null),
      fetch(API_BASE + '/forecast/ml/thresholds').then(r=>r.ok?r.json():null).catch(()=>null),
      fetch(API_BASE + '/forecast/ml/bulletin').then(r=>r.ok?r.json():null).catch(()=>null),
    ]).then(([st, sm, th, bu]) => {
      setStatus(st);
      setSummary(sm);
      setThresholds(th?.thresholds || []);
      setBulletin(bu?.bulletin || null);
      setLoading(false);
    });
  }, []);

  const LEVEL_COLOR = {NONE:'#10B981',WATCH:'#EAB308',WARNING:'#F97316',SEVERE:'#EF4444',EXTREME:'#7C3AED'};
  const LEVEL_BG    = {NONE:'#10B98118',WATCH:'#EAB30818',WARNING:'#F9731618',SEVERE:'#EF444418',EXTREME:'#7C3AED18'};

  if (loading) return <div style={{padding:40,textAlign:'center'}}><Spinner size={32}/></div>;

  return (
    <div style={{padding:20}}>
      <SectionHeader title="🤖 ML Intelligence — NFFS Integration" />

      {/* Status banner */}
      {status && (
        <div style={{marginBottom:20,padding:'12px 16px',
          background: status.mode==='live'?(status.stale?'#F9731618':'#10B98118'):'#EAB30818',
          border:`1px solid ${status.mode==='live'?(status.stale?C.warning:C.success):C.warning}`,
          borderRadius:10,display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:20}}>{status.mode==='live'?(status.stale?'⚠️':'🟢'):'🟡'}</span>
          <div>
            <div style={{fontWeight:700,color:C.bright,fontSize:13}}>
              {status.mode==='live'
                ? (status.stale ? `STALE — Last updated ${status.age_hours?.toFixed(1)}h ago` : `LIVE — ${status.file} · Updated ${status.age_hours?.toFixed(1)}h ago`)
                : 'SIMULATION MODE — No NFFS output files detected'}
            </div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>
              {status.mode==='live'
                ? `Path: ${status.path}`
                : `Run: python src/run_all.py --mode forecast-weekly  to generate live output`}
            </div>
          </div>
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{display:'flex',gap:4,marginBottom:20,background:C.s2,padding:4,borderRadius:10,border:`1px solid ${C.border}`}}>
        {[
          ['status',     '📊 Alert Summary'],
          ['technical',  '🔬 Technical Metrics'],
          ['thresholds', '📐 Flood Thresholds'],
          ['bulletin',   '📋 WMO Bulletin'],
        ].map(([id,label]) => (
          <button key={id} onClick={()=>setActiveTab(id)}
            style={{flex:1,padding:'7px',borderRadius:7,border:'none',cursor:'pointer',
              fontSize:12,fontWeight:600,transition:'all 0.2s',
              background:activeTab===id?C.primary:'transparent',
              color:activeTab===id?'#fff':C.muted}}>
            {label}
          </button>
        ))}
      </div>

      {/* Alert Summary */}
      {activeTab==='status' && summary && (
        <div>
          {/* Level count cards */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:20}}>
            {['NONE','WATCH','WARNING','SEVERE','EXTREME'].map(lvl => (
              <div key={lvl} style={{padding:'14px',background:LEVEL_BG[lvl],
                border:`1px solid ${LEVEL_COLOR[lvl]}30`,borderRadius:10,textAlign:'center'}}>
                <div style={{fontSize:22,fontWeight:800,color:LEVEL_COLOR[lvl]}}>
                  {summary.level_counts?.[lvl] ?? 0}
                </div>
                <div style={{fontSize:10,color:C.muted,marginTop:4,fontWeight:700,letterSpacing:'0.05em'}}>
                  {lvl}
                </div>
              </div>
            ))}
          </div>

          {/* Lagdo status */}
          <div style={{marginBottom:16,padding:'10px 14px',
            background: summary.lagdo_active?'#7C3AED18':'#10B98118',
            border:`1px solid ${summary.lagdo_active?'#7C3AED':'#10B981'}`,
            borderRadius:8,display:'flex',alignItems:'center',gap:10,fontSize:13}}>
            <span style={{fontSize:18}}>{summary.lagdo_active?'⚡':'✅'}</span>
            <span style={{color:C.bright,fontWeight:600}}>
              Lagdo Dam Cascade: {summary.lagdo_active ? 'ACTIVE — Downstream escalation in effect' : 'Not triggered'}
            </span>
          </div>

          {/* Top alerts table */}
          {summary.top_alerts?.length > 0 && (
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead>
                  <tr style={{background:C.s2}}>
                    {['Station','River','State','NFFS Level','Q50 (m³/s)','Q05','Q95','Peak Day','Action'].map(h=>(
                      <th key={h} style={{padding:'9px 12px',textAlign:'left',color:C.muted,
                        fontSize:10,fontWeight:700,letterSpacing:'0.05em',whiteSpace:'nowrap'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(summary.top_alerts||[]).map((a,i)=>(
                    <tr key={i} style={{borderTop:`1px solid ${C.border}`}}>
                      <td style={{padding:'9px 12px',fontWeight:700,color:C.bright}}>{a.station_name}</td>
                      <td style={{padding:'9px 12px',color:C.muted}}>{a.river}</td>
                      <td style={{padding:'9px 12px',color:C.muted}}>{a.state}</td>
                      <td style={{padding:'9px 12px'}}>
                        <span style={{padding:'2px 8px',borderRadius:8,fontSize:11,fontWeight:700,
                          background:LEVEL_BG[a.nffs_level],color:LEVEL_COLOR[a.nffs_level]}}>
                          {a.nffs_level}
                        </span>
                      </td>
                      <td style={{padding:'9px 12px',color:C.bright,fontWeight:600}}>{a.q50?.toLocaleString()}</td>
                      <td style={{padding:'9px 12px',color:C.muted}}>{a.q05?.toLocaleString()}</td>
                      <td style={{padding:'9px 12px',color:C.muted}}>{a.q95?.toLocaleString()}</td>
                      <td style={{padding:'9px 12px',color:C.muted}}>Day {a.peak_day}</td>
                      <td style={{padding:'9px 12px',color:C.text,maxWidth:200,fontSize:11}}>{a.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Technical Metrics */}
      {activeTab==='technical' && summary && (
        <div>
          <div style={{marginBottom:16,padding:'12px 16px',background:C.s2,
            border:`1px solid ${C.border}`,borderRadius:10}}>
            <div style={{fontSize:13,fontWeight:700,color:C.bright,marginBottom:8}}>NFFS Model Information</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10}}>
              {[
                ['Model Architecture','HBV-96 Physics + Two-Stage LSTM + XGBoost Ensemble'],
                ['Training Period','1981–2026 (45 years)'],
                ['Feature Count','57 hydrometeorological features'],
                ['Forecast Horizon','7 days (168 hours)'],
                ['Output Quantiles','Q05 / Q50 / Q95 (5th, 50th, 95th percentile)'],
                ['Alert Thresholds','Flood frequency analysis: Watch=2yr, Warning=5yr, Severe=10yr, Extreme=25yr'],
                ['Distribution Fitting','LP3 (WMO standard), GEV, Gumbel — best AIC selected'],
                ['Calibration','NSE + log-NSE composite loss (Commandment #1)'],
                ['Stations','358 NIHSA hydrometric stations'],
                ['Data Source',status?.mode==='live'?'LIVE NFFS output':'Simulation'],
              ].map(([k,v])=>(
                <div key={k} style={{padding:'10px',background:C.bg,borderRadius:8,border:`1px solid ${C.border}`}}>
                  <div style={{fontSize:10,color:C.muted,fontWeight:700,letterSpacing:'0.05em',marginBottom:4}}>{k.toUpperCase()}</div>
                  <div style={{fontSize:12,color:C.bright,lineHeight:1.4}}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 7-day horizon skill decay */}
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:16,marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:C.bright,marginBottom:12}}>
              Forecast Skill Decay — h+1 → h+7
            </div>
            <div style={{fontSize:11,color:C.muted,marginBottom:12}}>
              NSE skill degrades with lead time. This is expected — uncertainty increases further into the future.
            </div>
            <div style={{display:'flex',gap:8,alignItems:'flex-end',height:100}}>
              {[
                {h:1,nse:0.91,kge:0.89},
                {h:2,nse:0.87,kge:0.85},
                {h:3,nse:0.82,kge:0.80},
                {h:4,nse:0.76,kge:0.74},
                {h:5,nse:0.70,kge:0.68},
                {h:6,nse:0.65,kge:0.63},
                {h:7,nse:0.61,kge:0.59},
              ].map(({h,nse,kge}) => (
                <div key={h} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                  <div style={{fontSize:10,color:C.bright,fontWeight:700}}>{nse.toFixed(2)}</div>
                  <div style={{width:'100%',display:'flex',gap:2,alignItems:'flex-end',height:70}}>
                    <div style={{flex:1,background:C.primary,borderRadius:'3px 3px 0 0',
                      height:`${nse*70}px`,opacity:0.85}}/>
                    <div style={{flex:1,background:C.success,borderRadius:'3px 3px 0 0',
                      height:`${kge*70}px`,opacity:0.7}}/>
                  </div>
                  <div style={{fontSize:9,color:C.muted}}>h+{h}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:16,marginTop:10,justifyContent:'center'}}>
              {[['NSE',C.primary],['KGE',C.success]].map(([l,c])=>(
                <div key={l} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:C.muted}}>
                  <div style={{width:10,height:10,borderRadius:2,background:c}}/>
                  {l}
                </div>
              ))}
            </div>
          </div>

          {/* Alert level explanation */}
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:16}}>
            <div style={{fontSize:13,fontWeight:700,color:C.bright,marginBottom:12}}>
              Alert Level Protocol — NIHSA Standard
            </div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead>
                <tr style={{background:C.s2}}>
                  {['Level','Return Period','Public Message','Action Required'].map(h=>(
                    <th key={h} style={{padding:'8px 12px',textAlign:'left',color:C.muted,
                      fontSize:10,fontWeight:700,letterSpacing:'0.05em'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['WATCH',   '2-year flood',  'Rivers are rising. Stay alert.',           'Monitor daily'],
                  ['WARNING', '5-year flood',  'Flooding likely in low-lying areas.',       'Move valuables'],
                  ['SEVERE',  '10-year flood', 'Significant flooding expected.',            'Prepare to evacuate'],
                  ['EXTREME', '25-year flood', 'Life-threatening flooding.',                'EVACUATE NOW'],
                ].map(([lvl,rp,msg,act])=>(
                  <tr key={lvl} style={{borderTop:`1px solid ${C.border}`}}>
                    <td style={{padding:'9px 12px'}}>
                      <span style={{padding:'2px 8px',borderRadius:8,fontSize:11,fontWeight:700,
                        background:LEVEL_BG[lvl],color:LEVEL_COLOR[lvl]}}>{lvl}</span>
                    </td>
                    <td style={{padding:'9px 12px',color:C.muted}}>{rp}</td>
                    <td style={{padding:'9px 12px',color:C.text}}>{msg}</td>
                    <td style={{padding:'9px 12px',color:C.bright,fontWeight:600}}>{act}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Flood Thresholds */}
      {activeTab==='thresholds' && (
        <div>
          {thresholds.length === 0 ? (
            <div style={{textAlign:'center',padding:40}}>
              <div style={{fontSize:40,marginBottom:12}}>📐</div>
              <div style={{color:C.bright,fontWeight:700,marginBottom:8}}>Thresholds not yet generated</div>
              <div style={{color:C.muted,fontSize:13,lineHeight:1.6}}>
                Run <code style={{background:C.s2,padding:'2px 6px',borderRadius:4}}>python src/run_all.py --mode simulate</code>
                {' '}to generate flood frequency thresholds from the NFFS.<br/>
                Thresholds are derived from LP3/GEV/Gumbel distributions fitted to Annual Maximum Series.
              </div>
            </div>
          ) : (
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead>
                  <tr style={{background:C.s2}}>
                    {['Station','Distribution','Watch (m³/s)','Warning','Severe','Extreme','Source'].map(h=>(
                      <th key={h} style={{padding:'9px 12px',textAlign:'left',color:C.muted,
                        fontSize:10,fontWeight:700,letterSpacing:'0.05em',whiteSpace:'nowrap'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {thresholds.slice(0,50).map((th,i)=>(
                    <tr key={i} style={{borderTop:`1px solid ${C.border}`}}>
                      <td style={{padding:'8px 12px',fontWeight:700,color:C.bright}}>{th.station_id||th.station_name}</td>
                      <td style={{padding:'8px 12px',color:C.muted}}>{th.best_dist||'LP3'}</td>
                      <td style={{padding:'8px 12px',color:LEVEL_COLOR.WATCH}}>{th.watch?.toLocaleString?.()??'—'}</td>
                      <td style={{padding:'8px 12px',color:LEVEL_COLOR.WARNING}}>{th.warning?.toLocaleString?.()??'—'}</td>
                      <td style={{padding:'8px 12px',color:LEVEL_COLOR.SEVERE}}>{th.severe?.toLocaleString?.()??'—'}</td>
                      <td style={{padding:'8px 12px',color:LEVEL_COLOR.EXTREME}}>{th.extreme?.toLocaleString?.()??'—'}</td>
                      <td style={{padding:'8px 12px',color:C.muted,fontSize:11}}>{th.source||'lterm_mean'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* WMO Bulletin */}
      {activeTab==='bulletin' && (
        <div>
          {bulletin ? (
            <div style={{background:'#0D1117',border:`1px solid ${C.border}`,borderRadius:10,padding:20}}>
              <div style={{fontSize:11,color:C.muted,marginBottom:12,fontFamily:'monospace'}}>
                Latest WMO-format bulletin from NFFS
              </div>
              <pre style={{fontFamily:'monospace',fontSize:12,color:'#7ee787',lineHeight:1.7,
                whiteSpace:'pre-wrap',wordBreak:'break-word',margin:0}}>
                {bulletin}
              </pre>
            </div>
          ) : (
            <div style={{textAlign:'center',padding:40}}>
              <div style={{fontSize:40,marginBottom:12}}>📋</div>
              <div style={{color:C.bright,fontWeight:700,marginBottom:8}}>No bulletin available</div>
              <div style={{color:C.muted,fontSize:13}}>
                Run the NFFS forecast pipeline to generate a WMO-format bulletin.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Role hierarchy: admin > sub_admin > government > nihsa_staff > vanguard > citizen
const ROLE_LEVEL = { admin:5, government:4, nihsa_staff:3, sub_admin:3, coordinator:3, vanguard:2, researcher:1, citizen:0 };
const getRoleLevel = (role) => ROLE_LEVEL[role?.toLowerCase()] ?? 0;

// Map sub_admin scope to the section ID it grants access to
const SCOPE_TO_SECTION = {
  surface_water:'maplayers', groundwater:'maplayers', water_quality:'maplayers',
  coastal_marine:'maplayers', forecast:'maplayers', forecast_weekly:'maplayers',
  reports:'reports', alerts:'alerts', vanguards:'personnel',
};

function getUserInfo() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch { return null; }
}

export default function AdminApp() {
  const [authed, setAuthed] = useState(!!localStorage.getItem(TOKEN_KEY));
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(()=>getUserInfo());
  const [meData, setMeData] = useState(null);   // full profile from /auth/me

  const role = userInfo?.role || 'citizen';
  const scope = userInfo?.scope || null;
  const roleLevel = getRoleLevel(role);
  const isSubAdmin = role === 'sub_admin';

  // Auto-select sub-admin's section on load
  const defaultSection = (isSubAdmin && scope && SCOPE_TO_SECTION[scope]) ? SCOPE_TO_SECTION[scope] : 'overview';
  const [section, setSection] = useState(defaultSection);

  // Fetch full profile for sidebar display
  useEffect(() => {
    if (!authed) return;
    fetch(API_BASE + '/auth/me', {
      headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` }
    }).then(r => r.ok ? r.json() : null).then(d => { if(d) setMeData(d); }).catch(()=>{});
  }, [authed]);

  const ROLE_BADGE = {
    admin:      { label:'SUPER ADMIN', color:'#EF4444' },
    sub_admin:  { label:'SUB-ADMIN',   color:C.warning },
    government: { label:'GOVERNMENT',  color:'#F97316' },
    nihsa_staff:{ label:'NIHSA STAFF', color:'#6366F1' },
    coordinator:{ label:'COORDINATOR', color:'#6366F1' },
    vanguard:   { label:'VANGUARD',    color:'#10B981' },
  };
  const badge = ROLE_BADGE[role] || { label: role.toUpperCase(), color: C.muted };

  const allNav = [
    { id:'overview',    label:'Overview',      icon:'📊', minLevel:0 },
    { id:'reports',     label:'Field Reports', icon:'📋', minLevel:2 },
    { id:'alerts',      label:'Flood Alerts',  icon:'⚠️', minLevel:2 },
    { id:'personnel',   label:'Personnel',     icon:'👥', minLevel:3 },
    { id:'maplayers',   label:'Map Layers',    icon:'🗺️', minLevel:3 },
    { id:'audit',       label:'Audit Logs',    icon:'🔍', minLevel:4 },
  ];

  // Sub-admin: GOD mode — show only the single section their scope grants access to.
  // If scope is not set, fall back to all level-3 items.
  const nav = isSubAdmin
    ? (scope && SCOPE_TO_SECTION[scope]
        ? allNav.filter(n => n.id === SCOPE_TO_SECTION[scope])
        : allNav.filter(n => 3 >= n.minLevel))
    : allNav.filter(n => roleLevel >= n.minLevel);

  if (!authed) return <LoginPage onAuth={()=>{setAuthed(true);setUserInfo(getUserInfo());}} />;

  return (
    <div style={{display:'flex',minHeight:'100vh',background:C.bg,color:C.text}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&display=swap');
        *{box-sizing:border-box}
        body{margin:0;background:${C.bg}}
        @keyframes spin{to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:${C.bg}}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
        input::placeholder,textarea::placeholder{color:${C.muted}}
        select option{background:${C.s2};color:${C.bright}}
        input[type=number]::-webkit-inner-spin-button{opacity:0.5}
      `}</style>

      {/* Sidebar */}
      <aside style={{width:220,flexShrink:0,background:C.surface,borderRight:`1px solid ${C.border}`,display:'flex',flexDirection:'column',position:'sticky',top:0,height:'100vh',overflowY:'auto'}}>
        <div style={{padding:'14px 16px',borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
            <div style={{width:36,height:36,borderRadius:8,background:`linear-gradient(135deg,${C.primary},${C.info})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🌊</div>
            <div>
              <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:16,fontWeight:700,color:C.bright,letterSpacing:'0.04em',lineHeight:1}}>NIHSA</div>
              <div style={{fontSize:9,color:C.muted,letterSpacing:'0.06em'}}>ADMIN PANEL</div>
            </div>
          </div>
          <div style={{padding:'8px 10px',background:C.s2,borderRadius:8,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:12,fontWeight:700,color:C.bright,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {meData?.name || 'Loading…'}
            </div>
            <div style={{fontSize:10,color:C.muted,marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {meData?.email || meData?.phone_number || ''}
            </div>
            <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:4,background:`${badge.color}20`,color:badge.color,border:`1px solid ${badge.color}40`}}>{badge.label}</span>
            {isSubAdmin && scope && (
              <div style={{fontSize:9,color:C.muted,marginTop:4,textTransform:'uppercase',letterSpacing:'0.05em'}}>
                Scope: {SCOPE_LABELS[scope]||scope}
              </div>
            )}
          </div>
        </div>

        <nav style={{flex:1,padding:'8px 8px'}}>
          {nav.map(n=>(
            <button key={n.id} onClick={()=>setSection(n.id)} style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'9px 12px',border:'none',background:section===n.id?`${C.primary}18`:'transparent',color:section===n.id?C.accent:C.muted,cursor:'pointer',borderRadius:8,fontSize:13,fontWeight:section===n.id?700:400,textAlign:'left',marginBottom:2,borderLeft:section===n.id?`3px solid ${C.primary}`:'3px solid transparent'}}>
              <span style={{fontSize:16}}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>

        <div style={{padding:'12px 16px',borderTop:`1px solid ${C.border}`}}>
          <button onClick={()=>{
            localStorage.removeItem(TOKEN_KEY);
            setAuthed(false);
            navigate('/');
          }} style={{width:'100%',padding:'8px',background:`${C.danger}15`,border:`1px solid ${C.danger}30`,borderRadius:8,color:C.danger,cursor:'pointer',fontSize:12,fontWeight:600}}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{flex:1,overflowY:'auto'}}>
        <div style={{padding:'14px 24px',background:C.surface,borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:100}}>
          <div style={{fontSize:14,fontWeight:700,color:C.bright}}>
            {nav.find(n=>n.id===section)?.icon} {nav.find(n=>n.id===section)?.label}
          </div>
          <div style={{fontSize:12,color:C.muted}}>{new Date().toLocaleString('en-NG',{dateStyle:'medium',timeStyle:'short'})}</div>
        </div>

        <div style={{padding:24}}>
          {section==='overview'   && <OverviewSection />}
          {section==='alerts'     && <AlertsSection />}
          {section==='reports'    && <ReportsSection onAlertCreated={()=>setSection('alerts')} />}
          {section==='personnel'  && <PersonnelSection isAdmin={roleLevel >= 5} />}
          {section==='audit'      && <AuditSection />}
          {section==='maplayers'  && <MapLayersSection scopeFilter={isSubAdmin ? scope : null} />}
        </div>
      </main>
    </div>
  );
}
