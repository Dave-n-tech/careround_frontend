// Clinical screens — shared between Consultant, Registrar, Junior Doctor

const { useState, useMemo } = React;

// =========================================================
// PATIENT LIST (used by Consultant, Registrar, JD, Nurse)
// =========================================================
function PatientList({ ctx, scope='team', title='Patient list' }){
  const role = ctx.role;
  // determine patient set
  let list = PATIENTS;
  if(scope==='team'){
    const team = TEAMS.find(t=>t.members.includes(ROLE_USER_MAP[role])) || TEAMS[0];
    list = PATIENTS.filter(p=>p.teamId===team.id);
  } else if(scope==='ward'){
    list = PATIENTS.filter(p=>p.wardId==='w1');
  }
  // sort by acuity desc, news desc
  const order = { CRITICAL:4, HIGH:3, MEDIUM:2, LOW:1 };
  list = [...list].sort((a,b)=> (order[b.acuity]-order[a.acuity]) || (b.news-a.news));

  const [filter,setFilter] = useState('ALL');
  if(filter!=='ALL') list = list.filter(p=>p.status===filter);

  return (
    <div className="space-y-4">
      <PageHeader title={title} subtitle={`${list.length} patients · Soyinka Ward · last updated 12s ago`}>
        <button className="btn"><Icons.refresh size={14}/>Refresh</button>
      </PageHeader>
      <div className="flex items-center gap-2">
        {['ALL','ADMITTED','STABLE','DETERIORATING','DISCHARGE_READY'].map(s=>(
          <button key={s} onClick={()=>setFilter(s)} className={`btn ${filter===s?'btn-primary':''}`}>
            {s==='ALL'?'All':s.replace(/_/g,' ')}
            <span className="ink-mute ml-1">{s==='ALL'?PATIENTS.length:PATIENTS.filter(p=>p.status===s).length}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <input className="input pl-8" placeholder="Search MRN, name…" style={{width:240}}/>
            <Icons.search size={14} className="absolute left-2.5 top-2.5 text-slate-400"/>
          </div>
        </div>
      </div>
      <div className="panel rounded overflow-hidden">
        <table className="cr">
          <thead><tr>
            <th className="w-20">Bed</th>
            <th>Patient</th>
            <th>MRN</th>
            <th>Diagnosis</th>
            <th>Acuity</th>
            <th>NEWS</th>
            <th>Trend</th>
            <th>Status</th>
            <th>LoS</th>
            <th></th>
          </tr></thead>
          <tbody>{list.map(p=>{
            const days = Math.floor((Date.now() - new Date(p.admissionDate).getTime())/(86400000));
            return (
              <tr key={p.id} onClick={()=>ctx.openPatient(p.id)} className="cursor-pointer">
                <td className="mono text-xs">{p.bed}</td>
                <td className="font-semibold">{patientFullName(p)}<div className="text-xs ink-mute font-normal">{p.age}{p.sex}</div></td>
                <td className="mono text-xs ink-mute">{p.mrn}</td>
                <td className="ink-2 max-w-[280px] truncate">{p.primaryDiagnosis}</td>
                <td><AcuityBadge level={p.acuity}/></td>
                <td><NEWSBadge score={p.news} size="sm"/></td>
                <td><NEWSSparkline history={p.vitals} w={100} h={24}/></td>
                <td><StatusChip status={p.status}/></td>
                <td className="mono text-xs">{days}d</td>
                <td><Icons.chevron size={14} className="text-slate-400"/></td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    </div>
  );
}

// =========================================================
// PATIENT DETAIL
// =========================================================
function PatientDetail({ ctx, patientId, onBack }){
  const p = getPatient(patientId);
  const [tab,setTab] = useState('overview');
  const w = getWard(p.wardId), team = getTeam(p.teamId);
  const tasks = TASKS.filter(t=>t.patientId===p.id);
  const notes = CLINICAL_NOTES.filter(n=>n.patientId===p.id);
  return (
    <div className="space-y-4">
      <button className="btn btn-ghost text-sm" onClick={onBack}>← Back to list</button>
      <div className="panel rounded p-5">
        <div className="flex items-start gap-5">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{patientFullName(p)}</h1>
              <AcuityBadge level={p.acuity}/>
              <StatusChip status={p.status}/>
            </div>
            <div className="text-sm ink-mute mt-1 flex items-center gap-3 flex-wrap">
              <span className="mono">{p.mrn}</span><span>·</span>
              <span>{p.age}{p.sex}</span><span>·</span>
              <span>{w.name} · Bed {p.bed}</span><span>·</span>
              <span>Admitted {p.admissionDate} ({p.admissionType})</span><span>·</span>
              <span>{team.name}</span>
            </div>
            <div className="mt-3 text-[14px]">
              <span className="font-medium">Primary:</span> {p.primaryDiagnosis}
              {p.secondary?.length>0 && <span className="ink-mute"> · Secondary: {p.secondary.join(', ')}</span>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <NEWSBadge score={p.news} size="lg"/>
            <span className="text-xs ink-mute">Latest at {p.vitals.at(-1).ts.slice(11,16)}</span>
          </div>
        </div>
      </div>

      <div className="flex border-b hairline">
        {['overview','vitals','notes','tasks','nok'].map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${tab===t?'border-[var(--brand)] text-[var(--brand)]':'border-transparent ink-mute hover:text-slate-700'}`}>
            {t==='nok'?'Next of Kin':t[0].toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {tab==='overview' && <PatientOverview p={p} tasks={tasks} notes={notes}/>}
      {tab==='vitals' && <PatientVitalsTab p={p}/>}
      {tab==='notes' && <PatientNotesTab p={p} notes={notes} ctx={ctx}/>}
      {tab==='tasks' && <PatientTasksTab tasks={tasks}/>}
      {tab==='nok'  && <PatientNoKTab p={p}/>}
    </div>
  );
}

function PatientOverview({ p, tasks, notes }){
  const v = p.vitals.at(-1);
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2 space-y-4">
        <div className="panel rounded">
          <div className="px-4 py-3 border-b hairline flex justify-between"><span className="font-semibold text-sm">Latest vitals</span><span className="text-xs ink-mute">{v.ts.slice(0,16).replace('T',' ')}</span></div>
          <div className="grid grid-cols-6 divide-x hairline">
            <Vital label="Resp rate" v={v.resp} unit="/min"/>
            <Vital label="SpO₂" v={v.spo2} unit="%"/>
            <Vital label="Temp" v={v.temp} unit="°C"/>
            <Vital label="Sys BP" v={v.sys} unit="mmHg"/>
            <Vital label="Heart rate" v={v.hr} unit="bpm"/>
            <Vital label="LOC" v={v.cons} unit=""/>
          </div>
        </div>
        <div className="panel rounded">
          <div className="px-4 py-3 border-b hairline font-semibold text-sm">NEWS trend (last 36h)</div>
          <div className="p-4"><NEWSSparkline history={p.vitals} w={680} h={120}/></div>
        </div>
        <div className="panel rounded">
          <div className="px-4 py-3 border-b hairline font-semibold text-sm">Recent clinical notes</div>
          <div className="divide-y hairline">{notes.slice(0,3).map(n=>(
            <div key={n.id} className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="chip" style={{background:'#dbeafe',color:'#1e40af'}}>{n.type.replace(/_/g,' ')}</span>
                <span className="text-xs ink-mute">{n.createdAt} · {userFullName(getUser(n.authorId))}</span>
              </div>
              <p className="text-sm ink-2 leading-relaxed">{n.body}</p>
            </div>
          ))}</div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="panel rounded p-4">
          <div className="font-semibold text-sm mb-2">Open tasks ({tasks.filter(t=>t.status!=='COMPLETED').length})</div>
          <div className="space-y-2">{tasks.filter(t=>t.status!=='COMPLETED').slice(0,4).map(t=>(
            <div key={t.id} className="text-sm border-b hairline pb-2">
              <div className="flex items-center justify-between"><span className="font-medium">{t.title}</span><PriorityChip priority={t.priority}/></div>
              <div className="text-xs ink-mute mono mt-0.5">{t.windowStart}–{t.windowEnd}</div>
            </div>
          ))}</div>
        </div>
        <div className="panel rounded p-4">
          <div className="font-semibold text-sm mb-2">Next of kin</div>
          {p.nok.map((n,i)=>(
            <div key={i} className="text-sm">
              <div className="font-medium">{n.name} <span className="ink-mute font-normal">· {n.relation}</span></div>
              <div className="ink-2 mono text-xs">{n.phone}</div>
              <div className="text-xs ink-mute mt-1">Notify via {n.method} · {n.consent?'consent given':'no consent'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Vital({ label, v, unit }){
  return (
    <div className="p-4">
      <div className="field-label">{label}</div>
      <div className="text-2xl font-semibold mt-1">{v}<span className="text-sm ink-mute font-normal ml-1">{unit}</span></div>
    </div>
  );
}

function PatientVitalsTab({ p }){
  return (
    <div className="panel rounded">
      <div className="px-4 py-3 border-b hairline flex items-center justify-between">
        <div className="font-semibold text-sm">Vitals history</div>
        <span className="text-xs ink-mute">{p.vitals.length} recordings</span>
      </div>
      <table className="cr">
        <thead><tr><th>Time</th><th>RR</th><th>SpO₂</th><th>Temp</th><th>Sys BP</th><th>HR</th><th>LOC</th><th>NEWS</th></tr></thead>
        <tbody>{[...p.vitals].reverse().map((v,i)=>(
          <tr key={i}>
            <td className="mono text-xs">{v.ts.slice(0,16).replace('T',' ')}</td>
            <td className="mono">{v.resp}</td><td className="mono">{v.spo2}</td>
            <td className="mono">{v.temp}</td><td className="mono">{v.sys}</td>
            <td className="mono">{v.hr}</td><td>{v.cons}</td>
            <td><NEWSBadge score={v.news} size="sm"/></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function PatientNotesTab({ p, notes, ctx }){
  const [open,setOpen]=useState(false);
  const isDoctor = ['CONSULTANT','REGISTRAR','JUNIOR_DOCTOR'].includes(ctx.role);
  return (
    <div className="space-y-3">
      {isDoctor && <button className="btn btn-primary" onClick={()=>setOpen(true)}><Icons.plus size={14}/>New note</button>}
      <div className="panel rounded divide-y hairline">{notes.map(n=>(
        <div key={n.id} className="p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="chip" style={{background:'#dbeafe',color:'#1e40af'}}>{n.type.replace(/_/g,' ')}</span>
            <span className="text-sm font-medium">{userFullName(getUser(n.authorId))}</span>
            <span className="text-xs ink-mute">· {n.createdAt}</span>
            <button className="ml-auto btn btn-ghost text-xs"><Icons.edit size={12}/>Amend</button>
          </div>
          <p className="text-sm ink-2 leading-relaxed">{n.body}</p>
        </div>
      ))}</div>
      <Modal open={open} onClose={()=>setOpen(false)} title="New clinical note" width={640} footer={<>
        <button className="btn" onClick={()=>setOpen(false)}>Cancel</button>
        <button className="btn btn-primary" onClick={()=>{ctx.toast({kind:'success',title:'Note saved'});setOpen(false);}}>Save note</button>
      </>}>
        <div className="space-y-3">
          <Field label="Type" required><select className="select"><option>PROGRESS_NOTE</option><option>ROUND_NOTE</option><option>ADMISSION_NOTE</option><option>DISCHARGE_NOTE</option><option>ESCALATION_NOTE</option></select></Field>
          <Field label="Note" required><textarea className="textarea" rows={8} placeholder="Document your assessment, plan, and any escalation…"/></Field>
          <p className="text-[11px] ink-mute">Notes are immutable once saved. Use Amend to add corrections; the original remains in the audit trail.</p>
        </div>
      </Modal>
    </div>
  );
}

function PatientTasksTab({ tasks }){
  return (
    <div className="space-y-2">{tasks.map(t=><TaskCard key={t.id} task={t}/>)}</div>
  );
}

function PatientNoKTab({ p }){
  return (
    <div className="panel rounded p-4 space-y-3">
      <div className="flex justify-between items-center"><h3 className="font-semibold text-sm">Next of kin contacts</h3><button className="btn"><Icons.plus size={14}/>Add</button></div>
      {p.nok.map((n,i)=>(
        <div key={i} className="border hairline rounded p-3 grid grid-cols-4 gap-3 items-center">
          <div><div className="field-label">Name</div><div className="font-medium">{n.name}</div></div>
          <div><div className="field-label">Relation</div><div>{n.relation}</div></div>
          <div><div className="field-label">Contact</div><div className="mono text-sm">{n.phone}</div>{n.email&&<div className="mono text-xs ink-mute">{n.email}</div>}</div>
          <div><div className="field-label">Notify · Consent</div><div className="text-sm">{n.method} · {n.consent?<span className="text-emerald-700">Granted</span>:<span className="text-amber-700">Not granted</span>}</div></div>
        </div>
      ))}
    </div>
  );
}

// =========================================================
// CONSULTANT — TEAM MGMT, ESCALATION INBOX
// =========================================================
function MyTeamPage({ ctx }){
  const team = TEAMS.find(t=>t.consultantId===ROLE_USER_MAP['CONSULTANT']);
  const [open,setOpen] = useState(false);
  return (
    <div className="space-y-4">
      <PageHeader title={team.name} subtitle={`${team.members.length} members · covers ${team.wards.map(w=>getWard(w).name).join(', ')}`}>
        <button className="btn btn-primary" onClick={()=>setOpen(true)}><Icons.plus size={14}/>Invite member</button>
      </PageHeader>
      <div className="grid grid-cols-2 gap-4">
        <div className="panel rounded">
          <div className="px-4 py-3 border-b hairline font-semibold text-sm">Members</div>
          <div className="divide-y hairline">{team.members.map(uid=>{
            const u = getUser(uid);
            return (
              <div key={uid} className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-sm">{u.firstName[0]}{u.lastName[0]}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{userFullName(u)}</div>
                  <div className="text-xs ink-mute">{u.email}</div>
                </div>
                <RoleBadge role={u.role}/>
                {u.role!=='CONSULTANT' && <button className="btn btn-ghost text-xs" onClick={()=>ctx.toast({kind:'success',title:'Member removed'})}>Remove</button>}
              </div>
            );
          })}</div>
        </div>
        <div className="panel rounded">
          <div className="px-4 py-3 border-b hairline font-semibold text-sm">Pending invites</div>
          {team.pendingInvites.length===0 ? <div className="p-6 text-center ink-mute text-sm">No pending invites</div> :
            <div className="divide-y hairline">{team.pendingInvites.map(i=>(
              <div key={i.id} className="p-3 flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-sm font-medium">{i.email}</div>
                  <div className="text-xs ink-mute">Invited {i.sentAt} · expires {i.expiresAt}</div>
                </div>
                <RoleBadge role={i.role}/>
                <button className="btn btn-ghost text-xs">Cancel</button>
              </div>
            ))}</div>
          }
        </div>
      </div>
      <Modal open={open} onClose={()=>setOpen(false)} title="Invite team member" footer={<>
        <button className="btn" onClick={()=>setOpen(false)}>Cancel</button>
        <button className="btn btn-primary" onClick={()=>{ctx.toast({kind:'success',title:'Invite sent'});setOpen(false);}}>Send invite</button>
      </>}>
        <div className="space-y-3">
          <Field label="User to invite" required><select className="select">{USERS.filter(u=>['REGISTRAR','JUNIOR_DOCTOR'].includes(u.role)).map(u=><option key={u.id}>{userFullName(u)} — {u.role}</option>)}</select></Field>
          <Field label="Role on team"><select className="select"><option>REGISTRAR</option><option>JUNIOR_DOCTOR</option></select></Field>
          <Field label="Message (optional)"><textarea className="textarea" rows={3}/></Field>
        </div>
      </Modal>
    </div>
  );
}

function EscalationInbox({ ctx, scope='consultant' }){
  const me = ROLE_USER_MAP[ctx.role];
  let list = ESCALATIONS.filter(e=>scope==='consultant'?e.assigneeId===me || ['u_cons1'].includes(e.assigneeId): e.status!=='RESOLVED');
  if(scope==='registrar') list = ESCALATIONS;
  return (
    <div className="space-y-4">
      <PageHeader title={scope==='registrar'?'On-call escalation queue':'Escalation inbox'} subtitle={`${list.filter(e=>e.status==='OPEN').length} open · auto-refresh 20s`}/>
      <div className="space-y-3">
        {list.map(e=><EscalationCard key={e.id} esc={e}
          onAck={()=>ctx.toast({kind:'success', title:'Escalation acknowledged'})}
          onResolve={()=>ctx.toast({kind:'success', title:'Escalation resolved'})}
        />)}
      </div>
    </div>
  );
}

// =========================================================
// REGISTRAR — ADMISSION FORM
// =========================================================
function AdmissionForm({ ctx }){
  const [dept,setDept] = useState('d1');
  const onCallTeam = TEAMS.find(t=>t.deptId===dept);
  return (
    <div className="space-y-4">
      <PageHeader title="Admit patient" subtitle="On-call admission — patient will be assigned to the on-call team"/>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 panel rounded p-5 space-y-4">
          <h3 className="font-semibold text-sm">Patient details</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="MRN" hint="Or leave blank to auto-generate"><input className="input mono" placeholder="OMTH-…"/></Field>
            <Field label="Admission type" required><select className="select"><option>EMERGENCY</option><option>ELECTIVE</option><option>TRANSFER</option></select></Field>
            <Field label="First name" required><input className="input"/></Field>
            <Field label="Last name" required><input className="input"/></Field>
            <Field label="Sex" required><select className="select"><option>M</option><option>F</option></select></Field>
            <Field label="Age" required><input className="input mono" type="number" min={0} max={120}/></Field>
          </div>
          <h3 className="font-semibold text-sm pt-2">Clinical</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Specialty / department" required>
              <select className="select" value={dept} onChange={e=>setDept(e.target.value)}>{DEPARTMENTS.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select>
            </Field>
            <Field label="Ward" required><select className="select">{WARDS.filter(w=>w.deptId===dept).map(w=><option key={w.id}>{w.name}</option>)}</select></Field>
            <Field label="Bed number" required><input className="input mono" placeholder="B-…"/></Field>
            <Field label="Initial acuity" required><select className="select"><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select></Field>
          </div>
          <Field label="Primary diagnosis" required><input className="input" placeholder="e.g. Severe community-acquired pneumonia"/></Field>
          <Field label="Secondary diagnoses"><textarea className="textarea" rows={2} placeholder="One per line"/></Field>
          <Field label="Admission notes"><textarea className="textarea" rows={4}/></Field>
        </div>
        <div className="space-y-4">
          <div className="panel rounded p-4">
            <div className="field-label mb-2">On-call team for this specialty</div>
            <div className="font-semibold">{onCallTeam?.name || '—'}</div>
            <div className="text-xs ink-mute mt-1">Patient will be assigned to this firm</div>
            <div className="mt-3 pt-3 border-t hairline space-y-2">
              <div className="text-xs ink-mute">On-call now</div>
              {ON_CALL.filter(o=>o.deptId===dept).map(o=>(
                <div key={o.id} className="flex items-center justify-between text-sm">
                  <span>{userFullName(getUser(o.userId))}</span><RoleBadge role={o.role}/>
                </div>
              ))}
            </div>
          </div>
          <div className="panel rounded p-4 space-y-3">
            <h4 className="font-semibold text-sm">Next of kin</h4>
            <Field label="Name"><input className="input"/></Field>
            <Field label="Phone"><input className="input mono" placeholder="+234…"/></Field>
            <Field label="Notify via"><select className="select"><option>SMS</option><option>EMAIL</option><option>BOTH</option></select></Field>
            <ToggleRow label="Consent given"/>
          </div>
          <button className="btn btn-primary w-full justify-center" onClick={()=>ctx.toast({kind:'success',title:'Patient admitted',body:'OMTH-204971 — assigned to bed B-22'})}>Admit patient</button>
        </div>
      </div>
    </div>
  );
}

// JD — Tasks
function MyTasksList({ ctx, role='JUNIOR_DOCTOR' }){
  const me = ROLE_USER_MAP[role];
  const [filter,setFilter] = useState('OPEN');
  let list = TASKS.filter(t=>t.assigneeId===me);
  if(filter==='OPEN') list = list.filter(t=>t.status!=='COMPLETED');
  if(filter==='COMPLETED') list = list.filter(t=>t.status==='COMPLETED');
  return (
    <div className="space-y-4">
      <PageHeader title="My tasks" subtitle={`${list.length} ${filter.toLowerCase()} · today 6 May 2026`}>
        {role==='NURSE' && <button className="btn btn-primary"><Icons.plus size={14}/>New care plan task</button>}
      </PageHeader>
      <div className="flex gap-2">
        {['OPEN','COMPLETED','ALL'].map(f=><button key={f} onClick={()=>setFilter(f)} className={`btn ${filter===f?'btn-primary':''}`}>{f}</button>)}
      </div>
      <div className="space-y-2">{list.map(t=><TaskCard key={t.id} task={t} onAdvance={()=>ctx.toast({kind:'success',title:`Task ${t.status==='PENDING'?'started':'completed'}`})}/>)}</div>
    </div>
  );
}

function HandoverNotesEntry({ ctx }){
  const [notes,setNotes] = useState({});
  return (
    <div className="space-y-4">
      <PageHeader title="Handover notes" subtitle="Soyinka Ward · End of morning shift · 14:30"/>
      <div className="panel rounded p-3 flex items-center gap-3 bg-amber-50 border-amber-200">
        <Icons.alertCircle size={16} className="text-amber-700"/>
        <div className="text-sm ink-2">Add a status summary for every patient. Mark urgent flags for the incoming team.</div>
      </div>
      <div className="space-y-3">{PATIENTS.filter(p=>p.wardId==='w1').map(p=>(
        <div key={p.id} className="panel rounded">
          <div className="px-4 py-3 border-b hairline flex items-center gap-3">
            <span className="mono text-xs">{p.bed}</span>
            <span className="font-semibold">{patientFullName(p)}</span>
            <AcuityBadge level={p.acuity}/><NEWSBadge score={p.news} size="sm"/><StatusChip status={p.status}/>
            <label className="ml-auto flex items-center gap-1.5 text-xs"><input type="checkbox"/>Urgent flag</label>
          </div>
          <div className="p-3">
            <textarea className="textarea" rows={2} placeholder="Status summary, outstanding jobs, things the night team must know…" value={notes[p.id]||''} onChange={e=>setNotes({...notes,[p.id]:e.target.value})}/>
          </div>
        </div>
      ))}</div>
      <div className="flex justify-end"><button className="btn btn-primary" onClick={()=>ctx.toast({kind:'success',title:'Handover notes saved',body:`${Object.keys(notes).length} of ${PATIENTS.filter(p=>p.wardId==='w1').length} patients with notes`})}>Save handover notes</button></div>
    </div>
  );
}

function RoundParticipateView({ ctx }){
  const r = ROUNDS.find(x=>x.status==='IN_PROGRESS');
  const queue = r.queue.map(id=>getPatient(id));
  return (
    <div className="space-y-4">
      <PageHeader title="Active ward round (read-only)" subtitle={`${r.type} round · led by ${userFullName(getUser(r.leadId))} · started ${r.startedAt.slice(11)}`}/>
      <div className="grid grid-cols-3 gap-4">
        <div className="panel rounded col-span-2">
          <div className="px-4 py-3 border-b hairline font-semibold text-sm">Patient queue</div>
          <div>{queue.map((p,i)=>(
            <PatientRow key={p.id} patient={p} reviewed={r.reviewed.includes(p.id)} current={!r.reviewed.includes(p.id) && r.reviewed.length===i}/>
          ))}</div>
        </div>
        <div className="panel rounded p-4">
          <div className="font-semibold text-sm mb-2">Participants</div>
          <div className="space-y-2 text-sm">{r.participants.map(uid=>{
            const u = getUser(uid);
            return <div key={uid} className="flex items-center justify-between"><span>{userFullName(u)}</span><RoleBadge role={u.role}/></div>;
          })}</div>
          <div className="mt-4 pt-4 border-t hairline">
            <div className="font-semibold text-sm mb-2">Progress</div>
            <div className="text-3xl font-semibold">{r.reviewed.length}<span className="text-base ink-mute font-normal">/{r.queue.length}</span></div>
            <div className="text-xs ink-mute">patients reviewed</div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  PatientList, PatientDetail, MyTeamPage, EscalationInbox, AdmissionForm,
  MyTasksList, HandoverNotesEntry, RoundParticipateView
});
