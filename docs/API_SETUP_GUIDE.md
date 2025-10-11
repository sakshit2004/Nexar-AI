# API Setup Guide for GrantMatch Advisor

This guide walks you through obtaining all the API keys needed to run GrantMatch Advisor.

## 🚀 Quick Start Priority

For **MVP launch (Week 1-2)**, you ONLY need:
1. ✅ **OpenAI API** (for GPT-4o mini)
2. ✅ **Grants.gov API** (public endpoints work without key initially)

Optional for Week 2:
3. ⚠️ **SendGrid** (for email alerts)
4. ⚠️ **Stripe** (for payments)

---

## 1. Grants.gov API (Primary Grant Data Source)

### Option A: Use Public Endpoints (No Key Required - Start Here!)

Many Grants.gov endpoints work without authentication:

**Test it now:**
```bash
curl "https://www.grants.gov/grantsws/rest/opportunities/search/?rows=10"
```

✅ **You're ready to start building!** No signup needed for MVP.

### Option B: Request Official API Key (For Production)

**Timeline:** 1-3 business days

**Steps:**
1. Email: `support@grants.gov`
2. Subject: "API Access Request for Nonprofit Grant Matching Tool"
3. Include:
   - Your name and organization
   - App name: "GrantMatch Advisor"
   - Purpose: "AI-powered grant discovery for nonprofits"
   - Expected usage: "~100-500 requests/day"
4. Wait for response with API key

**Documentation:** https://grants.gov/api/api-guide

---

## 2. OpenAI API (for GPT-4o mini LLM)

### ⚡ REQUIRED for MVP

**Timeline:** Immediate (5 minutes)

**Steps:**
1. Go to: https://platform.openai.com/signup
2. Sign up with email or Google account
3. Verify your email
4. Go to: https://platform.openai.com/account/billing
   - Add payment method (credit card)
   - Add initial credit: $5-10 minimum
5. Go to: https://platform.openai.com/api-keys
6. Click "Create new secret key"
7. Name it: "GrantMatch-Dev"
8. **Copy the key immediately** (you can't see it again!)
9. Paste into your `.env` file:
   ```
   OPENAI_API_KEY=sk-proj-...your-key-here
   ```

**Pricing:** 
- GPT-4o mini: $0.15 per 1M input tokens, $0.60 per 1M output tokens
- Expected cost: $20-40/month for 10K users

**Test it:**
```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Say hello"}]
  }'
```

---

## 3. Simpler.Grants.gov API (Modern Alternative to Grants.gov)

### Optional but Recommended

**Timeline:** Immediate (2 minutes)

**Steps:**
1. Go to: https://simpler.grants.gov/developer
2. Click "Sign In" (use GitHub or Google OAuth)
3. Once logged in, you'll see "API Keys" section
4. Click "Generate New API Key"
5. Name it: "GrantMatch-Production"
6. Copy the key to your `.env`:
   ```
   SIMPLER_GRANTS_API_KEY=your-key-here
   ```

**Rate Limits:**
- 60 requests/minute
- 10,000 requests/day per key

**Note:** Keys auto-disable after 30 days of inactivity (just regenerate if needed)

**Test it:**
```bash
curl -H "X-Api-Key: YOUR_KEY" \
  "https://api.simpler.grants.gov/v1/opportunities?limit=5"
```

---

## 4. SendGrid API (Email Alerts)

### Required for Week 2 (Email Alerts Feature)

**Timeline:** 10 minutes (includes verification)

**Steps:**
1. Go to: https://app.sendgrid.com/signup
2. Sign up with email
3. Complete email verification
4. Fill out "About You" questionnaire:
   - Company: "GrantMatch Advisor"
   - Role: "Developer"
   - Use case: "Transactional emails (grant alerts)"
5. Go to: Settings → API Keys
6. Click "Create API Key"
   - Name: "GrantMatch-Production"
   - Permissions: "Full Access" (or "Mail Send" only)
7. Copy key to `.env`:
   ```
   SENDGRID_API_KEY=SG.your-key-here
   ```

8. **Important:** Verify sender email:
   - Go to: Settings → Sender Authentication
   - Click "Verify a Single Sender"
   - Use your email: `noreply@yourdomain.com`
   - Verify via email link

**Free Tier:**
- 100 emails/day forever
- Perfect for MVP!

**Test it:**
```python
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

message = Mail(
    from_email='your-verified@email.com',
    to_emails='test@example.com',
    subject='Test from GrantMatch',
    html_content='<strong>It works!</strong>')

sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
response = sg.send(message)
print(response.status_code)  # Should be 202
```

---

## 5. Stripe API (Payment Processing)

### Required for Week 2 (Premium Subscriptions)

**Timeline:** 15 minutes

**Steps:**
1. Go to: https://dashboard.stripe.com/register
2. Sign up with email
3. Verify email
4. Fill out business details (can skip some for test mode)
5. Go to: Developers → API Keys
6. You'll see two keys:
   - **Publishable key:** `pk_test_...` (public, used in frontend)
   - **Secret key:** `sk_test_...` (PRIVATE, used in backend)
7. Copy both to `.env`:
   ```
   STRIPE_PUBLISHABLE_KEY=pk_test_your-key-here
   STRIPE_SECRET_KEY=sk_test_your-key-here
   ```

8. **Create a Product:**
   - Go to: Products → Add Product
   - Name: "GrantMatch Premium"
   - Price: $9.99/month recurring
   - Save and copy the Price ID (starts with `price_`)
   ```
   STRIPE_PREMIUM_PRICE_ID=price_your-price-id
   ```

9. **Set up webhook** (for subscription events):
   - Go to: Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/webhook/stripe`
   - Select events: `checkout.session.completed`, `customer.subscription.updated`
   - Copy signing secret to `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your-secret
   ```

**Test Mode:**
- Use test credit card: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC

**Go Live:** 
- Activate account (provide business info)
- Switch to live keys (`pk_live_...`, `sk_live_...`)

---

## 6. Optional APIs (Phase 2 - Not Needed for MVP)

### USASpending.gov API

**No key required!** Just start using it:

```bash
curl "https://api.usaspending.gov/api/v2/search/spending_by_award/"
```

**Documentation:** https://api.usaspending.gov/

---

### SAM.gov API (Entity Validation)

**Timeline:** 2-3 days (requires account approval)

1. Go to: https://sam.gov/content/home
2. Create an account
3. Go to: https://sam.gov/content/api
4. Request API access (Federal API Key)
5. Wait for approval email
6. Add to `.env`:
   ```
   SAM_GOV_API_KEY=your-key-here
   ```

---

### Grok API (Alternative LLM from X.AI)

**Status:** May require waitlist as of October 2025

1. Check availability: https://x.ai/api
2. Sign up for waitlist if needed
3. Once approved, generate API key
4. Add to `.env`:
   ```
   GROK_API_KEY=your-key-here
   ```

**Note:** Pricing similar to OpenAI (~$0.50 per 1M tokens)

---

## 📋 Setup Checklist

Copy this to track your progress:

### Week 1 (MVP Essentials)
- [ ] OpenAI API key obtained and tested
- [ ] Grants.gov public endpoint tested (no key needed)
- [ ] `.env` file created from `env.example`
- [ ] Python dependencies installed (`pip install -r requirements.txt`)

### Week 2 (Full Features)
- [ ] SendGrid API key + verified sender email
- [ ] Stripe test mode setup + product created
- [ ] Stripe webhook configured
- [ ] Simpler.Grants.gov API key (optional but recommended)

### Production Launch
- [ ] Grants.gov official API key requested
- [ ] Stripe live mode activated
- [ ] Domain purchased + DNS configured
- [ ] SSL certificate configured

---

## 🔒 Security Best Practices

1. **Never commit `.env` to git**
   - Already in `.gitignore`, but double-check!
   
2. **Use test keys in development**
   - OpenAI: Limit spending to $10/month in dashboard
   - Stripe: Always use `pk_test_` and `sk_test_` keys locally
   
3. **Rotate keys regularly**
   - Every 90 days for production
   - Immediately if exposed in logs/commits

4. **Use environment variables in production**
   - Replit: Use "Secrets" tab
   - Railway/Render: Use environment variables UI
   - Never hardcode keys in code

---

## 🆘 Troubleshooting

### "Invalid API Key" Error

**OpenAI:**
- Check for extra spaces/quotes in `.env`
- Verify key starts with `sk-proj-` (new format) or `sk-`
- Check billing: https://platform.openai.com/account/billing

**Stripe:**
- Verify you're using test keys (`sk_test_`) in development
- Check key hasn't been deleted in dashboard

### "Rate Limit Exceeded"

**Simpler.Grants.gov:**
- You're over 60 requests/minute
- Add caching (we do this in `backend/cache.py`)
- Consider multiple API keys for load balancing

**OpenAI:**
- You've hit your organization's quota
- Add funds or upgrade tier

### SendGrid "Sender Unauthorized"

- Your from_email isn't verified
- Go to: Settings → Sender Authentication
- Verify the email address you're using

---

## 💰 Cost Summary (MVP Phase)

| Service | Free Tier | Expected Cost/Month |
|---------|-----------|---------------------|
| **Grants.gov** | Unlimited | $0 |
| **OpenAI GPT-4o mini** | $5 credit (expires) | $20-40 |
| **SendGrid** | 100 emails/day | $0 |
| **Stripe** | Free (2.9% + $0.30 per transaction) | $0 |
| **Simpler.Grants.gov** | 10K requests/day | $0 |
| **USASpending.gov** | Unlimited | $0 |
| **TOTAL** | — | **$20-40/month** |

✅ **Well under the $50/month budget!**

---

## 📚 Additional Resources

- **Grants.gov API Docs:** https://grants.gov/api/api-guide
- **OpenAI Cookbook:** https://github.com/openai/openai-cookbook
- **Stripe Testing:** https://stripe.com/docs/testing
- **SendGrid Python Guide:** https://github.com/sendgrid/sendgrid-python

---

## ✅ Verification Script

Run this to test all your API keys:

```bash
python scripts/test_apis.py
```

(We'll create this script in the next step!)

---

**Questions?** Open an issue or check the [README.md](README.md) for more details.

