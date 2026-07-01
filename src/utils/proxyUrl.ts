export function getProxiedWebsiteUrl(websiteUrl: string): string {
  return `/api/proxy?url=${encodeURIComponent(websiteUrl)}`;
}

export function getWebsiteFrameUrl(websiteUrl: string, useProxy: boolean): string {
  return useProxy ? getProxiedWebsiteUrl(websiteUrl) : websiteUrl;
}
