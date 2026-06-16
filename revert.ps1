$file = "src/App.jsx.backup"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# 1. Remove new state variables for issue filtering
$content = $content -replace '  const \[searchIssue,setSearchIssue\]=useState\(""\);' + "`n" + '  const \[filterIssueModulo,setFilterIssueModulo\]=useState\("Todos"\);' + "`n" + '  const \[filterIssueSeveridad,setFilterIssueSeveridad\]=useState\("Todos"\);' + "`n" + '  const \[darkMode', '  const [darkMode'

# 2. Remove keyboard shortcuts useEffect
$old_shortcuts = @'
  // keyboard shortcuts
  useEffect(()=>{
    const handleKeyDown=(e)=>{
      if(e.key==="Escape"){setShowTcForm(false);setShowIssueForm(false);setViewTc(null);setViewIssue(null);setConfirmDelete(null);}
    };
    window.addEventListener("keydown",handleKeyDown);
    return ()=>window.removeEventListener("keydown",handleKeyDown);
  },[]);
'@
$content = $content -replace [regex]::Escape($old_shortcuts) + "`n", ""

# 3. Revert EMPTY_ISSUE without historial
$content = $content -replace 'const EMPTY_ISSUE = \{ testId:"",escenario:"",formulario:"",observacion:"",modulo:"",estado:"Open",severidad:"Medium",prioridad:"Medium",fechaCreacion:"",attachments:\[\],historial:\[\] \};', 'const EMPTY_ISSUE = { testId:"",escenario:"",formulario:"",observacion:"",modulo:"",estado:"Open",severidad:"Medium",prioridad:"Medium",fechaCreacion:"",attachments:[] };'

[System.IO.File]::WriteAllText("src/App.jsx.revert", $content, [System.Text.Encoding]::UTF8)
Write-Host "Step 1 done"
