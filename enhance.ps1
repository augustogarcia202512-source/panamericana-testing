$file = "src/App.jsx"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# Add improved issue statistics section after the existing issues summary
# Search for the end of current issues summary section and add new one

$findStr = '<div style={{background:DM.card,borderRadius:12,padding:20,border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000000a"}}>
                  <div style={{fontSize:13,fontWeight:700,color:DM.text,marginBottom:14}}>Resumen de Issues</div>
                  <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                    {[{label:"Open",v:issueStats.open,c:"#E74C3C"},{label:"In Progress",v:issueStats.inProg,c:"#F39C12"},{label:"Closed",v:issueStats.closed,c:"#27AE60"},{label:"Blocked",v:issueStats.blocked,c:"#8E44AD"}].map(s=>(
                      <div key={s.label} style={{display:"flex",alignItems:"center",gap:8,background:s.c+"10",border:`1px solid ${s.c}30`,borderRadius:8,padding:"8px 16px"}}>
                        <div style={{width:10,height:10,borderRadius:"50%",background:s.c}}/><span style={{fontSize:12,color:"#555"}}>{s.label}</span><span style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</span>
                      </div>
                    ))}
                  </div>
                </div>'

$replaceWith = '<div style={{background:DM.card,borderRadius:12,padding:20,border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000000a"}}>
                  <div style={{fontSize:13,fontWeight:700,color:DM.text,marginBottom:14}}>Resumen de Issues</div>
                  <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                    {[{label:"Open",v:issueStats.open,c:"#E74C3C"},{label:"In Progress",v:issueStats.inProg,c:"#F39C12"},{label:"Closed",v:issueStats.closed,c:"#27AE60"},{label:"Blocked",v:issueStats.blocked,c:"#8E44AD"}].map(s=>(
                      <div key={s.label} style={{display:"flex",alignItems:"center",gap:8,background:s.c+"10",border:`1px solid ${s.c}30`,borderRadius:8,padding:"8px 16px"}}>
                        <div style={{width:10,height:10,borderRadius:"50%",background:s.c}}/><span style={{fontSize:12,color:"#555"}}>{s.label}</span><span style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Severity breakdown */}
                <div style={{background:DM.card,borderRadius:12,padding:20,border:`1px solid ${DM.cardBorder}`,boxShadow:"0 1px 8px #0000000a"}}>
                  <div style={{fontSize:13,fontWeight:700,color:DM.text,marginBottom:14}}>Issues por Severidad</div>
                  <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                    {[{l:"Critical",c:"#C0392B"},{l:"High",c:"#E74C3C"},{l:"Medium",c:"#F39C12"},{l:"Low",c:"#27AE60"}].map(s=>{const v=issues.filter(i=>i.severidad===s.l).length;return(<div key={s.l} style={{background:DM.tableRow0,borderRadius:10,padding:"12px 16px",boxShadow:"0 1px 8px #0000000a",border:`1px solid ${DM.cardBorder}`,flex:1,minWidth:100}}>
                      <div style={{fontSize:10,color:DM.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{s.l}</div>
                      <div style={{fontSize:24,fontWeight:800,color:s.c,lineHeight:1.1}}>{v}</div>
                      {issues.length>0&&(<div style={{marginTop:6,height:2,background:"#f0f0f0",borderRadius:2}}><div style={{width:`${issues.length?Math.round((v/issues.length)*100):0}%`,height:"100%",background:s.c,borderRadius:2}}/></div>)}
                    </div>);})}
                  </div>
                </div>'

$content = $content.Replace($findStr, $replaceWith)
[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
Write-Host "OK: Enhanced issue statistics added!"
