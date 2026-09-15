


let D={setup:{},ass:[],students:[],marks:[],recs:[],notes:[]},cls="";
const $=x=>document.getElementById(x), esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])), pc=x=>x===""||x==null?"—":(Number(x)*100).toFixed(1)+"%";
function json(ws){return XLSX.utils.sheet_to_json(ws,{defval:"",range:3})}
function parseSetup(ws){let a=XLSX.utils.sheet_to_json(ws,{header:1,defval:""}),o={};for(let r=4;r<=8;r++)if(a[r]?.[0])o[a[r][0]]=a[r][1];return o}
function parseAss(ws){let a=XLSX.utils.sheet_to_json(ws,{header:1,defval:""}),out=[];for(let r=4;r<=9;r++){let x=a[r]||[];if(x[0]&&String(x[2]).toLowerCase()==="yes"){let comps=[];for(let k=0;k<6;k++){let n=x[4+k*2],m=Number(x[5+k*2])||0;if(n)comps.push({name:n,max:m})}out.push({slot:r-3,name:x[1]||x[0],overallMax:Number(x[3])||100,comps})}}return out}
$("file").onchange=async e=>{let f=e.target.files[0];if(!f)return;$("msg").textContent="Reading "+f.name+"…";try{let wb=XLSX.read(await f.arrayBuffer(),{type:"array",cellDates:true});D.setup=parseSetup(wb.Sheets["SETUP"]);D.ass=parseAss(wb.Sheets["ASSESSMENT SETUP"]);D.students=json(wb.Sheets["STUDENTS"]).filter(x=>x["Student Name"]&&String(x["Active?"]).toLowerCase()!=="no");D.marks=parseMarks(wb.Sheets["MARKS"],D.students);D.recs=wb.Sheets["RECOMMENDATIONS"]?json(wb.Sheets["RECOMMENDATIONS"]).filter(x=>x["Skill / Component"]&&String(x["Active?"]).toLowerCase()!=="no"):[];D.notes=wb.Sheets["TEACHER NOTES"]?json(wb.Sheets["TEACHER NOTES"]).filter(x=>x["Student Name"]):[];$("brand").textContent=(D.setup.Subject||"")+" Assessment Tracker";$("sub").textContent=[D.setup["Teacher Name"],D.setup["Academic Year"]].filter(Boolean).join(" · ");$("welcome").textContent=(D.setup.Subject||"Assessment")+" Dashboard";let cs=[...new Set(D.students.map(x=>x.Class).filter(Boolean))].sort();cls="";$("loaded").classList.remove("hidden");$("msg").textContent="Loaded successfully.";renderClassCards()}catch(err){console.error(err);$("msg").textContent="Could not read this workbook. Please use Assessment Tracker V2."}};
function parseMarks(ws,students){let a=XLSX.utils.sheet_to_json(ws,{header:1,defval:""}),out=[];for(let r=5;r<a.length;r++){let master=students[r-5];if(!master?.["Student Name"])continue;let cells=a[r]||[],row={name:master["Student Name"],class:master.Class,ass:[]};for(let q=0;q<6;q++){let st=2+q*9,components=cells.slice(st,st+6),overall=cells[st+6]??"",total=cells[st+7]??"",pct=cells[st+8]??"";row.ass.push({components,overall,total,pct})}out.push(row)}return out}
function mfor(n){return D.marks.find(x=>String(x.name).trim()===String(n).trim())||{ass:[]}}
function calcPct(m,a){
 let x=m.ass[a.slot-1]; if(!x)return "";
 if(a.comps.length){
   let used=false,total=0,max=0;
   a.comps.forEach((c,j)=>{let raw=x.components[j];if(raw!==""&&raw!=null){used=true;total+=Number(raw)||0}max+=Number(c.max)||0});
   return used&&max>0?total/max:"";
 }
 return x.overall!==""&&x.overall!=null&&a.overallMax>0?(Number(x.overall)||0)/a.overallMax:"";
}

function latestIndex(m){let z=-1;D.ass.forEach(a=>{if(calcPct(m,a)!=="")z=a.slot-1});return z}
let trendChartObj=null,distChartObj=null;
function classStats(c){
 let ss=D.students.filter(x=>x.Class===c),ms=ss.map(x=>mfor(x["Student Name"])),pass=(Number(D.setup["Pass Mark (%)"])||50)/100,li=-1;
 D.ass.forEach(a=>{if(ms.some(m=>calcPct(m,a)!==""))li=a.slot-1});
 let a=D.ass.find(x=>x.slot-1===li),vals=a?ms.map(m=>calcPct(m,a)).filter(x=>x!==""):[];
 let avg=vals.length?vals.reduce((x,y)=>x+Number(y),0)/vals.length:"",pr=vals.length?vals.filter(x=>Number(x)>=pass).length/vals.length:"";
 let prevA=null;if(a){let used=D.ass.filter(x=>x.slot<a.slot&&ms.some(m=>calcPct(m,x)!==""));prevA=used.slice(-1)[0]||null}
 let prevVals=prevA?ms.map(m=>calcPct(m,prevA)).filter(x=>x!==""):[],prevAvg=prevVals.length?prevVals.reduce((x,y)=>x+Number(y),0)/prevVals.length:"";
 return {ss,ms,pass,li,a,vals,avg,pr,prevA,prevAvg,change:avg!==""&&prevAvg!==""?avg-prevAvg:null}
}
function classTheme(c,index){
 const themes=[
  {icon:"🌿",name:"Flower Garden"},{icon:"🌊",name:"Under the Sea"},
  {icon:"🍃",name:"Nature Trail"},{icon:"🌙",name:"Moonlight"},
  {icon:"✨",name:"Star Field"},{icon:"🌈",name:"Rainbow"}
 ];
 return themes[index%themes.length]
}
function renderClassCards(){
 $("classHome").classList.remove("hidden");$("classDashboard").classList.add("hidden");
 let classes=[...new Set(D.students.map(x=>x.Class).filter(Boolean))].sort();
 $("classCards").innerHTML=classes.map((c,i)=>{let z=classStats(c),t=classTheme(c,i),chg=z.change==null?"—":(z.change>=0?"+":"")+(z.change*100).toFixed(1)+" pp";return `<div class="class-theme-card theme-${i%6}" onclick='openClass(${JSON.stringify(String(c))})'><span class="theme-icon">${t.icon}</span><div class="class-name">${esc(c)}</div><div class="theme-name">${t.name}</div><div class="theme-stats"><div class="theme-stat">${z.ss.length} students</div><div class="theme-stat">Average ${pc(z.avg)}</div><div class="theme-stat">Pass ${z.pr===""?"—":(z.pr*100).toFixed(1)+"%"}</div><div class="theme-stat">${chg}</div></div><div class="open-dash">Open dashboard →</div></div>`}).join("")||empty("No active classes found in STUDENTS.");
}
function openClass(c){cls=c;$("classHome").classList.add("hidden");$("classDashboard").classList.remove("hidden");$("classTitle").textContent="Class "+c;render();scrollTo(0,0)}
function backClasses(){cls="";renderClassCards();scrollTo(0,0)}
function studentDelta(m,a){
 let current=calcPct(m,a);if(current==="")return null;
 let prevs=D.ass.filter(x=>x.slot<a.slot&&calcPct(m,x)!=="");
 if(!prevs.length)return null;
 let first=calcPct(m,prevs[0]);
 return first===""?null:Number(current)-Number(first)
}
function rankRows(rows,mode){
 if(!rows.length)return empty(mode==="improve"?"No positive overall improvement from first to latest assessment.":"No students to show yet.");
 return rows.slice(0,3).map((x,i)=>`<div class="rank-row"><span class="rank">${i+1}</span><div><b>${esc(x.name)}</b><br><small class="muted">${esc(x.extra||"")}</small></div><strong>${esc(x.value)}</strong></div>`).join("")
}

function studentMascot(name){
 const animals=["🦁","🐺","🐯","🦅","🦊","🐨","🦋","🐇","🐼","🐱","🐸","🦄","🐻","🐧","🐙","🦉","🐬","🦝","🐹","🐢","🦜","🐝","🦦","🐳"];
 let h=0;for(let i=0;i<String(name).length;i++)h=(h*31+String(name).charCodeAt(i))>>>0;
 return animals[h%animals.length]
}
function studentBadges(m,a,pass,topNames){
 let p=calcPct(m,a),d=studentDelta(m,a),out=[];
 if(topNames.includes(m.name))out.push('<span class="pill gold">🏆 Top Performer</span>');
 if(d!=null&&d>=.05)out.push('<span class="pill green">🚀 Improving</span>');
 if(p!==""&&p<pass)out.push('<span class="pill red">🎯 Support</span>');
 return out.join("")||'<span class="pill blue">📘 On Track</span>'
}


function assessmentEmoji(slot){
 const icons=["📝","📘","📊","✏️","📚","🏁"];
 return icons[(Number(slot)-1)%icons.length]||"📝"
}
function componentStatus(p){
 if(p==null||p==="")return {label:"—",cls:"good"};
 p=Number(p);
 if(p>=.80)return {label:"🌟 Strong",cls:"strong"};
 if(p>=.70)return {label:"👍 Doing Well",cls:"good"};
 if(p>=.50)return {label:"🎯 Developing",cls:"developing"};
 return {label:"⚠️ Needs Attention",cls:"attention"}
}
function buildComponentTrends(z){
 // Match components by their configured names, but allow components to appear/disappear across assessments.
 let map=new Map();
 D.ass.forEach(a=>{
   if(!a.comps?.length)return;
   a.comps.forEach((c,j)=>{
     let vals=z.ms.map(m=>{let raw=m.ass[a.slot-1]?.components[j];return raw===""||raw==null?null:(Number(raw)||0)/c.max}).filter(v=>v!=null);
     if(!vals.length)return;
     let avg=vals.reduce((s,v)=>s+v,0)/vals.length,key=c.name.trim().toLowerCase();
     if(!map.has(key))map.set(key,{name:c.name,points:[]});
     map.get(key).points.push({slot:a.slot,name:a.name,p:avg})
   })
 });
 let rows=[...map.values()].sort((a,b)=>a.name.localeCompare(b.name));
 if(!rows.length){$("componentTrends").innerHTML=empty("No component scores are available across the assessments yet.");return}
 $("componentTrends").innerHTML=rows.map(row=>{
   let pts=row.points.sort((a,b)=>a.slot-b.slot),latest=pts[pts.length-1],status=componentStatus(latest.p);
   let flow=pts.map((x,i)=>`${i?'<span class="trend-arrow">→</span>':""}<span class="ass-chip"><span>${assessmentEmoji(x.slot)}</span><strong>${esc(x.name)}</strong> ${pc(x.p)}</span>`).join("");
   let delta="",cls="flat";
   if(pts.length>1){let d=latest.p-pts[pts.length-2].p;cls=d>.001?"up":d<-.001?"down":"flat";delta=`<div class="trend-delta ${cls}">${d>.001?"📈":d<-.001?"📉":"➡️"} ${d>0?"+":""}${(d*100).toFixed(1)} pp from ${esc(pts[pts.length-2].name)}</div>`}
   return `<div class="component-trend"><div class="component-trend-head"><b>🧩 ${esc(row.name)}</b><span class="status-tag ${status.cls}">${status.label}</span></div><div class="assessment-flow">${flow}</div>${delta}</div>`
 }).join("")
}
function getComponentStats(z){
 let a=z.a,li=z.li,out=[];
 if(a?.comps.length){a.comps.forEach((c,j)=>{let vs=z.ms.map(m=>{let raw=m.ass[li]?.components[j];return raw===""||raw==null?null:(Number(raw)||0)/c.max}).filter(x=>x!=null);if(vs.length)out.push({name:c.name,p:vs.reduce((s,v)=>s+v,0)/vs.length})})}
 return out
}
function studentSnapshot(m,a,pass,topNames,compNames){
 let p=calcPct(m,a),d=studentDelta(m,a),parts=[];
 if(topNames.includes(m.name))parts.push("🌟 <b>Strong performance</b>");
 else if(d!=null&&d>=.05)parts.push("🚀 <b>Big improvement</b>");
 else if(p!==""&&p<pass)parts.push("🎯 <b>Needs a check-in</b>");
 else parts.push("📘 <b>Steady progress</b>");
 if(a?.comps.length){
   let cs=a.comps.map((c,j)=>{let raw=m.ass[a.slot-1]?.components[j];return raw===""||raw==null?null:{name:c.name,p:(Number(raw)||0)/c.max}}).filter(Boolean).sort((x,y)=>y.p-x.p);
   if(cs.length){parts.push("💪 Strength: "+esc(cs[0].name));if(cs.length>1)parts.push("🎯 Focus: "+esc(cs[cs.length-1].name))}
 }
 return '<div class="student-snapshot">'+parts.join("<br>")+"</div>"
}
function render(){
 let z=classStats(cls),{ss,ms,pass,li,a,vals,avg,pr,change}=z;
 $("kpis").innerHTML=kpi("👥 Students",ss.length,"Active in "+cls)+kpi("📘 Class Average",pc(avg),a?.name||"No scores")+kpi("✅ Pass rate",pr===""?"—":(pr*100).toFixed(1)+"%","Pass mark "+pass*100+"%")+kpi("📈 Change",change==null?"—":(change>=0?"+":"")+(change*100).toFixed(1)+" pp",z.prevA?z.prevA.name+" → "+a.name:"Need 2 assessments");
 drawTrendChart(z);drawDistributionChart(z);

 let perf=a?ms.map(m=>({name:m.name,p:calcPct(m,a)})).filter(x=>x.p!=="").sort((x,y)=>y.p-x.p):[];
 let top=perf.slice(0,3).map(x=>({name:x.name,value:pc(x.p),extra:a?.name||""}));
 $("topPerformers").innerHTML=top.length?`<div class="spotlight"><div class="micro-message">🌟 CURRENT CLASS STAR</div><div class="big">${esc(top[0].name)}</div><div class="muted">${esc(top[0].value)} · ${esc(top[0].extra)}</div></div>`+rankRows(top.slice(1),"top"):rankRows(top,"top");
 let improvers=a?ms.map(m=>({name:m.name,d:studentDelta(m,a)})).filter(x=>x.d!=null&&x.d>0).sort((x,y)=>y.d-x.d).map(x=>({name:x.name,value:"+"+(x.d*100).toFixed(1)+" pp",extra:"From first to latest assessment"})):[];
 $("mostImproved").innerHTML=rankRows(improvers,"improve");
 let support=perf.filter(x=>x.p<pass).sort((x,y)=>x.p-y.p).map(x=>({name:x.name,value:pc(x.p),extra:"Below "+(pass*100)+"% pass mark"}));
 $("needsSupport").innerHTML=rankRows(support,"support");
 let bestImp=improvers[0],topOne=top[0],strongComp=getComponentStats(z).sort((x,y)=>y.p-x.p)[0];
 $("performanceHighlights").innerHTML=
 `<div class="performance-card"><div class="picon">📈</div><h3>Most Improved</h3><div class="pname">${bestImp?studentMascot(bestImp.name)+" "+esc(bestImp.name):"—"}</div><div class="pvalue">${bestImp?esc(bestImp.value):"No positive overall improvement"}</div></div>`+
 `<div class="performance-card"><div class="picon">🏆</div><h3>Top Performer</h3><div class="pname">${topOne?studentMascot(topOne.name)+" "+esc(topOne.name):"—"}</div><div class="pvalue">${topOne?esc(topOne.value):"No scores yet"}</div></div>`;

 let topNames=top.map(x=>x.name);
 $("students").innerHTML=ss.map(st=>{let m=mfor(st["Student Name"]),i=latestIndex(m),la=D.ass.find(x=>x.slot-1===i),v=la?calcPct(m,la):"";return `<div class="student" onclick='openP(${JSON.stringify(String(st["Student Name"]))})'><div class="student-top"><span class="student-animal">${studentMascot(st["Student Name"])}</span><div><strong>${esc(st["Student Name"])}</strong><br><span class="muted">${esc(st.Class)}</span></div></div><div class="score">${pc(v)}</div><small>${la?esc(la.name):"No scores"}</small><div>${la?studentBadges(m,la,pass,topNames):'<span class="pill blue">📘 No scores</span>'}</div>${la?studentSnapshot(m,la,pass,topNames):""}</div>`}).join("")||empty("No students.");
}
function drawTrendChart(z){
 let data=D.ass.map(a=>{let vs=z.ms.map(m=>calcPct(m,a)).filter(x=>x!=="");return vs.length?{label:a.name,value:vs.reduce((x,y)=>x+Number(y),0)/vs.length*100}:null}).filter(Boolean);
 if(trendChartObj)trendChartObj.destroy();$("trendEmpty").innerHTML="";
 if(!data.length){$("trendChart").style.display="none";$("trendEmpty").innerHTML=empty("No assessment data yet.");return}
 $("trendChart").style.display="block";trendChartObj=new Chart($("trendChart"),{type:"line",data:{labels:data.map(x=>x.label),datasets:[{label:"Class average %",data:data.map(x=>x.value),tension:.32,fill:false,borderWidth:3,pointRadius:5}]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{beginAtZero:true,max:100,ticks:{callback:v=>v+"%"}}},plugins:{legend:{display:false}}}})
}
function drawDistributionChart(z){
 if(distChartObj)distChartObj.destroy();$("distEmpty").innerHTML="";
 if(!z.vals.length){$("distributionChart").style.display="none";$("distEmpty").innerHTML=empty("No latest-assessment scores yet.");return}
 $("distributionChart").style.display="block";let buckets=[0,0,0,0,0];z.vals.forEach(v=>{let p=Number(v)*100;if(p>=80)buckets[0]++;else if(p>=70)buckets[1]++;else if(p>=60)buckets[2]++;else if(p>=50)buckets[3]++;else buckets[4]++});
 distChartObj=new Chart($("distributionChart"),{type:"bar",data:{labels:["80–100","70–79","60–69","50–59","Below 50"],datasets:[{label:"Students",data:buckets,borderWidth:0,borderRadius:8}]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{beginAtZero:true,ticks:{precision:0}}},plugins:{legend:{display:false}}}})
}

function buildStudentComponentTable(m){
 let pass=(Number(D.setup["Pass Mark (%)"])||50)/100,map=new Map(),usedAss=[];
 D.ass.forEach(a=>{
   let has=false;
   if(a.comps?.length)a.comps.forEach((c,j)=>{
     let raw=m.ass[a.slot-1]?.components[j];if(raw===""||raw==null)return;
     has=true;let p=(Number(raw)||0)/c.max,key=c.name.trim().toLowerCase();
     if(!map.has(key))map.set(key,{name:c.name,points:new Map()});
     map.get(key).points.set(a.slot,{a,p})
   });
   if(has)usedAss.push(a)
 });
 if(!map.size)return empty("No component scores are available for this student yet.");
 let head=usedAss.map(a=>`<th>${assessmentEmoji(a.slot)} ${esc(a.name)}</th>`).join("");
 let rows=[...map.values()].map(row=>{
   let pts=usedAss.map(a=>row.points.get(a.slot)||null),real=pts.filter(Boolean),latest=real[real.length-1],prev=real.length>1?real[real.length-2]:null;
   let cells=pts.map(x=>x?`<td class="${x.p<pass?"fail-score":"good-score"}">${pc(x.p)}</td>`:"<td>—</td>").join("");
   let prog;
   if(!prev){prog=`<div class="progress-cell"><span class="prog-icon">✨</span><div><b>New</b><small>First recorded result</small></div></div>`}
   else{let d=latest.p-prev.p;
     if(latest.p<pass)prog=`<div class="progress-cell"><span class="prog-icon">⚠️</span><div><b>Below Pass</b><small>${d>0?"Improved "+(d*100).toFixed(1)+" pp but still below pass":d<0?"Declined "+Math.abs(d*100).toFixed(1)+" pp":"Retained below pass"}</small></div></div>`;
     else if(d>=.10)prog=`<div class="progress-cell"><span class="prog-icon">🌟</span><div><b>+${(d*100).toFixed(1)} pp</b><small>Excellent progress</small></div></div>`;
     else if(d>.001)prog=`<div class="progress-cell"><span class="prog-icon">🌱</span><div><b>+${(d*100).toFixed(1)} pp</b><small>Good growth</small></div></div>`;
     else if(d<-.001)prog=`<div class="progress-cell"><span class="prog-icon">📉</span><div><b>-${Math.abs(d*100).toFixed(1)} pp</b><small>Needs attention</small></div></div>`;
     else prog=`<div class="progress-cell"><span class="prog-icon">➡️</span><div><b>Retained</b><small>Same performance</small></div></div>`;
   }
   return `<tr><td><span class="component-name">${esc(row.name)}</span><span class="component-sub">${real.length===1?"New component in "+esc(latest.a.name):"Compared across available assessments"}</span></td>${cells}<td>${prog}</td></tr>`
 }).join("");
 return `<div class="component-table-wrap"><table class="component-table"><thead><tr><th>COMPONENT</th>${head}<th>PROGRESS</th></tr></thead><tbody>${rows}</tbody></table></div>`
}

let studentTrendChartObj=null;
function drawStudentTrend(m){
 let pts=D.ass.map(a=>{let p=calcPct(m,a);return p===""?null:{name:a.name,p:Number(p)*100}}).filter(Boolean);
 if(studentTrendChartObj)studentTrendChartObj.destroy();
 $("studentTrendEmpty").innerHTML="";
 if(!pts.length){$("studentTrendChart").style.display="none";$("studentTrendEmpty").innerHTML=empty("No assessment scores yet.");return}
 $("studentTrendChart").style.display="block";
 studentTrendChartObj=new Chart($("studentTrendChart"),{
   type:"line",
   data:{labels:pts.map(x=>x.name),datasets:[{label:"Student score",data:pts.map(x=>x.p),borderWidth:3,pointRadius:6,pointHoverRadius:8,tension:.28,fill:false}]},
   options:{responsive:true,maintainAspectRatio:false,scales:{y:{beginAtZero:true,max:100,ticks:{callback:v=>v+"%"}}},plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>" "+Number(c.raw).toFixed(1)+"%"}}}}
 })
}
function openP(n){
 let st=D.students.find(x=>x["Student Name"]===n)||{},m=mfor(n),i=latestIndex(m),a=D.ass.find(x=>x.slot-1===i),v=a?calcPct(m,a):"";
 let used=D.ass.filter(x=>calcPct(m,x)!=""),prev=used.length>1?calcPct(m,used[used.length-2]):"",diff=v!==""&&prev!==""?Number(v)-Number(prev):null;
 $("home").classList.add("hidden");$("profileView").classList.remove("hidden");$("pname").textContent=n;$("pmeta").textContent=[st.Class,D.setup.Subject,D.setup["Academic Year"]].filter(Boolean).join(" · ");
 $("pkpis").innerHTML=kpi("Latest",pc(v),a?.name||"—")+kpi("Previous",pc(prev),"Previous available")+kpi("Change",diff==null?"—":(diff>=0?"+":"")+(diff*100).toFixed(1)+" pp","Assessment change")+kpi("Recorded",used.length,"Assessments");
 drawStudentTrend(m);
 let comps=[];if(a?.comps.length){a.comps.forEach((c,j)=>{let raw=m.ass[i]?.components[j];if(raw!==""&&raw!=null)comps.push({name:c.name,p:(Number(raw)||0)/c.max})})}
 $("studentComponentTable").innerHTML=buildStudentComponentTable(m);
 let custom=D.notes.filter(x=>x["Student Name"]===n&&x["Custom Priority / Recommendation"]).slice(-1)[0],weakest=[...comps].sort((x,y)=>x.p-y.p)[0];
 let rec=weakest?D.recs.find(r=>String(r["Skill / Component"]).trim().toLowerCase()===weakest.name.trim().toLowerCase()&&weakest.p*100<(Number(r["Threshold Below (%)"])||50)):null,txt=custom?.["Custom Priority / Recommendation"]||rec?.["Specific Improvement Recommendation"]||"";
 $("priority").innerHTML=txt?`<div class="priority"><b>${custom?"Teacher priority":esc(weakest?.name||"Priority")}</b><br>${esc(txt)}</div>`:empty(weakest?`Lowest area: ${weakest.name} (${pc(weakest.p)}). Add a matching recommendation in the workbook if you want an automatic next step.`:"No specific priority available.");
 let ns=D.notes.filter(x=>x["Student Name"]===n);$("notes").innerHTML=ns.length?ns.map(x=>`<div class="note"><b>${esc(x["Note Type"]||"Note")}</b>${x.Date?" · "+esc(String(x.Date)):""}<br>${esc(x["Teacher Note"]||"")}${x["Follow-up / Action"]?`<br><span class="muted">Follow-up: ${esc(x["Follow-up / Action"])}</span>`:""}</div>`).join(""):empty("No saved notes.");scrollTo(0,0)
}
function back(){$("profileView").classList.add("hidden");$("home").classList.remove("hidden");$("classHome").classList.add("hidden");$("classDashboard").classList.remove("hidden");scrollTo(0,0)}
function kpi(a,b,c){return `<div class="card"><small>${esc(a)}</small><div class="v">${esc(String(b))}</div><small>${esc(c)}</small></div>`}function bar(n,v){return `<div class="bar"><b>${esc(n)}</b><div class="track"><div class="fill" style="width:${Math.max(0,Math.min(100,v*100))}%"></div></div><b>${pc(v)}</b></div>`}function component(n,v){return `<div class="component"><b>${esc(n)}</b><div class="track"><div class="fill" style="width:${Math.max(0,Math.min(100,v*100))}%"></div></div><b>${pc(v)}</b></div>`}function empty(t){return `<div class="empty">${esc(t)}</div>`}


if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js");
  });
}
