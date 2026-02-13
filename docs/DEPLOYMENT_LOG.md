# Deployment Log - Print and Deploy Infrastructure

**Date:** February 11, 2026  
**Duration:** ~4 hours  
**Status:** Successfully Deployed  

---

## What Was Deployed

### Azure Resources Created:
- **Resource Group:** `rg-printanddeploy-prod` (West US 2)
- **Key Vault:** `kv-pd-prod-muurllhg`
  - Soft delete: 90 days
  - Purge protection: Enabled
  - RBAC authorization: Enabled
- **Log Analytics Workspace:** `log-printanddeploy-prod`
  - Retention: 90 days
- **Diagnostic Settings:** Key Vault → Log Analytics
- **RBAC Role:** Key Vault Secrets Officer (assigned to me)

### Secrets Stored:
1. `StripeSecretKey` - Stripe test API key (sk_test_...)
2. `StripePublishableKey` - Stripe test publishable key (pk_test_...)
3. `StripeWebhookSecret` - Stripe webhook signing secret (whsec_...)

**Email secrets:** Deferred to later (will use M365 + Nodemailer)

---

## Commands Used

### Terraform Deployment:
```bash
# Initialize Terraform
cd terraform
terraform init

# Validate configuration
terraform validate

# Preview changes
terraform plan

# Deploy to Azure
terraform apply
# Typed: yes

# Verify deployment
terraform state list
terraform output
```

### Add Secrets to Key Vault:
```bash
# Get vault name
$VAULT = "kv-pd-prod-muurllhg"

# Add Stripe keys
az keyvault secret set --vault-name $VAULT --name "StripeSecretKey" --value "sk_test_..."
az keyvault secret set --vault-name $VAULT --name "StripePublishableKey" --value "pk_test_..."
az keyvault secret set --vault-name $VAULT --name "StripeWebhookSecret" --value "whsec_..."

# Verify secrets
az keyvault secret list --vault-name $VAULT --query '[].name' -o table
```

---

## Verification Steps

### Check Resources Exist:
```bash
# Resource group
az group show --name rg-printanddeploy-prod

# Key Vault
az keyvault show --name kv-pd-prod-muurllhg

# List all resources
az resource list --resource-group rg-printanddeploy-prod -o table
```

### Check Secrets:
```bash
# List secrets (names only)
az keyvault secret list --vault-name kv-pd-prod-muurllhg --query '[].name' -o table

# Verify a secret (shows actual value - be careful!)
az keyvault secret show --vault-name kv-pd-prod-muurllhg --name "StripeSecretKey" --query value -o tsv
```

### Check in Azure Portal:
- https://portal.azure.com
- Navigate to: Key Vaults → kv-pd-prod-muurllhg → Secrets
- Confirmed all 3 secrets present 

---

## Issues Encountered & Solutions

### Issue 1: Terraform outputs not showing
**Problem:** `terraform output` only showed resource group, not Key Vault  
**Solution:** Used `terraform state show azurerm_key_vault.main` and Azure CLI instead  
**Lesson:** State file is the source of truth, outputs are just convenience  

### Issue 2: Multiple Azure tenants
**Problem:** `az login` failed - "no subscriptions found"  
**Solution:** Used `az login --tenant TENANT_ID` to specify correct tenant  
**Lesson:** Save tenant ID for future logins  

### Issue 3: Deciding on email provider
**Problem:** Wasn't sure whether to use SendGrid, Nodemailer, or M365  
**Solution:** Deferred decision - already have M365, will use Nodemailer later  
**Lesson:** Don't over-engineer MVP - focus on core functionality first  

---

## Cost Breakdown

### Monthly Costs:
| Resource | Cost | Notes |
|----------|------|-------|
| Key Vault | $0 | Free tier (10k operations/month) |
| Log Analytics | $0 | Free tier (5GB/month) |
| Resource Group | $0 | No cost |
| Diagnostic Settings | $0 | Included |
| **TOTAL** | **$0/month** | All in free tier! |

### Future Costs:
- When we add Functions, Cosmos DB, etc: ~$2/month total
- Still staying in free tiers

---

## Files Created/Modified

### Git Commits:
```
1. Add .gitignore (Inquisitorial Seal)
2. Add Terraform main configuration (Lord Commander)
3. Add Terraform variables (Codex Astartes)
4. Add Fortress Monastery (Resource Group)
5. Add Adeptus Custodes (Key Vault)
```

### Local Files (NOT in Git):
- `terraform/terraform.tfstate` - Current infrastructure state
- `terraform/terraform.tfstate.backup` - Previous state
- `terraform/.terraform/` - Provider plugins

**These are protected by .gitignore**

---

## Next Steps

### Immediate (This Week):
- [ ] Create architecture diagram
- [ ] Document security decisions
- [ ] Start building Azure Functions API
- [ ] Set up Stripe integration locally

### Soon (Next 2 Weeks):
- [ ] Build Next.js frontend
- [ ] Deploy frontend to Static Web Apps
- [ ] Deploy backend to Azure Functions
- [ ] Connect frontend ↔ backend ↔ Stripe

### Later:
- [ ] Add email automation (M365 + Nodemailer)
- [ ] Set up CI/CD pipeline
- [ ] Launch! 🚀

---

## Useful Commands Reference

### Terraform:
```bash
terraform init          # Download providers
terraform validate      # Check syntax
terraform fmt           # Format code
terraform plan          # Preview changes
terraform apply         # Deploy changes
terraform destroy       # Delete everything (careful!)
terraform state list    # List all resources
terraform output        # Show outputs
terraform show          # Show current state
```

### Azure CLI:
```bash
az login                            # Login to Azure
az account show                     # Show current subscription
az account list                     # List all subscriptions
az keyvault list -o table          # List all Key Vaults
az keyvault secret list            # List secrets in vault
az resource list --resource-group  # List resources in RG
```

---

## Security Notes

### What's Protected:
✅ All secrets in Key Vault (encrypted at rest)  
✅ RBAC prevents unauthorized access  
✅ Soft delete protects against accidents  
✅ Purge protection prevents permanent deletion  
✅ All access logged to Log Analytics  
✅ No secrets in Git (protected by .gitignore)  

### Access Control:
- **Me:** Key Vault Secrets Officer (can read/write secrets)
- **Future App:** Managed Identity (will get read-only access)
- **Everyone else:** No access

---

## Lessons Learned

### Technical:
1. **IaC is powerful** - Entire infrastructure in version control
2. **Azure free tiers are generous** - Can run real workloads for $0-2/month
3. **Security first works** - Easier to build in than bolt on
4. **Terraform state is critical** - Don't lose it, don't commit it

### Process:
1. **Document as you go** - Would've forgotten details already
2. **Small commits** - Each component separately
3. **Test in portal first** - Then codify in Terraform
4. **Ask "why"** - Understanding beats memorization

### Personal:
1. **Build real things** - Learning by doing > tutorials
2. **Public building works** - Accountability + portfolio
3. **Security mindset** - Think like an attacker
4. **Cost matters** - Especially when it's your money!

---

**End of Deployment Log**