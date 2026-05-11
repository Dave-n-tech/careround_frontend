// Nurse screens — vitals recording with live NEWS

const { useState, useMemo } = React;

function NurseVitalsForm({ ctx }){
  const [patientId, setPatientId] = useState('p1');
  const p = getPatient(patientId);
  const [v, setV] = useState({ resp:'', spo2:'', temp:'', sys:'', hr:'', cons:'ALERT' });
  const [submitted, setSubmitted] = useState(false);
  const [escalation, setEscalation] = useState(null);

  const news = computeNEWS(v);
  const total = news.total;
  const allFilled = ['resp','spo2','temp','sys','hr'].every(k=>v[k]!=='');

  function submit(){
    if(!allFilled){ ctx.toast({kind:'error',title:'Complete all fields'}); return; }
    setSubmitted(true);
    if(total >= 7){
      setEscalation({ severity:'RED', score:total, role:'CONSULTANT', name:'Prof. Adaeze Okafor' });
    } else if(total >= 5){
      setEscalation({ severity:'AMBER', score:total, role:'REGISTRAR', name:'Dr. Chinedu Eze' });
    } else {
      ctx.toast({kind:'success', title:'Vitals recorded', body:`NEWS ${total} · within range`});
      setTimeout(()=>{ setV({ resp:'', spo2:'', temp:'', sys:'', hr:'', cons:'ALERT' }); setSubmitted(false); }, 600);
    }
  }

  function reset(){
    setEscalation(null); setSubmitted(false);
    setV({ resp:'', spo2:'', temp:'', sys:'', hr:'', cons:'ALERT' });
  }

  // colour for live preview
  const previewBg = total>=7 ? '#fef2f2' : total>=5 ? '#fffbeb' : '#f0fdf4';
  const previewFg = total>=7 ? '#991b1b' : total>=5 ? '#854d0e' : '#166534';
  const previewLabel = total>=7?'RED':total>=5?'AMBER':'NORMAL';

  const presets = [
    { id:'resp', label:'Respiratory rate', unit:'/min', min:4, max:60, step:1 },
    { id:'spo2', label:'SpO₂ (oxygen sat)', unit:'%', min:50, max:100, step:1 },
    { id:'temp', label:'Temperature', unit:'°C', min:25, max:45, step:0.1 },
    { id:'sys',  label:'Systolic BP', unit:'mmHg', min:40, max:260, step:1 },
    { id:'hr',   label:'Heart rate', unit:'bpm', min:20, max:240, step:1 },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Record vitals" subtitle="NEWS2 score is computed live as you type. Backend re-validates on submit."/>

      <div className="panel rounded p-4">
        <div className="field-label mb-2">Select patient</div>
        <div className="grid grid-cols-3 gap-2">
          {PATIENTS.filter(p=>p.wardId==='w1' && p.status!=='DISCHARGED').slice(0,6).map(pp=>(
            <button key={pp.id} onClick={()=>setPatientId(pp.id)} className={`text-left p-3 rounded border ${patientId===pp.id?'border-[var(--brand)] bg-blue-50':'border-slate-200 hover:bg-slate-50'}`}>
              <div className="flex items-center justify-between">
                <span className="mono text-xs ink-mute">{pp.bed}</span>
                <NEWSBadge score={pp.news} size="sm"/>
              </div>
              <div className="font-semibold text-sm mt-1">{patientFullName(pp)}</div>
              <div className="text-xs ink-mute truncate">{pp.primaryDiagnosis}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 panel rounded p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{patientFullName(p)}</div>
              <div className="text-xs ink-mute">{p.mrn} · Bed {p.bed} · last NEWS {p.news} at {p.vitals.at(-1).ts.slice(11,16)}</div>
            </div>
            <div className="text-xs ink-mute">Now: 06 May 2026 · 08:30</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {presets.map(f=>(
              <Field key={f.id} label={f.label} required>
                <div className="relative">
                  <input
                    className="input mono text-2xl py-3 text-right pr-16"
                    type="number" min={f.min} max={f.max} step={f.step}
                    value={v[f.id]} onChange={e=>setV({...v,[f.id]:e.target.value})}
                    placeholder="—"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 ink-mute text-sm">{f.unit}</span>
                </div>
              </Field>
            ))}
            <Field label="Level of consciousness" required>
              <div className="grid grid-cols-4 gap-1.5">
                {['ALERT','VOICE','PAIN','UNRESPONSIVE'].map(c=>(
                  <button key={c} onClick={()=>setV({...v,cons:c})} className={`px-2 py-2.5 rounded text-xs font-semibold ${v.cons===c?'bg-[var(--brand)] text-white':'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{c}</button>
                ))}
              </div>
            </Field>
          </div>
          <div className="border-t hairline pt-4 flex items-center gap-3">
            <button className="btn" onClick={reset}>Clear</button>
            <button className="btn btn-primary ml-auto px-6 py-2.5" disabled={!allFilled} onClick={submit}>
              {submitted?'Submitting…':'Record vitals'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded p-5" style={{background:previewBg, border:`2px solid ${previewFg}30`}}>
            <div className="field-label" style={{color:previewFg}}>Live NEWS2 score</div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-6xl font-bold mono" style={{color:previewFg}}>{total}</span>
              <span className="text-lg font-semibold" style={{color:previewFg}}>{previewLabel}</span>
            </div>
            <div className="mt-3 space-y-1.5 text-xs">
              {Object.entries(news.parts).map(([k,score])=>(
                <div key={k} className="flex justify-between">
                  <span className="ink-mute">{({resp:'Resp rate',spo2:'SpO₂',temp:'Temp',sys:'Sys BP',hr:'Heart rate',cons:'LOC'})[k]}</span>
                  <span className="mono" style={{color: score===0?'#475569':score>=3?'#b91c1c':score>=2?'#b45309':'#854d0e'}}>+{score}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-current opacity-30"/>
            <div className="text-xs mt-1" style={{color:previewFg}}>
              {total>=7 && 'Will trigger RED escalation to consultant'}
              {total>=5 && total<7 && 'Will trigger AMBER escalation to registrar'}
              {total<5 && 'Within normal range'}
            </div>
          </div>
          <div className="panel rounded p-4">
            <div className="field-label mb-2">Last 6 readings</div>
            <NEWSSparkline history={p.vitals.slice(-6)} w={260} h={48}/>
            <div className="flex justify-between text-[10px] mono ink-mute mt-1">
              {p.vitals.slice(-6).map((vv,i)=><span key={i}>{vv.news}</span>)}
            </div>
          </div>
        </div>
      </div>

      {escalation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center fadein">
          <div className="bg-white rounded shadow-2xl w-[520px] overflow-hidden">
            <div className={`p-5 ${escalation.severity==='RED'?'bg-red-600':'bg-amber-500'} text-white`}>
              <div className="flex items-center gap-3">
                <Icons.alertCircle size={28}/>
                <div>
                  <div className="text-2xl font-bold">{escalation.severity} ESCALATION RAISED</div>
                  <div className="text-sm opacity-90">NEWS {escalation.score} · {escalation.severity==='RED'?'Patient marked DETERIORATING':'Threshold breached'}</div>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm ink-2">An escalation has been created for <span className="font-semibold">{patientFullName(p)}</span> and the on-call <span className="font-semibold">{escalation.role.toLowerCase()}</span> has been notified.</p>
              <div className="border hairline rounded p-3">
                <div className="text-xs ink-mute">Notified</div>
                <div className="font-semibold">{escalation.name}</div>
                <div className="text-xs ink-mute mt-1">via SMS + in-app · expected response &lt; 5 min</div>
              </div>
              <Field label="Add a note (optional)"><textarea className="textarea" rows={3} placeholder="Anything else the on-call should know…"/></Field>
            </div>
            <div className="px-5 py-3 border-t hairline flex justify-end gap-2 bg-slate-50">
              <button className="btn" onClick={reset}>Done</button>
              <button className="btn btn-primary" onClick={reset}>Add note &amp; close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NurseCreateEscalation({ ctx }){
  const [pid, setPid] = useState('p6');
  const p = getPatient(pid);
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="space-y-4">
      <PageHeader title="Raise nurse concern" subtitle="Create an AMBER escalation routed to the on-call registrar"/>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 panel rounded p-5 space-y-4">
          <Field label="Patient" required>
            <select className="select" value={pid} onChange={e=>setPid(e.target.value)}>
              {PATIENTS.filter(p=>p.wardId==='w1').map(p=><option key={p.id} value={p.id}>{p.bed} · {patientFullName(p)} · {p.primaryDiagnosis}</option>)}
            </select>
          </Field>
          <Field label="Concern" required hint="What have you observed that worries you?">
            <textarea className="textarea" rows={4} defaultValue="Persistent fever despite paracetamol. Patient appears more lethargic. Capillary refill 3 seconds. Mother reports decreased urine output overnight."/>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Severity"><select className="select" defaultValue="AMBER"><option>AMBER</option><option>RED</option></select></Field>
            <Field label="Routes to" hint="Determined by severity"><input className="input" disabled value="On-call Registrar — Dr. Chinedu Eze"/></Field>
          </div>
          <div className="flex justify-end pt-2">
            <button className="btn btn-primary" onClick={()=>{ setSubmitted(true); ctx.toast({kind:'warn', title:'AMBER escalation created', body:'On-call registrar has been notified'}); }}>Raise escalation</button>
          </div>
        </div>
        <div className="panel rounded p-4">
          <div className="font-semibold text-sm mb-2">Patient context</div>
          <div className="text-sm">{patientFullName(p)}</div>
          <div className="text-xs ink-mute mb-2">{p.mrn} · {p.age}{p.sex} · Bed {p.bed}</div>
          <NEWSBadge score={p.news}/>
          <div className="mt-3 pt-3 border-t hairline">
            <div className="field-label">Latest vitals</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs mt-1.5">
              <span className="ink-mute">RR</span><span className="mono">{p.vitals.at(-1).resp}/min</span>
              <span className="ink-mute">SpO₂</span><span className="mono">{p.vitals.at(-1).spo2}%</span>
              <span className="ink-mute">Temp</span><span className="mono">{p.vitals.at(-1).temp}°C</span>
              <span className="ink-mute">BP</span><span className="mono">{p.vitals.at(-1).sys}</span>
              <span className="ink-mute">HR</span><span className="mono">{p.vitals.at(-1).hr}bpm</span>
              <span className="ink-mute">LOC</span><span>{p.vitals.at(-1).cons}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { NurseVitalsForm, NurseCreateEscalation });
