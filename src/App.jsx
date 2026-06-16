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
const EMPTY_ISSUE = { testId:"",escenario:"",formulario:"",observacion:"",modulo:"",estado:"Open",severidad:"Medium",prioridad:"Medium",fechaCreacion:"",attachments:[] };

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
const inputStyle={border:"1px solid #e0e0e0",borderRadius:8,padding:"10px 13px",fontSize:14,outline:"none",width:"100%",boxSizing:"border-box",fontFamily:"inherit",background:"#fff",fontWeight:500};
const inputStyleDark={...inputStyle,background:"#2C2C2E",border:"1px solid #444",color:"#eee"};

function Modal({children,onClose,wide,preventOutsideClose}) {
  return (
    <div style={{position:"fixed",inset:0,background:"#00000055",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
      onClick={preventOutsideClose ? undefined : onClose}>
      <div style={{background:"var(--modal-bg,#fff)",borderRadius:16,padding:28,width:"100%",maxWidth:wide?780:560,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 80px #00000030"}} onClick={e=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
function ModalHeader({title,sub,onClose}) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
      <div>
        <h3 style={{margin:0,fontSize:20,fontWeight:800,color:"var(--text-primary,#1a1a1a)",letterSpacing:"-0.3px"}}>{title}</h3>
        {sub&&<p style={{margin:"6px 0 0",fontSize:13,color:"#999",fontWeight:500}}>{sub}</p>}
      </div>
      <button onClick={onClose} style={{background:"#f0f0f0",border:"none",borderRadius:8,padding:"5px 11px",cursor:"pointer",fontSize:17}}>✕</button>
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
function exportToCSV(proj) {
  const headers = ["ID","Área","Proceso","Escenario","Descripción","Pasos","Resultado Esperado","Asignado A","Fecha Aprobación","Fecha Ejecución","Estado"];
  const rows = proj.tests.map(t=>[t.id,t.area,t.proceso,t.escenario,t.descripcion,t.pasos?.replace(/\n/g," | "),t.resultado,t.asignadoA||"",t.fechaAprobacion,t.fechaEjecucion,t.estado]);
  const csv = [headers,...rows].map(r=>r.map(c=>`"${(c||"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`${proj.name}_TCs.csv`;a.click();
}
function exportIssuesToCSV(proj) {
  const headers = ["ID","TC","Escenario","Formulario","Módulo","Observación","Estado","Severidad","Prioridad","Fecha Creación"];
  const rows = proj.issues.map(i=>[i.id,i.testId,i.escenario,i.formulario,i.modulo,i.observacion,i.estado,i.severidad,i.prioridad,i.fechaCreacion]);
  const csv = [headers,...rows].map(r=>r.map(c=>`"${(c||"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`${proj.name}_Issues.csv`;a.click();
}

// ─── EXPORT DASHBOARD PDF ────────────────────────────────────────────────────
function exportDashboardPDF(proj, stats, issueStats, execPct) {
  const { name, description, createdAt, tests, issues } = proj;
  const dateNow = today();
  const pct = n => tests.length ? Math.round((n / tests.length) * 100) : 0;

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

  // TC table rows
  const tcRows = tests.map(t => {
    const sc = {"Aprobado":"#27AE60","En Progreso":"#F39C12","Fallido":"#E74C3C","No ejecutado":"#95A5A6","No aplica":"#BDC3C7","Bloqueante":"#8E44AD"}[t.estado]||"#888";
    return `<tr>
      <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;font-family:monospace;font-weight:bold;color:#C0392B">${t.id}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;font-size:11px">${t.area}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;font-size:11px">${t.escenario}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;font-size:11px">${t.asignadoA||"—"}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;font-size:11px">${t.fechaEjecucion||"—"}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0"><span style="background:${sc}20;color:${sc};border:1px solid ${sc}40;border-radius:10px;padding:2px 8px;font-size:10px;font-weight:bold">${t.estado}</span></td>
    </tr>`;
  }).join("");

  const issueRows = issues.map(i => {
    const sc={"Open":"#E74C3C","Closed":"#27AE60","In Progress":"#F39C12","Blocked":"#8E44AD"}[i.estado]||"#888";
    const sv={"Critical":"#C0392B","High":"#E74C3C","Medium":"#F39C12","Low":"#27AE60"}[i.severidad]||"#888";
    return `<tr>
      <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;font-family:monospace;font-size:11px;color:#C0392B">#${i.id}·${i.testId}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;font-size:11px">${i.escenario}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;font-size:10px;max-width:200px">${i.observacion.slice(0,80)}${i.observacion.length>80?"…":""}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0"><span style="background:${sc}20;color:${sc};border:1px solid ${sc}40;border-radius:10px;padding:2px 8px;font-size:10px;font-weight:bold">${i.estado}</span></td>
      <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0"><span style="color:${sv};font-size:10px;font-weight:bold">${i.severidad}</span></td>
    </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Dashboard – ${name}</title>
<style>
  body{font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;margin:0;padding:32px;color:#222;background:#fff;line-height:1.6}
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
  <div class="section-title">🐛 Issues (${issues.length})</div>
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

<div class="footer">Gestión de Pruebas · ${name} · ${dateNow} · Creado: ${createdAt||"—"}</div>
<script>window.onload=()=>window.print();</script>
</body></html>`;

  const w = window.open("","_blank");
  w.document.write(html);
  w.document.close();
}
function exportIssuesToPDF(proj, filteredIssues) {
  const { name, description, createdAt } = proj;
  const dateNow = today();
  const issues = filteredIssues && filteredIssues.length > 0 ? filteredIssues : proj.issues;
  
  const issueRows = issues.map(i => {
    const sc={"Open":"#E74C3C","Closed":"#27AE60","In Progress":"#F39C12","Blocked":"#8E44AD"}[i.estado]||"#888";
    const sv={"Critical":"#C0392B","High":"#E74C3C","Medium":"#F39C12","Low":"#27AE60"}[i.severidad]||"#888";
    return `<tr>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;font-family:monospace;font-weight:bold;font-size:11px;color:#C0392B">#${i.id}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;font-size:11px;font-family:monospace">${i.testId}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;font-size:11px;font-weight:600">${i.escenario}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;font-size:10px">${i.formulario||"—"}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;font-size:10px">${i.modulo}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;font-size:10px;max-width:250px">${i.observacion.slice(0,100)}${i.observacion.length>100?"…":""}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0"><span style="background:${sc}20;color:${sc};border:1px solid ${sc}40;border-radius:10px;padding:2px 8px;font-size:10px;font-weight:bold">${i.estado}</span></td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0"><span style="color:${sv};font-size:10px;font-weight:bold">${i.severidad}</span></td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;font-size:10px">${i.prioridad||"—"}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;font-size:10px">${i.fechaCreacion}</td>
    </tr>`;
  }).join("");

  const issuesByStatus = {
    "Open": issues.filter(i => i.estado === "Open").length,
    "Closed": issues.filter(i => i.estado === "Closed").length,
    "In Progress": issues.filter(i => i.estado === "In Progress").length,
    "Blocked": issues.filter(i => i.estado === "Blocked").length
  };

  const issuesBySeverity = {
    "Critical": issues.filter(i => i.severidad === "Critical").length,
    "High": issues.filter(i => i.severidad === "High").length,
    "Medium": issues.filter(i => i.severidad === "Medium").length,
    "Low": issues.filter(i => i.severidad === "Low").length
  };

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Issues – ${name}</title>
<style>
  body{font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;margin:0;padding:32px;color:#222;background:#fff;line-height:1.6}
  .header{background:#C0392B;color:#fff;padding:20px 28px;border-radius:10px;margin-bottom:24px}
  .brand{font-weight:900;font-size:11px;letter-spacing:.07em;background:#fff;color:#C0392B;padding:3px 10px;border-radius:4px;display:inline-block;margin-bottom:8px}
  .title{font-size:22px;font-weight:800;margin:0}
  .sub{font-size:12px;opacity:.8;margin:4px 0 0}
  .section{margin-bottom:28px}
  .section-title{font-size:14px;font-weight:800;color:#C0392B;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #FADBD8}
  .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
  .stat-box{border-radius:8px;padding:14px;background:#f9f9f9;border:1px solid #f0f0f0;text-align:center}
  .stat-label{font-size:10px;color:#aaa;font-weight:700;text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px}
  .stat-value{font-size:28px;font-weight:800}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{background:#C0392B;color:#fff;padding:10px 12px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.06em;font-weight:700}
  td{padding:8px 10px}
  .footer{margin-top:32px;font-size:10px;color:#bbb;text-align:center;border-top:1px solid #f0f0f0;padding-top:12px}
  @media print{body{padding:16px}}
</style>
</head><body>
<div class="header">
  <div class="brand">PANAMERICANA</div>
  <div class="title">Issues – ${name}</div>
  <div class="sub">${description} · Generado: ${dateNow}</div>
</div>

<div class="section">
  <div class="section-title">📊 Resumen de Issues</div>
  <div class="stats-grid">
    <div class="stat-box" style="background:#E74C3C15;border:1px solid #E74C3C30">
      <div class="stat-label">Open</div>
      <div class="stat-value" style="color:#E74C3C">${issuesByStatus.Open}</div>
    </div>
    <div class="stat-box" style="background:#F39C1215;border:1px solid #F39C1230">
      <div class="stat-label">In Progress</div>
      <div class="stat-value" style="color:#F39C12">${issuesByStatus["In Progress"]}</div>
    </div>
    <div class="stat-box" style="background:#27AE6015;border:1px solid #27AE6030">
      <div class="stat-label">Closed</div>
      <div class="stat-value" style="color:#27AE60">${issuesByStatus.Closed}</div>
    </div>
    <div class="stat-box" style="background:#8E44AD15;border:1px solid #8E44AD30">
      <div class="stat-label">Blocked</div>
      <div class="stat-value" style="color:#8E44AD">${issuesByStatus.Blocked}</div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">🔴 Severidad</div>
  <div class="stats-grid" style="grid-template-columns:repeat(4,1fr)">
    <div class="stat-box" style="background:#C0392B15;border:1px solid #C0392B30">
      <div class="stat-label">Critical</div>
      <div class="stat-value" style="color:#C0392B">${issuesBySeverity.Critical}</div>
    </div>
    <div class="stat-box" style="background:#E74C3C15;border:1px solid #E74C3C30">
      <div class="stat-label">High</div>
      <div class="stat-value" style="color:#E74C3C">${issuesBySeverity.High}</div>
    </div>
    <div class="stat-box" style="background:#F39C1215;border:1px solid #F39C1230">
      <div class="stat-label">Medium</div>
      <div class="stat-value" style="color:#F39C12">${issuesBySeverity.Medium}</div>
    </div>
    <div class="stat-box" style="background:#27AE6015;border:1px solid #27AE6030">
      <div class="stat-label">Low</div>
      <div class="stat-value" style="color:#27AE60">${issuesBySeverity.Low}</div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">🐛 Listado de Issues (${issues.length})</div>
  <table>
    <thead><tr><th>ID</th><th>TC</th><th>Escenario</th><th>Formulario</th><th>Módulo</th><th>Observación</th><th>Estado</th><th>Severidad</th><th>Prioridad</th><th>Fecha Creación</th></tr></thead>
    <tbody>${issueRows}</tbody>
  </table>
</div>

<div class="footer">Gestión de Issues · ${name} · ${dateNow} · Creado: ${createdAt||"—"}</div>
<script>window.onload=()=>window.print();</script>
</body></html>`;

  const w = window.open("","_blank");
  w.document.write(html);
  w.document.close();
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

// ─── FORM MODALS ──────────────────────────────────────────────────────────────
function ProjectFormModal({initial,onSave,onClose}) {
  const [form,setForm]=useState(initial||{name:"",description:"",color:COLORS[0]});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return (
    <Modal onClose={onClose} preventOutsideClose>
      <ModalHeader title={initial?"Editar Proyecto":"Nuevo Proyecto"} onClose={onClose}/>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <Field label="Nombre del Proyecto"><input style={inputStyle} value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Ej: SAP – Módulo Ventas"/></Field>
        <Field label="Descripción"><input style={inputStyle} value={form.description} onChange={e=>set("description",e.target.value)} placeholder="Descripción breve"/></Field>
        <Field label="Color">
          <div style={{display:"flex",gap:10}}>
            {COLORS.map(c=><div key={c} onClick={()=>set("color",c)} style={{width:28,height:28,borderRadius:6,background:c,cursor:"pointer",border:form.color===c?"3px solid #222":"3px solid transparent",transition:"border 0.15s"}}/>)}
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
  const [form,setForm]=useState(initial||{...EMPTY_TC});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const IS=darkMode?inputStyleDark:inputStyle;
  return (
    <Modal onClose={onClose} wide preventOutsideClose>
      <ModalHeader title={initial?`Editar ${tcId}`:"Nuevo Caso de Prueba"} sub={initial?"Modifica y guarda":"Completa los datos del escenario"} onClose={onClose}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <Field label="Área"><input style={IS} value={form.area} onChange={e=>set("area",e.target.value)} placeholder="Compras a pago"/></Field>
        <Field label="Proceso"><input style={IS} value={form.proceso} onChange={e=>set("proceso",e.target.value)} placeholder="Logística"/></Field>
        <Field label="Escenario"><input style={IS} value={form.escenario} onChange={e=>set("escenario",e.target.value)} placeholder="Recepción de mercancía"/></Field>
        <Field label="Asignado a"><input style={IS} value={form.asignadoA||""} onChange={e=>set("asignadoA",e.target.value)} placeholder="Nombre del responsable"/></Field>
        <Field label="Estado">
          <select style={IS} value={form.estado} onChange={e=>set("estado",e.target.value)}>
            {Object.keys(statusConfig).map(k=><option key={k} value={k}>{k}</option>)}
          </select>
        </Field>
        <Field label="Fecha Aprobación"><input style={IS} value={form.fechaAprobacion} onChange={e=>set("fechaAprobacion",e.target.value)} placeholder="DD/MM/YYYY"/></Field>
        <Field label="Fecha Ejecución"><input style={IS} value={form.fechaEjecucion} onChange={e=>set("fechaEjecucion",e.target.value)} placeholder="DD/MM/YYYY"/></Field>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:14}}>
        <Field label="Descripción"><input style={IS} value={form.descripcion} onChange={e=>set("descripcion",e.target.value)} placeholder="Descripción del escenario"/></Field>
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
  const [form,setForm]=useState(initial||{...EMPTY_ISSUE,fechaCreacion:today()});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const IS=darkMode?inputStyleDark:inputStyle;
  return (
    <Modal onClose={onClose} wide preventOutsideClose>
      <ModalHeader title={initial?`Editar Issue #${issueId}`:"Nuevo Issue"} sub="Registra la novedad encontrada" onClose={onClose}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <Field label="Caso de Prueba">
          <select style={IS} value={form.testId} onChange={e=>set("testId",e.target.value)}>
            <option value="">-- Seleccionar --</option>
            {testIds.map(id=><option key={id} value={id}>{id}</option>)}
          </select>
        </Field>
        <Field label="Módulo"><input style={IS} value={form.modulo} onChange={e=>set("modulo",e.target.value)} placeholder="Compras a pagos"/></Field>
        <Field label="Escenario"><input style={IS} value={form.escenario} onChange={e=>set("escenario",e.target.value)} placeholder="Nombre del escenario"/></Field>
        <Field label="Formulario"><input style={IS} value={form.formulario} onChange={e=>set("formulario",e.target.value)} placeholder="Nombre del formulario"/></Field>
        <Field label="Estado">
          <select style={IS} value={form.estado} onChange={e=>set("estado",e.target.value)}>
            {Object.keys(issueStatusConfig).map(k=><option key={k} value={k}>{k}</option>)}
          </select>
        </Field>
        <Field label="Severidad">
          <select style={IS} value={form.severidad} onChange={e=>set("severidad",e.target.value)}>
            {Object.keys(severityConfig).map(k=><option key={k} value={k}>{k}</option>)}
          </select>
        </Field>
        <Field label="Prioridad">
          <select style={IS} value={form.prioridad} onChange={e=>set("prioridad",e.target.value)}>
            {["Critical","High","Medium","Low"].map(k=><option key={k} value={k}>{k}</option>)}
          </select>
        </Field>
        <Field label="Fecha Creación"><input style={IS} value={form.fechaCreacion} onChange={e=>set("fechaCreacion",e.target.value)} placeholder="DD/MM/YYYY"/></Field>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:14}}>
        <Field label="Observación"><textarea style={{...IS,minHeight:90,resize:"vertical"}} value={form.observacion} onChange={e=>set("observacion",e.target.value)} placeholder="Describe la novedad..."/></Field>
        <Field label="Adjuntos – imágenes, Word, PDF"><AttachmentZone attachments={form.attachments||[]} onChange={v=>set("attachments",v)}/></Field>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:8}}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={()=>{if(!form.observacion.trim())return alert("La observación es requerida");onSave(form);}}>💾 Guardar</Btn>
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
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <div style={{fontFamily:"monospace",fontSize:12,color:BRAND,fontWeight:700,marginBottom:4}}>Issue #{issue.id} · {issue.testId}</div>
          <h3 style={{margin:0,fontSize:17,fontWeight:800,color:"#1a1a1a"}}>{issue.escenario}</h3>
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn small onClick={onEdit}>✏️ Editar</Btn>
          <Btn small danger onClick={onDelete}>🗑️</Btn>
          <button onClick={onClose} style={{background:"#f0f0f0",border:"none",borderRadius:8,padding:"5px 11px",cursor:"pointer",fontSize:17}}>✕</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:11,marginBottom:14}}>
        {[["Módulo",issue.modulo],["Formulario",issue.formulario],["Fecha Creación",issue.fechaCreacion]].map(([l,v])=>(
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
  const [projects,setProjects]=useState(()=>{try{const s=localStorage.getItem("pana_projects");return s?JSON.parse(s):seedProjects;}catch{return seedProjects;}});
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
  const [showIssueForm,setShowIssueForm]=useState(false);
  const [editIssue,setEditIssue]=useState(null);
  const [viewIssue,setViewIssue]=useState(null);
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

  // Issue reorder
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

  // Import CSV
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
    <div style={{fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',minHeight:"100vh",background:DM.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20}}>
      <div style={{fontSize:48}}>📂</div>
      <p style={{color:"#888",fontSize:16}}>No hay proyectos. Crea uno para comenzar.</p>
      <Btn onClick={()=>setShowProjForm(true)}>+ Nuevo Proyecto</Btn>
      {showProjForm&&<ProjectFormModal onSave={saveProject} onClose={()=>setShowProjForm(false)}/>}
    </div>
  );

  const tests=proj.tests;
  const issues=proj.issues;

  const stats=useMemo(()=>{const c={};Object.keys(statusConfig).forEach(k=>c[k]=0);tests.forEach(t=>{if(c[t.estado]!==undefined)c[t.estado]++;});return c;},[tests]);
  const issueStats=useMemo(()=>({open:issues.filter(i=>i.estado==="Open").length,closed:issues.filter(i=>i.estado==="Closed").length,inProg:issues.filter(i=>i.estado==="In Progress").length,blocked:issues.filter(i=>i.estado==="Blocked").length}),[issues]);

  // timeline data: count aprobados por fecha
  const timelineData=useMemo(()=>{
    const map={};
    tests.filter(t=>t.fechaEjecucion).forEach(t=>{map[t.fechaEjecucion]=(map[t.fechaEjecucion]||0)+1;});
    return Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0])).map(([d,v])=>({label:d.slice(0,5),value:v}));
  },[tests]);

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
  const pct=n=>tests.length?Math.round((n/tests.length)*100):0;
  const execPct=pct(stats["Aprobado"]+stats["No aplica"]);

  // Stats per module (proceso field)
  const moduleStats=useMemo(()=>{
    const modules={};
    tests.forEach(t=>{
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
  },[tests]);
  const tabs=[{id:"dashboard",label:"📊 Dashboard"},{id:"tests",label:"🧪 Casos de Prueba"},{id:"issues",label:"🐛 Issues"}];

  return (
    <div style={{fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',background:DM.bg,minHeight:"100vh",color:DM.text}}>
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
              <div style={{background:BRAND,color:"#fff",fontWeight:900,fontSize:11,padding:"4px 10px",borderRadius:5,letterSpacing:"0.07em",display:"inline-block",marginBottom:8}}>PANAMERICANA</div>
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
                    <h2 style={{margin:0,fontSize:24,fontWeight:800,color:DM.text,letterSpacing:"-0.5px"}}>Control del Día</h2>
                    <p style={{margin:"6px 0 0",color:DM.sub,fontSize:13,fontWeight:500}}>Resumen general · {proj.name}</p>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:7,alignItems:"flex-end"}}>
                    <div style={{display:"flex",gap:8}}>
                      <Btn small onClick={()=>{setEditTc(null);setShowTcForm(true);}}>+ TC</Btn>
                      <Btn small variant="ghost" onClick={()=>{setEditIssue(null);setShowIssueForm(true);}}>+ Issue</Btn>
                      <Btn small variant="ghost" onClick={()=>exportToCSV(proj)}>⬇ TCs CSV</Btn>
                      <Btn small variant="ghost" onClick={()=>exportIssuesToCSV(proj)}>⬇ Issues CSV</Btn>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <Btn small onClick={()=>exportDashboardPDF(proj,stats,issueStats,execPct)} style={{background:"#2980B9",color:"#fff",width:"100%"}}>📄 Dashboard PDF</Btn>
                      <Btn small onClick={()=>exportIssuesToPDF(proj,proj.issues)} style={{background:"#8E44AD",color:"#fff",width:"100%"}}>📄 Issues PDF</Btn>
                    </div>
                  </div>
                </div>

                {/* Semáforo */}
                <div style={{background:DM.card,borderRadius:14,padding:20,border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000000a"}}>
                  <Semaforo pct={execPct}/>
                </div>

                {/* stat chips */}
                <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                  {[{label:"Total",value:tests.length,color:DM.text},{label:"Aprobado",value:stats["Aprobado"],color:"#27AE60"},{label:"En Progreso",value:stats["En Progreso"],color:"#F39C12"},{label:"Fallido",value:stats["Fallido"],color:"#E74C3C"},{label:"No ejecutado",value:stats["No ejecutado"],color:"#95A5A6"},{label:"No aplica",value:stats["No aplica"],color:"#BDC3C7"},{label:"Bloqueante",value:stats["Bloqueante"],color:"#8E44AD"}].map(s=>(
                    <div key={s.label} style={{background:DM.card,borderRadius:10,padding:"12px 16px",boxShadow:"0 1px 8px #0000000a",border:`1px solid ${DM.cardBorder}`,minWidth:90}}>
                      <div style={{fontSize:10,color:DM.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{s.label}</div>
                      <div style={{fontSize:28,fontWeight:800,color:s.color,lineHeight:1.1}}>{s.value}</div>
                      {tests.length>0&&s.label!=="Total"&&(<div style={{marginTop:4,height:3,background:"#f0f0f0",borderRadius:2}}><div style={{width:`${pct(s.value)}%`,height:"100%",background:s.color,borderRadius:2}}/></div>)}
                    </div>
                  ))}
                </div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                  <div style={{background:DM.card,borderRadius:12,padding:20,border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000000a"}}>
                    <div style={{fontSize:13,fontWeight:700,color:DM.text,marginBottom:16}}>Distribución de Estados</div>
                    <Donut data={[{label:"Aprobado",value:stats["Aprobado"],color:"#27AE60"},{label:"En Progreso",value:stats["En Progreso"],color:"#F39C12"},{label:"Fallido",value:stats["Fallido"],color:"#E74C3C"},{label:"No ejecutado",value:stats["No ejecutado"],color:"#bbb"},{label:"No aplica",value:stats["No aplica"],color:"#ddd"},{label:"Bloqueante",value:stats["Bloqueante"],color:"#8E44AD"}]}/>
                  </div>
                  <div style={{background:DM.card,borderRadius:12,padding:20,border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000000a"}}>
                    <div style={{fontSize:13,fontWeight:700,color:DM.text,marginBottom:16}}>Test Plan Evolution</div>
                    {[{label:"Ejecutado (Aprobado + N/A)",value:pct(stats["Aprobado"]+stats["No aplica"]),color:"#27AE60"},{label:"En Progreso",value:pct(stats["En Progreso"]),color:"#F39C12"},{label:"No ejecutado",value:pct(stats["No ejecutado"]),color:"#95A5A6"},{label:"Fallido",value:pct(stats["Fallido"]),color:"#E74C3C"}].map((r,i)=>(
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
                  <LineChart data={timelineData} color={proj.color}/>
                </div>

                {/* issues summary */}
                <div style={{background:DM.card,borderRadius:12,padding:20,border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000000a"}}>
                  <div style={{fontSize:13,fontWeight:700,color:DM.text,marginBottom:14}}>Resumen de Issues</div>
                  <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                    {[{label:"Open",v:issueStats.open,c:"#E74C3C"},{label:"In Progress",v:issueStats.inProg,c:"#F39C12"},{label:"Closed",v:issueStats.closed,c:"#27AE60"},{label:"Blocked",v:issueStats.blocked,c:"#8E44AD"}].map(s=>(
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
                            {/* Module header */}
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
              </div>
            )}

            {/* ── CASOS DE PRUEBA ── */}
            {tab==="tests"&&(
              <div style={{display:"flex",flexDirection:"column",gap:18}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                  <div>
                    <h2 style={{margin:0,fontSize:24,fontWeight:800,color:DM.text,letterSpacing:"-0.5px"}}>Casos de Prueba</h2>
                    <p style={{margin:"6px 0 0",color:DM.sub,fontSize:13,fontWeight:500}}>{filteredTests.length} casos {filterProceso!=="Todos"?`· ${filterProceso}`:""}· ⠿ arrastra para reordenar · clic para ver</p>
                  </div>
                  <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                    <Btn small onClick={()=>{setEditTc(null);setShowTcForm(true);}}>+ Nuevo TC</Btn>
                    <Btn small variant="ghost" onClick={()=>importRef.current.click()}>⬆ Importar CSV</Btn>
                    <Btn small variant="ghost" onClick={()=>exportToCSV(proj)}>⬇ Exportar CSV</Btn>
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
                  {filterProceso!=="Todos"&&<button onClick={()=>setFilterProceso("Todos")} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"#aaa"}}>✕ Limpiar</button>}
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
                        {["ID","Área","Proceso","Escenario","Descripción","Responsable","Aprob.","Ejec.","Estado","Adj."].map(h=>(
                          <th key={h} style={{padding:"11px 13px",textAlign:"left",fontWeight:700,fontSize:10,letterSpacing:"0.06em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTests.length===0&&(<tr><td colSpan={11} style={{padding:32,textAlign:"center",color:"#bbb",fontSize:13}}>Sin resultados.</td></tr>)}
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
                            <td style={{padding:"9px 13px",fontWeight:600,color:DM.text}}>{t.escenario}</td>
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
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── ISSUES ── */}
            {tab==="issues"&&(
              <div style={{display:"flex",flexDirection:"column",gap:18}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                  <div>
                    <h2 style={{margin:0,fontSize:24,fontWeight:800,color:DM.text,letterSpacing:"-0.5px"}}>Issue List</h2>
                    <p style={{margin:"6px 0 0",color:DM.sub,fontSize:13,fontWeight:500}}>{filteredIssues.length} issues {filterModulo!=="Todos"?`· ${filterModulo}`:""}· ⠿ arrastra para reordenar</p>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    {[{l:"Open",v:issueStats.open,c:"#E74C3C"},{l:"In Progress",v:issueStats.inProg,c:"#F39C12"},{l:"Closed",v:issueStats.closed,c:"#27AE60"}].map(s=>(
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
                    {filterModulo!=="Todos"&&<button onClick={()=>setFilterModulo("Todos")} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"#aaa"}}>✕ Limpiar</button>}
                    <Btn onClick={()=>{setEditIssue(null);setShowIssueForm(true);}}>+ Nuevo Issue</Btn>
                    <Btn variant="ghost" small onClick={()=>exportIssuesToCSV(proj)}>⬇ CSV</Btn>
                    <Btn variant="ghost" small onClick={()=>exportIssuesToPDF(proj,filteredIssues)}>📄 PDF</Btn>
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:9}}>
                  {filteredIssues.length===0&&(<div style={{background:DM.card,borderRadius:12,padding:40,textAlign:"center",color:"#bbb",fontSize:13,border:`1px solid ${DM.cardBorder}`}}>Sin issues registrados.</div>)}
                  {filteredIssues.map((issue,i)=>{
                    const sc=issueStatusConfig[issue.estado]||issueStatusConfig["Open"];
                    const sev=severityConfig[issue.severidad]||"#888";
                    const realIndex=proj.issues.findIndex(x=>x.id===issue.id);
                    return (
                      <div key={issue.id} draggable
                        onDragStart={()=>{dragIssueIndex.current=realIndex;}}
                        onDragOver={e=>{e.preventDefault();dragOverIssueIndex.current=realIndex;}}
                        onDrop={()=>{if(dragIssueIndex.current!==null&&dragIssueIndex.current!==dragOverIssueIndex.current)reorderIssues(dragIssueIndex.current,dragOverIssueIndex.current);dragIssueIndex.current=null;dragOverIssueIndex.current=null;}}
                        onClick={()=>setViewIssue(issue)}
                        style={{background:DM.card,borderRadius:11,padding:"14px 18px",border:`1px solid ${DM.cardBorder}`,cursor:"grab",borderLeft:`4px solid ${sev}`,boxShadow:"0 1px 6px #00000008",transition:"box-shadow 0.15s, transform 0.15s"}}
                        onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 18px #00000015";e.currentTarget.style.transform="translateX(4px)";}}
                        onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 6px #00000008";e.currentTarget.style.transform="translateX(0)";}}>
                        <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start"}}>
                          <span style={{fontSize:18,color:BRAND,cursor:"grab",paddingTop:2,userSelect:"none",fontWeight:700,opacity:0.8,transition:"opacity 0.2s"}} title="Arrastra para reordenar">⠿</span>
                          <div style={{flex:1}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                              <span style={{fontFamily:"monospace",fontSize:11,fontWeight:700,color:BRAND,background:BRAND_LIGHT,padding:"1px 7px",borderRadius:4}}>#{issue.id} · {issue.testId}</span>
                              <span style={{fontSize:12,color:"#666"}}>{issue.escenario}</span>
                            </div>
                            <div style={{fontSize:12,color:"#555",lineHeight:1.55,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{issue.observacion}</div>
                          </div>
                          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5,flexShrink:0,pointerEvents:"none"}}>
                            <Badge label={issue.estado} color={sc.color} bg={sc.bg}/>
                            <span style={{fontSize:10,fontWeight:700,color:sev,background:sev+"15",padding:"2px 8px",borderRadius:6}}>{issue.severidad}</span>
                            {(issue.attachments||[]).length>0&&<span style={{fontSize:11,color:"#aaa"}}>📎{issue.attachments.length}</span>}
                          </div>
                        </div>
                        <div style={{marginTop:8,display:"flex",gap:6}}>
                          <span style={{fontSize:10,color:"#999",background:"#f5f5f5",padding:"2px 7px",borderRadius:5}}>📦 {issue.modulo}</span>
                          {issue.prioridad&&<span style={{fontSize:10,color:"#999",background:"#f5f5f5",padding:"2px 7px",borderRadius:5}}>🔺 {issue.prioridad}</span>}
                          <span style={{fontSize:10,color:"#bbb",marginLeft:"auto"}}>{issue.fechaCreacion}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}
      {showProjForm&&<ProjectFormModal initial={editProj} onSave={saveProject} onClose={()=>{setShowProjForm(false);setEditProj(null);}}/>}
      {showTcForm&&<TcFormModal initial={editTc} tcId={editTc?.id} onSave={saveTC} onClose={()=>{setShowTcForm(false);setEditTc(null);}} darkMode={darkMode}/>}
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
          </p>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
            <Btn variant="ghost" onClick={()=>setConfirmDelete(null)}>Cancelar</Btn>
            <Btn danger onClick={()=>{
              if(confirmDelete.type==="project")deleteProject(confirmDelete.id);
              else if(confirmDelete.type==="tc")deleteTC(confirmDelete.id);
              else deleteIssue(confirmDelete.id);
            }}>Sí, eliminar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}