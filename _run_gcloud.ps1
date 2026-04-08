Set-Location 'D:\projects\study-chatbot-ai'
$gcloud = 'C:\Users\송혜주\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd'
$output = & $gcloud builds list --project study-chatbot-ai-492606 --limit 3 --format "table(id,status,createTime)" 2>&1
$output | Out-File -FilePath "D:\projects\study-chatbot-ai\_gcloud_output.txt" -Encoding UTF8
Write-Host "Done. Lines: $($output.Count)"
