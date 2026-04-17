#!/bin/bash
# =============================================================================
# KYC/KYB Platform — AWS Teardown Script
# =============================================================================
# Destroys the CloudFormation stack and all provisioned resources.
# WARNING: This will delete the EC2 instance and S3 bucket (if empty).
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

command -v aws >/dev/null 2>&1 || error "AWS CLI not found."

echo ""
echo -e "${RED}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║         KYC/KYB Platform — AWS Teardown              ║${NC}"
echo -e "${RED}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

read -rp "$(echo -e "${BLUE}?${NC} Stack name to destroy: ")" STACK_NAME
read -rp "$(echo -e "${BLUE}?${NC} AWS Region: ")" AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

echo ""
echo -e "${RED}WARNING: This will permanently delete all resources in stack '$STACK_NAME'.${NC}"
echo -e "${RED}The S3 bucket must be empty before deletion.${NC}"
echo ""
read -rp "$(echo -e "${RED}?${NC} Type the stack name to confirm: ")" CONFIRM

[[ "$CONFIRM" != "$STACK_NAME" ]] && { info "Aborted — names don't match."; exit 0; }

# Empty S3 bucket first (CloudFormation can't delete non-empty buckets)
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --region "$AWS_REGION")
BUCKET_NAME="kyc-kyb-docs-${ACCOUNT_ID}"

info "Emptying S3 bucket $BUCKET_NAME..."
aws s3 rm "s3://$BUCKET_NAME" --recursive --region "$AWS_REGION" 2>/dev/null || warn "Bucket already empty or doesn't exist."

info "Deleting CloudFormation stack '$STACK_NAME'..."
aws cloudformation delete-stack --stack-name "$STACK_NAME" --region "$AWS_REGION"

info "Waiting for deletion to complete..."
aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME" --region "$AWS_REGION"

success "Stack '$STACK_NAME' deleted successfully."
