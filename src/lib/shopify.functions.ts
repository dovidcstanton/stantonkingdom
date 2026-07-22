import { createServerFn } from "@tanstack/react-start";

export type ShopifyProduct = {
  name: string;
  category: string;
  type: string;
  style: string;
  shape: string;
  price: number;
  date: string;
  img: string;
  desc: string;
  url?: string;
};

export const fetchShopifyProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<ShopifyProduct[] | null> => {
    const domain = process.env.SHOPIFY_DOMAIN;
    const token = process.env.SHOPIFY_STOREFRONT_TOKEN;
    if (!domain || !token) return null;

    const query = `{products(first:250){edges{node{
      title description handle createdAt tags onlineStoreUrl
      featuredImage{url}
      priceRange{minVariantPrice{amount currencyCode}}
    }}}}`;

    try {
      const r = await fetch(`https://${domain}/api/2024-07/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": token,
        },
        body: JSON.stringify({ query }),
      });
      const data = await r.json();
      const tag = (tags: string[], k: string) => {
        const t = tags.find((x) => x.toLowerCase().startsWith(k + ":"));
        return t ? t.slice(k.length + 1).trim() : "";
      };
      return (data.data?.products?.edges ?? []).map(({ node: n }: any) => ({
        name: n.title,
        category: tag(n.tags, "category"),
        type: tag(n.tags, "type"),
        style: tag(n.tags, "style"),
        shape: tag(n.tags, "shape"),
        price: Math.round(parseFloat(n.priceRange.minVariantPrice.amount)),
        date: n.createdAt.slice(0, 10),
        img: n.featuredImage?.url ?? "",
        desc: (n.description || "").slice(0, 90),
        url: n.onlineStoreUrl || `https://${domain}/products/${n.handle}`,
      }));
    } catch {
      return null;
    }
  },
);
