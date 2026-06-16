# Add status selector to issue cards
$file = "src/App.jsx"
$content = Get-Content $file -Raw

# Find and replace the status badge in issue cards with a selector
$oldIssueCard = @'
                          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5,flexShrink:0}}>
                            <Badge label={issue.estado} color={sc.color} bg={sc.bg}/>
                            <span style={{fontSize:10,fontWeight:700,color:sev,background:sev+"15",padding:"2px 8px",borderRadius:6}}>{issue.severidad}</span>
                            {(issue.attachments||[]).length>0&&<span style={{fontSize:11,color:"#aaa"}}>📎{issue.attachments.length}</span>}
                          </div>
'@

$newIssueCard = @'
                          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5,flexShrink:0}}>
                            <select value={issue.estado} onChange={e=>updateIssueStatus(issue.id,e.target.value)} onClick={e=>e.stopPropagation()}
                              style={{border:`1px solid ${sc.color}50`,borderRadius:12,padding:"3px 8px",fontSize:11,fontWeight:700,color:sc.color,background:sc.bg,cursor:"pointer",outline:"none"}}>
                              {Object.keys(issueStatusConfig).map(k=><option key={k} value={k}>{k}</option>)}
                            </select>
                            <span style={{fontSize:10,fontWeight:700,color:sev,background:sev+"15",padding:"2px 8px",borderRadius:6}}>{issue.severidad}</span>
                            {(issue.attachments||[]).length>0&&<span style={{fontSize:11,color:"#aaa"}}>📎{issue.attachments.length}</span>}
                          </div>
'@

$content = $content -replace [regex]::Escape($oldIssueCard), $newIssueCard

Set-Content $file $content -Encoding UTF8
Write-Host "✅ Issue status selector added!"
