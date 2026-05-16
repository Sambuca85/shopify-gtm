# GTM Advanced Tracking - Shopify App

Un'applicazione Shopify SaaS professionale per il tracking ecommerce avanzato tramite Google Tag Manager, GA4, Meta Pixel, TikTok Pixel e Pinterest Tag.

## Caratteristiche

### 🎯 Tracking Ecommerce Completo
- **GA4 Ecommerce Events**: view_item, view_item_list, add_to_cart, begin_checkout, purchase, e molti altri
- **Meta Pixel**: Tracking completo con Conversion API lato server
- **TikTok Pixel**: Eventi e-commerce con Events API
- **Pinterest Tag**: Tracking conversioni Pinterest

### 🔒 GDPR & Consent Mode
- Google Consent Mode v2 integrato
- Shopify Customer Privacy API
- Banner cookie personalizzabili
- Geolocalizzazione per regioni specifiche

### 🚀 Architettura Moderna
- **Theme App Extension**: Iniezione automatica GTM nel tema
- **Web Pixel Extension**: Tracking eventi checkout con Customer Events API
- **Server-Side Tracking**: Meta CAPI, TikTok Events API, GA4 Measurement Protocol
- **Real-time Debugger**: Monitoraggio eventi in tempo reale

### 💼 Enterprise Features
- Multi-currency support
- Multi-language support
- Shopify Markets compatible
- Event deduplication
- Retry logic per eventi falliti
- Queue system per alto volume

## Stack Tecnologico

- **Framework**: Remix + Shopify App Remix Template
- **Database**: PostgreSQL + Prisma ORM
- **UI**: Shopify Polaris + App Bridge
- **Extensions**: Theme App Extension + Web Pixel Extension
- **API**: Shopify Admin API, Customer Events API, Web Pixels API

## Installazione

### 1. Prerequisiti
```bash
# Node.js >= 18
node -v

# PostgreSQL
psql --version

# Shopify CLI
npm install -g @shopify/cli
```

### 2. Setup Iniziale
```bash
# Clona il repository
git clone https://github.com/your-org/gtm-tracking-app.git
cd gtm-tracking-app

# Installa dipendenze
npm install

# Configura ambiente
cp .env.example .env
# Edita .env con le tue credenziali
```

### 3. Configurazione Database
```bash
# Genera Prisma client
npm run prisma:generate

# Esegui migrazioni
npm run prisma:migrate

# (Opzionale) Seed database
npm run prisma:seed
```

### 4. Configurazione Shopify CLI
```bash
# Linka l'app a Shopify Partners
shopify app config link

# Esegui in development
npm run dev
```

### 5. Deploy Extensions
```bash
# Deploy Theme App Extension
shopify extension deploy --path extensions/theme-app-extension

# Deploy Web Pixel Extension
shopify extension deploy --path extensions/web-pixel-extension
```

## Configurazione

### Variabili d'Ambiente

```env
# Shopify
SHOPIFY_API_KEY=tu_api_key
SHOPIFY_API_SECRET=tu_api_secret
SHOPIFY_APP_URL=https://tua-app.com
SCOPES=read_products,read_orders,read_customers,write_pixels,read_pixels,write_themes,read_themes

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/gtm_tracking

# GTM Default
GTM_DEFAULT_CONTAINER_ID=GTM-XXXXXX

# Server-Side Tracking (opzionale)
GA4_API_SECRET=your_ga4_secret
META_CONVERSION_API_TOKEN=your_meta_token
TIKTOK_EVENTS_API_TOKEN=your_tiktok_token

# Redis (opzionale, per event queue)
REDIS_URL=redis://localhost:6379
```

## Utilizzo

### Configurazione App

1. **Installa l'app** dal Shopify App Store
2. **Accedi alla Dashboard** e clicca "Configura GTM"
3. **Inserisci il Container ID** (es. GTM-ABC123)
4. **Attiva i pixels** desiderati (GA4, Meta, TikTok, Pinterest)
5. **Configura Consent Mode** se necessario per GDPR

### Eventi Tracciati Automaticamente

| Evento | GA4 | Meta | TikTok | Pinterest |
|--------|-----|------|--------|-----------|
| page_view | ✅ | ✅ | ✅ | ✅ |
| view_item | ✅ | ✅ | ✅ | ✅ |
| view_item_list | ✅ | ✅ | ✅ | ✅ |
| add_to_cart | ✅ | ✅ | ✅ | ✅ |
| remove_from_cart | ✅ | ❌ | ❌ | ❌ |
| view_cart | ✅ | ❌ | ❌ | ✅ |
| begin_checkout | ✅ | ✅ | ✅ | ✅ |
| add_shipping_info | ✅ | ❌ | ❌ | ❌ |
| add_payment_info | ✅ | ❌ | ❌ | ❌ |
| purchase | ✅ | ✅ | ✅ | ✅ |
| search | ✅ | ✅ | ✅ | ✅ |
| add_to_wishlist | ✅ | ✅ | ❌ | ❌ |
| generate_lead | ✅ | ✅ | ✅ | ❌ |

### API JavaScript

```javascript
// Accesso globale agli helper
gtmEcommerce.viewItem(product);
gtmEcommerce.addToCart(product, quantity);
gtmEcommerce.beginCheckout(cart);
gtmEcommerce.purchase(order);

// Gestione consenso
gtmConsent.updateConsent({
  analytics: true,
  marketing: false,
  preferences: true,
  saleOfData: false
});
```

## Server-Side Tracking

### Meta Conversion API

Configura in Settings:
- Meta Pixel ID
- Meta Access Token (da Business Manager)
- Test Event Code (opzionale per testing)

### TikTok Events API

Configura in Settings:
- TikTok Pixel ID
- TikTok Access Token

### GA4 Measurement Protocol

Configura:
- GA4 Measurement ID
- GA4 API Secret (da GA4 Admin)

## GDPR Compliance

### Consent Mode v2

L'app implementa Google Consent Mode v2 con supporto per:
- `ad_storage`
- `analytics_storage`
- `ad_user_data`
- `ad_personalization`

### Implementazione Banner Cookie

```javascript
// Esempio implementazione banner
document.addEventListener('DOMContentLoaded', function() {
  // Verifica consenso esistente
  const consent = localStorage.getItem('gtm_consent');
  
  if (!consent) {
    // Mostra banner
    showCookieBanner();
  }
});

function acceptCookies() {
  gtmConsent.updateConsent({
    analytics: true,
    marketing: true,
    preferences: true,
    saleOfData: true
  });
  
  localStorage.setItem('gtm_consent', JSON.stringify({
    analytics: true,
    marketing: true,
    preferences: true,
    saleOfData: true
  }));
}
```

## Debug & Testing

### Debug Mode

Abilita "Debug Mode" nelle impostazioni per:
- Logging console di tutti gli eventi
- Visualizzazione payload dataLayer
- Test tracking senza inviare dati reali

### Preview GTM

Usa l'anteprima di Google Tag Manager:
1. Apri https://tagmanager.google.com
2. Clicca "Anteprima"
3. Inserisci URL del tuo negozio
4. Verifica firing dei tag

### Event Debugger

Accedi alla sezione "Debug" nella dashboard app per:
- Visualizzare eventi in tempo reale
- Esportare payload JSON
- Verificare stato invio eventi

## Troubleshooting

### GTM non si carica
- Verifica Container ID (formato: GTM-XXXXXX)
- Controlla se Theme App Extension è installata
- Verifica console browser per errori JS

### Eventi non tracciati
- Verifica che tracking sia abilitato
- Controlla Consent Mode settings
- Verifica Web Pixel Extension status

### Server-side tracking non funziona
- Verifica access tokens
- Controlla log in dashboard
- Verifica rate limits API

## API Reference

### REST API

#### POST /api/tracking
Invia evento tracking personalizzato

```json
{
  "event": "custom_event",
  "payload": {
    "custom_param": "value"
  },
  "shopDomain": "tuo-negozio.myshopify.com"
}
```

#### GET /api/tracking?shop=domain
Recupera configurazione tracking per shop

### Webhook Events

L'app gestisce automaticamente:
- `orders/create`, `orders/paid`, `orders/cancelled`
- `products/create`, `products/update`, `products/delete`
- `carts/create`, `carts/update`
- `customers/create`, `customers/update`
- `app/uninstalled`

## Contributing

1. Fork il repository
2. Crea branch feature (`git checkout -b feature/amazing-feature`)
3. Commit cambiamenti (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Apri Pull Request

## License

MIT License - vedi [LICENSE](LICENSE) per dettagli.

## Supporto

- **Documentazione**: https://docs.gtm-tracking.app
- **Supporto**: support@gtm-tracking.app
- **Community**: https://community.gtm-tracking.app

## Roadmap

- [ ] Snapchat Pixel integration
- [ ] Twitter Pixel integration
- [ ] LinkedIn Insight Tag
- [ ] Advanced attribution modeling
- [ ] Machine learning anomaly detection
- [ ] Multi-touch attribution
- [ ] Custom event builder UI

---

**Made with ❤️ for the Shopify community**
