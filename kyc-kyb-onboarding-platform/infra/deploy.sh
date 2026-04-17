#!/bin/bash
# =============================================================================
# KYC/KYB Platform — AWS Deploy Script
# =============================================================================
# Provisions all AWS infrastructure via CloudFormation and deploys the app.
#
# Requirements:
#   - AWS CLI v2 installed and configured (aws configure)
#   - An EC2 Key Pair already created in your AWS account
#
# Usage:
#   chmod +x infra/deploy.sh
#   ./infra/deploy.sh
# =============================================================================

set -euo pipefail

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── Check dependencies ────────────────────────────────────────────────────────
command -v aws  >/dev/null 2>&1 || error "AWS CLI not found. Install: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html"
command -v openssl >/dev/null 2>&1 || error "openssl not found."

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║     KYC/KYB Platform — AWS Infrastructure Deploy     ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── Collect inputs ────────────────────────────────────────────────────────────
read -rp "$(echo -e "${BLUE}?${NC} Stack name (e.g. kyc-kyb-prod): ")" STACK_NAME
STACK_NAME=${STACK_NAME:-kyc-kyb-prod}

read -rp "$(echo -e "${BLUE}?${NC} AWS Region (e.g. us-east-1): ")" AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

read -rp "$(echo -e "${BLUE}?${NC} Public domain (e.g. app.empresa.com): ")" APP_DOMAIN
[[ -z "$APP_DOMAIN" ]] && error "Domain is required."

read -rp "$(echo -e "${BLUE}?${NC} E-mail for Let's Encrypt: ")" CERTBOT_EMAIL
[[ -z "$CERTBOT_EMAIL" ]] && error "E-mail is required."

read -rp "$(echo -e "${BLUE}?${NC} Git repository URL: ")" REPO_URL
[[ -z "$REPO_URL" ]] && error "Repository URL is required."

read -rp "$(echo -e "${BLUE}?${NC} Branch (default: main): ")" REPO_BRANCH
REPO_BRANCH=${REPO_BRANCH:-main}

read -rp "$(echo -e "${BLUE}?${NC} EC2 Key Pair name (must exist in your account): ")" KEY_PAIR
[[ -z "$KEY_PAIR" ]] && error "Key Pair name is required."

read -rp "$(echo -e "${BLUE}?${NC} EC2 instance type (default: t3.small): ")" INSTANCE_TYPE
INSTANCE_TYPE=${INSTANCE_TYPE:-t3.small}

echo ""
info "Generating secure secrets..."
DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 24)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
success "Secrets generated."

# ── Confirm ───────────────────────────────────────────────────────────────────
echo ""
echo "─────────────────────────────────────────────────────────"
echo "  Stack name:    $STACK_NAME"
echo "  Region:        $AWS_REGION"
echo "  Domain:        $APP_DOMAIN"
echo "  E-mail:        $CERTBOT_EMAIL"
echo "  Repository:    $REPO_URL ($REPO_BRANCH)"
echo "  Key Pair:      $KEY_PAIR"
echo "  Instance type: $INSTANCE_TYPE"
echo "─────────────────────────────────────────────────────────"
echo ""
read -rp "$(echo -e "${YELLOW}?${NC} Proceed? (y/N): ")" CONFIRM
[[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]] && { info "Aborted."; exit 0; }

# ── Deploy CloudFormation ─────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_FILE="$SCRIPT_DIR/cloudformation.yml"

[[ ! -f "$TEMPLATE_FILE" ]] && error "cloudformation.yml not found at $TEMPLATE_FILE"

echo ""
info "Deploying CloudFormation stack '$STACK_NAME' in $AWS_REGION..."

aws cloudformation deploy \
  --region "$AWS_REGION" \
  --stack-name "$STACK_NAME" \
  --template-file "$TEMPLATE_FILE" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    AppDomain="$APP_DOMAIN" \
    CertbotEmail="$CERTBOT_EMAIL" \
    RepoUrl="$REPO_URL" \
    RepoBranch="$REPO_BRANCH" \
    DBPassword="$DB_PASSWORD" \
    NextAuthSecret="$NEXTAUTH_SECRET" \
    InstanceType="$INSTANCE_TYPE" \
    KeyPairName="$KEY_PAIR" \
    AWSRegion="$AWS_REGION"

success "Stack deployed successfully!"

# ── Fetch outputs ─────────────────────────────────────────────────────────────
echo ""
info "Fetching stack outputs..."

PUBLIC_IP=$(aws cloudformation describe-stacks \
  --region "$AWS_REGION" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='PublicIP'].OutputValue" \
  --output text)

S3_BUCKET=$(aws cloudformation describe-stacks \
  --region "$AWS_REGION" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='S3BucketName'].OutputValue" \
  --output text)

# ── Save credentials ──────────────────────────────────────────────────────────
CREDS_FILE="$SCRIPT_DIR/deploy-output-${STACK_NAME}.txt"
cat > "$CREDS_FILE" <<EOF
# KYC/KYB Platform — Deploy Output
# Generated: $(date)
# Stack: $STACK_NAME ($AWS_REGION)
# ─────────────────────────────────────────────────────────
# KEEP THIS FILE SAFE — contains generated secrets

Stack name:       $STACK_NAME
Region:           $AWS_REGION
Public IP:        $PUBLIC_IP
Domain:           $APP_DOMAIN
S3 Bucket:        $S3_BUCKET

DB Password:      $DB_PASSWORD
NextAuth Secret:  $NEXTAUTH_SECRET

SSH:              ssh -i ${KEY_PAIR}.pem ec2-user@${PUBLIC_IP}
Bootstrap log:    sudo tail -f /var/log/kyc-kyb-bootstrap.log
EOF

chmod 600 "$CREDS_FILE"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║                  Deploy Complete!                    ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
success "EC2 Public IP:  $PUBLIC_IP"
success "S3 Bucket:      $S3_BUCKET"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Point your DNS A record for '$APP_DOMAIN' → $PUBLIC_IP"
echo "  2. Wait ~5 min for the EC2 bootstrap to complete"
echo "  3. Monitor progress: ssh -i ${KEY_PAIR}.pem ec2-user@${PUBLIC_IP}"
echo "     then run: sudo tail -f /var/log/kyc-kyb-bootstrap.log"
echo "  4. Access https://$APP_DOMAIN — you'll be redirected to /setup"
echo ""
warn "Credentials saved to: $CREDS_FILE"
warn "Keep this file safe — it contains your DB password and JWT secret."
echo ""
