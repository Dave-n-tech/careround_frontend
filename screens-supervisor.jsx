// Ward Supervisor screens

const { useState, useMemo } = React;

function SupervisorDashboard({ ctx }){
  const ward = WARDS[0];
  const wardPatients = PATIENTS.filter(p=>p.wardId==='w1');
  const wardTasks = TASKS.filter(t=>wardPatients.find(p=>p.id===t.patientId));
  const wardEsc = ESCALATIONS.filter(e=>wardPatients.find(p=>p.id===e.patientId));
  const completed = wardTasks.filter(t=>t.status==='COMPLETED').length;
  const overdue = wardTasks.filter(t=>t.status!=='COMPLETED' && t.windowEnd < currentTimeStr()).length;
  const completionRate = Math.round(completed/wardTasks.length*100);
  const occupancy = Math.round(ward.occupied/ward.beds*100);
  const activeShift = SHIFTS.find(s=>s.wardId==='w1' && s.status==='ACTIVE');
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{ward.name}</h1>
          <p className="ink-mute text-sm">{getDept(ward.deptId).name} · 6 May 2026 · auto-refresh 30s · last updated 8s ago</p>
        </div>
        <button className="btn"><Icons.refresh size={14}/>Refresh now</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="panel rounded p-4">
          <div className="field-label">Bed occupancy</div>
          <div className="text-3xl font-semibold mt-1">{ward.occupied}<span className="text-base ink-mute font-normal">/{ward.beds}</span></div>
          <div className="h-2 rounded bg-slate-100 mt-2 overflow-hidden"><div className="h-full" style={{width:occupancy+'%', background:occupancy>85?'#b91c1c':'#15803d'}}/></div>
          <div className="text-xs ink-mute mt-1">{occupancy}% occupancy · 3 free</div>
        </div>
        <div className="panel rounded p-4">
          <div className="field-label">Task completion</div>
          <div className="flex items-center gap-3 mt-1">
            <Donut pct={completionRate}/>
            <div>
              <div className="text-2xl font-semibold">{completionRate}%</div>
              <div className="text-xs ink-mute">{completed}/{wardTasks.length} today</div>
            </div>
          </div>
        </div>
        <div className="panel rounded p-4">
          <div className="field-label">Overdue tasks</div>
          <div className="text-3xl font-semibold mt-1" style={{color:overdue>0?'#b91c1c':'#15803d'}}>{overdue}</div>
          <div className="text-xs ink-mute mt-1">{overdue>0?'Requires action':'All on track'}</div>
        </div>
        <div className="panel rounded p-4">
          <div className="field-label">Open escalations</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-semibold" style={{color:'#b91c1c'}}>{wardEsc.filter(e=>e.severity==='RED').length}</span>
            <span className="text-xs">RED</span>
            <span className="text-3xl font-semibold ml-3" style={{color:'#b45309'}}>{wardEsc.filter(e=>e.severity==='AMBER').length}</span>
            <span className="text-xs">AMBER</span>
          </div>
          <div className="text-xs ink-mute mt-1">{wardEsc.filter(e=>e.status==='OPEN').length} unacknowledged</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="panel rounded col-span-2">
          <div className="px-4 py-3 border-b hairline flex items-center justify-between">
            <div className="font-semibold text-sm">Active patients — by acuity</div>
            <button className="btn btn-ghost text-xs">View all</button>
          </div>
          <table className="cr">
            <thead><tr><th>Bed</th><th>Patient</th><th>Acuity</th><th>NEWS</th><th>Status</th><th>Open tasks</th></tr></thead>
            <tbody>{wardPatients.slice(0,6).map(p=>{
              const open = TASKS.filter(t=>t.patientId===p.id && t.status!=='COMPLETED').length;
              return <tr key={p.id}>
                <td className="mono text-xs">{p.bed}</td>
                <td className="font-medium">{patientFullName(p)}</td>
                <td><AcuityBadge level={p.acuity}/></td>
                <td><NEWSBadge score={p.news} size="sm"/></td>
                <td><StatusChip status={p.status}/></td>
                <td><span className="mono">{open}</span></td>
              </tr>;
            })}</tbody>
          </table>
        </div>
        <div className="space-y-4">
          <div className="panel rounded p-4">
            <div className="field-label mb-2">Current shift</div>
            <div className="font-semibold">{activeShift.name}</div>
            <div className="text-xs ink-mute mb-2">Started 07:00 · {Math.floor((Date.now()/3600000)%24)-7}h elapsed</div>
            <div className="space-y-2 mt-3 pt-3 border-t hairline">
              <div className="flex justify-between text-sm"><span className="ink-mute">Lead doctor</span><span className="font-medium">{userFullName(getUser(activeShift.leadDoctorId))}</span></div>
              <div className="flex justify-between text-sm"><span className="ink-mute">Nurse in charge</span><span className="font-medium">{userFullName(getUser(activeShift.nurseInChargeId))}</span></div>
            </div>
          </div>
          <div className="panel rounded p-4">
            <div className="field-label mb-2">Active rounds</div>
            {ROUNDS.filter(r=>r.status==='IN_PROGRESS').map(r=>(
              <div key={r.id} className="text-sm">
                <div className="font-medium">{r.type} round</div>
                <div className="text-xs ink-mute">Led by {userFullName(getUser(r.leadId))}</div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-2 rounded bg-slate-100 overflow-hidden">
                    <div className="h-full bg-emerald-600" style={{width:`${r.reviewed.length/r.queue.length*100}%`}}/>
                  </div>
                  <span className="mono text-xs">{r.reviewed.length}/{r.queue.length}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel rounded">
        <div className="px-4 py-3 border-b hairline font-semibold text-sm">Open escalations</div>
        <div className="p-3 space-y-2">{wardEsc.filter(e=>e.status!=='RESOLVED').map(e=><EscalationCard key={e.id} esc={e} onAck={()=>ctx.toast({kind:'success',title:'Acknowledged'})} onResolve={()=>ctx.toast({kind:'success',title:'Resolved'})}/>)}</div>
      </div>
    </div>
  );
}

function Donut({ pct, size=56 }){
  const r = (size-8)/2; const c = 2*Math.PI*r;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} stroke="#e2e8f0" strokeWidth="6" fill="none"/>
      <circle cx={size/2} cy={size/2} r={r} stroke="#15803d" strokeWidth="6" fill="none"
        strokeDasharray={`${c*pct/100} ${c}`} transform={`rotate(-90 ${size/2} ${size/2})`} strokeLinecap="round"/>
    </svg>
  );
}

// =========================================================
// SHIFT ASSIGNMENT
// =========================================================
function ShiftAssignment({ ctx }){
  const [assignments, setAssignments] = useState({});
  const pending = SHIFTS.filter(s=>s.status==='PENDING_ASSIGNMENT');
  const active = SHIFTS.filter(s=>s.status==='ACTIVE');
  const wardOptions = [...new Set(SHIFTS.map(s=>s.wardId))];

  function assign(shiftId, key, val){
    setAssignments({...assignments, [shiftId]: { ...(assignments[shiftId]||{}), [key]: val }});
  }
  function activate(shiftId){
    const a = assignments[shiftId];
    if(!a?.lead || !a?.nurse){ ctx.toast({kind:'error',title:'Assign both lead doctor and nurse in charge'}); return; }
    ctx.toast({kind:'success', title:'Shift activated', body:'Lead and nurse in charge notified'});
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Shift assignment" subtitle={`${pending.length} shifts awaiting assignment · ${active.length} active`}/>

      <div className="panel rounded">
        <div className="px-4 py-3 border-b hairline flex items-center justify-between">
          <div className="font-semibold text-sm">Pending assignment</div>
          <span className="text-xs ink-mute">Auto-generated by Quartz · Today 6 May 2026 + tomorrow</span>
        </div>
        <div className="divide-y hairline">{pending.map(s=>{
          const w = getWard(s.wardId);
          const a = assignments[s.id]||{};
          const docs = USERS.filter(u=>['REGISTRAR','CONSULTANT','JUNIOR_DOCTOR'].includes(u.role));
          const nurses = USERS.filter(u=>u.role==='NURSE');
          return (
            <div key={s.id} className="p-4 grid grid-cols-[1fr_220px_220px_140px] gap-4 items-center">
              <div>
                <div className="font-semibold text-sm">{s.name}</div>
                <div className="text-xs ink-mute">{w.name} · {s.date}</div>
                <div className="mt-1.5"><StatusChip status={s.status}/></div>
              </div>
              <Field label="Lead doctor">
                <select className="select" value={a.lead||''} onChange={e=>assign(s.id,'lead',e.target.value)}>
                  <option value="">Select…</option>
                  {docs.map(u=><option key={u.id} value={u.id}>{userFullName(u)} — {u.role}</option>)}
                </select>
              </Field>
              <Field label="Nurse in charge">
                <select className="select" value={a.nurse||''} onChange={e=>assign(s.id,'nurse',e.target.value)}>
                  <option value="">Select…</option>
                  {nurses.map(u=><option key={u.id} value={u.id}>{userFullName(u)}</option>)}
                </select>
              </Field>
              <button className="btn btn-primary justify-center" disabled={!a.lead||!a.nurse} onClick={()=>activate(s.id)}>Activate shift</button>
            </div>
          );
        })}</div>
      </div>

      <div className="panel rounded">
        <div className="px-4 py-3 border-b hairline font-semibold text-sm">Active shifts</div>
        <table className="cr">
          <thead><tr><th>Shift</th><th>Ward</th><th>Lead</th><th>Nurse in charge</th><th>Status</th></tr></thead>
          <tbody>{active.map(s=>(
            <tr key={s.id}>
              <td className="font-medium">{s.name}</td>
              <td>{getWard(s.wardId).name}</td>
              <td>{userFullName(getUser(s.leadDoctorId))}</td>
              <td>{userFullName(getUser(s.nurseInChargeId))}</td>
              <td><StatusChip status={s.status}/></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// =========================================================
// HANDOVER
// =========================================================
function HandoverManagement({ ctx }){
  const [step,setStep] = useState(0);
  const [handoverNotes, setHandoverNotes] = useState({});
  const [urgent, setUrgent] = useState({});
  const wardPatients = PATIENTS.filter(p=>p.wardId==='w1');
  const outgoingShift = SHIFTS.find(s=>s.id==='sh1');
  const incomingShift = SHIFTS.find(s=>s.id==='sh2');

  if(step===0){
    return (
      <div className="space-y-4">
        <PageHeader title="Initiate handover" subtitle="Soyinka Ward · End of morning shift"/>
        <div className="panel rounded p-5 space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="border hairline rounded p-4">
              <div className="field-label mb-2">Outgoing shift</div>
              <div className="font-semibold">{outgoingShift.name}</div>
              <div className="text-sm mt-2 space-y-1">
                <div><span className="ink-mute">Lead:</span> {userFullName(getUser(outgoingShift.leadDoctorId))}</div>
                <div><span className="ink-mute">Nurse i/c:</span> {userFullName(getUser(outgoingShift.nurseInChargeId))}</div>
              </div>
            </div>
            <div className="border hairline rounded p-4">
              <div className="field-label mb-2">Incoming shift</div>
              <div className="font-semibold">{incomingShift.name}</div>
              {incomingShift.leadDoctorId ? <div className="text-sm mt-2 space-y-1"><div><span className="ink-mute">Lead:</span> {userFullName(getUser(incomingShift.leadDoctorId))}</div></div>
              : <div className="text-sm text-amber-700 mt-2">⚠ No lead assigned. <a href="#" className="underline">Assign now</a></div>}
            </div>
          </div>
          <div className="text-sm ink-2">{wardPatients.length} patients to hand over. Each needs a status summary; mark urgent flags as appropriate.</div>
          <button className="btn btn-primary" onClick={()=>setStep(1)}>Begin handover →</button>
        </div>
      </div>
    );
  }

  if(step===1){
    const filled = Object.keys(handoverNotes).filter(k=>handoverNotes[k]?.trim()).length;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Handover — patient notes</h1>
            <p className="text-sm ink-mute">Step 2 of 3 · {filled}/{wardPatients.length} patients with notes</p>
          </div>
          <div className="flex gap-2">
            <button className="btn" onClick={()=>setStep(0)}>← Back</button>
            <button className="btn btn-primary" onClick={()=>setStep(2)} disabled={filled<wardPatients.length}>Continue to sign-off →</button>
          </div>
        </div>
        <div className="space-y-3">{wardPatients.map(p=>(
          <div key={p.id} className="panel rounded">
            <div className="px-4 py-2.5 border-b hairline flex items-center gap-3">
              <span className="mono text-xs">{p.bed}</span>
              <span className="font-semibold">{patientFullName(p)}</span>
              <AcuityBadge level={p.acuity}/><NEWSBadge score={p.news} size="sm"/><StatusChip status={p.status}/>
              <label className="ml-auto flex items-center gap-1.5 text-xs cursor-pointer">
                <input type="checkbox" checked={!!urgent[p.id]} onChange={e=>setUrgent({...urgent, [p.id]:e.target.checked})}/>
                <span className={urgent[p.id]?'text-red-700 font-semibold':''}>Urgent flag</span>
              </label>
            </div>
            <div className="p-3 grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <textarea className="textarea" rows={2} placeholder="Status summary, key events this shift, jobs pending…"
                  value={handoverNotes[p.id]||''} onChange={e=>setHandoverNotes({...handoverNotes,[p.id]:e.target.value})}/>
              </div>
              <div className="text-xs ink-2 space-y-1">
                <div className="field-label">Outstanding tasks</div>
                {TASKS.filter(t=>t.patientId===p.id && t.status!=='COMPLETED').map(t=>(
                  <div key={t.id}>• {t.title} <span className="ink-mute">({t.windowStart}–{t.windowEnd})</span></div>
                ))}
                {TASKS.filter(t=>t.patientId===p.id && t.status!=='COMPLETED').length===0 && <span className="ink-mute">None</span>}
              </div>
            </div>
          </div>
        ))}</div>
      </div>
    );
  }

  // step 2 — sign off
  const urgentCount = Object.values(urgent).filter(Boolean).length;
  return (
    <div className="space-y-4">
      <PageHeader title="Sign off handover" subtitle="Step 3 of 3"/>
      <div className="panel rounded p-5">
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div><div className="field-label">Patients handed over</div><div className="text-2xl font-semibold mt-1">{wardPatients.length}</div></div>
          <div><div className="field-label">Urgent flags</div><div className="text-2xl font-semibold mt-1" style={{color:urgentCount>0?'#b91c1c':'#15803d'}}>{urgentCount}</div></div>
          <div><div className="field-label">Open tasks transferred</div><div className="text-2xl font-semibold mt-1">{TASKS.filter(t=>t.status!=='COMPLETED').length}</div></div>
        </div>
        <div className="space-y-2 border-t hairline pt-4">
          <h3 className="font-semibold text-sm mb-2">Sign-off checklist</h3>
          {[
            'All patients have a documented handover note',
            'Outstanding tasks have been transferred to the incoming team',
            'Urgent flags have been verbally communicated',
            'Incoming nurse in charge has confirmed receipt'
          ].map((it,i)=>(
            <label key={i} className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked/>{it}</label>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t hairline">
          <button className="btn" onClick={()=>setStep(1)}>← Back</button>
          <button className="btn btn-primary" onClick={()=>{ ctx.toast({kind:'success', title:'Handover signed off', body:'Incoming team notified'}); setStep(0); }}>
            Sign off handover
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// REPORTS
// =========================================================
function Reports({ ctx }){
  const [tab,setTab] = useState('completion');
  return (
    <div className="space-y-4">
      <PageHeader title="Reports" subtitle="Soyinka Ward · last 30 days"/>
      <div className="flex gap-2">
        {[['completion','Task completion'],['overdue','Overdue tasks'],['rounds','Round history'],['flow','Patient flow']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} className={`btn ${tab===k?'btn-primary':''}`}>{l}</button>
        ))}
      </div>
      <div className="panel rounded p-5">
        {tab==='completion' && <BarChart title="Task completion rate by day" labels={['Apr 28','29','30','May 1','2','3','4','5','6']} values={[88,91,87,93,89,84,90,92,89]} unit="%"/>}
        {tab==='overdue'    && <BarChart title="Overdue task count by day" labels={['Apr 28','29','30','May 1','2','3','4','5','6']} values={[3,2,5,1,4,7,3,2,1]} unit=""/>}
        {tab==='rounds'     && <RoundHistoryTable/>}
        {tab==='flow'       && <BarChart title="Admissions vs discharges" labels={['Apr 28','29','30','May 1','2','3','4','5','6']} values={[6,8,7,9,5,8,6,7,9]} values2={[4,7,6,5,8,6,7,5,8]} unit=""/>}
      </div>
    </div>
  );
}

function BarChart({ title, labels, values, values2, unit }){
  const max = Math.max(...values, ...(values2||[0]));
  return (
    <div>
      <h3 className="font-semibold text-sm mb-4">{title}</h3>
      <div className="flex items-end gap-3 h-56 border-b hairline">
        {labels.map((l,i)=>(
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
            <div className="w-full flex gap-1 items-end" style={{height:'100%'}}>
              <div className="flex-1 rounded-t" style={{height:`${values[i]/max*90}%`,background:'#0b5cab'}} title={values[i]+unit}/>
              {values2 && <div className="flex-1 rounded-t" style={{height:`${values2[i]/max*90}%`,background:'#0e7490'}}/>}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-2">
        {labels.map((l,i)=><div key={i} className="flex-1 text-center text-[10px] ink-mute mono">{l}</div>)}
      </div>
      <div className="flex gap-4 text-xs mt-3">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{background:'#0b5cab'}}/>{values2?'Admissions':'Value'}</div>
        {values2 && <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{background:'#0e7490'}}/>Discharges</div>}
      </div>
    </div>
  );
}

function RoundHistoryTable(){
  const rows = [
    { date:'2026-05-06', type:'MORNING', lead:'Prof. Adaeze Okafor', patients:7, dur:'1h 12m', status:'IN_PROGRESS' },
    { date:'2026-05-05', type:'EVENING', lead:'Dr. Chinedu Eze', patients:6, dur:'42m', status:'COMPLETED' },
    { date:'2026-05-05', type:'MORNING', lead:'Prof. Adaeze Okafor', patients:7, dur:'1h 18m', status:'COMPLETED' },
    { date:'2026-05-04', type:'POST_TAKE', lead:'Dr. Folake Adebayo', patients:3, dur:'25m', status:'COMPLETED' },
    { date:'2026-05-04', type:'BOARD', lead:'Prof. Adaeze Okafor', patients:7, dur:'18m', status:'COMPLETED' },
    { date:'2026-05-03', type:'WEEKEND', lead:'Dr. Chinedu Eze', patients:14, dur:'2h 4m', status:'COMPLETED' },
  ];
  return (
    <table className="cr"><thead><tr><th>Date</th><th>Type</th><th>Lead</th><th>Patients</th><th>Duration</th><th>Status</th></tr></thead>
      <tbody>{rows.map((r,i)=>(<tr key={i}><td className="mono text-xs">{r.date}</td><td><span className="chip" style={{background:'#dbeafe',color:'#1e40af'}}>{r.type}</span></td><td>{r.lead}</td><td className="mono">{r.patients}</td><td className="mono">{r.dur}</td><td><StatusChip status={r.status}/></td></tr>))}</tbody>
    </table>
  );
}

function RoundHistory({ ctx }){
  return (
    <div className="space-y-4">
      <PageHeader title="Round history" subtitle="Soyinka Ward"/>
      <div className="panel rounded overflow-hidden"><RoundHistoryTable/></div>
    </div>
  );
}

Object.assign(window, { SupervisorDashboard, ShiftAssignment, HandoverManagement, Reports, RoundHistory });
