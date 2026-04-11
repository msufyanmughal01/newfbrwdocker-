import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://easydigitalinvoice.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Allow major search engines full access to public pages
        userAgent: ['Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot', 'Baiduspider', 'YandexBot'],
        allow: ['/', '/login', '/forgot-password', '/reset-password'],
        disallow: [
          '/dashboard',
          '/invoices',
          '/settings',
          '/clients',
          '/members',
          '/spreadsheet',
          '/sandbox',
          '/admin',
          '/api/',
          '/_next/',
        ],
      },
      {
        // Same rules for all other bots
        userAgent: '*',
        allow: ['/', '/login', '/forgot-password', '/reset-password'],
        disallow: [
          '/dashboard',
          '/invoices',
          '/settings',
          '/clients',
          '/members',
          '/spreadsheet',
          '/sandbox',
          '/admin',
          '/api/',
          '/_next/',
        ],
      },
      {
        // Block AI training crawlers — protect business data
        userAgent: ['GPTBot', 'ChatGPT-User', 'CCBot', 'anthropic-ai', 'Claude-Web'],
        disallow: ['/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
