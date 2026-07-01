import { useState, useMemo, useRef, useEffect } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const BRAND = "#C0392B";
const BRAND_LIGHT = "#FADBD8";

const statusConfig = {
  "Aprobado":     { color: "#27AE60", bg: "#EAFAF1" },
  "En Progreso":  { color: "#F39C12", bg: "#FEF9E7" },
  "Fallido":      { color: "#E74C3C", bg: "#FDEDEC" },
  "No ejecutado": { color: "#95A5A6", bg: "#F2F3F4" },
  "No aplica":    { color: "#BDC3C7", bg: "#F2F3F4" },
  "Bloqueante":   { color: "#8E44AD", bg: "#F5EEF8" },
};
const issueStatusConfig = {
  "Open":        { color: "#E74C3C", bg: "#FDEDEC" },
  "Closed":      { color: "#27AE60", bg: "#EAFAF1" },
  "In Progress": { color: "#F39C12", bg: "#FEF9E7" },
  "Blocked":     { color: "#8E44AD", bg: "#F5EEF8" },
};
const severityConfig = { "Critical":"#C0392B","High":"#E74C3C","Medium":"#F39C12","Low":"#27AE60" };
const COLORS = ["#C0392B","#2980B9","#16A085","#8E44AD","#D35400","#2C3E50","#27AE60","#F39C12"];
const EMPTY_TC = { area:"",proceso:"",escenario:"",descripcion:"",pasos:"",resultado:"",fechaAprobacion:"",fechaEjecucion:"",estado:"No ejecutado",asignadoA:"",attachments:[],historial:[],comentarios:[] };
const EMPTY_ISSUE = { testId:"",escenario:"",formulario:"",observacion:"",modulo:"",estado:"Open",severidad:"Medium",prioridad:"Medium",fechaCreacion:"",fechaSolucion:"",attachments:[] };
const EMPTY_CICLO = { nombre:"",modulo:"",fechaInicio:"",fechaFin:"",descripcion:"",ejecuciones:[] };
// ejecucion: { tcId, estado, fechaEjecucion, nota }

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const seedProjects = [{
  id:"proj-1", name:"Panamericana – SAP Compras", description:"Pruebas funcionales módulo Compras a Pago", color:"#C0392B", createdAt:"01/06/2026",
  tests:[
    { id:"TC-01",area:"Compras a pago",proceso:"Compras",escenario:"Modificación",descripcion:"Modificación de ítems o condiciones específicas en una orden de compra",pasos:"1. Ingresar al sistema\n2. Buscar la orden de compra\n3. Validar estado de la orden\n4. Seleccionar ítem a modificar\n5. Realizar cambios\n6. Guardar cambios",resultado:"La orden de compra se actualiza correctamente",fechaAprobacion:"29/04/2026",fechaEjecucion:"",estado:"Aprobado",asignadoA:"",attachments:[],historial:[{fecha:"29/04/2026",de:"—",a:"Aprobado",nota:"Estado inicial"}],comentarios:[] },
    { id:"TC-02",area:"Compras a pago",proceso:"Logística",escenario:"Recepción de mercancía",descripcion:"Recepción conforme a orden de compra",pasos:"1. Ingresar al sistema\n2. Verificar estado de la orden\n3. Recibir mercancía\n4. Validar orden vs factura\n5. Registrar recepción",resultado:"La mercancía es recibida y registrada en inventario",fechaAprobacion:"21/05/2026",fechaEjecucion:"21/05/2026",estado:"Aprobado",asignadoA:"",attachments:[],historial:[{fecha:"21/05/2026",de:"—",a:"Aprobado",nota:""}],comentarios:[] },
    { id:"TC-03",area:"Compras a pago",proceso:"Logística",escenario:"Devolución parcial",descripcion:"Devolución parcial por producto defectuoso",pasos:"1. Recibir mercancía\n2. Identificar producto dañado\n3. Registrar devolución parcial\n4. Aceptar productos en buen estado",resultado:"Se recibe parcialmente y se registra devolución",fechaAprobacion:"21/05/2026",fechaEjecucion:"21/05/2026",estado:"Aprobado",asignadoA:"",attachments:[],historial:[],comentarios:[] },
    { id:"TC-04",area:"Compras a pago",proceso:"Pagos",escenario:"Generación de pago",descripcion:"Generar pago a proveedor contra factura registrada",pasos:"1. Buscar factura\n2. Validar orden de compra\n3. Generar documento de pago\n4. Aprobar pago\n5. Registrar egreso",resultado:"El pago se genera y registra correctamente",fechaAprobacion:"",fechaEjecucion:"",estado:"Fallido",asignadoA:"",attachments:[],historial:[{fecha:"06/05/2026",de:"—",a:"Fallido",nota:"Error en generación"}],comentarios:[] },
    { id:"TC-05",area:"Compras a pago",proceso:"Compras",escenario:"Aprobación multinivel",descripcion:"Flujo de aprobación multinivel de orden de compra",pasos:"1. Crear orden\n2. Enviar a aprobación\n3. Primer nivel aprueba\n4. Segundo nivel aprueba\n5. Orden habilitada",resultado:"La orden pasa por todos los niveles de aprobación",fechaAprobacion:"21/05/2026",fechaEjecucion:"",estado:"En Progreso",asignadoA:"",attachments:[],historial:[],comentarios:[] },
  ],
  issues:[
    { id:1,testId:"TC-01",escenario:"Distribución de ajustes de comprobantes",formulario:"Distribución de ajustes",observacion:"Con productos no inventariados, está tomando la moneda de parámetros incorrecta. La columna NIT no se visualiza de manera consistente.",modulo:"Compras a pagos",estado:"Closed",severidad:"Medium",prioridad:"High",fechaCreacion:"05/05/2026",attachments:[] },
    { id:2,testId:"TC-04",escenario:"Registro comprobantes de Cuentas por pagar",formulario:"NP0575 Comprobantes",observacion:"Error al seleccionar comprobante: 'Invalid column name NP0575'.",modulo:"Compras a pagos",estado:"Open",severidad:"High",prioridad:"Critical",fechaCreacion:"06/05/2026",attachments:[] },
  ],
  ciclos:[
    { id:"ciclo-1", nombre:"Ciclo 1", modulo:"Compras", fechaInicio:"2026-05-01", fechaFin:"2026-05-21", descripcion:"Primera ejecución módulo Compras",
      ejecuciones:[
        {tcId:"TC-01",estado:"Aprobado",fechaEjecucion:"21/05/2026",nota:""},
        {tcId:"TC-02",estado:"Aprobado",fechaEjecucion:"21/05/2026",nota:""},
        {tcId:"TC-04",estado:"Fallido",fechaEjecucion:"21/05/2026",nota:"Error en generación de pago"},
      ]},
    { id:"ciclo-2", nombre:"Ciclo 2", modulo:"Compras", fechaInicio:"2026-05-22", fechaFin:"2026-05-30", descripcion:"Re-ejecución casos fallidos",
      ejecuciones:[
        {tcId:"TC-04",estado:"No ejecutado",fechaEjecucion:"",nota:""},
      ]},
  ],
}];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function nextTcId(tests) {
  if (!tests.length) return "TC-01";
  const nums = tests.map(t => parseInt(t.id.replace("TC-",""))||0);
  return `TC-${String(Math.max(...nums)+1).padStart(2,"0")}`;
}
function today() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}
function toInputDate(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [d,m,y] = String(value).split("/");
  if (d && m && y) return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  return "";
}
function toDisplayDate(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y,m,d] = value.split("-");
    return `${d}/${m}/${y}`;
  }
  return value;
}
function readFileAsDataURL(file) {
  return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); });
}
function fileIcon(name) {
  const ext = name.split(".").pop().toLowerCase();
  if(["png","jpg","jpeg","gif","webp"].includes(ext)) return "🖼️";
  if(["doc","docx"].includes(ext)) return "📄";
  if(ext==="pdf") return "📕";
  return "📎";
}
function storageUsedMB() {
  try {
    let total = 0;
    for(let k in localStorage) total += (localStorage[k]?.length||0)*2;
    return (total/1024/1024).toFixed(2);
  } catch { return 0; }
}

// ─── UI ATOMS ─────────────────────────────────────────────────────────────────
function Badge({label,color,bg}) {
  return <span style={{display:"inline-flex",alignItems:"center",padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:700,color,background:bg,border:`1px solid ${color}30`,whiteSpace:"nowrap"}}>{label}</span>;
}
function Btn({children,onClick,variant="primary",small,danger,disabled,style:extra={}}) {
  const base={border:"none",borderRadius:8,cursor:disabled?"not-allowed":"pointer",fontWeight:700,fontSize:small?12:13,padding:small?"5px 12px":"9px 18px",transition:"all 0.15s",opacity:disabled?0.5:1,...extra};
  const styles={primary:{background:BRAND,color:"#fff"},ghost:{background:"#f4f4f4",color:"#444"},danger:{background:"#FDEDEC",color:"#E74C3C"}};
  return <button onClick={onClick} disabled={disabled} style={{...base,...(danger?styles.danger:styles[variant])}}>{children}</button>;
}
function Field({label,children}) {
  return <div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{fontSize:11,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</label>{children}</div>;
}
const inputStyle={border:"1px solid #e0e0e0",borderRadius:8,padding:"9px 12px",fontSize:13,outline:"none",width:"100%",boxSizing:"border-box",fontFamily:"inherit",background:"#fff"};
const inputStyleDark={...inputStyle,background:"#2C2C2E",border:"1px solid #444",color:"#eee"};

function Modal({children,onClose,wide,preventOutsideClose}) {
  return (
    <div style={{position:"fixed",inset:0,background:"#00000055",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
      onClick={preventOutsideClose ? undefined : onClose}>
      <div style={{background:"linear-gradient(135deg, #ffffff 0%, #f9fbff 100%)",borderRadius:16,padding:"32px 34px",width:"100%",maxWidth:wide?920:620,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 80px #00000030",border:"1px solid #e8f0ff"}} onClick={e=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
function ModalHeader({title,sub,onClose}) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22,padding:"14px 16px",borderRadius:14,background:"linear-gradient(90deg, rgba(192,57,43,0.10) 0%, rgba(192,57,43,0.03) 100%)",border:"1px solid rgba(192,57,43,0.14)",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.7)"}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
        <div style={{width:10,height:40,borderRadius:999,background:"linear-gradient(180deg, #C0392B 0%, #E74C3C 100%)",boxShadow:"0 0 0 4px rgba(192,57,43,0.12)"}}/>
        <div>
          <h3 style={{margin:0,fontSize:18,fontWeight:800,color:"var(--text-primary,#1a1a1a)"}}>{title}</h3>
          {sub&&<p style={{margin:"4px 0 0",fontSize:12,color:"#6b7280",fontWeight:600}}>{sub}</p>}
        </div>
      </div>
      <button onClick={onClose} style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,padding:"6px 11px",cursor:"pointer",fontSize:16,color:"#6b7280",boxShadow:"0 2px 6px rgba(0,0,0,0.04)"}}>✕</button>
    </div>
  );
}

// ─── ATTACHMENT ZONE ──────────────────────────────────────────────────────────
function AttachmentZone({attachments,onChange}) {
  const fileRef=useRef();
  const [dragging,setDragging]=useState(false);
  async function handleFiles(files) {
    const arr=Array.from(files).filter(f=>{ const ext=f.name.split(".").pop().toLowerCase(); return ["png","jpg","jpeg","gif","webp","doc","docx","pdf"].includes(ext); });
    const processed=await Promise.all(arr.map(async f=>({name:f.name,type:f.type,size:f.size,data:await readFileAsDataURL(f)})));
    onChange([...attachments,...processed]);
  }
  function remove(i){onChange(attachments.filter((_,idx)=>idx!==i));}
  function download(att){const a=document.createElement("a");a.href=att.data;a.download=att.name;a.click();}
  return (
    <div>
      <div onClick={()=>fileRef.current.click()} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);handleFiles(e.dataTransfer.files);}}
        style={{border:`2px dashed ${dragging?BRAND:"#ddd"}`,borderRadius:10,padding:"16px 14px",textAlign:"center",cursor:"pointer",background:dragging?BRAND_LIGHT:"#fafafa",transition:"all 0.2s"}}>
        <div style={{fontSize:20}}>📎</div>
        <div style={{fontSize:12,color:"#888",marginTop:3}}>Arrastra o haz clic para adjuntar</div>
        <div style={{fontSize:11,color:"#bbb",marginTop:2}}>Imágenes · Word · PDF</div>
      </div>
      <input ref={fileRef} type="file" multiple accept=".png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.pdf" style={{display:"none"}} onChange={e=>handleFiles(e.target.files)}/>
      {attachments.length>0&&(
        <div style={{marginTop:8,display:"flex",flexWrap:"wrap",gap:7}}>
          {attachments.map((att,i)=>{
            const isImg=att.type.startsWith("image/");
            return (
              <div key={i} style={{border:"1px solid #e8e8e8",borderRadius:8,overflow:"hidden",background:"#fff",boxShadow:"0 1px 4px #0000000a",maxWidth:isImg?100:180}}>
                {isImg?<img src={att.data} alt={att.name} style={{width:100,height:68,objectFit:"cover",display:"block"}}/>
                  :<div style={{padding:"9px 11px",display:"flex",alignItems:"center",gap:7}}><span style={{fontSize:18}}>{fileIcon(att.name)}</span><span style={{fontSize:11,color:"#555",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:110}}>{att.name}</span></div>}
                <div style={{display:"flex",borderTop:"1px solid #f0f0f0"}}>
                  <button onClick={()=>download(att)} style={{flex:1,border:"none",background:"none",padding:"4px 0",cursor:"pointer",fontSize:11,color:"#666"}}>⬇</button>
                  <button onClick={()=>remove(i)} style={{border:"none",background:"none",padding:"4px 6px",cursor:"pointer",fontSize:11,color:"#E74C3C"}}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
function AttachmentViewer({attachments}) {
  if(!attachments||!attachments.length) return <span style={{fontSize:12,color:"#bbb"}}>Sin adjuntos</span>;
  function download(att){const a=document.createElement("a");a.href=att.data;a.download=att.name;a.click();}
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
      {attachments.map((att,i)=>{
        const isImg=att.type.startsWith("image/");
        return (
          <div key={i} onClick={()=>download(att)} style={{border:"1px solid #e8e8e8",borderRadius:8,overflow:"hidden",background:"#fff",cursor:"pointer",boxShadow:"0 1px 4px #0000000a",maxWidth:isImg?110:190}}>
            {isImg?<img src={att.data} alt={att.name} style={{width:110,height:78,objectFit:"cover",display:"block"}}/>
              :<div style={{padding:"10px 12px",display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:20}}>{fileIcon(att.name)}</span><span style={{fontSize:11,color:"#555",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:120}}>{att.name}</span></div>}
            <div style={{padding:"3px 8px",fontSize:10,color:"#aaa",textAlign:"center",borderTop:"1px solid #f0f0f0"}}>⬇ Descargar</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── DONUT ────────────────────────────────────────────────────────────────────
function Donut({data}) {
  const total=data.reduce((s,d)=>s+d.value,0);
  if(!total) return <div style={{fontSize:12,color:"#bbb",padding:20}}>Sin datos aún</div>;
  let cum=0;
  function polar(cx,cy,r,a){const rad=(a-90)*Math.PI/180;return{x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad)};}
  function arc(cx,cy,r,s,e){if(e-s>=360)e=359.99;const a=polar(cx,cy,r,s),b=polar(cx,cy,r,e),l=e-s>180?1:0;return `M${a.x} ${a.y}A${r} ${r} 0 ${l} 1 ${b.x} ${b.y}`;}
  const segs=data.filter(d=>d.value>0).map(d=>{const s=(cum/total)*360;cum+=d.value;return{...d,s,e:(cum/total)*360};});
  return (
    <div style={{display:"flex",alignItems:"center",gap:20}}>
      <svg width={110} height={110} viewBox="0 0 110 110">
        {segs.map((s,i)=><path key={i} d={arc(55,55,38,s.s,s.e)} fill="none" stroke={s.color} strokeWidth={14}/>)}
        <circle cx={55} cy={55} r={24} fill="white"/>
        <text x={55} y={55} textAnchor="middle" dy="0.35em" style={{fontSize:18,fontWeight:800,fill:"#222"}}>{total}</text>
      </svg>
      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {data.filter(d=>d.value>0).map((d,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:7}}>
            <div style={{width:9,height:9,borderRadius:2,background:d.color,flexShrink:0}}/>
            <span style={{fontSize:11,color:"#555"}}>{d.label}</span>
            <span style={{fontSize:11,fontWeight:700,color:"#222",marginLeft:"auto",paddingLeft:10}}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── LINE CHART (timeline) ────────────────────────────────────────────────────
function LineChart({data,color="#27AE60",label}) {
  if(!data||data.length<2) return <div style={{fontSize:12,color:"#bbb",padding:20}}>Sin datos de línea de tiempo aún</div>;
  const W=320,H=100,pad=30;
  const vals=data.map(d=>d.value);
  const minV=Math.min(...vals),maxV=Math.max(...vals);
  const range=maxV-minV||1;
  const pts=data.map((d,i)=>({
    x:pad+(i/(data.length-1))*(W-pad*2),
    y:H-pad-((d.value-minV)/range)*(H-pad*2),
    label:d.label,value:d.value
  }));
  const path=pts.map((p,i)=>`${i===0?"M":"L"}${p.x} ${p.y}`).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}>
      <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round"/>
      {pts.map((p,i)=>(
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill={color}/>
          <text x={p.x} y={H-8} textAnchor="middle" style={{fontSize:9,fill:"#aaa"}}>{p.label}</text>
          <text x={p.x} y={p.y-8} textAnchor="middle" style={{fontSize:9,fill:color,fontWeight:700}}>{p.value}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── SEMÁFORO ─────────────────────────────────────────────────────────────────
function Semaforo({pct}) {
  const color = pct>=70?"#27AE60":pct>=40?"#F39C12":"#E74C3C";
  const label = pct>=70?"✅ En buen ritmo":pct>=40?"⚠️ Progreso moderado":"🔴 Requiere atención";
  return (
    <div style={{display:"flex",alignItems:"center",gap:14}}>
      <div style={{width:48,height:48,borderRadius:"50%",background:color,boxShadow:`0 0 16px ${color}80`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,transition:"background 0.4s"}}>
        {pct>=70?"✅":pct>=40?"⚠️":"🔴"}
      </div>
      <div>
        <div style={{fontSize:22,fontWeight:800,color}}>{pct}% ejecutado</div>
        <div style={{fontSize:12,color:"#888"}}>{label}</div>
      </div>
    </div>
  );
}

// ─── EXPORT XLSX ──────────────────────────────────────────────────────────────
function exportToCSV(proj, tests = proj.tests) {
  const headers = ["ID","Área","Proceso","Escenario","Descripción","Pasos","Resultado Esperado","Asignado A","Fecha Aprobación","Fecha Ejecución","Estado"];
  const rows = tests.map(t=>[t.id,t.area,t.proceso,t.escenario,t.descripcion,t.pasos?.replace(/\n/g," | "),t.resultado,t.asignadoA||"",t.fechaAprobacion,t.fechaEjecucion,t.estado]);
  const csv = [headers,...rows].map(r=>r.map(c=>`"${(c||"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`${proj.name}_TCs.csv`;a.click();
}
function exportIssuesToCSV(proj, issuesList = proj.issues) {
  const headers = ["ID","TC","Escenario","Descripción de la novedad","Módulo","Observación","Estado","Severidad","Prioridad","Fecha Creación"];
  const rows = issuesList.map(i=>[i.id,i.testId,i.escenario,i.formulario,i.modulo,i.observacion,i.estado,i.severidad,i.prioridad,i.fechaCreacion]);
  const csv = [headers,...rows].map(r=>r.map(c=>`"${(c||"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`${proj.name}_Issues.csv`;a.click();
}

// ─── EXPORT DASHBOARD PDF ────────────────────────────────────────────────────
function exportDashboardPDF(proj, tests = proj.tests, issues = proj.issues) {
  const { name, description, createdAt } = proj;
  const dateNow = today();
  const stats = {
    "Aprobado": tests.filter(t=>t.estado==="Aprobado").length,
    "En Progreso": tests.filter(t=>t.estado==="En Progreso").length,
    "Fallido": tests.filter(t=>t.estado==="Fallido").length,
    "No ejecutado": tests.filter(t=>t.estado==="No ejecutado").length,
    "No aplica": tests.filter(t=>t.estado==="No aplica").length,
    "Bloqueante": tests.filter(t=>t.estado==="Bloqueante").length,
  };
  const issueStats = {
    open: issues.filter(i=>i.estado==="Open").length,
    inProg: issues.filter(i=>i.estado==="In Progress").length,
    closed: issues.filter(i=>i.estado==="Closed").length,
    blocked: issues.filter(i=>i.estado==="Blocked").length,
    total: issues.length,
  };
  const pct = n => tests.length ? Math.round((n / tests.length) * 100) : 0;
  const execPct = pct(stats["Aprobado"] + stats["No aplica"]);

  // Build bar SVG
  const bars = [
    { label:"Aprobado",     value:stats["Aprobado"],     color:"#27AE60" },
    { label:"En Progreso",  value:stats["En Progreso"],  color:"#F39C12" },
    { label:"Fallido",      value:stats["Fallido"],      color:"#E74C3C" },
    { label:"No ejecutado", value:stats["No ejecutado"], color:"#95A5A6" },
    { label:"No aplica",    value:stats["No aplica"],    color:"#BDC3C7" },
    { label:"Bloqueante",   value:stats["Bloqueante"],   color:"#8E44AD" },
  ];
  const barsSVG = bars.map((b,i) => {
    const w = tests.length ? Math.round((b.value / tests.length) * 300) : 0;
    return `<g transform="translate(0,${i*28})">
      <text x="0" y="14" font-size="11" fill="#555">${b.label}</text>
      <rect x="110" y="4" width="${w}" height="14" rx="4" fill="${b.color}"/>
      <text x="${110+w+6}" y="14" font-size="11" fill="${b.color}" font-weight="bold">${b.value} (${pct(b.value)}%)</text>
    </g>`;
  }).join("");

  const semColor = execPct>=70?"#27AE60":execPct>=40?"#F39C12":"#E74C3C";
  const semLabel = execPct>=70?"En buen ritmo":execPct>=40?"Progreso moderado":"Requiere atención";
  const escapeHtml = v => String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#39;");

  const timelineData = Object.entries(
    tests.filter(t=>t.fechaEjecucion).reduce((acc,t)=>{acc[t.fechaEjecucion]=(acc[t.fechaEjecucion]||0)+1;return acc;}, {})
  )
    .sort((a,b)=>a[0].localeCompare(b[0]))
    .map(([label,value])=>({label,value}));
  const timelineW = 520;
  const timelineH = 140;
  const timelinePad = 24;
  const timelineMax = Math.max(...timelineData.map(d=>d.value), 1);
  const timelinePoints = timelineData.map((d,i)=>({
    x: timelinePad + (i / Math.max(timelineData.length - 1, 1)) * (timelineW - timelinePad * 2),
    y: timelineH - timelinePad - ((d.value / timelineMax) * (timelineH - timelinePad * 2))
  }));
  const timelinePath = timelinePoints.map((p,i)=>`${i===0?"M":"L"}${p.x} ${p.y}`).join(" ");
  const timelineSvg = timelineData.length>=2 ? `<svg width="520" height="140" viewBox="0 0 ${timelineW} ${timelineH}">
    <line x1="${timelinePad}" y1="${timelineH-timelinePad}" x2="${timelineW-timelinePad}" y2="${timelineH-timelinePad}" stroke="#ddd" />
    <path d="${timelinePath}" fill="none" stroke="#C0392B" stroke-width="2.5" />
    ${timelinePoints.map((p,i)=>`<circle cx="${p.x}" cy="${p.y}" r="4" fill="#C0392B" /><text x="${p.x}" y="${timelineH-8}" text-anchor="middle" font-size="9" fill="#888">${escapeHtml(timelineData[i].label)}</text><text x="${p.x}" y="${p.y-8}" text-anchor="middle" font-size="9" fill="#C0392B" font-weight="700">${timelineData[i].value}</text>`).join("")}
  </svg>` : `<div style="color:#888;font-size:12px">Sin datos de línea de tiempo para mostrar.</div>`;

  const cycleRows = (proj.ciclos||[]).map(c => {
    const execs = (c.ejecuciones||[]).filter(e => tests.some(t => t.id === e.tcId));
    const total = execs.length;
    const aprobados = execs.filter(e=>e.estado==="Aprobado").length;
    const fallidos = execs.filter(e=>e.estado==="Fallido").length;
    const noEjec = execs.filter(e=>e.estado==="No ejecutado").length;
    const avance = total ? Math.round((aprobados / total) * 100) : 0;
    return `<tr>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;font-weight:700">${escapeHtml(c.nombre||"Sin nombre")}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0">${escapeHtml(c.modulo||"—")}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0">${escapeHtml(c.fechaInicio||"—")}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0">${escapeHtml(c.fechaFin||"—")}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;text-align:center">${total}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;text-align:center;color:#27AE60;font-weight:700">${aprobados}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;text-align:center;color:#E74C3C;font-weight:700">${fallidos}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;text-align:center;color:#95A5A6;font-weight:700">${noEjec}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;text-align:center;font-weight:800;color:${avance>=70?"#27AE60":avance>=40?"#F39C12":"#E74C3C"}">${avance}%</td>
    </tr>`;
  }).join("");

  // TC table rows
  const tcRows = tests.map(t => {
    const sc = {"Aprobado":"#27AE60","En Progreso":"#F39C12","Fallido":"#E74C3C","No ejecutado":"#95A5A6","No aplica":"#BDC3C7","Bloqueante":"#8E44AD"}[t.estado]||"#888";
    return `<tr>
      <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;font-family:monospace;font-weight:bold;color:#C0392B">${escapeHtml(t.id)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;font-size:11px">${escapeHtml(t.area)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;font-size:11px">${escapeHtml(t.escenario)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;font-size:11px">${escapeHtml(t.asignadoA||"—")}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;font-size:11px">${escapeHtml(t.fechaEjecucion||"—")}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0"><span style="background:${sc}20;color:${sc};border:1px solid ${sc}40;border-radius:10px;padding:2px 8px;font-size:10px;font-weight:bold">${escapeHtml(t.estado)}</span></td>
    </tr>`;
  }).join("");

  const issueRows = issues.map(i => {
    const sc={"Open":"#E74C3C","Closed":"#27AE60","In Progress":"#F39C12","Blocked":"#8E44AD"}[i.estado]||"#888";
    const sv={"Critical":"#C0392B","High":"#E74C3C","Medium":"#F39C12","Low":"#27AE60"}[i.severidad]||"#888";
    return `<tr>
      <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;font-family:monospace;font-size:11px;color:#C0392B">#${escapeHtml(i.id)}·${escapeHtml(i.testId)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;font-size:11px">${escapeHtml(i.escenario)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;font-size:10px;max-width:200px">${escapeHtml(i.observacion.slice(0,80))}${i.observacion.length>80?"…":""}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0"><span style="background:${sc}20;color:${sc};border:1px solid ${sc}40;border-radius:10px;padding:2px 8px;font-size:10px;font-weight:bold">${escapeHtml(i.estado)}</span></td>
      <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0"><span style="color:${sv};font-size:10px;font-weight:bold">${escapeHtml(i.severidad)}</span></td>
    </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Dashboard – ${name}</title>
<style>
  body{font-family:Georgia,serif;margin:0;padding:32px;color:#222;background:#fff}
  .header{background:#C0392B;color:#fff;padding:20px 28px;border-radius:10px;margin-bottom:24px}
  .brand{font-weight:900;font-size:11px;letter-spacing:.07em;background:#fff;color:#C0392B;padding:3px 10px;border-radius:4px;display:inline-block;margin-bottom:8px}
  .title{font-size:22px;font-weight:800;margin:0}
  .sub{font-size:12px;opacity:.8;margin:4px 0 0}
  .section{margin-bottom:28px}
  .section-title{font-size:14px;font-weight:800;color:#C0392B;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #FADBD8}
  .chips{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px}
  .chip{border-radius:10px;padding:12px 16px;border:1px solid #f0f0f0;min-width:90px;box-shadow:0 1px 4px #0000000a}
  .chip-label{font-size:10px;color:#aaa;font-weight:700;text-transform:uppercase;letter-spacing:.07em}
  .chip-value{font-size:26px;font-weight:800;line-height:1.1}
  .semaforo{display:flex;align-items:center;gap:16px;background:#f9f9f9;border-radius:10px;padding:16px 20px;margin-bottom:20px}
  .sem-circle{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{background:#C0392B;color:#fff;padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.06em}
  .footer{margin-top:32px;font-size:10px;color:#bbb;text-align:center;border-top:1px solid #f0f0f0;padding-top:12px}
  @media print{body{padding:16px}}
</style>
</head><body>
<div class="header">
  <div class="brand">PANAMERICANA</div>
  <div class="title">${name}</div>
  <div class="sub">${description} · Generado: ${dateNow}</div>
</div>

<div class="section">
  <div class="section-title">📊 Estado General</div>
  <div class="semaforo">
    <div class="sem-circle" style="background:${semColor}20">${execPct>=70?"✅":execPct>=40?"⚠️":"🔴"}</div>
    <div>
      <div style="font-size:22px;font-weight:800;color:${semColor}">${execPct}% ejecutado</div>
      <div style="font-size:12px;color:#888">${semLabel}</div>
    </div>
  </div>
  <div class="chips">
    <div class="chip"><div class="chip-label">Total</div><div class="chip-value" style="color:#222">${tests.length}</div></div>
    <div class="chip"><div class="chip-label">Aprobado</div><div class="chip-value" style="color:#27AE60">${stats["Aprobado"]}</div></div>
    <div class="chip"><div class="chip-label">En Progreso</div><div class="chip-value" style="color:#F39C12">${stats["En Progreso"]}</div></div>
    <div class="chip"><div class="chip-label">Fallido</div><div class="chip-value" style="color:#E74C3C">${stats["Fallido"]}</div></div>
    <div class="chip"><div class="chip-label">No ejecutado</div><div class="chip-value" style="color:#95A5A6">${stats["No ejecutado"]}</div></div>
    <div class="chip"><div class="chip-label">No aplica</div><div class="chip-value" style="color:#BDC3C7">${stats["No aplica"]}</div></div>
    <div class="chip"><div class="chip-label">Bloqueante</div><div class="chip-value" style="color:#8E44AD">${stats["Bloqueante"]}</div></div>
  </div>
  <svg width="500" height="${bars.length*28+10}" viewBox="0 0 500 ${bars.length*28+10}">${barsSVG}</svg>
</div>

<div class="section">
  <div class="section-title">📈 Línea de tiempo</div>
  ${timelineSvg}
</div>

<div class="section">
  <div class="section-title">🧪 Casos de Prueba (${tests.length})</div>
  <table>
    <thead><tr><th>ID</th><th>Área</th><th>Escenario</th><th>Responsable</th><th>Fecha Ejec.</th><th>Estado</th></tr></thead>
    <tbody>${tcRows}</tbody>
  </table>
</div>

<div class="section">
  <div class="section-title">📦 Métricas por Módulo</div>
  <table>
    <thead><tr><th>Módulo</th><th>Total</th><th style="color:#27AE60">Aprobado</th><th style="color:#F39C12">En Progreso</th><th style="color:#E74C3C">Fallido</th><th style="color:#95A5A6">No ejec.</th><th style="color:#BDC3C7">No aplica</th><th>% Ejec.</th></tr></thead>
    <tbody>${(()=>{
      const mm={};
      tests.forEach(t=>{
        const mod=t.proceso||"Sin módulo";
        if(!mm[mod]) mm[mod]={total:0,ap:0,ep:0,fa:0,ne:0,na:0};
        mm[mod].total++;
        if(t.estado==="Aprobado")mm[mod].ap++;
        else if(t.estado==="En Progreso")mm[mod].ep++;
        else if(t.estado==="Fallido")mm[mod].fa++;
        else if(t.estado==="No ejecutado")mm[mod].ne++;
        else if(t.estado==="No aplica")mm[mod].na++;
      });
      return Object.entries(mm).map(([mod,m])=>{
        const mp=m.total?Math.round(((m.ap+m.na)/m.total)*100):0;
        const mc=mp>=70?"#27AE60":mp>=40?"#F39C12":"#E74C3C";
        return `<tr><td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;font-weight:700">${mod}</td><td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;text-align:center">${m.total}</td><td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;text-align:center;color:#27AE60;font-weight:700">${m.ap}</td><td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;text-align:center;color:#F39C12;font-weight:700">${m.ep}</td><td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;text-align:center;color:#E74C3C;font-weight:700">${m.fa}</td><td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;text-align:center;color:#95A5A6;font-weight:700">${m.ne}</td><td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;text-align:center;color:#BDC3C7;font-weight:700">${m.na}</td><td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;text-align:center;font-weight:800;color:${mc}">${mp}%</td></tr>`;
      }).join("");
    })()}</tbody>
  </table>
</div>

<div class="section">
  <div class="section-title">🐛 Resumen de Issues (${issues.length})</div>
  <div style="display:flex;gap:12px;margin-bottom:14px;flex-wrap:wrap">
    <span style="background:#E74C3C15;border:1px solid #E74C3C30;border-radius:8px;padding:5px 12px;font-size:12px"><strong style="color:#E74C3C">${issueStats.open}</strong> Open</span>
    <span style="background:#F39C1215;border:1px solid #F39C1230;border-radius:8px;padding:5px 12px;font-size:12px"><strong style="color:#F39C12">${issueStats.inProg}</strong> In Progress</span>
    <span style="background:#27AE6015;border:1px solid #27AE6030;border-radius:8px;padding:5px 12px;font-size:12px"><strong style="color:#27AE60">${issueStats.closed}</strong> Closed</span>
    <span style="background:#8E44AD15;border:1px solid #8E44AD30;border-radius:8px;padding:5px 12px;font-size:12px"><strong style="color:#8E44AD">${issueStats.blocked}</strong> Blocked</span>
  </div>
  <table>
    <thead><tr><th>Ref.</th><th>Escenario</th><th>Observación</th><th>Estado</th><th>Severidad</th></tr></thead>
    <tbody>${issueRows}</tbody>
  </table>
</div>

<div class="section">
  <div class="section-title">🔄 Estadísticas por Ciclo</div>
  <table>
    <thead><tr><th>Ciclo</th><th>Módulo</th><th>Inicio</th><th>Fin</th><th>Total</th><th>Aprob.</th><th>Fall.</th><th>No ejec.</th><th>Avance</th></tr></thead>
    <tbody>${cycleRows || '<tr><td colspan="9" style="padding:10px;border-bottom:1px solid #f0f0f0;color:#888">Sin ciclos para mostrar.</td></tr>'}</tbody>
  </table>
</div>

<div class="footer">Gestión de Pruebas · ${name} · ${dateNow} · Creado: ${createdAt||"—"}</div>
<script>window.onload=()=>window.print();</script>
</body></html>`;

  const w = window.open("","_blank");
  w.document.write(html);
  w.document.close();
}
// ─── JIRA INTEGRATION MODAL ──────────────────────────────────────────────────
function JiraModal({onImport,onClose,existingTests,darkMode}) {
  const [config,setConfig]=useState(()=>{
    try{return JSON.parse(localStorage.getItem("pana_jira_config")||"{}");} catch{return {};}
  });
  const [step,setStep]=useState("config"); // config | search | results
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [jql,setJql]=useState("issuetype in (Story, Task) ORDER BY created DESC");
  const [issues,setIssues]=useState([]);
  const [selected,setSelected]=useState({});
  const [area,setArea]=useState("");
  const [proceso,setProceso]=useState("");
  const IS=darkMode?inputStyleDark:inputStyle;

  function saveConfig(){
    if(!config.url||!config.email||!config.token) return setError("Todos los campos son requeridos");
    // Normalize URL
    let url=config.url.trim().replace(/\/$/,"");
    if(!url.startsWith("http")) url="https://"+url;
    const updated={...config,url};
    setConfig(updated);
    localStorage.setItem("pana_jira_config",JSON.stringify(updated));
    setError("");
    setStep("search");
  }

  async function searchJira(){
    setLoading(true);setError("");setIssues([]);
    try{
      const {url,email,token}=config;
      const encoded=btoa(`${email}:${token}`);
      const params=new URLSearchParams({jql,maxResults:50,fields:"summary,description,issuetype,status,assignee,priority,created"});
      const res=await fetch(`${url}/rest/api/3/search?${params}`,{
        headers:{"Authorization":`Basic ${encoded}`,"Accept":"application/json","Content-Type":"application/json"},
      });
      if(!res.ok){
        const err=await res.json().catch(()=>({}));
        throw new Error(err.errorMessages?.[0]||`Error ${res.status}: ${res.statusText}`);
      }
      const data=await res.json();
      setIssues(data.issues||[]);
      setStep("results");
      if(!data.issues?.length) setError("No se encontraron issues con ese filtro.");
    }catch(e){
      setError(`Error al conectar con Jira: ${e.message}. Verifica tus credenciales y que el CORS esté habilitado en tu instancia.`);
    }finally{setLoading(false);}
  }

  function toggleSelect(key){setSelected(prev=>({...prev,[key]:!prev[key]}));}
  function selectAll(){const s={};issues.forEach(i=>s[i.key]=true);setSelected(s);}
  function clearAll(){setSelected({});}

  function doImport(){
    const toImport=issues.filter(i=>selected[i.key]);
    if(!toImport.length) return alert("Selecciona al menos una historia.");
    const tcs=toImport.map(i=>{
      const desc=i.fields.description?.content?.map(b=>b.content?.map(c=>c.text||"").join("")||"").join("\n")||"";
      return{
        area: area||i.fields.issuetype?.name||"",
        proceso: proceso||"",
        escenario: i.fields.summary||"",
        descripcion: `[${i.key}] ${i.fields.summary}`,
        pasos: `1. Verificar: ${i.fields.summary}\n2. Validar criterios de aceptación\n3. Registrar resultado`,
        resultado: `La historia ${i.key} cumple con los criterios de aceptación definidos`,
        fechaAprobacion:"",fechaEjecucion:"",
        estado:"No ejecutado",
        asignadoA: i.fields.assignee?.displayName||"",
        attachments:[],
        historial:[{fecha:today(),de:"—",a:"No ejecutado",nota:`Importado desde Jira: ${i.key}`}],
        comentarios:[],
        jiraKey: i.key,
        jiraUrl: `${config.url}/browse/${i.key}`,
      };
    });
    onImport(tcs);
  }

  const selectedCount=Object.values(selected).filter(Boolean).length;

  return(
    <Modal onClose={onClose} wide preventOutsideClose>
      <ModalHeader title="Importar desde Jira" sub="Jira Cloud — trae historias de usuario como casos de prueba" onClose={onClose}/>

      {/* Steps indicator */}
      <div style={{display:"flex",gap:0,marginBottom:24,borderRadius:8,overflow:"hidden",border:`1px solid ${darkMode?"#333":"#e0e0e0"}`}}>
        {[{id:"config",label:"1. Configuración"},{id:"search",label:"2. Buscar"},{id:"results",label:"3. Seleccionar"}].map((s,i)=>(
          <div key={s.id} style={{flex:1,padding:"8px 12px",background:step===s.id?BRAND:darkMode?"#1C1C1E":"#f8f8f8",color:step===s.id?"#fff":darkMode?"#666":"#aaa",fontSize:12,fontWeight:step===s.id?700:400,textAlign:"center",cursor:s.id!=="config"&&step==="config"?"not-allowed":"pointer",transition:"all 0.2s"}}
            onClick={()=>s.id==="config"?setStep("config"):s.id==="search"&&step==="results"?setStep("search"):null}>
            {s.label}
          </div>
        ))}
      </div>

      {error&&<div style={{background:"#FDEDEC",border:"1px solid #E74C3C30",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#E74C3C",marginBottom:16}}>{error}</div>}

      {/* STEP 1: Config */}
      {step==="config"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:darkMode?"#1C1C1E":"#EAF4FB",borderRadius:8,padding:"12px 16px",fontSize:12,color:darkMode?"#aaa":"#2980B9",lineHeight:1.7}}>
            <strong>Cómo obtener el API Token:</strong><br/>
            1. Ve a <strong>id.atlassian.com/manage-profile/security/api-tokens</strong><br/>
            2. Clic en "Create API token" → copia el token generado
          </div>
          <Field label="URL de tu Jira (ej: https://tuempresa.atlassian.net)">
            <input style={IS} value={config.url||""} onChange={e=>setConfig(c=>({...c,url:e.target.value}))} placeholder="https://tuempresa.atlassian.net"/>
          </Field>
          <Field label="Tu email de Jira">
            <input style={IS} value={config.email||""} onChange={e=>setConfig(c=>({...c,email:e.target.value}))} placeholder="tu@email.com" type="email"/>
          </Field>
          <Field label="API Token">
            <input style={IS} value={config.token||""} onChange={e=>setConfig(c=>({...c,token:e.target.value}))} placeholder="Tu API token de Jira" type="password"/>
          </Field>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:8}}>
            <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
            <Btn onClick={saveConfig}>Siguiente →</Btn>
          </div>
        </div>
      )}

      {/* STEP 2: Search */}
      {step==="search"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"flex",gap:8,alignItems:"center",background:darkMode?"#1C1C1E":"#EAFAF1",borderRadius:8,padding:"10px 14px"}}>
            <span style={{fontSize:18}}>✅</span>
            <div style={{fontSize:12,color:darkMode?"#aaa":"#27AE60"}}>Conectado a <strong>{config.url}</strong></div>
            <button onClick={()=>setStep("config")} style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#888"}}>Cambiar</button>
          </div>
          <Field label="Filtro JQL">
            <textarea style={{...IS,minHeight:70,resize:"vertical",fontFamily:"monospace",fontSize:12}} value={jql} onChange={e=>setJql(e.target.value)}/>
          </Field>
          <div style={{fontSize:11,color:darkMode?"#888":"#aaa",lineHeight:1.7}}>
            Ejemplos de JQL:<br/>
            <code style={{background:darkMode?"#2C2C2E":"#f5f5f5",padding:"1px 6px",borderRadius:4}}>project = "MiProyecto" AND issuetype = Story</code><br/>
            <code style={{background:darkMode?"#2C2C2E":"#f5f5f5",padding:"1px 6px",borderRadius:4}}>sprint in openSprints() AND issuetype in (Story, Task)</code><br/>
            <code style={{background:darkMode?"#2C2C2E":"#f5f5f5",padding:"1px 6px",borderRadius:4}}>assignee = currentUser() AND status != Done</code>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Área (se aplicará a todos los TCs importados)">
              <input style={IS} value={area} onChange={e=>setArea(e.target.value)} placeholder="Ej: Compras a pago"/>
            </Field>
            <Field label="Proceso / Módulo">
              <input style={IS} value={proceso} onChange={e=>setProceso(e.target.value)} placeholder="Ej: Logística"/>
            </Field>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
            <Btn variant="ghost" onClick={()=>setStep("config")}>← Atrás</Btn>
            <Btn onClick={searchJira} disabled={loading}>{loading?"Buscando...":"🔍 Buscar en Jira"}</Btn>
          </div>
        </div>
      )}

      {/* STEP 3: Results */}
      {step==="results"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:13,color:darkMode?"#aaa":"#555"}}>{issues.length} historias encontradas · {selectedCount} seleccionadas</span>
            <div style={{display:"flex",gap:8}}>
              <button onClick={selectAll} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:BRAND,fontWeight:700}}>Seleccionar todas</button>
              <button onClick={clearAll} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#aaa"}}>Limpiar</button>
            </div>
          </div>
          <div style={{maxHeight:340,overflowY:"auto",display:"flex",flexDirection:"column",gap:7,paddingRight:4}}>
            {issues.map(issue=>{
              const isSel=!!selected[issue.key];
              const alreadyImported=existingTests.some(t=>t.jiraKey===issue.key);
              return(
                <div key={issue.key}
                  onClick={()=>!alreadyImported&&toggleSelect(issue.key)}
                  style={{display:"flex",alignItems:"flex-start",gap:12,padding:"10px 14px",border:`2px solid ${isSel?BRAND:darkMode?"#333":"#e8e8e8"}`,borderRadius:10,cursor:alreadyImported?"not-allowed":"pointer",background:isSel?BRAND_LIGHT:darkMode?"#1C1C1E":"#fff",opacity:alreadyImported?0.5:1,transition:"all 0.15s"}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${isSel?BRAND:"#ccc"}`,background:isSel?BRAND:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",marginTop:2}}>
                    {isSel&&<span style={{color:"#fff",fontSize:12,fontWeight:900}}>✓</span>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                      <span style={{fontFamily:"monospace",fontSize:11,fontWeight:700,color:BRAND,background:BRAND_LIGHT,padding:"1px 7px",borderRadius:4}}>{issue.key}</span>
                      <span style={{fontSize:10,background:darkMode?"#2C2C2E":"#f5f5f5",color:darkMode?"#888":"#999",padding:"1px 7px",borderRadius:4}}>{issue.fields.issuetype?.name}</span>
                      <span style={{fontSize:10,color:darkMode?"#666":"#bbb"}}>{issue.fields.status?.name}</span>
                      {alreadyImported&&<span style={{fontSize:10,color:"#27AE60",fontWeight:700}}>✓ Ya importado</span>}
                    </div>
                    <div style={{fontSize:13,fontWeight:600,color:darkMode?"#eee":"#333",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{issue.fields.summary}</div>
                    {issue.fields.assignee&&<div style={{fontSize:11,color:darkMode?"#666":"#aaa",marginTop:2}}>👤 {issue.fields.assignee.displayName}</div>}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
            <Btn variant="ghost" onClick={()=>setStep("search")}>← Nueva búsqueda</Btn>
            <Btn onClick={doImport} disabled={!selectedCount}>⬇ Importar {selectedCount} historia(s) como TCs</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

function parseCSVImport(text, existingTests) {
  const lines = text.split("\n").filter(l=>l.trim());
  if(lines.length<2) return [];
  const imported = [];
  for(let i=1;i<lines.length;i++){
    const cols = lines[i].split(",").map(c=>c.replace(/^"|"$/g,"").replace(/""/g,'"').trim());
    if(cols.length<4) continue;
    const newId = nextTcId([...existingTests,...imported]);
    imported.push({
      id: newId,
      area: cols[1]||"",
      proceso: cols[2]||"",
      escenario: cols[3]||"",
      descripcion: cols[4]||"",
      pasos: (cols[5]||"").replace(/ \| /g,"\n"),
      resultado: cols[6]||"",
      asignadoA: cols[7]||"",
      fechaAprobacion: cols[8]||"",
      fechaEjecucion: cols[9]||"",
      estado: cols[10]||"No ejecutado",
      attachments:[],historial:[],comentarios:[],
    });
  }
  return imported;
}

// ─── CICLO FORM MODAL ────────────────────────────────────────────────────────
function CicloFormModal({initial,cicloId,modulosList,onSave,onClose,darkMode}) {
  const [form,setForm]=useState(initial||{...EMPTY_CICLO});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const IS=darkMode?inputStyleDark:inputStyle;
  return (
    <Modal onClose={onClose} preventOutsideClose>
      <ModalHeader title={initial?`Editar ${cicloId}`:"Nuevo Ciclo de Prueba"} sub="Define el ciclo y su módulo" onClose={onClose}/>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <Field label="Nombre del Ciclo"><input style={IS} value={form.nombre} onChange={e=>set("nombre",e.target.value)} placeholder="Ej: Ciclo 1, Ciclo 2 Re-prueba..."/></Field>
        <Field label="Módulo">
          <input style={IS} value={form.modulo} onChange={e=>set("modulo",e.target.value)} placeholder="Ej: Compras, Activos Fijos..." list="modulos-list"/>
          <datalist id="modulos-list">{modulosList.map(m=><option key={m} value={m}/>)}</datalist>
        </Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Fecha Inicio"><input style={IS} type="date" value={form.fechaInicio} onChange={e=>set("fechaInicio",e.target.value)}/></Field>
          <Field label="Fecha Fin"><input style={IS} type="date" value={form.fechaFin} onChange={e=>set("fechaFin",e.target.value)}/></Field>
        </div>
        <Field label="Descripción (opcional)"><textarea style={{...IS,minHeight:60,resize:"vertical"}} value={form.descripcion} onChange={e=>set("descripcion",e.target.value)} placeholder="Objetivo del ciclo, contexto..."/></Field>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:20}}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={()=>{if(!form.nombre.trim()||!form.modulo.trim())return alert("Nombre y módulo son requeridos");onSave(form);}}>💾 Guardar</Btn>
      </div>
    </Modal>
  );
}

// ─── FORM MODALS ──────────────────────────────────────────────────────────────
function ProjectFormModal({initial,onSave,onClose,darkMode}) {
  const [form,setForm]=useState(initial||{name:"",description:"",color:COLORS[0]});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const IS=darkMode?inputStyleDark:inputStyle;
  return (
    <Modal onClose={onClose} preventOutsideClose>
      <ModalHeader title={initial?"Editar Proyecto":"Nuevo Proyecto"} onClose={onClose}/>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <Field label="Nombre del Proyecto"><input style={IS} value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Ej: SAP – Módulo Ventas"/></Field>
        <Field label="Descripción"><input style={IS} value={form.description} onChange={e=>set("description",e.target.value)} placeholder="Descripción breve"/></Field>
        <Field label="Color">
          <div style={{display:"flex",gap:10}}>
            {COLORS.map(c=><div key={c} onClick={()=>set("color",c)} style={{width:28,height:28,borderRadius:6,background:c,cursor:"pointer",border:form.color===c?"3px solid #fff":"3px solid transparent",transition:"border 0.15s"}}/>)}
          </div>
        </Field>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:20}}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={()=>{if(!form.name.trim())return alert("El nombre es requerido");onSave(form);}}>💾 Guardar</Btn>
      </div>
    </Modal>
  );
}

function TcFormModal({initial,tcId,onSave,onClose,darkMode}) {
  const [form,setForm]=useState({ ...EMPTY_TC, ...(initial||{}) });
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const IS=darkMode?inputStyleDark:inputStyle;
  return (
    <Modal onClose={onClose} wide preventOutsideClose>
      <ModalHeader title={initial?`Editar ${tcId}`:"Nuevo Caso de Prueba"} sub={initial?"Modifica y guarda":"Completa los datos del escenario"} onClose={onClose}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <Field label="Área"><input style={IS} value={form.area} onChange={e=>set("area",e.target.value)} placeholder="Compras a pago"/></Field>
        <Field label="Proceso"><input style={IS} value={form.proceso} onChange={e=>set("proceso",e.target.value)} placeholder="Logística"/></Field>
        <Field label="Escenario"><textarea style={{...IS,minHeight:48,resize:"vertical",whiteSpace:"pre-wrap",overflowWrap:"anywhere"}} value={form.escenario} onChange={e=>set("escenario",e.target.value)} placeholder="Recepción de mercancía"/></Field>
        <Field label="Asignado a"><input style={IS} value={form.asignadoA||""} onChange={e=>set("asignadoA",e.target.value)} placeholder="Nombre del responsable"/></Field>
        <Field label="Estado">
          <select style={IS} value={form.estado} onChange={e=>set("estado",e.target.value)}>
            {Object.keys(statusConfig).map(k=><option key={k} value={k}>{k}</option>)}
          </select>
        </Field>
        <Field label="Fecha Aprobación"><input type="date" style={IS} value={toInputDate(form.fechaAprobacion)} onChange={e=>set("fechaAprobacion",toDisplayDate(e.target.value))}/></Field>
        <Field label="Fecha Ejecución"><input type="date" style={IS} value={toInputDate(form.fechaEjecucion)} onChange={e=>set("fechaEjecucion",toDisplayDate(e.target.value))}/></Field>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:14}}>
        <Field label="Descripción"><textarea style={{...IS,minHeight:70,resize:"vertical",whiteSpace:"pre-wrap",overflowWrap:"anywhere"}} value={form.descripcion} onChange={e=>set("descripcion",e.target.value)} placeholder="Descripción del escenario"/></Field>
        <Field label="Pasos"><textarea style={{...IS,minHeight:90,resize:"vertical"}} value={form.pasos} onChange={e=>set("pasos",e.target.value)} placeholder="1. Paso uno&#10;2. Paso dos"/></Field>
        <Field label="Resultado Esperado"><textarea style={{...IS,minHeight:60,resize:"vertical"}} value={form.resultado} onChange={e=>set("resultado",e.target.value)} placeholder="El sistema debe..."/></Field>
        <Field label="Adjuntos (imágenes, Word, PDF)"><AttachmentZone attachments={form.attachments||[]} onChange={v=>set("attachments",v)}/></Field>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:8}}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={()=>{if(!form.escenario.trim())return alert("El escenario es requerido");onSave(form);}}>💾 Guardar</Btn>
      </div>
    </Modal>
  );
}

function IssueFormModal({initial,issueId,testIds,onSave,onClose,darkMode}) {
  const [form,setForm]=useState({ ...EMPTY_ISSUE, ...(initial||{}), fechaCreacion: initial?.fechaCreacion || today(), fechaSolucion: initial?.fechaSolucion || "" });
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const IS=darkMode?inputStyleDark:inputStyle;
  return (
    <Modal onClose={onClose} wide preventOutsideClose>
      <ModalHeader title={initial?`Editar Issue #${issueId}`:"Nuevo Issue"} sub="Registra la novedad encontrada" onClose={onClose}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <Field label="Caso de Prueba">
          <select style={{...IS,minHeight:44}} value={form.testId} onChange={e=>set("testId",e.target.value)}>
            <option value="">-- Seleccionar --</option>
            {testIds.map(id=><option key={id} value={id}>{id}</option>)}
          </select>
        </Field>
        <Field label="Módulo"><input style={{...IS,minHeight:44}} value={form.modulo} onChange={e=>set("modulo",e.target.value)} placeholder="Compras a pagos"/></Field>
        <Field label="Escenario"><textarea style={{...IS,minHeight:120,resize:"vertical",whiteSpace:"pre-wrap",overflowWrap:"anywhere"}} value={form.escenario} onChange={e=>set("escenario",e.target.value)} placeholder="Nombre del escenario"/></Field>
        <Field label="Descripción de la novedad"><textarea style={{...IS,minHeight:90,resize:"vertical",whiteSpace:"pre-wrap",overflowWrap:"anywhere"}} value={form.formulario} onChange={e=>set("formulario",e.target.value)} placeholder="Descripción de la novedad"/></Field>
        <Field label="Estado">
          <select style={{...IS,minHeight:44}} value={form.estado} onChange={e=>set("estado",e.target.value)}>
            {Object.keys(issueStatusConfig).map(k=><option key={k} value={k}>{k}</option>)}
          </select>
        </Field>
        <Field label="Severidad">
          <select style={{...IS,minHeight:44}} value={form.severidad} onChange={e=>set("severidad",e.target.value)}>
            {Object.keys(severityConfig).map(k=><option key={k} value={k}>{k}</option>)}
          </select>
        </Field>
        <Field label="Prioridad">
          <select style={{...IS,minHeight:44}} value={form.prioridad} onChange={e=>set("prioridad",e.target.value)}>
            {["Critical","High","Medium","Low"].map(k=><option key={k} value={k}>{k}</option>)}
          </select>
        </Field>
        <Field label="Fecha Creación">
          <input type="date" style={{...IS,minHeight:44}} value={toInputDate(form.fechaCreacion)} onChange={e=>set("fechaCreacion",toDisplayDate(e.target.value))}/>
        </Field>
        <Field label="Fecha Solución">
          <input type="date" style={{...IS,minHeight:44}} value={toInputDate(form.fechaSolucion)} onChange={e=>set("fechaSolucion",toDisplayDate(e.target.value))}/>
        </Field>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:14}}>
        <Field label="Observación"><textarea style={{...IS,minHeight:220,resize:"vertical",whiteSpace:"pre-wrap",overflowWrap:"anywhere"}} value={form.observacion} onChange={e=>set("observacion",e.target.value)} placeholder="Describe la novedad..."/></Field>
        <Field label="Adjuntos – imágenes, Word, PDF"><AttachmentZone attachments={form.attachments||[]} onChange={v=>set("attachments",v)}/></Field>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:8}}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={()=>{if(!form.observacion.trim())return alert("La observación es requerida");onSave(form);}}>💾 Guardar</Btn>
      </div>
    </Modal>
  );
}

function ObservationModal({tc,initialText,onClose,onSave,darkMode}) {
  const [text,setText]=useState(initialText||"");
  const IS=darkMode?inputStyleDark:inputStyle;
  return (
    <Modal onClose={onClose} preventOutsideClose>
      <ModalHeader title={`Observación ${tc.id}`} sub={tc.escenario} onClose={onClose}/>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <Field label="Escribe tu observación">
          <textarea style={{...IS,minHeight:180,resize:"vertical",whiteSpace:"pre-wrap",overflowWrap:"anywhere"}} value={text} onChange={e=>setText(e.target.value)} placeholder="Ingresa la observación aquí..."/>
        </Field>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn disabled={!text.trim()} onClick={()=>onSave(text.trim())}>Guardar</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ─── TC DETAIL MODAL ──────────────────────────────────────────────────────────
function TcDetailModal({tc,onClose,onEdit,onDelete,onDuplicate,onAddComment}) {
  const sc=statusConfig[tc.estado]||statusConfig["No ejecutado"];
  const [comment,setComment]=useState("");
  return (
    <Modal onClose={onClose} wide>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <div style={{fontFamily:"monospace",fontSize:12,color:BRAND,fontWeight:700,marginBottom:4}}>{tc.id}</div>
          <h3 style={{margin:0,fontSize:17,fontWeight:800,color:"#1a1a1a"}}>{tc.descripcion}</h3>
        </div>
        <div style={{display:"flex",gap:7,flexWrap:"wrap",justifyContent:"flex-end"}}>
          <Btn small onClick={onEdit}>✏️ Editar</Btn>
          <Btn small variant="ghost" onClick={onDuplicate}>📋 Duplicar</Btn>
          <Btn small danger onClick={onDelete}>🗑️</Btn>
          <button onClick={onClose} style={{background:"#f0f0f0",border:"none",borderRadius:8,padding:"5px 11px",cursor:"pointer",fontSize:17}}>✕</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:11,marginBottom:14}}>
        {[["Área",tc.area],["Proceso",tc.proceso],["Escenario",tc.escenario],["Asignado a",tc.asignadoA||"—"],["Fecha Aprob.",tc.fechaAprobacion||"—"],["Fecha Ejec.",tc.fechaEjecucion||"—"]].map(([l,v])=>(
          <div key={l} style={{background:"#f8f8f8",borderRadius:8,padding:"9px 12px"}}>
            <div style={{fontSize:10,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:3}}>{l}</div>
            <div style={{fontSize:13,color:"#333",fontWeight:600}}>{v}</div>
          </div>
        ))}
        <div style={{background:"#f8f8f8",borderRadius:8,padding:"9px 12px"}}>
          <div style={{fontSize:10,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:5}}>Estado</div>
          <Badge label={tc.estado} color={sc.color} bg={sc.bg}/>
        </div>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:7}}>Pasos</div>
        <div style={{background:"#f8f8f8",borderRadius:8,padding:14,fontSize:13,color:"#444",lineHeight:1.75,whiteSpace:"pre-line"}}>{tc.pasos}</div>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:7}}>Resultado Esperado</div>
        <div style={{background:"#EAFAF1",borderRadius:8,padding:14,fontSize:13,color:"#1E8449",lineHeight:1.75,borderLeft:"3px solid #27AE60"}}>{tc.resultado}</div>
      </div>
      {/* Historial */}
      {(tc.historial||[]).length>0&&(
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:7}}>Historial de Cambios</div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {[...tc.historial].reverse().map((h,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"center",fontSize:12,color:"#666",background:"#f9f9f9",borderRadius:6,padding:"6px 10px"}}>
                <span style={{fontFamily:"monospace",fontSize:10,color:"#bbb",whiteSpace:"nowrap"}}>{h.fecha}</span>
                <span style={{color:"#E74C3C"}}>{h.de}</span>
                <span style={{color:"#aaa"}}>→</span>
                <span style={{color:"#27AE60",fontWeight:700}}>{h.a}</span>
                {h.nota&&<span style={{color:"#aaa",marginLeft:4}}>· {h.nota}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Comentarios */}
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:7}}>Comentarios</div>
        {(tc.comentarios||[]).length===0&&<div style={{fontSize:12,color:"#ccc",marginBottom:8}}>Sin comentarios aún</div>}
        {(tc.comentarios||[]).map((c,i)=>(
          <div key={i} style={{background:"#f8f8f8",borderRadius:8,padding:"8px 12px",marginBottom:6,fontSize:12,color:"#555"}}>
            <span style={{fontFamily:"monospace",fontSize:10,color:"#bbb",marginRight:8}}>{c.fecha}</span>{c.texto}
          </div>
        ))}
        <div style={{display:"flex",gap:8,marginTop:8}}>
          <input value={comment} onChange={e=>setComment(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&comment.trim()){onAddComment(tc.id,comment.trim());setComment("");}}} placeholder="Escribe un comentario y presiona Enter..." style={{...inputStyle,flex:1,padding:"7px 12px"}}/>
          <Btn small onClick={()=>{if(comment.trim()){onAddComment(tc.id,comment.trim());setComment("");}}} disabled={!comment.trim()}>Agregar</Btn>
        </div>
      </div>
      <div>
        <div style={{fontSize:11,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:8}}>Adjuntos</div>
        <AttachmentViewer attachments={tc.attachments}/>
      </div>
    </Modal>
  );
}

// ─── ISSUE DETAIL MODAL ───────────────────────────────────────────────────────
function IssueDetailModal({issue,onClose,onEdit,onDelete}) {
  const sc=issueStatusConfig[issue.estado]||issueStatusConfig["Open"];
  const sev=severityConfig[issue.severidad]||"#888";
  return (
    <Modal onClose={onClose} wide>
      <ModalHeader title={issue.escenario} sub={`Issue #${issue.id} · ${issue.testId}`} onClose={onClose}/>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,flexWrap:"wrap",marginBottom:20}}>
        <Btn small onClick={onEdit}>✏️ Editar</Btn>
        <Btn small danger onClick={onDelete}>🗑️</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:11,marginBottom:14}}>
        {[ ["Módulo",issue.modulo],["Descripción de la novedad",issue.formulario],["Fecha Creación",issue.fechaCreacion || "—"], ["Fecha Solución",issue.fechaSolucion || "—"] ].map(([l,v])=>(
          <div key={l} style={{background:"#f8f8f8",borderRadius:8,padding:"9px 12px"}}>
            <div style={{fontSize:10,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:3}}>{l}</div>
            <div style={{fontSize:12,color:"#333",fontWeight:600}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        <Badge label={issue.estado} color={sc.color} bg={sc.bg}/>
        <Badge label={`Severidad: ${issue.severidad}`} color={sev} bg={sev+"15"}/>
        <Badge label={`Prioridad: ${issue.prioridad}`} color="#555" bg="#f0f0f0"/>
      </div>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:11,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:7}}>Observación</div>
        <div style={{background:"#FEF9E7",borderRadius:8,padding:14,fontSize:13,color:"#555",lineHeight:1.8,borderLeft:"3px solid #F39C12"}}>{issue.observacion}</div>
      </div>
      <div>
        <div style={{fontSize:11,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:8}}>Adjuntos</div>
        <AttachmentViewer attachments={issue.attachments}/>
      </div>
    </Modal>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [projects,setProjects]=useState(()=>{
    try{
      const s=localStorage.getItem("pana_projects");
      if(!s) return seedProjects;
      const parsed=JSON.parse(s);
      // Migración: asegurar que todos los ciclos tengan ejecuciones
      return parsed.map(p=>({
        ...p,
        ciclos:(p.ciclos||[]).map(c=>({
          ...c,
          ejecuciones:c.ejecuciones||[]
        }))
      }));
    }catch{return seedProjects;}
  });
  const [activeProjectId,setActiveProjectId]=useState(()=>{try{return localStorage.getItem("pana_active_project")||seedProjects[0].id;}catch{return seedProjects[0].id;}});
  const [tab,setTab]=useState("dashboard");
  const [filterEstado,setFilterEstado]=useState("Todos");
  const [filterIssueEstado,setFilterIssueEstado]=useState("Todos");
  const [filterAsignado,setFilterAsignado]=useState("Todos");
  const [filterProceso,setFilterProceso]=useState("Todos");
  const [filterModulo,setFilterModulo]=useState("Todos");
  const [filterFechaDesde,setFilterFechaDesde]=useState("");
  const [filterFechaHasta,setFilterFechaHasta]=useState("");
  const [search,setSearch]=useState("");
  const [darkMode,setDarkMode]=useState(()=>{try{return localStorage.getItem("pana_dark")==="1";}catch{return false;}});
  const [sidebarOpen,setSidebarOpen]=useState(()=>{try{return localStorage.getItem("pana_sidebar")!=="0";}catch{return true;}});
  const [showProjForm,setShowProjForm]=useState(false);
  const [editProj,setEditProj]=useState(null);
  const [showTcForm,setShowTcForm]=useState(false);
  const [editTc,setEditTc]=useState(null);
  const [viewTc,setViewTc]=useState(null);
  const [observationTc,setObservationTc]=useState(null);
  const [showIssueForm,setShowIssueForm]=useState(false);
  const [editIssue,setEditIssue]=useState(null);
  const [viewIssue,setViewIssue]=useState(null);
  const [showCicloForm,setShowCicloForm]=useState(false);
  const [editCiclo,setEditCiclo]=useState(null);
  const [expandedCiclos,setExpandedCiclos]=useState({});
  const [showJira,setShowJira]=useState(false);
  const [confirmDelete,setConfirmDelete]=useState(null);
  const [storageWarn,setStorageWarn]=useState(false);
  const dragIndex=useRef(null);
  const dragOverIndex=useRef(null);
  const dragIssueIndex=useRef(null);
  const dragOverIssueIndex=useRef(null);
  const importRef=useRef();

  useEffect(()=>{try{localStorage.setItem("pana_projects",JSON.stringify(projects));const mb=parseFloat(storageUsedMB());setStorageWarn(mb>3.5);}catch{};},[projects]);
  useEffect(()=>{try{localStorage.setItem("pana_active_project",activeProjectId);}catch{};},[activeProjectId]);
  useEffect(()=>{try{localStorage.setItem("pana_dark",darkMode?"1":"0");}catch{};},[darkMode]);
  useEffect(()=>{try{localStorage.setItem("pana_sidebar",sidebarOpen?"1":"0");}catch{};},[sidebarOpen]);

  // dark mode css vars
  useEffect(()=>{
    document.body.style.background=darkMode?"#111":"#F8F9FA";
    document.body.style.colorScheme=darkMode?"dark":"light";
  },[darkMode]);

  const DM={
    bg: darkMode?"#111":"#F8F9FA",
    card: darkMode?"#1C1C1E":"#fff",
    cardBorder: darkMode?"#2a2a2a":"#f0f0f0",
    text: darkMode?"#eee":"#1a1a1a",
    sub: darkMode?"#888":"#aaa",
    tableRow0: darkMode?"#1C1C1E":"#fff",
    tableRow1: darkMode?"#232323":"#FAFAFA",
    tableHover: darkMode?"#2a2a2a":BRAND_LIGHT,
    sidebar: darkMode?"#0D0D0D":"#1C1C1E",
  };

  const proj=useMemo(()=>projects.find(p=>p.id===activeProjectId),[projects,activeProjectId]);

  // project CRUD
  function saveProject(form){
    if(editProj){setProjects(ps=>ps.map(p=>p.id===editProj.id?{...p,...form}:p));setEditProj(null);}
    else{const np={id:`proj-${Date.now()}`,createdAt:today(),tests:[],issues:[],...form};setProjects(ps=>[...ps,np]);setActiveProjectId(np.id);}
    setShowProjForm(false);
  }
  function deleteProject(id){const r=projects.filter(p=>p.id!==id);setProjects(r);setActiveProjectId(r[0]?.id||null);setConfirmDelete(null);}

  // TC CRUD
  function saveTC(form){
    const prevEstado=editTc?.estado;
    const newEstado=form.estado;
    const histEntry=(prevEstado&&prevEstado!==newEstado)?{fecha:today(),de:prevEstado,a:newEstado,nota:""}:null;
    setProjects(ps=>ps.map(p=>{
      if(p.id!==activeProjectId)return p;
      if(editTc){
        return{...p,tests:p.tests.map(t=>t.id===editTc.id?{...t,...form,historial:histEntry?[...(t.historial||[]),histEntry]:(t.historial||[])}:t)};
      }else{
        const newId=nextTcId(p.tests);
        return{...p,tests:[...p.tests,{id:newId,...form,historial:[{fecha:today(),de:"—",a:form.estado,nota:"Creado"}],comentarios:[]}]};
      }
    }));
    setShowTcForm(false);setEditTc(null);setViewTc(null);
  }
  function deleteTC(id){setProjects(ps=>ps.map(p=>p.id!==activeProjectId?p:{...p,tests:p.tests.filter(t=>t.id!==id)}));setViewTc(null);setConfirmDelete(null);}
  function duplicateTC(tc){
    setProjects(ps=>ps.map(p=>{
      if(p.id!==activeProjectId)return p;
      const newId=nextTcId(p.tests);
      return{...p,tests:[...p.tests,{...tc,id:newId,escenario:tc.escenario+" (copia)",historial:[{fecha:today(),de:"—",a:tc.estado,nota:"Duplicado de "+tc.id}],comentarios:[]}]};
    }));
    setViewTc(null);
  }
  function updateTCStatus(id,estado){
    setProjects(ps=>ps.map(p=>{
      if(p.id!==activeProjectId)return p;
      return{...p,tests:p.tests.map(t=>{
        if(t.id!==id)return t;
        const entry={fecha:today(),de:t.estado,a:estado,nota:""};
        return{...t,estado,historial:[...(t.historial||[]),entry]};
      })};
    }));
  }
  function addComment(tcId,texto){
    setProjects(ps=>ps.map(p=>{
      if(p.id!==activeProjectId)return p;
      return{...p,tests:p.tests.map(t=>t.id!==tcId?t:{...t,comentarios:[...(t.comentarios||[]),{fecha:today(),texto}]})};
    }));
    if(viewTc){setViewTc(prev=>({...prev,comentarios:[...(prev.comentarios||[]),{fecha:today(),texto}]}));}
  }
  function reorderTests(from,to){
    setProjects(ps=>ps.map(p=>{
      if(p.id!==activeProjectId)return p;
      const arr=[...p.tests];const[m]=arr.splice(from,1);arr.splice(to,0,m);return{...p,tests:arr};
    }));
  }
  function reorderIssues(from,to){
    setProjects(ps=>ps.map(p=>{
      if(p.id!==activeProjectId)return p;
      const arr=[...p.issues];const[m]=arr.splice(from,1);arr.splice(to,0,m);return{...p,issues:arr};
    }));
  }

  // Issue CRUD
  function saveIssue(form){
    setProjects(ps=>ps.map(p=>{
      if(p.id!==activeProjectId)return p;
      if(editIssue){return{...p,issues:p.issues.map(i=>i.id===editIssue.id?{...i,...form}:i)};}
      else{const newId=(p.issues.length?Math.max(...p.issues.map(i=>i.id)):0)+1;return{...p,issues:[...p.issues,{id:newId,...form}]};}
    }));
    setShowIssueForm(false);setEditIssue(null);setViewIssue(null);
  }
  function deleteIssue(id){setProjects(ps=>ps.map(p=>p.id!==activeProjectId?p:{...p,issues:p.issues.filter(i=>i.id!==id)}));setViewIssue(null);setConfirmDelete(null);}

  // Ciclo CRUD
  function saveCiclo(form){
    setProjects(ps=>ps.map(p=>{
      if(p.id!==activeProjectId)return p;
      const ciclos=p.ciclos||[];
      if(editCiclo){return{...p,ciclos:ciclos.map(c=>c.id===editCiclo.id?{...c,...form}:c)};}
      else{const newId=`ciclo-${Date.now()}`;return{...p,ciclos:[...ciclos,{id:newId,ejecuciones:[],...form}]};}
    }));
    setShowCicloForm(false);setEditCiclo(null);
  }
  function deleteCiclo(id){
    setProjects(ps=>ps.map(p=>p.id!==activeProjectId?p:{...p,ciclos:(p.ciclos||[]).filter(c=>c.id!==id)}));
    setConfirmDelete(null);
  }
  // Agregar TC a ciclo
  function addTcToCiclo(cicloId, tcId){
    setProjects(ps=>ps.map(p=>{
      if(p.id!==activeProjectId)return p;
      return{...p,ciclos:(p.ciclos||[]).map(c=>{
        if(c.id!==cicloId)return c;
        const ejecs=c.ejecuciones||[];
        if(ejecs.find(e=>e.tcId===tcId))return c;
        return{...c,ejecuciones:[...ejecs,{tcId,estado:"No ejecutado",fechaEjecucion:"",nota:""}]};
      })};
    }));
  }
  // Remover TC de ciclo
  function removeTcFromCiclo(cicloId, tcId){
    setProjects(ps=>ps.map(p=>{
      if(p.id!==activeProjectId)return p;
      return{...p,ciclos:(p.ciclos||[]).map(c=>c.id!==cicloId?c:{...c,ejecuciones:(c.ejecuciones||[]).filter(e=>e.tcId!==tcId)})};
    }));
  }
  // Actualizar estado de ejecución en ciclo
  function updateEjecucionEstado(cicloId, tcId, estado, nota=""){
    setProjects(ps=>ps.map(p=>{
      if(p.id!==activeProjectId)return p;
      return{...p,ciclos:(p.ciclos||[]).map(c=>{
        if(c.id!==cicloId)return c;
        return{...c,ejecuciones:(c.ejecuciones||[]).map(e=>e.tcId===tcId?{...e,estado,fechaEjecucion:estado!=="No ejecutado"?today():e.fechaEjecucion,nota}:e)};
      })};
    }));
  }
  // Promover fallidos a nuevo ciclo
  function promoverFallidos(cicloId){
    const ciclo=(proj.ciclos||[]).find(c=>c.id===cicloId);
    if(!ciclo)return;
    const ejecs=ciclo.ejecuciones||[];
    const fallidos=ejecs.filter(e=>e.estado==="Fallido");
    if(!fallidos.length){alert("No hay casos fallidos en este ciclo.");return;}
    const num=(proj.ciclos||[]).length+1;
    const newCiclo={
      id:`ciclo-${Date.now()}`,
      nombre:`Ciclo ${num}`,
      modulo:ciclo.modulo,
      fechaInicio:"",fechaFin:"",
      descripcion:`Re-ejecución de ${fallidos.length} caso(s) fallidos del ${ciclo.nombre}`,
      ejecuciones:fallidos.map(e=>({tcId:e.tcId,estado:"No ejecutado",fechaEjecucion:"",nota:`Promovido desde ${ciclo.nombre}`}))
    };
    setProjects(ps=>ps.map(p=>p.id!==activeProjectId?p:{...p,ciclos:[...(p.ciclos||[]),newCiclo]}));
    alert(`✅ Ciclo ${num} creado con ${fallidos.length} caso(s) fallidos del ${ciclo.nombre}.`);
  }

  // Import CSV
  function handleJiraImport(tcs){
    const newTcs=tcs.map(tc=>({...tc,id:nextTcId([...proj.tests,...tcs.slice(0,tcs.indexOf(tc))])}));
    setProjects(ps=>ps.map(p=>p.id!==activeProjectId?p:{...p,tests:[...p.tests,...newTcs]}));
    setShowJira(false);
    alert(`✅ Se importaron ${newTcs.length} historia(s) de Jira como casos de prueba.`);
  }
  function handleImportCSV(e){
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{
      const imported=parseCSVImport(ev.target.result,proj.tests);
      if(!imported.length){alert("No se pudieron importar casos. Verifica el formato del archivo.");return;}
      setProjects(ps=>ps.map(p=>p.id!==activeProjectId?p:{...p,tests:[...p.tests,...imported]}));
      alert(`✅ Se importaron ${imported.length} caso(s) de prueba exitosamente.`);
    };
    reader.readAsText(file,"utf-8");
    e.target.value="";
  }

  if(!proj) return (
    <div style={{fontFamily:"'Poppins', 'Segoe UI', Arial, sans-serif",minHeight:"100vh",background:DM.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20}}>
      <div style={{fontSize:48}}>📂</div>
      <p style={{color:"#888"}}>No hay proyectos. Crea uno para comenzar.</p>
      <Btn onClick={()=>setShowProjForm(true)}>+ Nuevo Proyecto</Btn>
      {showProjForm&&<ProjectFormModal onSave={saveProject} onClose={()=>setShowProjForm(false)}/>}
    </div>
  );

  const tests=proj.tests;
  const issues=proj.issues;

  const asignadosList=useMemo(()=>{const s=new Set(tests.map(t=>t.asignadoA).filter(Boolean));return["Todos",...s];},[tests]);
  const procesosList=useMemo(()=>{const s=new Set(tests.map(t=>t.proceso).filter(Boolean));return["Todos",...s];},[tests]);
  const modulosList=useMemo(()=>{const s=new Set(issues.map(i=>i.modulo).filter(Boolean));return["Todos",...s];},[issues]);

  function parseDate(str){if(!str)return null;const[d,m,y]=str.split("/");return new Date(`${y}-${m}-${d}`);}

  const filteredTests=useMemo(()=>tests.filter(t=>{
    const mE=filterEstado==="Todos"||t.estado===filterEstado;
    const mS=!search||[t.id,t.escenario,t.proceso,t.area].join(" ").toLowerCase().includes(search.toLowerCase());
    const mA=filterAsignado==="Todos"||t.asignadoA===filterAsignado;
    const mP=filterProceso==="Todos"||t.proceso===filterProceso;
    const mD=!filterFechaDesde||!t.fechaEjecucion||(parseDate(t.fechaEjecucion)>=parseDate(filterFechaDesde));
    const mH=!filterFechaHasta||!t.fechaEjecucion||(parseDate(t.fechaEjecucion)<=parseDate(filterFechaHasta));
    return mE&&mS&&mA&&mP&&mD&&mH;
  }),[tests,filterEstado,search,filterAsignado,filterProceso,filterFechaDesde,filterFechaHasta]);

  const filteredIssues=useMemo(()=>issues.filter(i=>{
    const mE=filterIssueEstado==="Todos"||i.estado===filterIssueEstado;
    const mM=filterModulo==="Todos"||i.modulo===filterModulo;
    return mE&&mM;
  }),[issues,filterIssueEstado,filterModulo]);

  const filteredTestStats=useMemo(()=>{const c={};Object.keys(statusConfig).forEach(k=>c[k]=0);filteredTests.forEach(t=>{if(c[t.estado]!==undefined)c[t.estado]++;});return c;},[filteredTests]);
  const filteredIssueStats=useMemo(()=>({open:filteredIssues.filter(i=>i.estado==="Open").length,closed:filteredIssues.filter(i=>i.estado==="Closed").length,inProg:filteredIssues.filter(i=>i.estado==="In Progress").length,blocked:filteredIssues.filter(i=>i.estado==="Blocked").length,total:filteredIssues.length}),[filteredIssues]);

  const filteredTimelineData=useMemo(()=>{
    const map={};
    filteredTests.filter(t=>t.fechaEjecucion).forEach(t=>{map[t.fechaEjecucion]=(map[t.fechaEjecucion]||0)+1;});
    return Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0])).map(([d,v])=>({label:d.slice(0,5),value:v}));
  },[filteredTests]);

  const pct=(n,total=filteredTests.length)=>total?Math.round((n/total)*100):0;
  const execPct=pct(filteredTestStats["Aprobado"]+filteredTestStats["No aplica"]);

  // Stats per module (proceso field)
  const moduleStats=useMemo(()=>{
    const modules={};
    filteredTests.forEach(t=>{
      const mod=t.proceso||"Sin módulo";
      if(!modules[mod]) modules[mod]={total:0,aprobado:0,enProgreso:0,fallido:0,noEjecutado:0,noAplica:0,bloqueante:0};
      modules[mod].total++;
      if(t.estado==="Aprobado") modules[mod].aprobado++;
      else if(t.estado==="En Progreso") modules[mod].enProgreso++;
      else if(t.estado==="Fallido") modules[mod].fallido++;
      else if(t.estado==="No ejecutado") modules[mod].noEjecutado++;
      else if(t.estado==="No aplica") modules[mod].noAplica++;
      else if(t.estado==="Bloqueante") modules[mod].bloqueante++;
    });
    return modules;
  },[filteredTests]);
  const tabs=[{id:"dashboard",label:"📊 Dashboard"},{id:"tests",label:"🧪 Casos de Prueba"},{id:"ciclos",label:"🔄 Ciclos"},{id:"issues",label:"🐛 Issues"}];

  return (
    <div style={{fontFamily:"'Poppins', 'Segoe UI', Arial, sans-serif",background:DM.bg,minHeight:"100vh",color:DM.text,letterSpacing:"0.2px"}}>
      <input ref={importRef} type="file" accept=".csv" style={{display:"none"}} onChange={handleImportCSV}/>

      {storageWarn&&(
        <div style={{background:"#FEF9E7",borderBottom:"2px solid #F39C12",padding:"8px 28px",fontSize:12,color:"#7D6608",display:"flex",alignItems:"center",gap:10}}>
          ⚠️ <strong>Almacenamiento al {storageUsedMB()} MB / ~5 MB.</strong> Considera eliminar adjuntos antiguos para liberar espacio.
          <button onClick={()=>setStorageWarn(false)} style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",fontSize:16}}>✕</button>
        </div>
      )}

      <div style={{display:"flex",minHeight:"100vh"}}>
        {/* SIDEBAR */}
        <div style={{width:sidebarOpen?220:0,minWidth:sidebarOpen?220:0,background:DM.sidebar,display:"flex",flexDirection:"column",flexShrink:0,overflow:"hidden",transition:"width 0.25s ease, min-width 0.25s ease",position:"relative"}}>
          <div style={{width:220,display:"flex",flexDirection:"column",height:"100%"}}>
          <div style={{padding:"18px 16px 10px",borderBottom:"1px solid #333",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{background:BRAND,color:"#fff",fontWeight:900,fontSize:11,padding:"4px 10px",borderRadius:5,letterSpacing:"0.07em",display:"inline-block",marginBottom:8}}>CESAR RODRIGUEZ</div>
              <div style={{fontSize:12,color:"#888"}}>Gestión de Pruebas</div>
            </div>
          </div>
          <div style={{padding:"12px 10px 6px",fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700}}>Proyectos</div>
          <div style={{flex:1,overflowY:"auto"}}>
            {projects.map(p=>(
              <div key={p.id} onClick={()=>{setActiveProjectId(p.id);setTab("dashboard");}}
                style={{padding:"9px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,borderRadius:8,margin:"2px 6px",background:p.id===activeProjectId?"#2C2C2E":"transparent",transition:"background 0.15s"}}
                onMouseEnter={e=>{if(p.id!==activeProjectId)e.currentTarget.style.background="#252525";}}
                onMouseLeave={e=>{if(p.id!==activeProjectId)e.currentTarget.style.background="transparent";}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:p.color,flexShrink:0}}/>
                <div style={{flex:1,overflow:"hidden"}}>
                  <div style={{fontSize:12,color:p.id===activeProjectId?"#fff":"#bbb",fontWeight:p.id===activeProjectId?700:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                  <div style={{fontSize:10,color:"#555"}}>{p.tests.length} TCs · {p.issues.length} issues</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{padding:"10px 10px 16px",borderTop:"1px solid #2a2a2a",display:"flex",flexDirection:"column",gap:5}}>
            <button onClick={()=>{setShowProjForm(true);setEditProj(null);}} style={{background:"#2C2C2E",border:"1px dashed #444",borderRadius:8,color:"#aaa",padding:"8px 0",cursor:"pointer",fontSize:12,width:"100%"}}>+ Nuevo Proyecto</button>
            <button onClick={()=>{setEditProj(proj);setShowProjForm(true);}} style={{background:"none",border:"none",color:"#666",fontSize:11,cursor:"pointer",padding:"4px 0"}}>✏️ Editar proyecto</button>
            <button onClick={()=>setConfirmDelete({type:"project",id:proj.id})} style={{background:"none",border:"none",color:"#6B2020",fontSize:11,cursor:"pointer",padding:"4px 0"}}>🗑️ Eliminar proyecto</button>
            <button onClick={()=>setDarkMode(d=>!d)} style={{background:"none",border:"none",color:"#666",fontSize:11,cursor:"pointer",padding:"4px 0",marginTop:4}}>{darkMode?"☀️ Modo claro":"🌙 Modo oscuro"}</button>
            <div style={{fontSize:10,color:"#444",marginTop:4}}>💾 {storageUsedMB()} MB usado</div>
          </div>
          </div>
        </div>

        {/* TOGGLE SIDEBAR BUTTON */}
        <button onClick={()=>setSidebarOpen(o=>!o)} title={sidebarOpen?"Ocultar panel":"Mostrar panel"}
          style={{position:"fixed",left:sidebarOpen?212:4,top:"50%",transform:"translateY(-50%)",zIndex:300,background:BRAND,border:"2px solid #fff",borderRadius:"0 10px 10px 0",color:"#fff",cursor:"pointer",padding:"12px 7px",fontSize:16,transition:"left 0.25s ease",lineHeight:1,boxShadow:"2px 0 8px #00000040"}}>
          {sidebarOpen?"◀":"▶"}
        </button>

        {/* MAIN */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {/* topbar */}
          <div style={{background:DM.card,borderBottom:`1px solid ${DM.cardBorder}`,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:proj.color}}/>
              <span style={{fontSize:15,fontWeight:800,color:DM.text}}>{proj.name}</span>
              <span style={{fontSize:12,color:DM.sub,marginLeft:4}}>{proj.description}</span>
            </div>
            <div style={{display:"flex",gap:2}}>
              {tabs.map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)} style={{background:tab===t.id?DM.bg:"transparent",color:tab===t.id?DM.text:DM.sub,border:"none",padding:"14px 18px",cursor:"pointer",fontSize:13,fontWeight:tab===t.id?700:400,borderBottom:tab===t.id?`3px solid ${proj.color}`:"3px solid transparent",transition:"all 0.2s"}}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{flex:1,overflowY:"auto",padding:"24px 28px"}}>

            {/* ── DASHBOARD ── */}
            {tab==="dashboard"&&(
              <div style={{display:"flex",flexDirection:"column",gap:22}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                  <div>
                    <h2 style={{margin:0,fontSize:20,fontWeight:800,color:DM.text}}>Control del Día</h2>
                    <p style={{margin:"3px 0 0",color:DM.sub,fontSize:12}}>Resumen general · {proj.name}</p>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:7,alignItems:"flex-end"}}>
                    <div style={{display:"flex",gap:8}}>
                      <Btn small onClick={()=>{setEditTc(null);setShowTcForm(true);}}>+ TC</Btn>
                      <Btn small variant="ghost" onClick={()=>{setEditIssue(null);setShowIssueForm(true);}}>+ Issue</Btn>
                      <Btn small variant="ghost" onClick={()=>exportToCSV(proj, filteredTests)}>⬇ TCs CSV</Btn>
                      <Btn small variant="ghost" onClick={()=>exportIssuesToCSV(proj, filteredIssues)}>⬇ Issues CSV</Btn>
                    </div>
                    <Btn small onClick={()=>exportDashboardPDF(proj, filteredTests, filteredIssues)} style={{background:"#2980B9",color:"#fff",width:"100%"}}>📄 Descargar PDF Dashboard</Btn>
                  </div>
                </div>

                {/* Semáforo */}
                <div style={{background:DM.card,borderRadius:14,padding:20,border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000000a"}}>
                  <Semaforo pct={execPct}/>
                </div>

                {/* stat chips */}
                <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                  {[{label:"Total",value:filteredTests.length,color:DM.text},{label:"Aprobado",value:filteredTestStats["Aprobado"],color:"#27AE60"},{label:"En Progreso",value:filteredTestStats["En Progreso"],color:"#F39C12"},{label:"Fallido",value:filteredTestStats["Fallido"],color:"#E74C3C"},{label:"No ejecutado",value:filteredTestStats["No ejecutado"],color:"#95A5A6"},{label:"No aplica",value:filteredTestStats["No aplica"],color:"#BDC3C7"},{label:"Bloqueante",value:filteredTestStats["Bloqueante"],color:"#8E44AD"}].map(s=>( 
                    <div key={s.label} style={{background:DM.card,borderRadius:10,padding:"12px 16px",boxShadow:"0 1px 8px #0000000a",border:`1px solid ${DM.cardBorder}`,minWidth:90}}>
                      <div style={{fontSize:10,color:DM.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{s.label}</div>
                      <div style={{fontSize:28,fontWeight:800,color:s.color,lineHeight:1.1}}>{s.value}</div>
                      {filteredTests.length>0&&s.label!=="Total"&&(<div style={{marginTop:4,height:3,background:"#f0f0f0",borderRadius:2}}><div style={{width:`${pct(s.value)}%`,height:"100%",background:s.color,borderRadius:2}}/></div>)}
                    </div>
                  ))}
                </div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                  <div style={{background:DM.card,borderRadius:12,padding:20,border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000000a"}}>
                    <div style={{fontSize:13,fontWeight:700,color:DM.text,marginBottom:16}}>Distribución de Estados</div>
                    <Donut data={[{label:"Aprobado",value:filteredTestStats["Aprobado"],color:"#27AE60"},{label:"En Progreso",value:filteredTestStats["En Progreso"],color:"#F39C12"},{label:"Fallido",value:filteredTestStats["Fallido"],color:"#E74C3C"},{label:"No ejecutado",value:filteredTestStats["No ejecutado"],color:"#bbb"},{label:"No aplica",value:filteredTestStats["No aplica"],color:"#ddd"},{label:"Bloqueante",value:filteredTestStats["Bloqueante"],color:"#8E44AD"}]}/>
                  </div>
                  <div style={{background:DM.card,borderRadius:12,padding:20,border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000000a"}}>
                    <div style={{fontSize:13,fontWeight:700,color:DM.text,marginBottom:16}}>Test Plan Evolution</div>
                    {[{label:"Ejecutado (Aprobado + N/A)",value:pct(filteredTestStats["Aprobado"]+filteredTestStats["No aplica"]),color:"#27AE60"},{label:"En Progreso",value:pct(filteredTestStats["En Progreso"]),color:"#F39C12"},{label:"No ejecutado",value:pct(filteredTestStats["No ejecutado"]),color:"#95A5A6"},{label:"Fallido",value:pct(filteredTestStats["Fallido"]),color:"#E74C3C"}].map((r,i)=>(
                      <div key={i} style={{marginBottom:12}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:11,color:DM.sub}}>{r.label}</span><span style={{fontSize:11,fontWeight:700,color:r.color}}>{r.value}%</span></div>
                        <div style={{height:7,background:"#f0f0f0",borderRadius:4}}><div style={{width:`${r.value}%`,height:"100%",background:r.color,borderRadius:4,transition:"width 0.6s"}}/></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Línea de tiempo */}
                <div style={{background:DM.card,borderRadius:12,padding:20,border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000000a"}}>
                  <div style={{fontSize:13,fontWeight:700,color:DM.text,marginBottom:14}}>📈 Línea de Tiempo — TCs ejecutados por fecha</div>
                  <LineChart data={filteredTimelineData} color={proj.color}/>
                </div>

                {/* issues summary */}
                <div style={{background:DM.card,borderRadius:12,padding:20,border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000000a"}}>
                  <div style={{fontSize:13,fontWeight:700,color:DM.text,marginBottom:14}}>Resumen de Issues</div>
                  <div style={{display:"flex",alignItems:"center",gap:8,background:"#f4f4f4",border:"1px solid #e0e0e0",borderRadius:8,padding:"8px 16px",marginBottom:12}}>
                    <span style={{fontSize:12,color:"#555"}}>Total</span>
                    <span style={{fontSize:20,fontWeight:800,color:BRAND}}>{filteredIssueStats.total}</span>
                  </div>
                  <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                    {[{label:"Open",v:filteredIssueStats.open,c:"#E74C3C"},{label:"In Progress",v:filteredIssueStats.inProg,c:"#F39C12"},{label:"Closed",v:filteredIssueStats.closed,c:"#27AE60"},{label:"Blocked",v:filteredIssueStats.blocked,c:"#8E44AD"}].map(s=>(
                      <div key={s.label} style={{display:"flex",alignItems:"center",gap:8,background:s.c+"10",border:`1px solid ${s.c}30`,borderRadius:8,padding:"8px 16px"}}>
                        <div style={{width:10,height:10,borderRadius:"50%",background:s.c}}/><span style={{fontSize:12,color:"#555"}}>{s.label}</span><span style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Métricas por Módulo */}
                {Object.keys(moduleStats).length>0&&(
                  <div style={{background:DM.card,borderRadius:12,padding:20,border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000000a"}}>
                    <div style={{fontSize:13,fontWeight:700,color:DM.text,marginBottom:16}}>📦 Métricas por Módulo</div>
                    <div style={{display:"flex",flexDirection:"column",gap:14}}>
                      {Object.entries(moduleStats).map(([mod,m])=>{
                        const modExecPct=m.total?Math.round(((m.aprobado+m.noAplica)/m.total)*100):0;
                        const semC=modExecPct>=70?"#27AE60":modExecPct>=40?"#F39C12":"#E74C3C";
                        return(
                          <div key={mod} style={{border:`1px solid ${DM.cardBorder}`,borderRadius:10,overflow:"hidden"}}>
                            <div style={{background:DM.sidebar,padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                              <div style={{display:"flex",alignItems:"center",gap:10}}>
                                <div style={{width:10,height:10,borderRadius:"50%",background:semC,boxShadow:`0 0 6px ${semC}80`}}/>
                                <span style={{fontSize:13,fontWeight:700,color:"#eee"}}>{mod}</span>
                                <span style={{fontSize:11,color:"#666"}}>· {m.total} casos</span>
                              </div>
                              <div style={{display:"flex",alignItems:"center",gap:8}}>
                                <div style={{width:100,height:6,background:"#333",borderRadius:3}}>
                                  <div style={{width:`${modExecPct}%`,height:"100%",background:semC,borderRadius:3,transition:"width 0.6s"}}/>
                                </div>
                                <span style={{fontSize:12,fontWeight:800,color:semC,minWidth:36}}>{modExecPct}%</span>
                              </div>
                            </div>
                            {/* Module stats */}
                            <div style={{padding:"12px 16px",display:"flex",gap:10,flexWrap:"wrap"}}>
                              {[
                                {label:"Aprobado",value:m.aprobado,color:"#27AE60"},
                                {label:"En Progreso",value:m.enProgreso,color:"#F39C12"},
                                {label:"Fallido",value:m.fallido,color:"#E74C3C"},
                                {label:"No ejecutado",value:m.noEjecutado,color:"#95A5A6"},
                                {label:"No aplica",value:m.noAplica,color:"#BDC3C7"},
                                {label:"Bloqueante",value:m.bloqueante,color:"#8E44AD"},
                              ].filter(s=>s.value>0).map(s=>(
                                <div key={s.label} style={{display:"flex",alignItems:"center",gap:5,background:s.color+"15",border:`1px solid ${s.color}30`,borderRadius:8,padding:"5px 10px"}}>
                                  <div style={{width:7,height:7,borderRadius:"50%",background:s.color}}/>
                                  <span style={{fontSize:11,color:DM.sub}}>{s.label}</span>
                                  <span style={{fontSize:14,fontWeight:800,color:s.color}}>{s.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Estadísticas por Ciclo */}
                {(proj.ciclos||[]).length>0&&(
                  <div style={{background:DM.card,borderRadius:12,padding:20,border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000000a"}}>
                    <div style={{fontSize:13,fontWeight:700,color:DM.text,marginBottom:16}}>🔄 Estadísticas por Ciclo</div>
                    <div style={{display:"flex",flexDirection:"column",gap:12}}>
                      {(proj.ciclos||[]).map(ciclo=>{
                        const ejecs=(ciclo.ejecuciones||[]).filter(e=>filteredTests.some(t=>t.id===e.tcId));
                        const ap=ejecs.filter(e=>e.estado==="Aprobado").length;
                        const fa=ejecs.filter(e=>e.estado==="Fallido").length;
                        const ep=ejecs.filter(e=>e.estado==="En Progreso").length;
                        const ne=ejecs.filter(e=>e.estado==="No ejecutado").length;
                        const na=ejecs.filter(e=>e.estado==="No aplica").length;
                        const bl=ejecs.filter(e=>e.estado==="Bloqueante").length;
                        const cp=ejecs.length?Math.round(((ap+na)/ejecs.length)*100):0;
                        const cc=cp>=70?"#27AE60":cp>=40?"#F39C12":"#E74C3C";
                        return(
                          <div key={ciclo.id} style={{border:`1px solid ${DM.cardBorder}`,borderRadius:10,overflow:"hidden"}}>
                            {/* Ciclo header */}
                            <div style={{background:proj.color,padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                              <div style={{display:"flex",alignItems:"center",gap:10}}>
                                <span style={{fontSize:13,fontWeight:800,color:"#fff"}}>{ciclo.nombre}</span>
                                <span style={{fontSize:11,color:"rgba(255,255,255,0.75)"}}>📦 {ciclo.modulo}</span>
                                {ciclo.fechaInicio&&<span style={{fontSize:10,color:"rgba(255,255,255,0.6)"}}>📅 {ciclo.fechaInicio}{ciclo.fechaFin?` → ${ciclo.fechaFin}`:""}</span>}
                                <span style={{fontSize:10,background:"rgba(255,255,255,0.2)",color:"#fff",padding:"2px 7px",borderRadius:8,fontWeight:700}}>{ejecs.length} TCs</span>
                              </div>
                              <div style={{display:"flex",alignItems:"center",gap:8}}>
                                <div style={{width:100,height:5,background:"rgba(255,255,255,0.2)",borderRadius:3}}>
                                  <div style={{width:`${cp}%`,height:"100%",background:"#fff",borderRadius:3,transition:"width 0.6s"}}/>
                                </div>
                                <span style={{fontSize:13,fontWeight:800,color:"#fff"}}>{cp}%</span>
                              </div>
                            </div>
                            {/* Ciclo stats */}
                            {ejecs.length>0?(
                              <div style={{padding:"12px 16px"}}>
                                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
                                  {[
                                    {label:"Aprobado",value:ap,color:"#27AE60"},
                                    {label:"En Progreso",value:ep,color:"#F39C12"},
                                    {label:"Fallido",value:fa,color:"#E74C3C"},
                                    {label:"No ejecutado",value:ne,color:"#95A5A6"},
                                    {label:"No aplica",value:na,color:"#BDC3C7"},
                                    {label:"Bloqueante",value:bl,color:"#8E44AD"},
                                  ].filter(s=>s.value>0).map(s=>(
                                    <div key={s.label} style={{display:"flex",alignItems:"center",gap:5,background:s.color+"15",border:`1px solid ${s.color}30`,borderRadius:8,padding:"5px 10px"}}>
                                      <div style={{width:7,height:7,borderRadius:"50%",background:s.color}}/>
                                      <span style={{fontSize:11,color:DM.sub}}>{s.label}</span>
                                      <span style={{fontSize:14,fontWeight:800,color:s.color}}>{s.value}</span>
                                    </div>
                                  ))}
                                </div>
                                {/* Mini barra por estado */}
                                <div style={{display:"flex",height:8,borderRadius:4,overflow:"hidden",gap:1}}>
                                  {[
                                    {value:ap,color:"#27AE60"},
                                    {value:ep,color:"#F39C12"},
                                    {value:fa,color:"#E74C3C"},
                                    {value:ne,color:"#95A5A6"},
                                    {value:na,color:"#BDC3C7"},
                                    {value:bl,color:"#8E44AD"},
                                  ].filter(s=>s.value>0).map((s,i)=>(
                                    <div key={i} style={{flex:s.value,background:s.color,transition:"flex 0.6s"}}/>
                                  ))}
                                </div>
                                {fa>0&&(
                                  <div style={{marginTop:8,fontSize:11,color:"#E74C3C",fontWeight:600}}>
                                    ⚠️ {fa} caso(s) fallido(s) — considera promoverlos al siguiente ciclo
                                  </div>
                                )}
                              </div>
                            ):(
                              <div style={{padding:"12px 16px",fontSize:12,color:"#aaa"}}>Sin TCs asignados aún</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <button onClick={()=>setTab("ciclos")} style={{marginTop:14,background:"none",border:`1px solid ${DM.cardBorder}`,borderRadius:8,color:DM.sub,padding:"7px 16px",cursor:"pointer",fontSize:12,width:"100%"}}>
                      Ver detalle completo en pestaña Ciclos →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── CASOS DE PRUEBA ── */}
            {tab==="tests"&&(
              <div style={{display:"flex",flexDirection:"column",gap:18}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                  <div>
                    <h2 style={{margin:0,fontSize:20,fontWeight:800,color:DM.text}}>Casos de Prueba</h2>
                    <p style={{margin:"3px 0 0",color:DM.sub,fontSize:12}}>{filteredTests.length} casos · ⠿ arrastra para reordenar · clic para ver</p>
                  </div>
                  <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                    <Btn small onClick={()=>{setEditTc(null);setShowTcForm(true);}}>+ Nuevo TC</Btn>
                    <Btn small variant="ghost" onClick={()=>setShowJira(true)} style={{background:"#0052CC",color:"#fff"}}>🔗 Importar de Jira</Btn>
                    <Btn small variant="ghost" onClick={()=>importRef.current.click()}>⬆ Importar CSV</Btn>
                    <Btn small variant="ghost" onClick={()=>exportToCSV(proj, filteredTests)}>⬇ Exportar CSV</Btn>
                  </div>
                </div>
                {/* Filtros */}
                <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                  <input placeholder="🔍 Buscar..." value={search} onChange={e=>setSearch(e.target.value)} style={{...inputStyle,width:160,padding:"7px 12px",background:darkMode?"#2C2C2E":"#fff",color:DM.text,border:darkMode?"1px solid #444":"1px solid #e0e0e0"}}/>
                  <select value={filterEstado} onChange={e=>setFilterEstado(e.target.value)} style={{...inputStyle,width:150,padding:"7px 12px",background:darkMode?"#2C2C2E":"#fff",color:DM.text,border:darkMode?"1px solid #444":"1px solid #e0e0e0"}}>
                    <option value="Todos">Todos los estados</option>
                    {Object.keys(statusConfig).map(k=><option key={k} value={k}>{k}</option>)}
                  </select>
                  <select value={filterAsignado} onChange={e=>setFilterAsignado(e.target.value)} style={{...inputStyle,width:140,padding:"7px 12px",background:darkMode?"#2C2C2E":"#fff",color:DM.text,border:darkMode?"1px solid #444":"1px solid #e0e0e0"}}>
                    {asignadosList.map(a=><option key={a} value={a}>{a==="Todos"?"Todos los responsables":a}</option>)}
                  </select>
                  <select value={filterProceso} onChange={e=>setFilterProceso(e.target.value)} style={{...inputStyle,width:150,padding:"7px 12px",background:darkMode?"#2C2C2E":"#fff",color:DM.text,border:darkMode?"1px solid #444":"1px solid #e0e0e0"}}>
                    {procesosList.map(p=><option key={p} value={p}>{p==="Todos"?"Todos los procesos":p}</option>)}
                  </select>
                  {filterProceso!=="Todos"&&<button onClick={()=>setFilterProceso("Todos")} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#aaa"}}>✕ Proceso</button>}
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <span style={{fontSize:11,color:DM.sub}}>Ejec. desde</span>
                    <input type="date" value={filterFechaDesde} onChange={e=>setFilterFechaDesde(e.target.value)} style={{...inputStyle,width:130,padding:"7px 10px",background:darkMode?"#2C2C2E":"#fff",color:DM.text,border:darkMode?"1px solid #444":"1px solid #e0e0e0"}}/>
                    <span style={{fontSize:11,color:DM.sub}}>hasta</span>
                    <input type="date" value={filterFechaHasta} onChange={e=>setFilterFechaHasta(e.target.value)} style={{...inputStyle,width:130,padding:"7px 10px",background:darkMode?"#2C2C2E":"#fff",color:DM.text,border:darkMode?"1px solid #444":"1px solid #e0e0e0"}}/>
                    {(filterFechaDesde||filterFechaHasta)&&<button onClick={()=>{setFilterFechaDesde("");setFilterFechaHasta("");}} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"#aaa"}}>✕</button>}
                  </div>
                </div>
                <div style={{background:DM.card,borderRadius:12,overflow:"hidden",border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000000a"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                    <thead>
                      <tr style={{background:proj.color,color:"#fff"}}>
                        <th style={{padding:"11px 8px",width:24}}></th>
                        {["ID","Área","Módulo","Escenario","Descripción","Responsable","Aprob.","Ejec.","Estado","Adj.","Observación"].map(h=>(
                          <th key={h} style={{padding:"11px 13px",textAlign:"left",fontWeight:700,fontSize:10,letterSpacing:"0.06em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTests.length===0&&(<tr><td colSpan={12} style={{padding:32,textAlign:"center",color:"#bbb",fontSize:13}}>Sin resultados.</td></tr>)}
                      {filteredTests.map((t,i)=>{
                        const sc=statusConfig[t.estado]||statusConfig["No ejecutado"];
                        const realIndex=proj.tests.findIndex(x=>x.id===t.id);
                        return (
                          <tr key={t.id} draggable
                            onDragStart={()=>{dragIndex.current=realIndex;}}
                            onDragOver={e=>{e.preventDefault();dragOverIndex.current=realIndex;}}
                            onDrop={()=>{if(dragIndex.current!==null&&dragIndex.current!==dragOverIndex.current)reorderTests(dragIndex.current,dragOverIndex.current);dragIndex.current=null;dragOverIndex.current=null;}}
                            onClick={()=>setViewTc(t)}
                            style={{background:i%2===0?DM.tableRow0:DM.tableRow1,cursor:"pointer",borderBottom:`1px solid ${DM.cardBorder}`,transition:"background 0.12s"}}
                            onMouseEnter={e=>e.currentTarget.style.background=DM.tableHover}
                            onMouseLeave={e=>e.currentTarget.style.background=i%2===0?DM.tableRow0:DM.tableRow1}>
                            <td style={{padding:"9px 8px",textAlign:"center",color:"#ccc",cursor:"grab",fontSize:16}} onClick={e=>e.stopPropagation()} title="Arrastrar">⠿</td>
                            <td style={{padding:"9px 13px",fontWeight:700,color:proj.color,fontFamily:"monospace",whiteSpace:"nowrap"}}>{t.id}</td>
                            <td style={{padding:"9px 13px",color:DM.sub,whiteSpace:"nowrap"}}>{t.area}</td>
                            <td style={{padding:"9px 13px",color:DM.sub,whiteSpace:"nowrap"}}>{t.proceso}</td>
                            <td style={{padding:"9px 13px",fontWeight:700,color:darkMode?"#f4f7fb":DM.text,whiteSpace:"normal",wordBreak:"break-word",lineHeight:1.5,minWidth:220,maxWidth:320,letterSpacing:"0.1px",background:darkMode?"#202b3b":"#f7faff",borderRadius:8,border:darkMode?"1px solid #32445a":"1px solid #e8f0ff"}}>{t.escenario}</td>
                            <td style={{padding:"9px 13px",color:"#888",maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.descripcion}</td>
                            <td style={{padding:"9px 13px",color:DM.sub,whiteSpace:"nowrap",fontSize:12}}>{t.asignadoA||"—"}</td>
                            <td style={{padding:"9px 13px",color:"#999",fontFamily:"monospace",fontSize:11,whiteSpace:"nowrap"}}>{t.fechaAprobacion||"—"}</td>
                            <td style={{padding:"9px 13px",color:"#999",fontFamily:"monospace",fontSize:11,whiteSpace:"nowrap"}}>{t.fechaEjecucion||"—"}</td>
                            <td style={{padding:"9px 13px"}} onClick={e=>e.stopPropagation()}>
                              <select value={t.estado} onChange={e=>updateTCStatus(t.id,e.target.value)}
                                style={{border:`1px solid ${sc.color}50`,borderRadius:12,padding:"3px 8px",fontSize:11,fontWeight:700,color:sc.color,background:sc.bg,cursor:"pointer",outline:"none"}}>
                                {Object.keys(statusConfig).map(k=><option key={k} value={k}>{k}</option>)}
                              </select>
                            </td>
                            <td style={{padding:"9px 13px",textAlign:"center"}}>
                              {(t.attachments||[]).length>0&&<span style={{fontSize:12}} title={`${t.attachments.length} adjunto(s)`}>📎{t.attachments.length}</span>}
                              {(t.comentarios||[]).length>0&&<span style={{fontSize:12,marginLeft:4}} title={`${t.comentarios.length} comentario(s)`}>💬{t.comentarios.length}</span>}
                            </td>
                            <td style={{padding:"9px 13px"}} onClick={e=>e.stopPropagation()}>
                              <Btn small variant="ghost" onClick={e=>{e.stopPropagation();setObservationTc(t);}}>📝 Observación</Btn>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── CICLOS ── */}
            {tab==="ciclos"&&(()=>{
              const ciclos=proj.ciclos||[];
              return(
              <div style={{display:"flex",flexDirection:"column",gap:20}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                  <div>
                    <h2 style={{margin:0,fontSize:20,fontWeight:800,color:DM.text}}>Ciclos de Prueba</h2>
                    <p style={{margin:"3px 0 0",color:DM.sub,fontSize:12}}>{ciclos.length} ciclos · Trazabilidad completa por TC</p>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <Btn small variant="ghost" onClick={()=>setExpandedCiclos(ciclos.reduce((a,c)=>({...a,[c.id]:true}),{}))}>↕ Expandir todos</Btn>
                    <Btn small variant="ghost" onClick={()=>setExpandedCiclos({})}>↕ Colapsar todos</Btn>
                    <Btn onClick={()=>{setEditCiclo(null);setShowCicloForm(true);}}>+ Nuevo Ciclo</Btn>
                  </div>
                </div>

                {ciclos.length===0&&(
                  <div style={{background:DM.card,borderRadius:12,padding:48,textAlign:"center",border:`1px solid ${DM.cardBorder}`}}>
                    <div style={{fontSize:40,marginBottom:12}}>🔄</div>
                    <div style={{fontSize:14,color:"#888",marginBottom:16}}>No hay ciclos creados aún</div>
                    <Btn onClick={()=>{setEditCiclo(null);setShowCicloForm(true);}}>+ Crear primer ciclo</Btn>
                  </div>
                )}

                {ciclos.map(ciclo=>{
                  const isExpanded=expandedCiclos[ciclo.id]!==false; // default expanded
                  const ejecs=ciclo.ejecuciones||[];
                  const aprobados=ejecs.filter(e=>e.estado==="Aprobado").length;
                  const fallidos=ejecs.filter(e=>e.estado==="Fallido").length;
                  const enProgreso=ejecs.filter(e=>e.estado==="En Progreso").length;
                  const noEjec=ejecs.filter(e=>e.estado==="No ejecutado").length;
                  const noAplica=ejecs.filter(e=>e.estado==="No aplica").length;
                  const bloqueante=ejecs.filter(e=>e.estado==="Bloqueante").length;
                  const execPctC=ejecs.length?Math.round(((aprobados+noAplica)/ejecs.length)*100):0;
                  const semC=execPctC>=70?"#27AE60":execPctC>=40?"#F39C12":"#E74C3C";
                  // TCs disponibles para agregar (que no estén ya en este ciclo)
                  const tcsDisponibles=tests.filter(t=>!ejecs.find(e=>e.tcId===t.id));

                  return(
                    <div key={ciclo.id} style={{background:DM.card,borderRadius:14,border:`1px solid ${DM.cardBorder}`,overflow:"hidden",boxShadow:"0 2px 12px #0000000a"}}>
                      {/* Header */}
                      <div style={{background:proj.color,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                          <div style={{background:"rgba(255,255,255,0.2)",borderRadius:8,padding:"4px 12px",fontSize:13,fontWeight:800,color:"#fff"}}>{ciclo.nombre}</div>
                          <span style={{fontSize:12,color:"rgba(255,255,255,0.85)"}}>📦 {ciclo.modulo}</span>
                          {ciclo.fechaInicio&&<span style={{fontSize:11,color:"rgba(255,255,255,0.7)"}}>📅 {ciclo.fechaInicio} → {ciclo.fechaFin||"En curso"}</span>}
                          {ciclo.descripcion&&<span style={{fontSize:11,color:"rgba(255,255,255,0.6)",fontStyle:"italic"}}>"{ciclo.descripcion}"</span>}
                        </div>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          <div style={{width:80,height:5,background:"rgba(255,255,255,0.2)",borderRadius:3}}>
                            <div style={{width:`${execPctC}%`,height:"100%",background:"#fff",borderRadius:3}}/>
                          </div>
                          <span style={{fontSize:13,fontWeight:800,color:"#fff"}}>{execPctC}%</span>
                          {fallidos>0&&(
                            <button onClick={()=>promoverFallidos(ciclo.id)}
                              style={{background:"#E74C3C",border:"none",borderRadius:7,color:"#fff",padding:"5px 12px",cursor:"pointer",fontSize:12,fontWeight:700}}>
                              ⬆ Promover {fallidos} fallido(s) →
                            </button>
                          )}
                          <button onClick={()=>{setEditCiclo(ciclo);setShowCicloForm(true);}} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:6,color:"#fff",padding:"5px 10px",cursor:"pointer",fontSize:12}}>✏️ Editar</button>
                          <button onClick={()=>setConfirmDelete({type:"ciclo",id:ciclo.id})} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:6,color:"#fff",padding:"5px 8px",cursor:"pointer",fontSize:12}}>🗑️</button>
                          <button
                            onClick={()=>setExpandedCiclos(prev=>({...prev,[ciclo.id]:!isExpanded}))}
                            style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:6,color:"#fff",padding:"5px 12px",cursor:"pointer",fontSize:13,fontWeight:700,minWidth:36}}>
                            {isExpanded?"▲ Ocultar":"▼ Ver TCs"}
                          </button>
                        </div>
                      </div>

                      {/* Stats chips + table — colapsable */}
                      {isExpanded&&(<>
                      {/* Stats chips */}
                      <div style={{padding:"10px 20px",display:"flex",gap:8,flexWrap:"wrap",borderBottom:`1px solid ${DM.cardBorder}`,alignItems:"center"}}>
                        <span style={{fontSize:12,color:DM.sub}}><strong style={{color:DM.text}}>{ejecs.length}</strong> TCs</span>
                        {[{l:"Aprobado",v:aprobados,c:"#27AE60"},{l:"En Progreso",v:enProgreso,c:"#F39C12"},{l:"Fallido",v:fallidos,c:"#E74C3C"},{l:"No ejecutado",v:noEjec,c:"#95A5A6"},{l:"No aplica",v:noAplica,c:"#BDC3C7"},{l:"Bloqueante",v:bloqueante,c:"#8E44AD"}].filter(s=>s.v>0).map(s=>(
                          <div key={s.l} style={{display:"flex",alignItems:"center",gap:4,background:s.c+"15",border:`1px solid ${s.c}30`,borderRadius:7,padding:"3px 9px"}}>
                            <div style={{width:6,height:6,borderRadius:"50%",background:s.c}}/><span style={{fontSize:11,color:s.c,fontWeight:700}}>{s.v} {s.l}</span>
                          </div>
                        ))}
                        {/* Agregar TC al ciclo */}
                        {tcsDisponibles.length>0&&(
                          <div style={{marginLeft:"auto",display:"flex",gap:6,alignItems:"center"}}>
                            <select id={`add-tc-${ciclo.id}`} style={{...inputStyle,width:160,padding:"4px 8px",fontSize:11,background:darkMode?"#2C2C2E":"#fff",color:DM.text,border:darkMode?"1px solid #444":"1px solid #ddd"}}>
                              <option value="">+ Agregar TC...</option>
                              {tcsDisponibles.map(t=><option key={t.id} value={t.id}>{t.id} · {t.escenario.slice(0,25)}</option>)}
                            </select>
                            <button onClick={()=>{
                              const sel=document.getElementById(`add-tc-${ciclo.id}`);
                              if(sel.value){addTcToCiclo(ciclo.id,sel.value);sel.value="";}
                            }} style={{background:proj.color,border:"none",borderRadius:6,color:"#fff",padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:700}}>Agregar</button>
                          </div>
                        )}
                      </div>

                      {/* TCs table */}
                      {ejecs.length>0?(
                        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                          <thead>
                            <tr style={{background:darkMode?"#1a1a1a":"#f8f8f8"}}>
                              {["TC","Escenario","Módulo","Responsable","Fecha Ejec.","Estado en este ciclo","Nota",""].map(h=>(
                                <th key={h} style={{padding:"8px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:DM.sub,textTransform:"uppercase",letterSpacing:"0.05em",whiteSpace:"nowrap"}}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {ejecs.map((ejec)=>{
                              const tc=tests.find(t=>t.id===ejec.tcId);
                              if(!tc)return null;
                              const sc=statusConfig[ejec.estado]||statusConfig["No ejecutado"];
                              return(
                                <tr key={ejec.tcId} style={{borderTop:`1px solid ${DM.cardBorder}`,transition:"background 0.12s"}}
                                  onMouseEnter={e=>e.currentTarget.style.background=DM.tableHover}
                                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                                  <td style={{padding:"8px 14px",fontWeight:700,color:proj.color,fontFamily:"monospace",whiteSpace:"nowrap"}}>{tc.id}</td>
                                  <td style={{padding:"8px 14px",fontWeight:700,color:darkMode?"#f4f7fb":DM.text,whiteSpace:"normal",wordBreak:"break-word",lineHeight:1.5,minWidth:220,maxWidth:320,letterSpacing:"0.08px",background:darkMode?"#202b3b":"#f7faff",borderRadius:8,border:darkMode?"1px solid #32445a":"1px solid #e8f0ff"}}>{tc.escenario}</td>
                                  <td style={{padding:"8px 14px",color:DM.sub,fontSize:11}}>{tc.proceso}</td>
                                  <td style={{padding:"8px 14px",color:DM.sub,fontSize:11}}>{tc.asignadoA||"—"}</td>
                                  <td style={{padding:"8px 14px",color:DM.sub,fontFamily:"monospace",fontSize:11,whiteSpace:"nowrap"}}>{ejec.fechaEjecucion||"—"}</td>
                                  <td style={{padding:"8px 14px"}}>
                                    <select value={ejec.estado} onChange={e=>updateEjecucionEstado(ciclo.id,tc.id,e.target.value)}
                                      style={{border:`1px solid ${sc.color}50`,borderRadius:10,padding:"3px 8px",fontSize:11,fontWeight:700,color:sc.color,background:sc.bg,cursor:"pointer",outline:"none"}}>
                                      {Object.keys(statusConfig).map(k=><option key={k} value={k}>{k}</option>)}
                                    </select>
                                  </td>
                                  <td style={{padding:"8px 14px",color:DM.sub,fontSize:11,fontStyle:"italic"}}>{ejec.nota||""}</td>
                                  <td style={{padding:"8px 14px"}}>
                                    <button onClick={()=>removeTcFromCiclo(ciclo.id,tc.id)} title="Quitar del ciclo"
                                      style={{background:"none",border:"none",cursor:"pointer",color:"#E74C3C",fontSize:14,padding:"2px 4px"}}>✕</button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ):(
                        <div style={{padding:"24px",fontSize:12,color:"#888",textAlign:"center"}}>
                          Sin TCs asignados. Usa el selector de arriba para agregar casos a este ciclo.
                        </div>
                      )}
                      </>)}
                    </div>
                  );
                })}

                {/* Trazabilidad cruzada */}
                {ciclos.length>1&&(
                  <div style={{background:DM.card,borderRadius:12,padding:20,border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000000a"}}>
                    <div style={{fontSize:13,fontWeight:700,color:DM.text,marginBottom:16}}>📋 Trazabilidad por TC</div>
                    <div style={{overflowX:"auto"}}>
                      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                        <thead>
                          <tr style={{background:darkMode?"#1a1a1a":"#f8f8f8"}}>
                            <th style={{padding:"8px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:DM.sub,textTransform:"uppercase"}}>TC</th>
                            <th style={{padding:"8px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:DM.sub,textTransform:"uppercase"}}>Escenario</th>
                            {ciclos.map(c=>(
                              <th key={c.id} style={{padding:"8px 14px",textAlign:"center",fontSize:10,fontWeight:700,color:proj.color,textTransform:"uppercase",whiteSpace:"nowrap"}}>{c.nombre}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tests.filter(t=>ciclos.some(c=>(c.ejecuciones||[]).find(e=>e.tcId===t.id))).map(tc=>(
                            <tr key={tc.id} style={{borderTop:`1px solid ${DM.cardBorder}`}}>
                              <td style={{padding:"8px 14px",fontWeight:700,color:proj.color,fontFamily:"monospace",whiteSpace:"nowrap"}}>{tc.id}</td>
                              <td style={{padding:"8px 14px",fontWeight:700,color:darkMode?"#f4f7fb":DM.text,whiteSpace:"normal",wordBreak:"break-word",lineHeight:1.5,minWidth:220,maxWidth:320,letterSpacing:"0.08px",background:darkMode?"#202b3b":"#f7faff",borderRadius:8,border:darkMode?"1px solid #32445a":"1px solid #e8f0ff"}}>{tc.escenario}</td>
                              {ciclos.map(c=>{
                                const ejec=(c.ejecuciones||[]).find(e=>e.tcId===tc.id);
                                if(!ejec)return<td key={c.id} style={{padding:"8px 14px",textAlign:"center",color:"#ccc"}}>—</td>;
                                const sc=statusConfig[ejec.estado]||statusConfig["No ejecutado"];
                                return(
                                  <td key={c.id} style={{padding:"8px 14px",textAlign:"center"}}>
                                    <span style={{background:sc.bg,color:sc.color,border:`1px solid ${sc.color}30`,borderRadius:10,padding:"2px 8px",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{ejec.estado}</span>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              );
            })()}

            {/* ── ISSUES ── */}
            {tab==="issues"&&(
              <div style={{display:"flex",flexDirection:"column",gap:18}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                  <div>
                    <h2 style={{margin:0,fontSize:20,fontWeight:800,color:DM.text}}>Issue List</h2>
                    <p style={{margin:"3px 0 0",color:DM.sub,fontSize:12}}>{filteredIssues.length} issues registrados</p>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    {[{l:"Open",v:filteredIssueStats.open,c:"#E74C3C"},{l:"In Progress",v:filteredIssueStats.inProg,c:"#F39C12"},{l:"Closed",v:filteredIssueStats.closed,c:"#27AE60"}].map(s=>(
                      <div key={s.l} style={{background:s.c+"15",border:`1px solid ${s.c}30`,borderRadius:7,padding:"4px 10px",fontSize:11,display:"flex",gap:5}}>
                        <span style={{color:s.c,fontWeight:800}}>{s.v}</span><span style={{color:"#666"}}>{s.l}</span>
                      </div>
                    ))}
                    <select value={filterIssueEstado} onChange={e=>setFilterIssueEstado(e.target.value)} style={{...inputStyle,width:140,padding:"7px 12px",background:darkMode?"#2C2C2E":"#fff",color:DM.text,border:darkMode?"1px solid #444":"1px solid #e0e0e0"}}>
                      <option value="Todos">Todos</option>
                      {Object.keys(issueStatusConfig).map(k=><option key={k} value={k}>{k}</option>)}
                    </select>
                    <select value={filterModulo} onChange={e=>setFilterModulo(e.target.value)} style={{...inputStyle,width:150,padding:"7px 12px",background:darkMode?"#2C2C2E":"#fff",color:DM.text,border:darkMode?"1px solid #444":"1px solid #e0e0e0"}}>
                      {modulosList.map(m=><option key={m} value={m}>{m==="Todos"?"Todos los módulos":m}</option>)}
                    </select>
                    {filterModulo!=="Todos"&&<button onClick={()=>setFilterModulo("Todos")} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#aaa"}}>✕ Módulo</button>}
                    <Btn onClick={()=>{setEditIssue(null);setShowIssueForm(true);}}>+ Nuevo Issue</Btn>
                    <Btn variant="ghost" small onClick={()=>exportIssuesToCSV(proj, filteredIssues)}>⬇ Exportar</Btn>
                  </div>
                </div>
                <div style={{background:DM.card,borderRadius:12,overflow:"hidden",border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000000a"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                    <thead>
                      <tr style={{background:proj.color,color:"#fff"}}>
                        <th style={{padding:"11px 8px",width:24}}></th>
                        {['TC','Escenario','Descripción de la novedad','Módulo','Observación'].map(h=>(
                          <th key={h} style={{padding:"11px 13px",textAlign:"left",fontWeight:700,fontSize:10,letterSpacing:"0.06em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIssues.length===0&&(<tr><td colSpan={6} style={{padding:32,textAlign:"center",color:"#bbb",fontSize:13}}>Sin issues registrados.</td></tr>)}
                      {filteredIssues.map((issue,i)=>{
                        const realIndex=proj.issues.findIndex(x=>x.id===issue.id);
                        return (
                          <tr key={issue.id} draggable
                            onDragStart={()=>{dragIssueIndex.current=realIndex;}}
                            onDragOver={e=>{e.preventDefault();dragOverIssueIndex.current=realIndex;}}
                            onDrop={()=>{if(dragIssueIndex.current!==null&&dragIssueIndex.current!==dragOverIssueIndex.current)reorderIssues(dragIssueIndex.current,dragOverIssueIndex.current);dragIssueIndex.current=null;dragOverIssueIndex.current=null;}}
                            style={{background:i%2===0?DM.tableRow0:DM.tableRow1,cursor:"default",borderBottom:`1px solid ${DM.cardBorder}`,transition:"background 0.12s"}}
                            onMouseEnter={e=>{e.currentTarget.style.background=DM.tableHover;}}
                            onMouseLeave={e=>{e.currentTarget.style.background=i%2===0?DM.tableRow0:DM.tableRow1;}}>
                            <td style={{padding:"9px 8px",textAlign:"center",color:"#ccc",cursor:"grab",fontSize:16}} onClick={e=>e.stopPropagation()} title="Arrastrar">⠿</td>
                            <td style={{padding:"9px 13px",color:DM.sub,whiteSpace:"nowrap",fontSize:12,letterSpacing:"0.02em"}}>{issue.testId||"—"}</td>
                            <td style={{padding:"9px 13px",fontWeight:700,color:darkMode?"#f4f7fb":DM.text,whiteSpace:"normal",wordBreak:"break-word",lineHeight:1.4,minWidth:240,maxWidth:420,letterSpacing:"0.1px",background:darkMode?"#202b3b":"#f7faff",borderRadius:8,border:darkMode?"1px solid #32445a":"1px solid #e8f0ff"}}>{issue.escenario}</td>
                            <td style={{padding:"9px 13px",color:DM.sub,maxWidth:220,whiteSpace:"normal",wordBreak:"break-word",lineHeight:1.4}}>{issue.formulario||"—"}</td>
                            <td style={{padding:"9px 13px",color:DM.sub,whiteSpace:"nowrap"}}>{issue.modulo||"—"}</td>
                            <td style={{padding:"9px 13px",whiteSpace:"nowrap"}}>
                              <Btn small variant="ghost" onClick={e=>{e.stopPropagation();setViewIssue(issue);}}>Ver observación</Btn>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}
      {showJira&&<JiraModal onImport={handleJiraImport} onClose={()=>setShowJira(false)} existingTests={tests} darkMode={darkMode}/>}
      {showCicloForm&&<CicloFormModal initial={editCiclo} cicloId={editCiclo?.nombre} modulosList={[...new Set(tests.map(t=>t.proceso).filter(Boolean))]} onSave={saveCiclo} onClose={()=>{setShowCicloForm(false);setEditCiclo(null);}} darkMode={darkMode}/>}
      {showProjForm&&<ProjectFormModal initial={editProj} onSave={saveProject} onClose={()=>{setShowProjForm(false);setEditProj(null);}} darkMode={darkMode}/>}
      {showTcForm&&<TcFormModal initial={editTc} tcId={editTc?.id} onSave={saveTC} onClose={()=>{setShowTcForm(false);setEditTc(null);}} darkMode={darkMode}/>}
      {observationTc&&<ObservationModal tc={observationTc} initialText="" darkMode={darkMode}
        onClose={()=>setObservationTc(null)}
        onSave={(text)=>{addComment(observationTc.id,text);setObservationTc(null);}} />}
      {viewTc&&!showTcForm&&(
        <TcDetailModal tc={viewTc} onClose={()=>setViewTc(null)}
          onEdit={()=>{setEditTc(viewTc);setViewTc(null);setShowTcForm(true);}}
          onDelete={()=>setConfirmDelete({type:"tc",id:viewTc.id})}
          onDuplicate={()=>duplicateTC(viewTc)}
          onAddComment={addComment}/>
      )}
      {showIssueForm&&<IssueFormModal initial={editIssue} issueId={editIssue?.id} testIds={tests.map(t=>t.id)} onSave={saveIssue} onClose={()=>{setShowIssueForm(false);setEditIssue(null);}} darkMode={darkMode}/>}
      {viewIssue&&!showIssueForm&&(
        <IssueDetailModal issue={viewIssue} onClose={()=>setViewIssue(null)}
          onEdit={()=>{setEditIssue(viewIssue);setViewIssue(null);setShowIssueForm(true);}}
          onDelete={()=>setConfirmDelete({type:"issue",id:viewIssue.id})}/>
      )}
      {confirmDelete&&(
        <Modal onClose={()=>setConfirmDelete(null)}>
          <ModalHeader title="Confirmar eliminación" onClose={()=>setConfirmDelete(null)}/>
          <p style={{fontSize:14,color:"#555",marginBottom:24}}>
            {confirmDelete.type==="project"&&`¿Eliminar el proyecto "${proj.name}" y todos sus datos?`}
            {confirmDelete.type==="tc"&&`¿Eliminar el caso de prueba ${confirmDelete.id}?`}
            {confirmDelete.type==="issue"&&`¿Eliminar el issue #${confirmDelete.id}?`}
            {confirmDelete.type==="ciclo"&&`¿Eliminar este ciclo? Los TCs asignados quedarán sin ciclo.`}
          </p>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
            <Btn variant="ghost" onClick={()=>setConfirmDelete(null)}>Cancelar</Btn>
            <Btn danger onClick={()=>{
              if(confirmDelete.type==="project")deleteProject(confirmDelete.id);
              else if(confirmDelete.type==="tc")deleteTC(confirmDelete.id);
              else if(confirmDelete.type==="ciclo")deleteCiclo(confirmDelete.id);
              else deleteIssue(confirmDelete.id);
            }}>Sí, eliminar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
