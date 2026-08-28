import { useEffect, useMemo, useRef, useState } from 'react';
import { events, roles } from './data';

const STORE = 'eco-balance-class-v1';
const fresh = { step:'home', settings:{ groups:4, duplicate:false, limit:60 }, drawn:[], records:[], current:null };
const formatTime = ms => `${String(Math.floor(ms/60000)).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}.${String(Math.floor(ms/10)%100).padStart(2,'0')}`;

export default function App(){
  const [app,setApp] = useState(()=>{ try{return JSON.parse(localStorage.getItem(STORE))||fresh}catch{return fresh} });
  const [running,setRunning]=useState(false);
  const [elapsed,setElapsed]=useState(0);
  const [selectedGroup,setSelectedGroup]=useState(1);
  const [drawing,setDrawing]=useState(false);
  const started=useRef(0); const base=useRef(0);
  const update = patch => setApp(a=>({...a,...patch}));
  useEffect(()=>localStorage.setItem(STORE,JSON.stringify(app)),[app]);
  useEffect(()=>{ if(!running)return; started.current=performance.now(); const id=setInterval(()=>setElapsed(base.current+performance.now()-started.current),20); return()=>clearInterval(id)},[running]);
  useEffect(()=>{ const key=e=>{ if(e.code==='Space'&&app.step==='play'&&!app.current){e.preventDefault();draw()} if(e.key.toLowerCase()==='r'&&app.step==='play'&&app.current)next() }; addEventListener('keydown',key); return()=>removeEventListener('keydown',key) });
  const current=events.find(e=>e.id===app.current);
  const groups=Array.from({length:app.settings.groups},(_,i)=>i+1);

  function startTimer(){ if(running){base.current=elapsed;setRunning(false)}else setRunning(true) }
  function resetTimer(){setRunning(false);setElapsed(0);base.current=0}
  function draw(){
    const pool=app.settings.duplicate?events:events.filter(e=>!app.drawn.includes(e.id));
    if(!pool.length){update({step:'results'});return}
    setDrawing(true); setTimeout(()=>{const chosen=pool[Math.floor(Math.random()*pool.length)];update({current:chosen.id,drawn:[...app.drawn,chosen.id]});setDrawing(false);resetTimer()},700)
  }
  function save(success=true){ if(!current||elapsed<100)return; const record={id:crypto.randomUUID(),eventId:current.id,group:selectedGroup,ms:Math.round(elapsed),success,at:new Date().toISOString()};update({records:[...app.records,record]});resetTimer() }
  function next(){resetTimer();update({current:null})}
  function restart(){ if(confirm('현재 수업 기록을 지우고 새로 시작할까요?')){localStorage.removeItem(STORE);setApp(fresh);resetTimer()} }

  return <div className="app">
    <header className="topbar"><button className="brand" onClick={()=>update({step:'home'})}><span>🌿</span><b>에코 밸런스 롤</b></button><div className="top-actions"><button onClick={()=>document.documentElement.requestFullscreen?.()}>⛶ <span>전체화면</span></button><button onClick={restart}>↻ <span>새 수업</span></button></div></header>
    <main>
      {app.step==='home'&&<Home onStart={()=>update({step:'setup'})} hasSave={app.drawn.length>0} onContinue={()=>update({step:app.current?'play':'play'})}/>} 
      {app.step==='setup'&&<Setup settings={app.settings} setSettings={settings=>update({settings})} onBack={()=>update({step:'home'})} onNext={()=>update({step:'roles'})}/>} 
      {app.step==='roles'&&<Roles onBack={()=>update({step:'setup'})} onNext={()=>update({step:'play'})}/>} 
      {app.step==='play'&&<Play current={current} drawing={drawing} draw={draw} groups={groups} selected={selectedGroup} setSelected={setSelectedGroup} running={running} elapsed={elapsed} startTimer={startTimer} resetTimer={resetTimer} save={save} next={next} count={app.drawn.length} finish={()=>update({step:'results'})}/>} 
      {app.step==='results'&&<Results app={app} groups={groups} restart={restart} back={()=>update({step:'play'})}/>} 
    </main>
    <footer>우리의 작은 실천이 지구를 건강하게 만들어요 💚</footer>
  </div>
}

function Home({onStart,hasSave,onContinue}){return <section className="hero page"><div className="hero-copy"><span className="eyebrow">🌏 함께 지키는 우리 생태계</span><h1>연결하고, 움직이고,<br/><em>지구를 지켜요!</em></h1><p>친구들과 생태계 구성원이 되어 환경 변화를 몸으로 느껴보는 신나는 환경 수업</p><div className="hero-buttons"><button className="primary xl" onClick={onStart}>수업 시작하기 <b>→</b></button>{hasSave&&<button className="soft xl" onClick={onContinue}>이어서 하기</button>}</div><div className="mini-features"><span>🎲 무작위 사건</span><span>⏱️ 모둠 기록</span><span>🏆 결과 분석</span></div></div><div className="hero-art"><img src={`${import.meta.env.BASE_URL}assets/eco-friends.png`} alt="숲에서 함께 살아가는 반달가슴곰과 동물 친구들"/><div className="art-bubble">우리 모두 연결되어 있어! <span>🌱</span></div></div></section>}

function Setup({settings,setSettings,onBack,onNext}){return <section className="page narrow"><Step n="1" title="오늘의 수업을 준비해요" sub="우리 반에 맞게 활동 방법을 정해주세요."/><div className="panel settings"><label><span><b>👥 모둠 수</b><small>활동에 참여할 모둠 수를 골라요.</small></span><select value={settings.groups} onChange={e=>setSettings({...settings,groups:+e.target.value})}>{[1,2,3,4,5,6,7,8].map(n=><option key={n} value={n}>{n}모둠</option>)}</select></label><label><span><b>🎲 사건 뽑기</b><small>같은 환경 사건이 다시 나올 수 있어요.</small></span><button className={'toggle '+(settings.duplicate?'on':'')} onClick={()=>setSettings({...settings,duplicate:!settings.duplicate})}><i/>{settings.duplicate?'중복 허용':'중복 없음'}</button></label><label><span><b>⏱️ 제한 시간</b><small>모둠 미션의 도전 시간을 정해요.</small></span><select value={settings.limit} onChange={e=>setSettings({...settings,limit:+e.target.value})}>{[30,45,60,90,120].map(n=><option key={n} value={n}>{n}초</option>)}</select></label></div><Nav back={onBack} next={onNext} label="역할 확인하기"/></section>}

function Roles({onBack,onNext}){return <section className="page"><Step n="2" title="생태계 친구들을 만나봐요" sub="한 명씩 역할을 맡고 아래 순서대로 손을 잡아주세요."/><div className="role-grid">{roles.map((r,i)=><div className="role-card" key={r.name} style={{'--role':r.color}}><span className="role-num">{i+1}</span><span className="role-emoji">{r.emoji}</span><b>{r.name}</b></div>)}</div><div className="tip"><span>💡</span><p><b>선생님 도움말</b><br/>학생들이 큰 원을 만들고, 서로의 역할을 말하며 손을 잡게 해주세요.</p></div><Nav back={onBack} next={onNext} label="활동 시작하기"/></section>}

function Play(p){return <section className="page play"><div className="play-head"><div><span className="eyebrow">환경 사건 {p.count}/{events.length}</span><h2>{p.current?'어떤 일이 생겼을까요?':'환경 사건을 뽑아볼까요?'}</h2></div><button className="text-btn" onClick={p.finish}>수업 마치기 →</button></div>{!p.current?<div className={'draw-zone '+(p.drawing?'drawing':'')}><div className="earth">{p.drawing?'✨':'🌍'}</div><h3>{p.drawing?'두근두근...':'버튼을 눌러 사건을 뽑아요!'}</h3><p>키보드 스페이스바를 눌러도 돼요.</p><button className="primary xl" disabled={p.drawing} onClick={p.draw}>🎲 환경 사건 뽑기</button></div>:<><div className="event-layout"><article className="event-card"><div className="event-title"><span>{p.current.emoji}</span><div><small>{p.current.level}가 필요한 사건</small><h3>{p.current.title}</h3></div></div><div className="fact"><b>🔎 왜 생겼나요?</b><p>{p.current.cause}</p></div><div className="fact coral"><b>🌿 생태계에는 어떤 일이?</b><p>{p.current.impact}</p></div><div className="action-tip"><b>오늘부터 이렇게!</b><span>{p.current.tip}</span></div></article><aside className="mission"><h3>영향받는 친구들</h3><p>순서대로 손을 놓고 미션을 시작해요.</p><div className="chain">{p.current.chain.map((name,i)=>{const r=roles.find(x=>x.name===name);return <div key={name}><span style={{background:r?.color}}>{r?.emoji}</span><b>{name}</b>{i<p.current.chain.length-1&&<i>↓</i>}</div>})}</div></aside></div><div className="control-panel"><div className="group-pick"><b>도전 모둠</b><div>{p.groups.map(n=><button className={p.selected===n?'selected':''} onClick={()=>p.setSelected(n)} key={n}>{n}</button>)}</div></div><div className={'timer '+(p.running?'active':'')}><small>{p.running?'미션 진행 중!':'준비되면 시작하세요'}</small><strong>{formatTime(p.elapsed)}</strong></div><div className="timer-actions"><button className="primary" onClick={p.startTimer}>{p.running?'⏸ 멈추기':p.elapsed?'▶ 계속하기':'▶ 시작하기'}</button><button onClick={p.resetTimer}>↻ 초기화</button></div></div>{p.elapsed>0&&!p.running&&<div className="save-bar"><b>미션 결과를 기록할까요?</b><button className="fail" onClick={()=>p.save(false)}>아쉬워요</button><button className="success" onClick={()=>p.save(true)}>✓ 성공했어요!</button></div>}<button className="next-event" onClick={p.next}>다음 사건으로 <b>R</b> →</button></>}</section>}

function Results({app,groups,restart,back}){const stats=useMemo(()=>groups.map(g=>{const all=app.records.filter(r=>r.group===g),ok=all.filter(r=>r.success);return {g,attempts:all.length,wins:ok.length,best:ok.length?Math.min(...ok.map(r=>r.ms)):null}}).sort((a,b)=>(a.best??Infinity)-(b.best??Infinity)),[app.records,groups]);return <section className="page narrow results"><div className="trophy">🏆</div><h1>오늘의 에코 챔피언!</h1><p>모두가 힘을 모아 생태계의 연결을 배웠어요.</p><div className="podium">{stats.map((s,i)=><div className="rank" key={s.g}><span>{i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</span><b>{s.g}모둠</b><strong>{s.best?formatTime(s.best):'기록 없음'}</strong><small>성공 {s.wins} · 도전 {s.attempts}</small></div>)}</div><div className="reflection"><h3>🌱 함께 생각해 봐요</h3><p>하나의 환경 변화가 여러 생물에게 영향을 주는 이유는 무엇일까요?</p><p>우리가 오늘부터 실천할 수 있는 행동은 무엇일까요?</p></div><div className="result-actions"><button onClick={back}>← 활동으로</button><button className="soft" onClick={()=>window.print()}>🖨️ 인쇄하기</button><button className="primary" onClick={restart}>새 수업 시작</button></div></section>}
function Step({n,title,sub}){return <div className="step-title"><span>{n}</span><div><h1>{title}</h1><p>{sub}</p></div></div>}
function Nav({back,next,label}){return <div className="nav"><button onClick={back}>← 이전</button><button className="primary" onClick={next}>{label} →</button></div>}
