$GCLOUD = "C:\Users\송혜주\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
$PROJECT = "study-chatbot-ai-492606"
$REPO    = "hyejoo2352-dot/study-chatbot-ai"
$SA      = "github-actions-deploy@$PROJECT.iam.gserviceaccount.com"

# Workload Identity Provider 생성
$condition = "attribute.repository == '$REPO'"

& $GCLOUD iam workload-identity-pools providers create-oidc github-provider `
  --location=global `
  --workload-identity-pool=github-actions-pool `
  "--issuer-uri=https://token.actions.githubusercontent.com" `
  "--attribute-mapping=google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" `
  "--attribute-condition=$condition" `
  --project=$PROJECT

# 서비스 계정에 WIF 바인딩 추가
$POOL_ID = "projects/437952549031/locations/global/workloadIdentityPools/github-actions-pool"
$MEMBER  = "principalSet://iam.googleapis.com/$POOL_ID/attribute.repository/$REPO"

& $GCLOUD iam service-accounts add-iam-policy-binding $SA `
  "--role=roles/iam.workloadIdentityUser" `
  "--member=$MEMBER" `
  --project=$PROJECT

Write-Host ""
Write-Host "=== WIF 설정 완료 ===" -ForegroundColor Green
Write-Host "WORKLOAD_IDENTITY_PROVIDER:"
Write-Host "  $POOL_ID/providers/github-provider"
Write-Host "SERVICE_ACCOUNT:"
Write-Host "  $SA"
