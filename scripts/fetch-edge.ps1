param(
  [Parameter(Mandatory = $true)]
  [string]$Url,

  [Parameter(Mandatory = $true)]
  [string]$OutputPath,

  [Parameter(Mandatory = $true)]
  [string]$ProfilePath
)

$edgeCandidates = @(
  'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
  'C:\Program Files\Microsoft\Edge\Application\msedge.exe'
)

$edge = $edgeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $edge) {
  throw 'Microsoft Edge não encontrado. Use um acesso de rede que permita a API do FMI.'
}

$outputDirectory = Split-Path -Parent $OutputPath
New-Item -ItemType Directory -Force -Path $outputDirectory, $ProfilePath | Out-Null

$errorPath = "$OutputPath.stderr"
$arguments = @(
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--disable-extensions',
  "--user-data-dir=$ProfilePath",
  "--disk-cache-dir=$ProfilePath\cache",
  '--dump-dom',
  $Url
)

$process = Start-Process `
  -FilePath $edge `
  -ArgumentList $arguments `
  -WindowStyle Hidden `
  -Wait `
  -PassThru `
  -RedirectStandardOutput $OutputPath `
  -RedirectStandardError $errorPath

if ($process.ExitCode -ne 0) {
  $details = if (Test-Path -LiteralPath $errorPath) { Get-Content -LiteralPath $errorPath -Raw } else { '' }
  throw "Falha ao consultar $Url com Edge. Código $($process.ExitCode). $details"
}

if (-not (Test-Path -LiteralPath $OutputPath) -or (Get-Item -LiteralPath $OutputPath).Length -eq 0) {
  throw "A consulta ao FMI não retornou conteúdo: $Url"
}
