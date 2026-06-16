# Add enhanced issue statistics to Dashboard
$file = "src/App.jsx"
$content = Get-Content $file -Raw

# First, add helper function to calculate issue stats by severity and module
$issueStatsHelper = @'
  const issueStatsBySeverity=useMemo(()=>{
    const stats={Critical:0,High:0,Medium:0,Low:0};
    issues.forEach(i=>stats[i.severidad]++);
    return stats;
  },[issues]);

  const issueStatsByModule=useMemo(()=>{
    const stats={};
    issues.forEach(i=>{
      const mod=i.modulo||"Sin módulo";
      stats[mod]=(stats[mod]||0)+1;
    });
    return stats;
  },[issues]);

  const openIssuesDays=useMemo(()=>{
    const now=new Date();
    let total=0;
    issues.filter(i=>i.estado==="Open").forEach(i=>{
      try{
        const date=new Date(i.fechaCreacion.split("/").reverse().join("-"));
        const days=Math.floor((now-date)/(1000*60*60*24));
        total+=days;
      }catch{}
    });
    return issues.filter(i=>i.estado==="Open").length?Math.round(total/issues.filter(i=>i.estado==="Open").length):0;
  },[issues]);
'@

# Find where to insert it - after the moduleStats useMemo
$searchStr = "const tabs=[\{id:\"dashboard\",label:\"📊 Dashboard\"\}"
if($content -contains $searchStr) {
  $content = $content -replace [regex]::Escape("  const tabs=[{id:\"dashboard\",label:\"📊 Dashboard\"},"), $issueStatsHelper + "`n  const tabs=[{id:`"dashboard`",label:`"📊 Dashboard`"},"
}

Set-Content $file $content -Encoding UTF8
Write-Host "✅ Issue statistics helpers added!"
