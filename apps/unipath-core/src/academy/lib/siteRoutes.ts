export const PUBLIC_SITE_ORIGIN = "https://inkluone.info";

export const siteHomePath = (slug: string) => `/c/${slug}`;

export const siteLoginPath = (slug: string) => `/c/${slug}/login`;

export const sitePagePath = (slug: string, pageSlug: string) => `/c/${slug}/${pageSlug}`;

export const siteHomeUrl = (slug: string) => `${PUBLIC_SITE_ORIGIN}${siteHomePath(slug)}`;

export const sitePageUrl = (slug: string, pageSlug: string) => `${PUBLIC_SITE_ORIGIN}${sitePagePath(slug, pageSlug)}`;