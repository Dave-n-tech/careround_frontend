// Shared UI components

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ---------- Icons (inline svg, stroke=currentColor) ----------
const Icon = ({ d, size=16, fill=false, stroke=2, className='' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill={fill?'currentColor':'none'} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p,i)=><path key={i} d={p} />) : <path d={d}/>}
  </svg>
);
const Icons = {
  dashboard: (p)=><Icon {...p} d={["M3 12l9-9 9 9","M5 10v10h14V10"]} />,
  patients: (p)=><Icon {...p} d={["M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z","M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6","M17 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z","M14 14c4 0 7 2.7 7 6"]} />,
  rounds: (p)=><Icon {...p} d={["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z","M12 7v5l3 2"]} />,
  tasks: (p)=><Icon {...p} d={["M4 6h16","M4 12h16","M4 18h10","M9 4l1 2 2-2","M9 16l1 2 2-2"]} />,
  escalation: (p)=><Icon {...p} d={["M12 3l10 18H2L12 3Z","M12 10v5","M12 18h.01"]} />,
  team: (p)=><Icon {...p} d={["M16 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z","M8 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z","M2 20c0-3 2.5-5 6-5s6 2 6 5","M22 20c0-3-2-5-5-5"]} />,
  shift: (p)=><Icon {...p} d={["M3 7h18v13H3z","M3 7l3-4h12l3 4","M8 12h8"]} />,
  handover: (p)=><Icon {...p} d={["M3 12h18","M14 5l7 7-7 7","M3 8V5","M3 19v-3"]} />,
  reports: (p)=><Icon {...p} d={["M4 20V8","M10 20V4","M16 20v-8","M22 20H2"]} />,
  settings: (p)=><Icon {...p} d={["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z","M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"]} />,
  bell: (p)=><Icon {...p} d={["M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z","M10 21a2 2 0 0 0 4 0"]} />,
  search: (p)=><Icon {...p} d={["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z","M21 21l-4.3-4.3"]} />,
  plus: (p)=><Icon {...p} d={["M12 5v14","M5 12h14"]} />,
  check: (p)=><Icon {...p} d={["M5 13l4 4L19 7"]} />,
  x: (p)=><Icon {...p} d={["M18 6 6 18","M6 6l12 12"]} />,
  chevron: (p)=><Icon {...p} d={["M9 6l6 6-6 6"]} />,
  chevDown: (p)=><Icon {...p} d={["M6 9l6 6 6-6"]} />,
  arrow: (p)=><Icon {...p} d={["M5 12h14","M13 6l6 6-6 6"]} />,
  refresh: (p)=><Icon {...p} d={["M3 12a9 9 0 0 1 15.5-6.3L21 8","M21 3v5h-5","M21 12a9 9 0 0 1-15.5 6.3L3 16","M3 21v-5h5"]} />,
  vitals: (p)=><Icon {...p} d={["M3 12h4l2-7 4 14 2-7h6"]} />,
  hospital: (p)=><Icon {...p} d={["M4 21V8l8-5 8 5v13","M9 21v-6h6v6","M12 11v-3","M10.5 9.5h3"]} />,
  building: (p)=><Icon {...p} d={["M4 21h16","M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16","M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"]} />,
  bed: (p)=><Icon {...p} d={["M3 18V6","M3 12h18v6","M21 18V10a2 2 0 0 0-2-2h-9v4","M7 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"]} />,
  logout: (p)=><Icon {...p} d={["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4","M16 17l5-5-5-5","M21 12H9"]} />,
  more: (p)=><Icon {...p} d={["M12 7h.01M12 12h.01M12 17h.01"]} stroke={3} />,
  edit: (p)=><Icon {...p} d={["M12 20h9","M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"]} />,
  alertCircle: (p)=><Icon {...p} d={["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z","M12 8v4","M12 16h.01"]} />,
  arrowUp: (p)=><Icon {...p} d={["M12 19V5","M5 12l7-7 7 7"]} />,
  arrowDown: (p)=><Icon {...p} d={["M12 5v14","M19 12l-7 7-7-7"]} />,
  pause: (p)=><Icon {...p} d={["M6 4h4v16H6z","M14 4h4v16h-4z"]} fill={true} />,
  play: (p)=><Icon {...p} d={["M5 3l14 9-14 9V3Z"]} fill={true} />,
};

// ---------- Badges ----------
function AcuityBadge({ level, size='sm' }){
  const map = {
    CRITICAL: { bg:'#fee2e2', fg:'#991b1b', label:'CRITICAL' },
    HIGH:     { bg:'#ffedd5', fg:'#9a3412', label:'HIGH' },
    MEDIUM:   { bg:'#fef3c7', fg:'#854d0e', label:'MEDIUM' },
    LOW:      { bg:'#dcfce7', fg:'#166534', label:'LOW' },
  };
  const m = map[level] || map.LOW;
  return <span className="chip" style={{background:m.bg,color:m.fg}}>{m.label}</span>;
}

function NEWSBadge({ score, size='md' }){
  const s = Number(score);
  let bg='#dcfce7', fg='#166534', label='LOW';
  if(s>=7){ bg='#fee2e2'; fg='#991b1b'; label='RED'; }
  else if(s>=5){ bg='#fef3c7'; fg='#854d0e'; label='AMBER'; }
  const sz = size==='lg' ? 'w-12 h-12 text-2xl' : size==='sm'?'w-7 h-7 text-xs':'w-9 h-9 text-base';
  return (
    <div className={`inline-flex items-center gap-1.5`}>
      <div className={`${sz} rounded font-semibold flex items-center justify-center mono`} style={{background:bg,color:fg}}>
        {s}
      </div>
      {size!=='sm' && <span className="text-[10px] font-semibold tracking-wider" style={{color:fg}}>{label}</span>}
    </div>
  );
}

function StatusChip({ status }){
  const map = {
    ADMITTED:        { bg:'#dbeafe', fg:'#1e40af' },
    STABLE:          { bg:'#e0f2fe', fg:'#075985' },
    DETERIORATING:   { bg:'#fee2e2', fg:'#991b1b' },
    DISCHARGE_READY: { bg:'#dcfce7', fg:'#166534' },
    DISCHARGED:     { bg:'#e2e8f0', fg:'#475569' },
    ACTIVE:          { bg:'#dcfce7', fg:'#166534' },
    PENDING_ASSIGNMENT:{ bg:'#fef3c7', fg:'#854d0e' },
    COMPLETED:       { bg:'#e2e8f0', fg:'#475569' },
    HANDED_OVER:     { bg:'#e0e7ff', fg:'#3730a3' },
    PENDING:         { bg:'#fef3c7', fg:'#854d0e' },
    IN_PROGRESS:     { bg:'#dbeafe', fg:'#1e40af' },
    OPEN:            { bg:'#fee2e2', fg:'#991b1b' },
    ACKNOWLEDGED:    { bg:'#fef3c7', fg:'#854d0e' },
    RESOLVED:        { bg:'#dcfce7', fg:'#166534' },
    SCHEDULED:       { bg:'#e0e7ff', fg:'#3730a3' },
  };
  const m = map[status] || { bg:'#e2e8f0', fg:'#475569' };
  return <span className="chip" style={{background:m.bg,color:m.fg}}>{status.replace(/_/g,' ')}</span>;
}

function PriorityChip({ priority }){
  const map={ ROUTINE:{bg:'#e2e8f0',fg:'#475569'}, URGENT:{bg:'#fef3c7',fg:'#854d0e'}, EMERGENCY:{bg:'#fee2e2',fg:'#991b1b'} };
  const m=map[priority]||map.ROUTINE;
  return <span className="chip" style={{background:m.bg,color:m.fg}}>{priority}</span>;
}

function RoleBadge({ role }){
  const map={
    ADMIN:'#475569',CONSULTANT:'#0b5cab',REGISTRAR:'#0e7490',JUNIOR_DOCTOR:'#7c3aed',NURSE:'#be185d',WARD_SUPERVISOR:'#15803d'
  };
  return <span className="chip" style={{background:'#fff',color:map[role],border:`1px solid ${map[role]}40`}}>{role.replace(/_/g,' ')}</span>;
}

// ---------- Cards ----------
function PatientRow({ patient, onClick, reviewed=false, current=false }){
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 row-hover cursor-pointer border-b hairline ${current?'bg-blue-50':''}`} onClick={onClick}>
      <div className="w-7 flex-shrink-0">
        {reviewed ? <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-white"><Icons.check size={12} stroke={3}/></div>
                  : <div className="w-5 h-5 rounded-full border-2 border-slate-300"/>}
      </div>
      <div className="w-16 mono text-xs text-slate-500">{patient.bed}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-semibold truncate">{patientFullName(patient)}</div>
        <div className="text-xs ink-mute truncate">{patient.age}{patient.sex} · {patient.primaryDiagnosis}</div>
      </div>
      <AcuityBadge level={patient.acuity} />
      <NEWSBadge score={patient.news} size="sm"/>
      <StatusChip status={patient.status}/>
      <Icons.chevron size={14} className="text-slate-400"/>
    </div>
  );
}

function StatCard({ label, value, sub, accent='#0b5cab', icon }){
  return (
    <div className="panel rounded p-4 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="field-label">{label}</span>
        {icon && <span style={{color:accent}}>{icon}</span>}
      </div>
      <div className="text-3xl font-semibold tracking-tight" style={{color:accent}}>{value}</div>
      {sub && <div className="text-xs ink-mute">{sub}</div>}
    </div>
  );
}

function EscalationCard({ esc, onAck, onResolve, currentUserRole }){
  const p = getPatient(esc.patientId);
  const w = p ? getWard(p.wardId) : null;
  const isRed = esc.severity==='RED';
  const triggerLabel = {
    HIGH_NEWS_SCORE:'High NEWS score', TASK_OVERDUE:'Task overdue',
    NURSE_CONCERN:'Nurse concern', DETERIORATION:'Patient deterioration'
  }[esc.triggerType];
  const sevColor = isRed ? '#b91c1c' : '#b45309';
  const sevBg = isRed ? '#fef2f2' : '#fffbeb';
  return (
    <div className={`rounded border-l-4 ${isRed?'pulse-red':''}`} style={{borderColor:sevColor, background:sevBg, borderTop:'1px solid var(--line)', borderRight:'1px solid var(--line)', borderBottom:'1px solid var(--line)'}}>
      <div className="p-3.5 flex items-start gap-3">
        <div className="flex-shrink-0">
          <span className="chip" style={{background:sevColor,color:'#fff'}}>{esc.severity}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[14px]">{patientFullName(p)}</span>
            <span className="text-xs ink-mute">· {w?.name} · Bed {p?.bed}</span>
          </div>
          <div className="text-[12.5px] ink-2 mt-0.5">
            <span className="font-medium">{triggerLabel}</span>
            <span className="ink-mute"> — {esc.notes}</span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-[11px] ink-mute">
            <span>Raised {timeAgo(esc.createdAt)}</span>
            <span>·</span>
            <span>To: {userFullName(getUser(esc.assigneeId))}</span>
            <span>·</span>
            <StatusChip status={esc.status}/>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          {esc.status==='OPEN' && <button className="btn" onClick={()=>onAck&&onAck(esc.id)}>Acknowledge</button>}
          {esc.status!=='RESOLVED' && <button className="btn btn-primary" onClick={()=>onResolve&&onResolve(esc.id)}>Resolve</button>}
          {esc.status==='RESOLVED' && <span className="text-xs ink-mute">Resolved</span>}
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, onAdvance, dense=false }){
  const p = getPatient(task.patientId);
  const overdue = task.status!=='COMPLETED' && (task.windowEnd < currentTimeStr());
  const next = task.status==='PENDING' ? 'Start' : task.status==='IN_PROGRESS' ? 'Complete' : null;
  return (
    <div className={`panel rounded p-3 flex items-center gap-3 ${overdue?'border-l-4 border-l-red-600':''}`}>
      <div className="flex-shrink-0">
        <PriorityChip priority={task.priority}/>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-semibold truncate">{task.title}</div>
        <div className="text-xs ink-mute truncate">
          {p && <>{patientFullName(p)} · Bed {p.bed} · </>}
          <span className="mono">{task.windowStart}–{task.windowEnd}</span>
          {overdue && <span className="text-red-700 font-semibold ml-2">OVERDUE</span>}
        </div>
      </div>
      <StatusChip status={task.status}/>
      {next && <button className="btn btn-primary" onClick={()=>onAdvance&&onAdvance(task.id)}>{next}</button>}
    </div>
  );
}

// ---------- Helpers ----------
function currentTimeStr(){
  // mock current time within the prototype day
  return '08:30';
}

// ---------- Toasts ----------
const ToastContext = React.createContext(null);
function useToast(){ return React.useContext(ToastContext); }
function ToastProvider({ children }){
  const [toasts, setToasts] = useState([]);
  const add = useCallback((t)=>{
    const id = Math.random().toString(36).slice(2);
    setToasts(s=>[...s, {id, ...t}]);
    setTimeout(()=>setToasts(s=>s.filter(x=>x.id!==id)), t.duration||4500);
  },[]);
  return (
    <ToastContext.Provider value={add}>
      {children}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-2 w-[360px]">
        {toasts.map(t=>(
          <div key={t.id} className="fadein panel rounded shadow-lg p-3 flex gap-2 items-start" style={{borderLeft:`4px solid ${t.kind==='error'?'#b91c1c':t.kind==='warn'?'#b45309':t.kind==='success'?'#15803d':'#0b5cab'}`}}>
            <div className="flex-1">
              <div className="font-semibold text-[13px]">{t.title}</div>
              {t.body && <div className="text-xs ink-mute mt-0.5">{t.body}</div>}
            </div>
            <button className="btn-ghost btn p-1" onClick={()=>setToasts(s=>s.filter(x=>x.id!==t.id))}><Icons.x size={14}/></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ---------- Modal ----------
function Modal({ open, onClose, title, children, footer, width=520 }){
  if(!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 fadein" onClick={onClose}>
      <div className="panel rounded shadow-2xl" style={{width}} onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="flex items-center justify-between px-5 py-3 border-b hairline">
          <div className="font-semibold">{title}</div>
          <button className="btn-ghost btn p-1.5" onClick={onClose}><Icons.x size={16}/></button>
        </div>
        <div className="p-5 max-h-[70vh] overflow-y-auto scroll-thin">{children}</div>
        {footer && <div className="px-5 py-3 border-t hairline flex justify-end gap-2 bg-slate-50">{footer}</div>}
      </div>
    </div>
  );
}

// ---------- Field ----------
function Field({ label, hint, error, children, required }){
  return (
    <label className="block">
      <div className="field-label mb-1.5">{label}{required && <span className="text-red-600 ml-0.5">*</span>}</div>
      {children}
      {hint && !error && <div className="text-[11px] ink-mute mt-1">{hint}</div>}
      {error && <div className="text-[11px] text-red-700 mt-1">{error}</div>}
    </label>
  );
}

// ---------- VitalsChart (mini) ----------
function NEWSSparkline({ history, h=42, w=160 }){
  const pts = history.map(v=>v.news);
  const max = Math.max(8, ...pts);
  const stepX = w / (pts.length-1);
  const path = pts.map((y,i)=>`${i===0?'M':'L'}${i*stepX} ${h - (y/max)*h}`).join(' ');
  // segments coloured by latest range
  return (
    <svg width={w} height={h} className="block">
      <line x1="0" y1={h-(5/max)*h} x2={w} y2={h-(5/max)*h} stroke="#fde68a" strokeDasharray="3 3"/>
      <line x1="0" y1={h-(7/max)*h} x2={w} y2={h-(7/max)*h} stroke="#fca5a5" strokeDasharray="3 3"/>
      <path d={path} stroke="#0b5cab" strokeWidth="1.6" fill="none"/>
      {pts.map((y,i)=>(
        <circle key={i} cx={i*stepX} cy={h-(y/max)*h} r={y>=7?2.5:y>=5?2:1.5} fill={y>=7?'#b91c1c':y>=5?'#b45309':'#0b5cab'} />
      ))}
    </svg>
  );
}

// ---------- Sidebar nav config per role ----------
const NAV = {
  ADMIN: [
    { id:'dashboard', label:'Dashboard', icon:'dashboard' },
    { id:'departments', label:'Departments', icon:'building' },
    { id:'wards', label:'Wards', icon:'bed' },
    { id:'users', label:'Users', icon:'team' },
    { id:'shift-schedules', label:'Shift Schedules', icon:'shift' },
    { id:'on-call', label:'On-Call Rotations', icon:'rounds' },
    { id:'team-assignment', label:'Team → Ward', icon:'handover' },
    { id:'hospital', label:'Hospital Settings', icon:'settings' },
  ],
  CONSULTANT: [
    { id:'patients', label:"My Team's Patients", icon:'patients' },
    { id:'round', label:'Ward Round', icon:'rounds' },
    { id:'team', label:'My Team', icon:'team' },
    { id:'escalations', label:'Escalation Inbox', icon:'escalation', badgeKey:'openEscalations' },
  ],
  REGISTRAR: [
    { id:'patients', label:'Ward Patients', icon:'patients' },
    { id:'round', label:'Ward Round', icon:'rounds' },
    { id:'admit', label:'Admit Patient', icon:'plus' },
    { id:'escalations', label:'On-Call Queue', icon:'escalation', badgeKey:'openEscalations' },
  ],
  JUNIOR_DOCTOR: [
    { id:'tasks', label:'My Tasks', icon:'tasks' },
    { id:'patients', label:'Team Patients', icon:'patients' },
    { id:'round-participate', label:'Active Round', icon:'rounds' },
    { id:'handover', label:'Handover Notes', icon:'handover' },
  ],
  NURSE: [
    { id:'patients', label:'Ward Patients', icon:'patients' },
    { id:'vitals', label:'Record Vitals', icon:'vitals' },
    { id:'tasks', label:'My Tasks', icon:'tasks' },
    { id:'escalation-create', label:'Raise Concern', icon:'escalation' },
    { id:'handover', label:'Handover Notes', icon:'handover' },
  ],
  WARD_SUPERVISOR: [
    { id:'dashboard', label:'Ward Dashboard', icon:'dashboard' },
    { id:'shifts', label:'Shift Assignment', icon:'shift', badgeKey:'pendingShifts' },
    { id:'handover', label:'Handover', icon:'handover' },
    { id:'rounds-history', label:'Round History', icon:'rounds' },
    { id:'reports', label:'Reports', icon:'reports' },
  ],
};

const ROLE_USER_MAP = {
  ADMIN:'u_admin', CONSULTANT:'u_cons1', REGISTRAR:'u_reg1',
  JUNIOR_DOCTOR:'u_jr2', NURSE:'u_nur1', WARD_SUPERVISOR:'u_sup1'
};

Object.assign(window, {
  Icon, Icons, AcuityBadge, NEWSBadge, StatusChip, PriorityChip, RoleBadge,
  PatientRow, StatCard, EscalationCard, TaskCard, NEWSSparkline,
  Modal, Field, ToastProvider, useToast, NAV, ROLE_USER_MAP, currentTimeStr
});
