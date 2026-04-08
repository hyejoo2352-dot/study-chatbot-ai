$gcloud = 'C:\Users\송혜주\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd'
$builds = & $gcloud builds list --project study-chatbot-ai-492606 --limit 1 --format "value(id)" 2>&1
Write-Host "Build ID: $builds"
$builds | Out-File "D:\projects\study-chatbot-ai\_build_id.txt" -Encoding UTF8

if ($builds) {
    $logs = & $gcloud builds log $builds --project study-chatbot-ai-492606 2>&1
    $logs | Out-File "D:\projects\study-chatbot-ai\_build_logs.txt" -Encoding UTF8
    Write-Host "Log lines: $($logs.Count)"
}
