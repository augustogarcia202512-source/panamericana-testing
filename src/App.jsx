import { useState, useMemo, useRef, useEffect } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const BRAND = "#C0392B";
const BRAND_LIGHT = "#FADBD8";

const testStatusConfig = {
  "Borrador": { color: "#95A5A6", bg: "#F2F3F4" },
  "Revisión": { color: "#F39C12", bg: "#FEF9E7" },
  "Aprobado": { color: "#27AE60", bg: "#EAFAF1" },
};
const cycleStatusConfig = {
  "No ejecutado": { color: "#95A5A6", bg: "#F2F3F4" },
  "En Progreso": { color: "#F39C12", bg: "#FEF9E7" },
  "Fallido": { color: "#E74C3C", bg: "#FDEDEC" },
  "Aprobado": { color: "#27AE60", bg: "#EAFAF1" },
  "No aplica": { color: "#BDC3C7", bg: "#F2F3F4" },
  "Bloqueante": { color: "#8E44AD", bg: "#F5EEF8" },
};
const statusConfig = testStatusConfig;
const issueStatusConfig = {
  "Open": { color: "#E74C3C", bg: "#FDEDEC" },
  "Ready for Retest": { color: "#3498DB", bg: "#EAF4FF" },
  "Closed": { color: "#27AE60", bg: "#EAFAF1" },
  "In Progress": { color: "#F39C12", bg: "#FEF9E7" },
  "Blocked": { color: "#8E44AD", bg: "#F5EEF8" },
  "Re-Open": { color: "#E67E22", bg: "#FEF5E7" },
};
const issueStatusLabel = {
  "Open": "Abierto",
  "Ready for Retest": "Listo para re-test",
  "Closed": "Cerrado",
  "In Progress": "En progreso",
  "Blocked": "Bloqueado",
  "Re-Open": "Reabierto",
};
const severityConfig = { "Critical": "#C0392B", "High": "#E74C3C", "Medium": "#F39C12", "Low": "#27AE60" };
const COLORS = ["#C0392B", "#2980B9", "#16A085", "#8E44AD", "#D35400", "#2C3E50", "#27AE60", "#F39C12"];
const EMPTY_TC = { area: "", precondiciones: "", proceso: "", escenario: "", descripcion: "", pasos: "", resultado: "", fechaAprobacion: "", fechaEjecucion: "", estado: "Borrador", asignadoRol: "QA / Pruebas", asignadoA: "", tipoPrueba: "", nivelPrueba: "", attachments: [], historial: [], comentarios: [] };
const EMPTY_ISSUE = { testId: "", escenario: "", formulario: "", observacion: "", modulo: "", estado: "Open", severidad: "Medium", prioridad: "Medium", fechaCreacion: "", fechaSolucion: "", asignadoA: "", attachments: [], bitacora: [] };
const EMPTY_CICLO = { nombre: "", modulo: "", fechaInicio: "", fechaFin: "", descripcion: "", ejecuciones: [] };
const EMPTY_PROJECT = { name: "", description: "", color: COLORS[0], modules: [], scrumTeam: { productOwner: "", scrumMaster: "", developers: [], qa: [] }, scrumTestTypes: ["Funcionales", "Regresión", "Integración", "Aceptación"], scrumLevels: ["Unitarias", "Integración", "Sistema", "Aceptación", "Regresión"] };
// ejecucion: { tcId, estado, fechaEjecucion, nota }

function normalizeMemberList(list) {
  return Array.from(new Set((Array.isArray(list) ? list : []).map(value => String(value || "").trim()).filter(Boolean)));
}

function normalizeScrumTeam(team) {
  const source = team && typeof team === "object" ? team : {};
  return {
    productOwner: String(source.productOwner || "").trim(),
    scrumMaster: String(source.scrumMaster || "").trim(),
    developers: normalizeMemberList(source.developers),
    qa: normalizeMemberList(source.qa),
  };
}

function normalizeProjectList(value) {
  return normalizeMemberList(value);
}

function getScrumTeamMembers(project) {
  const team = normalizeScrumTeam(project?.scrumTeam);
  return normalizeMemberList([
    team.productOwner,
    team.scrumMaster,
    ...team.developers,
    ...team.qa,
  ]);
}

function getScrumRoleMembers(project, role) {
  const team = normalizeScrumTeam(project?.scrumTeam);
  const normalizedRole = String(role || "").trim();
  if (normalizedRole === "Product Owner") return team.productOwner ? [team.productOwner] : [];
  if (normalizedRole === "Scrum Master") return team.scrumMaster ? [team.scrumMaster] : [];
  if (normalizedRole === "Developers") return team.developers;
  if (normalizedRole === "QA / Pruebas") return team.qa;
  return getScrumTeamMembers(project);
}

function inferScrumRole(project, member) {
  const team = normalizeScrumTeam(project?.scrumTeam);
  const value = String(member || "").trim();
  if (!value) return "QA / Pruebas";
  if (team.productOwner && team.productOwner === value) return "Product Owner";
  if (team.scrumMaster && team.scrumMaster === value) return "Scrum Master";
  if (team.developers.includes(value)) return "Developers";
  if (team.qa.includes(value)) return "QA / Pruebas";
  return "QA / Pruebas";
}

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const seedProjects = [{
  id:"proj-1", name:"Panamericana – SAP Compras", description:"Pruebas funcionales módulo Compras a Pago", color:"#C0392B", createdAt:"01/06/2026",
  modules:["Compras","Logística","Pagos"],
  scrumTeam:{
    productOwner:"Laura Torres",
    scrumMaster:"Carlos Pérez",
    developers:["María Gómez","Andrés Rojas"],
    qa:["Sofía Ramírez"],
  },
  scrumTestTypes:["Funcionales","Regresión","Integración","Aceptación"],
  scrumLevels:["Unitarias","Integración","Sistema","Aceptación","Regresión"],
  tests:[
    { id:"TC-01",area:"Compras a pago",proceso:"Compras",escenario:"Modificación",descripcion:"Modificación de ítems o condiciones específicas en una orden de compra",pasos:"1. Ingresar al sistema\n2. Buscar la orden de compra\n3. Validar estado de la orden\n4. Seleccionar ítem a modificar\n5. Realizar cambios\n6. Guardar cambios",resultado:"La orden de compra se actualiza correctamente",fechaAprobacion:"29/04/2026",fechaEjecucion:"",estado:"Aprobado",asignadoA:"Carlos Pérez",attachments:[],historial:[{fecha:"29/04/2026",de:"—",a:"Aprobado",nota:"Estado inicial"}],comentarios:[] },
    { id:"TC-02",area:"Compras a pago",proceso:"Logística",escenario:"Recepción de mercancía",descripcion:"Recepción conforme a orden de compra",pasos:"1. Ingresar al sistema\n2. Verificar estado de la orden\n3. Recibir mercancía\n4. Validar orden vs factura\n5. Registrar recepción",resultado:"La mercancía es recibida y registrada en inventario",fechaAprobacion:"21/05/2026",fechaEjecucion:"21/05/2026",estado:"Aprobado",asignadoA:"",attachments:[],historial:[{fecha:"21/05/2026",de:"—",a:"Aprobado",nota:""}],comentarios:[] },
    { id:"TC-03",area:"Compras a pago",proceso:"Logística",escenario:"Devolución parcial",descripcion:"Devolución parcial por producto defectuoso",pasos:"1. Recibir mercancía\n2. Identificar producto dañado\n3. Registrar devolución parcial\n4. Aceptar productos en buen estado",resultado:"Se recibe parcialmente y se registra devolución",fechaAprobacion:"21/05/2026",fechaEjecucion:"21/05/2026",estado:"Aprobado",asignadoA:"",attachments:[],historial:[],comentarios:[] },
    { id:"TC-04",area:"Compras a pago",proceso:"Pagos",escenario:"Generación de pago",descripcion:"Generar pago a proveedor contra factura registrada",pasos:"1. Buscar factura\n2. Validar orden de compra\n3. Generar documento de pago\n4. Aprobar pago\n5. Registrar egreso",resultado:"El pago se genera y registra correctamente",fechaAprobacion:"",fechaEjecucion:"",estado:"Revisión",asignadoA:"",attachments:[],historial:[{fecha:"06/05/2026",de:"—",a:"Revisión",nota:"Pendiente de revisión"}],comentarios:[] },
    { id:"TC-05",area:"Compras a pago",proceso:"Compras",escenario:"Aprobación multinivel",descripcion:"Flujo de aprobación multinivel de orden de compra",pasos:"1. Crear orden\n2. Enviar a aprobación\n3. Primer nivel aprueba\n4. Segundo nivel aprueba\n5. Orden habilitada",resultado:"La orden pasa por todos los niveles de aprobación",fechaAprobacion:"21/05/2026",fechaEjecucion:"",estado:"Borrador",asignadoA:"",attachments:[],historial:[],comentarios:[] },
  ],
  issues:[
    { id:1,testId:"TC-01",escenario:"Distribución de ajustes de comprobantes",formulario:"Distribución de ajustes",observacion:"Con productos no inventariados, está tomando la moneda de parámetros incorrecta. La columna NIT no se visualiza de manera consistente.",modulo:"Compras a pagos",estado:"Closed",severidad:"Medium",prioridad:"High",fechaCreacion:"05/05/2026",attachments:[] },
    { id:2,testId:"TC-04",escenario:"Registro comprobantes de Cuentas por pagar",formulario:"NP0575 Comprobantes",observacion:"Error al seleccionar comprobante: 'Invalid column name NP0575'.",modulo:"Compras a pagos",estado:"Open",severidad:"High",prioridad:"Critical",fechaCreacion:"06/05/2026",attachments:[] },
  ],
  ciclos:[],
}];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function normalizeTestStatus(status) {
  const value = String(status || "").trim();
  if (!value) return "Borrador";
  if (["No ejecutado", "No Ejecutado", "Pending", "Draft"].includes(value)) return "Borrador";
  if (["En Progreso", "In Progress"].includes(value)) return "Revisión";
  if (["Fallido", "Fallada", "Bloqueante", "Blocked", "No aplica", "No Aplica"].includes(value)) return "Revisión";
  if (["Aprobado", "Approved", "Closed"].includes(value)) return "Aprobado";
  return Object.prototype.hasOwnProperty.call(testStatusConfig, value) ? value : "Borrador";
}

function normalizeCycleExecutionStatus(status) {
  const value = String(status || "").trim();
  if (!value) return "No ejecutado";
  const normalized = value.toLowerCase();
  if (["borrador", "no ejecutado", "no ejecutado ", "no ejecutada", "pending", "draft", "sin ejecutar", "sin ejecucion"].includes(normalized)) return "No ejecutado";
  if (["revisión", "revision", "en progreso", "en progreso ", "in progress", "en ejecucion", "ejecutando"].includes(normalized)) return "En Progreso";
  if (["fallido", "fallada", "failed"].includes(normalized)) return "Fallido";
  if (["bloqueante", "blocked"].includes(normalized)) return "Bloqueante";
  if (["no aplica", "no aplica ", "no aplica.", "no aplicable", "n/a", "na"].includes(normalized)) return "No aplica";
  if (["aprobado", "approved", "closed"].includes(normalized)) return "Aprobado";
  return Object.prototype.hasOwnProperty.call(cycleStatusConfig, value) ? value : "No ejecutado";
}

function nextTcId(tests) {
  if (!tests.length) return "TC-01";
  const nums = tests.map(t => parseInt(t.id.replace("TC-",""))||0);
  return `TC-${String(Math.max(...nums)+1).padStart(2,"0")}`;
}

function today() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

function buildIssueLogEntry(detail, estado = "Open", fecha = today(), tipo = "actualizacion") {
  const trimmed = String(detail || "").trim();
  if (!trimmed) return null;
  return { fecha, estado, tipo, detalle: trimmed };
}

function normalizeIssueBitacora(bitacora = [], issue = null) {
  const rows = Array.isArray(bitacora)
    ? bitacora.map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const item = {
          fecha: String(entry.fecha || "").trim(),
          estado: String(entry.estado || issue?.estado || "Open").trim() || "Open",
          tipo: String(entry.tipo || "actualizacion").trim() || "actualizacion",
          detalle: String(entry.detalle || entry.nota || "").trim(),
        };
        return item.detalle ? item : null;
      }).filter(Boolean)
    : [];
  if (rows.length) return rows;
  if (!issue) return [];
  const defaultRows = [];
  const createdDate = issue.fechaCreacion || today();
  const creationEntry = buildIssueLogEntry("Issue registrado", issue.estado || "Open", createdDate, "creacion");
  if (creationEntry) defaultRows.push(creationEntry);
  if (issue.fechaSolucion) {
    const closeEntry = buildIssueLogEntry("Issue marcado con fecha de solución", issue.estado || "Closed", issue.fechaSolucion, "cierre");
    if (closeEntry) defaultRows.push(closeEntry);
  }
  return defaultRows;
}

function summarizeIssueChanges(previousIssue, nextIssue) {
  if (!previousIssue || !nextIssue) return "";
  const changes = [];
  if ((previousIssue.estado || "") !== (nextIssue.estado || "")) changes.push(`Estado: ${issueStatusLabel[previousIssue.estado] || previousIssue.estado || "—"} -> ${issueStatusLabel[nextIssue.estado] || nextIssue.estado || "—"}`);
  if ((previousIssue.severidad || "") !== (nextIssue.severidad || "")) changes.push(`Severidad: ${previousIssue.severidad || "—"} -> ${nextIssue.severidad || "—"}`);
  if ((previousIssue.prioridad || "") !== (nextIssue.prioridad || "")) changes.push(`Prioridad: ${previousIssue.prioridad || "—"} -> ${nextIssue.prioridad || "—"}`);
  if ((previousIssue.fechaSolucion || "") !== (nextIssue.fechaSolucion || "")) changes.push(`Fecha solución: ${nextIssue.fechaSolucion || "—"}`);
  if ((previousIssue.modulo || "") !== (nextIssue.modulo || "")) changes.push(`Módulo actualizado: ${nextIssue.modulo || "—"}`);
  return changes.join(" | ");
}

function issueBitacoraSummary(issue) {
  const bitacora = normalizeIssueBitacora(issue?.bitacora, issue);
  const latest = bitacora[bitacora.length - 1];
  if (!latest) return "";
  return `${latest.fecha || today()} - ${latest.detalle}`;
}

function SuggestionInput({ value, onChange, options = [], placeholder, darkMode }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const IS = darkMode ? inputStyleDark : inputStyle;
  const normalizedOptions = Array.from(new Set((options || []).filter(Boolean).map(v => String(v).trim()).filter(Boolean)));

  useEffect(() => { setDraft(value || ""); }, [value]);

  const visibleOptions = open
    ? (draft.trim() ? normalizedOptions.filter(opt => opt.toLowerCase().includes(draft.toLowerCase())) : normalizedOptions)
    : [];

  const selectOption = (option) => { setDraft(option); onChange(option); setOpen(false); };

  return (
    <div style={{ position: "relative" }}>
      <input
        value={draft}
        onChange={(e) => { const next = e.target.value; setDraft(next); onChange(next); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder={placeholder}
        style={IS}
      />
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 30, maxHeight: 180, overflowY: "auto", border: darkMode ? "1px solid #3a3a3d" : "1px solid #e5e7eb", borderRadius: 10, background: darkMode ? "#1f1f22" : "#fff", boxShadow: "0 10px 24px rgba(0,0,0,0.12)" }}>
          {visibleOptions.length > 0 ? visibleOptions.map((opt) => (
            <button key={opt} type="button" onMouseDown={(e) => { e.preventDefault(); selectOption(opt); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 10px", border: "none", background: "transparent", cursor: "pointer", fontSize: 12, color: darkMode ? "#eee" : "#333" }}>
              {opt}
            </button>
          )) : (
            <div style={{ padding: "8px 10px", fontSize: 12, color: darkMode ? "#888" : "#888" }}>Sin coincidencias</div>
          )}
        </div>
      )}
    </div>
  );
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
function compressImage(dataUrl, quality = 0.7, maxWidth = 1200, maxHeight = 800) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
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

function isValidDataURL(data) {
  if (!data || typeof data !== "string") return false;
  try {
    return data.startsWith("data:") && data.includes(",") && data.length > 100;
  } catch { return false; }
}

function validateAttachmentData(attachment) {
  if (!attachment || typeof attachment !== "object") return null;
  if (!isValidDataURL(attachment.data)) {
    console.warn(`Invalid data URL for attachment: ${attachment.name}`);
    return null;
  }
  return attachment;
}

function parseSteps(value="") {
  const lines = String(value||"").split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  if (!lines.length) return [{id:1,status:"No ejecutado",text:""}];
  return lines.map((line,index)=>{
    const cleaned = line.replace(/^\s*\d+[.)]\s*/, "").trim();
    const statusMatch = cleaned.match(/^\[(.+?)\]\s*(.*)$/);
    const parsedStatus = statusMatch && statusMatch[1] ? statusMatch[1] : "No ejecutado";
    const status = normalizeCycleExecutionStatus(parsedStatus);
    const text = statusMatch ? statusMatch[2].trim() : cleaned;
    return { id:index+1, status, text };
  });
}

function serializeSteps(steps) {
  return steps.filter(s=>s.text.trim()).map((s,index)=>`${index+1}. ${s.status && s.status!=="No ejecutado" ? `[${normalizeCycleExecutionStatus(s.status)}] ` : ""}${s.text.trim()}`).join("\n");
}

function normalizeTestRecord(tc = {}) {
  const precondiciones = String(tc.precondiciones ?? tc.area ?? "").trim();
  const pasos = String(tc.pasos ?? "").trim();
  const resultado = String(tc.resultado ?? tc.descripcion ?? "").trim();
  const descripcion = String(tc.descripcion ?? tc.resultado ?? "").trim();
  return {
    ...tc,
    area: precondiciones,
    precondiciones,
    pasos,
    resultado,
    descripcion,
    estado: normalizeTestStatus(tc.estado),
  };
}

function summarizeCycleStepStatuses(steps=[]) {
  const statuses = (steps||[])
    .map(step => normalizeCycleExecutionStatus(step?.status))
    .filter(Boolean);

  if (!statuses.length) return "No ejecutado";
  if (statuses.some(status => status === "Bloqueante")) return "Bloqueante";
  if (statuses.some(status => status === "Fallido")) return "Fallido";
  if (statuses.some(status => status === "En Progreso")) return "En Progreso";
  if (statuses.every(status => status === "Aprobado")) return "Aprobado";
  if (statuses.every(status => status === "No aplica")) return "No aplica";
  if (statuses.every(status => status === "No ejecutado")) return "No ejecutado";
  return "En Progreso";
}

// ─── UI ATOMS ─────────────────────────────────────────────────────────────────
function Badge({label,color,bg}) {
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:6,padding:"3px 10px",borderRadius:999,fontSize:11,fontWeight:800,color,background:bg,border:`1px solid ${color}30`,whiteSpace:"nowrap",boxShadow:"inset 0 0 0 1px rgba(255,255,255,0.35)"}}>
      <span style={{width:8,height:8,borderRadius:"50%",background:color,boxShadow:`0 0 0 2px ${color}22`,flexShrink:0}} />
      <span>{label}</span>
    </span>
  );
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

function Modal({children,onClose,wide,preventOutsideClose,dark}) {
  return (
    <div style={{position:"fixed",inset:0,background:"#00000088",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
      onClick={preventOutsideClose ? undefined : onClose}>
      <div style={dark
        ?{background:"#111827",borderRadius:16,padding:"32px 34px",width:"100%",maxWidth:wide?920:620,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 80px #000000c0",border:"1px solid #1e2a3a",borderTop:"3px solid #F5B041"}
        :{background:"linear-gradient(135deg, #ffffff 0%, #f9fbff 100%)",borderRadius:16,padding:"32px 34px",width:"100%",maxWidth:wide?920:620,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 80px #00000030",border:"1px solid #e8f0ff"}
      } onClick={e=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
function ModalHeader({title,sub,onClose,dark}) {
  return (
    <div style={dark
      ?{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22,padding:"14px 16px",borderRadius:12,background:"rgba(245,176,65,0.07)",border:"1px solid rgba(245,176,65,0.18)"}
      :{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22,padding:"14px 16px",borderRadius:14,background:"linear-gradient(90deg, rgba(192,57,43,0.10) 0%, rgba(192,57,43,0.03) 100%)",border:"1px solid rgba(192,57,43,0.14)",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.7)"}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
        <div style={{width:10,height:40,borderRadius:999,background:dark?"linear-gradient(180deg,#F5B041 0%,#F39C12 100%)":"linear-gradient(180deg, #C0392B 0%, #E74C3C 100%)",boxShadow:dark?"0 0 0 4px rgba(245,176,65,0.15)":"0 0 0 4px rgba(192,57,43,0.12)"}}/>
        <div>
          <h3 style={{margin:0,fontSize:18,fontWeight:800,color:dark?"#f4f7fb":"var(--text-primary,#1a1a1a)"}}>{title}</h3>
          {sub&&<p style={{margin:"4px 0 0",fontSize:12,color:dark?"#8a9bb0":"#6b7280",fontWeight:600}}>{sub}</p>}
        </div>
      </div>
      <button onClick={onClose} style={dark
        ?{background:"#1e2a3a",border:"1px solid #2a3a4a",borderRadius:10,padding:"6px 11px",cursor:"pointer",fontSize:16,color:"#8a9bb0"}
        :{background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,padding:"6px 11px",cursor:"pointer",fontSize:16,color:"#6b7280",boxShadow:"0 2px 6px rgba(0,0,0,0.04)"}}>✕</button>
    </div>
  );
}

// ─── ATTACHMENT ZONE ──────────────────────────────────────────────────────────
function AttachmentZone({attachments,onChange,imagesOnly}) {
  const fileRef=useRef();
  const [dragging,setDragging]=useState(false);
  
  // Filter out invalid attachments
  const validAttachments = (attachments || []).filter(att => {
    if (!att || typeof att !== "object") return false;
    if (!isValidDataURL(att.data)) {
      console.warn(`Skipping invalid attachment: ${att.name}`);
      return false;
    }
    return true;
  });
  
  async function handleFiles(files) {
    const exts=imagesOnly?["png","jpg","jpeg"]:["png","jpg","jpeg","gif","webp","doc","docx","pdf"];
    const arr=Array.from(files).filter(f=>{ const ext=f.name.split(".").pop().toLowerCase(); return exts.includes(ext); });
    const limited=imagesOnly?arr.slice(0,Math.max(0,5-validAttachments.length)):arr;
    const processed=await Promise.all(limited.map(async f=>({name:f.name,type:f.type,size:f.size,data:await readFileAsDataURL(f)})));
    onChange([...validAttachments,...processed]);
  }
  function remove(i){onChange(validAttachments.filter((_,idx)=>idx!==i));}
  function download(att){const a=document.createElement("a");a.href=att.data;a.download=att.name;a.click();}
  return (
    <div>
      {imagesOnly && validAttachments.length>0 ? (
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {validAttachments.map((att,i)=>(
            <div key={i} style={{position:"relative",borderRadius:8,overflow:"hidden",display:"inline-block"}}>
              <img src={att.data} alt={att.name} style={{width:110,height:78,objectFit:"cover",display:"block",borderRadius:8}}/>
              <button onClick={()=>remove(i)} style={{position:"absolute",inset:0,width:"100%",height:"100%",background:"rgba(0,0,0,0.45)",border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",borderRadius:8,letterSpacing:"0.04em"}}>Quitar</button>
            </div>
          ))}
          {validAttachments.length<5&&(
            <div onClick={()=>fileRef.current.click()} style={{width:110,height:78,border:"2px dashed #555",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#888",fontSize:22}}>+</div>
          )}
        </div>
      ) : (
        <div onClick={()=>fileRef.current.click()} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);handleFiles(e.dataTransfer.files);}}
          style={{border:`2px dashed ${dragging?BRAND:"#555"}`,borderRadius:8,padding:"18px 14px",textAlign:"center",cursor:"pointer",background:dragging?BRAND_LIGHT:"transparent",transition:"all 0.2s"}}>
          {imagesOnly
            ?<div style={{fontSize:11,color:"#888",letterSpacing:"0.06em",textTransform:"uppercase"}}>Clic para adjuntar capturas (PNG/JPG, máx. 5 imágenes)</div>
            :(<><div style={{fontSize:20}}>📎</div><div style={{fontSize:12,color:"#888",marginTop:3}}>Arrastra o haz clic para adjuntar</div><div style={{fontSize:11,color:"#bbb",marginTop:2}}>Imágenes · Word · PDF</div></>)}
        </div>
      )}
      <input ref={fileRef} type="file" multiple accept={imagesOnly?".png,.jpg,.jpeg":".png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.pdf"} style={{display:"none"}} onChange={e=>handleFiles(e.target.files)}/>
      {!imagesOnly&&validAttachments.length>0&&(
        <div style={{marginTop:8,display:"flex",flexWrap:"wrap",gap:7}}>
          {validAttachments.map((att,i)=>{
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
  const validAttachments = (attachments || []).filter(att => isValidDataURL(att?.data));
  if(!validAttachments.length) return <span style={{fontSize:12,color:"#bbb"}}>Sin adjuntos</span>;
  function download(att){const a=document.createElement("a");a.href=att.data;a.download=att.name;a.click();}
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
      {validAttachments.map((att,i)=>{
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

function buildAiProposal(tc, prompt = "") {
  if(!tc) return null;
  const area = tc.area || tc.proceso || "General";
  const baseNum = parseInt(String(tc.id).match(/(\d+)/)?.[1] || "0", 10) || 1;
  const areaKey = String(area).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "").slice(0,3).toUpperCase() || "GEN";
  const suggestedId = `TC-${String(baseNum).padStart(2, "0")}-${areaKey}`;

  const normalizeStep = (step) => String(step || '').replace(/^\s*\d+[.)\-]*\s*/, '').trim();
  const rawSteps = String(tc.pasos || '').split(/\r?\n/).map(s => normalizeStep(s)).filter(Boolean);
  const comments = (tc.comentarios||[]).map(c=>c.texto).slice(-3);
  const historyNotes = (tc.historial||[]).slice(-3).map(h=>h.nota).filter(Boolean);
  const attachments = (tc.attachments||[]).map(a=>a.name).slice(0,3);
  const promptText = String(prompt || '').toLowerCase();
  const scenarioText = [tc.escenario, tc.descripcion, area, tc.proceso, promptText].filter(Boolean).join(' ').toLowerCase();

  const templates = [
    {
      keywords: ['login', 'usuario', 'contraseña', 'ingresar al sistema', 'acceder'],
      steps: [
        'Abrir la pantalla de acceso e ingresar credenciales válidas.',
        'Verificar que el acceso sea exitoso y que se muestre la pantalla principal.',
        'Comprobar que no se muestren errores de autenticación.'
      ],
      result: 'El usuario logra acceder correctamente y se muestra la pantalla inicial sin errores.'
    },
    {
      keywords: ['orden de compra', 'generar la orden de compra', 'generar orden de compra', 'pedido de compra', 'compra de materiales'],
      steps: [
        'Abrir el módulo de órdenes de compra y comenzar la generación de una nueva orden.',
        'Ingresar el proveedor, los artículos, las cantidades y los precios correctos.',
        'Revisar el resumen de la orden antes de confirmar para verificar los datos en pantalla.',
        'Generar la orden y comprobar que el número de orden se crea y los totales son correctos.'
      ],
      result: 'La orden de compra se genera con los datos correctos, el proveedor y los totales son coherentes, y se crea un número de orden válido.'
    },
    {
      keywords: [
        'recepcion de mercancia',
        'recepción de mercancía',
        'recepcion de mercancia',
        'recepción de mercancia',
        'recepcion de mercaderia',
        'recepción de mercadería',
        'ingreso de mercancia',
        'entrada de mercancia',
        'recepcion oc',
        'recepción oc'
      ],
      steps: [
        'Ingresar al módulo de recepción y buscar la orden de compra por número de OC.',
        'Validar que la OC esté aprobada y vigente, y que el proveedor coincida con el documento de entrega.',
        'Registrar la recepción de mercancía capturando cantidades recibidas por ítem y lote/serie cuando aplique.',
        'Comparar cantidad recibida vs cantidad ordenada y validar reglas de tolerancia (faltantes, excedentes o recepción parcial).',
        'Guardar la recepción y verificar que se genere el comprobante/documento de entrada con número y fecha.',
        'Confirmar impacto en inventario y estado de la OC (parcial/completa), sin errores ni diferencias pendientes no justificadas.'
      ],
      result: 'La recepción queda registrada contra la OC correcta, con cantidades y proveedor consistentes, se genera el comprobante de entrada y el inventario/estado documental se actualiza correctamente.'
    }
  ];

  function matchesKeyword(text, keyword) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
  }

  function inferStepsFromTitle(title) {
    const text = String(title || '').trim();
    const normalized = text.toLowerCase();
    const titleLabel = text || 'el caso de prueba';

    const actionGroups = [
      {
        verbs: ['verificar', 'comprobar', 'validar', 'confirmar'],
        steps: [
          `Abrir el módulo o pantalla relacionada con ${titleLabel}.`,
          'Revisar la información o datos mostrados en pantalla.',
          'Verificar que los valores sean correctos y consistentes con los criterios de negocio.',
          'Confirmar que no haya errores ni discrepancias en los datos.'
        ],
        result: `Los datos relacionados con ${titleLabel} son correctos, coherentes y se muestran sin errores.`
      },
      {
        verbs: ['crear', 'generar', 'registrar', 'guardar', 'agregar'],
        steps: [
          `Abrir el módulo o formulario de ${titleLabel}.`,
          'Completar los campos obligatorios con datos válidos.',
          'Enviar la información y guardar el registro.',
          'Verificar que el elemento se haya creado correctamente y sea visible en el sistema.'
        ],
        result: `El proceso de ${titleLabel} concluye correctamente y el registro queda creado sin errores.`
      },
      {
        verbs: ['editar', 'modificar', 'actualizar', 'cambiar'],
        steps: [
          `Seleccionar el elemento o registro de ${titleLabel}.`,
          'Modificar los valores necesarios en el formulario.',
          'Guardar los cambios.',
          'Verificar que los cambios se reflejen correctamente en la interfaz.'
        ],
        result: `Los cambios relacionados con ${titleLabel} se guardan correctamente y se muestran sin inconsistencias.`
      },
      {
        verbs: ['eliminar', 'borrar', 'anular', 'cancelar'],
        steps: [
          `Seleccionar el elemento o registro vinculado a ${titleLabel}.`,
          'Iniciar la acción de eliminación y confirmarla.',
          'Verificar que el registro desaparezca o cambie de estado según corresponda.',
          'Confirmar que no se generen errores durante la operación.'
        ],
        result: `El proceso de ${titleLabel} se completa correctamente y el registro queda eliminado o anulado según lo esperado.`
      },
      {
        verbs: ['consultar', 'buscar', 'filtrar', 'listar', 'ver'],
        steps: [
          `Acceder al módulo o informe relacionado con ${titleLabel}.`,
          'Ingresar criterios de búsqueda o filtros adecuados.',
          'Ejecutar la búsqueda y revisar los resultados mostrados.',
          'Seleccionar datos relevantes y comprobar su consistencia.'
        ],
        result: `La consulta de ${titleLabel} muestra resultados consistentes y relevantes.`
      }
    ];

    const matched = actionGroups.find(group => group.verbs.some(verb => matchesKeyword(normalized, verb)));
    if (matched) return matched;

    return {
      steps: [
        `Abrir el módulo o pantalla correspondiente a ${titleLabel}.`,
        `Realizar la acción principal descrita en el título: ${titleLabel}.`,
        'Verificar que los resultados sean correctos y consistentes.',
        'Confirmar que no aparezcan errores visibles.'
      ],
      result: `La acción de ${titleLabel} se ejecuta correctamente y el sistema responde sin errores.`
    };
  }

  function pickRandom(arr, n=3) {
    const copy = [...arr];
    const out = [];
    while(out.length<n && copy.length) {
      const i = Math.floor(Math.random() * copy.length);
      out.push(copy.splice(i,1)[0]);
    }
    return out;
  }

  const matchingTemplate = templates.find(t => t.keywords.some(k => matchesKeyword(scenarioText, k)));
  const defaultSteps = [
    `Navegar al módulo relacionado con ${tc.escenario || 'el caso seleccionado'}.`,
    `Ejecutar la acción principal descrita en el escenario: ${tc.descripcion || 'seguir el flujo definido'}.`,
    'Verificar que el resultado se muestre correctamente y no haya errores visibles.'
  ];
  const scenarioSteps = matchingTemplate ? matchingTemplate.steps : defaultSteps;
  const scenarioResult = matchingTemplate ? matchingTemplate.result : 'La operación se completa correctamente y el resultado es consistente con las expectativas.';

  const chosenSteps = rawSteps.length
    ? rawSteps.slice(0, 3).map(s => s.replace(/\.$/, ''))
    : (matchingTemplate ? scenarioSteps.slice(0, 6) : pickRandom(scenarioSteps, 3));
  const extraSteps = matchingTemplate
    ? []
    : pickRandom(scenarioSteps.filter(s => !chosenSteps.includes(s)), 2);
  const validationSteps = [
    'Verificar que no aparezcan mensajes de error durante el proceso.',
    'Confirmar que los datos se guardan correctamente y son consistentes.',
    'Comprobar que el resultado final sea el esperado y que no haya incongruencias.'
  ];
  const enrichedSteps = [...chosenSteps, ...extraSteps.slice(0, 2)].map(s => s.trim()).filter(Boolean);

  const expectedResult = tc.resultado
    ? `${tc.resultado}. Además: ${scenarioResult}`
    : `${scenarioResult}`;

  const opening = pickRandom([`
Revisé el caso ${tc.id} y te propongo estos pasos específicos para el escenario.`,
      `A continuación te presento una versión más concreta para el caso ${tc.id}.`,
      `He generado pasos más enfocados al escenario del caso ${tc.id}.`], 1)[0];
  const contextBits = [];
  if(comments.length) contextBits.push(`Comentarios recientes: ${comments.join(' | ')}`);
  if(historyNotes.length) contextBits.push(`Historial: ${historyNotes.join(' | ')}`);
  if(attachments.length) contextBits.push(`Adjuntos: ${attachments.join(', ')}`);

  const responseParts = [
    opening.trim(),
    `ID sugerido: ${suggestedId}`,
    `Contexto: ${contextBits.join(' · ') || 'Sin contexto adicional'}`,
    `Pasos sugeridos:\n${enrichedSteps.map((s, index) => `${index + 1}. ${s}`).join("\n")}`,
    `Resultado esperado mejorado:\n${expectedResult}`,
    'Notas: intenta usar datos concretos y validar los resultados con comprobaciones específicas.'
  ];

  return { suggestedId, enrichedSteps, expectedResult, response: responseParts.join("\n\n") };
}

function parseAiProposal(text, tc) {
  const fallback = buildAiProposal(tc);

  // Try JSON first (if model returned a structured payload)
  try{
    const maybeJson = JSON.parse(text);
    const suggestedId = (maybeJson.suggestedId || maybeJson.id || fallback.suggestedId || tc.id).toString().trim();
    const enrichedSteps = (maybeJson.steps || maybeJson.pasos || []).map(s=>String(s).trim()).filter(Boolean);
    const expectedResult = (maybeJson.expectedResult || maybeJson.resultado || fallback.expectedResult || "").toString().trim();
    return { suggestedId, enrichedSteps: enrichedSteps.length?enrichedSteps: fallback.enrichedSteps, expectedResult, response: text };
  }catch(e){/* not json */}

  // Generic regex extraction with multiple label variants
  const suggestedId = (text.match(/ID\s*(?:SUGERIDO)?:?\s*[:\-–]?\s*(.+)/i)?.[1]
    || text.match(/SUGERIDO ID:\s*(.+)/i)?.[1]
    || text.match(/ID:\s*(.+)/i)?.[1]
    || fallback?.suggestedId || tc.id || "").toString().trim();

  const stepsSection = text.match(/(?:PASOS|PASOS SUGERIDOS|STEPS):\s*([\s\S]*?)(?:RESULTADO|RESULTADO ESPERADO|EXPECTED RESULT:|$)/i)?.[1] || "";
  let enrichedSteps = [];
  if(stepsSection){
    enrichedSteps = stepsSection.split(/\n/).map(s=>s.replace(/^\s*[-\d\.\)\*]+\s*/, "").trim()).filter(Boolean);
  }

  let expectedResult = text.match(/(?:RESULTADO ESPERADO|RESULTADO|EXPECTED RESULT):\s*([\s\S]*)$/i)?.[1] || "";
  expectedResult = expectedResult.trim() || fallback?.expectedResult || "";

  return {
    suggestedId,
    enrichedSteps: enrichedSteps.length ? enrichedSteps : fallback?.enrichedSteps || [],
    expectedResult: expectedResult || fallback?.expectedResult || "",
    response: text.trim() || fallback?.response || ""
  };
}

function normalizeN8nResponse(data) {
  if (Array.isArray(data)) {
    if (data.length === 0) return data;
    if (data[0] && typeof data[0] === 'object' && data[0].json) return data[0].json;
    return data[0];
  }

  if (data && typeof data === 'object') {
    if (data.json && typeof data.json === 'object') {
      return data.json;
    }
    if (data.body && typeof data.body === 'object') {
      return data.body;
    }
    const choices = data.choices || (data.raw?.choices);
    const content = choices?.[0]?.message?.content || choices?.[0]?.text;
    if (typeof content === 'string') {
      try {
        return JSON.parse(content);
      } catch (e) {
        return { rawContent: content, original: data };
      }
    }
  }

  return data;
}

function extractTextValue(value) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
  if (value && typeof value === 'object') {
    return extractTextValue(value.descripcion || value.description || value.texto || value.text || value.resultado || value.result || '');
  }
  return '';
}

function extractTextArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(item => extractTextValue(item)).filter(Boolean);
  }
  return [extractTextValue(value)].filter(Boolean);
}

function parseN8nProposal(data, tc) {
  const fallback = buildAiProposal(tc);
  const suggestedId = String(data.suggestedId || data.id || tc.id || fallback.suggestedId || tc.id).trim();

  const enrichedSteps = Array.isArray(data.pasos_sugeridos)
    ? data.pasos_sugeridos.map(item => extractTextValue(item)).filter(Boolean)
    : Array.isArray(data.pasos)
      ? data.pasos.map(item => extractTextValue(item)).filter(Boolean)
      : fallback.enrichedSteps;

  const expectedResult = extractTextValue(
    data.resultado_esperado_sugerido ||
    data.expectedResult ||
    data.resultado_esperado ||
    data.resultado ||
    fallback.expectedResult ||
    ''
  );

  const precondiciones = Array.isArray(data.precondiciones_sugeridas)
    ? data.precondiciones_sugeridas.map(item => extractTextValue(item)).filter(Boolean)
    : Array.isArray(data.precondiciones)
      ? data.precondiciones.map(item => extractTextValue(item)).filter(Boolean)
      : (data.precondiciones ? [extractTextValue(data.precondiciones)].filter(Boolean) : []);

  return {
    suggestedId,
    enrichedSteps: enrichedSteps.length ? enrichedSteps : fallback.enrichedSteps,
    expectedResult: expectedResult || fallback.expectedResult,
    precondiciones,
    response: JSON.stringify(data, null, 2)
  };
}

function buildDefaultPrompt(tc, intent = "Mejorá este caso") {
  if(!tc) return "";
  const title = tc.escenario ? `${tc.escenario}` : "el caso seleccionado";
  const description = tc.descripcion ? `Descripción: ${tc.descripcion}` : "";
  const comments = (tc.comentarios||[]).slice(-2).map(c=>`- ${c.fecha||""}: ${c.texto||c}`).join("\n");
  const history = (tc.historial||[]).slice(-2).map(h=>`- ${h.fecha||""}: ${h.nota||`${h.de} → ${h.a}`}`).join("\n");
  const context = [description, comments ? `Comentarios recientes:\n${comments}` : "", history ? `Historial reciente:\n${history}` : ""].filter(Boolean).join("\n\n");
  return `${intent} ${tc.id} (${title}).\n${context ? context + "\n\n" : ""}Enfócate en generar pasos claros, validaciones y un resultado esperado más preciso.`;
}

async function getAiProposal(tc, userPrompt, mode = 'mejorar_todo') {
  try {
    const pasosActuales = (tc.pasos || '').toString().split('\n').map(s => s.trim()).filter(Boolean);
    const payload = {
      caso_id: tc.id,
      modo: mode,
      titulo_descripcion: tc.escenario || tc.descripcion || '',
      pasos_actuales: pasosActuales,
      resultado_esperado_actual: tc.resultado || '',
      precondiciones_actuales: tc.precondiciones || tc.area || '',
      instrucciones_usuario: userPrompt || ''
    };

    const res = await fetch('/api/mejorar-caso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const bodyText = await res.text();
      console.error('getAiProposal: /api/mejorar-caso HTTP error', res.status, res.statusText, bodyText);
      throw new Error(`Webhook falló: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log('getAiProposal: /api/mejorar-caso response', data, { payload });
    const normalized = normalizeN8nResponse(data);
    console.log('getAiProposal: normalized webhook data', normalized);

    if (normalized && normalized.ok === false) {
      console.warn('getAiProposal: webhook responded ok:false', normalized);
      throw new Error(normalized.error || 'Respuesta del webhook no OK');
    }

    const proposal = parseN8nProposal(normalized, tc);
    console.log('getAiProposal: parsed proposal', proposal);
    return proposal;
  } catch (e) {
    console.warn('n8n webhook failed:', e?.message || e);
  }

  return buildAiProposal(tc, userPrompt);
}

function AiAssistantPanel({ tests, selectedTc, onSelectTc, onApplyProposal, darkMode }) {
  const [prompt, setPrompt] = useState("");
  const [promptMode, setPromptMode] = useState("predeterminado");
  const [messages, setMessages] = useState([]);
  const [activeProposal, setActiveProposal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [applyId, setApplyId] = useState(false);
  const [applySteps, setApplySteps] = useState(true);
  const [applyResult, setApplyResult] = useState(true);
  const [drafts, setDrafts] = useState([]);
  const [caseSearch, setCaseSearch] = useState("");
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const [showFullDiff, setShowFullDiff] = useState(false);
  const [fullDiffDocked, setFullDiffDocked] = useState(false);
  const [applyPrecondiciones, setApplyPrecondiciones] = useState(false);

  const filteredTests = tests.filter(tc => {
    const q = caseSearch.trim().toLowerCase();
    if (!q) return true;
    return [tc.id, tc.escenario, tc.descripcion].filter(Boolean).some(text => text.toLowerCase().includes(q));
  });

  // compute quick diff flags for preview highlighting
  const previewIdChanged = selectedTc && activeProposal && activeProposal.suggestedId && (selectedTc.id !== activeProposal.suggestedId);
  const previewStepsChanged = selectedTc && activeProposal && activeProposal.enrichedSteps && (((selectedTc.pasos||"").toString().trim()) !== (activeProposal.enrichedSteps.join("\n")||"").toString().trim());
  const previewResultChanged = selectedTc && activeProposal && (((selectedTc.resultado||"").toString().trim()) !== ((activeProposal.expectedResult||"").toString().trim()));

  useEffect(() => {
    if (!selectedTc) {
      setMessages([]);
      setActiveProposal(null);
      setPrompt("");
      return;
    }
    setApplyId(false);
    setApplySteps(true);
    setApplyResult(true);
    setApplyPrecondiciones(false);
    setActiveProposal(null);
    setMessages([]);
    setPromptMode("predeterminado");
    setPrompt(buildDefaultPrompt(selectedTc));
  }, [selectedTc?.id]);

  useEffect(() => {
    if (activeProposal) {
      setApplySteps(true);
      setApplyResult(true);
      setApplyPrecondiciones(Boolean(activeProposal.precondiciones?.length));
      // Keep ID unchecked by default to avoid accidental renames.
      setApplyId(false);
    }
  }, [activeProposal]);

  function handleRequestApply() {
    if (!activeProposal || !selectedTc) return;
    setShowApplyConfirm(true);
  }

  function handleConfirmApply() {
    if (!activeProposal || !selectedTc) return;
    const opts = { applyId, applySteps, applyResult, applyPrecondiciones };
    try {
      if (onApplyProposal) onApplyProposal(activeProposal, opts);
      // add a comment to the case with a short note of the applied fields
      try { addComment(selectedTc.id, `Aplicada propuesta IA: ${[opts.applyId?"ID":"", opts.applySteps?"Pasos":"", opts.applyResult?"Resultado":"", opts.applyPrecondiciones?"Precondiciones":""].filter(Boolean).join(", ") || "(ninguno)"}`); } catch(e) {}
      setMessages(prev => [...prev, { role: "system", text: `Se aplicaron: ${[applyId?"ID":"", applySteps?"Pasos":"", applyResult?"Resultado":"", applyPrecondiciones?"Precondiciones":""].filter(Boolean).join(", ") || "(ninguno)"}` }]);
      // clear active proposal and reset selections
      setActiveProposal(null);
      setApplyId(false);
      setApplySteps(true);
      setApplyResult(true);
      setApplyPrecondiciones(false);
      setPrompt(selectedTc ? buildDefaultPrompt(selectedTc) : "");
    } catch (e) {
      setMessages(prev => [...prev, { role: "system", text: `Error al aplicar la propuesta: ${e?.message||e}` }]);
    } finally {
      setShowApplyConfirm(false);
    }
  }

  function renderLinesDiff(currentText, proposedLines) {
    const curr = (currentText||"").toString().split('\n').map(s=>s.replace(/\s+$/,'').replace(/^\s+/,'')).filter(()=>true);
    const prop = (proposedLines||[]).map(s=>s.toString());
    const max = Math.max(curr.length, prop.length);
    return (
      <div style={{fontSize:12,marginTop:8}}>
        {Array.from({length:max}).map((_,i)=>{
          const c = (curr[i]||"").toString();
          const p = (prop[i]||"").toString();
          const same = c === p;
          const added = !c && p;
          const removed = c && !p;
          const changed = !same && c && p;
          const bg = same ? 'transparent' : (added ? (darkMode? '#083a1a' : '#e6ffed') : removed ? (darkMode? '#3a1010' : '#fff1f0') : (darkMode? '#2b3a2b' : '#fff7e6'));
          const color = same ? (darkMode? '#ddd' : '#222') : (added? (darkMode? '#a7f0bf' : '#036a1a') : removed? (darkMode? '#ffb4b4' : '#9b1c1c') : (darkMode? '#ffdca8' : '#8a5b00'));
          const sign = added ? '+' : removed ? '−' : changed ? '±' : ' ';
          return (
            <div key={i} style={{display:'flex',gap:8,alignItems:'flex-start',marginBottom:6}}>
              <div style={{width:18,flex:'0 0 18px',textAlign:'center',color:color,fontWeight:700}}>{sign}</div>
              <pre style={{margin:0,whiteSpace:'pre-wrap',lineHeight:1.4,background:bg,padding: same ? 0 : '6px 8px',borderRadius:6,color:color,fontFamily:'inherit',flex:1}}>{p || c}</pre>
            </div>
          );
        })}
      </div>
    );
  }

  async function sendAiPrompt(userText, mode) {
    if (!selectedTc || !userText.trim()) return null;
    setMessages(prev => [...prev, { role: "user", text: userText }]);
    setLoading(true);
    setError("");

    try {
      const proposal = await getAiProposal(selectedTc, userText, mode);
      setMessages(prev => [...prev, { role: "assistant", text: proposal.response, proposal }]);
      setActiveProposal(proposal);
      return proposal;
    } catch (err) {
      const msg = `No pude contactar al asistente local: ${err?.message || "error desconocido"}`;
      setMessages(prev => [...prev, { role: "assistant", text: msg }]);
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!selectedTc || !prompt.trim()) return;
    await sendAiPrompt(prompt.trim(), promptMode);
    setPrompt("");
  }

  

  async function quickPrompt(action, autoSend = false) {
    if (!selectedTc) return;
    const intentMap = {
      predeterminado: {
        prompt: buildDefaultPrompt(selectedTc),
        mode: 'predeterminado'
      },
      pasos: {
        prompt: `Refina los pasos del caso ${selectedTc.id} y agrega validaciones claras.`,
        mode: 'refinar_pasos'
      },
      resultado: {
        prompt: `Aclará el resultado esperado del caso ${selectedTc.id} para que sea más preciso.`,
        mode: 'mejorar_resultado'
      },
      completo: {
        prompt: `Mejorá el caso ${selectedTc.id}: revisá la descripción, completá los pasos con validaciones y refiná el resultado esperado.`,
        mode: 'mejorar_todo'
      },
      
    };
    const selected = intentMap[action] || { prompt: buildDefaultPrompt(selectedTc), mode: 'predeterminado' };
    setPrompt(selected.prompt);
    setPromptMode(selected.mode);
    if (autoSend) {
      await sendAiPrompt(selected.prompt, selected.mode);
      setPrompt("");
    }
  }

  function saveDraft() {
    if (!activeProposal || !selectedTc) return;
    const draft = {
      id: Date.now().toString(),
      title: `${selectedTc.id} - ${selectedTc.escenario || 'Borrador'}`,
      date: today(),
      caseId: selectedTc.id,
      proposal: activeProposal,
      prompt,
    };
    setDrafts(prev => [draft, ...prev]);
  }

  function restoreDraft(draft) {
    setActiveProposal(draft.proposal);
    setPrompt(draft.prompt || "");
    if (draft.caseId && tests.some(tc => tc.id === draft.caseId)) {
      const tc = tests.find(tc => tc.id === draft.caseId);
      onSelectTc(tc);
    }
  }

  function deleteDraft(draftId) {
    setDrafts(prev => prev.filter(d => d.id !== draftId));
  }

  return (
    <div style={{background:darkMode?"#1C1C1E":"#fff",borderRadius:14,padding:16,border:`1px solid ${darkMode?"#2a2a2a":"#f0f0f0"}`,boxShadow:"0 1px 8px #0000000a"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:13,fontWeight:800,color:darkMode?"#eee":"#1a1a1a"}}>🤖 Asistente IA para mejorar casos</div>
          <div style={{fontSize:11,color:darkMode?"#888":"#666",marginTop:3}}>Revisa el ID, agrega pasos y mejora el resultado esperado.</div>
        </div>
        <select value={selectedTc?.id || ""} onChange={e=>{
          const tc = tests.find(t=>t.id===e.target.value);
          if (tc) {
            onSelectTc(tc);
          } else {
            onSelectTc(null);
          }
        }} style={{...inputStyle, width:180, background:darkMode?"#2C2C2E":"#fff", color:darkMode?"#eee":"#1a1a1a", border:darkMode?"1px solid #444":"1px solid #e0e0e0"}}>
          <option value="">Selecciona un caso</option>
          {tests.map(tc=><option key={tc.id} value={tc.id}>{tc.id} · {tc.escenario}</option>)}
        </select>
      </div>
        {selectedTc && (
          <div style={{marginTop:12,padding:14,borderRadius:14,background:darkMode?"#171717":"#fafafa",border:`1px solid ${darkMode?"#333":"#e6e6e6"}`}}>
            <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
              <div style={{flex:"1 1 240px"}}>
                <div style={{fontSize:12,color:darkMode?"#bbb":"#666",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700,marginBottom:6}}>Caso seleccionado</div>
                <div style={{fontSize:14,fontWeight:800,color:darkMode?"#fff":"#1a1a1a"}}>{selectedTc.id} · {selectedTc.escenario}</div>
                {/* descripción oculta en esta vista por solicitud del usuario */}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2, minmax(120px, 1fr))",gap:10,marginTop:selectedTc?8:0}}>
                <div style={{padding:10,borderRadius:10,background:darkMode?"#232323":"#fff",border:`1px solid ${darkMode?"#333":"#e8e8e8"}`}}>
                  <div style={{fontSize:10,color:darkMode?"#888":"#777",textTransform:"uppercase",fontWeight:700,marginBottom:4}}>Estado</div>
                  <div style={{fontSize:13,fontWeight:700,color:darkMode?"#fff":"#1a1a1a"}}>{selectedTc.estado}</div>
                </div>
                <div style={{padding:10,borderRadius:10,background:darkMode?"#232323":"#fff",border:`1px solid ${darkMode?"#333":"#e8e8e8"}`}}>
                  <div style={{fontSize:10,color:darkMode?"#888":"#777",textTransform:"uppercase",fontWeight:700,marginBottom:4}}>Asignado a</div>
                  <div style={{fontSize:13,fontWeight:700,color:darkMode?"#fff":"#1a1a1a"}}>{selectedTc.asignadoA || "—"}</div>
                </div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:14}}>
              <div style={{padding:12,borderRadius:12,background:darkMode?"#141414":"#fff",border:`1px solid ${darkMode?"#2b2b2b":"#f0f0f0"}`,fontSize:12,color:darkMode?"#ddd":"#444"}}>
                <div style={{fontSize:11,color:darkMode?"#888":"#777",fontWeight:700,textTransform:"uppercase",marginBottom:6}}>Pasos actuales</div>
                <pre style={{margin:0,fontFamily:"inherit",whiteSpace:"pre-wrap",lineHeight:1.5}}>{selectedTc.pasos || "(sin pasos)"}</pre>
              </div>
              <div style={{padding:12,borderRadius:12,background:darkMode?"#141414":"#fff",border:`1px solid ${darkMode?"#2b2b2b":"#f0f0f0"}`,fontSize:12,color:darkMode?"#ddd":"#444"}}>
                <div style={{fontSize:11,color:darkMode?"#888":"#777",fontWeight:700,textTransform:"uppercase",marginBottom:6}}>Resultado esperado</div>
                <div style={{lineHeight:1.6}}>{selectedTc.resultado || "(sin resultado esperado)"}</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:14}}>
              <div style={{padding:12,borderRadius:12,background:darkMode?"#141414":"#fff",border:`1px solid ${darkMode?"#2b2b2b":"#f0f0f0"}`,fontSize:12,color:darkMode?"#ddd":"#444"}}>
                <div style={{fontSize:11,color:darkMode?"#888":"#777",fontWeight:700,textTransform:"uppercase",marginBottom:6}}>Comentarios recientes</div>
                <div style={{whiteSpace:"pre-wrap",lineHeight:1.5}}>{(selectedTc.comentarios||[]).slice(-3).map(c=>`${c.fecha||""}: ${c.texto||c}`).join("\n") || "(sin comentarios)"}</div>
              </div>
              <div style={{padding:12,borderRadius:12,background:darkMode?"#141414":"#fff",border:`1px solid ${darkMode?"#2b2b2b":"#f0f0f0"}`,fontSize:12,color:darkMode?"#ddd":"#444"}}>
                <div style={{fontSize:11,color:darkMode?"#888":"#777",fontWeight:700,textTransform:"uppercase",marginBottom:6}}>Historial reciente</div>
                <div style={{whiteSpace:"pre-wrap",lineHeight:1.5}}>{(selectedTc.historial||[]).slice(-3).map(h=>`${h.fecha||""}: ${h.nota||""}`).join("\n") || "(sin historial)"}</div>
              </div>
            </div>
            <div style={{marginTop:14,fontSize:12,color:darkMode?"#aaa":"#666"}}>
              Adjuntos: {(selectedTc.attachments||[]).map(a=>a.name).join(", ") || "Ninguno"}
            </div>
          </div>
        )}
      <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:8,maxHeight:220,overflowY:"auto",paddingRight:4}}>
        {messages.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"100%",background:m.role==="user"?(darkMode?"#C0392B":"#FADBD8"):(darkMode?"#232323":"#f7f7f7"),color:m.role==="user"?"#fff":(darkMode?"#eee":"#444"),borderRadius:12,padding:"10px 12px",fontSize:12,lineHeight:1.5,whiteSpace:"pre-wrap",border:m.role==="user"?"none":`1px solid ${darkMode?"#333":"#eaeaea"}`}}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:8}}>
        <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={4} placeholder="Usa el prompt predeterminado o escribe qué querés mejorar." style={{...inputStyle, resize:"vertical", background:darkMode?"#2C2C2E":"#fff", color:darkMode?"#eee":"#1a1a1a", border:darkMode?"1px solid #444":"1px solid #e0e0e0"}}/>
        <div style={{display:"flex",justifyContent:"flex-start",gap:8,flexWrap:"wrap"}}>
          <Btn small onClick={handleSend} disabled={!selectedTc || !prompt.trim() || loading}>{loading ? "Enviando..." : "Enviar a IA"}</Btn>
          <Btn small variant="ghost" onClick={()=>quickPrompt('predeterminado')}>Predeterminado</Btn>
          <Btn small variant="ghost" onClick={()=>quickPrompt('pasos')}>Refinar pasos</Btn>
          <Btn small variant="ghost" onClick={()=>quickPrompt('resultado')}>Mejorar resultado</Btn>
          <Btn small variant="ghost" onClick={()=>quickPrompt('completo', true)}>Mejorar todo</Btn>
          
        </div>
        <div style={{display:"flex",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
          <Btn small variant="ghost" onClick={()=>{setMessages([]);setActiveProposal(null);setPrompt(selectedTc ? buildDefaultPrompt(selectedTc) : "");setError("");}}>Limpiar</Btn>
          <div style={{fontSize:11,color:darkMode?"#bbb":"#666",alignSelf:"center"}}>La IA usa el proxy interno: si configuras credenciales, consulta un modelo real (GitHub Models/OpenAI/Azure).</div>
        </div>
        {/* El proxy puede usar IA real por API o fallback local/mock según configuración. */}
        {error&&(<div style={{fontSize:11,color:darkMode?"#f8b4b4":"#b91c1c"}}>{error}</div>)}
      </div>

      {activeProposal&&selectedTc&&(
        <div style={{marginTop:12,padding:12,borderRadius:12,background:darkMode?"#232323":"#FDF2F2",border:`1px solid ${darkMode?"#333":"#f3d7d7"}`}}>
          <div style={{fontSize:12,fontWeight:800,color:darkMode?"#eee":"#7f1d1d",marginBottom:8}}>Propuesta lista para aplicar</div>
          <div style={{display:"grid",gap:8}}>
            <div style={{background:darkMode?"#1d1d1d":"#fff",borderRadius:8,padding:"8px 10px",border:`1px solid ${darkMode?"#333":"#f0dada"}`}}>
              <div style={{fontSize:10,color:darkMode?"#888":"#777",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:800}}>ID sugerido</div>
              <div style={{fontSize:13,fontWeight:700,color:darkMode?"#eee":"#1a1a1a"}}>{activeProposal.suggestedId}</div>
            </div>
            <div style={{background:darkMode?"#1d1d1d":"#fff",borderRadius:8,padding:"8px 10px",border:`1px solid ${darkMode?"#333":"#f0dada"}`}}>
              <div style={{fontSize:10,color:darkMode?"#888":"#777",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:800}}>Pasos mejorados</div>
              <ul style={{margin:"6px 0 0 16px",padding:0,fontSize:12,color:darkMode?"#ddd":"#555",display:"grid",gap:4}}>
                {activeProposal.enrichedSteps.map((step, i)=><li key={i}>{step}</li>)}
              </ul>
            </div>
            <div style={{background:darkMode?"#1d1d1d":"#fff",borderRadius:8,padding:"8px 10px",border:`1px solid ${darkMode?"#333":"#f0dada"}`}}>
              <div style={{fontSize:10,color:darkMode?"#888":"#777",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:800}}>Resultado esperado</div>
              <div style={{fontSize:12,color:darkMode?"#ddd":"#555",marginTop:4,lineHeight:1.5}}>{activeProposal.expectedResult}</div>
            </div>
            {activeProposal.precondiciones && activeProposal.precondiciones.length > 0 && (
              <div style={{background:darkMode?"#1d1d1d":"#fff",borderRadius:8,padding:"8px 10px",border:`1px solid ${darkMode?"#333":"#f0dada"}`}}>
                <div style={{fontSize:10,color:darkMode?"#888":"#777",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:800}}>Precondiciones sugeridas</div>
                <ul style={{margin:"6px 0 0 16px",padding:0,fontSize:12,color:darkMode?"#ddd":"#555",display:"grid",gap:4}}>
                  {activeProposal.precondiciones.map((item, idx) => <li key={idx}>{item}</li>)}
                </ul>
              </div>
            )}
          </div>
          <div style={{marginTop:12,padding:12,borderRadius:12,background:darkMode?"#141414":"#fff",border:`1px solid ${darkMode?"#222":"#e5e7eb"}`}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
              <div style={{fontSize:12,fontWeight:700,color:darkMode?"#eee":"#333",marginBottom:8}}>Vista previa antes de aplicar</div>
              <div>
                <Btn small variant="ghost" onClick={()=>setShowFullDiff(true)} style={{marginLeft:8}}>Ver diferencias completas</Btn>
                <Btn small variant="ghost" onClick={()=>{ setFullDiffDocked(prev=>!prev); setShowFullDiff(false); }} style={{marginLeft:8}}>{fullDiffDocked? 'Desanclar vista' : 'Anclar vista'}</Btn>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div style={{padding:12,borderRadius:10,background:darkMode?"#1c1c1e":"#fafafa",border:`1px solid ${darkMode?"#2a2a2a":"#e0e0e0"}`, position:"relative"}}>
                <div style={{fontSize:11,color:darkMode?"#888":"#777",fontWeight:700,textTransform:"uppercase",marginBottom:8}}>Caso actual</div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{fontSize:13,fontWeight:700,color:darkMode?"#fff":"#1a1a1a",marginBottom:8}}>{selectedTc.id}</div>
                  {previewIdChanged ? <div style={{fontSize:11,color:BRAND,fontWeight:800,background:BRAND+"20",padding:"2px 8px",borderRadius:8}}>Cambia</div> : <div style={{fontSize:11,color:darkMode?"#888":"#666"}}>Sin cambios</div>}
                </div>
                <div style={{fontSize:11,color:darkMode?"#aaa":"#555",fontWeight:700,marginBottom:4,marginTop:8}}>Pasos actuales</div>
                <pre style={{margin:0,fontFamily:"inherit",whiteSpace:"pre-wrap",lineHeight:1.6,fontSize:12,color:darkMode?"#ddd":"#444",borderLeft: previewStepsChanged? `4px solid ${BRAND}` : undefined, paddingLeft: previewStepsChanged?12 : undefined, background: previewStepsChanged? (darkMode?"#0f1b1a":"#fffdf0") : undefined}}>{selectedTc.pasos || "(sin pasos)"}</pre>
                <div style={{fontSize:11,color:darkMode?"#aaa":"#555",fontWeight:700,marginTop:12,marginBottom:4}}>Resultado esperado actual</div>
                <div style={{fontSize:12,lineHeight:1.6,color:darkMode?"#ddd":"#444",borderLeft: previewResultChanged? `4px solid ${BRAND}` : undefined, paddingLeft: previewResultChanged?12 : undefined, background: previewResultChanged? (darkMode?"#0f1b1a":"#fffdf0") : undefined}}>{selectedTc.resultado || "(sin resultado esperado)"}</div>
              </div>
              <div style={{padding:12,borderRadius:10,background:darkMode?"#1c1c1e":"#fafafa",border:`1px solid ${darkMode?"#2a2a2a":"#e0e0e0"}`, position:"relative"}}>
                <div style={{fontSize:11,color:darkMode?"#888":"#777",fontWeight:700,textTransform:"uppercase",marginBottom:8}}>Propuesta IA</div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{fontSize:13,fontWeight:700,color:darkMode?"#fff":"#1a1a1a",marginBottom:8}}>{activeProposal.suggestedId}</div>
                  {previewIdChanged ? <div style={{fontSize:11,color:BRAND,fontWeight:800,background:BRAND+"20",padding:"2px 8px",borderRadius:8}}>Sugerido</div> : <div style={{fontSize:11,color:darkMode?"#888":"#666"}}>Id igual</div>}
                </div>
                <div style={{fontSize:11,color:darkMode?"#aaa":"#555",fontWeight:700,marginBottom:4,marginTop:8}}>Pasos propuestos</div>
                <ul style={{margin:"0 0 0 16px",padding:0,fontSize:12,lineHeight:1.6,color:darkMode?"#ddd":"#444",borderLeft: previewStepsChanged? `4px solid ${BRAND}` : undefined, paddingLeft: previewStepsChanged?12 : undefined, background: previewStepsChanged? (darkMode?"#081615":"#fffdf9") : undefined}}>
                  {activeProposal.enrichedSteps.map((step,i)=><li key={i} style={{marginBottom:8}}>{step}</li>)}
                </ul>
                <div style={{fontSize:11,color:darkMode?"#aaa":"#555",fontWeight:700,marginTop:12,marginBottom:4}}>Resultado esperado propuesto</div>
                <div style={{fontSize:12,lineHeight:1.6,color:darkMode?"#ddd":"#444",borderLeft: previewResultChanged? `4px solid ${BRAND}` : undefined, paddingLeft: previewResultChanged?12 : undefined, background: previewResultChanged? (darkMode?"#081615":"#fffdf9") : undefined}}>{activeProposal.expectedResult}</div>
              </div>
            </div>
          </div>
          <div style={{marginTop:12,fontSize:12,color:darkMode?"#ddd":"#444"}}>Actualizar campos antes de aplicar la propuesta:</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4, minmax(150px, 1fr))",gap:10,marginTop:10}}>
            <label style={{display:"inline-flex",alignItems:"center",gap:8,fontSize:12}}>
              <input type="checkbox" checked={applyId} onChange={e=>setApplyId(e.target.checked)} />
              <span style={{fontSize:13}}>Aplicar ID sugerido</span>
            </label>
            <label style={{display:"inline-flex",alignItems:"center",gap:8,fontSize:12}}>
              <input type="checkbox" checked={applySteps} onChange={e=>setApplySteps(e.target.checked)} />
              <span style={{fontSize:13}}>Aplicar pasos mejorados</span>
            </label>
            <label style={{display:"inline-flex",alignItems:"center",gap:8,fontSize:12}}>
              <input type="checkbox" checked={applyResult} onChange={e=>setApplyResult(e.target.checked)} />
              <span style={{fontSize:13}}>Aplicar resultado esperado</span>
            </label>
            <label style={{display:"inline-flex",alignItems:"center",gap:8,fontSize:12}}>
              <input type="checkbox" checked={applyPrecondiciones} onChange={e=>setApplyPrecondiciones(e.target.checked)} />
              <span style={{fontSize:13}}>Aplicar precondiciones</span>
            </label>
          </div>
          {!applyId && !applySteps && !applyResult && !applyPrecondiciones && (
            <div style={{marginTop:10,fontSize:11,color:darkMode?"#f8b4b4":"#b91c1c"}}>Marca al menos una opción para aplicar la propuesta.</div>
          )}
          <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:10}}>
            <Btn small variant="ghost" onClick={()=>{setApplyId(true);setApplySteps(true);setApplyResult(true);setApplyPrecondiciones(true);}}>
              Aplicar todo
            </Btn>
            <Btn small variant="ghost" onClick={handleRequestApply} disabled={!applyId && !applySteps && !applyResult && !applyPrecondiciones}>
              Aceptar cambios parciales
            </Btn>
            {onApplyProposal&&(
              <button onClick={handleRequestApply} style={{background:BRAND,color:"#fff",border:"none",borderRadius:8,padding:"8px 12px",cursor:"pointer",fontSize:12,fontWeight:700}} disabled={!applyId && !applySteps && !applyResult && !applyPrecondiciones}>
                ✅ Aplicar mejora al caso
              </button>
            )}
          </div>
        </div>
      )}
      {showApplyConfirm && (
        <div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.45)",zIndex:9999}}>
          <div style={{width:520,maxWidth:"94%",background:darkMode?"#0f0f10":"#fff",padding:18,borderRadius:12,boxShadow:"0 10px 40px rgba(0,0,0,0.6)",border:`1px solid ${darkMode?"#222":"#e6e6e6"}`}}>
            <div style={{fontSize:16,fontWeight:800,color:darkMode?"#fff":"#111",marginBottom:8}}>Confirmar aplicación</div>
            <div style={{fontSize:13,color:darkMode?"#ccc":"#333",marginBottom:12}}>Vas a aplicar los siguientes cambios al caso <strong>{selectedTc?.id}</strong>:</div>
            <ul style={{marginTop:0,marginBottom:12,color:darkMode?"#ddd":"#444"}}>
              {applyId && <li>ID sugerido: <strong style={{color:BRAND}}>{activeProposal?.suggestedId}</strong></li>}
              {applySteps && <li>Pasos mejorados (se reemplazarán los pasos actuales).</li>}
              {applyResult && <li>Resultado esperado actualizado.</li>}
              {applyPrecondiciones && <li>Precondiciones sugeridas actualizadas.</li>}
              {!applyId && !applySteps && !applyResult && !applyPrecondiciones && <li style={{color:"#b91c1c"}}>No se seleccionaron campos para aplicar.</li>}
            </ul>
            {applySteps && (
              <div>
                <div style={{fontSize:12,fontWeight:700,color:darkMode?"#eee":"#333",marginBottom:6}}>Comparación de pasos (actual → propuesto)</div>
                {renderLinesDiff(selectedTc?.pasos||"", activeProposal?.enrichedSteps||[])}
              </div>
            )}
            {applyResult && (
              <div style={{marginTop:10}}>
                <div style={{fontSize:12,fontWeight:700,color:darkMode?"#eee":"#333",marginBottom:6}}>Comparación de resultado esperado</div>
                {renderLinesDiff(selectedTc?.resultado||"", [(activeProposal?.expectedResult||"")])}
              </div>
            )}
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <Btn small variant="ghost" onClick={()=>setShowApplyConfirm(false)}>Cancelar</Btn>
              <button onClick={handleConfirmApply} style={{background:BRAND,color:"#fff",border:"none",borderRadius:8,padding:"8px 12px",cursor:"pointer",fontSize:13,fontWeight:800}} disabled={!applyId && !applySteps && !applyResult && !applyPrecondiciones}>Confirmar y aplicar</button>
            </div>
          </div>
        </div>
      )}
      {showFullDiff && (
        <div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.6)",zIndex:10000}}>
          <div style={{width:"90%",maxWidth:1100,maxHeight:"90%",overflowY:"auto",background:darkMode?"#0b0b0b":"#fff",padding:18,borderRadius:10,border:`1px solid ${darkMode?"#222":"#e6e6e6"}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:12}}>
              <div>
                <div style={{fontSize:16,fontWeight:800,color:darkMode?"#fff":"#111"}}>Diferencias completas — {selectedTc?.id}</div>
                <div style={{fontSize:12,color:darkMode?"#bbb":"#666"}}>Comparación lado a lado: caso actual vs propuesta IA</div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <Btn small variant="ghost" onClick={()=>setShowFullDiff(false)}>Cerrar</Btn>
                <Btn small variant="ghost" onClick={()=>{ setFullDiffDocked(true); setShowFullDiff(false); }}>Anclar panel</Btn>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div style={{padding:12,borderRadius:8,background:darkMode?"#0f1412":"#fafafa",border:`1px solid ${darkMode?"#1f1f1f":"#eaeaea"}`}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>Caso actual</div>
                <div style={{fontSize:12,color:darkMode?"#ddd":"#333",marginBottom:8}}>Pasos</div>
                {renderLinesDiff(selectedTc?.pasos||"", (selectedTc?.pasos||"").toString().split('\n'))}
                <div style={{fontSize:12,color:darkMode?"#ddd":"#333",marginTop:12,marginBottom:8}}>Resultado esperado</div>
                {renderLinesDiff(selectedTc?.resultado||"", [(selectedTc?.resultado||"")])}
              </div>
              <div style={{padding:12,borderRadius:8,background:darkMode?"#0f1412":"#fafafa",border:`1px solid ${darkMode?"#1f1f1f":"#eaeaea"}`}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>Propuesta IA</div>
                <div style={{fontSize:12,color:darkMode?"#ddd":"#333",marginBottom:8}}>Pasos propuestos</div>
                {renderLinesDiff((selectedTc?.pasos||""), activeProposal?.enrichedSteps||[])}
                <div style={{fontSize:12,color:darkMode?"#ddd":"#333",marginTop:12,marginBottom:8}}>Resultado esperado propuesto</div>
                {renderLinesDiff((selectedTc?.resultado||""), [(activeProposal?.expectedResult||"")])}
              </div>
            </div>
          </div>
        </div>
      )}
      {fullDiffDocked && (
        <div style={{position:"fixed",right:12,top:80,bottom:40,width:520,maxWidth:"46%",overflowY:"auto",background:darkMode?"#0b0b0b":"#fff",padding:12,borderRadius:10,border:`1px solid ${darkMode?"#222":"#e6e6e6"}`,zIndex:9998,boxShadow:"0 8px 30px rgba(0,0,0,0.4)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:8}}>
            <div style={{fontSize:14,fontWeight:800,color:darkMode?"#fff":"#111"}}>Diferencias ancladas — {selectedTc?.id}</div>
            <div style={{display:"flex",gap:8}}>
              <Btn small variant="ghost" onClick={()=>setFullDiffDocked(false)}>Desanclar</Btn>
              <Btn small variant="ghost" onClick={()=>setShowFullDiff(true)}>Abrir modal</Btn>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr",gap:10}}>
            <div style={{fontSize:12,fontWeight:700,color:darkMode?"#eee":"#333"}}>Pasos (actual → propuesto)</div>
            {renderLinesDiff(selectedTc?.pasos||"", activeProposal?.enrichedSteps||[])}
            <div style={{fontSize:12,fontWeight:700,color:darkMode?"#eee":"#333",marginTop:8}}>Resultado esperado</div>
            {renderLinesDiff(selectedTc?.resultado||"", [(activeProposal?.expectedResult||"")])}
          </div>
        </div>
      )}
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

// ─── SPARKLINE (mini-graph) ───────────────────────────────────────────────
function Sparkline({data=[],color="#2980B9",width=120,height=34,strokeWidth=2}){
  const vals = (data||[]).map(item=>{
    if(typeof item === 'number') return item;
    if(item && typeof item === 'object' && item.value!==undefined) return Number(item.value)||0;
    return parseFloat(item)||0;
  });
  const [hoverIdx,setHoverIdx] = useState(-1);
  const [tipPos,setTipPos] = useState({left:0,top:0});
  const wrapRef = useRef();
  if(!vals.length) return <div style={{width, height, display:'flex', alignItems:'center', justifyContent:'center', color:'#999', fontSize:11}}>sin datos</div>;
  const minV = Math.min(...vals), maxV = Math.max(...vals);
  const range = maxV - minV || 1;
  const pts = vals.map((v,i)=>({ x: (i/(vals.length-1))*(width-4)+2, y: 2 + (1-((v-minV)/range))*(height-6), v, label: (data[i] && typeof data[i] === 'object' ? (data[i].label||data[i].name||data[i].date) : null) }));
  const path = pts.map((p,i)=>(i===0?`M${p.x},${p.y}`:`L${p.x},${p.y}`)).join(' ');
  const areaPath = `${path} L ${width-2},${height-2} L 2 ${height-2} Z`;

  function handleMove(e){
    const rect = wrapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let nearest = 0; let best = Infinity;
    pts.forEach((p,i)=>{ const d=Math.abs(p.x - x); if(d<best){best=d;nearest=i;} });
    setHoverIdx(nearest);
    const top = Math.max(6, (pts[nearest].y - 28));
    const left = Math.min(rect.width - 80, Math.max(6, pts[nearest].x - 40));
    setTipPos({left, top});
  }
  function handleLeave(){ setHoverIdx(-1); }

  return (
    <div ref={wrapRef} style={{width, height, position:'relative', display:'inline-block'}} onMouseMove={handleMove} onMouseLeave={handleLeave}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{display:'block'}}>
        <path d={areaPath} fill={color + '22'} stroke="none" />
        <path d={path} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p,i)=>{
          const r = i===hoverIdx?3.4:(i===pts.length-1?2.6:1.4);
          const fill = i===hoverIdx? (color) : color;
          return <circle key={i} cx={p.x} cy={p.y} r={r} fill={fill}/>;
        })}
      </svg>
      {hoverIdx>=0 && (
        <div style={{position:'absolute',left:tipPos.left,top:tipPos.top,background:'#111',color:'#fff',padding:'6px 8px',borderRadius:6,fontSize:11,boxShadow:'0 6px 18px rgba(0,0,0,0.35)'}}>
          {pts[hoverIdx].label ? `${pts[hoverIdx].label}: ${String(pts[hoverIdx].v)}` : String(pts[hoverIdx].v)}
        </div>
      )}
    </div>
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
  const headers = ["ID","TC","Escenario","Descripción de la novedad","Módulo","Observación","Estado","Severidad","Prioridad","Fecha Creación","Última actualización bitácora"];
  const rows = issuesList.map(i=>[i.id,i.testId,i.escenario,i.formulario,i.modulo,i.observacion,i.estado,i.severidad,i.prioridad,i.fechaCreacion,issueBitacoraSummary(i)]);
  const csv = [headers,...rows].map(r=>r.map(c=>`"${(c||"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`${proj.name}_Issues.csv`;a.click();
}

// ─── EXPORT DASHBOARD PDF ────────────────────────────────────────────────────
function exportDashboardPDF(proj, tests = proj.tests, issues = proj.issues) {
  const { name, description, createdAt } = proj;
  const dateNow = today();
  const stats = {
    "Borrador": tests.filter(t=>normalizeTestStatus(t.estado)==="Borrador").length,
    "Revisión": tests.filter(t=>normalizeTestStatus(t.estado)==="Revisión").length,
    "Aprobado": tests.filter(t=>normalizeTestStatus(t.estado)==="Aprobado").length,
  };
  const issueStats = {
    open: issues.filter(i=>i.estado==="Open").length,
    inProg: issues.filter(i=>i.estado==="In Progress").length,
    closed: issues.filter(i=>i.estado==="Closed").length,
    blocked: issues.filter(i=>i.estado==="Blocked").length,
    total: issues.length,
  };
  const pct = n => tests.length ? Math.round((n / tests.length) * 100) : 0;
  const execPct = pct(stats["Aprobado"]);

  // Build bar SVG
  const bars = [
    { label:"Aprobado", value:stats["Aprobado"], color:"#27AE60" },
    { label:"Revisión", value:stats["Revisión"], color:"#F39C12" },
    { label:"Borrador", value:stats["Borrador"], color:"#95A5A6" },
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
    const aprobados = execs.filter(e=>normalizeCycleExecutionStatus(e.estado)==="Aprobado").length;
    const revisiones = execs.filter(e=>normalizeCycleExecutionStatus(e.estado)==="En Progreso").length;
    const noEjec = execs.filter(e=>normalizeCycleExecutionStatus(e.estado)==="No ejecutado").length;
    const avance = total ? Math.round((aprobados / total) * 100) : 0;
    return `<tr>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;font-weight:700">${escapeHtml(c.nombre||"Sin nombre")}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0">${escapeHtml(c.modulo||"—")}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0">${escapeHtml(c.fechaInicio||"—")}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0">${escapeHtml(c.fechaFin||"—")}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;text-align:center">${total}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;text-align:center;color:#27AE60;font-weight:700">${aprobados}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;text-align:center;color:#F39C12;font-weight:700">${revisiones}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;text-align:center;color:#95A5A6;font-weight:700">${noEjec}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;text-align:center;font-weight:800;color:${avance>=70?"#27AE60":avance>=40?"#F39C12":"#E74C3C"}">${avance}%</td>
    </tr>`;
  }).join("");

  // TC table rows
  const tcRows = tests.map(t => {
    const sc = {"Aprobado":"#27AE60","Revisión":"#F39C12","Borrador":"#95A5A6"}[normalizeTestStatus(t.estado)]||"#888";
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
    <div class="chip"><div class="chip-label">Revisión</div><div class="chip-value" style="color:#F39C12">${stats["Revisión"]}</div></div>
    <div class="chip"><div class="chip-label">Borrador</div><div class="chip-value" style="color:#95A5A6">${stats["Borrador"]}</div></div>
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
    <thead><tr><th>Módulo</th><th>Total</th><th style="color:#27AE60">Aprobado</th><th style="color:#F39C12">Revisión</th><th style="color:#95A5A6">Borrador</th><th>% Aprob.</th></tr></thead>
    <tbody>${(()=>{
      const mm={};
      tests.forEach(t=>{
        const mod=t.proceso||"Sin módulo";
        if(!mm[mod]) mm[mod]={total:0,ap:0,ep:0,fa:0,ne:0,na:0};
        mm[mod].total++;
        if(normalizeTestStatus(t.estado)==="Aprobado")mm[mod].ap++;
        else if(normalizeTestStatus(t.estado)==="Revisión")mm[mod].ep++;
        else if(normalizeTestStatus(t.estado)==="Borrador")mm[mod].ne++;
      });
      return Object.entries(mm).map(([mod,m])=>{
        const mp=m.total?Math.round((m.ap/m.total)*100):0;
        const mc=mp>=70?"#27AE60":mp>=40?"#F39C12":"#E74C3C";
        return `<tr><td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;font-weight:700">${mod}</td><td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;text-align:center">${m.total}</td><td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;text-align:center;color:#27AE60;font-weight:700">${m.ap}</td><td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;text-align:center;color:#F39C12;font-weight:700">${m.ep}</td><td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;text-align:center;color:#95A5A6;font-weight:700">${m.ne}</td><td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;text-align:center;font-weight:800;color:${mc}">${mp}%</td></tr>`;
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

// ─── EXPORT KPIS AS SVG/PNG ─────────────────────────────────────────────────
function exportKPIsAsImage(proj, tests = proj.tests, filteredTestStats = {}, filteredIssueStats = {}){
  const dateNow = today();
  const total = tests.length || 0;
  const approved = filteredTestStats["Aprobado"] || 0;
  const inReview = filteredTestStats["Revisión"] || 0;
  const executed = tests.filter(t=>t.fechaEjecucion).length;
  const issues = filteredIssueStats.total || 0;

  const svg = `<?xml version="1.0" encoding="utf-8"?>
  <svg xmlns='http://www.w3.org/2000/svg' width='820' height='260' viewBox='0 0 820 260'>
    <style>
      .card{fill:#fff;stroke:#f0f0f0;stroke-width:1;border-radius:10px}
      .title{font-family:Arial,Helvetica,sans-serif;font-weight:800;fill:#222;font-size:14px}
      .value{font-family:Arial,Helvetica,sans-serif;font-weight:800;fill:#111;font-size:28px}
      .label{font-family:Arial,Helvetica,sans-serif;fill:#666;font-size:11px}
    </style>
    <rect x='8' y='8' width='804' height='244' rx='12' fill='#fafafa' stroke='#eee'/>
    <text x='28' y='36' class='title'>KPIs · ${proj.name}</text>
    <text x='28' y='54' class='label'>Generado: ${dateNow}</text>

    <g transform='translate(28,80)'>
      <rect x='0' y='0' width='180' height='120' rx='10' fill='#fff' stroke='#eee'/>
      <text x='14' y='26' class='label'>Tasa Aprobación</text>
      <text x='14' y='62' class='value' fill='#27AE60'>${Math.round(total?((approved/total)*100):0)}%</text>
      <text x='14' y='92' class='label'>${approved} de ${total}</text>
    </g>

    <g transform='translate(228,80)'>
      <rect x='0' y='0' width='180' height='120' rx='10' fill='#fff' stroke='#eee'/>
      <text x='14' y='26' class='label'>Tasa Fallos</text>
      <text x='14' y='62' class='value' fill='#F39C12'>${Math.round(total?((inReview/total)*100):0)}%</text>
      <text x='14' y='92' class='label'>${inReview} en revisión</text>
    </g>

    <g transform='translate(428,80)'>
      <rect x='0' y='0' width='180' height='120' rx='10' fill='#fff' stroke='#eee'/>
      <text x='14' y='26' class='label'>Ejecutados</text>
      <text x='14' y='62' class='value' fill='${proj.color||"#27AE60"}'>${executed}</text>
      <text x='14' y='92' class='label'>Total ejecutados</text>
    </g>

    <g transform='translate(628,80)'>
      <rect x='0' y='0' width='180' height='120' rx='10' fill='#fff' stroke='#eee'/>
      <text x='14' y='26' class='label'>Issues abiertas</text>
      <text x='14' y='62' class='value' fill='#8E44AD'>${issues}</text>
      <text x='14' y='92' class='label'>Issues filtradas</text>
    </g>
  </svg>`;

  // trigger SVG download
  const blob = new Blob([svg], {type: 'image/svg+xml;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${proj.name.replace(/[^a-z0-9]/gi,'_')}_KPIs.svg`; a.click();
  URL.revokeObjectURL(url);

  // also try to export PNG (best effort)
  try{
    const img = new Image();
    const svg64 = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    img.onload = ()=>{
      const canvas = document.createElement('canvas'); canvas.width=820; canvas.height=260;
      const ctx = canvas.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img,0,0);
      canvas.toBlob((b)=>{ if(!b) return; const u=URL.createObjectURL(b); const aa=document.createElement('a'); aa.href=u; aa.download=`${proj.name.replace(/[^a-z0-9]/gi,'_')}_KPIs.png`; aa.click(); URL.revokeObjectURL(u); }, 'image/png');
    };
    img.src = svg64;
  }catch(e){ console.warn('PNG export failed', e); }
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
        estado:"Borrador",
        asignadoA: i.fields.assignee?.displayName||"",
        attachments:[],
        historial:[{fecha:today(),de:"—",a:"Borrador",nota:`Importado desde Jira: ${i.key}`}],
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
      estado: normalizeTestStatus(cols[10]||"Borrador"),
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
          <SuggestionInput value={form.modulo} onChange={v=>set("modulo",v)} options={modulosList} placeholder="Selecciona o escribe un módulo" darkMode={darkMode}/>
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
  const [form,setForm]=useState(() => {
    const initialTeam = normalizeScrumTeam(initial?.scrumTeam);
    const legacyTeam = normalizeMemberList(initial?.testers);
    return {
      ...EMPTY_PROJECT,
      ...(initial || {}),
      scrumTeam: {
        ...EMPTY_PROJECT.scrumTeam,
        ...initialTeam,
        qa: initialTeam.qa.length ? initialTeam.qa : legacyTeam,
      },
      scrumTestTypes: normalizeProjectList(initial?.scrumTestTypes || EMPTY_PROJECT.scrumTestTypes),
      scrumLevels: normalizeProjectList(initial?.scrumLevels || EMPTY_PROJECT.scrumLevels),
    };
  });
  const [moduleInput,setModuleInput]=useState("");
  const [devInput,setDevInput]=useState("");
  const [qaInput,setQaInput]=useState("");
  const [testTypeInput,setTestTypeInput]=useState("");
  const [levelInput,setLevelInput]=useState("");
  const [memberNameInput,setMemberNameInput]=useState("");
  const [memberRolesInput,setMemberRolesInput]=useState("");
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const IS=darkMode?inputStyleDark:inputStyle;
  function addItem(field, inputValue, setter) {
    const value = String(inputValue||"").trim();
    if(!value) return;
    const items = field === "modules"
      ? (Array.isArray(form.modules) ? form.modules : [])
      : normalizeMemberList(form.scrumTeam?.[field]);
    const next = [...items, ...value.split(",").map(v=>v.trim()).filter(Boolean)];
    const deduped = next.filter((item, index) => next.indexOf(item) === index);
    if (field === "modules") {
      set("modules", deduped);
    } else {
      set("scrumTeam", {
        ...(form.scrumTeam || EMPTY_PROJECT.scrumTeam),
        [field]: deduped,
      });
    }
    setter("");
  }
  function removeItem(field, item) {
    if (field === "modules") {
      const items = Array.isArray(form.modules) ? form.modules : [];
      set("modules", items.filter(i=>i!==item));
      return;
    }
    const items = normalizeMemberList(form.scrumTeam?.[field]);
    set("scrumTeam", {
      ...(form.scrumTeam || EMPTY_PROJECT.scrumTeam),
      [field]: items.filter(i=>i!==item),
    });
  }
  function updateTeam(field, value) {
    setForm(prev => ({
      ...prev,
      scrumTeam: {
        ...(prev.scrumTeam || EMPTY_PROJECT.scrumTeam),
        [field]: String(value || "").trim(),
      },
    }));
  }
  function addListItem(field, inputValue, setter) {
    const value = String(inputValue || "").trim();
    if (!value) return;
    const items = normalizeProjectList(form[field]);
    const next = [...items, ...value.split(",").map(v => v.trim()).filter(Boolean)];
    const deduped = next.filter((item, index) => next.indexOf(item) === index);
    set(field, deduped);
    setter("");
  }
  function removeListItem(field, item) {
    const items = normalizeProjectList(form[field]);
    set(field, items.filter(entry => entry !== item));
  }
  function addMember(){
    const name=String(memberNameInput||"").trim();
    if(!name) return;
    const roles = String(memberRolesInput||"").split(",").map(r=>r.trim()).filter(Boolean);
    const next = [...(form.members||[]).filter(m=>m.name!==name), {name, roles}];
    set("members", next);
    setMemberNameInput(""); setMemberRolesInput("");
  }
  function removeMember(name){
    set("members", (form.members||[]).filter(m=>m.name!==name));
  }
  return (
    <Modal onClose={onClose} preventOutsideClose>
      <ModalHeader title={initial?"Editar Proyecto":"Nuevo Proyecto"} onClose={onClose}/>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <Field label="Nombre del Proyecto"><input style={IS} value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Ej: SAP – Módulo Ventas"/></Field>
        <Field label="Descripción"><input style={IS} value={form.description} onChange={e=>set("description",e.target.value)} placeholder="Descripción breve"/></Field>
        <Field label="Módulos del proyecto">
          <div style={{display:"flex",gap:8}}>
            <input style={IS} value={moduleInput} onChange={e=>setModuleInput(e.target.value)} placeholder="Ej: Compras, Inventarios" onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addItem("modules",moduleInput,setModuleInput);}}}/>
            <Btn small variant="ghost" onClick={()=>addItem("modules",moduleInput,setModuleInput)}>Agregar</Btn>
          </div>
          {(form.modules||[]).length>0&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8}}>
              {(form.modules||[]).map(mod=>(
                <span key={mod} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:999,background:darkMode?"#2C2C2E":"#f4f4f4",color:darkMode?"#eee":"#444",fontSize:12}}>
                  {mod}
                  <button type="button" onClick={()=>removeItem("modules",mod)} style={{border:"none",background:"transparent",cursor:"pointer",color:darkMode?"#aaa":"#666",fontSize:12}}>✕</button>
                </span>
              ))}
            </div>
          )}
        </Field>
        <Field label="Equipo Scrum">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,marginBottom:6,color:darkMode?"#aaa":"#666"}}>Product Owner</div>
              <input style={IS} value={form.scrumTeam?.productOwner||""} onChange={e=>updateTeam("productOwner",e.target.value)} placeholder="Ej: Ana López" />
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:700,marginBottom:6,color:darkMode?"#aaa":"#666"}}>Scrum Master</div>
              <input style={IS} value={form.scrumTeam?.scrumMaster||""} onChange={e=>updateTeam("scrumMaster",e.target.value)} placeholder="Ej: Luis Torres" />
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:10}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,marginBottom:6,color:darkMode?"#aaa":"#666"}}>Developers</div>
              <div style={{display:"flex",gap:8}}>
                <input style={IS} value={devInput} onChange={e=>setDevInput(e.target.value)} placeholder="Ej: Carlos, María" onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addItem("developers",devInput,setDevInput);}}}/>
                <Btn small variant="ghost" onClick={()=>addItem("developers",devInput,setDevInput)}>Agregar</Btn>
              </div>
              {(form.scrumTeam?.developers||[]).length>0&&(
                <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8}}>
                  {(form.scrumTeam?.developers||[]).map(person=>(
                    <span key={person} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:999,background:darkMode?"#2C2C2E":"#f4f4f4",color:darkMode?"#eee":"#444",fontSize:12}}>
                      {person}
                      <button type="button" onClick={()=>removeItem("developers",person)} style={{border:"none",background:"transparent",cursor:"pointer",color:darkMode?"#aaa":"#666",fontSize:12}}>✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:700,marginBottom:6,color:darkMode?"#aaa":"#666"}}>QA / Pruebas</div>
              <div style={{display:"flex",gap:8}}>
                <input style={IS} value={qaInput} onChange={e=>setQaInput(e.target.value)} placeholder="Ej: Sofía, Pedro" onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addItem("qa",qaInput,setQaInput);}}}/>
                <Btn small variant="ghost" onClick={()=>addItem("qa",qaInput,setQaInput)}>Agregar</Btn>
              </div>
              {(form.scrumTeam?.qa||[]).length>0&&(
                <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8}}>
                  {(form.scrumTeam?.qa||[]).map(person=>(
                    <span key={person} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:999,background:darkMode?"#2C2C2E":"#f4f4f4",color:darkMode?"#eee":"#444",fontSize:12}}>
                      {person}
                      <button type="button" onClick={()=>removeItem("qa",person)} style={{border:"none",background:"transparent",cursor:"pointer",color:darkMode?"#aaa":"#666",fontSize:12}}>✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Field>
        <Field label="Color">
          <div style={{display:"flex",gap:10}}>
            {COLORS.map(c=><div key={c} onClick={()=>set("color",c)} style={{width:28,height:28,borderRadius:6,background:c,cursor:"pointer",border:form.color===c?"3px solid #fff":"3px solid transparent",transition:"border 0.15s"}}/>)}
          </div>
        </Field>
        <Field label="Tipos de pruebas">
          <div style={{display:"flex",gap:8}}>
            <input style={IS} value={testTypeInput} onChange={e=>setTestTypeInput(e.target.value)} placeholder="Ej: Funcionales, Regresión" onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addListItem("scrumTestTypes",testTypeInput,setTestTypeInput);}}}/>
            <Btn small variant="ghost" onClick={()=>addListItem("scrumTestTypes",testTypeInput,setTestTypeInput)}>Agregar</Btn>
          </div>
          {(form.scrumTestTypes||[]).length>0&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8}}>
              {(form.scrumTestTypes||[]).map(item=>(
                <span key={item} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:999,background:darkMode?"#2C2C2E":"#f4f4f4",color:darkMode?"#eee":"#444",fontSize:12}}>
                  {item}
                  <button type="button" onClick={()=>removeListItem("scrumTestTypes",item)} style={{border:"none",background:"transparent",cursor:"pointer",color:darkMode?"#aaa":"#666",fontSize:12}}>✕</button>
                </span>
              ))}
            </div>
          )}
        </Field>
        <Field label="Niveles de prueba">
          <div style={{display:"flex",gap:8}}>
            <input style={IS} value={levelInput} onChange={e=>setLevelInput(e.target.value)} placeholder="Ej: Sistema, Aceptación" onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addListItem("scrumLevels",levelInput,setLevelInput);}}}/>
            <Btn small variant="ghost" onClick={()=>addListItem("scrumLevels",levelInput,setLevelInput)}>Agregar</Btn>
          </div>
          {(form.scrumLevels||[]).length>0&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8}}>
              {(form.scrumLevels||[]).map(item=>(
                <span key={item} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:999,background:darkMode?"#2C2C2E":"#f4f4f4",color:darkMode?"#eee":"#444",fontSize:12}}>
                  {item}
                  <button type="button" onClick={()=>removeListItem("scrumLevels",item)} style={{border:"none",background:"transparent",cursor:"pointer",color:darkMode?"#aaa":"#666",fontSize:12}}>✕</button>
                </span>
              ))}
            </div>
          )}
        </Field>
        <Field label="Miembros del proyecto (opcional)">
          <div style={{display:"flex",gap:8}}>
            <input style={IS} value={memberNameInput} onChange={e=>setMemberNameInput(e.target.value)} placeholder="Nombre (Ej: Juan Pérez)" onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addMember();}}} />
            <input style={IS} value={memberRolesInput} onChange={e=>setMemberRolesInput(e.target.value)} placeholder="Roles (separar por comas: admin,QA)" onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addMember();}}} />
            <Btn small variant="ghost" onClick={addMember}>Agregar</Btn>
          </div>
          {(form.members||[]).length>0&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8}}>
              {(form.members||[]).map(m=>(
                <span key={m.name} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:999,background:darkMode?"#2C2C2E":"#f4f4f4",color:darkMode?"#eee":"#444",fontSize:12}}>
                  <strong style={{marginRight:6}}>{m.name}</strong>
                  <span style={{fontSize:11,color:darkMode?"#aaa":"#666"}}>{(Array.isArray(m.roles)?m.roles.join(", "):m.roles)||"—"}</span>
                  <button type="button" onClick={()=>removeMember(m.name)} style={{border:"none",background:"transparent",cursor:"pointer",color:darkMode?"#aaa":"#666",fontSize:12}}>✕</button>
                </span>
              ))}
            </div>
          )}
        </Field>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:20}}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={()=>{if(!form.name.trim())return alert("El nombre es requerido");const scrumTeam=normalizeScrumTeam(form.scrumTeam);onSave({...form,modules:(form.modules||[]).filter(Boolean),scrumTeam,scrumTestTypes:normalizeProjectList(form.scrumTestTypes),scrumLevels:normalizeProjectList(form.scrumLevels),testers:getScrumTeamMembers({scrumTeam})});}}>💾 Guardar</Btn>
      </div>
    </Modal>
  );
}

function TcFormModal({initial,tcId,onSave,onClose,darkMode,project}) {
  const [form,setForm]=useState(() => {
    const inferredRole = inferScrumRole(project, initial?.asignadoA);
    const base = {
      ...EMPTY_TC,
      ...(initial || {}),
      area: String(initial?.precondiciones ?? initial?.area ?? "").trim(),
      precondiciones: String(initial?.precondiciones ?? initial?.area ?? "").trim(),
      estado: normalizeTestStatus(initial?.estado || EMPTY_TC.estado),
      asignadoRol: initial?.asignadoRol || inferredRole,
    };
    const scrumMembers = getScrumTeamMembers(project);
    if (!base.proceso && project?.modules?.length) base.proceso = project.modules[0];
    const roleMembers = getScrumRoleMembers(project, base.asignadoRol);
    if (!base.asignadoA && roleMembers.length) base.asignadoA = roleMembers[0];
    if (!base.asignadoA && scrumMembers.length) base.asignadoA = scrumMembers[0];
    if (!base.tipoPrueba) base.tipoPrueba = normalizeProjectList(project?.scrumTestTypes)[0] || "";
    if (!base.nivelPrueba) base.nivelPrueba = normalizeProjectList(project?.scrumLevels)[0] || "";
    return base;
  });
  const [steps,setSteps]=useState(()=>parseSteps(initial?.pasos||""));
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const IS={...inputStyleDark,background:"#1a2535",border:"1px solid #2a3a4a",color:"#e2e8f0",borderRadius:8};
  const SEL={...IS,appearance:"auto"};

  const scrumRoleOptions = ["Product Owner", "Scrum Master", "Developers", "QA / Pruebas"];
  const scrumAssignees = getScrumRoleMembers(project, form.asignadoRol);

  useEffect(() => {
    const scrumMembers = getScrumTeamMembers(project);
    const roleMembers = getScrumRoleMembers(project, form.asignadoRol);
    const projectTypes = normalizeProjectList(project?.scrumTestTypes);
    const projectLevels = normalizeProjectList(project?.scrumLevels);
    setForm((current) => ({
      ...current,
      ...(current.proceso ? {} : { proceso: project?.modules?.[0] || "" }),
      asignadoRol: current.asignadoRol || "QA / Pruebas",
      ...(current.asignadoA && roleMembers.includes(current.asignadoA) ? {} : { asignadoA: roleMembers[0] || scrumMembers[0] || "" }),
      ...(current.tipoPrueba || !projectTypes.length ? {} : { tipoPrueba: projectTypes[0] }),
      ...(current.nivelPrueba || !projectLevels.length ? {} : { nivelPrueba: projectLevels[0] }),
    }));
  }, [project?.modules, project?.scrumTeam, project?.scrumTestTypes, project?.scrumLevels, form.asignadoRol]);

  return (
    <Modal onClose={onClose} wide preventOutsideClose dark>
      <ModalHeader title={initial?`Editar ${tcId}`:"Nuevo Caso de Prueba"} sub={initial?"Modifica y guarda":"Completa los datos del escenario"} onClose={onClose} dark/>
      {(project?.modules?.length || getScrumTeamMembers(project).length) > 0 && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14,padding:"12px 14px",borderRadius:12,background:"#1a2535",border:"1px solid #2a3a4a"}}>
          <div>
            <div style={{fontSize:10,color:"#5a7a9a",textTransform:"uppercase",fontWeight:700,marginBottom:6}}>Módulos del proyecto</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {(project?.modules||[]).length>0 ? (project.modules||[]).map(mod=><span key={mod} style={{fontSize:11,padding:"4px 8px",borderRadius:999,background:"#243550",color:"#7ab3e0"}}>{mod}</span>) : <span style={{fontSize:11,color:"#5a7a9a"}}>Sin módulos definidos</span>}
            </div>
          </div>
          <div>
            <div style={{fontSize:10,color:"#5a7a9a",textTransform:"uppercase",fontWeight:700,marginBottom:6}}>Equipo Scrum</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {(() => {
                const team = normalizeScrumTeam(project?.scrumTeam);
                const members = getScrumTeamMembers({ scrumTeam: team });
                return members.length > 0
                  ? members.map(person => <span key={person} style={{fontSize:11,padding:"4px 8px",borderRadius:999,background:"#1a3530",color:"#4ade80"}}>{person}</span>)
                  : <span style={{fontSize:11,color:"#5a7a9a"}}>Sin equipo definido</span>;
              })()}
            </div>
          </div>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <Field label="Escenario"><textarea style={{...IS,minHeight:48,resize:"vertical",whiteSpace:"pre-wrap",overflowWrap:"anywhere"}} value={form.escenario} onChange={e=>set("escenario",e.target.value)} /></Field>
        <Field label="Módulo">
          <SuggestionInput value={form.proceso} onChange={v=>set("proceso",v)} options={project?.modules||[]} placeholder="Selecciona o escribe un módulo" darkMode={true} />
        </Field>
        <Field label="Precondiciones"><textarea style={{...IS,minHeight:60,resize:"vertical",whiteSpace:"pre-wrap",overflowWrap:"anywhere"}} value={form.precondiciones ?? form.area ?? ""} onChange={e=>setForm(current=>({ ...current, precondiciones: e.target.value, area: e.target.value }))} /></Field>
        <Field label="Rol Scrum">
          <select style={{...SEL}} value={form.asignadoRol||"QA / Pruebas"} onChange={e=>setForm(current=>{
            const nextRol = e.target.value;
            const members = getScrumRoleMembers(project, nextRol);
            return {
              ...current,
              asignadoRol: nextRol,
              asignadoA: members.includes(current.asignadoA) ? current.asignadoA : (members[0] || current.asignadoA || ""),
            };
          })}>
            {scrumRoleOptions.map(role=><option key={role} value={role}>{role}</option>)}
          </select>
        </Field>
        <Field label="Miembro asignado">
          <SuggestionInput value={form.asignadoA||""} onChange={v=>set("asignadoA",v)} options={scrumAssignees} placeholder="Selecciona o escribe un miembro del rol" darkMode={true} />
        </Field>
        <Field label="Tipo de prueba">
          <SuggestionInput value={form.tipoPrueba||""} onChange={v=>set("tipoPrueba",v)} options={project?.scrumTestTypes||EMPTY_PROJECT.scrumTestTypes} placeholder="Selecciona o escribe un tipo" darkMode={true} />
        </Field>
        <Field label="Nivel de prueba">
          <SuggestionInput value={form.nivelPrueba||""} onChange={v=>set("nivelPrueba",v)} options={project?.scrumLevels||EMPTY_PROJECT.scrumLevels} placeholder="Selecciona o escribe un nivel" darkMode={true} />
        </Field>
        <Field label="Estado">
          <select style={{...SEL}} value={form.estado} onChange={e=>set("estado",e.target.value)}>
            {Object.keys(statusConfig).map(k=><option key={k} value={k}>{k}</option>)}
          </select>
        </Field>
        <Field label="Fecha Aprobación"><input type="date" style={IS} value={toInputDate(form.fechaAprobacion)} onChange={e=>set("fechaAprobacion",toDisplayDate(e.target.value))}/></Field>
        <Field label="Fecha Ejecución"><input type="date" style={IS} value={toInputDate(form.fechaEjecucion)} onChange={e=>set("fechaEjecucion",toDisplayDate(e.target.value))}/></Field>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:14}}>
        <Field label="Resultado esperado"><textarea style={{...IS,minHeight:70,resize:"vertical",whiteSpace:"pre-wrap",overflowWrap:"anywhere"}} value={form.resultado ?? form.descripcion ?? ""} onChange={e=>setForm(current=>({ ...current, descripcion: e.target.value, resultado: e.target.value }))} /></Field>
        <Field label="Pasos">
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
              <div style={{fontSize:11,color:"#888"}}>Agrega cada paso con su estado y divídelo visualmente.</div>
              <Btn small variant="ghost" onClick={()=>setSteps(s=>[...s,{id:Date.now(),status:"No ejecutado",text:""}])}>+ Paso</Btn>
            </div>
            {steps.map((step,index)=>(
              <div key={step.id} style={{display:"grid",gridTemplateColumns:"110px 1fr auto",gap:8,alignItems:"center",background:"#1a2535",borderRadius:10,padding:10,border:"1px solid #2a3a4a"}}>
                <select style={{...SEL,minHeight:40}} value={step.status} onChange={e=>setSteps(s=>s.map((item,i)=>i===index?{...item,status:e.target.value}:item))}>
                  {Object.keys(cycleStatusConfig).map(k=><option key={k} value={k}>{k}</option>)}
                </select>
                <input style={{...IS,minHeight:40}} value={step.text} onChange={e=>setSteps(s=>s.map((item,i)=>i===index?{...item,text:e.target.value}:item))} placeholder={`Paso ${index+1}`} />
                <button onClick={()=>setSteps(s=>s.filter((_,i)=>i!==index))} style={{background:"#243550",border:"1px solid #2a3a4a",borderRadius:8,padding:"8px 10px",cursor:"pointer",fontSize:14,color:"#e2e8f0"}}>✕</button>
              </div>
            ))}
          </div>
        </Field>
        <Field label="Adjuntos"><AttachmentZone attachments={form.attachments||[]} onChange={v=>set("attachments",v)}/></Field>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:18}}>
        <button onClick={onClose} style={{background:"transparent",border:"1.5px solid #4a5568",color:"#8a9bb0",borderRadius:8,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancelar</button>
        <button onClick={()=>{if(!form.escenario.trim())return alert("El escenario es requerido");const pasos=serializeSteps(steps);set("pasos",pasos);onSave({...form,pasos,tipoPrueba:String(form.tipoPrueba||"").trim(),nivelPrueba:String(form.nivelPrueba||"").trim()});}} style={{background:"#F5B041",border:"none",color:"#1a1a1a",borderRadius:8,padding:"9px 20px",fontSize:13,fontWeight:800,cursor:"pointer"}}>{initial?"Guardar cambios":"Guardar caso"}</button>
      </div>
    </Modal>
  );
}

function IssueFormModal({initial,issueId,tests,proj,testIds,onSave,onClose,onDelete,darkMode}) {
  const [form,setForm]=useState({ ...EMPTY_ISSUE, ...(initial||{}), fechaCreacion: initial?.fechaCreacion || today(), fechaSolucion: initial?.fechaSolucion || "", bitacoraNota: "", asignadoA: initial?.asignadoA || "" });
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  // always dark inside this modal
  const IS={...inputStyleDark,background:"#1a2535",border:"1px solid #2a3a4a",color:"#e2e8f0",borderRadius:8};
  const SEL={...IS,appearance:"auto"};
  const isEdit=!!initial;
  return (
    <Modal onClose={onClose} wide preventOutsideClose dark>
      <ModalHeader title={isEdit?"Editar issue":"Registrar issue"} sub="Registra la novedad encontrada" onClose={onClose} dark/>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Field label="TEST ID">
              {Array.isArray(tests) ? (() => {
                // compute failed tests from ciclos
                const failedIds = new Set();
                (proj?.ciclos||[]).forEach(c=>{(c.ejecuciones||[]).forEach(e=>{ if(normalizeCycleExecutionStatus(e.estado)==="Fallido") failedIds.add(String(e.tcId)); })});
                const failedTests = tests.filter(t=>failedIds.has(String(t.id)));
                if(failedTests.length===0) {
                  return <select style={{...SEL,minHeight:44}} disabled>
                    <option>No hay casos fallidos en ciclos</option>
                  </select>;
                }
                return (
                <select style={{...SEL,minHeight:44}} value={form.testId||""} onChange={e=>{
                  const id=e.target.value; set("testId",id);
                  const tc = tests.find(t=>String(t.id)===String(id));
                  if(tc){ 
                    set("modulo", tc.proceso || tc.modulo || "");
                    set("escenario", tc.escenario || tc.nombre || "");
                    set("attachments", tc.attachments||[]);
                    // Prefer observation from ciclo execution with estado Fallido, fallback to any nota, then tc.descripcion
                    let obs = tc.descripcion || form.observacion || "";
                    const ciclos = Array.isArray(proj?.ciclos)?proj.ciclos:[];
                    // search latest ciclos first
                    for(let i=ciclos.length-1;i>=0;i--){
                      const ejec = (ciclos[i].ejecuciones||[]).find(x=>String(x.tcId)===String(id));
                      if(!ejec) continue;
                      const note = String(ejec.nota || "").trim();
                      const norm = normalizeCycleExecutionStatus(ejec.estado);
                      if(norm==="Fallido" && note && note.toLowerCase() !== "agregado masivamente") { obs = note; break; }
                      if(note && note.toLowerCase() !== "agregado masivamente") { obs = note; }
                    }
                    set("observacion", obs);
                  }
                }}>
                    <option value="">-- Selecciona un Test fallido --</option>
                    {failedTests.map(t=> <option key={t.id} value={t.id}>{t.id} · {t.escenario||t.nombre}</option>)}
                  </select>
                );
              })() : (
                <input style={{...IS,minHeight:44}} value={form.testId} onChange={e=>set("testId",e.target.value)} placeholder="Ej. Imagen 7"/>
              )}
            </Field>
          <Field label="MÓDULO">
            <input style={{...IS,minHeight:44}} value={form.modulo} onChange={e=>set("modulo",e.target.value)} placeholder="Ej. Activos fijos"/>
          </Field>
        </div>
        <Field label="ESCENARIO / FORMULARIO">
          <input style={{...IS,minHeight:44}} value={form.escenario} onChange={e=>set("escenario",e.target.value)} placeholder="Ej. Registrar bajas"/>
        </Field>
        <Field label="OBSERVACIÓN">
          <textarea style={{...IS,minHeight:90,resize:"vertical",whiteSpace:"pre-wrap",overflowWrap:"anywhere"}} value={form.observacion} onChange={e=>set("observacion",e.target.value)} placeholder="Describe el comportamiento encontrado..."/>
        </Field>
        <Field label="EVIDENCIA (IMAGEN)">
          <AttachmentZone attachments={form.attachments||[]} onChange={v=>set("attachments",v)} imagesOnly/>
        </Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Field label="STATUS">
            <select style={{...SEL,minHeight:44}} value={form.estado} onChange={e=>set("estado",e.target.value)}>
              {Object.keys(issueStatusConfig).map(k=><option key={k} value={k}>{k}</option>)}
            </select>
          </Field>
          <Field label="SEVERITY">
            <select style={{...SEL,minHeight:44}} value={form.severidad} onChange={e=>set("severidad",e.target.value)}>
              {Object.keys(severityConfig).map(k=><option key={k} value={k}>{k}</option>)}
            </select>
          </Field>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Field label="PRIORITY">
            <select style={{...SEL,minHeight:44}} value={form.prioridad} onChange={e=>set("prioridad",e.target.value)}>
              {["Critical","High","Medium","Low"].map(k=><option key={k} value={k}>{k}</option>)}
            </select>
          </Field>
          <Field label="ASIGNADO A">
            <input style={{...IS,minHeight:44}} value={form.asignadoA||""} onChange={e=>set("asignadoA",e.target.value)} placeholder="Nombre"/>
          </Field>
        </div>
        <Field label="SOLUCIÓN / NOTAS">
          <textarea style={{...IS,minHeight:90,resize:"vertical",whiteSpace:"pre-wrap",overflowWrap:"anywhere"}} value={form.bitacoraNota||""} onChange={e=>set("bitacoraNota",e.target.value)} placeholder="Opcional"/>
        </Field>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:18}}>
        <div>
          {isEdit&&onDelete&&(
            <button onClick={onDelete} style={{background:"transparent",border:"1.5px solid #E74C3C",color:"#E74C3C",borderRadius:8,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Eliminar</button>
          )}
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{background:"transparent",border:"1.5px solid #4a5568",color:"#8a9bb0",borderRadius:8,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancelar</button>
          <button onClick={()=>{if(!form.observacion.trim())return alert("La observaci\u00f3n es requerida");onSave(form);}} style={{background:"#F5B041",border:"none",color:"#1a1a1a",borderRadius:8,padding:"9px 20px",fontSize:13,fontWeight:800,cursor:"pointer"}}>{isEdit?"Guardar cambios":"Guardar issue"}</button>
        </div>
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
  const sc=statusConfig[normalizeTestStatus(tc.estado)]||statusConfig["Borrador"];
  const [comment,setComment]=useState("");
  const parsedSteps=useMemo(()=>parseSteps(tc.pasos),[tc.pasos]);
  const ISD={...inputStyleDark,background:"#1a2535",border:"1px solid #2a3a4a",color:"#e2e8f0",borderRadius:8};
  return (
    <Modal onClose={onClose} wide dark>
      <ModalHeader title={tc.escenario||"Caso de Prueba"} sub={`${tc.id} · ${tc.proceso||"—"}`} onClose={onClose} dark/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
        {[["Área",tc.area],["Módulo",tc.proceso],["Tipo",tc.tipoPrueba||"—"],["Nivel",tc.nivelPrueba||"—"],["Asignado a",tc.asignadoA||"—"],["Rol Scrum",tc.asignadoRol||"—"],["Fecha Aprob.",tc.fechaAprobacion||"—"],["Fecha Ejec.",tc.fechaEjecucion||"—"]].map(([l,v])=>(
          <div key={l} style={{background:"#1a2535",borderRadius:8,padding:"9px 12px",border:"1px solid #2a3a4a"}}>
            <div style={{fontSize:10,color:"#5a7a9a",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:3}}>{l}</div>
            <div style={{fontSize:13,color:"#e2e8f0",fontWeight:600}}>{v}</div>
          </div>
        ))}
        <div style={{background:"#1a2535",borderRadius:8,padding:"9px 12px",border:"1px solid #2a3a4a"}}>
          <div style={{fontSize:10,color:"#5a7a9a",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:5}}>Estado</div>
          <span style={{fontSize:11,fontWeight:800,color:sc.color,border:`1.5px solid ${sc.color}`,borderRadius:5,padding:"2px 9px",letterSpacing:"0.07em",textTransform:"uppercase"}}>{tc.estado}</span>
        </div>
      </div>
      {parsedSteps.length>0&&(
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,color:"#5a7a9a",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:8}}>Pasos</div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {parsedSteps.map((step,index)=>{
              const st=cycleStatusConfig[normalizeCycleExecutionStatus(step.status)];
              return (
                <div key={index} style={{display:"flex",gap:10,alignItems:"flex-start",background:"#1a2535",borderRadius:8,padding:"9px 12px",border:"1px solid #2a3a4a",borderLeft:`4px solid ${st?.color||BRAND}`}}>
                  <span style={{fontSize:11,fontWeight:800,color:st?.color||BRAND,whiteSpace:"nowrap",minWidth:110}}>{normalizeCycleExecutionStatus(step.status)}</span>
                  <span style={{fontSize:13,color:"#c8d8e8",lineHeight:1.6,flex:1}}>{step.text||"Sin detalle"}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {tc.resultado&&(
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,color:"#5a7a9a",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:7}}>Resultado Esperado</div>
          <div style={{background:"#1a2535",borderRadius:8,padding:14,fontSize:13,color:"#c8d8e8",lineHeight:1.75,border:"1px solid #2a3a4a",borderLeft:"3px solid #4ade80"}}>{tc.resultado}</div>
        </div>
      )}
      {(tc.historial||[]).length>0&&(
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,color:"#5a7a9a",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:7}}>Historial</div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {[...tc.historial].reverse().map((h,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"center",fontSize:12,background:"#1a2535",borderRadius:6,padding:"6px 10px",border:"1px solid #2a3a4a"}}>
                <span style={{fontFamily:"monospace",fontSize:10,color:"#5a7a9a",whiteSpace:"nowrap"}}>{h.fecha}</span>
                <span style={{color:"#f87171"}}>{h.de}</span>
                <span style={{color:"#5a7a9a"}}>→</span>
                <span style={{color:"#4ade80",fontWeight:700}}>{h.a}</span>
                {h.nota&&<span style={{color:"#7a9ab0",marginLeft:4}}>· {h.nota}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      {(tc.comentarios||[]).length>0&&(
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,color:"#5a7a9a",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:7}}>Comentarios</div>
          {(tc.comentarios||[]).map((c,i)=>(
            <div key={i} style={{background:"#1a2535",borderRadius:8,padding:"8px 12px",marginBottom:6,fontSize:12,color:"#c8d8e8",border:"1px solid #2a3a4a"}}>
              <span style={{fontFamily:"monospace",fontSize:10,color:"#5a7a9a",marginRight:8}}>{c.fecha}</span>{c.texto}
            </div>
          ))}
        </div>
      )}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:10,color:"#5a7a9a",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:8}}>Agregar comentario</div>
        <div style={{display:"flex",gap:8}}>
          <input value={comment} onChange={e=>setComment(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&comment.trim()){onAddComment(tc.id,comment.trim());setComment("");}}} placeholder="Escribe y presiona Enter..." style={{...ISD,flex:1,padding:"9px 12px"}}/>
          <button onClick={()=>{if(comment.trim()){onAddComment(tc.id,comment.trim());setComment("");}}} disabled={!comment.trim()} style={{background:"#243550",border:"1px solid #2a3a4a",color:"#e2e8f0",borderRadius:8,padding:"9px 16px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Agregar</button>
        </div>
      </div>
      {(tc.attachments||[]).length>0&&(
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,color:"#5a7a9a",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:8}}>Adjuntos</div>
          <AttachmentViewer attachments={tc.attachments}/>
        </div>
      )}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:18}}>
        <button onClick={onDelete} style={{background:"transparent",border:"1.5px solid #E74C3C",color:"#E74C3C",borderRadius:8,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Eliminar</button>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onDuplicate} style={{background:"transparent",border:"1.5px solid #4a5568",color:"#8a9bb0",borderRadius:8,padding:"9px 16px",fontSize:13,fontWeight:700,cursor:"pointer"}}>📋 Duplicar</button>
          <button onClick={onEdit} style={{background:"#F5B041",border:"none",color:"#1a1a1a",borderRadius:8,padding:"9px 20px",fontSize:13,fontWeight:800,cursor:"pointer"}}>✏️ Editar</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── ISSUE DETAIL MODAL ───────────────────────────────────────────────────────
function IssueDetailModal({issue,onClose,onEdit,onDelete}) {
  const sc=issueStatusConfig[issue.estado]||issueStatusConfig["Open"];
  const firstImg=(issue.attachments||[]).find(a=>a.type&&a.type.startsWith("image/"));
  const [lightbox,setLightbox]=useState(null);
  return (
    <Modal onClose={onClose} wide dark>
      <ModalHeader title={issue.escenario||"Issue"} sub={`${issue.testId||"—"} · ${issue.modulo||"—"}`} onClose={onClose} dark/>
      {firstImg&&(
        <div style={{marginBottom:16,borderRadius:10,overflow:"hidden",cursor:"zoom-in"}} onClick={()=>setLightbox(firstImg.data)}>
          <img src={firstImg.data} alt="evidencia" style={{width:"100%",maxHeight:220,objectFit:"cover",display:"block"}}/>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
        {[["STATUS",<span style={{fontSize:12,fontWeight:800,color:sc.color,border:`1.5px solid ${sc.color}`,borderRadius:5,padding:"2px 9px",letterSpacing:"0.07em",textTransform:"uppercase"}}>{issue.estado}</span>],
          ["SEVERITY",<span style={{color:"#e2e8f0",fontWeight:600}}>{issue.severidad||"—"}</span>],
          ["PRIORITY",<span style={{color:"#e2e8f0",fontWeight:600}}>{issue.prioridad||"—"}</span>],
          ["FECHA",<span style={{color:"#e2e8f0",fontWeight:600}}>{issue.fechaCreacion||"—"}</span>],
          ["ASIGNADO A",<span style={{color:"#e2e8f0",fontWeight:600}}>{issue.asignadoA||"—"}</span>],
          ["MÓDULO",<span style={{color:"#e2e8f0",fontWeight:600}}>{issue.modulo||"—"}</span>],
        ].map(([l,v])=>(
          <div key={l} style={{background:"#1a2535",borderRadius:8,padding:"10px 12px",border:"1px solid #2a3a4a"}}>
            <div style={{fontSize:10,color:"#5a7a9a",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:5}}>{l}</div>
            <div>{v}</div>
          </div>
        ))}
      </div>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:10,color:"#5a7a9a",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:7}}>OBSERVACIÓN</div>
        <div style={{background:"#1a2535",borderRadius:8,padding:14,fontSize:13,color:"#c8d8e8",lineHeight:1.8,border:"1px solid #2a3a4a",borderLeft:"3px solid #F5B041"}}>{issue.observacion||"—"}</div>
      </div>
      {issue.bitacoraNota&&(
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,color:"#5a7a9a",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:7}}>SOLUCIÓN / NOTAS</div>
          <div style={{background:"#1a2535",borderRadius:8,padding:14,fontSize:13,color:"#c8d8e8",lineHeight:1.7,border:"1px solid #2a3a4a"}}>{issue.bitacoraNota}</div>
        </div>
      )}
      {(issue.attachments||[]).length>1&&(
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,color:"#5a7a9a",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:8}}>EVIDENCIA</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {(issue.attachments||[]).filter(a=>a.type&&a.type.startsWith("image/")).map((att,i)=>(
              <img key={i} src={att.data} alt="evidencia" onClick={()=>setLightbox(att.data)}
                style={{width:80,height:56,objectFit:"cover",borderRadius:7,border:"1px solid #2a3a4a",cursor:"zoom-in"}}/>
            ))}
          </div>
        </div>
      )}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:18}}>
        <button onClick={onDelete} style={{background:"transparent",border:"1.5px solid #E74C3C",color:"#E74C3C",borderRadius:8,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Eliminar</button>
        <button onClick={onEdit} style={{background:"#F5B041",border:"none",color:"#1a1a1a",borderRadius:8,padding:"9px 20px",fontSize:13,fontWeight:800,cursor:"pointer"}}>✏️ Editar</button>
      </div>
      {lightbox&&(
        <div onClick={()=>setLightbox(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out"}}>
          <img src={lightbox} alt="evidencia" style={{maxWidth:"90vw",maxHeight:"90vh",borderRadius:10,boxShadow:"0 8px 48px #000a",objectFit:"contain"}}/>
          <button onClick={()=>setLightbox(null)} style={{position:"absolute",top:20,right:28,background:"transparent",border:"none",color:"#fff",fontSize:28,cursor:"pointer",lineHeight:1}}>✕</button>
        </div>
      )}
    </Modal>
  );
}

// ─── DOCUMENTADOR PANEL ───────────────────────────────────────────────────
function DocumentadorPanel({ darkMode }) {
  const storageKey = "pana_documentador_state";
  const defaultState = {
    caseId: "",
    description: "",
    team: "",
    tester: "",
    steps: []
  };
  const [form, setForm] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return defaultState;
      const parsed = JSON.parse(raw);
      return {
        caseId: parsed.caseId || "",
        description: parsed.description || "",
        team: parsed.team || "",
        tester: parsed.tester || "",
        steps: Array.isArray(parsed.steps) ? parsed.steps : []
      };
    } catch {
      return defaultState;
    }
  });
  const [status, setStatus] = useState("Guardado localmente");
  const [shareStream, setShareStream] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [editingStepId, setEditingStepId] = useState(null);
  const [editorMode, setEditorMode] = useState("pen");
  const [drawColor, setDrawColor] = useState("#E0524A");
  const [isDrawing, setIsDrawing] = useState(false);
  const previewVideoRef = useRef(null);
  const editorCanvasRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(form));
    } catch {}
  }, [form]);

  useEffect(() => {
    const video = previewVideoRef.current;
    if (video && shareStream) {
      video.srcObject = shareStream;
      video.play().catch(() => {});
    }
    return () => {
      if (video) video.srcObject = null;
    };
  }, [shareStream]);

  useEffect(() => {
    return () => {
      shareStream?.getTracks().forEach(track => track.stop());
    };
  }, [shareStream]);

  const setField = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const addStep = (extra = {}) => {
    const newStep = { id: Date.now(), title: "", description: "", imageData: "", isNovedad: false, color: "#E8A33D", ...extra };
    setForm(f => ({ ...f, steps: [...f.steps, newStep] }));
    setStatus("Paso agregado");
  };
  const updateStep = (id, patch) => {
    setForm(f => ({ ...f, steps: f.steps.map(step => step.id === id ? { ...step, ...patch } : step) }));
  };
  const removeStep = (id) => {
    setForm(f => ({ ...f, steps: f.steps.filter(step => step.id !== id) }));
    setStatus("Paso eliminado");
  };
  const handleImageUpload = (id, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateStep(id, { imageData: reader.result });
    reader.readAsDataURL(file);
    setStatus("Imagen cargada en el paso");
  };

  const shareScreen = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setStatus("Tu navegador no soporta compartir pantalla aquí");
      return;
    }
    if (shareStream) {
      shareStream.getTracks().forEach(track => track.stop());
      setShareStream(null);
      setIsSharing(false);
      setStatus("Pantalla desconectada");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 15 }, audio: false });
      const track = stream.getVideoTracks()[0];
      track.addEventListener("ended", () => {
        setShareStream(null);
        setIsSharing(false);
        setStatus("Captura de pantalla detenida");
      });
      setShareStream(stream);
      setIsSharing(true);
      setStatus("Pantalla compartida · listo para capturar");
    } catch {
      setStatus("No se pudo iniciar la compartición de pantalla");
    }
  };

  const captureFrame = () => {
    const video = previewVideoRef.current;
    if (!shareStream || !video) {
      setStatus("Activa la pantalla o pestaña antes de capturar");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    addStep({ title: "Captura de pantalla", description: "Evidencia tomada desde la pantalla compartida", imageData: canvas.toDataURL("image/png") });
    setStatus("Captura añadida como un nuevo paso");
  };

  const openImageEditor = (stepId) => {
    const step = form.steps.find(s => s.id === stepId);
    if (!step || !step.imageData) return;
    setEditingStepId(stepId);
    setImageEditorOpen(true);
    setEditorMode("pen");
    setDrawColor("#E0524A");
    setTimeout(() => {
      const canvas = editorCanvasRef.current;
      if (!canvas) return;
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.drawImage(img, 0, 0);
      };
      img.src = step.imageData;
    }, 0);
  };

  const handleCanvasMouseDown = (e) => {
    const canvas = editorCanvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawing) return;
    const canvas = editorCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (editorMode === "pen") {
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (editorMode === "highlight") {
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = 12;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = 0.4;
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (editorMode === "eraser") {
      ctx.clearRect(x - 10, y - 10, 20, 20);
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  const saveEditorImage = () => {
    const canvas = editorCanvasRef.current;
    if (!canvas) return;
    const newImageData = canvas.toDataURL("image/png");
    updateStep(editingStepId, { imageData: newImageData });
    setImageEditorOpen(false);
    setEditingStepId(null);
    setStatus("Imagen editada y guardada");
  };

  const buildHtml = (onlyNovedades = false) => {
    const dateStr = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });
    const stepsToDisplay = onlyNovedades ? form.steps.filter(s => s.isNovedad) : form.steps;
    const stepsHtml = stepsToDisplay.length
      ? stepsToDisplay.map((step, index) => {
        const bgColor = step.isNovedad ? "rgba(224, 82, 74, 0.08)" : "#f9f9f9";
        const borderColor = step.isNovedad ? "#c0392b" : (step.color || "#e8a33d");
        return `<div style="margin: 18px 0; padding: 16px; border-left: 4px solid ${borderColor}; background: ${bgColor}; border-radius: 8px; page-break-inside: avoid;"><div style="font-weight: 700; font-size: 15px; margin-bottom: 8px; color: #1a1a1a;">${index + 1}. ${step.title || "Paso sin título"}</div><div style="color: #444; font-size: 13px; white-space: pre-wrap; line-height: 1.5; margin-bottom: 10px;">${(step.description || "").replace(/\n/g, "<br/>")}</div>${step.imageData ? `<div style="margin: 12px 0;"><img src="${step.imageData}" style="max-width: 100%; border-radius: 6px; border: 1px solid #ddd;" /></div>` : ""}${step.isNovedad ? `<div style="margin-top: 12px; padding: 10px; color: #c0392b; font-weight: 700; background: rgba(192, 57, 43, 0.12); border-radius: 4px; border-left: 3px solid #c0392b;">⚠️ Novedad detectada</div>` : ""}</div>`;
      }).join("")
      : `<div style="color:#888; padding: 24px; text-align: center; border: 1px dashed #ddd; border-radius: 8px; font-size: 14px;">${onlyNovedades ? "No hay novedades registradas." : "No hay pasos capturados aún."}</div>`;

    const novedadesCount = form.steps.filter(s => s.isNovedad).length;
    const metaHtml = `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0; padding: 16px; background: #f9f9f9; border-radius: 8px; border: 1px solid #e8e8e8;"><div style="padding: 8px;"><div style="font-family: monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #999; margin-bottom: 4px;">Descripción</div><div style="font-size: 13px; color: #333; font-weight: 500;">${form.description || "—"}</div></div><div style="padding: 8px;"><div style="font-family: monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #999; margin-bottom: 4px;">Área / Equipo</div><div style="font-size: 13px; color: #333; font-weight: 500;">${form.team || "—"}</div></div><div style="padding: 8px;"><div style="font-family: monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #999; margin-bottom: 4px;">Documentado por</div><div style="font-size: 13px; color: #333; font-weight: 500;">${form.tester || "—"}</div></div><div style="padding: 8px;"><div style="font-family: monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #999; margin-bottom: 4px;">${onlyNovedades ? "Novedades" : "Total de Pasos"}</div><div style="font-size: 13px; color: #333; font-weight: 500;">${onlyNovedades ? novedadesCount : form.steps.length} ${onlyNovedades ? "novedad" : "paso"}${(onlyNovedades ? novedadesCount : form.steps.length) !== 1 ? "s" : ""}</div></div></div>`;
    const titleSuffix = onlyNovedades ? "(Solo Novedades)" : "";
    return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${form.caseId || "Caso de prueba"}</title><style>* { box-sizing: border-box; } body { font-family: Calibri, "Segoe UI", Arial, sans-serif; padding: 32px 28px; color: #1a1a1a; line-height: 1.6; max-width: 900px; margin: 0 auto; background: #fff; } h1 { font-size: 24px; font-weight: 700; margin: 0 0 12px 0; color: #c0392b; } .header { margin-bottom: 24px; border-bottom: 2px solid #c0392b; padding-bottom: 16px; } .date { color: #666; font-size: 12px; margin-top: 6px; } .steps-title { font-size: 14px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 0.05em; margin: 28px 0 12px 0; padding-top: 12px; border-top: 1px solid #e8e8e8; }</style></head><body><div class="header"><h1>${form.caseId || "Caso de prueba"} ${titleSuffix}</h1><div class="date">Generado el ${dateStr}</div></div>${metaHtml}<div class="steps-title">${onlyNovedades ? "Novedades" : "Pasos de Prueba"}</div><div style="margin-top: 24px;">${stepsHtml}</div></body></html>`;
  };

  const exportHtml = () => {
    const blob = new Blob([buildHtml()], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(form.caseId || "documentador").replace(/\s+/g, "-").toLowerCase() || "documentador"}.html`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Documento HTML descargado");
  };

  const exportWord = () => {
    const html = buildHtml();
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const filename = (form.caseId || "documentador").replace(/\s+/g, "-").toLowerCase();
    link.download = filename + ".doc";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Documento Word descargado");
  };

  const exportWordNovedades = () => {
    const novedades = form.steps.filter(s => s.isNovedad);
    if (!novedades.length) {
      setStatus("No hay novedades para descargar");
      return;
    }
    const html = buildHtml(true);
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const filename = (form.caseId || "documentador").replace(/\s+/g, "-").toLowerCase() + "-novedades";
    link.download = filename + ".doc";
    link.click();
    URL.revokeObjectURL(url);
    setStatus(`Documento con ${novedades.length} novedad${novedades.length !== 1 ? "es" : ""} descargado`);
  };

  const copyPreview = async () => {
    try {
      await navigator.clipboard.writeText(buildHtml());
      setStatus("Contenido copiado al portapapeles");
    } catch {
      setStatus("No fue posible copiar automáticamente");
    }
  };

  const reset = () => {
    setForm(defaultState);
    setStatus("Se reinició el documentador");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <button onClick={() => { addStep(); window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); }} style={{ position: "fixed", right: 20, bottom: 24, zIndex: 50, width: 54, height: 54, borderRadius: "50%", background: "#C0392B", border: "none", color: "#fff", fontSize: 24, cursor: "pointer", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }} title="Agregar paso rápido">＋</button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: isSharing ? "#E8A33D" : "#5d6674", boxShadow: isSharing ? "0 0 0 4px rgba(232,163,61,0.16)" : "none" }} />
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: darkMode ? "#eee" : "#1a1a1a" }}>Documentador de Casos de Prueba</h2>
          </div>
          <p style={{ margin: "3px 0 0", color: darkMode ? "#888" : "#666", fontSize: 12 }}>Comparte pantalla, captura evidencia y deja un registro listo para exportar.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={addStep} style={{ background: darkMode ? "#2C2C2E" : "#fff", border: `1px solid ${darkMode ? "#444" : "#e0e0e0"}`, borderRadius: 8, padding: "8px 12px", color: darkMode ? "#eee" : "#333", cursor: "pointer", fontSize: 12 }}>➕ Agregar paso</button>
          <button onClick={exportWord} style={{ background: "#E8A33D", color: "#1a1406", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>📄 Descargar Word (.doc)</button>
          <button onClick={exportWordNovedades} style={{ background: form.steps.some(s => s.isNovedad) ? "#C0392B" : darkMode ? "#3a3a3d" : "#e0e0e0", color: form.steps.some(s => s.isNovedad) ? "#fff" : darkMode ? "#666" : "#999", border: "none", borderRadius: 8, padding: "8px 12px", cursor: form.steps.some(s => s.isNovedad) ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 700 }}>⚠️ Solo novedades</button>
          <button onClick={exportHtml} style={{ background: "#4FB5A8", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 12 }}>📥 Descargar HTML</button>
        </div>
      </div>
      <div style={{ fontSize: 12, color: darkMode ? "#aaa" : "#777", marginTop: -4 }}>{status}</div>

      <div style={{ background: darkMode ? "#1B2027" : "#0f172a", border: `1px solid ${darkMode ? "#333c47" : "#1e293b"}`, borderRadius: 14, padding: 18, boxShadow: "0 1px 8px rgba(0,0,0,0.08)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <Field label="ID / Tema">
            <input value={form.caseId} onChange={e => setField("caseId", e.target.value)} placeholder="Ej: CP-001 o Soporte contabilidad" style={{ ...inputStyle, background: darkMode ? "#232a33" : "#fff", color: darkMode ? "#eee" : "#222" }} />
          </Field>
          <Field label="Descripción">
            <input value={form.description} onChange={e => setField("description", e.target.value)} placeholder="Descripción breve" style={{ ...inputStyle, background: darkMode ? "#232a33" : "#fff", color: darkMode ? "#eee" : "#222" }} />
          </Field>
          <Field label="Área / equipo">
            <input value={form.team} onChange={e => setField("team", e.target.value)} placeholder="Contabilidad, soporte, etc." style={{ ...inputStyle, background: darkMode ? "#232a33" : "#fff", color: darkMode ? "#eee" : "#222" }} />
          </Field>
          <Field label="Documentado por">
            <input value={form.tester} onChange={e => setField("tester", e.target.value)} placeholder="Tu nombre" style={{ ...inputStyle, background: darkMode ? "#232a33" : "#fff", color: darkMode ? "#eee" : "#222" }} />
          </Field>
        </div>

        <div style={{ background: darkMode ? "#12151a" : "#111827", borderRadius: 10, padding: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ color: darkMode ? "#e7ebf0" : "#f9fafb", fontSize: 13, fontWeight: 700 }}>Vista previa de sesión</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={shareScreen} style={{ background: isSharing ? "#E8A33D" : darkMode ? "#2b3340" : "#f3f4f6", color: isSharing ? "#1a1406" : darkMode ? "#e7ebf0" : "#111827", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                {isSharing ? "🛑 Detener compartir" : "🖥️ Compartir pantalla o pestaña"}
              </button>
              <button onClick={captureFrame} style={{ background: "#4FB5A8", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>📸 Capturar ahora</button>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            {shareStream ? (
              <video ref={previewVideoRef} autoPlay playsInline muted style={{ width: "100%", maxHeight: 240, objectFit: "contain", borderRadius: 8, background: "#000" }} />
            ) : (
              <div style={{ border: `1px dashed ${darkMode ? "#44505c" : "#94a3b8"}`, borderRadius: 8, padding: 24, textAlign: "center", color: darkMode ? "#8b95a3" : "#64748b", fontSize: 12 }}>
                La vista previa está activa cuando compartes una pestaña o ventana.
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
          <button onClick={copyPreview} style={{ background: darkMode ? "#242429" : "#f8f8f8", border: `1px solid ${darkMode ? "#3a3a3d" : "#e0e0e0"}`, color: darkMode ? "#eee" : "#444", padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>📄 Copiar vista previa</button>
          <button onClick={reset} style={{ background: "transparent", border: `1px solid ${darkMode ? "#3a3a3d" : "#e0e0e0"}`, padding: "8px 12px", borderRadius: 8, cursor: "pointer", color: darkMode ? "#eee" : "#444", fontSize: 12 }}>🗑️ Reiniciar</button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {form.steps.length === 0 ? (
          <div style={{ background: darkMode ? "#1C1C1E" : "#fff", border: `1px dashed ${darkMode ? "#444" : "#e0e0e0"}`, borderRadius: 12, padding: 24, textAlign: "center", color: darkMode ? "#888" : "#777", fontSize: 13 }}>
            Aún no hay pasos. Agrega uno para empezar a documentar la evidencia.
          </div>
        ) : form.steps.map((step, index) => (
          <div key={step.id} style={{ background: darkMode ? "#1C1C1E" : "#fff", border: `1px solid ${darkMode ? "#2a2a2a" : "#f0f0f0"}`, borderLeft: `4px solid ${step.color || "#E8A33D"}`, borderRadius: 12, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: darkMode ? "#aaa" : "#666", fontWeight: 700 }}>Paso {index + 1}</div>
              <button onClick={() => removeStep(step.id)} style={{ background: "transparent", border: "none", color: "#C0392B", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Eliminar</button>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              <input value={step.title} onChange={e => updateStep(step.id, { title: e.target.value })} placeholder="Título del paso" style={{ ...inputStyle, background: darkMode ? "#2C2C2E" : "#fff", color: darkMode ? "#eee" : "#222" }} />
              <textarea value={step.description} onChange={e => updateStep(step.id, { description: e.target.value })} placeholder="Describe lo observado, la acción realizada o la evidencia" style={{ minHeight: 70, background: darkMode ? "#2C2C2E" : "#fff", color: darkMode ? "#eee" : "#222" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <label style={{ fontSize: 12, color: darkMode ? "#aaa" : "#666" }}>Color del paso:</label>
                {['#E8A33D', '#4FB5A8', '#E0524A', '#8B95A3'].map(color => (
                  <button key={color} type="button" onClick={() => updateStep(step.id, { color })} style={{ width: 20, height: 20, borderRadius: "50%", border: step.color === color ? "2px solid #fff" : "1px solid #ccc", background: color, cursor: "pointer" }} />
                ))}
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: darkMode ? "#aaa" : "#666", marginLeft: 8 }}>
                  <input type="checkbox" checked={!!step.isNovedad} onChange={e => updateStep(step.id, { isNovedad: e.target.checked })} />
                  Marcar como novedad
                </label>
              </div>
              <label style={{ fontSize: 12, color: darkMode ? "#aaa" : "#666" }}>Adjuntar evidencia (imagen o captura)</label>
              <input type="file" accept="image/*" onChange={e => handleImageUpload(step.id, e.target.files?.[0])} style={{ fontSize: 12 }} />
              {step.imageData && (
                <div style={{ cursor: "pointer", position: "relative", display: "inline-block" }} onClick={() => openImageEditor(step.id)} title="Haz clic para editar">
                  <img src={step.imageData} alt="Evidencia" style={{ maxHeight: 180, objectFit: "contain", borderRadius: 8, border: `1px solid ${darkMode ? "#444" : "#e0e0e0"}` }} />
                  <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", color: "#fff", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>Editar</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {imageEditorOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: darkMode ? "#1B2027" : "#fff", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", maxWidth: "90vw", maxHeight: "90vh", overflow: "auto", padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: darkMode ? "#eee" : "#1a1a1a", fontSize: 18, fontWeight: 700 }}>Editor de Imagen</h3>
              <button onClick={() => setImageEditorOpen(false)} style={{ background: "transparent", border: "none", color: darkMode ? "#aaa" : "#666", fontSize: 20, cursor: "pointer" }}>X</button>
            </div>
            
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <button onClick={() => setEditorMode("pen")} style={{ background: editorMode === "pen" ? "#E0524A" : darkMode ? "#2C2C2E" : "#f0f0f0", color: editorMode === "pen" ? "#fff" : darkMode ? "#eee" : "#333", border: "none", borderRadius: 6, padding: "8px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Dibujar</button>
              <button onClick={() => setEditorMode("highlight")} style={{ background: editorMode === "highlight" ? "#E8A33D" : darkMode ? "#2C2C2E" : "#f0f0f0", color: editorMode === "highlight" ? "#1a1406" : darkMode ? "#eee" : "#333", border: "none", borderRadius: 6, padding: "8px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Resaltar</button>
              <button onClick={() => setEditorMode("eraser")} style={{ background: editorMode === "eraser" ? "#4FB5A8" : darkMode ? "#2C2C2E" : "#f0f0f0", color: editorMode === "eraser" ? "#fff" : darkMode ? "#eee" : "#333", border: "none", borderRadius: 6, padding: "8px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Borrador</button>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <label style={{ fontSize: 12, color: darkMode ? "#aaa" : "#666" }}>Color:</label>
                {["#E0524A", "#E8A33D", "#4FB5A8", "#8B95A3"].map(color => (
                  <button key={color} onClick={() => setDrawColor(color)} style={{ width: 24, height: 24, borderRadius: "50%", border: drawColor === color ? "3px solid #fff" : "1px solid #ccc", background: color, cursor: "pointer" }} />
                ))}
              </div>
            </div>
            
            <div style={{ background: darkMode ? "#12151a" : "#f9f9f9", borderRadius: 8, padding: 8, marginBottom: 16, textAlign: "center", maxHeight: "60vh", overflow: "auto" }}>
              <canvas ref={editorCanvasRef} onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp} style={{ cursor: "crosshair", border: `1px solid ${darkMode ? "#444" : "#ddd"}`, borderRadius: 4, maxWidth: "100%", display: "block", margin: "0 auto" }} />
            </div>
            
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setImageEditorOpen(false)} style={{ background: darkMode ? "#2C2C2E" : "#f0f0f0", color: darkMode ? "#eee" : "#333", border: "none", borderRadius: 6, padding: "10px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Cancelar</button>
              <button onClick={saveEditorImage} style={{ background: "#4FB5A8", color: "#fff", border: "none", borderRadius: 6, padding: "10px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
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
        modules: Array.isArray(p.modules) ? p.modules : [],
        scrumTeam: normalizeScrumTeam(
          p.scrumTeam || {
            productOwner: "",
            scrumMaster: "",
            developers: [],
            qa: Array.isArray(p.testers) ? p.testers : [],
          }
        ),
        scrumTestTypes: normalizeProjectList(p.scrumTestTypes || EMPTY_PROJECT.scrumTestTypes),
        scrumLevels: normalizeProjectList(p.scrumLevels || EMPTY_PROJECT.scrumLevels),
        testers: Array.isArray(p.testers) ? p.testers : getScrumTeamMembers(p),
        issues: (p.issues || []).map(issue => ({
          ...EMPTY_ISSUE,
          ...issue,
          bitacora: normalizeIssueBitacora(issue?.bitacora, issue),
        })),
        tests: (p.tests || []).map(tc => normalizeTestRecord(tc)),
        ciclos:(p.ciclos||[]).map(c=>({
          ...c,
          ejecuciones:c.ejecuciones||[]
        }))
      ,
      members: Array.isArray(p.members) ? p.members : []
      }));
    }catch{return seedProjects;}
  });
  const [activeProjectId,setActiveProjectId]=useState(()=>{try{return localStorage.getItem("pana_active_project")||seedProjects[0].id;}catch{return seedProjects[0].id;}});
  const [currentUser,setCurrentUser]=useState(()=>{try{return JSON.parse(localStorage.getItem("pana_user")||'null');}catch{return null;}});
  const [tab,setTab]=useState("dashboard");
  const [filterEstado,setFilterEstado]=useState("Todos");
  const [filterIssueEstado,setFilterIssueEstado]=useState("Todos");
  const [filterAsignado,setFilterAsignado]=useState("Todos");
  const [filterProceso,setFilterProceso]=useState("Todos");
  const [filterTipoPrueba,setFilterTipoPrueba]=useState("Todos");
  const [filterNivelPrueba,setFilterNivelPrueba]=useState("Todos");
  const [issueViewMode,setIssueViewMode]=useState("table");
  const [issueSearch,setIssueSearch]=useState("");
  const [filterModulo,setFilterModulo]=useState("Todos");
  const [filterFechaDesde,setFilterFechaDesde]=useState("");

  useEffect(()=>{try{if(currentUser) localStorage.setItem("pana_user",JSON.stringify(currentUser)); else localStorage.removeItem("pana_user");}catch{}},[currentUser]);
  const [filterFechaHasta,setFilterFechaHasta]=useState("");
  const [search,setSearch]=useState("");
  const [darkMode,setDarkMode]=useState(()=>{try{return localStorage.getItem("pana_dark")==="1";}catch{return false;}});
  const [sidebarOpen,setSidebarOpen]=useState(()=>{try{return localStorage.getItem("pana_sidebar")!=="0";}catch{return true;}});
  const [sidebarWidth,setSidebarWidth]=useState(()=>{try{return parseInt(localStorage.getItem("pana_sidebar_w"))||220;}catch{return 220;}});
  const sidebarDragging=useRef(false);
  const [showProjectsHome,setShowProjectsHome]=useState(false);
  const [showProjSelector,setShowProjSelector]=useState(true);
  const [showProjForm,setShowProjForm]=useState(false);
  const [editProj,setEditProj]=useState(null);
  const [showTcForm,setShowTcForm]=useState(false);
  const [editTc,setEditTc]=useState(null);
  const [viewTc,setViewTc]=useState(null);
  const [observationTarget,setObservationTarget]=useState(null);
  const [showIssueForm,setShowIssueForm]=useState(false);
  const [editIssue,setEditIssue]=useState(null);
  const [viewIssue,setViewIssue]=useState(null);
  const [previewImg,setPreviewImg]=useState(null);
  const [showCicloForm,setShowCicloForm]=useState(false);
  const [editCiclo,setEditCiclo]=useState(null);
  const [expandedCiclos,setExpandedCiclos]=useState({});
  const [cycleViewMode,setCycleViewMode]=useState("compacta");
  const [bulkTcSelection,setBulkTcSelection]=useState({});
  const [testViewMode,setTestViewMode]=useState("expandida");
  const [selectedTestIds,setSelectedTestIds]=useState([]);
  const [bulkTestStatus,setBulkTestStatus]=useState("");
  const [bulkTestAssignee,setBulkTestAssignee]=useState("");
  const [showJira,setShowJira]=useState(false);
  const [confirmDelete,setConfirmDelete]=useState(null);
  const [recentlyDeleted,setRecentlyDeleted]=useState([]); // {key,type,id,projectId,payload,timeoutId}
  const [hoveredTestId,setHoveredTestId]=useState(null);
  const [hoveredProjectId,setHoveredProjectId]=useState(null);
  const [hoveredCicloId,setHoveredCicloId]=useState(null);
  const [storageWarn,setStorageWarn]=useState(false);
  const [selectedAiTc,setSelectedAiTc]=useState(null);
  const [expandedAvailableTc,setExpandedAvailableTc]=useState(null);
  const [expandedCycleTcDetails,setExpandedCycleTcDetails]=useState({});
  const [scrumTestTypeInput,setScrumTestTypeInput]=useState("");
  const [scrumLevelInput,setScrumLevelInput]=useState("");
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

  useEffect(()=>{
    if(!proj) return;
    // If the previously selected test no longer exists, clear the selection and previous AI state.
    if(selectedAiTc && !proj.tests.some(t=>t.id===selectedAiTc.id)) {
      setSelectedAiTc(null);
    }
  }, [proj?.id, proj?.tests?.length, selectedAiTc]);

  function toggleCycleTcSelection(cicloId, tcId){
    setBulkTcSelection(prev=>{
      const current=prev[cicloId]||[];
      return {
        ...prev,
        [cicloId]: current.includes(tcId) ? current.filter(id=>id!==tcId) : [...current, tcId],
      };
    });
  }
  function selectAllCycleTcs(cicloId, tcIds){
    setBulkTcSelection(prev=>({...prev,[cicloId]:tcIds}));
  }
  function clearCycleTcSelection(cicloId){
    setBulkTcSelection(prev=>({...prev,[cicloId]:[]}));
  }
  function addSelectedTcsToCiclo(cicloId, tcIds){
    if(!tcIds?.length) return;
    setProjects(ps=>ps.map(p=>p.id!==activeProjectId? p : {
      ...p,
      ciclos:(p.ciclos||[]).map(c=>c.id!==cicloId? c : {
        ...c,
        ejecuciones:[...(c.ejecuciones||[]), ...tcIds
          .filter(tcId=>(!(c.ejecuciones||[]).some(e=>e.tcId===tcId)))
          .map(tcId=>({tcId,estado:"No ejecutado",fechaEjecucion:"",nota:""}))]
      })
    }));
    clearCycleTcSelection(cicloId);
  }

  // project CRUD
  function saveProject(form){
    const scrumTeam = normalizeScrumTeam(form.scrumTeam);
    const testers = getScrumTeamMembers({ scrumTeam });
    const payload = { ...form, modules: normalizeProjectList(form.modules), scrumTeam, scrumTestTypes: normalizeProjectList(form.scrumTestTypes), scrumLevels: normalizeProjectList(form.scrumLevels), testers, members: form.members || [] };
    if(editProj){setProjects(ps=>ps.map(p=>p.id===editProj.id?{...p,...payload}:p));setEditProj(null);}
    else{const np={id:`proj-${Date.now()}`,createdAt:today(),tests:[],issues:[],...payload};setProjects(ps=>[...ps,np]);setActiveProjectId(np.id);}
    setShowProjForm(false);
  }
  function deleteProject(id){
    if(!(currentUser && Array.isArray(currentUser.roles) && currentUser.roles.includes("admin"))){
      alert("No autorizado: se requiere rol 'admin' para eliminar proyectos.");
      setConfirmDelete(null);
      return;
    }
    const r=projects.filter(p=>p.id!==id);setProjects(r);setActiveProjectId(r[0]?.id||null);setConfirmDelete(null);
  }
  function updateProjectListField(field, nextItems) {
    setProjects(ps=>ps.map(p=>p.id!==activeProjectId?p:{...p,[field]:normalizeProjectList(nextItems)}));
  }
  function addProjectListItem(field, inputValue, setter) {
    const value = String(inputValue || "").trim();
    if (!value) return;
    const currentItems = normalizeProjectList(proj?.[field]);
    const nextItems = [...currentItems, ...value.split(",").map(item => item.trim()).filter(Boolean)];
    updateProjectListField(field, nextItems.filter((item, index) => nextItems.indexOf(item) === index));
    setter("");
  }
  function removeProjectListItem(field, item) {
    const currentItems = normalizeProjectList(proj?.[field]);
    updateProjectListField(field, currentItems.filter(entry => entry !== item));
  }

  // TC CRUD
  function saveTC(form){
    const prevEstado=editTc?.estado;
    const newEstado=form.estado;
    const histEntry=(prevEstado&&prevEstado!==newEstado)?{fecha:today(),de:prevEstado,a:newEstado,nota:""}:null;
    const normalizedForm = {
      ...form,
      proceso: form.proceso?.trim() || "",
      asignadoA: form.asignadoA?.trim() || "",
      asignadoRol: form.asignadoRol?.trim() || inferScrumRole(proj, form.asignadoA),
      tipoPrueba: form.tipoPrueba?.trim() || "",
      nivelPrueba: form.nivelPrueba?.trim() || "",
      area: String(form.precondiciones ?? form.area ?? "").trim(),
      precondiciones: String(form.precondiciones ?? form.area ?? "").trim(),
      escenario: form.escenario?.trim() || "",
      descripcion: String(form.descripcion ?? form.resultado ?? "").trim(),
      resultado: String(form.resultado ?? form.descripcion ?? "").trim(),
    };
    setProjects(ps=>ps.map(p=>{
      if(p.id!==activeProjectId)return p;
      const nextStatus = normalizeTestStatus(normalizedForm.estado);
      const finalForm = { ...normalizedForm, estado: nextStatus };
      if(editTc){
        return{...p,tests:p.tests.map(t=>t.id===editTc.id?{...t,...finalForm,historial:histEntry?[...(t.historial||[]),histEntry]:(t.historial||[])}:t)};
      }else{
        const newId=nextTcId(p.tests);
        return{...p,tests:[...p.tests,{id:newId,...finalForm,historial:[{fecha:today(),de:"—",a:finalForm.estado,nota:"Creado"}],comentarios:[]}]};
      }
    }));
    setShowTcForm(false);setEditTc(null);setViewTc(null);
  }
  function deleteTC(id){
    if(!(currentUser && Array.isArray(currentUser.roles) && currentUser.roles.includes("admin"))){
      alert("No autorizado: se requiere rol 'admin' para eliminar casos de prueba.");
      setConfirmDelete(null);
      return;
    }
    setProjects(ps=>ps.map(p=>p.id!==activeProjectId?p:{...p,tests:p.tests.filter(t=>t.id!==id)}));
    setViewTc(null);setConfirmDelete(null);
  }

  function scheduleRecentlyDeleted(entry){
    const key = `${entry.type}:${entry.id}:${Date.now()}`;
    const timeoutId = setTimeout(()=>{
      setRecentlyDeleted(prev=>prev.filter(x=>x.key!==key));
    },8000);
    setRecentlyDeleted(prev=>[...prev,{...entry,key,timeoutId}]);
  }

  function softDelete({type,id,projectId}){
    if(!(currentUser && Array.isArray(currentUser.roles) && currentUser.roles.includes("admin"))){
      alert("No autorizado: se requiere rol 'admin' para eliminar.");
      return;
    }
    if(type==="tc"){
      const projIndex = projects.findIndex(p=>p.id===projectId);
      if(projIndex===-1) return;
      const proj = projects[projIndex];
      const tcIndex = proj.tests.findIndex(t=>t.id===id);
      const tc = proj.tests[tcIndex];
      if(!tc) return;
      // remove test
      setProjects(ps=>ps.map(p=>p.id!==projectId?p:{...p,tests:p.tests.filter(t=>t.id!==id)}));
      scheduleRecentlyDeleted({type:"tc",id,projectId,payload:tc, index: tcIndex});
      return;
    }
    if(type==="project"){
      const projIndex = projects.findIndex(p=>p.id===id);
      const proj = projects[projIndex];
      if(!proj) return;
      setProjects(ps=>ps.filter(p=>p.id!==id));
      // if deleted active project, move activeProjectId
      setActiveProjectId(prev=>{const first=projects.find(p=>p.id!==id); return first?first.id:null;});
      scheduleRecentlyDeleted({type:"project",id,payload:proj, index: projIndex});
      return;
    }
    if(type==="ciclo"){
      const proj = projects.find(p=>p.id===projectId);
      if(!proj) return;
      const cicloIndex = (proj.ciclos||[]).findIndex(c=>c.id===id);
      const ciclo = (proj.ciclos||[])[cicloIndex];
      if(!ciclo) return;
      setProjects(ps=>ps.map(p=>p.id!==projectId?p:{...p,ciclos:(p.ciclos||[]).filter(c=>c.id!==id)}));
      scheduleRecentlyDeleted({type:"ciclo",id,projectId,payload:ciclo, index: cicloIndex});
      return;
    }
    if(type==="issue"){
      const proj = projects.find(p=>p.id===projectId);
      if(!proj) return;
      const issueIndex = (proj.issues||[]).findIndex(i=>i.id===id);
      const issue = (proj.issues||[])[issueIndex];
      if(!issue) return;
      setProjects(ps=>ps.map(p=>p.id!==projectId?p:{...p,issues:(p.issues||[]).filter(i=>i.id!==id)}));
      scheduleRecentlyDeleted({type:"issue",id,projectId,payload:issue, index: issueIndex});
      return;
    }
  }

  function undoDelete(key){
    const entry = recentlyDeleted.find(r=>r.key===key);
    if(!entry) return;
    clearTimeout(entry.timeoutId);
    setRecentlyDeleted(prev=>prev.filter(r=>r.key!==key));
    if(entry.type==="tc"){
      setProjects(ps=>ps.map(p=>{
        if(p.id!==entry.projectId) return p;
        const tests = Array.isArray(p.tests)?[...p.tests]:[];
        const idx = (typeof entry.index==="number" && entry.index>=0)?Math.min(entry.index, tests.length):tests.length;
        tests.splice(idx,0,entry.payload);
        return {...p, tests};
      }));
      return;
    }
    if(entry.type==="project"){
      setProjects(ps=>{
        const arr = Array.isArray(ps)?[...ps]:[];
        const idx = (typeof entry.index==="number" && entry.index>=0)?Math.min(entry.index, arr.length):arr.length;
        arr.splice(idx,0,entry.payload);
        return arr;
      });
      setActiveProjectId(entry.payload.id);
      return;
    }
    if(entry.type==="ciclo"){
      setProjects(ps=>ps.map(p=>{
        if(p.id!==entry.projectId) return p;
        const ciclos = Array.isArray(p.ciclos)?[...p.ciclos]:[];
        const idx = (typeof entry.index==="number" && entry.index>=0)?Math.min(entry.index, ciclos.length):ciclos.length;
        ciclos.splice(idx,0,entry.payload);
        return {...p, ciclos};
      }));
      return;
    }
    if(entry.type==="issue"){
      setProjects(ps=>ps.map(p=>{
        if(p.id!==entry.projectId) return p;
        const issues = Array.isArray(p.issues)?[...p.issues]:[];
        const idx = (typeof entry.index==="number" && entry.index>=0)?Math.min(entry.index, issues.length):issues.length;
        issues.splice(idx,0,entry.payload);
        return {...p, issues};
      }));
      return;
    }
  }
  function duplicateTC(tc){
    setProjects(ps=>ps.map(p=>{
      if(p.id!==activeProjectId)return p;
      const newId=nextTcId(p.tests);
      return{...p,tests:[...p.tests,{...tc,id:newId,escenario:tc.escenario+" (copia)",historial:[{fecha:today(),de:"—",a:tc.estado,nota:"Duplicado de "+tc.id}],comentarios:[]}]};
    }));
    setViewTc(null);
  }
  function updateTCStatus(id,estado){
    const nextState = normalizeTestStatus(estado);
    setProjects(ps=>ps.map(p=>{
      if(p.id!==activeProjectId)return p;
      return{...p,tests:p.tests.map(t=>{
        if(t.id!==id)return t;
        const entry={fecha:today(),de:t.estado,a:nextState,nota:""};
        return{...t,estado:nextState,historial:[...(t.historial||[]),entry]};
      })};
    }));
  }
  function toggleTestSelection(id){
    setSelectedTestIds(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  }
  function selectAllVisibleTests(ids){
    setSelectedTestIds(prev=>Array.from(new Set([...prev,...ids])));
  }
  function clearSelectedTests(ids){
    if(!ids?.length) return;
    setSelectedTestIds(prev=>prev.filter(id=>!ids.includes(id)));
  }
  function applyBulkChangesToTests(){
    if(!selectedTestIds.length) return;
    const hasStatus = !!bulkTestStatus;
    const hasAssignee = bulkTestAssignee.trim()!=="";
    if(!hasStatus && !hasAssignee) return;

    setProjects(ps=>ps.map(p=>{
      if(p.id!==activeProjectId) return p;
      return {
        ...p,
        tests:p.tests.map(t=>{
          if(!selectedTestIds.includes(t.id)) return t;
          let next={...t};
          if(hasStatus){
            const normalized = normalizeTestStatus(bulkTestStatus);
            if(normalized!==t.estado){
              next={
                ...next,
                estado:normalized,
                historial:[...(next.historial||[]),{fecha:today(),de:t.estado,a:normalized,nota:"Cambio masivo"}]
              };
            }
          }
          if(hasAssignee){
            next={...next,asignadoA:bulkTestAssignee.trim()};
          }
          return next;
        })
      };
    }));
  }
  function handleApplyAiProposal(proposal){
    if(!proposal || !selectedAiTc) return;
    const opts = arguments[1] || { applyId:false, applySteps:true, applyResult:true, applyPrecondiciones:false };
    const oldId = selectedAiTc.id;
    const newPasos = opts.applySteps ? proposal.enrichedSteps.map((step, index)=>`${index+1}. ${step}`).join("\n") : selectedAiTc.pasos;
    const newResultado = opts.applyResult
      ? proposal.expectedResult
      : (selectedAiTc.resultado || selectedAiTc.descripcion || "");
    const newPrecondiciones = opts.applyPrecondiciones
      ? (Array.isArray(proposal.precondiciones) ? proposal.precondiciones.join("\n") : (proposal.precondiciones || ""))
      : (selectedAiTc.precondiciones || selectedAiTc.area || "");
    const applyId = opts.applyId === true;

    function makeUniqueId(tests, desired) {
      if(!tests.some(t=>t.id===desired)) return desired;
      let i=1;
      while(tests.some(t=>t.id===`${desired}-${i}`)) i++;
      return `${desired}-${i}`;
    }

    const finalNewId = applyId ? makeUniqueId(proj.tests||[], proposal.suggestedId) : oldId;

    setProjects(ps=>ps.map(p=>{
      if(p.id!==activeProjectId) return p;
      return {
        ...p,
        tests: p.tests.map(tc => tc.id !== oldId ? tc : {
          ...tc,
          id: finalNewId,
          pasos: newPasos,
          resultado: newResultado,
          descripcion: newResultado,
          precondiciones: newPrecondiciones,
          area: newPrecondiciones,
          historial: [ ...(tc.historial||[]), { fecha: today(), de: oldId, a: finalNewId, nota: `ID sugerido: ${proposal.suggestedId}` } ]
        }),
        issues: (p.issues||[]).map(is => is.testId===oldId ? { ...is, testId: finalNewId } : is),
        ciclos: (p.ciclos||[]).map(c=>({ ...c, ejecuciones:(c.ejecuciones||[]).map(e=> e.tcId===oldId ? { ...e, tcId: finalNewId } : e) }))
      };
    }));

    setSelectedAiTc(prev => prev ? { ...prev, id: finalNewId, pasos: newPasos, resultado: newResultado, descripcion: newResultado, precondiciones: newPrecondiciones, area: newPrecondiciones, historial: [ ...(prev.historial||[]), { fecha: today(), de: oldId, a: finalNewId, nota: `ID sugerido: ${proposal.suggestedId}` } ] } : prev);
    setViewTc(prev => prev && prev.id === oldId ? { ...prev, id: finalNewId, pasos: newPasos, resultado: newResultado, descripcion: newResultado, precondiciones: newPrecondiciones, area: newPrecondiciones, historial: [ ...(prev.historial||[]), { fecha: today(), de: oldId, a: finalNewId, nota: `ID sugerido: ${proposal.suggestedId}` } ] } : prev);
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
    const manualLog = String(form?.bitacoraNota || "").trim();
    const cleanedForm = { ...form };
    delete cleanedForm.bitacoraNota;
    
    // Compress images only if localStorage is getting too large
    Promise.all(
      (cleanedForm.attachments || []).map(async (att) => {
        if (att.type && att.type.startsWith("image/") && att.data && att.data.length > 200000) {
          try {
            const compressed = await compressImage(att.data, 0.75, 1000, 800);
            return { ...att, data: compressed };
          } catch (e) {
            return att;
          }
        }
        return att;
      })
    ).then(compressed => {
      cleanedForm.attachments = compressed;
      
      setProjects(ps=>ps.map(p=>{
        if(p.id!==activeProjectId)return p;
        if(editIssue){
          return{
            ...p,
            issues:p.issues.map(i=>{
              if(i.id!==editIssue.id) return i;
              const nextIssue = { ...i, ...cleanedForm };
              const nextBitacora = [...normalizeIssueBitacora(i.bitacora, i)];
              const changes = summarizeIssueChanges(i, nextIssue);
              if (changes) {
                const autoEntry = buildIssueLogEntry(changes, nextIssue.estado || "Open");
                if (autoEntry) nextBitacora.push(autoEntry);
              }
              if (manualLog) {
                const noteEntry = buildIssueLogEntry(manualLog, nextIssue.estado || "Open", today(), "nota");
                if (noteEntry) nextBitacora.push(noteEntry);
              }
              return { ...nextIssue, bitacora: nextBitacora };
            })
          };
        }
        const newId=(p.issues.length?Math.max(...p.issues.map(i=>i.id)):0)+1;
        const createdIssue = { id:newId, ...cleanedForm, fechaCreacion: cleanedForm.fechaCreacion || today(), attachments: cleanedForm.attachments||[] };
        const initialBitacora = normalizeIssueBitacora(cleanedForm.bitacora, createdIssue);
        if (manualLog) {
          const noteEntry = buildIssueLogEntry(manualLog, createdIssue.estado || "Open", today(), "nota");
          if (noteEntry) initialBitacora.push(noteEntry);
        }
        return{...p,issues:[...p.issues,{...createdIssue,bitacora:initialBitacora}]};
      }));
      setShowIssueForm(false);setEditIssue(null);setViewIssue(null);
    });
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
    if(!(currentUser && Array.isArray(currentUser.roles) && currentUser.roles.includes("admin"))){
      alert("No autorizado: se requiere rol 'admin' para eliminar ciclos.");
      setConfirmDelete(null);
      return;
    }
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
  function updateTcAttachments(tcId, attachments){
    setProjects(ps=>ps.map(p=>{
      if(p.id!==activeProjectId)return p;
      return{...p,tests:(p.tests||[]).map(tc=>tc.id===tcId?{...tc,attachments}:tc)};
    }));
  }
  function updateStepEstado(tcId, stepIndex, estado) {
    setProjects(ps=>ps.map(p=>{
      if(p.id!==activeProjectId)return p;
      const updatedTests = p.tests.map(tc=>{
        if(tc.id!==tcId)return tc;
        const steps = parseSteps(tc.pasos || "");
        const normalizedEstado = normalizeCycleExecutionStatus(estado);
        const nextSteps = steps.map((step,index)=>index===stepIndex?{...step,status:normalizedEstado}:step);
        const nextPasos = serializeSteps(nextSteps);
        return {...tc,pasos:nextPasos};
      });
      const updatedTc = updatedTests.find(tc=>tc.id===tcId);
      const derivedState = summarizeCycleStepStatuses(parseSteps(updatedTc?.pasos || ""));
      return {
        ...p,
        tests: updatedTests,
        ciclos: (p.ciclos||[]).map(c=>({
          ...c,
          ejecuciones: (c.ejecuciones||[]).map(e=>e.tcId!==tcId?e:{...e,estado:derivedState,fechaEjecucion:derivedState!=="No ejecutado"?(e.fechaEjecucion||today()):e.fechaEjecucion})
        }))
      };
    }));
  }
  function iniciarEjecucion(cicloId, tcId) {
    setProjects(ps=>ps.map(p=>{
      if(p.id!==activeProjectId)return p;
      const updatedTests = p.tests.map(tc=>{
        if(tc.id!==tcId)return tc;
        const steps = parseSteps(tc.pasos || "").map((step,index)=>{
          const currentStatus = normalizeCycleExecutionStatus(step.status);
          if (index === 0 && currentStatus === "No ejecutado") {
            return { ...step, status: "En Progreso" };
          }
          return step;
        });
        return {...tc,pasos:serializeSteps(steps)};
      });
      const updatedTc = updatedTests.find(tc=>tc.id===tcId);
      const derivedState = summarizeCycleStepStatuses(parseSteps(updatedTc?.pasos || ""));
      return {
        ...p,
        tests: updatedTests,
        ciclos: (p.ciclos||[]).map(c=>c.id!==cicloId?c:{...c,ejecuciones:(c.ejecuciones||[]).map(e=>e.tcId!==tcId?e:{...e,estado:derivedState,fechaEjecucion:derivedState!=="No ejecutado"?(e.fechaEjecucion||today()):e.fechaEjecucion})})
      };
    }));
  }
  // Promover fallidos a nuevo ciclo
  function promoverFallidos(cicloId){
    const ciclo=(proj.ciclos||[]).find(c=>c.id===cicloId);
    if(!ciclo)return;
    const ejecs=ciclo.ejecuciones||[];
    const enProgreso=ejecs.filter(e=>normalizeCycleExecutionStatus(e.estado)==="En Progreso");
    if(!enProgreso.length){alert("No hay casos en progreso en este ciclo.");return;}
    const num=(proj.ciclos||[]).length+1;
    const newCiclo={
      id:`ciclo-${Date.now()}`,
      nombre:`Ciclo ${num}`,
      modulo:ciclo.modulo,
      fechaInicio:"",fechaFin:"",
      descripcion:`Re-ejecución de ${enProgreso.length} caso(s) en progreso del ${ciclo.nombre}`,
      ejecuciones:enProgreso.map(e=>({tcId:e.tcId,estado:"No ejecutado",fechaEjecucion:"",nota:`Promovido desde ${ciclo.nombre}`}))
    };
    setProjects(ps=>ps.map(p=>p.id!==activeProjectId?p:{...p,ciclos:[...(p.ciclos||[]),newCiclo]}));
    alert(`✅ Ciclo ${num} creado con ${enProgreso.length} caso(s) en progreso del ${ciclo.nombre}.`);
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
      {showProjForm && <ProjectFormModal onSave={saveProject} onClose={()=>setShowProjForm(false)} darkMode={darkMode} />}
    </div>
  );

  const tests = useMemo(() => (proj.tests || []).map(tc => normalizeTestRecord(tc)), [proj.tests]);
  const issues=proj.issues;

  const asignadosList=useMemo(()=>{const s=new Set(tests.map(t=>t.asignadoA).filter(Boolean));return["Todos",...s];},[tests]);
  const procesosList=useMemo(()=>{const s=new Set(tests.map(t=>t.proceso).filter(Boolean));return["Todos",...s];},[tests]);
  const tiposPruebaList=useMemo(()=>{
    const values = new Set([...(proj?.scrumTestTypes||[]), ...tests.map(t=>t.tipoPrueba).filter(Boolean)]);
    return ["Todos", ...values];
  },[proj?.scrumTestTypes, tests]);
  const nivelesPruebaList=useMemo(()=>{
    const values = new Set([...(proj?.scrumLevels||[]), ...tests.map(t=>t.nivelPrueba).filter(Boolean)]);
    return ["Todos", ...values];
  },[proj?.scrumLevels, tests]);
  const modulosList=useMemo(()=>{const s=new Set(issues.map(i=>i.modulo).filter(Boolean));return["Todos",...s];},[issues]);

  function parseDate(str){if(!str)return null;const[d,m,y]=str.split("/");return new Date(`${y}-${m}-${d}`);}

  const filteredTests=useMemo(()=>tests.filter(t=>{
    const mE=filterEstado==="Todos"||t.estado===filterEstado;
    const mS=!search||[t.id,t.escenario,t.proceso,t.area].join(" ").toLowerCase().includes(search.toLowerCase());
    const mA=filterAsignado==="Todos"||t.asignadoA===filterAsignado;
    const mP=filterProceso==="Todos"||t.proceso===filterProceso;
    const mT=filterTipoPrueba==="Todos"||String(t.tipoPrueba||"").trim()===filterTipoPrueba;
    const mN=filterNivelPrueba==="Todos"||String(t.nivelPrueba||"").trim()===filterNivelPrueba;
    const mD=!filterFechaDesde||!t.fechaEjecucion||(parseDate(t.fechaEjecucion)>=parseDate(filterFechaDesde));
    const mH=!filterFechaHasta||!t.fechaEjecucion||(parseDate(t.fechaEjecucion)<=parseDate(filterFechaHasta));
    return mE&&mS&&mA&&mP&&mT&&mN&&mD&&mH;
  }),[tests,filterEstado,search,filterAsignado,filterProceso,filterTipoPrueba,filterNivelPrueba,filterFechaDesde,filterFechaHasta]);

  const filteredIssues=useMemo(()=>issues.filter(i=>{
    const mE=filterIssueEstado==="Todos"||i.estado===filterIssueEstado;
    const mM=filterModulo==="Todos"||i.modulo===filterModulo;
    const searchText = issueSearch.trim().toLowerCase();
    const mS=!searchText||[
      i.testId,
      i.formulario,
      i.escenario,
      i.modulo,
      i.observacion,
      issueBitacoraSummary(i),
    ].filter(Boolean).join(" ").toLowerCase().includes(searchText);
    return mE&&mM&&mS;
  }),[issues,filterIssueEstado,filterModulo,issueSearch]);

  const filteredTestStats=useMemo(()=>{const c={};Object.keys(statusConfig).forEach(k=>c[k]=0);filteredTests.forEach(t=>{const normalizedStatus=normalizeTestStatus(t.estado);if(c[normalizedStatus]!==undefined)c[normalizedStatus]++;});return c;},[filteredTests]);
  const filteredIssueStats=useMemo(()=>({
    open:filteredIssues.filter(i=>i.estado==="Open").length,
    blocked:filteredIssues.filter(i=>i.estado==="Blocked").length,
    readyRetest:filteredIssues.filter(i=>i.estado==="Ready for Retest").length,
    inProg:filteredIssues.filter(i=>i.estado==="In Progress").length,
    closed:filteredIssues.filter(i=>i.estado==="Closed").length,
    reopen:filteredIssues.filter(i=>i.estado==="Re-Open").length,
    total:filteredIssues.length
  }),[filteredIssues]);

  const issueLastUpdateLabel = useMemo(()=>{
    const latest = [...issues].sort((a,b)=>{
      const aDate = normalizeIssueBitacora(a.bitacora, a).slice(-1)[0]?.fecha || a.fechaSolucion || a.fechaCreacion || "01/01/1970";
      const bDate = normalizeIssueBitacora(b.bitacora, b).slice(-1)[0]?.fecha || b.fechaSolucion || b.fechaCreacion || "01/01/1970";
      const ad = parseDate(aDate) || new Date(0);
      const bd = parseDate(bDate) || new Date(0);
      return bd - ad;
    })[0];
    const dateLabel = latest ? (normalizeIssueBitacora(latest.bitacora, latest).slice(-1)[0]?.fecha || latest.fechaSolucion || latest.fechaCreacion || today()) : today();
    const timeLabel = new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    return `${dateLabel}, ${timeLabel}`;
  },[issues]);

  const filteredTimelineData=useMemo(()=>{
    const map={};
    filteredTests.filter(t=>t.fechaEjecucion).forEach(t=>{map[t.fechaEjecucion]=(map[t.fechaEjecucion]||0)+1;});
    return Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0])).map(([d,v])=>({label:d.slice(0,5),value:v}));
  },[filteredTests]);

  // Build a per-date map with state counts to feed sparklines for KPIs
  const timelineMap = useMemo(()=>{
    const m={};
    filteredTests.filter(t=>t.fechaEjecucion).forEach(t=>{
      const normalized = normalizeTestStatus(t.estado);
      if(!m[t.fechaEjecucion]) m[t.fechaEjecucion]={Aprobado:0,Revisión:0,Borrador:0,total:0};
      m[t.fechaEjecucion][normalized] = (m[t.fechaEjecucion][normalized]||0) + 1;
      m[t.fechaEjecucion].total = (m[t.fechaEjecucion].total||0) + 1;
    });
    return m;
  },[filteredTests]);

  const timelineKeys = useMemo(()=>Object.keys(timelineMap).sort(),[timelineMap]);

  const sparkApproved = timelineKeys.map(d=>({label:d, value: timelineMap[d].Aprobado||0}));
  const sparkReview = timelineKeys.map(d=>({label:d, value: timelineMap[d].Revisión||0}));
  const sparkExecuted = timelineKeys.map(d=>({label:d, value: timelineMap[d].total||0}));

  // Issues spark (by creation date)
  const issuesByDate = useMemo(()=>{
    const m={}; filteredIssues.forEach(i=>{ if(!i.fechaCreacion) return; m[i.fechaCreacion]=(m[i.fechaCreacion]||0)+1; }); return m;
  },[filteredIssues]);
  const issueKeys = useMemo(()=>Object.keys(issuesByDate).sort(),[issuesByDate]);
  const sparkIssues = issueKeys.map(d=>({label:d, value: issuesByDate[d]||0}));

  useEffect(()=>{
    setSelectedTestIds(prev=>prev.filter(id=>tests.some(t=>t.id===id)));
  },[tests]);

  const visibleTestIds=useMemo(()=>filteredTests.map(t=>t.id),[filteredTests]);
  const selectedVisibleCount=useMemo(()=>visibleTestIds.filter(id=>selectedTestIds.includes(id)).length,[visibleTestIds,selectedTestIds]);
  const allVisibleSelected=visibleTestIds.length>0&&selectedVisibleCount===visibleTestIds.length;

  const pct=(n,total=filteredTests.length)=>total?Math.round((n/total)*100):0;
  const execPct=pct(filteredTestStats["Aprobado"]);

  // Stats per module (proceso field)
  const moduleStats=useMemo(()=>{
    const modules={};
    filteredTests.forEach(t=>{
      const mod=t.proceso||"Sin módulo";
      const normalized = normalizeTestStatus(t.estado);
      if(!modules[mod]) modules[mod]={total:0,aprobado:0,enProgreso:0,fallido:0,noEjecutado:0,noAplica:0,bloqueante:0};
      modules[mod].total++;
      if(normalized==="Aprobado") modules[mod].aprobado++;
      else if(normalized==="Revisión") modules[mod].enProgreso++;
      else if(normalized==="Borrador") modules[mod].noEjecutado++;
    });
    return modules;
  },[filteredTests]);
  const tabs=[{id:"dashboard",label:"📊 Dashboard"},{id:"scrum",label:"👥 Scrum"},{id:"tests",label:"🧪 Casos de Prueba"},{id:"ciclos",label:"🔄 Ciclos"},{id:"issues",label:"🐛 Issues"},{id:"documentador",label:"🗂️ Documentador"}];

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
        <div style={{width:sidebarOpen?sidebarWidth:0,minWidth:sidebarOpen?sidebarWidth:0,background:DM.sidebar,display:"flex",flexDirection:"column",flexShrink:0,overflow:"hidden",transition:sidebarDragging.current?"none":"width 0.25s ease, min-width 0.25s ease",position:"sticky",top:0,height:"100vh",alignSelf:"flex-start"}}>
          <div style={{width:sidebarWidth,display:"flex",flexDirection:"column",height:"100%"}}>
          <div style={{padding:"18px 16px 10px",borderBottom:"1px solid #333",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{background:BRAND,color:"#fff",fontWeight:900,fontSize:11,padding:"4px 10px",borderRadius:5,letterSpacing:"0.07em",display:"inline-block",marginBottom:8}}>CESAR RODRIGUEZ</div>
              <div style={{fontSize:12,color:"#888"}}>Gestión de Pruebas</div>
            </div>
          </div>
          <div
            onClick={()=>setShowProjSelector(s=>!s)}
            style={{padding:"10px 12px",margin:"6px 6px 2px",borderRadius:10,fontSize:11,color:"#ccc",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:8,userSelect:"none",background:"#1e1e1e",border:"1px solid #2e2e2e",transition:"background 0.15s"}}
            onMouseEnter={e=>e.currentTarget.style.background="#252525"}
            onMouseLeave={e=>e.currentTarget.style.background="#1e1e1e"}
          >
            <span style={{fontSize:10,transition:"transform 0.2s",display:"inline-block",transform:showProjSelector?"rotate(90deg)":"rotate(0deg)",color:"#666"}}>▶</span>
            <span>📁 Proyectos</span>
            <span style={{marginLeft:"auto",fontSize:10,background:"#2e2e2e",color:"#aaa",borderRadius:999,padding:"2px 8px",fontWeight:800}}>{projects.length}</span>
          </div>
          <div style={{flex:1,overflowY:"auto"}}>
            {showProjSelector && projects.map(p=>{
              const pctVal=(p.tests||[]).length?Math.round((p.tests.filter(t=>normalizeTestStatus(t.estado)==="Aprobado").length/p.tests.length)*100):0;
              const openIssues=(p.issues||[]).filter(i=>i.estado==="Open"||i.estado==="Re-Open").length;
              return(
                <div key={p.id} onClick={()=>{setActiveProjectId(p.id);setTab("dashboard");setShowProjectsHome(false);}}
                  style={{padding:"9px 12px 9px 24px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,borderRadius:8,margin:"2px 6px",background:p.id===activeProjectId?"#2C2C2E":"transparent",borderLeft:p.id===activeProjectId?`3px solid ${p.color}`:"3px solid transparent",transition:"all 0.15s"}}
                  onMouseEnter={e=>{if(p.id!==activeProjectId)e.currentTarget.style.background="#252525";}}
                  onMouseLeave={e=>{if(p.id!==activeProjectId)e.currentTarget.style.background="transparent";}}>
                  <div style={{width:30,height:30,borderRadius:8,background:p.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#fff",fontWeight:900,fontSize:14,boxShadow:`0 2px 8px ${p.color}55`}}>{p.name.charAt(0).toUpperCase()}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,color:p.id===activeProjectId?"#fff":"#ccc",fontWeight:p.id===activeProjectId?700:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                    <div style={{display:"flex",gap:6,marginTop:3}}>
                      <span style={{fontSize:10,color:"#666"}}>{(p.tests||[]).length} TCs</span>
                      <span style={{fontSize:10,color:"#27AE60",fontWeight:700}}>{pctVal}%</span>
                      {openIssues>0&&<span style={{fontSize:10,color:"#E74C3C",fontWeight:700}}>{openIssues} ⚠</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{padding:"10px 10px 16px",borderTop:"1px solid #2a2a2a",display:"flex",flexDirection:"column",gap:5}}>
            <button onClick={()=>setTab("documentador")} style={{background:"linear-gradient(135deg, #C0392B 0%, #E74C3C 100%)",border:"none",borderRadius:10,color:"#fff",padding:"10px 12px",cursor:"pointer",fontSize:12,fontWeight:800,boxShadow:"0 8px 20px rgba(192,57,43,0.22)",width:"100%"}}>🗂️ Abrir documentador</button>
            <button onClick={()=>{setShowProjForm(true);setEditProj(null);}} style={{background:"#2C2C2E",border:"1px dashed #444",borderRadius:8,color:"#aaa",padding:"8px 0",cursor:"pointer",fontSize:12,width:"100%"}}>+ Nuevo Proyecto</button>
            <button onClick={()=>{setEditProj(proj);setShowProjForm(true);}} style={{background:"none",border:"none",color:"#666",fontSize:11,cursor:"pointer",padding:"4px 0"}}>✏️ Editar proyecto</button>
            {currentUser && Array.isArray(currentUser.roles) && currentUser.roles.includes("admin") && (
              <button onClick={()=>setConfirmDelete({type:"project",id:proj.id})} style={{background:"none",border:"none",color:"#6B2020",fontSize:11,cursor:"pointer",padding:"4px 0"}}>🗑️ Eliminar proyecto</button>
            )}
            <button onClick={()=>setDarkMode(d=>!d)} style={{background:"none",border:"none",color:"#666",fontSize:11,cursor:"pointer",padding:"4px 0",marginTop:4}}>{darkMode?"☀️ Modo claro":"🌙 Modo oscuro"}</button>
            <div style={{fontSize:10,color:"#444",marginTop:4}}>💾 {storageUsedMB()} MB usado</div>
          </div>
          </div>
        </div>

        {/* TOGGLE SIDEBAR BUTTON */}
        <button onClick={()=>setSidebarOpen(o=>!o)} title={sidebarOpen?"Ocultar panel":"Mostrar panel"}
          style={{position:"fixed",left:sidebarOpen?sidebarWidth-8:4,top:"50%",transform:"translateY(-50%)",zIndex:300,background:BRAND,border:"2px solid #fff",borderRadius:"0 10px 10px 0",color:"#fff",cursor:"pointer",padding:"12px 7px",fontSize:16,transition:sidebarDragging.current?"none":"left 0.25s ease",lineHeight:1,boxShadow:"2px 0 8px #00000040"}}>
          {sidebarOpen?"◀":"▶"}
        </button>
        {/* DRAG HANDLE */}
        {sidebarOpen&&(
          <div
            onMouseDown={e=>{
              e.preventDefault();
              sidebarDragging.current=true;
              document.body.style.cursor="col-resize";
              document.body.style.userSelect="none";
              const onMove=ev=>{
                const w=Math.min(400,Math.max(160,ev.clientX));
                setSidebarWidth(w);
              };
              const onUp=()=>{
                sidebarDragging.current=false;
                document.body.style.cursor="";
                document.body.style.userSelect="";
                setSidebarWidth(w=>{ try{localStorage.setItem("pana_sidebar_w",w);}catch{} return w; });
                document.removeEventListener("mousemove",onMove);
                document.removeEventListener("mouseup",onUp);
              };
              document.addEventListener("mousemove",onMove);
              document.addEventListener("mouseup",onUp);
            }}
            style={{position:"sticky",top:0,width:4,height:"100vh",alignSelf:"flex-start",cursor:"col-resize",background:"transparent",flexShrink:0,zIndex:200,transition:"background 0.15s"}}
            onMouseEnter={e=>e.currentTarget.style.background=BRAND+"88"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
          />
        )}

        {/* MAIN */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {/* topbar */}
          <div style={{background:DM.card,borderBottom:`1px solid ${DM.cardBorder}`,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:6}} onMouseEnter={()=>setHoveredProjectId(proj.id)} onMouseLeave={()=>setHoveredProjectId(null)}>
              <div style={{width:10,height:10,borderRadius:"50%",background:proj.color}}/>
              <span style={{fontSize:15,fontWeight:800,color:DM.text}}>{proj.name}</span>
              <span style={{fontSize:12,color:DM.sub,marginLeft:4}}>{proj.description}</span>
            </div>
            <div style={{display:"flex",gap:2}}>
              {!showProjectsHome && tabs.map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)} style={{background: tab===t.id ? (t.id==="documentador" ? "linear-gradient(135deg, #C0392B 0%, #E74C3C 100%)" : DM.bg) : (t.id==="documentador" ? "rgba(192,57,43,0.10)" : "transparent"), color: tab===t.id ? (t.id==="documentador" ? "#fff" : DM.text) : (t.id==="documentador" ? BRAND : DM.sub), border: t.id==="documentador" ? "1px solid rgba(192,57,43,0.18)" : "none", padding:"12px 16px", cursor:"pointer", fontSize:13, fontWeight:tab===t.id?800:600, borderBottom:tab===t.id?`3px solid ${proj.color}`:"3px solid transparent", borderRadius: t.id==="documentador" ? 999 : 0, boxShadow: t.id==="documentador" && tab===t.id ? "0 8px 18px rgba(192,57,43,0.18)" : "none", transition:"all 0.2s"}}>
                  {t.label}
                </button>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:12}}>
              <select value={currentUser?.name||""} onChange={e=>{
                const name=e.target.value;
                if(!name){setCurrentUser(null);return;}
                // try to find member in project
                const candidate = (proj.members||[]).find(m=>m.name===name);
                if(candidate){ setCurrentUser({ name: candidate.name, roles: candidate.roles || [] }); return; }
                // fallback to scrum team
                const scrum = getScrumTeamMembers(proj);
                if(scrum.includes(name)){ setCurrentUser({ name, roles: [] }); return; }
                setCurrentUser({ name, roles: [] });
              }} style={{padding:"6px 8px",borderRadius:8,border:`1px solid ${DM.cardBorder}`,background:DM.bg}}>
                <option value="">— Usuario —</option>
                {(proj.members||[]).map(m=><option key={m.name} value={m.name}>{m.name}{m.roles?` (${m.roles.join(",")})`:''}</option>)}
                {getScrumTeamMembers(proj).filter(n=>!(proj.members||[]).some(m=>m.name===n)).map(n=><option key={n} value={n}>{n}</option>)}
              </select>
              <Btn small variant="ghost" onClick={()=>{setEditProj(proj);setShowProjForm(true);}} title="Gestionar miembros">👥</Btn>
              {currentUser && Array.isArray(currentUser.roles) && currentUser.roles.includes("admin") && (
                <span style={{marginLeft:8,fontSize:11,fontWeight:800,color:"#fff",background:proj.color,padding:"4px 8px",borderRadius:6}}>ADMIN</span>
              )}
            </div>
          </div>

              <div style={{flex:1,overflowY:"auto",padding:"24px 28px"}}>
            {showProjectsHome&&(
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <h2 style={{margin:0,fontSize:20,fontWeight:800,color:DM.text}}>Proyectos</h2>
                    <p style={{margin:"3px 0 0",color:DM.sub,fontSize:12}}>{projects.length} proyecto{projects.length!==1?"s":""} registrado{projects.length!==1?"s":""}</p>
                  </div>
                  <Btn small onClick={()=>{setShowProjForm(true);setEditProj(null);}}>+ Nuevo Proyecto</Btn>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {projects.map(p=>{
                    const approved=(p.tests||[]).filter(t=>normalizeTestStatus(t.estado)==="Aprobado").length;
                    const total=(p.tests||[]).length;
                    const openIssues=(p.issues||[]).filter(i=>i.estado==="Open"||i.estado==="Re-Open").length;
                    const pct=total?Math.round((approved/total)*100):0;
                    return(
                      <div key={p.id} onClick={()=>{setActiveProjectId(p.id);setTab("dashboard");setShowProjectsHome(false);}} style={{padding:"16px 20px",borderRadius:14,background:DM.card,border:`1px solid ${p.id===activeProjectId?p.color:DM.cardBorder}`,boxShadow:p.id===activeProjectId?`0 0 0 2px ${p.color}22`:"0 1px 8px #0000000a",cursor:"pointer",display:"flex",alignItems:"center",gap:16,transition:"all 0.15s"}}
                        onMouseEnter={e=>{ e.currentTarget.style.borderColor=p.color; e.currentTarget.style.boxShadow=`0 4px 16px ${p.color}22`; }}
                        onMouseLeave={e=>{ e.currentTarget.style.borderColor=p.id===activeProjectId?p.color:DM.cardBorder; e.currentTarget.style.boxShadow=p.id===activeProjectId?`0 0 0 2px ${p.color}22`:"0 1px 8px #0000000a"; }}>
                        <div style={{width:40,height:40,borderRadius:12,background:p.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#fff",fontWeight:900,fontSize:16}}>{p.name.charAt(0).toUpperCase()}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                            <span style={{fontSize:14,fontWeight:800,color:DM.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span>
                            {p.id===activeProjectId&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:999,background:`${p.color}20`,color:p.color,fontWeight:700}}>Activo</span>}
                          </div>
                          {p.description&&<div style={{fontSize:12,color:DM.sub,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.description}</div>}
                          <div style={{marginTop:8,height:4,borderRadius:4,background:darkMode?"#2a2a2a":"#f0f0f0",overflow:"hidden"}}>
                            <div style={{height:"100%",width:`${pct}%`,background:p.color,borderRadius:4,transition:"width 0.4s"}}/>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:20,flexShrink:0,textAlign:"center"}}>
                          <div><div style={{fontSize:18,fontWeight:800,color:DM.text}}>{total}</div><div style={{fontSize:10,color:DM.sub}}>TCs</div></div>
                          <div><div style={{fontSize:18,fontWeight:800,color:"#27AE60"}}>{pct}%</div><div style={{fontSize:10,color:DM.sub}}>Aprobados</div></div>
                          <div><div style={{fontSize:18,fontWeight:800,color:openIssues>0?"#E74C3C":DM.sub}}>{openIssues}</div><div style={{fontSize:10,color:DM.sub}}>Issues</div></div>
                        </div>
                        <div style={{flexShrink:0,display:"flex",gap:6}}>
                          <button onClick={e=>{e.stopPropagation();setEditProj(p);setShowProjForm(true);}} style={{background:"none",border:`1px solid ${DM.cardBorder}`,borderRadius:8,color:DM.sub,fontSize:11,padding:"5px 10px",cursor:"pointer"}}>✏️</button>
                          {currentUser && Array.isArray(currentUser.roles) && currentUser.roles.includes("admin") && (
                            <button onClick={e=>{e.stopPropagation();setConfirmDelete({type:"project",id:p.id});}} style={{background:"none",border:"1px solid #6B202033",borderRadius:8,color:"#E74C3C",fontSize:11,padding:"5px 10px",cursor:"pointer"}}>🗑️</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {!showProjectsHome&&tab==="documentador"&&(
              <DocumentadorPanel darkMode={darkMode} />
            )}

            {!showProjectsHome&&tab==="scrum"&&(
              <div style={{display:"flex",flexDirection:"column",gap:18}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                  <div>
                    <h2 style={{margin:0,fontSize:20,fontWeight:800,color:DM.text}}>Scrum & Testing Blueprint</h2>
                    <p style={{margin:"3px 0 0",color:DM.sub,fontSize:12}}>Equipo Scrum, módulos y estrategia de pruebas del proyecto · {proj.name}</p>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <Btn small variant="ghost" onClick={()=>{setEditProj(proj);setShowProjForm(true);}}>Editar equipo y módulos</Btn>
                    <Btn small variant="ghost" onClick={()=>setTab("dashboard")}>Volver al dashboard</Btn>
                  </div>
                </div>

                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))",gap:12}}>
                  {(() => {
                    const team = normalizeScrumTeam(proj.scrumTeam);
                    const sections = [
                      { title: "Product Owner", value: team.productOwner, color: "#2980B9", hint: "Prioriza valor y aprueba alcance" },
                      { title: "Scrum Master", value: team.scrumMaster, color: "#8E44AD", hint: "Facilita el proceso y desbloquea impedimentos" },
                      { title: "Developers", value: team.developers, color: "#16A085", hint: "Implementan y corrigen" },
                      { title: "QA / Pruebas", value: team.qa, color: "#27AE60", hint: "Diseñan y ejecutan validaciones" },
                    ];
                    return sections.map(section => {
                      const members = Array.isArray(section.value) ? section.value : (section.value ? [section.value] : []);
                      return (
                        <div key={section.title} style={{padding:16,borderRadius:16,background:DM.card,border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000000a"}}>
                          <div style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.06em",color:section.color,marginBottom:8}}>{section.title}</div>
                          <div style={{fontSize:12,color:DM.sub,marginBottom:10}}>{section.hint}</div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                            {members.length > 0 ? members.map(member => <span key={member} style={{fontSize:11,padding:"5px 9px",borderRadius:999,background:`${section.color}15`,color:section.color,fontWeight:700}}>{member}</span>) : <span style={{fontSize:11,color:DM.sub}}>Sin definir</span>}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                  <div style={{background:DM.card,borderRadius:16,padding:18,border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000000a"}}>
                    <div style={{fontSize:13,fontWeight:800,color:DM.text,marginBottom:14}}>Módulos del proyecto</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                      {(proj.modules||[]).length>0
                        ? proj.modules.map(mod => <span key={mod} style={{fontSize:12,padding:"7px 10px",borderRadius:999,background:darkMode?"#2C2C2E":"#eef2ff",color:darkMode?"#eee":"#4c51bf",fontWeight:700}}>{mod}</span>)
                        : <span style={{fontSize:12,color:DM.sub}}>Sin módulos definidos</span>}
                    </div>
                  </div>

                  <div style={{background:DM.card,borderRadius:16,padding:18,border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000000a"}}>
                    <div style={{fontSize:13,fontWeight:800,color:DM.text,marginBottom:14}}>Cobertura por módulo</div>
                    <div style={{display:"flex",flexDirection:"column",gap:12}}>
                      {(proj.modules||[]).length>0 ? proj.modules.map(mod => {
                        const testsInModule = tests.filter(t => t.proceso === mod);
                        const approvedCount = testsInModule.filter(t => normalizeTestStatus(t.estado) === "Aprobado").length;
                        const coverage = testsInModule.length ? Math.round((approvedCount / testsInModule.length) * 100) : 0;
                        const coverageColor = coverage >= 70 ? "#27AE60" : coverage >= 40 ? "#F39C12" : "#E74C3C";
                        return (
                          <div key={mod} style={{padding:"10px 12px",borderRadius:12,background:darkMode?"#1f1f22":"#fafafa",border:`1px solid ${DM.cardBorder}`}}>
                            <div style={{display:"flex",justifyContent:"space-between",gap:10,marginBottom:6}}>
                              <span style={{fontSize:12,fontWeight:700,color:DM.text}}>{mod}</span>
                              <span style={{fontSize:11,color:coverageColor,fontWeight:800}}>{coverage}%</span>
                            </div>
                            <div style={{height:7,background:"#e5e7eb",borderRadius:999,overflow:"hidden"}}>
                              <div style={{width:`${coverage}%`,height:"100%",background:coverageColor,borderRadius:999}} />
                            </div>
                            <div style={{fontSize:11,color:DM.sub,marginTop:6}}>{testsInModule.length} caso(s) vinculados</div>
                          </div>
                        );
                      }) : <span style={{fontSize:12,color:DM.sub}}>Sin módulos definidos</span>}
                    </div>
                  </div>
                </div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                  <div style={{background:DM.card,borderRadius:16,padding:18,border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000000a"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:14}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:800,color:DM.text}}>Tipos de pruebas</div>
                        <div style={{fontSize:11,color:DM.sub,marginTop:3}}>Edita esta taxonomía directamente desde Scrum.</div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
                      <input
                        style={{...inputStyle,...(darkMode?inputStyleDark:{}) , flex:1, minWidth: 180}}
                        value={scrumTestTypeInput}
                        onChange={e=>setScrumTestTypeInput(e.target.value)}
                        placeholder="Ej: Exploratorias, Seguridad"
                        onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addProjectListItem("scrumTestTypes",scrumTestTypeInput,setScrumTestTypeInput);}}}
                      />
                      <Btn small variant="ghost" onClick={()=>addProjectListItem("scrumTestTypes",scrumTestTypeInput,setScrumTestTypeInput)}>Agregar</Btn>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(170px, 1fr))",gap:10}}>
                      {(proj.scrumTestTypes?.length ? proj.scrumTestTypes : EMPTY_PROJECT.scrumTestTypes).map((item,index) => (
                        <div key={item} style={{padding:14,borderRadius:12,background:darkMode?"#1f1f22":"#fafafa",border:`1px solid ${DM.cardBorder}`}}>
                          <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"start",marginBottom:8}}>
                            <div style={{fontSize:11,fontWeight:800,textTransform:"uppercase",color:["#2980B9","#8E44AD","#16A085","#27AE60"][index % 4]}}>{item}</div>
                            <button type="button" onClick={()=>removeProjectListItem("scrumTestTypes",item)} style={{border:"none",background:"transparent",cursor:"pointer",color:darkMode?"#aaa":"#666",fontSize:12,fontWeight:700}}>✕</button>
                          </div>
                          <div style={{fontSize:12,color:DM.sub,lineHeight:1.45}}>{
                            item === "Funcionales" ? "Validan el flujo de negocio y reglas principales." :
                            item === "Regresión" ? "Confirman que los cambios no rompen escenarios previos." :
                            item === "Integración" ? "Verifican interacción entre módulos y componentes." :
                            item === "Aceptación" ? "Validan si el negocio aprueba el escenario." :
                            "Describe una categoría concreta de pruebas que aplica al proyecto."
                          }</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{background:DM.card,borderRadius:16,padding:18,border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000000a"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:14}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:800,color:DM.text}}>Niveles de prueba</div>
                        <div style={{fontSize:11,color:DM.sub,marginTop:3}}>Define los niveles que tu equipo aprobará.</div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
                      <input
                        style={{...inputStyle,...(darkMode?inputStyleDark:{}), flex:1, minWidth: 180}}
                        value={scrumLevelInput}
                        onChange={e=>setScrumLevelInput(e.target.value)}
                        placeholder="Ej: E2E, UAT"
                        onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addProjectListItem("scrumLevels",scrumLevelInput,setScrumLevelInput);}}}
                      />
                      <Btn small variant="ghost" onClick={()=>addProjectListItem("scrumLevels",scrumLevelInput,setScrumLevelInput)}>Agregar</Btn>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {(proj.scrumLevels?.length ? proj.scrumLevels : EMPTY_PROJECT.scrumLevels).map((item,index) => (
                        <div key={item} style={{display:"grid",gridTemplateColumns:"120px 120px 1fr",gap:10,alignItems:"start",padding:"10px 12px",borderRadius:12,background:darkMode?"#1f1f22":"#fafafa",border:`1px solid ${DM.cardBorder}`}}>
                          <div>
                            <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"start"}}>
                              <div style={{fontSize:11,fontWeight:800,color:["#2980B9","#16A085","#8E44AD","#27AE60","#F39C12"][index % 5]}}>{item}</div>
                              <button type="button" onClick={()=>removeProjectListItem("scrumLevels",item)} style={{border:"none",background:"transparent",cursor:"pointer",color:darkMode?"#aaa":"#666",fontSize:12,fontWeight:700}}>✕</button>
                            </div>
                            <div style={{fontSize:10,color:DM.sub,marginTop:4}}>{
                              item === "Unitarias" ? "Developers" :
                              item === "Integración" ? "Developers + QA" :
                              item === "Sistema" ? "QA / Pruebas" :
                              item === "Aceptación" ? "Product Owner" :
                              item === "Regresión" ? "QA / Pruebas" :
                              "Equipo Scrum"
                            }</div>
                          </div>
                          <div style={{fontSize:11,color:DM.sub,fontWeight:700}}>Nivel</div>
                          <div style={{fontSize:12,color:DM.text,lineHeight:1.45}}>{
                            item === "Unitarias" ? "Validación de lógica puntual y componentes aislados." :
                            item === "Integración" ? "Interacción entre módulos, APIs y datos." :
                            item === "Sistema" ? "Flujo end-to-end sobre el sistema completo." :
                            item === "Aceptación" ? "Validación de negocio contra criterios de aceptación." :
                            item === "Regresión" ? "Re-ejecución de escenarios críticos luego de cambios." :
                            "Define un nivel de prueba aplicable al flujo del proyecto."
                          }</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{background:DM.card,borderRadius:16,padding:18,border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000000a"}}>
                  <div style={{fontSize:13,fontWeight:800,color:DM.text,marginBottom:14}}>Cómo se relaciona con tus casos de prueba</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))",gap:12}}>
                    {[
                      "Cada TC puede alinearse a un rol Scrum específico y a un nivel de prueba.",
                      "Los módulos del proyecto sirven para filtrar la cobertura y detectar vacíos.",
                      "Los niveles de prueba ayudan a separar ejecución técnica, validación funcional y aceptación.",
                    ].map((text,index) => (
                      <div key={index} style={{padding:14,borderRadius:12,background:darkMode?"#1f1f22":"#fafafa",border:`1px solid ${DM.cardBorder}`,fontSize:12,color:DM.text,lineHeight:1.5}}>{text}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!showProjectsHome&&tab==="dashboard"&&(
                <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                  <div>
                    <h2 style={{margin:0,fontSize:20,fontWeight:800,color:DM.text}}>Control del Día</h2>
                    <p style={{margin:"3px 0 0",color:DM.sub,fontSize:12}}>Resumen general · {proj.name}</p>
                  </div>
                </div>
                <div style={{marginTop:14,padding:"14px 16px",borderRadius:14,background:darkMode?"#18181b":"#fff7f6",border:`1px solid ${darkMode?"#3a3a3d":"#f2d9d5"}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:800,color:darkMode?"#eee":"#1a1a1a"}}>📋 Documentador de evidencia listo</div>
                    <div style={{fontSize:12,color:darkMode?"#aaa":"#6b7280",marginTop:2}}>Captura pasos, adjunta evidencia y compártela desde un solo lugar.</div>
                  </div>
                  <button onClick={()=>setTab("documentador")} style={{background:"linear-gradient(135deg, #C0392B 0%, #E74C3C 100%)",color:"#fff",border:"none",borderRadius:999,padding:"9px 14px",cursor:"pointer",fontSize:12,fontWeight:800,boxShadow:"0 8px 20px rgba(192,57,43,0.18)"}}>Abrir documentador</button>
                </div>
                <div style={{marginTop:14,padding:18,borderRadius:16,background:DM.card,border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000000a"}}>
                  {(() => {
                    const team = normalizeScrumTeam(proj.scrumTeam);
                    const roles = [
                      { title: "Product Owner", value: team.productOwner, color: "#2980B9" },
                      { title: "Scrum Master", value: team.scrumMaster, color: "#8E44AD" },
                      { title: "Developers", value: team.developers, color: "#16A085" },
                      { title: "QA / Pruebas", value: team.qa, color: "#27AE60" },
                    ];
                    return (
                      <div>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:14,flexWrap:"wrap"}}>
                          <div>
                            <div style={{fontSize:13,fontWeight:800,color:DM.text}}>👥 Scrum Team</div>
                            <div style={{fontSize:12,color:DM.sub,marginTop:2}}>Roles y miembros asociados al proyecto.</div>
                          </div>
                          <span style={{fontSize:11,padding:"4px 10px",borderRadius:999,background:`${proj.color}18`,color:proj.color,fontWeight:800}}>Equipo activo</span>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))",gap:12}}>
                          {roles.map(role => {
                            const members = Array.isArray(role.value) ? role.value : (role.value ? [role.value] : []);
                            return (
                              <div key={role.title} style={{padding:12,borderRadius:12,background:darkMode?"#1f1f22":"#fafafa",border:`1px solid ${DM.cardBorder}`}}>
                                <div style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.06em",color:role.color,marginBottom:8}}>{role.title}</div>
                                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                                  {members.length > 0 ? members.map(member => <span key={member} style={{fontSize:11,padding:"5px 9px",borderRadius:999,background:`${role.color}15`,color:role.color,fontWeight:700}}>{member}</span>) : <span style={{fontSize:11,color:DM.sub}}>Sin definir</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,marginTop:18}}>
                  <div>
                    <h2 style={{margin:0,fontSize:20,fontWeight:800,color:DM.text}}>Control del Día</h2>
                    <p style={{margin:"3px 0 0",color:DM.sub,fontSize:12}}>Resumen general · {proj.name}</p>
                  </div>
              
                    {/* Dashboard filters (quick) */}
                    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginTop:8}}>
                      <input placeholder="🔍 Buscar TCs..." value={search} onChange={e=>setSearch(e.target.value)} style={{...inputStyle,width:200,padding:"7px 10px",background:darkMode?"#2C2C2E":"#fff"}}/>
                      <select value={filterProceso} onChange={e=>setFilterProceso(e.target.value)} style={{...inputStyle,width:160}}>
                        {procesosList.map(p=> <option key={p} value={p}>{p}</option>)}
                      </select>
                      <select value={filterAsignado} onChange={e=>setFilterAsignado(e.target.value)} style={{...inputStyle,width:160}}>
                        {asignadosList.map(a=> <option key={a} value={a}>{a}</option>)}
                      </select>
                      <input type="date" value={filterFechaDesde} onChange={e=>setFilterFechaDesde(e.target.value)} style={{...inputStyle,width:140}}/>
                      <input type="date" value={filterFechaHasta} onChange={e=>setFilterFechaHasta(e.target.value)} style={{...inputStyle,width:140}}/>
                      <Btn small variant="ghost" onClick={()=>{setFilterFechaDesde("");setFilterFechaHasta("");setFilterAsignado("Todos");setFilterProceso("Todos");setSearch("");}}>Limpiar filtros</Btn>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:7,alignItems:"flex-end"}}>
                    <div style={{display:"flex",gap:8}}>
                      <Btn small onClick={()=>{setEditTc(null);setShowTcForm(true);}}>+ TC</Btn>
                      <Btn small variant="ghost" onClick={()=>{setEditIssue(null);setShowIssueForm(true);}}>+ Issue</Btn>
                      <Btn small variant="ghost" onClick={()=>exportToCSV(proj, filteredTests)}>⬇ TCs CSV</Btn>
                      <Btn small variant="ghost" onClick={()=>exportIssuesToCSV(proj, filteredIssues)}>⬇ Issues CSV</Btn>
                    </div>
                    <div style={{display:"flex",gap:8,flexDirection:"column",width:"100%"}}>
                      <Btn small onClick={()=>exportKPIsAsImage(proj, filteredTests, filteredTestStats, filteredIssueStats)} style={{background:DM.card,border:`1px solid ${DM.cardBorder}`}}>📷 Exportar KPIs</Btn>
                      <Btn small onClick={()=>exportDashboardPDF(proj, filteredTests, filteredIssues)} style={{background:"#2980B9",color:"#fff",width:"100%"}}>📄 Descargar PDF Dashboard</Btn>
                    </div>
                  </div>
                </div>

                {/* Semáforo */}
                <div style={{background:DM.card,borderRadius:14,padding:20,border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000000a"}}>
                  <Semaforo pct={execPct}/>
                </div>

                {/* KPI cards */}
                <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                  <div style={{background:DM.card,borderRadius:10,padding:"12px 16px",boxShadow:"0 1px 8px #0000000a",border:`1px solid ${DM.cardBorder}`,minWidth:160}}>
                    <div style={{fontSize:11,color:DM.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>Tasa Aprobación</div>
                    <div style={{fontSize:22,fontWeight:800,color:'#27AE60',lineHeight:1.1}}>{pct(filteredTestStats["Aprobado"]) }%</div>
                    <div style={{marginTop:8}}><Sparkline data={sparkApproved} color="#27AE60" width={140} height={36}/></div>
                    <div style={{fontSize:11,color:DM.sub,marginTop:6}}>Porcentaje de casos aprobados</div>
                  </div>
                  <div style={{background:DM.card,borderRadius:10,padding:"12px 16px",boxShadow:"0 1px 8px #0000000a",border:`1px solid ${DM.cardBorder}`,minWidth:160}}>
                    <div style={{fontSize:11,color:DM.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>Tasa Fallos</div>
                    <div style={{fontSize:22,fontWeight:800,color:'#F39C12',lineHeight:1.1}}>{pct(filteredTestStats["Revisión"]) }%</div>
                    <div style={{marginTop:8}}><Sparkline data={sparkReview} color="#F39C12" width={140} height={36}/></div>
                    <div style={{fontSize:11,color:DM.sub,marginTop:6}}>Porcentaje de casos en revisión</div>
                  </div>
                  <div style={{background:DM.card,borderRadius:10,padding:"12px 16px",boxShadow:"0 1px 8px #0000000a",border:`1px solid ${DM.cardBorder}`,minWidth:160}}>
                    <div style={{fontSize:11,color:DM.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>Ejecutados</div>
                    <div style={{fontSize:22,fontWeight:800,color:'#27AE60',lineHeight:1.1}}>{filteredTests.filter(t=>t.fechaEjecucion).length}</div>
                    <div style={{marginTop:8}}><Sparkline data={sparkExecuted} color={proj.color||"#27AE60"} width={140} height={36}/></div>
                    <div style={{fontSize:11,color:DM.sub,marginTop:6}}>Total de TCs ejecutados</div>
                  </div>
                  <div style={{background:DM.card,borderRadius:10,padding:"12px 16px",boxShadow:"0 1px 8px #0000000a",border:`1px solid ${DM.cardBorder}`,minWidth:160}}>
                    <div style={{fontSize:11,color:DM.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>Issues abiertas</div>
                    <div style={{fontSize:22,fontWeight:800,color:'#8E44AD',lineHeight:1.1}}>{filteredIssueStats.total}</div>
                    <div style={{marginTop:8}}><Sparkline data={sparkIssues} color="#8E44AD" width={140} height={36}/></div>
                    <div style={{fontSize:11,color:DM.sub,marginTop:6}}>Issues filtradas</div>
                  </div>
                </div>

                {/* stat chips */}
                <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                  {[{label:"Total",value:filteredTests.length,color:DM.text},{label:"Aprobado",value:filteredTestStats["Aprobado"],color:"#27AE60"},{label:"Revisión",value:filteredTestStats["Revisión"],color:"#F39C12"},{label:"Borrador",value:filteredTestStats["Borrador"],color:"#95A5A6"}].map(s=>( 
                    <div key={s.label} style={{background:DM.card,borderRadius:10,padding:"12px 16px",boxShadow:"0 1px 8px #0000000a",border:`1px solid ${DM.cardBorder}`,minWidth:90}}>
                      <div style={{fontSize:10,color:DM.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{s.label}</div>
                      <div style={{fontSize:28,fontWeight:800,color:s.color,lineHeight:1.1}}>{s.value}</div>
                      {filteredTests.length>0&&s.label!=="Total"&&(<div style={{marginTop:4,height:3,background:"#f0f0f0",borderRadius:2}}><div style={{width:`${pct(s.value)}%`,height:"100%",background:s.color,borderRadius:2}}/></div>)}
                    </div>
                  ))}
                </div>

                <div style={{display:"flex",flexDirection:"column",gap:18}}>
                  <div style={{display:"grid",gridTemplateColumns:"minmax(300px, 1fr) minmax(320px, 1fr)",gap:18}}>
                    <div style={{background:DM.card,borderRadius:12,padding:20,border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000000a"}}>
                      <div style={{fontSize:13,fontWeight:700,color:DM.text,marginBottom:16}}>Distribución de Estados</div>
                      <Donut data={[{label:"Aprobado",value:filteredTestStats["Aprobado"],color:"#27AE60"},{label:"Revisión",value:filteredTestStats["Revisión"],color:"#F39C12"},{label:"Borrador",value:filteredTestStats["Borrador"],color:"#95A5A6"}]}/>
                    </div>
                    <div style={{background:DM.card,borderRadius:12,padding:20,border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000000a"}}>
                      <div style={{fontSize:13,fontWeight:700,color:DM.text,marginBottom:14}}>Test Plan Evolution general</div>
                      {[{label:"Aprobados",value:pct(filteredTestStats["Aprobado"]),color:"#27AE60"},{label:"En revisión",value:pct(filteredTestStats["Revisión"]),color:"#F39C12"},{label:"Borradores",value:pct(filteredTestStats["Borrador"]),color:"#95A5A6"}].map((r,i)=>(
                        <div key={i} style={{marginBottom:12}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:11,color:DM.sub}}>{r.label}</span><span style={{fontSize:11,fontWeight:700,color:r.color}}>{r.value}%</span></div>
                          <div style={{height:7,background:"#f0f0f0",borderRadius:4,overflow:"hidden"}}><div style={{width:`${r.value}%`,height:"100%",background:r.color,borderRadius:4,transition:"width 0.6s"}}/></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {Object.keys(moduleStats).length>0 && (
                    <div style={{display:"flex",flexDirection:"column",gap:14}}>
                      {Object.entries(moduleStats)
                        .sort((a,b)=>(((b[1].aprobado+b[1].noAplica)/b[1].total)-((a[1].aprobado+a[1].noAplica)/a[1].total)))
                        .map(([mod,m])=>{
                          const moduleData=[
                            {label:"Aprobado",value:m.aprobado,color:"#27AE60"},
                            {label:"Revisión",value:m.enProgreso,color:"#F39C12"},
                            {label:"Borrador",value:m.noEjecutado,color:"#95A5A6"},
                          ].filter(d=>d.value>0);
                          const states=[
                            {label:"Aprobados",value:m.total?Math.round((m.aprobado/m.total)*100):0,color:"#27AE60"},
                            {label:"En revisión",value:m.total?Math.round((m.enProgreso/m.total)*100):0,color:"#F39C12"},
                            {label:"Borradores",value:m.total?Math.round((m.noEjecutado/m.total)*100):0,color:"#95A5A6"},
                          ];
                          return (
                            <div key={mod} style={{background:DM.card,borderRadius:12,padding:20,border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000000a"}}>
                              <div style={{fontSize:13,fontWeight:700,color:DM.text,marginBottom:14}}>{mod}</div>
                              <div style={{display:"grid",gridTemplateColumns:"minmax(240px, 1fr) minmax(280px, 1fr)",gap:18,alignItems:"center"}}>
                                <div>
                                  <Donut data={moduleData}/>
                                </div>
                                <div>
                                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                                    <span style={{fontSize:11,color:DM.sub,fontWeight:700}}>Test Plan Evolution</span>
                                    <span style={{fontSize:11,color:DM.sub}}>{m.total} casos</span>
                                  </div>
                                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                                    {states.map(s=>(
                                      <div key={s.label}>
                                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                                          <span style={{fontSize:10,color:DM.sub}}>{s.label}</span>
                                          <span style={{fontSize:10,fontWeight:700,color:s.color}}>{s.value}%</span>
                                        </div>
                                        <div style={{height:6,background:"#f0f0f0",borderRadius:4,overflow:"hidden"}}>
                                          <div style={{width:`${s.value}%`,height:"100%",background:s.color,borderRadius:4,transition:"width 0.6s"}}/>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
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
                        const modExecPct=m.total?Math.round((m.aprobado/m.total)*100):0;
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
                                {label:"Revisión",value:m.enProgreso,color:"#F39C12"},
                                {label:"Borrador",value:m.noEjecutado,color:"#95A5A6"},
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
                        const ap=ejecs.filter(e=>normalizeCycleExecutionStatus(e.estado)==="Aprobado").length;
                        const ep=ejecs.filter(e=>normalizeCycleExecutionStatus(e.estado)==="En Progreso").length;
                        const ne=ejecs.filter(e=>normalizeCycleExecutionStatus(e.estado)==="No ejecutado").length;
                        const fa=ejecs.filter(e=>normalizeCycleExecutionStatus(e.estado)==="Fallido").length;
                        const na=ejecs.filter(e=>normalizeCycleExecutionStatus(e.estado)==="No aplica").length;
                        const bl=ejecs.filter(e=>normalizeCycleExecutionStatus(e.estado)==="Bloqueante").length;
                        const cp=ejecs.length?Math.round((ap/ejecs.length)*100):0;
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
                                    {label:"No ejecutado",value:ne,color:"#95A5A6"},
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
                                {ep>0&&(
                                  <div style={{marginTop:8,fontSize:11,color:"#F39C12",fontWeight:600}}>
                                    ⚠️ {ep} caso(s) en progreso — considera promoverlos al siguiente ciclo
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
            {!showProjectsHome&&tab==="tests"&&(
              <div style={{display:"flex",flexDirection:"column",gap:18}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                  <div>
                    <h2 style={{margin:0,fontSize:20,fontWeight:800,color:DM.text}}>Casos de Prueba</h2>
                    <p style={{margin:"3px 0 0",color:DM.sub,fontSize:12}}>{filteredTests.length} casos · ⠿ arrastra para reordenar · clic para ver</p>
                  </div>
                  <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                    <Btn small variant={testViewMode==="compacta"?"primary":"ghost"} onClick={()=>setTestViewMode("compacta")}>Vista compacta</Btn>
                    <Btn small variant={testViewMode==="expandida"?"primary":"ghost"} onClick={()=>setTestViewMode("expandida")}>Vista expandida</Btn>
                    <Btn small onClick={()=>{setEditTc(null);setShowTcForm(true);}}>+ Nuevo TC</Btn>
                    <Btn small variant="ghost" onClick={()=>setShowJira(true)} style={{background:"#0052CC",color:"#fff"}}>🔗 Importar de Jira</Btn>
                    <Btn small variant="ghost" onClick={()=>importRef.current.click()}>⬆ Importar CSV</Btn>
                    <Btn small variant="ghost" onClick={()=>exportToCSV(proj, filteredTests)}>⬇ Exportar CSV</Btn>
                  </div>
                </div>
                <AiAssistantPanel tests={tests} selectedTc={selectedAiTc} onSelectTc={setSelectedAiTc} onApplyProposal={handleApplyAiProposal} darkMode={darkMode}/>
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
                    {procesosList.map(p=><option key={p} value={p}>{p==="Todos"?"Todos los módulos":p}</option>)}
                  </select>
                  <select value={filterTipoPrueba} onChange={e=>setFilterTipoPrueba(e.target.value)} style={{...inputStyle,width:150,padding:"7px 12px",background:darkMode?"#2C2C2E":"#fff",color:DM.text,border:darkMode?"1px solid #444":"1px solid #e0e0e0"}}>
                    {tiposPruebaList.map(t=><option key={t} value={t}>{t==="Todos"?"Todos los tipos":t}</option>)}
                  </select>
                  <select value={filterNivelPrueba} onChange={e=>setFilterNivelPrueba(e.target.value)} style={{...inputStyle,width:150,padding:"7px 12px",background:darkMode?"#2C2C2E":"#fff",color:DM.text,border:darkMode?"1px solid #444":"1px solid #e0e0e0"}}>
                    {nivelesPruebaList.map(n=><option key={n} value={n}>{n==="Todos"?"Todos los niveles":n}</option>)}
                  </select>
                  {filterProceso!=="Todos"&&<button onClick={()=>setFilterProceso("Todos")} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#aaa"}}>✕ Módulo</button>}
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <span style={{fontSize:11,color:DM.sub}}>Ejec. desde</span>
                    <input type="date" value={filterFechaDesde} onChange={e=>setFilterFechaDesde(e.target.value)} style={{...inputStyle,width:130,padding:"7px 10px",background:darkMode?"#2C2C2E":"#fff",color:DM.text,border:darkMode?"1px solid #444":"1px solid #e0e0e0"}}/>
                    <span style={{fontSize:11,color:DM.sub}}>hasta</span>
                    <input type="date" value={filterFechaHasta} onChange={e=>setFilterFechaHasta(e.target.value)} style={{...inputStyle,width:130,padding:"7px 10px",background:darkMode?"#2C2C2E":"#fff",color:DM.text,border:darkMode?"1px solid #444":"1px solid #e0e0e0"}}/>
                    {(filterFechaDesde||filterFechaHasta)&&<button onClick={()=>{setFilterFechaDesde("");setFilterFechaHasta("");}} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"#aaa"}}>✕</button>}
                  </div>
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",padding:"10px 12px",borderRadius:10,background:darkMode?"#1a1f28":"#f7faff",border:`1px solid ${darkMode?"#2d3b4f":"#e3eeff"}`}}>
                  <span style={{fontSize:11,color:DM.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em"}}>Selección masiva</span>
                  <span style={{fontSize:12,color:DM.text,fontWeight:700}}>{selectedVisibleCount}/{visibleTestIds.length} visibles</span>
                  <Btn small variant="ghost" onClick={()=>selectAllVisibleTests(visibleTestIds)} disabled={!visibleTestIds.length||allVisibleSelected}>Seleccionar visibles</Btn>
                  <Btn small variant="ghost" onClick={()=>clearSelectedTests(visibleTestIds)} disabled={!selectedVisibleCount}>Limpiar visibles</Btn>
                  <select value={bulkTestStatus} onChange={e=>setBulkTestStatus(e.target.value)} style={{...inputStyle,width:140,padding:"6px 10px",background:darkMode?"#2C2C2E":"#fff",color:DM.text,border:darkMode?"1px solid #444":"1px solid #dbe7ff"}}>
                    <option value="">Sin cambio de estado</option>
                    {Object.keys(statusConfig).map(k=><option key={k} value={k}>{k}</option>)}
                  </select>
                  <select value={bulkTestAssignee} onChange={e=>setBulkTestAssignee(e.target.value)} style={{...inputStyle,width:180,padding:"6px 10px",background:darkMode?"#2C2C2E":"#fff",color:DM.text,border:darkMode?"1px solid #444":"1px solid #dbe7ff"}}>
                    <option value="">Sin cambio de responsable</option>
                    {[...new Set(tests.map(t=>t.asignadoA).filter(Boolean))].map(a=><option key={a} value={a}>{a}</option>)}
                  </select>
                  <Btn small onClick={applyBulkChangesToTests} disabled={!selectedTestIds.length}>Aplicar a seleccionados</Btn>
                </div>
                <div style={{background:DM.card,borderRadius:12,overflow:"hidden",border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000001a"}}>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",minWidth:testViewMode==="compacta"?1080:1240,borderCollapse:"collapse",fontSize:12}}>
                    <thead>
                      <tr style={{background:darkMode?"#1e2a3a":"#e8f0f8",color:darkMode?"#8a9bb0":"#4a6080"}}>
                        <th style={{padding:"11px 6px",width:28,textAlign:"center",borderBottom:`1px solid ${DM.cardBorder}`}}>
                          <input type="checkbox" checked={allVisibleSelected} onChange={e=>e.target.checked?selectAllVisibleTests(visibleTestIds):clearSelectedTests(visibleTestIds)} onClick={e=>e.stopPropagation()} title="Seleccionar visibles"/>
                        </th>
                        <th style={{padding:"11px 6px",width:20,borderBottom:`1px solid ${DM.cardBorder}`}}></th>
                        {["ID","Escenario",...(testViewMode==="expandida"?["Pasos"]:[]),"Precondiciones",...(testViewMode==="expandida"?["Resultado esperado"]:[]),"Módulo","Responsable","Estado","Adj.","Observación"].map(h=>(
                          <th key={h} style={{padding:"11px 10px",textAlign:"left",fontWeight:700,fontSize:9,letterSpacing:"0.07em",textTransform:"uppercase",whiteSpace:"nowrap",borderBottom:`1px solid ${DM.cardBorder}`}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTests.length===0&&(<tr><td colSpan={testViewMode==="expandida"?13:11} style={{padding:32,textAlign:"center",color:DM.sub,fontSize:13}}>Sin resultados.</td></tr>)}
                      {filteredTests.map((t,i)=>{
                        const sc=statusConfig[normalizeTestStatus(t.estado)]||statusConfig["Borrador"];
                        const realIndex=proj.tests.findIndex(x=>x.id===t.id);
                        const pasosPreview=parseSteps(t.pasos);
                        const isSelected=selectedTestIds.includes(t.id);
                        const commentsCount=(t.comentarios||[]).length;
                        return (
                          <tr key={t.id} draggable
                            onDragStart={()=>{dragIndex.current=realIndex;}}
                            onDragOver={e=>{e.preventDefault();dragOverIndex.current=realIndex;}}
                            onDrop={()=>{if(dragIndex.current!==null&&dragIndex.current!==dragOverIndex.current)reorderTests(dragIndex.current,dragOverIndex.current);dragIndex.current=null;dragOverIndex.current=null;}}
                            onClick={()=>{setEditTc(t);setShowTcForm(true);setSelectedAiTc(t);}}
                            style={{background:isSelected?(darkMode?"#1d2a3c":"#ecf5ff"):(i%2===0?DM.tableRow0:DM.tableRow1),cursor:"pointer",borderBottom:`1px solid ${DM.cardBorder}`,transition:"background 0.12s"}}
                            onMouseEnter={e=>{e.currentTarget.style.background=DM.tableHover; setHoveredTestId(t.id);}}
                            onMouseLeave={e=>{e.currentTarget.style.background=isSelected?(darkMode?"#1d2a3c":"#ecf5ff"):(i%2===0?DM.tableRow0:DM.tableRow1); setHoveredTestId(null);}}>
                            <td style={{padding:"9px 6px",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
                              <input type="checkbox" checked={isSelected} onChange={()=>toggleTestSelection(t.id)} />
                            </td>
                            <td style={{padding:"9px 6px",textAlign:"center",color:DM.sub,cursor:"grab",fontSize:14}} onClick={e=>e.stopPropagation()} title="Arrastrar">⠿</td>
                            <td style={{padding:"9px 10px",fontWeight:700,color:proj.color,fontFamily:"monospace",whiteSpace:"nowrap",fontSize:11}}>{t.id}</td>
                            <td style={{padding:"9px 10px",fontWeight:700,color:DM.text,whiteSpace:"normal",wordBreak:"break-word",lineHeight:1.4,minWidth:180,maxWidth:240,fontSize:11,background:darkMode?"#1e2a3a":"#f0f5ff",borderRadius:6,border:darkMode?"1px solid #2a3a4a":"1px solid #d8e8ff"}}>{t.escenario}</td>
                            {testViewMode==="expandida"&&(
                              <td style={{padding:"9px 10px",color:DM.sub,minWidth:260,maxWidth:320,whiteSpace:"normal",lineHeight:1.35,fontSize:10,verticalAlign:"top"}}>
                                {pasosPreview.length ? pasosPreview.map((s,idx)=><div key={idx} style={{marginBottom:idx===pasosPreview.length-1?0:4}}>{`${idx+1}. ${s.text || "Sin detalle"}`}</div>) : "—"}
                              </td>
                            )}
                            <td style={{padding:"9px 10px",color:DM.sub,whiteSpace:"pre-wrap",wordBreak:"break-word",overflowWrap:"anywhere",lineHeight:1.4,maxWidth:240,fontSize:11}}>{t.area||"—"}</td>
                            {testViewMode==="expandida"&&<td style={{padding:"9px 10px",color:DM.sub,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"pre-wrap",wordBreak:"break-word",overflowWrap:"anywhere",lineHeight:1.4,fontSize:10}}>{t.resultado || ''}</td>}
                            <td style={{padding:"9px 10px",color:DM.sub,whiteSpace:"nowrap",fontSize:11}}>{t.proceso}</td>
                            <td style={{padding:"9px 10px",color:DM.sub,whiteSpace:"nowrap",fontSize:10}}>{t.asignadoA||"—"}</td>
                            <td style={{padding:"9px 10px"}} onClick={e=>e.stopPropagation()}>
                              <select value={t.estado} onChange={e=>updateTCStatus(t.id,e.target.value)}
                                style={{border:`1px solid ${sc.color}50`,borderRadius:10,padding:"2px 6px",fontSize:9,fontWeight:700,color:sc.color,background:sc.bg,cursor:"pointer",outline:"none"}}>
                                {Object.keys(statusConfig).map(k=><option key={k} value={k}>{k}</option>)}
                              </select>
                            </td>
                            <td style={{padding:"9px 10px",textAlign:"center",fontSize:11}}>
                              {(t.attachments||[]).length>0&&<span style={{fontSize:11}} title={`${t.attachments.length} adjunto(s)`}>📎{t.attachments.length}</span>}
                              {(t.comentarios||[]).length>0&&<span style={{fontSize:11,marginLeft:3}} title={`${t.comentarios.length} comentario(s)`}>💬{t.comentarios.length}</span>}
                            </td>
                            <td style={{padding:"9px 10px",textAlign:"center",whiteSpace:"nowrap"}} onClick={e=>e.stopPropagation()}>
                              <Btn small variant="ghost" onClick={e=>{e.stopPropagation();setObservationTarget({type:"test", tc:t, initialText:(t.comentarios||[]).slice(-1)[0]?.texto || ""});}} title="Agregar novedad u observación" style={{padding:"4px 8px",fontSize:11,color:commentsCount>0?"#C0392B":undefined,fontWeight:commentsCount>0?800:700}}>📝{commentsCount>0?` ${commentsCount}`:""}</Btn>
                            </td>
                            {currentUser && Array.isArray(currentUser.roles) && currentUser.roles.includes("admin") && (
                              <td style={{padding:"9px 10px",textAlign:"center",whiteSpace:"nowrap"}} onClick={e=>e.stopPropagation()}>
                                <Btn small danger onClick={e=>{e.stopPropagation();setConfirmDelete({type:"tc",id:t.id});}} title="Eliminar caso">🗑️</Btn>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── CICLOS ── */}
            {!showProjectsHome&&tab==="ciclos"&&(()=>{
              const ciclos=proj.ciclos||[];
              return(
              <div style={{display:"flex",flexDirection:"column",gap:20}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                  <div>
                    <h2 style={{margin:0,fontSize:20,fontWeight:800,color:DM.text}}>Ciclos de Prueba</h2>
                    <p style={{margin:"3px 0 0",color:DM.sub,fontSize:12}}>{ciclos.length} ciclos · Trazabilidad completa por TC</p>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    <Btn small variant={cycleViewMode==="compacta"?"primary":"ghost"} onClick={()=>{setCycleViewMode("compacta");setExpandedCiclos(ciclos.reduce((a,c)=>({...a,[c.id]:true}),{}));}}>Vista compacta global</Btn>
                    <Btn small variant={cycleViewMode==="expandida"?"primary":"ghost"} onClick={()=>{setCycleViewMode("expandida");setExpandedCiclos(ciclos.reduce((a,c)=>({...a,[c.id]:true}),{}));}}>Vista expandida global</Btn>
                    <Btn small variant="ghost" onClick={()=>setExpandedCiclos(ciclos.reduce((a,c)=>({...a,[c.id]:true}),{}))}>↕ Expandir todos</Btn>
                    <Btn small variant="ghost" onClick={()=>setExpandedCiclos(ciclos.reduce((a,c)=>({...a,[c.id]:false}),{}))}>↕ Colapsar todos</Btn>
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
                  const compactCycle = cycleViewMode === "compacta";
                  const isExpanded = expandedCiclos[ciclo.id] ?? true;
                  const ejecs=ciclo.ejecuciones||[];
                  const aprobados=ejecs.filter(e=>normalizeCycleExecutionStatus(e.estado)==="Aprobado").length;
                  const enProgreso=ejecs.filter(e=>normalizeCycleExecutionStatus(e.estado)==="En Progreso").length;
                  const noEjec=ejecs.filter(e=>normalizeCycleExecutionStatus(e.estado)==="No ejecutado").length;
                  const fa=ejecs.filter(e=>normalizeCycleExecutionStatus(e.estado)==="Fallido").length;
                  const na=ejecs.filter(e=>normalizeCycleExecutionStatus(e.estado)==="No aplica").length;
                  const bl=ejecs.filter(e=>normalizeCycleExecutionStatus(e.estado)==="Bloqueante").length;
                  const execPctC=ejecs.length?Math.round((aprobados/ejecs.length)*100):0;
                  // TCs disponibles para agregar (que no estén ya en este ciclo, filtrados por módulo del ciclo)
                  const tcsDisponibles=tests.filter(t=>!ejecs.find(e=>e.tcId===t.id)&&(!ciclo.modulo||t.proceso===ciclo.modulo));
                  const selectedForCycle=bulkTcSelection[ciclo.id]||[];

                  return(
                    <div key={ciclo.id} onMouseEnter={()=>setHoveredCicloId(ciclo.id)} onMouseLeave={()=>setHoveredCicloId(null)} style={{background:DM.card,borderRadius:14,border:`1px solid ${DM.cardBorder}`,overflow:"hidden",boxShadow:"0 2px 12px #0000000a"}}>
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
                          {enProgreso>0&&(
                            <button onClick={()=>promoverFallidos(ciclo.id)}
                              style={{background:"#F39C12",border:"none",borderRadius:7,color:"#fff",padding:"5px 12px",cursor:"pointer",fontSize:12,fontWeight:700}}>
                              ⬆ Promover {enProgreso} en progreso →
                            </button>
                          )}
                          <button onClick={()=>{setEditCiclo(ciclo);setShowCicloForm(true);}} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:6,color:"#fff",padding:"5px 10px",cursor:"pointer",fontSize:12}}>✏️ Editar</button>
                          {currentUser && Array.isArray(currentUser.roles) && currentUser.roles.includes("admin") && (
                            <button onClick={()=>setConfirmDelete({type:"ciclo",id:ciclo.id})} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:6,color:"#fff",padding:"5px 8px",cursor:"pointer",fontSize:12}}>🗑️</button>
                          )}
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
                      <div style={{padding:"12px 20px 10px",display:"flex",gap:8,flexWrap:"wrap",borderBottom:`1px solid ${DM.cardBorder}`,alignItems:"center"}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:999,background:darkMode?"#1f2937":"#eef2ff",border:`1px solid ${DM.cardBorder}`}}>
                          <span style={{fontSize:11,color:DM.sub,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.05em"}}>Total</span>
                          <strong style={{color:DM.text,fontSize:13}}>{ejecs.length}</strong>
                        </div>
                        {[{l:"Aprobado",v:aprobados,c:"#27AE60"},{l:"En Progreso",v:enProgreso,c:"#F39C12"},{l:"Fallido",v:fa,c:"#E74C3C"},{l:"No ejecutado",v:noEjec,c:"#95A5A6"},{l:"Bloqueante",v:bl,c:"#8E44AD"}].filter(s=>s.v>0).map(s=>(
                          <div key={s.l} style={{display:"flex",alignItems:"center",gap:6,background:s.c+"15",border:`1px solid ${s.c}30`,borderRadius:999,padding:"6px 10px"}}>
                            <div style={{width:7,height:7,borderRadius:"50%",background:s.c,boxShadow:`0 0 0 2px ${s.c}22`}}/>
                            <span style={{fontSize:11,color:s.c,fontWeight:800}}>{s.v}</span>
                            <span style={{fontSize:10,color:DM.sub,fontWeight:700}}>{s.l}</span>
                          </div>
                        ))}
                        {/* Agregar TC al ciclo */}
                        {tcsDisponibles.length>0&&(
                          <div style={{marginLeft:"auto",display:"flex",flexDirection:"column",alignItems:"stretch",gap:8,width:"80%",maxWidth:"80%"}}>
                            <div style={{display:"flex",gap:6,alignItems:"center",justifyContent:"flex-end",width:"100%"}}>
                              <button onClick={()=>selectAllCycleTcs(ciclo.id,tcsDisponibles.map(t=>t.id))} style={{background:"#f4f4f4",border:"1px solid #e0e0e0",borderRadius:6,color:"#444",padding:"4px 8px",cursor:"pointer",fontSize:11,fontWeight:700}}>✓ Todos</button>
                              <button onClick={()=>clearCycleTcSelection(ciclo.id)} style={{background:"#f4f4f4",border:"1px solid #e0e0e0",borderRadius:6,color:"#444",padding:"4px 8px",cursor:"pointer",fontSize:11,fontWeight:700}}>Limpiar</button>
                              <button onClick={()=>addSelectedTcsToCiclo(ciclo.id,selectedForCycle)} disabled={!selectedForCycle.length} style={{background:proj.color,border:"none",borderRadius:6,color:"#fff",padding:"4px 10px",cursor:!selectedForCycle.length?"not-allowed":"pointer",fontSize:11,fontWeight:700,opacity:!selectedForCycle.length?0.6:1}}>Agregar seleccionados ({selectedForCycle.length})</button>
                            </div>
                            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(640px,1fr))",gap:16,width:"100%",maxHeight:420,overflowY:"auto",padding:16,border:`1px solid ${DM.cardBorder}`,borderRadius:8,background:darkMode?"#171717":"#fafafa",maxWidth:"100%"}}>
                              
                              {tcsDisponibles.map(t=>{
                                const tcData = normalizeTestRecord(t);
                                const checked=selectedForCycle.includes(tcData.id);
                                if(expandedAvailableTc===tcData.id){
                                  const attachmentsCount = (tcData.attachments||[]).length;
                                  const commentsCount = (tcData.comentarios||[]).length;
                                  return (
                                    <div key={t.id} style={{background:darkMode?"#151515":"#fff",border:`1px solid ${DM.cardBorder}`,borderRadius:8,padding:16,display:"flex",flexDirection:"column",gap:12,minHeight:160}}>
                                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                                        <div>
                                          <div style={{fontWeight:900,color:proj.color,fontSize:14}}>{tcData.id} · {tcData.escenario && tcData.escenario.length>60? tcData.escenario.slice(0,60)+"…": tcData.escenario}</div>
                                          <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
                                            {tcData.precondiciones&&<div style={{fontSize:12,padding:"4px 8px",borderRadius:999,background:darkMode?"#222":"#fafafa",color:DM.sub}}>{tcData.precondiciones}</div>}
                                            <div style={{fontSize:12,padding:"4px 8px",borderRadius:999,background:proj.color+"15",color:proj.color,fontWeight:700}}>{tcData.proceso||"Sin módulo"}</div>
                                            <div style={{fontSize:12,padding:"4px 8px",borderRadius:6,background:DM.card,border:`1px solid ${DM.cardBorder}`,color:DM.sub}}>Estado: <strong style={{color:DM.text,fontWeight:800}}> {tcData.estado||"—"}</strong></div>
                                          </div>
                                        </div>
                                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                                          <div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end"}}>
                                            <input type="checkbox" checked={checked} onChange={()=>toggleCycleTcSelection(ciclo.id,tcData.id)} />
                                            <button onClick={()=>setExpandedAvailableTc(null)} title="Cerrar" style={{background:"transparent",border:"none",cursor:"pointer",fontSize:16,color:DM.sub}}>✕</button>
                                          </div>
                                        </div>
                                      </div>

                                      <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:16,alignItems:"start"}}>
                                        <div style={{minWidth:0}}>
                                            <div style={{marginTop:12,fontSize:13,fontWeight:800,color:DM.text}}>Precondiciones</div>
                                          <div style={{color:DM.sub,whiteSpace:"pre-wrap",marginTop:6,lineHeight:1.4}}>{tcData.precondiciones || '—'}</div>

                                          <div style={{marginTop:12,fontSize:13,fontWeight:800,color:DM.text}}>Pasos</div>
                                          <div style={{color:DM.sub,whiteSpace:"pre-wrap",marginTop:6,lineHeight:1.4}}>{tcData.pasos || "—"}</div>

                                          <div style={{marginTop:12,fontSize:13,fontWeight:800,color:DM.text}}>Resultado esperado</div>
                                          <div style={{color:DM.sub,whiteSpace:"pre-wrap",marginTop:6}}>{tcData.resultado || "—"}</div>
                                        </div>

                                        <div style={{borderLeft:`1px solid ${DM.cardBorder}`,paddingLeft:12}}>
                                          <div style={{fontSize:13,fontWeight:800,color:DM.text}}>Metadatos</div>
                                          <div style={{marginTop:8,fontSize:12,color:DM.sub}}>
                                            <div>Tipo: {tcData.tipoPrueba||"—"}</div>
                                            <div>Nivel: {tcData.nivelPrueba||"—"}</div>
                                            <div>Adjuntos: {attachmentsCount}</div>
                                            <div>Comentarios: {commentsCount}</div>
                                          </div>
                                          <div style={{marginTop:12,display:"flex",gap:8,justifyContent:"flex-end"}}>
                                            <button onClick={()=>{toggleCycleTcSelection(ciclo.id,tcData.id);setExpandedAvailableTc(null);}} style={{background:proj.color,border:"none",color:"#fff",padding:"8px 12px",borderRadius:6,cursor:"pointer",fontWeight:800}}>Agregar</button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                return (
                                  <label key={t.id} style={{display:"flex",alignItems:"flex-start",gap:8,fontSize:11,color:DM.text,cursor:"pointer",padding:"2px 0"}}>
                                    <input type="checkbox" checked={checked} onChange={()=>toggleCycleTcSelection(ciclo.id,t.id)} />
                                    <span style={{lineHeight:1.25,flex:1,padding:"6px 0"}}>
                                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                                        <span style={{fontWeight:700,color:proj.color,display:"block"}}>{t.id}</span>
                                        <div style={{display:"flex",gap:6,alignItems:"center"}}>
                                          <span style={{fontSize:10,display:"inline-block",margin:"2px 0 4px",padding:"2px 8px",borderRadius:999,background:proj.color+"15",color:proj.color,fontWeight:700}}>{t.proceso || "Sin módulo"}</span>
                                          <button onClick={(e)=>{e.stopPropagation();e.preventDefault();setExpandedAvailableTc(expandedAvailableTc===t.id?null:t.id);}} title="Expandir" style={{background:"transparent",border:"none",cursor:"pointer",fontSize:14,color:DM.sub}}>⤢</button>
                                        </div>
                                      </div>
                                      <div style={{marginTop:4}}>
                                        <span style={{display:"block",whiteSpace:"normal",overflowWrap:"anywhere",maxWidth:"100%"}}>{t.escenario.slice(0,300)}{t.escenario.length>300?"…":""}</span>
                                      </div>
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                            <div style={{fontSize:10,color:DM.sub,alignSelf:"flex-start"}}>Marca los casos que aplican para este ciclo y agrégalos en bloque.</div>
                          </div>
                        )}
                      </div>

                      {/* TCs table */}
                      {ejecs.length>0?(
                        compactCycle ? (
                          <div style={{display:"flex",flexDirection:"column",gap:10,padding:"12px 12px 14px"}}>
                            {ejecs.map((ejec)=>{
                              const tc=tests.find(t=>t.id===ejec.tcId);
                              if(!tc)return null;
                              const parsedSteps = parseSteps(tc.pasos || "");
                              const derivedGeneralState = summarizeCycleStepStatuses(parsedSteps);
                              const generalState = normalizeCycleExecutionStatus(ejec.estado || derivedGeneralState);
                              const generalSc = cycleStatusConfig[generalState] || cycleStatusConfig["No ejecutado"];
                              const detailKey = `${ciclo.id}:${tc.id}`;
                              const isDetailOpen = expandedCycleTcDetails[detailKey] ?? false;
                              const notaTexto = (ejec.nota || "").trim() || "Sin novedad";
                              return (
                                <>
                                  <div key={ejec.tcId} style={{display:"grid",gridTemplateColumns:"90px minmax(0,1.7fr) minmax(110px,0.9fr) minmax(120px,1.2fr) 80px",gap:12,alignItems:"center",padding:"12px 14px",borderRadius:12,border:`1px solid ${DM.cardBorder}`,background:darkMode?"#171e2a":"#ffffff",boxShadow:darkMode?"0 3px 10px rgba(0,0,0,0.18)":"0 3px 10px rgba(15,23,42,0.04)",borderLeft:`4px solid ${generalSc.color}`}}>
                                    <div style={{fontWeight:900,color:proj.color,fontFamily:"monospace",fontSize:12}}>{tc.id}</div>
                                    <div style={{minWidth:0}}>
                                      <div style={{fontWeight:800,color:darkMode?"#f4f7fb":DM.text,whiteSpace:"normal",lineHeight:1.4,wordBreak:"break-word"}}>{tc.escenario}</div>
                                      <div style={{fontSize:10,color:DM.sub,marginTop:4}}>{tc.proceso || "Sin módulo"} · {tc.tipoPrueba || "Sin tipo"}</div>
                                    </div>
                                    <div style={{display:"flex",justifyContent:"flex-start"}}><Badge label={generalState} color={generalSc.color} bg={generalSc.bg} /></div>
                                    <div style={{fontSize:11,color:DM.sub,whiteSpace:"normal",lineHeight:1.45,wordBreak:"break-word"}}>{notaTexto.length>90 ? `${notaTexto.slice(0,90)}…` : notaTexto}</div>
                                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                                      <button onClick={()=>setExpandedCycleTcDetails(prev=>({...prev,[detailKey]:!isDetailOpen}))} style={{background:"transparent",border:"1px solid #4a5568",borderRadius:6,color:darkMode?"#dfe7f3":"#4b5563",padding:"3px 8px",cursor:"pointer",fontSize:10,fontWeight:800,minWidth:60}}>{isDetailOpen?"Ocultar":"Ver"}</button>
                                      <button onClick={()=>setObservationTarget({type:"cycle", cicloId:ciclo.id, tcId:tc.id, tc, initialText: ejec.nota || ""})} title="Agregar novedad u observación" style={{background:"transparent",border:"1px solid #d9e2ef",borderRadius:6,color:BRAND,padding:"3px 6px",cursor:"pointer",fontSize:10,fontWeight:800,minWidth:34}}>📝</button>
                                    </div>
                                  </div>

                                  {isDetailOpen && (
                                    <div style={{marginTop:8,padding:"0 4px 4px",display:"flex",flexDirection:"column",gap:10}}>
                                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:8,padding:"12px 14px",borderRadius:10,border:`1px solid ${DM.cardBorder}`,background:darkMode?"#121b27":"#f9fbff"}}>
                                        {[
                                          ["Módulo", tc.proceso || "—"],
                                          ["Tipo", tc.tipoPrueba || "—"],
                                          ["Nivel", tc.nivelPrueba || "—"],
                                          ["Asignado", tc.asignadoA || "—"],
                                          ["Fecha ejecución", tc.fechaEjecucion || "—"]
                                        ].map(([label, value]) => (
                                          <div key={label} style={{padding:"8px 10px",borderRadius:8,border:`1px solid ${DM.cardBorder}`,background:darkMode?"#1a2532":"#ffffff"}}>
                                            <div style={{fontSize:9.5,color:DM.sub,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>{label}</div>
                                            <div style={{fontSize:11.5,color:darkMode?"#eaf3ff":"#374151",fontWeight:700,whiteSpace:"normal",wordBreak:"break-word"}}>{value}</div>
                                          </div>
                                        ))}
                                      </div>

                                      <div style={{padding:"12px 14px",borderRadius:10,border:`1px solid ${DM.cardBorder}`,background:darkMode?"#121b27":"#f9fbff"}}>
                                        <div style={{fontSize:9.5,color:DM.sub,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Precondiciones</div>
                                        <div style={{fontSize:12,color:darkMode?"#dfe7f3":"#374151",whiteSpace:"pre-wrap",lineHeight:1.5}}>{tc.precondiciones || "—"}</div>
                                      </div>

                                      <div style={{padding:"12px 14px",borderRadius:10,border:`1px solid ${DM.cardBorder}`,background:darkMode?"#121b27":"#f9fbff"}}>
                                        <div style={{fontSize:9.5,color:DM.sub,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Resultado esperado</div>
                                        <div style={{fontSize:12,color:darkMode?"#dfe7f3":"#374151",whiteSpace:"pre-wrap",lineHeight:1.5}}>{tc.resultado || "—"}</div>
                                      </div>

                                      <div style={{padding:"12px 14px",borderRadius:10,border:`1px solid ${DM.cardBorder}`,background:darkMode?"#121b27":"#f9fbff"}}>
                                        <div style={{fontSize:9.5,color:DM.sub,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Estado de Ejecución</div>
                                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                                          <div>
                                            <div style={{fontSize:9,color:DM.sub,fontWeight:700,marginBottom:4}}>Estado</div>
                                            <select value={normalizeCycleExecutionStatus(ejec.estado || generalState)} onChange={e=>{
                                              const nextState = normalizeCycleExecutionStatus(e.target.value);
                                              const newProjects = JSON.parse(JSON.stringify(projects));
                                              const p = newProjects.find(pp=>pp.id===activeProject);
                                              const c = p?.ciclos?.find(cc=>cc.id===ciclo.id);
                                              const ex = c?.ejecuciones?.find(ee=>ee.tcId===tc.id);
                                              if(ex) {
                                                ex.estado = nextState;
                                                ex.fechaEjecucion = nextState === "No ejecutado" ? ex.fechaEjecucion : (ex.fechaEjecucion || today());
                                              }
                                              setProjects(newProjects);
                                              localStorage.setItem("projects",JSON.stringify(newProjects));
                                            }} style={{width:"100%",padding:"6px 8px",borderRadius:6,border:`1px solid ${DM.cardBorder}`,background:darkMode?"#141b24":"#fff",color:darkMode?"#eaf3ff":"#374151",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                                              {Object.keys(cycleStatusConfig).map(k => <option key={k} value={k}>{k}</option>)}
                                            </select>
                                          </div>
                                          <div>
                                            <div style={{fontSize:9,color:DM.sub,fontWeight:700,marginBottom:4}}>Observación</div>
                                            <input type="text" value={ejec.nota || ""} onChange={e=>{
                                              const newProjects = JSON.parse(JSON.stringify(projects));
                                              const p = newProjects.find(pp=>pp.id===activeProject);
                                              const c = p?.ciclos?.find(cc=>cc.id===ciclo.id);
                                              const ex = c?.ejecuciones?.find(ee=>ee.tcId===tc.id);
                                              if(ex) ex.nota = e.target.value;
                                              setProjects(newProjects);
                                              localStorage.setItem("projects",JSON.stringify(newProjects));
                                            }} placeholder="Ej: timeout, UI defects..." style={{width:"100%",padding:"6px 8px",borderRadius:6,border:`1px solid ${DM.cardBorder}`,background:darkMode?"#141b24":"#fff",color:darkMode?"#eaf3ff":"#374151",fontSize:12,fontWeight:700}}/>
                                          </div>
                                        </div>
                                      </div>

                                      <div style={{padding:"12px 14px",borderRadius:10,border:`1px solid ${DM.cardBorder}`,background:darkMode?"#121b27":"#f9fbff"}}>
                                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:8}}>
                                          <div style={{fontSize:9.5,color:DM.sub,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.06em"}}>Pasos</div>
                                          <span style={{fontSize:10,color:DM.sub,fontWeight:700}}>{parsedSteps.length} paso(s)</span>
                                        </div>
                                        <div style={{display:"flex",flexDirection:"column",gap:7}}>
                                          {parsedSteps.length ? parsedSteps.map((step,index)=>(
                                            <div key={`${tc.id}-${index}`} style={{display:"flex",flexDirection:"column",gap:6,background:darkMode?"#141b24":"#fff",borderRadius:9,padding:"8px 10px",border:`1px solid ${darkMode?"#31445b":"#eaf1f8"}`,borderLeft:`4px solid ${cycleStatusConfig[normalizeCycleExecutionStatus(step.status)]?.color || DM.sub}`,boxShadow:darkMode?"0 1px 4px rgba(0,0,0,0.14)":"0 1px 4px rgba(17,24,39,0.05)"}}>
                                              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                                                <span style={{fontSize:9,color:DM.sub,fontWeight:800,whiteSpace:"nowrap",textTransform:"uppercase",letterSpacing:"0.05em"}}>Paso {index+1}</span>
                                                <Badge label={normalizeCycleExecutionStatus(step.status)} color={cycleStatusConfig[normalizeCycleExecutionStatus(step.status)]?.color || DM.sub} bg={cycleStatusConfig[normalizeCycleExecutionStatus(step.status)]?.bg || "#f4f4f4"} />
                                                <select
                                                  value={normalizeCycleExecutionStatus(step.status)}
                                                  onChange={e=>updateStepEstado(tc.id,index,e.target.value)}
                                                  title="Cambiar estado del paso"
                                                  style={{marginLeft:"auto",border:`1px solid ${cycleStatusConfig[normalizeCycleExecutionStatus(step.status)]?.color || DM.sub}30`,borderRadius:7,padding:"2px 7px",fontSize:9,fontWeight:700,color:cycleStatusConfig[normalizeCycleExecutionStatus(step.status)]?.color || DM.sub,background:cycleStatusConfig[normalizeCycleExecutionStatus(step.status)]?.bg || "#f4f4f4",cursor:"pointer",outline:"none",minWidth:120}}>
                                                  {Object.keys(cycleStatusConfig).map(k => <option key={k} value={k}>{k}</option>)}
                                                </select>
                                              </div>
                                              <span style={{fontSize:9.5,color:darkMode?"#dce6f5":"#4b5563",lineHeight:1.4,whiteSpace:"normal"}}>{step.text || "Sin detalle"}</span>
                                            </div>
                                          )) : <div style={{fontSize:12,color:DM.sub}}>Sin pasos definidos.</div>}
                                        </div>
                                      </div>

                                      <div style={{padding:"12px 14px",borderRadius:10,border:`1px solid ${DM.cardBorder}`,background:darkMode?"#121b27":"#f9fbff"}}>
                                        <div style={{fontSize:9.5,color:DM.sub,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Adjuntos</div>
                                        <AttachmentZone attachments={tc.attachments||[]} onChange={next=>updateTcAttachments(tc.id,next)} />
                                      </div>
                                    </div>
                                  )}
                                </>
                              );
                            })}
                          </div>
                        ) : (
                          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                            <thead>
                              <tr style={{background:darkMode?"#1a1a1a":"#f8f8f8"}}>
                                <th style={{padding:"8px 10px",textAlign:"left",fontSize:10,fontWeight:700,color:DM.sub,textTransform:"uppercase",letterSpacing:"0.05em",whiteSpace:"nowrap",width:120}}>TC</th>
                                <th style={{padding:"8px 10px",textAlign:"left",fontSize:10,fontWeight:700,color:DM.sub,textTransform:"uppercase",letterSpacing:"0.05em",whiteSpace:"nowrap",minWidth:520}}>Escenario</th>
                                <th style={{padding:"8px 10px",textAlign:"left",fontSize:10,fontWeight:700,color:DM.sub,textTransform:"uppercase",letterSpacing:"0.05em",whiteSpace:"nowrap",width:64}}> </th>
                              </tr>
                            </thead>
                            <tbody>
                              {ejecs.map((ejec)=>{
                                const tc=tests.find(t=>t.id===ejec.tcId);
                                if(!tc)return null;
                                const parsedSteps = parseSteps(tc.pasos || "");
                                const derivedGeneralState = summarizeCycleStepStatuses(parsedSteps);
                                const generalState = normalizeCycleExecutionStatus(ejec.estado || derivedGeneralState);
                                const sc=cycleStatusConfig[generalState]||cycleStatusConfig["No ejecutado"];
                                const generalSc = sc;
                                const detailKey = `${ciclo.id}:${tc.id}`;
                                const isDetailOpen = expandedCycleTcDetails[detailKey] ?? false;
                                return(
                                  <>
                                    <tr key={ejec.tcId} style={{borderTop:`1px solid ${DM.cardBorder}`,transition:"background 0.12s"}}
                                      onMouseEnter={e=>e.currentTarget.style.background=DM.tableHover}
                                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                                      <td style={{padding:"8px 10px",fontWeight:700,color:proj.color,fontFamily:"monospace",whiteSpace:"nowrap",verticalAlign:"top",width:120}}>
                                        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                                          <div>{tc.id}</div>
                                          <Btn small variant="ghost" onClick={e=>{e.stopPropagation();setObservationTarget({type:"cycle", cicloId:ciclo.id, tcId:tc.id, tc, initialText: ejec.nota || ""});}} title="Agregar novedad u observación" style={{padding:"4px 9px",fontSize:10,color:BRAND,border:`1px solid ${BRAND}2a`,background:BRAND_LIGHT,borderRadius:999,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>📝 Novedad</Btn>
                                        </div>
                                        <div style={{marginTop:8,display:"inline-flex",alignItems:"center",gap:6}}>
                                          <Badge label={generalState} color={generalSc.color} bg={generalSc.bg} />
                                        </div>
                                        <div style={{marginTop:8}}>
                                          <button onClick={()=>setExpandedCycleTcDetails(prev=>({...prev,[detailKey]:!isDetailOpen}))} style={{background:"transparent",border:"1px solid #4a5568",borderRadius:6,color:darkMode?"#dfe7f3":"#4b5563",padding:"3px 8px",cursor:"pointer",fontSize:10,fontWeight:800}}>{isDetailOpen?"Ocultar detalle":"Ver detalle"}</button>
                                        </div>
                                      </td>
                                      <td style={{padding:"8px 10px",fontWeight:700,color:darkMode?"#f4f7fb":DM.text,whiteSpace:"normal",wordBreak:"break-word",lineHeight:1.5,minWidth:520,letterSpacing:"0.02px",background:darkMode?"#202b3b":"#f7faff",borderRadius:6,border:darkMode?"1px solid #32445a":"1px solid #e8f0ff",verticalAlign:"top"}}>
                                        <div>{tc.escenario}</div>
                                        <div style={{marginTop:8,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                                          <span style={{fontSize:10,color:DM.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em"}}>Estado general</span>
                                          <Badge label={generalState} color={generalSc.color} bg={generalSc.bg} />
                                        </div>
                                        {isDetailOpen ? (
                                          <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:10}}>
                                            <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:8}}>
                                              {[
                                                ["Módulo", tc.proceso || "—"],
                                                ["Tipo", tc.tipoPrueba || "—"],
                                                ["Nivel", tc.nivelPrueba || "—"],
                                                ["Asignado", tc.asignadoA || "—"],
                                                ["Fecha aprobación", tc.fechaAprobacion || "—"],
                                                ["Fecha ejecución", tc.fechaEjecucion || "—"]
                                              ].map(([label,value]) => (
                                                <div key={label} style={{background:darkMode?"#171e2a":"#ffffff",border:`1px solid ${DM.cardBorder}`,borderRadius:8,padding:"8px 10px"}}>
                                                  <div style={{fontSize:8.5,color:DM.sub,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>{label}</div>
                                                  <div style={{fontSize:11.5,color:darkMode?"#eaf3ff":"#374151",fontWeight:700,whiteSpace:"normal",wordBreak:"break-word"}}>{value}</div>
                                                </div>
                                              ))}
                                            </div>

                                            <div style={{borderRadius:12,padding:"12px 14px",background:darkMode?"#171e2a":"#ffffff",border:`1px solid ${DM.cardBorder}`,boxShadow:darkMode?"inset 0 1px 0 rgba(255,255,255,0.02)":"inset 0 1px 0 rgba(255,255,255,0.7)"}}>
                                              <div style={{fontSize:9.5,color:DM.sub,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:7}}>Precondiciones</div>
                                              <div style={{fontSize:12,color:darkMode?"#dfe7f3":"#374151",whiteSpace:"pre-wrap",lineHeight:1.65}}>{tc.precondiciones || tc.area || "—"}</div>
                                            </div>

                                            <div style={{borderRadius:12,padding:"12px 14px",background:darkMode?"#171e2a":"#ffffff",border:`1px solid ${DM.cardBorder}`}}>
                                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:8}}>
                                                <div style={{fontSize:9.5,color:DM.sub,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.06em"}}>Pasos</div>
                                                <span style={{fontSize:10,color:DM.sub,fontWeight:700}}>{parsedSteps.length} paso(s)</span>
                                              </div>
                                              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                                                {parsedSteps.length ? parsedSteps.map((step,index)=>(
                                                  <div key={`${tc.id}-${index}`} onClick={e=>e.stopPropagation()} style={{display:"flex",flexDirection:"column",gap:6,background:darkMode?"#141b24":"#fff",borderRadius:9,padding:"8px 10px",border:`1px solid ${darkMode?"#31445b":"#eaf1f8"}`,borderLeft:`4px solid ${cycleStatusConfig[normalizeCycleExecutionStatus(step.status)]?.color || DM.sub}`,boxShadow:darkMode?"0 1px 4px rgba(0,0,0,0.14)":"0 1px 4px rgba(17,24,39,0.05)"}}>
                                                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
                                                      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",minWidth:0}}>
                                                        <span style={{fontSize:9,color:DM.sub,fontWeight:800,whiteSpace:"nowrap",textTransform:"uppercase",letterSpacing:"0.05em"}}>Paso {index+1}</span>
                                                        <Badge label={normalizeCycleExecutionStatus(step.status)} color={cycleStatusConfig[normalizeCycleExecutionStatus(step.status)]?.color || DM.sub} bg={cycleStatusConfig[normalizeCycleExecutionStatus(step.status)]?.bg || "#f4f4f4"} />
                                                      </div>
                                                      <select value={normalizeCycleExecutionStatus(step.status)} onChange={e=>updateStepEstado(tc.id,index,e.target.value)} title="Cambiar estado del paso" style={{border:`1px solid ${cycleStatusConfig[normalizeCycleExecutionStatus(step.status)]?.color || DM.sub}30`,borderRadius:7,padding:"2px 8px",fontSize:9,fontWeight:700,color:cycleStatusConfig[normalizeCycleExecutionStatus(step.status)]?.color || DM.sub,background:cycleStatusConfig[normalizeCycleExecutionStatus(step.status)]?.bg || "#f4f4f4",cursor:"pointer",outline:"none",minWidth:104,flexShrink:0}}>
                                                        {Object.keys(cycleStatusConfig).map(k=><option key={k} value={k}>{k}</option>)}
                                                      </select>
                                                    </div>
                                                    <span style={{fontSize:9.5,color:darkMode?"#dce6f5":"#4b5563",lineHeight:1.4,whiteSpace:"normal"}}>{step.text || "Sin detalle"}</span>
                                                  </div>
                                                )) : <div style={{fontSize:12,color:DM.sub}}>Sin pasos definidos.</div>}
                                              </div>
                                            </div>

                                            <div style={{borderRadius:12,padding:"12px 14px",background:darkMode?"#171e2a":"#ffffff",border:`1px solid ${DM.cardBorder}`}}>
                                              <div style={{fontSize:9.5,color:DM.sub,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:7}}>Resultado esperado</div>
                                              <div style={{fontSize:12,color:darkMode?"#dfe7f3":"#374151",whiteSpace:"pre-wrap",lineHeight:1.65}}>{tc.resultado || "—"}</div>
                                            </div>

                                            <div style={{borderRadius:12,padding:"12px 14px",background:darkMode?"#171e2a":"#ffffff",border:`1px solid ${DM.cardBorder}`}}>
                                              <div style={{fontSize:9.5,color:DM.sub,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Estado de Ejecución</div>
                                              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                                                <div>
                                                  <div style={{fontSize:9,color:DM.sub,fontWeight:700,marginBottom:4}}>Estado</div>
                                                  <select value={normalizeCycleExecutionStatus(ejec.estado || generalState)} onChange={e=>{
                                                    const nextState = normalizeCycleExecutionStatus(e.target.value);
                                                    const newProjects = JSON.parse(JSON.stringify(projects));
                                                    const p = newProjects.find(pp=>pp.id===activeProject);
                                                    const c = p?.ciclos?.find(cc=>cc.id===ciclo.id);
                                                    const ex = c?.ejecuciones?.find(ee=>ee.tcId===tc.id);
                                                    if(ex) {
                                                      ex.estado = nextState;
                                                      ex.fechaEjecucion = nextState === "No ejecutado" ? ex.fechaEjecucion : (ex.fechaEjecucion || today());
                                                    }
                                                    setProjects(newProjects);
                                                    localStorage.setItem("projects",JSON.stringify(newProjects));
                                                  }} style={{width:"100%",padding:"6px 8px",borderRadius:6,border:`1px solid ${DM.cardBorder}`,background:darkMode?"#141b24":"#fff",color:darkMode?"#eaf3ff":"#374151",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                                                    {Object.keys(cycleStatusConfig).map(k => <option key={k} value={k}>{k}</option>)}
                                                  </select>
                                                </div>
                                                <div>
                                                  <div style={{fontSize:9,color:DM.sub,fontWeight:700,marginBottom:4}}>Observación</div>
                                                  <input type="text" value={ejec.nota || ""} onChange={e=>{
                                                    const newProjects = JSON.parse(JSON.stringify(projects));
                                                    const p = newProjects.find(pp=>pp.id===activeProject);
                                                    const c = p?.ciclos?.find(cc=>cc.id===ciclo.id);
                                                    const ex = c?.ejecuciones?.find(ee=>ee.tcId===tc.id);
                                                    if(ex) ex.nota = e.target.value;
                                                    setProjects(newProjects);
                                                    localStorage.setItem("projects",JSON.stringify(newProjects));
                                                  }} placeholder="Ej: timeout, UI defects..." style={{width:"100%",padding:"6px 8px",borderRadius:6,border:`1px solid ${DM.cardBorder}`,background:darkMode?"#141b24":"#fff",color:darkMode?"#eaf3ff":"#374151",fontSize:12,fontWeight:700}} />
                                                </div>
                                              </div>
                                            </div>

                                            <div style={{borderRadius:12,padding:"12px 14px",background:darkMode?"#171e2a":"#ffffff",border:`1px solid ${DM.cardBorder}`}}>
                                              <div style={{fontSize:9.5,color:DM.sub,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Adjuntar documento o imagen</div>
                                              <AttachmentZone attachments={tc.attachments||[]} onChange={next=>updateTcAttachments(tc.id,next)} />
                                              <button onClick={()=>{setEditIssue({...EMPTY_ISSUE,testId:tc.id,escenario:tc.escenario,modulo:tc.area||tc.proceso,attachments:tc.attachments||[]});setShowIssueForm(true);}} style={{marginTop:12,background:"#F5B041",color:"#1E1E1E",border:"none",borderRadius:7,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer",width:"100%"}}>📋 Reportar Issue desde este TC</button>
                                            </div>
                                          </div>
                                        ) : null}
                                      </td>
                                      <td style={{padding:"8px 10px",width:64,textAlign:"center"}}>
                                        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}} onClick={e=>e.stopPropagation()}>
                                          <button onClick={()=>removeTcFromCiclo(ciclo.id,tc.id)} title="Quitar del ciclo"
                                            style={{background:"none",border:"none",cursor:"pointer",color:"#E74C3C",fontSize:14,padding:"2px 4px"}}>✕</button>
                                        </div>
                                      </td>
                                    </tr>
                                  </>
                                );
                              })}
                            </tbody>
                          </table>
                        )
                      ):(
                        <div style={{padding:"24px",fontSize:12,color:"#888",textAlign:"center"}}>
                          Sin TCs asignados. Marca los casos que aplican arriba y agrégalos en bloque a este ciclo.
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
                            <th style={{padding:"8px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:DM.sub,textTransform:"uppercase"}}>Módulo</th>
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
                              <td style={{padding:"8px 14px",fontSize:10,fontWeight:700,color:proj.color,whiteSpace:"nowrap"}}>{tc.proceso || "Sin módulo"}</td>
                              <td style={{padding:"8px 14px",fontWeight:700,color:darkMode?"#f4f7fb":DM.text,whiteSpace:"normal",wordBreak:"break-word",lineHeight:1.5,minWidth:220,maxWidth:320,letterSpacing:"0.08px",background:darkMode?"#202b3b":"#f7faff",borderRadius:8,border:darkMode?"1px solid #32445a":"1px solid #e8f0ff"}}>{tc.escenario}</td>
                              {ciclos.map(c=>{
                                const ejec=(c.ejecuciones||[]).find(e=>e.tcId===tc.id);
                                if(!ejec)return<td key={c.id} style={{padding:"8px 14px",textAlign:"center",color:"#ccc"}}>—</td>;
                                const sc=cycleStatusConfig[normalizeCycleExecutionStatus(ejec.estado)]||cycleStatusConfig["No ejecutado"];
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
            {!showProjectsHome&&tab==="issues"&&(
              <div style={{display:"flex",flexDirection:"column",gap:18}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                  <div>
                    <div style={{fontSize:10,color:"#F5B041",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.2em",marginBottom:5}}>Panamericana · Módulo Activos Fijos</div>
                    <h2 style={{margin:0,fontSize:42,fontWeight:900,color:DM.text,lineHeight:1}}>Bitácora de Issues <span style={{fontSize:36,color:DM.sub,fontWeight:700}}>/ QA</span></h2>
                    <p style={{margin:"8px 0 0",color:DM.sub,fontSize:13}}>Última actualización: {issueLastUpdateLabel}</p>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    <Btn onClick={()=>{setEditIssue(null);setShowIssueForm(true);}} style={{background:"#F5B041",color:"#1E1E1E",padding:"12px 18px",fontSize:14,fontWeight:900}}>+ Registrar issue</Btn>
                    <Btn variant="ghost" small onClick={()=>exportIssuesToCSV(proj, filteredIssues)}>⬇ Exportar</Btn>
                  </div>
                </div>

                <div style={{display:"grid",gridTemplateColumns:"repeat(7, minmax(120px, 1fr))",border:`1px solid ${DM.cardBorder}`,borderRadius:10,overflow:"hidden",background:darkMode?"#172736":"#f8fbff"}}>
                  {[
                    {label:"OPEN",value:filteredIssueStats.open,color:"#E74C3C"},
                    {label:"BLOCKED",value:filteredIssueStats.blocked,color:"#8E44AD"},
                    {label:"READY FOR RETEST",value:filteredIssueStats.readyRetest,color:"#3498DB"},
                    {label:"IN PROGRESS",value:filteredIssueStats.inProg,color:"#F39C12"},
                    {label:"CLOSED",value:filteredIssueStats.closed,color:"#27AE60"},
                    {label:"RE-OPEN",value:filteredIssueStats.reopen,color:"#E67E22"},
                    {label:"TOTAL",value:filteredIssueStats.total,color:"#F5B041",accent:true},
                  ].map(item=>(
                    <div key={item.label} style={{padding:"14px 10px",textAlign:"center",borderRight:`1px solid ${DM.cardBorder}`,background:item.accent?(darkMode?"#21384F":"#eef5ff"):"transparent"}}>
                      <div style={{fontSize:34,fontWeight:900,color:item.color,lineHeight:1}}>{item.value}</div>
                      <div style={{fontSize:11,color:DM.sub,letterSpacing:"0.08em",marginTop:5}}>{item.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                  <div style={{display:"inline-flex",alignItems:"center",border:`1px solid ${DM.cardBorder}`,borderRadius:8,overflow:"hidden"}}>
                    <button onClick={()=>setIssueViewMode("table")} style={{border:"none",padding:"9px 20px",cursor:"pointer",fontSize:13,fontWeight:800,letterSpacing:"0.08em",background:issueViewMode==="table"?"#F5B041":"transparent",color:issueViewMode==="table"?"#1E1E1E":DM.sub}}>TABLA</button>
                    <button onClick={()=>setIssueViewMode("kanban")} style={{border:"none",padding:"9px 20px",cursor:"pointer",fontSize:13,fontWeight:800,letterSpacing:"0.08em",background:issueViewMode==="kanban"?"#F5B041":"transparent",color:issueViewMode==="kanban"?"#1E1E1E":DM.sub}}>KANBAN</button>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    <select value={filterIssueEstado} onChange={e=>setFilterIssueEstado(e.target.value)} style={{...inputStyle,width:165,padding:"7px 12px",background:darkMode?"#2C2C2E":"#fff",color:DM.text,border:darkMode?"1px solid #444":"1px solid #e0e0e0"}}>
                      <option value="Todos">Todos los estados</option>
                      {Object.keys(issueStatusConfig).map(k=><option key={k} value={k}>{k}</option>)}
                    </select>
                    <select value={filterModulo} onChange={e=>setFilterModulo(e.target.value)} style={{...inputStyle,width:165,padding:"7px 12px",background:darkMode?"#2C2C2E":"#fff",color:DM.text,border:darkMode?"1px solid #444":"1px solid #e0e0e0"}}>
                      {modulosList.map(m=><option key={m} value={m}>{m==="Todos"?"Todos los módulos":m}</option>)}
                    </select>
                    <input value={issueSearch} onChange={e=>setIssueSearch(e.target.value)} placeholder="Buscar por Test ID, formulario o escenario" style={{...inputStyle,width:300,padding:"9px 12px",background:darkMode?"#2C2C2E":"#fff",color:DM.text,border:darkMode?"1px solid #444":"1px solid #e0e0e0"}}/>
                  </div>
                </div>

                {issueViewMode==="table" && (
                  <div style={{background:DM.card,borderRadius:12,overflow:"hidden",border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000000a"}}>
                    {filteredIssues.length===0 ? (
                      <div style={{padding:"58px 24px",textAlign:"center"}}>
                        <div style={{fontSize:33,fontWeight:900,color:DM.text,marginBottom:10}}>Sin issues registrados</div>
                        <div style={{fontSize:30,color:DM.sub}}>Registra el primero con el botón '+ Registrar issue'.</div>
                      </div>
                    ) : (
                      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                        <thead>
                          <tr style={{background:darkMode?"#1a2535":"#1e2a3a",color:"#8a9bb0"}}>
                            {['TEST ID','FORMULARIO','OBSERVACIÓN','EVIDENCIA','SEVERITY','PRIORITY','STATUS','FECHA',''].map(h=>(
                              <th key={h} style={{padding:"11px 13px",textAlign:"left",fontWeight:700,fontSize:10,letterSpacing:"0.07em",textTransform:"uppercase",whiteSpace:"nowrap",borderBottom:`1px solid ${DM.cardBorder}`}}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredIssues.map((issue,i)=>{
                            const realIndex=proj.issues.findIndex(x=>x.id===issue.id);
                            const sc=issueStatusConfig[issue.estado]||issueStatusConfig["Open"];
                            const firstImg=(issue.attachments||[]).find(a=>a.type&&a.type.startsWith("image/"));
                            return (
                              <tr key={issue.id} draggable
                                onDragStart={()=>{dragIssueIndex.current=realIndex;}}
                                onDragOver={e=>{e.preventDefault();dragOverIssueIndex.current=realIndex;}}
                                onDrop={()=>{if(dragIssueIndex.current!==null&&dragOverIssueIndex.current!==dragIssueIndex.current)reorderIssues(dragIssueIndex.current,dragOverIssueIndex.current);dragIssueIndex.current=null;dragOverIssueIndex.current=null;}}
                                style={{background:i%2===0?DM.tableRow0:DM.tableRow1,borderBottom:`1px solid ${DM.cardBorder}`,transition:"background 0.12s"}}
                                onMouseEnter={e=>{e.currentTarget.style.background=DM.tableHover;}}
                                onMouseLeave={e=>{e.currentTarget.style.background=i%2===0?DM.tableRow0:DM.tableRow1;}}>
                                <td style={{padding:"10px 13px",color:proj.color,fontWeight:700,whiteSpace:"nowrap",fontSize:13}}>{issue.testId||"—"}</td>
                                <td style={{padding:"10px 13px",fontWeight:700,color:DM.text,maxWidth:260,whiteSpace:"normal",wordBreak:"break-word",lineHeight:1.4}}>{issue.escenario||"—"}</td>
                                <td style={{padding:"10px 13px",color:DM.sub,maxWidth:280,whiteSpace:"normal",wordBreak:"break-word",lineHeight:1.4}}>{issue.observacion||"—"}</td>
                                <td style={{padding:"10px 13px"}}>
                                  {firstImg
                                    ?<img src={firstImg.data} alt="evidencia" onClick={e=>{e.stopPropagation();setPreviewImg(firstImg.data);}} style={{width:44,height:32,objectFit:"cover",borderRadius:4,display:"block",border:`1px solid ${DM.cardBorder}`,cursor:"zoom-in"}}/>
                                    :<span style={{fontSize:11,color:"#bbb"}}>—</span>}
                                </td>
                                <td style={{padding:"10px 13px",color:DM.text,whiteSpace:"nowrap"}}>{issue.severidad||"—"}</td>
                                <td style={{padding:"10px 13px",color:DM.text,whiteSpace:"nowrap"}}>{issue.prioridad||"—"}</td>
                                <td style={{padding:"10px 13px",whiteSpace:"nowrap"}}>
                                  <span style={{fontSize:11,fontWeight:800,color:sc.color,border:`1.5px solid ${sc.color}`,borderRadius:5,padding:"2px 9px",letterSpacing:"0.07em",textTransform:"uppercase",background:"transparent"}}>{issue.estado}</span>
                                </td>
                                <td style={{padding:"10px 13px",color:proj.color,whiteSpace:"nowrap",fontWeight:600,fontSize:12}}>{issue.fechaCreacion||"—"}</td>
                                <td style={{padding:"10px 13px",whiteSpace:"nowrap"}}>
                                  <Btn small variant="ghost" onClick={e=>{e.stopPropagation();setEditIssue(issue);setShowIssueForm(true);}}>Editar</Btn>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {issueViewMode==="kanban" && (
                  <div style={{overflowX:"auto",paddingBottom:4}}>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(6, minmax(190px, 1fr))",gap:10,minWidth:1140}}>
                      {["Open","Blocked","Ready for Retest","In Progress","Closed","Re-Open"].map(status=>{
                        const cards = filteredIssues.filter(issue=>issue.estado===status);
                        const sc = issueStatusConfig[status] || { color: DM.sub, bg: DM.card };
                        return (
                          <div key={status} style={{background:darkMode?"#141b26":"#f0f2f5",border:`1px solid ${DM.cardBorder}`,borderRadius:10,padding:"10px 8px",minHeight:240}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,paddingBottom:8,borderBottom:`1px solid ${DM.cardBorder}`}}>
                              <div style={{fontSize:11,fontWeight:800,color:darkMode?"#8a9bb0":"#555",textTransform:"uppercase",letterSpacing:"0.08em"}}>{status}</div>
                              <span style={{fontSize:11,fontWeight:800,color:sc.color,background:darkMode?"#1e2a3a":"#e8edf4",borderRadius:999,padding:"1px 8px",minWidth:20,textAlign:"center"}}>{cards.length}</span>
                            </div>
                            <div style={{display:"flex",flexDirection:"column",gap:8}}>
                              {cards.length===0 && <div style={{fontSize:13,color:DM.sub,padding:"4px 2px"}}>—</div>}
                              {cards.map(issue=>{
                                const firstImg=(issue.attachments||[]).find(a=>a.type&&a.type.startsWith("image/"));
                                return (
                                  <div key={issue.id} onClick={()=>{setEditIssue(issue);setShowIssueForm(true);}} style={{border:`1px solid ${DM.cardBorder}`,borderLeft:`4px solid ${sc.color}`,borderRadius:8,overflow:"hidden",background:darkMode?"#1a2535":"#fff",cursor:"pointer",transition:"box-shadow 0.15s"}}
                                    onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 18px #0003"}
                                    onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                                    {firstImg && (
                                      <img src={firstImg.data} alt="evidencia" onClick={e=>{e.stopPropagation();setPreviewImg(firstImg.data);}}
                                        style={{width:"100%",height:110,objectFit:"cover",display:"block",cursor:"zoom-in"}}/>
                                    )}
                                    <div style={{padding:"8px 10px"}}>
                                      <div style={{fontSize:11,fontWeight:800,color:proj.color,marginBottom:4,letterSpacing:"0.03em"}}>{issue.testId||"—"}</div>
                                      <div style={{fontSize:13,fontWeight:700,color:DM.text,lineHeight:1.35,marginBottom:4}}>{issue.escenario||"—"}</div>
                                      {issue.observacion && <div style={{fontSize:11,color:DM.sub,lineHeight:1.4}}>{issue.observacion}</div>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{fontSize:12,color:DM.sub,textAlign:"center",marginTop:4}}>Datos visibles para cualquier persona con este enlace · Actualización en tiempo real</div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── MODALS ── */}
      {showJira&&<JiraModal onImport={handleJiraImport} onClose={()=>setShowJira(false)} existingTests={tests} darkMode={darkMode}/>}
      {showCicloForm&&<CicloFormModal initial={editCiclo} cicloId={editCiclo?.nombre} modulosList={[...new Set([...(proj?.modules||[]),...tests.map(t=>t.proceso).filter(Boolean)])]} onSave={saveCiclo} onClose={()=>{setShowCicloForm(false);setEditCiclo(null);}} darkMode={darkMode}/>}
      {showProjForm&&<ProjectFormModal initial={editProj} onSave={saveProject} onClose={()=>{setShowProjForm(false);setEditProj(null);}} darkMode={darkMode}/>}
      {showTcForm&&<TcFormModal initial={editTc} tcId={editTc?.id} onSave={saveTC} onClose={()=>{setShowTcForm(false);setEditTc(null);}} darkMode={darkMode} project={proj}/>}
      {observationTarget&&<ObservationModal tc={observationTarget.tc} initialText={observationTarget.initialText || ""} darkMode={darkMode}
        onClose={()=>setObservationTarget(null)}
        onSave={(text)=>{
          if (observationTarget.type === "cycle") {
            const targetEjec = ((proj?.ciclos||[]).find(c=>c.id===observationTarget.cicloId)?.ejecuciones||[]).find(e=>String(e.tcId)===String(observationTarget.tcId));
            const currentEstado = targetEjec?.estado || "No ejecutado";
            updateEjecucionEstado(observationTarget.cicloId, observationTarget.tcId, currentEstado, text);
          } else {
            addComment(observationTarget.tc.id, text);
          }
          setObservationTarget(null);
        }} />}
      {viewTc&&!showTcForm&&(
        <TcDetailModal tc={viewTc} onClose={()=>setViewTc(null)}
          onEdit={()=>{setEditTc(viewTc);setViewTc(null);setShowTcForm(true);}}
          onDelete={currentUser && Array.isArray(currentUser.roles) && currentUser.roles.includes("admin") ? ()=>setConfirmDelete({type:"tc",id:viewTc.id}) : undefined}
          onDuplicate={()=>duplicateTC(viewTc)}
          onAddComment={addComment}/>
      )}
      {showIssueForm&&<IssueFormModal initial={editIssue} issueId={editIssue?.id} tests={tests} proj={proj} testIds={tests.map(t=>t.id)} onSave={saveIssue} onClose={()=>{setShowIssueForm(false);setEditIssue(null);}} onDelete={editIssue?()=>{setShowIssueForm(false);setEditIssue(null);deleteIssue(editIssue.id);}:undefined} darkMode={darkMode}/>} 
      {previewImg&&(
        <div onClick={()=>setPreviewImg(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out"}}>
          <img src={previewImg} alt="evidencia" style={{maxWidth:"90vw",maxHeight:"90vh",borderRadius:10,boxShadow:"0 8px 48px #000a",objectFit:"contain"}}/>
          <button onClick={()=>setPreviewImg(null)} style={{position:"absolute",top:20,right:28,background:"transparent",border:"none",color:"#fff",fontSize:28,cursor:"pointer",lineHeight:1}}>✕</button>
        </div>
      )}
      {viewIssue&&!showIssueForm&&(
        <IssueDetailModal issue={viewIssue} onClose={()=>setViewIssue(null)}
          onEdit={()=>{setEditIssue(viewIssue);setViewIssue(null);setShowIssueForm(true);}}
          onDelete={currentUser && Array.isArray(currentUser.roles) && currentUser.roles.includes("admin") ? ()=>setConfirmDelete({type:"issue",id:viewIssue.id}) : undefined}/>
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
            <Btn danger onClick={() => {
              // perform soft delete with undo
              const cd = confirmDelete;
              setConfirmDelete(null);
              if(!cd) return;
              if(cd.type==="project") return softDelete({type:"project",id:cd.id});
              if(cd.type==="tc") return softDelete({type:"tc",id:cd.id,projectId:activeProjectId});
              if(cd.type==="ciclo") return softDelete({type:"ciclo",id:cd.id,projectId:activeProjectId});
              if(cd.type==="issue") return softDelete({type:"issue",id:cd.id,projectId:activeProjectId});
            }}>Sí, eliminar</Btn>
          </div>
        </Modal>
      )}

      <div style={{position:"fixed",right:20,bottom:20,display:"flex",flexDirection:"column",gap:10,zIndex:9999}}>
        {recentlyDeleted.map(r=> (
          <div key={r.key} style={{background:darkMode?"#222":"#fff",border:`1px solid ${DM.cardBorder}`,padding:"10px 12px",borderRadius:8,boxShadow:"0 6px 18px rgba(0,0,0,0.12)",minWidth:240,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
            <div style={{fontSize:13,color:DM.text}}>{r.type==="tc"?`Caso ${r.payload.id} eliminado`:(r.type==="project"?`Proyecto ${r.payload.name} eliminado`:(r.type==="ciclo"?`Ciclo ${r.payload.nombre} eliminado`:`Elemento eliminado`))}</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>undoDelete(r.key)} style={{background:"transparent",border:"none",color:BRAND,cursor:"pointer",fontWeight:800}}>Deshacer</button>
            </div>
          </div>
        ))}
      </div>
    
    </div>
  );
}
