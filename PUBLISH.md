# Guida pubblicazione Shopify App Store

## Prerequisiti

- [ ] Account Shopify Partners
- [ ] App creata nel Partner Dashboard
- [ ] Hosting (Vercel, Railway, Fly.io, etc.)
- [ ] Database PostgreSQL (Supabase, Neon, AWS RDS)

## Step 1: Configura ambiente produzione

```bash
# 1. Configura variabili in .env
SHOPIFY_APP_URL=https://tua-app.vercel.app
SHOPIFY_API_KEY=dal_partner_dashboard
SHOPIFY_API_SECRET=dal_partner_dashboard
DATABASE_URL=postgresql://...
SESSION_SECRET=almeno_32_caratteri_random

# 2. Linka app a Shopify CLI
npm run config:link

# 3. Configura webhook URL
# Modifica shopify.app.toml con il tuo URL produzione
```

## Step 2: Deploy app

```bash
# Deploy con Shopify CLI
npm run shopify:deploy
```

## Step 3: Configura nel Partner Dashboard

1. Vai su [partners.shopify.com](https://partners.shopify.com)
2. Seleziona la tua app
3. Compila:
   - **App listing**: Titolo, descrizione, immagini
   - **Pricing**: Gratuito o a pagamento
   - **App setup**: URLs, webhook secret
   - **Distribution**: Pubblico o privato

## Step 4: App Store listing requirements

- [ ] Icona app (1200x1200 PNG)
- [ ] Screenshot desktop (2880x1800 PNG)
- [ ] Screenshot mobile (1290x2796 PNG)
- [ ] Video promozionale (opzionale)
- [ ] Descrizione dettagliata
- [ ] Privacy policy URL
- [ ] Supporto URL

## Step 5: Review e pubblicazione

1. Clicca "Submit for review"
2. Attendi approvazione (3-7 giorni lavorativi)
3. Rispondi a eventuali richieste modifiche
4. Una volta approvata: "Publish to App Store"

## 🚨 Checklist GDPR/Compliance

- [ ] Privacy policy aggiornata
- [ ] GDPR Consent Mode implementato ✓
- [ ] Data deletion webhook implementati ✓
- [ ] Customer data request handler ✓
- [ ] App Store preview screenshots pronti

## 📚 Risorse

- [Shopify App Store guidelines](https://shopify.dev/docs/apps/launch/app-store)
- [App review checklist](https://shopify.dev/docs/apps/launch/app-store/review)
- [GDPR requirements](https://shopify.dev/docs/apps/build/privacy-law-compliance)
