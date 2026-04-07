# ============================================================
# Makefile — 자주 쓰는 명령어 모음
#
# 사용법:
#   make deploy   로컬에서 Cloud Run에 직접 배포
#   make secret   Gemini API 키를 Secret Manager에 등록/업데이트
#   make url      배포된 서비스 URL 확인
#   make logs     Cloud Run 로그 스트리밍
# ============================================================

GCLOUD := powershell.exe -Command & 'C:\Users\송혜주\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd'
PROJECT := study-chatbot-ai-492606
REGION  := asia-northeast3
SERVICE := study-chatbot-ai

include .env

.PHONY: deploy secret url logs

# Cloud Run에 배포 (소스 코드 → Cloud Build 빌드 → 배포)
# Docker 없이 동작합니다.
deploy:
	powershell.exe -Command "Set-Location 'D:\projects\study-chatbot-ai'; & 'C:\Users\송혜주\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd' run deploy $(SERVICE) --source . --region $(REGION) --allow-unauthenticated --min-instances 0 --max-instances 2 --memory 512Mi --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest --project $(PROJECT) 2>&1"

# Secret Manager의 GEMINI_API_KEY 업데이트
# 사용법: make secret KEY=실제키값
secret:
	@echo "$(KEY)" | powershell.exe -Command "$$input | & 'C:\Users\송혜주\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd' secrets versions add GEMINI_API_KEY --data-file=- --project $(PROJECT)"

# 배포된 서비스 URL 확인
url:
	powershell.exe -Command "& 'C:\Users\송혜주\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd' run services describe $(SERVICE) --region $(REGION) --project $(PROJECT) --format 'value(status.url)' 2>&1"

# Cloud Run 로그 실시간 확인
logs:
	powershell.exe -Command "& 'C:\Users\송혜주\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd' beta run services logs tail $(SERVICE) --region $(REGION) --project $(PROJECT) 2>&1"
