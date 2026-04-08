$gcloud = 'C:\Users\송혜주\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd'

# 최근 빌드 목록
Write-Host "=== Recent Builds ===" -ForegroundColor Cyan
$builds = & $gcloud builds list --project study-chatbot-ai-492606 --limit 5 2>&1
Write-Host $builds

# 가장 최근 빌드 ID 가져오기
$buildId = (& $gcloud builds list --project study-chatbot-ai-492606 --limit 1 --format "value(id)" 2>&1) | Where-Object { $_ -match '^[a-f0-9-]{36}$' } | Select-Object -First 1
Write-Host "Latest Build ID: '$buildId'"

if ($buildId) {
    Write-Host "=== Build Logs ===" -ForegroundColor Yellow
    & $gcloud builds log $buildId --project study-chatbot-ai-492606 2>&1
}
