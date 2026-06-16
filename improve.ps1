# Add improvements to App.jsx
$file = "src/App.jsx"
$content = Get-Content $file -Raw

# 1. Add historial to EMPTY_ISSUE
$content = $content -replace 'const EMPTY_ISSUE = \{ testId:"",escenario:"",formulario:"",observacion:"",modulo:"",estado:"Open",severidad:"Medium",prioridad:"Medium",fechaCreacion:"",attachments:\[\] \};', 'const EMPTY_ISSUE = { testId:"",escenario:"",formulario:"",observacion:"",modulo:"",estado:"Open",severidad:"Medium",prioridad:"Medium",fechaCreacion:"",attachments:[],historial:[] };'

# 2. Add new functions after saveIssue function
$saveIssueFunc = @'
  function saveIssue(form){
    setProjects(ps=>ps.map(p=>{
      if(p.id!==activeProjectId)return p;
      if(editIssue){return{...p,issues:p.issues.map(i=>i.id===editIssue.id?{...i,...form}:i)};}
      else{const newId=(p.issues.length?Math.max(...p.issues.map(i=>i.id)):0)+1;return{...p,issues:[...p.issues,{id:newId,...form,historial:[{fecha:today(),de:"—",a:form.estado,nota:"Creado"}]}]};}
    }));
    setShowIssueForm(false);setEditIssue(null);setViewIssue(null);
  }
'@

$updateIssueFuncs = @'
  function saveIssue(form){
    setProjects(ps=>ps.map(p=>{
      if(p.id!==activeProjectId)return p;
      if(editIssue){return{...p,issues:p.issues.map(i=>i.id===editIssue.id?{...i,...form}:i)};}
      else{const newId=(p.issues.length?Math.max(...p.issues.map(i=>i.id)):0)+1;return{...p,issues:[...p.issues,{id:newId,...form,historial:[{fecha:today(),de:"—",a:form.estado,nota:"Creado"}]}]};}
    }));
    setShowIssueForm(false);setEditIssue(null);setViewIssue(null);
  }
  function updateIssueStatus(id,estado){
    setProjects(ps=>ps.map(p=>{
      if(p.id!==activeProjectId)return p;
      return{...p,issues:p.issues.map(i=>{
        if(i.id!==id)return i;
        const entry={fecha:today(),de:i.estado,a:estado,nota:""};
        return{...i,estado,historial:[...(i.historial||[]),entry]};
      })};
    }));
  }
  function removeIssueAttachment(issueId,fileName){
    setProjects(ps=>ps.map(p=>{
      if(p.id!==activeProjectId)return p;
      return{...p,issues:p.issues.map(i=>{
        if(i.id!==issueId)return i;
        return{...i,attachments:(i.attachments||[]).filter(a=>a.name!==fileName)};
      })};
    }));
    if(viewIssue?.id===issueId){
      setViewIssue(prev=>({...prev,attachments:(prev.attachments||[]).filter(a=>a.name!==fileName)}));
    }
  }
'@

$content = $content -replace [regex]::Escape($saveIssueFunc), $updateIssueFuncs

Set-Content $file $content -Encoding UTF8
Write-Host "✅ All improvements added!"
