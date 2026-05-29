param(
  [string]$BaseUrl = "http://localhost:3000",
  [switch]$SkipSignup,
  [string]$EmailA = "",
  [string]$EmailB = "",
  [string]$Password = "Passw0rd!123!",
  [string]$OutputPath = "scripts/production-validation-report.json",
  [switch]$FollowRedirect,
  [switch]$UseAdminOnRateLimit
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$cookieA = Join-Path $PSScriptRoot "cookieA.txt"
$cookieB = Join-Path $PSScriptRoot "cookieB.txt"

if (Test-Path $cookieA) { Remove-Item $cookieA -Force }
if (Test-Path $cookieB) { Remove-Item $cookieB -Force }

if ([string]::IsNullOrWhiteSpace($EmailA)) {
  $EmailA = "rls_a_{0}@qq.com" -f (Get-Date -Format "yyyyMMddHHmmss")
}
if ([string]::IsNullOrWhiteSpace($EmailB)) {
  $EmailB = "rls_b_{0}@qq.com" -f (Get-Date -Format "yyyyMMddHHmmss")
}

$results = [System.Collections.Generic.List[object]]::new()

function Add-Result {
  param(
    [string]$Name,
    [bool]$Passed,
    [string]$Detail,
    [int]$StatusCode = 0
  )
  $results.Add([pscustomobject]@{
      name       = $Name
      passed     = $Passed
      statusCode = $StatusCode
      detail     = $Detail
    })
}

function To-JsonBody {
  param([hashtable]$Data)
  return ($Data | ConvertTo-Json -Compress)
}

function Get-EnvValueFromDotEnv {
  param(
    [string]$Key,
    [string]$DotEnvPath
  )
  if (-not (Test-Path $DotEnvPath)) { return $null }
  $line = Get-Content $DotEnvPath | Where-Object { $_ -match "^$Key=" } | Select-Object -Last 1
  if (-not $line) { return $null }
  return ($line -replace "^$Key=", "").Trim()
}

function Create-UserByAdmin {
  param(
    [string]$SupabaseUrl,
    [string]$ServiceRoleKey,
    [string]$Email,
    [string]$UserPassword
  )

  $adminUrl = "$SupabaseUrl/auth/v1/admin/users"
  $payload = To-JsonBody @{
    email = $Email
    password = $UserPassword
    email_confirm = $true
  }

  try {
    $response = Invoke-RestMethod -Method Post -Uri $adminUrl -Headers @{
      apikey         = $ServiceRoleKey
      Authorization  = "Bearer $ServiceRoleKey"
      "Content-Type" = "application/json"
    } -Body $payload
    return [pscustomobject]@{ ok = $true; message = "created"; data = $response }
  }
  catch {
    $message = $_.Exception.Message
    if ($message -match "User already registered|already exists|duplicate key") {
      return [pscustomobject]@{ ok = $true; message = "exists"; data = $null }
    }
    return [pscustomobject]@{ ok = $false; message = $message; data = $null }
  }
}

function Invoke-Api {
  param(
    [string]$Method,
    [string]$Url,
    [string]$CookieIn = "",
    [string]$CookieOut = "",
    [string]$JsonBody = ""
  )

  $tempBody = [System.IO.Path]::GetTempFileName()
  $tempHdr = [System.IO.Path]::GetTempFileName()
  $tempJson = $null
  try {
    $args = @("-sS", "-X", $Method, "-D", $tempHdr, "-o", $tempBody, $Url)
    if ($FollowRedirect) {
      $args += "-L"
    }
    if (-not [string]::IsNullOrWhiteSpace($CookieIn)) {
      $args += @("-b", $CookieIn)
    }
    if (-not [string]::IsNullOrWhiteSpace($CookieOut)) {
      $args += @("-c", $CookieOut)
    }
    if (-not [string]::IsNullOrWhiteSpace($JsonBody)) {
      $tempJson = [System.IO.Path]::GetTempFileName()
      [System.IO.File]::WriteAllText($tempJson, $JsonBody, [System.Text.UTF8Encoding]::new($false))
      $args += @("-H", "Content-Type: application/json", "--data-binary", "@$tempJson")
    }

    & curl.exe @args | Out-Null

    $headerRaw = Get-Content -Raw $tempHdr
    $statusLine = ($headerRaw -split "`r?`n" | Where-Object { $_ -match "^HTTP/" } | Select-Object -Last 1)
    $statusCode = if ($statusLine -match "HTTP/\S+\s+(\d{3})") { [int]$matches[1] } else { 0 }
    $bodyRaw = Get-Content -Raw $tempBody
    $locationLine = ($headerRaw -split "`r?`n" | Where-Object { $_ -match "^(?i)location:\s*" } | Select-Object -Last 1)
    $location = if ($locationLine -match "^(?i)location:\s*(.+)$") { $matches[1].Trim() } else { "" }
    $isApiPath = $Url -match "/api/"
    $isRedirectStatus = $statusCode -in 301, 302, 307, 308
    $redirectToAuth = $isApiPath -and $isRedirectStatus -and ($location -match "/auth")
    $effectiveStatus = if ($redirectToAuth) { 401 } else { $statusCode }

    $json = $null
    try { $json = $bodyRaw | ConvertFrom-Json } catch {}

    return [pscustomobject]@{
      statusCode      = $statusCode
      effectiveStatus = $effectiveStatus
      location        = $location
      redirectToAuth  = $redirectToAuth
      bodyRaw         = $bodyRaw
      json            = $json
      headerRaw       = $headerRaw
    }
  }
  finally {
    if ($tempJson -and (Test-Path $tempJson)) { Remove-Item $tempJson -Force }
    if (Test-Path $tempBody) { Remove-Item $tempBody -Force }
    if (Test-Path $tempHdr) { Remove-Item $tempHdr -Force }
  }
}

function Get-ArrayCount {
  param($JsonNode)
  if ($null -eq $JsonNode) { return 0 }
  if ($JsonNode -is [System.Array]) { return $JsonNode.Count }
  if ($JsonNode -is [System.Collections.IEnumerable] -and -not ($JsonNode -is [string])) {
    return @($JsonNode).Count
  }
  return 0
}

$dotEnvPath = Join-Path (Get-Location) ".env.local"
$supabaseUrl = Get-EnvValueFromDotEnv -Key "NEXT_PUBLIC_SUPABASE_URL" -DotEnvPath $dotEnvPath
$serviceRoleKey = Get-EnvValueFromDotEnv -Key "SUPABASE_SERVICE_ROLE_KEY" -DotEnvPath $dotEnvPath

Write-Host "== Production Validation Start ==" -ForegroundColor Cyan
Write-Host "BASE: $BaseUrl"
Write-Host "A: $EmailA"
Write-Host "B: $EmailB"
Write-Host ("FOLLOW_REDIRECT: {0}" -f $FollowRedirect.IsPresent)
Write-Host ("USE_ADMIN_ON_RATE_LIMIT: {0}" -f $UseAdminOnRateLimit.IsPresent)

if (-not $SkipSignup) {
  $signupA = Invoke-Api -Method "POST" -Url "$BaseUrl/api/auth/signup" -CookieOut $cookieA -JsonBody (To-JsonBody @{ email = $EmailA; password = $Password })
  $signupAPassed = $signupA.effectiveStatus -in 200, 201
  if (
    -not $signupAPassed -and
    $UseAdminOnRateLimit -and
    $signupA.bodyRaw -match "email rate limit exceeded" -and
    $supabaseUrl -and
    $serviceRoleKey
  ) {
    $adminCreateA = Create-UserByAdmin -SupabaseUrl $supabaseUrl -ServiceRoleKey $serviceRoleKey -Email $EmailA -UserPassword $Password
    $signupAPassed = $adminCreateA.ok
    Add-Result -Name "auth.signup.A.admin-fallback" -Passed $adminCreateA.ok -StatusCode 200 -Detail $adminCreateA.message
  }
  Add-Result -Name "auth.signup.A" -Passed $signupAPassed -StatusCode $signupA.statusCode -Detail $signupA.bodyRaw

  $signupB = Invoke-Api -Method "POST" -Url "$BaseUrl/api/auth/signup" -CookieOut $cookieB -JsonBody (To-JsonBody @{ email = $EmailB; password = $Password })
  $signupBPassed = $signupB.effectiveStatus -in 200, 201
  if (
    -not $signupBPassed -and
    $UseAdminOnRateLimit -and
    $signupB.bodyRaw -match "email rate limit exceeded" -and
    $supabaseUrl -and
    $serviceRoleKey
  ) {
    $adminCreateB = Create-UserByAdmin -SupabaseUrl $supabaseUrl -ServiceRoleKey $serviceRoleKey -Email $EmailB -UserPassword $Password
    $signupBPassed = $adminCreateB.ok
    Add-Result -Name "auth.signup.B.admin-fallback" -Passed $adminCreateB.ok -StatusCode 200 -Detail $adminCreateB.message
  }
  Add-Result -Name "auth.signup.B" -Passed $signupBPassed -StatusCode $signupB.statusCode -Detail $signupB.bodyRaw
}

$loginA = Invoke-Api -Method "POST" -Url "$BaseUrl/api/auth/login" -CookieOut $cookieA -JsonBody (To-JsonBody @{ email = $EmailA; password = $Password })
Add-Result -Name "auth.login.A" -Passed ($loginA.effectiveStatus -eq 200) -StatusCode $loginA.statusCode -Detail $loginA.bodyRaw

$loginB = Invoke-Api -Method "POST" -Url "$BaseUrl/api/auth/login" -CookieOut $cookieB -JsonBody (To-JsonBody @{ email = $EmailB; password = $Password })
Add-Result -Name "auth.login.B" -Passed ($loginB.effectiveStatus -eq 200) -StatusCode $loginB.statusCode -Detail $loginB.bodyRaw

$sessionA = Invoke-Api -Method "GET" -Url "$BaseUrl/api/auth/session" -CookieIn $cookieA
$sessionB = Invoke-Api -Method "GET" -Url "$BaseUrl/api/auth/session" -CookieIn $cookieB
Add-Result -Name "auth.session.A" -Passed ($sessionA.effectiveStatus -eq 200) -StatusCode $sessionA.statusCode -Detail $sessionA.bodyRaw
Add-Result -Name "auth.session.B" -Passed ($sessionB.effectiveStatus -eq 200) -StatusCode $sessionB.statusCode -Detail $sessionB.bodyRaw

$usersA = Invoke-Api -Method "GET" -Url "$BaseUrl/api/users" -CookieIn $cookieA
$usersB = Invoke-Api -Method "GET" -Url "$BaseUrl/api/users" -CookieIn $cookieB
$petsA = Invoke-Api -Method "GET" -Url "$BaseUrl/api/pets" -CookieIn $cookieA
$petsB = Invoke-Api -Method "GET" -Url "$BaseUrl/api/pets" -CookieIn $cookieB
$tasksA = Invoke-Api -Method "GET" -Url "$BaseUrl/api/tasks" -CookieIn $cookieA
$tasksB = Invoke-Api -Method "GET" -Url "$BaseUrl/api/tasks" -CookieIn $cookieB
$booksA = Invoke-Api -Method "GET" -Url "$BaseUrl/api/books" -CookieIn $cookieA

Add-Result -Name "api.users.A" -Passed ($usersA.effectiveStatus -eq 200) -StatusCode $usersA.statusCode -Detail $usersA.bodyRaw
Add-Result -Name "api.users.B" -Passed ($usersB.effectiveStatus -eq 200) -StatusCode $usersB.statusCode -Detail $usersB.bodyRaw
Add-Result -Name "api.pets.A" -Passed ($petsA.effectiveStatus -eq 200) -StatusCode $petsA.statusCode -Detail $petsA.bodyRaw
Add-Result -Name "api.pets.B" -Passed ($petsB.effectiveStatus -eq 200) -StatusCode $petsB.statusCode -Detail $petsB.bodyRaw
Add-Result -Name "api.tasks.A" -Passed ($tasksA.effectiveStatus -eq 200) -StatusCode $tasksA.statusCode -Detail $tasksA.bodyRaw
Add-Result -Name "api.tasks.B" -Passed ($tasksB.effectiveStatus -eq 200) -StatusCode $tasksB.statusCode -Detail $tasksB.bodyRaw
Add-Result -Name "api.books.A" -Passed ($booksA.effectiveStatus -eq 200) -StatusCode $booksA.statusCode -Detail $booksA.bodyRaw

$unauthUsers = Invoke-Api -Method "GET" -Url "$BaseUrl/api/users"
$unauthPets = Invoke-Api -Method "GET" -Url "$BaseUrl/api/pets"
$unauthTasks = Invoke-Api -Method "GET" -Url "$BaseUrl/api/tasks"
Add-Result -Name "unauth.users" -Passed ($unauthUsers.effectiveStatus -eq 401) -StatusCode $unauthUsers.statusCode -Detail $unauthUsers.bodyRaw
Add-Result -Name "unauth.pets" -Passed ($unauthPets.effectiveStatus -eq 401) -StatusCode $unauthPets.statusCode -Detail $unauthPets.bodyRaw
Add-Result -Name "unauth.tasks" -Passed ($unauthTasks.effectiveStatus -eq 401) -StatusCode $unauthTasks.statusCode -Detail $unauthTasks.bodyRaw

$petAId = $null
$petBId = $null
$taskAId = $null
$taskBId = $null
$bookId = $null

if ($petsA.json -and $petsA.json.data) {
  $petAId = @($petsA.json.data | ForEach-Object { $_.id; $_.pet_id } | Where-Object { $_ })[0]
}
if ($petsB.json -and $petsB.json.data) {
  $petBId = @($petsB.json.data | ForEach-Object { $_.id; $_.pet_id } | Where-Object { $_ })[0]
}
if ($tasksA.json -and $tasksA.json.data) {
  $taskAId = @($tasksA.json.data | ForEach-Object { $_.id; $_.task_id } | Where-Object { $_ })[0]
}
if ($tasksB.json -and $tasksB.json.data) {
  $taskBId = @($tasksB.json.data | ForEach-Object { $_.id; $_.task_id } | Where-Object { $_ })[0]
}
if ($booksA.json -and $booksA.json.data) {
  $bookId = @($booksA.json.data | ForEach-Object { $_.id; $_.book_id } | Where-Object { $_ })[0]
}

if ($petAId -and $bookId) {
  $readingA = Invoke-Api -Method "POST" -Url "$BaseUrl/api/reading/complete" -CookieIn $cookieA -JsonBody (To-JsonBody @{ petId = $petAId; bookId = $bookId; experienceGain = 20; petExpGain = 12; readingProgress = 100 })
  Add-Result -Name "biz.reading.complete.A" -Passed ($readingA.effectiveStatus -eq 200) -StatusCode $readingA.statusCode -Detail $readingA.bodyRaw
} else {
  Add-Result -Name "biz.reading.complete.A" -Passed $false -StatusCode 0 -Detail "Skipped: missing A pet or book id."
}

if ($taskAId -and $petAId) {
  $claimPayloadA = To-JsonBody @{ missionId = $taskAId; petId = $petAId }
  $claimA1 = Invoke-Api -Method "POST" -Url "$BaseUrl/api/tasks/claim" -CookieIn $cookieA -JsonBody $claimPayloadA
  $claimA2 = Invoke-Api -Method "POST" -Url "$BaseUrl/api/tasks/claim" -CookieIn $cookieA -JsonBody $claimPayloadA
  $idempotentPass = ($claimA2.effectiveStatus -in 409, 422)
  Add-Result -Name "biz.tasks.claim.A.first" -Passed ($claimA1.effectiveStatus -in 200, 409, 422) -StatusCode $claimA1.statusCode -Detail $claimA1.bodyRaw
  Add-Result -Name "biz.tasks.claim.A.idempotent" -Passed $idempotentPass -StatusCode $claimA2.statusCode -Detail $claimA2.bodyRaw
} else {
  Add-Result -Name "biz.tasks.claim.A.first" -Passed $false -StatusCode 0 -Detail "Skipped: missing A task or pet id."
  Add-Result -Name "biz.tasks.claim.A.idempotent" -Passed $false -StatusCode 0 -Detail "Skipped: missing A task or pet id."
}

if ($petBId -and $bookId) {
  $crossRead = Invoke-Api -Method "POST" -Url "$BaseUrl/api/reading/complete" -CookieIn $cookieA -JsonBody (To-JsonBody @{ petId = $petBId; bookId = $bookId; experienceGain = 20; petExpGain = 12; readingProgress = 100 })
  Add-Result -Name "rls.cross.reading.A->B" -Passed ($crossRead.effectiveStatus -in 403, 404) -StatusCode $crossRead.statusCode -Detail $crossRead.bodyRaw
} else {
  Add-Result -Name "rls.cross.reading.A->B" -Passed $false -StatusCode 0 -Detail "Skipped: missing B pet or book id."
}

if ($taskBId -and $petBId) {
  $crossClaim = Invoke-Api -Method "POST" -Url "$BaseUrl/api/tasks/claim" -CookieIn $cookieA -JsonBody (To-JsonBody @{ missionId = $taskBId; petId = $petBId })
  Add-Result -Name "rls.cross.claim.A->B" -Passed ($crossClaim.effectiveStatus -in 403, 404, 409, 422) -StatusCode $crossClaim.statusCode -Detail $crossClaim.bodyRaw
} else {
  Add-Result -Name "rls.cross.claim.A->B" -Passed $false -StatusCode 0 -Detail "Skipped: missing B task or pet id."
}

$logoutA = Invoke-Api -Method "POST" -Url "$BaseUrl/api/auth/logout" -CookieIn $cookieA -CookieOut $cookieA
Add-Result -Name "auth.logout.A" -Passed ($logoutA.effectiveStatus -eq 200) -StatusCode $logoutA.statusCode -Detail $logoutA.bodyRaw

$passedCount = @($results | Where-Object { $_.passed }).Count
$totalCount = $results.Count
$failedCount = $totalCount - $passedCount
$passRate = if ($totalCount -gt 0) { [math]::Round(($passedCount * 100.0 / $totalCount), 2) } else { 0 }

$maturity =
if ($passRate -ge 95) { "production-ready" }
elseif ($passRate -ge 80) { "beta" }
elseif ($passRate -ge 60) { "internal alpha" }
else { "demo" }

$report = [pscustomobject]@{
  baseUrl      = $BaseUrl
  emailA       = $EmailA
  emailB       = $EmailB
  generatedAt  = (Get-Date).ToString("o")
  summary      = [pscustomobject]@{
    total    = $totalCount
    passed   = $passedCount
    failed   = $failedCount
    passRate = $passRate
    maturity = $maturity
  }
  checks       = $results
  meta         = [pscustomobject]@{
    followRedirect = $FollowRedirect.IsPresent
    useAdminOnRateLimit = $UseAdminOnRateLimit.IsPresent
  }
}

$reportJson = $report | ConvertTo-Json -Depth 8
$targetPath = if ([System.IO.Path]::IsPathRooted($OutputPath)) { $OutputPath } else { Join-Path (Get-Location) $OutputPath }
$targetDir = Split-Path -Parent $targetPath
if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir | Out-Null }
$reportJson | Set-Content -Path $targetPath -Encoding UTF8

Write-Host ""
Write-Host "== Validation Summary ==" -ForegroundColor Green
Write-Host ("Passed: {0}/{1} ({2}%)" -f $passedCount, $totalCount, $passRate)
Write-Host ("Maturity: {0}" -f $maturity)
Write-Host ("Report: {0}" -f $targetPath)
Write-Host ""

foreach ($item in $results) {
  $color = if ($item.passed) { "Green" } else { "Red" }
  $icon = if ($item.passed) { "PASS" } else { "FAIL" }
  Write-Host ("[{0}] {1} (status={2})" -f $icon, $item.name, $item.statusCode) -ForegroundColor $color
}
