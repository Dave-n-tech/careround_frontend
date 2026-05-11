// Ward Round Wizard — multi-step stateful flow

const { useState, useMemo } = React;

function RoundWizard({ ctx }){
  const [step, setStep] = useState(()=>{
    const saved = sessionStorage.getItem('cr_round_step');
    return saved? +saved : 0;
  });
  const [round, setRound] = useState({
    type:'MORNING', leadId: ROLE_USER_MAP[ctx.role]==='u_cons1'?'u_cons1':'u_reg1',
    participants: ['u_cons1','u_reg1','u_jr1','u_jr2'],
    queue: ['p1','p6','p2','p3','p5','p7','p4'],
    reviewed: {},
    tasks: {},
    currentIdx: 0,
  });
  React.useEffect(()=>{ sessionStorage.setItem('cr_round_step', step); },[step]);

  const stepNames = ['Setup','Confirm & start','Patient queue','Review','Post-round tasks','Complete'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Conduct ward round</h1>
          <p className="text-xs ink-mute">Step {step+1} of 6 · {stepNames[step]}</p>
        </div>
        <button className="btn btn-ghost text-sm" onClick={()=>{sessionStorage.removeItem('cr_round_step'); setStep(0);}}>Restart</button>
      </div>
      {/* Stepper */}
      <div className="flex items-center gap-1.5">{stepNames.map((s,i)=>(
        <div key={i} className={`flex-1 h-1 rounded-full ${i<=step?'bg-[var(--brand)]':'bg-slate-200'}`}/>
      ))}</div>

      {step===0 && <Step0 round={round} setRound={setRound} onNext={()=>setStep(1)} ctx={ctx}/>}
      {step===1 && <Step1 round={round} onBack={()=>setStep(0)} onNext={()=>setStep(2)} ctx={ctx}/>}
      {step===2 && <Step2 round={round} setRound={setRound} onBack={()=>setStep(1)} onReview={(idx)=>{setRound(r=>({...r,currentIdx:idx})); setStep(3);}} onComplete={()=>setStep(5)} ctx={ctx}/>}
      {step===3 && <Step3 round={round} setRound={setRound} onBack={()=>setStep(2)} onNext={()=>setStep(4)} ctx={ctx}/>}
      {step===4 && <Step4 round={round} setRound={setRound} onBack={()=>setStep(3)} onNextPatient={()=>setStep(2)} ctx={ctx}/>}
      {step===5 && <Step5 round={round} onBack={()=>setStep(2)} onComplete={()=>{ ctx.toast({kind:'success',title:'Round completed',body:'Notifications dispatched to next-of-kin'}); sessionStorage.removeItem('cr_round_step'); setStep(0); }} ctx={ctx}/>}
    </div>
  );
}

function Step0({ round, setRound, onNext, ctx }){
  return (
    <div className="panel rounded p-6 space-y-5 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold">Round setup</h2>
        <p className="text-sm ink-mute mt-1">Configure who is on the round and what type it is.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Round type" required>
          <select className="select" value={round.type} onChange={e=>setRound({...round,type:e.target.value})}>
            <option>MORNING</option><option>POST_TAKE</option><option>BOARD</option>
            <option>EVENING</option><option>WEEKEND</option>
          </select>
        </Field>
        <Field label="Lead doctor" required hint={ctx.role==='REGISTRAR'?'Consultant absent — registrar leading':''}>
          <select className="select" value={round.leadId} onChange={e=>setRound({...round,leadId:e.target.value})}>
            {USERS.filter(u=>['CONSULTANT','REGISTRAR'].includes(u.role)).map(u=><option key={u.id} value={u.id}>{userFullName(u)}</option>)}
          </select>
        </Field>
      </div>
      <div>
        <div className="field-label mb-2">Team members on this round</div>
        <div className="grid grid-cols-2 gap-2">
          {USERS.filter(u=>['CONSULTANT','REGISTRAR','JUNIOR_DOCTOR','NURSE'].includes(u.role)).map(u=>(
            <label key={u.id} className="flex items-center gap-2 p-2 border hairline rounded text-sm cursor-pointer hover:bg-slate-50">
              <input type="checkbox" checked={round.participants.includes(u.id)} onChange={e=>{
                const next = e.target.checked? [...round.participants,u.id] : round.participants.filter(x=>x!==u.id);
                setRound({...round, participants: next});
              }}/>
              <span className="flex-1">{userFullName(u)}</span>
              <RoleBadge role={u.role}/>
            </label>
          ))}
        </div>
      </div>
      <div className="rounded p-3 bg-emerald-50 border border-emerald-200 text-sm flex items-center gap-2">
        <Icons.check size={16} className="text-emerald-700"/>
        <span>Morning shift is <strong>ACTIVE</strong> — round can begin.</span>
      </div>
      <div className="flex justify-end"><button className="btn btn-primary" onClick={onNext}>Continue →</button></div>
    </div>
  );
}

function Step1({ round, onBack, onNext, ctx }){
  const queue = round.queue.map(getPatient);
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2 panel rounded">
        <div className="px-4 py-3 border-b hairline">
          <div className="font-semibold">Patient queue (auto-ordered)</div>
          <div className="text-xs ink-mute">By acuity DESC then NEWS DESC</div>
        </div>
        <div>{queue.map((p,i)=>(
          <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 border-b hairline">
            <div className="w-6 mono text-xs ink-mute text-center">{i+1}</div>
            <div className="w-16 mono text-xs">{p.bed}</div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{patientFullName(p)}</div>
              <div className="text-xs ink-mute">{p.primaryDiagnosis}</div>
            </div>
            <AcuityBadge level={p.acuity}/><NEWSBadge score={p.news} size="sm"/>
          </div>
        ))}</div>
      </div>
      <div className="space-y-4">
        <div className="panel rounded p-4">
          <div className="field-label mb-2">Round details</div>
          <div className="text-sm space-y-1.5">
            <div><span className="ink-mute">Type:</span> <span className="font-medium">{round.type}</span></div>
            <div><span className="ink-mute">Lead:</span> <span className="font-medium">{userFullName(getUser(round.leadId))}</span></div>
            <div><span className="ink-mute">Participants:</span> <span className="font-medium">{round.participants.length}</span></div>
            <div><span className="ink-mute">Patients:</span> <span className="font-medium">{round.queue.length}</span></div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button className="btn btn-primary justify-center py-2.5" onClick={onNext}>Begin round</button>
          <button className="btn justify-center" onClick={onBack}>← Back to setup</button>
        </div>
      </div>
    </div>
  );
}

function Step2({ round, setRound, onBack, onReview, onComplete, ctx }){
  const queue = round.queue.map(getPatient);
  const reviewedCount = Object.keys(round.reviewed).length;
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2 panel rounded">
        <div className="px-4 py-3 border-b hairline flex items-center justify-between">
          <div>
            <div className="font-semibold">Patient queue</div>
            <div className="text-xs ink-mute">Tap a patient to review · ↑/↓ to navigate</div>
          </div>
          <span className="chip" style={{background:'#dbeafe',color:'#1e40af'}}>ROUND IN PROGRESS</span>
        </div>
        <div>{queue.map((p,i)=>(
          <PatientRow key={p.id} patient={p}
            reviewed={!!round.reviewed[p.id]}
            current={!round.reviewed[p.id] && i===Object.keys(round.reviewed).length}
            onClick={()=>onReview(i)}
          />
        ))}</div>
      </div>
      <div className="space-y-4">
        <div className="panel rounded p-4">
          <div className="text-xs ink-mute mb-1">Progress</div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-semibold">{reviewedCount}</span>
            <span className="text-base ink-mute">/ {round.queue.length}</span>
          </div>
          <div className="mt-2 h-2 rounded bg-slate-100 overflow-hidden">
            <div className="h-full bg-emerald-600" style={{width:`${reviewedCount/round.queue.length*100}%`}}/>
          </div>
          <div className="text-xs ink-mute mt-1">patients reviewed</div>
        </div>
        <div className="panel rounded p-4">
          <div className="field-label mb-2">Participants</div>
          <div className="space-y-1.5 text-sm">{round.participants.map(uid=>{
            const u = getUser(uid);
            return <div key={uid} className="flex items-center justify-between">
              <span className="truncate">{userFullName(u)}</span>
              <RoleBadge role={u.role}/>
            </div>;
          })}</div>
        </div>
        <button className="btn btn-primary w-full justify-center py-2.5" onClick={onComplete} disabled={reviewedCount===0}>Complete round →</button>
        <button className="btn w-full justify-center" onClick={onBack}>← Back</button>
      </div>
    </div>
  );
}

function Step3({ round, setRound, onBack, onNext, ctx }){
  const p = getPatient(round.queue[round.currentIdx]);
  const v = p.vitals.at(-1);
  const [form, setForm] = useState({
    clinicalStatus: 'IMPROVING', wasExamined: true, news: v.news,
    plan: '', dischargeAssessment:'NONE', notifiedNok: false
  });
  const isCons = ctx.role==='CONSULTANT';

  function save(){
    setRound(r=>({...r, reviewed: {...r.reviewed, [p.id]: form}}));
    onNext();
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2 panel rounded p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{patientFullName(p)}</h2>
              <AcuityBadge level={p.acuity}/>
            </div>
            <div className="text-sm ink-mute">{p.mrn} · Bed {p.bed} · {p.primaryDiagnosis}</div>
          </div>
          <NEWSBadge score={p.news}/>
        </div>

        <div className="grid grid-cols-6 divide-x hairline border hairline rounded">
          <Vital label="RR" v={v.resp} unit="/min"/>
          <Vital label="SpO₂" v={v.spo2} unit="%"/>
          <Vital label="Temp" v={v.temp} unit="°C"/>
          <Vital label="Sys" v={v.sys} unit="mmHg"/>
          <Vital label="HR" v={v.hr} unit="bpm"/>
          <Vital label="LOC" v={v.cons} unit=""/>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <Field label="Clinical status" required>
            <select className="select" value={form.clinicalStatus} onChange={e=>setForm({...form,clinicalStatus:e.target.value})}>
              <option>IMPROVING</option><option>STABLE</option><option>UNCHANGED</option>
              <option>DETERIORATING</option><option>CRITICAL</option>
            </select>
          </Field>
          <Field label="NEWS at review" hint="Auto-filled from latest vitals">
            <input className="input mono" type="number" value={form.news} onChange={e=>setForm({...form,news:+e.target.value})}/>
          </Field>
          <div className="col-span-2">
            <Field label="Patient examined?">
              <div className="flex gap-2">
                <button onClick={()=>setForm({...form,wasExamined:true})} className={`btn ${form.wasExamined?'btn-primary':''}`}>Yes</button>
                <button onClick={()=>setForm({...form,wasExamined:false})} className={`btn ${!form.wasExamined?'btn-primary':''}`}>No (proxy review)</button>
              </div>
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Management plan" required>
              <textarea className="textarea" rows={5} value={form.plan} onChange={e=>setForm({...form,plan:e.target.value})}
                placeholder="Examination findings, decisions, drug changes, investigations, plan…"/>
            </Field>
          </div>
          <Field label="Discharge assessment">
            <select className="select" value={form.dischargeAssessment} onChange={e=>setForm({...form,dischargeAssessment:e.target.value})}>
              <option value="NONE">NONE</option>
              <option value="POSSIBLE">POSSIBLE — within 48h</option>
              <option value="CONFIRMED" disabled={!isCons}>CONFIRMED — discharge today {!isCons?'(consultant only)':''}</option>
              <option value="BLOCKED_SOCIAL">BLOCKED — social</option>
              <option value="BLOCKED_MEDICAL">BLOCKED — medical</option>
            </select>
          </Field>
          <Field label="Next-of-kin notified?">
            <div className="flex items-center gap-3 pt-1.5">
              <button className={`relative w-10 h-5 rounded-full ${form.notifiedNok?'bg-emerald-600':'bg-slate-300'}`} onClick={()=>setForm({...form,notifiedNok:!form.notifiedNok})}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${form.notifiedNok?'left-5':'left-0.5'}`}/>
              </button>
              <span className="text-xs ink-mute">{p.nok[0]?.name} via {p.nok[0]?.method}</span>
            </div>
          </Field>
        </div>

        <div className="flex items-center justify-between pt-3 border-t hairline">
          <button className="btn" onClick={onBack}>← Back to queue</button>
          <button className="btn btn-primary" onClick={save}>Save review &amp; add tasks →</button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="panel rounded">
          <div className="px-4 py-3 border-b hairline font-semibold text-sm">NEWS trend</div>
          <div className="p-4"><NEWSSparkline history={p.vitals} w={260} h={80}/></div>
        </div>
        <div className="panel rounded">
          <div className="px-4 py-3 border-b hairline font-semibold text-sm">Recent notes</div>
          <div className="p-3 space-y-2 max-h-[260px] overflow-y-auto scroll-thin">
            {CLINICAL_NOTES.filter(n=>n.patientId===p.id).map(n=>(
              <div key={n.id} className="text-xs ink-2 border-b hairline pb-2">
                <div className="font-medium">{n.type.replace(/_/g,' ')} · {n.createdAt.slice(11)}</div>
                <div className="ink-mute mt-0.5 line-clamp-3">{n.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Step4({ round, setRound, onBack, onNextPatient, ctx }){
  const p = getPatient(round.queue[round.currentIdx]);
  const [tasks, setTasks] = useState(round.tasks[p.id] || []);
  const [draft, setDraft] = useState({ title:'', priority:'ROUTINE', assigneeRole:'NURSE', windowStart:'10:00', windowEnd:'14:00' });

  function add(){
    if(!draft.title) return;
    const next = [...tasks, { ...draft, id:'t_'+Math.random().toString(36).slice(2,7) }];
    setTasks(next);
    setRound(r=>({...r, tasks: {...r.tasks, [p.id]: next}}));
    setDraft({ title:'', priority:'ROUTINE', assigneeRole:'NURSE', windowStart:'10:00', windowEnd:'14:00' });
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2 panel rounded p-5 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Post-round tasks for {patientFullName(p)}</h2>
          <p className="text-sm ink-mute">Source automatically set to POST_ROUND_JOB. Add as many as needed.</p>
        </div>

        <div className="space-y-2">{tasks.map((t,i)=>(
          <div key={t.id} className="border hairline rounded p-3 flex items-center gap-3">
            <PriorityChip priority={t.priority}/>
            <div className="flex-1">
              <div className="text-sm font-semibold">{t.title}</div>
              <div className="text-xs ink-mute">→ {t.assigneeRole} · {t.windowStart}–{t.windowEnd}</div>
            </div>
            <button className="btn btn-ghost p-1.5" onClick={()=>{const n=tasks.filter((_,j)=>j!==i);setTasks(n);setRound(r=>({...r,tasks:{...r.tasks,[p.id]:n}}));}}><Icons.x size={14}/></button>
          </div>
        ))}</div>

        <div className="border hairline rounded p-3 bg-slate-50">
          <div className="field-label mb-2">+ Add task</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><input className="input" placeholder="Task title (e.g. Repeat U&Es at 14:00)" value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></div>
            <select className="select" value={draft.priority} onChange={e=>setDraft({...draft,priority:e.target.value})}>
              <option>ROUTINE</option><option>URGENT</option><option>EMERGENCY</option>
            </select>
            <select className="select" value={draft.assigneeRole} onChange={e=>setDraft({...draft,assigneeRole:e.target.value})}>
              <option>NURSE</option><option>JUNIOR_DOCTOR</option><option>REGISTRAR</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input className="input mono" type="time" value={draft.windowStart} onChange={e=>setDraft({...draft,windowStart:e.target.value})}/>
              <input className="input mono" type="time" value={draft.windowEnd} onChange={e=>setDraft({...draft,windowEnd:e.target.value})}/>
            </div>
            <button className="btn btn-primary justify-center" onClick={add}>Add task</button>
          </div>
        </div>

        <div className="flex justify-between pt-3 border-t hairline">
          <button className="btn" onClick={onBack}>← Back to review</button>
          <button className="btn btn-primary" onClick={onNextPatient}>Next patient →</button>
        </div>
      </div>

      <div className="panel rounded p-4">
        <div className="font-semibold text-sm mb-3">Round progress</div>
        <div className="space-y-1.5">{round.queue.map((id,i)=>{
          const pp = getPatient(id);
          const reviewed = round.reviewed[id];
          return <div key={id} className={`flex items-center gap-2 text-sm py-1 ${i===round.currentIdx?'font-semibold':''}`}>
            {reviewed?<div className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center"><Icons.check size={10} className="text-white" stroke={3}/></div>
                    :<div className="w-4 h-4 rounded-full border-2 border-slate-300"/>}
            <span className="mono text-xs ink-mute w-12">{pp.bed}</span>
            <span className="truncate flex-1">{pp.lastName}</span>
            <NEWSBadge score={pp.news} size="sm"/>
          </div>;
        })}</div>
      </div>
    </div>
  );
}

function Step5({ round, onBack, onComplete, ctx }){
  const reviewed = Object.keys(round.reviewed);
  const unreviewed = round.queue.filter(id=>!round.reviewed[id]);
  const totalTasks = Object.values(round.tasks).reduce((a,b)=>a+b.length,0);
  return (
    <div className="panel rounded p-6 max-w-3xl space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Complete round — review summary</h2>
        <p className="text-sm ink-mute mt-1">Final check before publishing the round and dispatching notifications.</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="border hairline rounded p-3"><div className="field-label">Patients reviewed</div><div className="text-2xl font-semibold mt-1 text-emerald-700">{reviewed.length}</div></div>
        <div className="border hairline rounded p-3"><div className="field-label">Unreviewed</div><div className="text-2xl font-semibold mt-1" style={{color:unreviewed.length>0?'#b45309':'#475569'}}>{unreviewed.length}</div></div>
        <div className="border hairline rounded p-3"><div className="field-label">Tasks created</div><div className="text-2xl font-semibold mt-1">{totalTasks}</div></div>
      </div>
      {unreviewed.length>0 && (
        <div className="rounded p-3 bg-amber-50 border border-amber-200 text-sm">
          <div className="font-semibold text-amber-900 mb-1">⚠ {unreviewed.length} patient{unreviewed.length>1?'s':''} unreviewed</div>
          <ul className="text-amber-900 space-y-0.5">
            {unreviewed.map(id=>{const p=getPatient(id);return <li key={id}>· Bed {p.bed} — {patientFullName(p)} ({p.acuity})</li>;})}
          </ul>
          <div className="text-xs text-amber-700 mt-2">You can complete the round anyway — these patients will be flagged in the report.</div>
        </div>
      )}
      <div className="flex justify-between pt-3 border-t hairline">
        <button className="btn" onClick={onBack}>← Back to queue</button>
        <button className="btn btn-primary px-6" onClick={onComplete}>Complete round</button>
      </div>
    </div>
  );
}

Object.assign(window, { RoundWizard });
