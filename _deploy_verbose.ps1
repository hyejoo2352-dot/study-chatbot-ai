$gcloud = 'C:\Users\송혜주\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd'
Set-Location 'D:\projects\study-chatbot-ai'

& $gcloud run deploy study-chatbot-ai `
    --source . `
    --region asia-northeast3 `
    --allow-unauthenticated `
    --min-instances 0 `
    --max-instances 2 `
    --memory 512Mi `
    --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest `
    --project study-chatbot-ai-492606 `
    --verbosity debug 2>&1 | Tee-Object -FilePath "D:\projects\study-chatbot-ai\_verbose_output.txt"

Write-Host "Exit: $LASTEXITCODE"
