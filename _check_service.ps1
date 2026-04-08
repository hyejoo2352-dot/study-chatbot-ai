$gcloud = 'C:\Users\송혜주\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd'
$project = 'study-chatbot-ai-492606'
$region = 'asia-northeast3'
$service = 'study-chatbot-ai'

Write-Host "=== Cloud Run Service Status ===" -ForegroundColor Cyan
& $gcloud run services describe $service --region $region --project $project 2>&1

Write-Host "`n=== Recent Revisions ===" -ForegroundColor Cyan
& $gcloud run revisions list --service $service --region $region --project $project --limit 5 2>&1

Write-Host "`n=== Build Log (latest success: 986e1d55) ===" -ForegroundColor Yellow
& $gcloud builds log 986e1d55-801a-460e-be7f-cf83c410f542 --project $project 2>&1 | Select-Object -Last 50
