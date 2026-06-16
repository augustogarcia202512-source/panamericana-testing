# Update Issues UI with search and filters
$file = "src/App.jsx"
$content = Get-Content $file -Raw

# Replace the Issues section UI
$oldUI = @'
            {/* ── ISSUES ── */}
            {tab==="issues"&&(
              <div style={{display:"flex",flexDirection:"column",gap:18}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                  <div>
                    <h2 style={{margin:0,fontSize:20,fontWeight:800,color:DM.text}}>Issue List</h2>
                    <p style={{margin:"3px 0 0",color:DM.sub,fontSize:12}}>{filteredIssues.length} issues registrados · ⠿ arrastra para reordenar</p>
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
                    <Btn onClick={()=>{setEditIssue(null);setShowIssueForm(true);}}>+ Nuevo Issue</Btn>
                    <Btn variant="ghost" small onClick={()=>exportIssuesToCSV(proj)}>⬇ CSV</Btn>
                    <Btn variant="ghost" small onClick={()=>exportIssuesPDF(proj,filteredIssues,filterIssueEstado)}>📄 PDF</Btn>
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:9}}>
'@

$newUI = @'
            {/* ── ISSUES ── */}
            {tab==="issues"&&(
              <div style={{display:"flex",flexDirection:"column",gap:18}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                  <div>
                    <h2 style={{margin:0,fontSize:20,fontWeight:800,color:DM.text}}>Issue List</h2>
                    <p style={{margin:"3px 0 0",color:DM.sub,fontSize:12}}>{filteredIssues.length} issues · ⠿ arrastra para reordenar</p>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    {[{l:"Open",v:issueStats.open,c:"#E74C3C"},{l:"In Progress",v:issueStats.inProg,c:"#F39C12"},{l:"Closed",v:issueStats.closed,c:"#27AE60"}].map(s=>(
                      <div key={s.l} style={{background:s.c+"15",border:`1px solid ${s.c}30`,borderRadius:7,padding:"4px 10px",fontSize:11,display:"flex",gap:5}}>
                        <span style={{color:s.c,fontWeight:800}}>{s.v}</span><span style={{color:"#666"}}>{s.l}</span>
                      </div>
                    ))}
                    <Btn onClick={()=>{setEditIssue(null);setShowIssueForm(true);}}>+ Nuevo Issue</Btn>
                    <Btn variant="ghost" small onClick={()=>exportIssuesToCSV(proj)}>⬇ CSV</Btn>
                    <Btn variant="ghost" small onClick={()=>exportIssuesPDF(proj,filteredIssues,filterIssueEstado)}>📄 PDF</Btn>
                  </div>
                </div>
                {/* Filtros de Issues */}
                <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                  <input placeholder="🔍 Buscar issues..." value={searchIssue} onChange={e=>setSearchIssue(e.target.value)} style={{...inputStyle,width:180,padding:"7px 12px",background:darkMode?"#2C2C2E":"#fff",color:DM.text,border:darkMode?"1px solid #444":"1px solid #e0e0e0"}}/>
                  <select value={filterIssueEstado} onChange={e=>setFilterIssueEstado(e.target.value)} style={{...inputStyle,width:140,padding:"7px 12px",background:darkMode?"#2C2C2E":"#fff",color:DM.text,border:darkMode?"1px solid #444":"1px solid #e0e0e0"}}>
                    <option value="Todos">Todos los estados</option>
                    {Object.keys(issueStatusConfig).map(k=><option key={k} value={k}>{k}</option>)}
                  </select>
                  <select value={filterIssueModulo} onChange={e=>setFilterIssueModulo(e.target.value)} style={{...inputStyle,width:140,padding:"7px 12px",background:darkMode?"#2C2C2E":"#fff",color:DM.text,border:darkMode?"1px solid #444":"1px solid #e0e0e0"}}>
                    <option value="Todos">Todos los módulos</option>
                    {issueModulos.map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                  <select value={filterIssueSeveridad} onChange={e=>setFilterIssueSeveridad(e.target.value)} style={{...inputStyle,width:130,padding:"7px 12px",background:darkMode?"#2C2C2E":"#fff",color:DM.text,border:darkMode?"1px solid #444":"1px solid #e0e0e0"}}>
                    <option value="Todos">Todas las severidades</option>
                    {["Critical","High","Medium","Low"].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                  {(searchIssue||filterIssueEstado!=="Todos"||filterIssueModulo!=="Todos"||filterIssueSeveridad!=="Todos")&&<button onClick={()=>{setSearchIssue("");setFilterIssueEstado("Todos");setFilterIssueModulo("Todos");setFilterIssueSeveridad("Todos");}} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"#aaa",padding:"5px 8px"}}>✕ Limpiar filtros</button>}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:9}}>
'@

$content = $content -replace [regex]::Escape($oldUI), $newUI

Set-Content $file $content -Encoding UTF8
Write-Host "✅ Issues UI updated with search and filters!"
