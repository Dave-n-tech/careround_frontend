// App shell — login, role switcher, sidebar/topbar, router

const { useState, useEffect, useMemo } = React;

function App(){
  const [authed, setAuthed] = useState(false);
  const [role, setRole] = useState('CONSULTANT');
  const [view, setView] = useState('patients');
  const [patientId, setPatientId] = useState(null);

  function go(v){ setView(v); setPatientId(null); }
  function openPatient(id){ setPatientId(id); setView('patient-detail'); }

  // role switch — pick a sensible default screen
  useEffect(()=>{
    const first = NAV[role]?.[0];
    if(first) setView(first.id);
    setPatientId(null);
  }, [role]);

  if(!authed) return <LoginScreen onLogin={(r)=>{ setRole(r); setAuthed(true); }}/>;

  return (
    <ToastProvider>
      <ToastConsumer>
        {(toast) => {
          const ctx = { role, go, openPatient, toast, switchRole:(r)=>setRole(r), logout:()=>setAuthed(false) };
          return (
            <div className="min-h-screen flex bg-[var(--bg)]">
              <Sidebar role={role} view={view} go={go} ctx={ctx}/>
              <div className="flex-1 flex flex-col min-w-0">
                <TopBar role={role} ctx={ctx}/>
                <main className="flex-1 p-6 overflow-y-auto">
                  <Router role={role} view={view} ctx={ctx} patientId={patientId}/>
                </main>
              </div>
            </div>
          );
        }}
      </ToastConsumer>
    </ToastProvider>
  );
}

function ToastConsumer({ children }){
  const t = useToast();
  return children(t);
}

function LoginScreen({ onLogin }){
  const [email, setEmail] = useState('a.okafor@omth.ng');
  const [password, setPassword] = useState('demo');
  const [role, setRole] = useState('CONSULTANT');

  const roleEmails = {
    ADMIN:'t.bankole@omth.ng', CONSULTANT:'a.okafor@omth.ng', REGISTRAR:'c.eze@omth.ng',
    JUNIOR_DOCTOR:'n.obi@omth.ng', NURSE:'f.adeyemi@omth.ng', WARD_SUPERVISOR:'p.okoro@omth.ng'
  };

  return (
    <div className="min-h-screen grid grid-cols-2">
      <div className="bg-[var(--brand)] text-white p-12 flex flex-col justify-between" style={{background:'linear-gradient(135deg, #083f74 0%, #0b5cab 100%)'}}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded bg-white/15 flex items-center justify-center"><Icons.hospital size={20}/></div>
          <div className="text-xl font-semibold">CareRound</div>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">Digital ward management for the modern hospital.</h1>
          <p className="text-white/80 text-sm leading-relaxed max-w-md">A unified system for patient admission, ward rounds, vitals tracking, and shift handover — used at Olabisi Memorial Teaching Hospital and 4 other facilities across Lagos.</p>
        </div>
        <div className="text-xs text-white/60 mono">v1.1 · ISO 27001 · NDPR-compliant</div>
      </div>
      <div className="flex items-center justify-center p-12">
        <div className="w-full max-w-md space-y-5">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-sm ink-mute mt-1">Use your hospital credentials. This is a prototype — the role you select will be used.</p>
          </div>
          <div className="space-y-3">
            <Field label="Email"><input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)}/></Field>
            <Field label="Password"><input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)}/></Field>
            <Field label="Demo role" hint="In production, role is loaded from JWT — not chosen at login.">
              <select className="select" value={role} onChange={e=>{setRole(e.target.value); setEmail(roleEmails[e.target.value]);}}>
                <option value="ADMIN">Admin — Tunde Bankole</option>
                <option value="CONSULTANT">Consultant — Prof. Adaeze Okafor</option>
                <option value="REGISTRAR">Registrar — Dr. Chinedu Eze</option>
                <option value="JUNIOR_DOCTOR">Junior Doctor — Dr. Ngozi Obi</option>
                <option value="NURSE">Nurse — Funmi Adeyemi</option>
                <option value="WARD_SUPERVISOR">Ward Supervisor — Patience Okoro</option>
              </select>
            </Field>
            <button className="btn btn-primary w-full justify-center py-2.5 mt-2" onClick={()=>onLogin(role)}>Sign in</button>
            <div className="text-xs text-center">
              <a href="spec.html" target="_blank" className="text-[var(--brand)] hover:underline">View developer spec</a>
              <span className="ink-mute"> · </span>
              <a href="#" className="ink-mute hover:underline">Forgot password?</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ role, view, go, ctx }){
  const items = NAV[role] || [];
  const badges = {
    openEscalations: ESCALATIONS.filter(e=>e.status==='OPEN').length,
    pendingShifts: SHIFTS.filter(s=>s.status==='PENDING_ASSIGNMENT').length,
  };
  return (
    <aside className="w-[230px] bg-white border-r hairline flex flex-col">
      <div className="px-4 py-4 border-b hairline">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[var(--brand)] flex items-center justify-center"><Icons.hospital size={16} className="text-white"/></div>
          <div>
            <div className="font-semibold text-sm leading-tight">CareRound</div>
            <div className="text-[10px] ink-mute">{HOSPITAL.shortName}</div>
          </div>
        </div>
      </div>
      <nav className="p-2 flex-1">
        {items.map(it=>{
          const I = Icons[it.icon] || Icons.dashboard;
          const active = view===it.id;
          const badge = it.badgeKey ? badges[it.badgeKey] : null;
          return (
            <button key={it.id} onClick={()=>go(it.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium ${active?'bg-blue-50 text-[var(--brand)]':'text-slate-700 hover:bg-slate-50'}`}>
              <I size={16}/>
              <span className="flex-1 text-left">{it.label}</span>
              {badge>0 && <span className="text-[10px] mono px-1.5 py-0.5 rounded bg-red-600 text-white">{badge}</span>}
            </button>
          );
        })}
      </nav>
      <div className="p-3 border-t hairline">
        <div className="text-[10px] ink-mute mb-1">DEMO · Switch role</div>
        <select className="select text-xs" value={role} onChange={e=>ctx.switchRole(e.target.value)}>
          <option>ADMIN</option><option>CONSULTANT</option><option>REGISTRAR</option>
          <option>JUNIOR_DOCTOR</option><option>NURSE</option><option>WARD_SUPERVISOR</option>
        </select>
      </div>
    </aside>
  );
}

function TopBar({ role, ctx }){
  const u = getUser(ROLE_USER_MAP[role]);
  const openEsc = ESCALATIONS.filter(e=>e.status==='OPEN').length;
  return (
    <header className="h-14 bg-white border-b hairline px-5 flex items-center gap-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold">{HOSPITAL.shortName}</span>
        <span className="ink-mute">·</span>
        <span className="ink-mute">6 May 2026 · 08:30 WAT</span>
      </div>
      <div className="flex-1"></div>
      <div className="relative">
        <input className="input pl-8" placeholder="Search patients, MRN…" style={{width:280}}/>
        <Icons.search size={14} className="absolute left-2.5 top-2.5 text-slate-400"/>
      </div>
      <button className="relative btn btn-ghost p-2"><Icons.bell size={16}/>{openEsc>0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-600"/>}</button>
      <div className="flex items-center gap-2.5 pl-3 border-l hairline">
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold">{u.firstName[0]}{u.lastName[0]}</div>
        <div className="text-right">
          <div className="text-sm font-medium leading-tight">{userFullName(u)}</div>
          <div className="text-[10px]"><RoleBadge role={role}/></div>
        </div>
        <button className="btn btn-ghost p-1.5" title="Sign out" onClick={ctx.logout}><Icons.logout size={14}/></button>
      </div>
    </header>
  );
}

function Router({ role, view, ctx, patientId }){
  if(view==='patient-detail' && patientId){
    return <PatientDetail ctx={ctx} patientId={patientId} onBack={()=>ctx.go(NAV[role][0].id)}/>;
  }
  // Admin
  if(role==='ADMIN'){
    if(view==='dashboard') return <AdminDashboard ctx={ctx}/>;
    if(view==='departments') return <AdminDepartments ctx={ctx}/>;
    if(view==='wards') return <AdminWards ctx={ctx}/>;
    if(view==='users') return <AdminUsers ctx={ctx}/>;
    if(view==='shift-schedules') return <AdminShifts ctx={ctx}/>;
    if(view==='on-call') return <AdminOnCall ctx={ctx}/>;
    if(view==='team-assignment') return <AdminTeamAssignment ctx={ctx}/>;
    if(view==='hospital') return <AdminHospital ctx={ctx}/>;
  }
  if(role==='CONSULTANT'){
    if(view==='patients') return <PatientList ctx={ctx} scope="team" title="My team's patients"/>;
    if(view==='round') return <RoundWizard ctx={ctx}/>;
    if(view==='team') return <MyTeamPage ctx={ctx}/>;
    if(view==='escalations') return <EscalationInbox ctx={ctx} scope="consultant"/>;
  }
  if(role==='REGISTRAR'){
    if(view==='patients') return <PatientList ctx={ctx} scope="ward" title="Ward patients"/>;
    if(view==='round') return <RoundWizard ctx={ctx}/>;
    if(view==='admit') return <AdmissionForm ctx={ctx}/>;
    if(view==='escalations') return <EscalationInbox ctx={ctx} scope="registrar"/>;
  }
  if(role==='JUNIOR_DOCTOR'){
    if(view==='tasks') return <MyTasksList ctx={ctx} role="JUNIOR_DOCTOR"/>;
    if(view==='patients') return <PatientList ctx={ctx} scope="team" title="Team patients"/>;
    if(view==='round-participate') return <RoundParticipateView ctx={ctx}/>;
    if(view==='handover') return <HandoverNotesEntry ctx={ctx}/>;
  }
  if(role==='NURSE'){
    if(view==='patients') return <PatientList ctx={ctx} scope="ward" title="Ward patients"/>;
    if(view==='vitals') return <NurseVitalsForm ctx={ctx}/>;
    if(view==='tasks') return <MyTasksList ctx={ctx} role="NURSE"/>;
    if(view==='escalation-create') return <NurseCreateEscalation ctx={ctx}/>;
    if(view==='handover') return <HandoverNotesEntry ctx={ctx}/>;
  }
  if(role==='WARD_SUPERVISOR'){
    if(view==='dashboard') return <SupervisorDashboard ctx={ctx}/>;
    if(view==='shifts') return <ShiftAssignment ctx={ctx}/>;
    if(view==='handover') return <HandoverManagement ctx={ctx}/>;
    if(view==='rounds-history') return <RoundHistory ctx={ctx}/>;
    if(view==='reports') return <Reports ctx={ctx}/>;
  }
  return <div className="panel rounded p-12 text-center ink-mute">Screen not found.</div>;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
