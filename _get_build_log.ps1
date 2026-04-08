$gcloud = 'C:\Users\송혜주\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd'
$project = 'study-chatbot-ai-492606'

# verbose 출력에서 최신 build ID 가져오기
Write-Host "=== Listing recent builds ===" -ForegroundColor Cyan
& $gcloud builds list --project $project --limit 5 2>&1

# 방금 실패한 빌드의 로그 (직접 ID 지정)
$buildId = 'a6df09ce-0d39-47fa-bf36-19340ac6c7fa'
Write-Host "`n=== Build log for $buildId ===" -ForegroundColor Yellow
& $gcloud builds log $buildId --project $project 2>&1 | Out-File "D:\projects\study-chatbot-ai\_build_log_detail.txt" -Encoding UTF8
Write-Host "Log written to _build_log_detail.txt"
Get-Content "D:\projects\study-chatbot-ai\_build_log_detail.txt" | Select-Object -Last 80
