$file = "src/App.jsx.backup"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# 1. Remove searchIssue, filterIssueModulo, filterIssueSeveridad states
$content = $content -replace '\s+const \[searchIssue,setSearchIssue\]=useState\(\"\"\);\s+', ''
$content = $content -replace '\s+const \[filterIssueModulo,setFilterIssueModulo\]=useState\(\"Todos\"\);\s+', ''
$content = $content -replace '\s+const \[filterIssueSeveridad,setFilterIssueSeveridad\]=useState\(\"Todos\"\);\s+', ''

# 2. Revert keyboard shortcuts - remove the useEffect
$content = $content -replace '  // keyboard shortcuts\s+useEffect\(\(\)=>\{\s+const handleKeyDown=\(e\)=>\{\s+if\(e\.key===\"Escape\"\)\{setShowTcForm\(false\);setShowIssueForm\(false\);setViewTc\(null\);setViewIssue\(null\);setConfirmDelete\(null\);\}\s+\};\s+window\.addEventListener\(\"keydown\",handleKeyDown\);\s+return \(\)=>window\.removeEventListener\(\"keydown\",handleKeyDown\);\s+\}\,\[\]\);\s+', "`n", [System.Text.RegexOptions]::Singleline)

# 3. Revert EMPTY_ISSUE to original (without historial)
$content = $content -replace 'const EMPTY_ISSUE = \{ testId:"",escenario:"",formulario:"",observacion:"",modulo:"",estado:"Open",severidad:"Medium",prioridad:"Medium",fechaCreacion:"",attachments:\[\],historial:\[\] \};', 'const EMPTY_ISSUE = { testId:"",escenario:"",formulario:"",observacion:"",modulo:"",estado:"Open",severidad:"Medium",prioridad:"Medium",fechaCreacion:"",attachments:[] };'

# 4. Revert filteredIssues to simple filter
$content = $content -replace '  // Get unique modules for issues\s+const issueModulos=useMemo\(\(\)=>\{\s+const mods=new Set\(issues\.map\(i=>i\.modulo\)\.filter\(Boolean\)\);\s+return Array\.from\(mods\)\.sort\(\);\s+\},\[issues\]\);\s+const filteredIssues=useMemo\(\(\)=>issues\.filter\(i=>\{\s+if\(filterIssueEstado!==""Todos""&&i\.estado!==filterIssueEstado\)return false;\s+if\(filterIssueModulo!==""Todos""&&i\.modulo!==filterIssueModulo\)return false;\s+if\(filterIssueSeveridad!==""Todos""&&i\.severidad!==filterIssueSeveridad\)return false;\s+if\(searchIssue\)\{\s+const q=searchIssue\.toLowerCase\(\);\s+return i\.escenario\.toLowerCase\(\)\.includes\(q\)\|\|i\.observacion\.toLowerCase\(\)\.includes\(q\)\|\|i\.formulario\.toLowerCase\(\)\.includes\(q\)\|\|i\.modulo\.toLowerCase\(\)\.includes\(q\);\s+\}\s+return true;\s+\},\[issues,filterIssueEstado,filterIssueModulo,filterIssueSeveridad,searchIssue\]\);', '  const filteredIssues=useMemo(()=>issues.filter(i=>filterIssueEstado==="Todos"||i.estado===filterIssueEstado),[issues,filterIssueEstado]);', [System.Text.RegexOptions]::Singleline)

# 5. Remove updateIssueStatus and removeIssueAttachment functions
$content = $content -replace '  function updateIssueStatus\(id,estado\)\{\s+setProjects\(ps=>ps\.map\(p=>\{\s+if\(p\.id!==activeProjectId\)return p;\s+return\{\.\.\.p,issues:p\.issues\.map\(i=>\{\s+if\(i\.id!==id\)return i;\s+const entry=\{fecha:today\(\),de:i\.estado,a:estado,nota:""""\};\s+return\{\.\.\.i,estado,historial:\[\.\.\..*?\[\]\],entry\]:\(i\.historial\|\|\[\]\)\};\s+\}\}\s+\}\);\s+\}\)\);\s+\}\s+function removeIssueAttachment\(issueId,fileName\)\{\s+setProjects\(ps=>ps\.map\(p=>\{\s+if\(p\.id!==activeProjectId\)return p;\s+return\{\.\.\.p,issues:p\.issues\.map\(i=>\{\s+if\(i\.id!==issueId\)return i;\s+return\{\.\.\.i,attachments:\(i\.attachments\|\|\[\]\)\.filter\(a=>a\.name!==fileName\)\};\s+\}\}\s+\}\);\s+if\(viewIssue\?\.id===issueId\)\{\s+setViewIssue\(prev=>\(\{\.\.\.prev,attachments:\(prev\.attachments\|\|\[\]\)\.filter\(a=>a\.name!==fileName\)\}\)\);\s+\}\s+\}', '', [System.Text.RegexOptions]::Singleline)

Set-Content "src/App.jsx.revert" $content -Encoding UTF8
Write-Host "Revert preparation done"
