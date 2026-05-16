import '@shopify/shopify-app-remix/adapters/node';
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from '@shopify/shopify-app-remix/server';
import { PrismaSessionStorage } from '@shopify/shopify-app-session-storage-prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  apiVersion: ApiVersion.January24,
  scopes: process.env.SCOPES?.split(',') || [
    'read_products',
    'read_orders',
    'read_customers',
    'write_pixels',
    'read_pixels',
    'write_themes',
    'read_themes',
    'write_script_tags',
    'read_script_tags',
    'write_checkout_ui_extensions',
  ],
  appUrl: process.env.SHOPIFY_APP_URL!,
  authPathPrefix: '/auth',
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
  },
  hooks: {
    afterAuth: async ({ session }) => {
      // Create or update shop record
      await prisma.shop.upsert({
        where: { shopifyDomain: session.shop },
        create: {
          shopifyDomain: session.shop,
          name: session.shop.replace('.myshopify.com', ''),
          email: '',
          plan: 'unknown',
          installedAt: new Date(),
        },
        update: {
          isActive: true,
          uninstalledAt: null,
        },
      });

      // Initialize default settings if not exists
      const existingSettings = await prisma.shopSettings.findFirst({
        where: { shop: { shopifyDomain: session.shop } },
      });

      if (!existingSettings) {
        const shop = await prisma.shop.findUnique({
          where: { shopifyDomain: session.shop },
        });
        
        if (shop) {
          await prisma.shopSettings.create({
            data: {
              shopId: shop.id,
              gtmContainerId: process.env.GTM_DEFAULT_CONTAINER_ID || null,
              enabled: true,
              debugMode: false,
              consentMode: true,
              serverSideTracking: false,
            },
          });
        }
      }

      // Register webhooks
      shopify.registerWebhooks({ session });
    },
  },
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: 'http',
      callbackUrl: '/api/webhooks/app-uninstalled',
      callback: async (topic, shop, body, webhookId) => {
        console.log(`App uninstalled from ${shop}`);
        
        await prisma.shop.update({
          where: { shopifyDomain: shop },
          data: {
            isActive: false,
            uninstalledAt: new Date(),
          },
        });

        await prisma.webhookLog.create({
          data: {
            shopId: (await prisma.shop.findUnique({ where: { shopifyDomain: shop } }))?.id || '',
            topic,
            payload: JSON.parse(body),
            status: 'SUCCESS',
          },
        });
      },
    },
    CUSTOMERS_DATA_REQUEST: {
      deliveryMethod: 'http',
      callbackUrl: '/api/webhooks/customer-data-request',
      callback: async (topic, shop, body, webhookId) => {
        console.log(`Customer data request for ${shop}`);
        // GDPR compliance - handle data request
      },
    },
    CUSTOMERS_REDACT: {
      deliveryMethod: 'http',
      callbackUrl: '/api/webhooks/customer-redact',
      callback: async (topic, shop, body, webhookId) => {
        console.log(`Customer redact for ${shop}`);
        // GDPR compliance - handle customer data deletion
      },
    },
    SHOP_REDACT: {
      deliveryMethod: 'http',
      callbackUrl: '/api/webhooks/shop-redact',
      callback: async (topic, shop, body, webhookId) => {
        console.log(`Shop redact for ${shop}`);
        // GDPR compliance - handle shop data deletion
      },
    },
  },
});

export default shopify;
export const apiVersion = ApiVersion.January24;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
