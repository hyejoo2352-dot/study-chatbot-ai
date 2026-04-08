$gcloud = 'C:\Users\송혜주\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd'
$project = 'study-chatbot-ai-492606'
$sa = '437952549031-compute@developer.gserviceaccount.com'

Write-Host "=== Granting logging.logWriter to compute SA ===" -ForegroundColor Cyan
& $gcloud projects add-iam-policy-binding $project `
    --member "serviceAccount:$sa" `
    --role "roles/logging.logWriter" 2>&1

Write-Host "`n=== Granting storage.objectAdmin to Cloud Build SA ===" -ForegroundColor Cyan
& $gcloud projects add-iam-policy-binding $project `
    --member "serviceAccount:437952549031@cloudbuild.gserviceaccount.com" `
    --role "roles/storage.objectAdmin" 2>&1

Write-Host "`nDone." -ForegroundColor Green
