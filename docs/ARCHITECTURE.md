# Print and Deploy - Security Architecture

**Project:** E-commerce platform for 3D printed tabletop gaming accessories  
**Cloud Provider:** Microsoft Azure  
**Infrastructure:** Terraform (Infrastructure as Code)  
**Status:** Phase 1 Complete - Security Foundation Deployed

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Azure Resources](#azure-resources)
4. [Security Design](#security-design)
5. [Cost Analysis](#cost-analysis)
6. [Design Decisions](#design-decisions)
7. [Future Phases](#future-phases)

---

## Overview

### Business Context

**Print and Deploy** is an e-commerce platform selling custom 3D printed miniatures and terrain for tabletop gaming (D&D, Warhammer, etc.).

**Key Requirements:**

- Accept payments securely (Stripe integration)
- Store customer data safely (PII protection)
- Maintain PCI compliance
- Minimize operational costs
- Scale with business growth

### Technical Approach

Built with a **security-first** mindset:

- All secrets managed in Azure Key Vault
- Defense-in-depth security architecture
- Infrastructure as Code for reproducibility
- Comprehensive audit logging
- Cost-optimized using Azure free tiers

---

## Architecture Diagram

### Current State (Phase 1 - Security Foundation)

```
┌─────────────────────────────────────────────────────────────┐
│                    Azure Subscription                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │   Resource Group: rg-printanddeploy-prod (West US 2)  │  │
│  │                                                       │  │
│  │   ┌─────────────────────────────────────────────┐     │  │
│  │   │  Azure Key Vault: kv-pd-prod-muurllhg       │     │  │
│  │   │  ┌──────────────────────────────────────┐   │     │  │
│  │   │  │  Secrets:                            │   │     │  │
│  │   │  │  • StripeSecretKey                   │   │     │  │
│  │   │  │  • StripePublishableKey              │   │     │  │
│  │   │  │  • StripeWebhookSecret               │   │     │  │
│  │   │  └──────────────────────────────────────┘   │     │  │
│  │   │                                             │     │  │
│  │   │  Security Features:                         │     │  │
│  │   │  ✓ Soft Delete (90 days)                    │     │  │
│  │   │  ✓ Purge Protection                         │     │  │
│  │   │  ✓ RBAC Authorization                       │     │  │
│  │   │  ✓ Encryption at Rest                       │     │  │
│  │   └─────────────────────────────────────────────┘      │  │
│  │                         │                              │  │
│  │                         │ Audit Logs                   │  │
│  │                         ↓                              │  │
│  │   ┌─────────────────────────────────────────────┐      │  │
│  │   │  Log Analytics: log-printanddeploy-prod     │     │  │
│  │   │  • All Key Vault access logged              │     │  │
│  │   │  • 90-day retention                         │     │  │
│  │   │  • Security monitoring                      │     │  │
│  │   └─────────────────────────────────────────────┘     │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

Access Control:
┌──────────────────┐
│  Me (Developer)  │──→ Key Vault Secrets Officer (RBAC)
└──────────────────┘    ✓ Read/Write/Delete secrets
                        ✓ Cannot modify vault itself

Future:
┌──────────────────┐
│ Azure Functions  │──→ Managed Identity (future)
└──────────────────┘    ✓ Read-only secret access
                        ✓ No passwords in code
```

### Future State (Complete Platform)

```
                    ┌──────────────┐
                    │   Internet   │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │    Custom    │
                    │    Domain    │
                    │ printanddeploy.com
                    └──────┬───────┘
                           │
                ┌──────────┴──────────┐
                │                     │
        ┌───────▼────────┐    ┌──────▼──────────┐
        │ Static Web App │    │ Azure Functions │
        │   (Next.js)    │    │  (TypeScript)   │
        │                │    │                 │
        │ • Product pages│    │ • Products API  │
        │ • Shopping cart│    │ • Cart API      │
        │ • Checkout     │    │ • Orders API    │
        └────────────────┘    │ • Stripe webhook│
                              └──────┬──────────┘
                                     │
                          ┬──────────┼──────────┬
                          │          │          │
                   ┌──────▼────┐ ┌──▼────┐ ┌──▼──────┐
                   │ Cosmos DB │ │  Key  │ │  Blob   │
                   │           │ │ Vault │ │ Storage │
                   │ • products│ │       │ │         │
                   │ • orders  │ │ Secrets│ │ Images │
                   │ • customers│ │       │ │        │
                   └───────────┘ └───────┘ └─────────┘
                                     │
                                     │
                              ┌──────▼──────┐
                              │   Stripe    │
                              │  (Payments) │
                              └─────────────┘
```

### Future State (Post-Launch - April+)

```
                        ┌──────────────┐
                        │   Internet   │
                        └──────┬───────┘
                               │
                        ┌──────▼───────┐
                        │ Azure Front  │
                        │ Door + WAF   │  ← DDoS Protection (Future)
                        └──────┬───────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
            ┌───────▼────────┐    ┌──────▼──────────┐
            │ Static Web App │    │ Azure Functions │
            │   (Next.js)    │    │  (TypeScript)   │
            └────────────────┘    └──────┬──────────┘
                                         │
                              ┌──────────┼──────────┐
                              │          │          │
                       ┌──────▼────┐ ┌──▼────┐ ┌──▼──────┐
                       │ Cosmos DB │ │  Key  │ │  Blob   │
                       └───────────┘ │ Vault │ └─────────┘
                                     └───┬───┘
                                         │
                                         │ Monitored by
                                         ↓
                              ┌──────────────────────┐
                              │  Python Security     │
                              │  Functions           │
                              ├──────────────────────┤
                              │ • Audit Analyzer     │
                              │ • Fraud Detection    │
                              │ • Compliance Checker │
                              │ • Vulnerability Scan │
                              └──────────────────────┘





```

---

## Azure Resources

### Deployed Resources (Phase 1)

| Resource               | Name                      | Type       | Purpose            | Cost           |
| ---------------------- | ------------------------- | ---------- | ------------------ | -------------- |
| **Resource Group**     | `rg-printanddeploy-prod`  | Container  | Logical grouping   | $0             |
| **Key Vault**          | `kv-pd-prod-muurllhg`     | Security   | Secrets management | $0 (free tier) |
| **Log Analytics**      | `log-printanddeploy-prod` | Monitoring | Audit logging      | $0 (free tier) |
| **Diagnostic Setting** | `keyvault-diagnostics`    | Monitoring | KV → Log Analytics | $0 (included)  |
| **Role Assignment**    | N/A                       | Security   | RBAC permissions   | $0 (included)  |

**Total Current Cost:** $0/month

### Resource Details

#### Azure Key Vault

```
Name: kv-pd-prod-muurllhg
SKU: Standard
Location: West US 2
Features:
  - Soft delete: Enabled (90 days)
  - Purge protection: Enabled
  - RBAC: Enabled (modern auth model)
  - Public access: Enabled (required for Static Web Apps)
  - Network ACLs: Allow all (will restrict later)
```

#### Log Analytics Workspace

```
Name: log-printanddeploy-prod
SKU: PerGB2018
Retention: 90 days
Free tier: 5 GB/month
Purpose: Security audit trail
```

---

## Security Design

### Defense in Depth

**Layer 1: Secrets Management**

- All secrets stored in Azure Key Vault
- No secrets in code or configuration files
- Encryption at rest (Azure managed keys)
- Soft delete prevents accidental loss
- Purge protection prevents permanent deletion

**Layer 2: Access Control**

- RBAC authorization model (modern, granular)
- Principle of least privilege
- Managed identities (future) - no service account passwords
- Individual role assignments (auditable)

**Layer 3: Monitoring & Auditing**

- All Key Vault access logged
- 90-day retention (compliance ready)
- Query capabilities for investigations
- Alert capabilities (future)

**Layer 4: Infrastructure Protection**

- Infrastructure as Code (version controlled)
- Terraform state tracked (knows what exists)
- Lifecycle protection (prevent accidental deletion)
- Soft delete on critical resources

---

### Threat Model

**Threats Mitigated:**

| Threat                  | Mitigation                                | Status      |
| ----------------------- | ----------------------------------------- | ----------- |
| **Secrets in code**     | Key Vault + .gitignore                    | Mitigated   |
| **Unauthorized access** | RBAC + Azure AD auth                      | Mitigated   |
| **Accidental deletion** | Soft delete + purge protection            | Mitigated   |
| **No audit trail**      | Log Analytics + diagnostics               | Mitigated   |
| **Secrets in logs**     | No secrets logged, only metadata          | Mitigated   |
| **DDoS attacks**        | Azure Front Door + WAF (future)           | Planned     |
| **Payment data breach** | Stripe handles all card data              | By design   |
| **SQL injection**       | NoSQL (Cosmos DB) + parameterized queries | In progress |

---

### PCI Compliance Strategy

**Scope Reduction:**

- Stripe handles ALL card data
- Never store card numbers, CVV, expiration
- Only store: `stripe_customer_id`, `stripe_payment_intent_id`
- Use Stripe Elements (iframed card input from Stripe domain)

**Our Responsibilities:**

- Protect Stripe API keys (Key Vault)
- Verify webhook signatures (prevent spoofing)
- Use HTTPS everywhere
- Audit all payment-related operations

**Result:** Significantly reduced PCI compliance burden

---

## Cost Analysis

### Current Monthly Costs

```
Azure Key Vault:
  Operations: 0-10,000/month = $0 (free tier)
  Storage: <100 secrets = $0

Log Analytics:
  Ingestion: <5 GB/month = $0 (free tier)
  Retention: 90 days included

Resource Group: $0 (no cost)
Diagnostic Settings: $0 (included)

──────────────────────────────
TOTAL: $0/month
```

### Future Costs (Projected)

```
When fully deployed:

Azure Functions: $0 (1M executions/month free)
Cosmos DB: $0 (1000 RU/s free tier)
Static Web Apps: $0 (100 GB bandwidth free)
Blob Storage: $1/month (after 5 GB free year 1)
Azure DNS: $0.50/month

──────────────────────────────
ESTIMATED TOTAL: ~$2/month
```

### Cost Optimization Strategy

**Free Tier Maximization:**

- Serverless architecture (pay per use, not idle time)
- Careful monitoring of free tier limits
- Alerts when approaching thresholds

**Resource Right-Sizing:**

- Start small, scale based on actual usage
- Use metrics to inform scaling decisions
- Review costs monthly

**Design Decisions for Cost:**

- Chose Cosmos DB free tier over SQL Database
- Chose Functions over App Service (no idle costs)
- Chose Static Web Apps over App Service
- Stay in single region (minimize data transfer)

---

## Design Decisions

### Why Azure Key Vault?

**Alternatives Considered:**

- X Environment variables → Not encrypted, visible in portal
- X App Config Service → Less secure than Key Vault
- X Hardcoded secrets → Security nightmare

**Why Key Vault:**

- Built for secrets management
- Encryption at rest and in transit
- Audit logging built-in
- RBAC integration
- Soft delete protection
- Free tier available

---

### Why RBAC over Access Policies?

**Access Policies (Legacy):**

- Per-principal permissions
- Vault-level only
- No inheritance
- Harder to audit

**RBAC (Modern):**

- Azure AD integration
- Fine-grained roles
- Inheritable
- Central management
- Industry standard

**Decision:** Use RBAC (modern, recommended by Microsoft)

---

### Why Soft Delete + Purge Protection?

**Real-world scenario:**

```
Without protection:
Developer: "terraform destroy" → Vault gone forever
Secrets: Lost permanently
Recovery: Impossible
Impact: Rebuild everything, rotate all secrets

With protection:
Developer: "terraform destroy" → Vault soft-deleted
Secrets: Retained for 90 days
Recovery: "terraform apply" → Vault restored
Impact: Minimal, lessons learned
```

**Decision:** Always enable in production

---

### Why West US 2?

**Factors Considered:**

- My location: Bainbridge Island, WA
- Customer base: US-based (tabletop gaming community)
- Latency: ~10ms vs ~70ms (East US)
- Services: All required services available
- Cost: Same as other US regions

**Decision:** West US 2 (local proximity, good latency)

**Future:** Will add East US for disaster recovery

---

## Future Phases

### Phase 2: Application Infrastructure (Next)

**Deploy:**

- Azure Functions (API layer)
- Cosmos DB (database)
- Blob Storage (product images)
- Static Web Apps (frontend)

**Timeframe:** 2-3 weeks

---

### Phase 3: Application Development

**Build:**

- Next.js frontend (product catalog, cart, checkout)
- Azure Functions API (orders, products, webhooks)
- Stripe integration (payments)
- Email automation (M365 + Nodemailer)

**Timeframe:** 3-4 weeks

---

### Phase 4: Security Hardening

**Add:**

- Azure Front Door + WAF
- Rate limiting
- IP restrictions on Key Vault
- Network security groups
- Security scanning in CI/CD

**Timeframe:** 1 week

---

### Phase 5: Launch

**Final steps:**

- Domain configuration
- SSL certificates
- Production Stripe keys
- Final security audit
- Monitoring alerts
- Go live! 🚀

**Timeframe:** 1 week

## Security Automation Roadmap

Future enhancements include automated security analysis and
detection engineering using Python-based services to analyze
audit telemetry, detect anomalies, and assist incident response.

Goals:

- Automated audit log analysis
- Secret access anomaly detection
- Configuration drift monitoring
- Compliance validation
- AI-assisted incident triage

---

## Appendix

### Terraform File Structure

```
terraform/
├── main.tf                 # Provider configuration
├── variables.tf            # Variable definitions
├── terraform.tfvars        # Environment values
├── resource_group.tf       # Resource group
├── keyvault.tf            # Key Vault + monitoring
└── (future files)
    ├── functions.tf        # Azure Functions
    ├── cosmos.tf          # Cosmos DB
    ├── static_web_app.tf  # Frontend
    └── storage.tf         # Blob storage
```

### Key Terraform Commands

```bash
terraform init      # Initialize, download providers
terraform validate  # Check syntax
terraform plan      # Preview changes
terraform apply     # Deploy changes
terraform destroy   # Delete everything
terraform state list  # Show deployed resources
terraform output    # Show outputs
```

### Useful Azure CLI Commands

```bash
# Key Vault
az keyvault list
az keyvault show --name <vault-name>
az keyvault secret list --vault-name <vault-name>
az keyvault secret show --vault-name <vault-name> --name <secret-name>

# Resource Groups
az group list
az group show --name <rg-name>
az resource list --resource-group <rg-name>

# General
az account show           # Current subscription
az account list           # All subscriptions
az login                  # Login to Azure
```

---

## References

- [Azure Key Vault Documentation](https://docs.microsoft.com/azure/key-vault/)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Azure Well-Architected Framework](https://docs.microsoft.com/azure/architecture/framework/)
- [PCI DSS Requirements](https://www.pcisecuritystandards.org/)

---

**Document Version:** 1.0  
**Last Updated:** February 11, 2026  
**Author:** Jonathan Morrissette  
**Status:** Phase 1 Complete
