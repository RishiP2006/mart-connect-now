// Shopify Storefront API helpers and types

export const SHOPIFY_API_VERSION = '2025-07';
export const SHOPIFY_STORE_PERMANENT_DOMAIN = 'mart-connect-now-ozguo.myshopify.com';
export const SHOPIFY_STOREFRONT_TOKEN = 'e96f15bb99fa3bd3ebcd9682b4aaca17';
export const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;

export interface ShopifyImageEdge {
  node: {
    url: string;
    altText: string | null;
  };
}

export interface ShopifyVariantEdge {
  node: {
    id: string;
    title: string;
    availableForSale: boolean;
    price: {
      amount: string;
      currencyCode: string;
    };
    selectedOptions: Array<{
      name: string;
      value: string;
    }>;
  };
}

export interface ShopifyProductNode {
  id: string;
  title: string;
  description: string;
  handle: string;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  images: { edges: ShopifyImageEdge[] };
  variants: { edges: ShopifyVariantEdge[] };
  options: Array<{ name: string; values: string[] }>;
}

export interface ShopifyProduct {
  node: ShopifyProductNode;
}

export async function storefrontApiRequest(query: string, variables: any = {}) {
  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Shopify error ${response.status}: ${text}`);
  }

  const data = await response.json();
  if (data.errors) {
    throw new Error(data.errors.map((e: any) => e.message).join(', '));
  }
  return data;
}

const CART_CREATE_MUTATION = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        totalQuantity
        cost { totalAmount { amount currencyCode } }
        lines(first: 100) {
          edges { node { id quantity merchandise { ... on ProductVariant { id title price { amount currencyCode } product { title handle } } } } }
        }
      }
      userErrors { field message }
    }
  }
`;

export async function createStorefrontCheckout(items: Array<{ variantId: string; quantity: number }>): Promise<string> {
  const lines = items.map((item) => ({ quantity: item.quantity, merchandiseId: item.variantId }));
  const cartData = await storefrontApiRequest(CART_CREATE_MUTATION, { input: { lines } });

  const errors = cartData?.data?.cartCreate?.userErrors || [];
  if (errors.length) {
    throw new Error(`Cart creation failed: ${errors.map((e: any) => e.message).join(', ')}`);
  }

  const checkoutUrl: string | undefined = cartData?.data?.cartCreate?.cart?.checkoutUrl;
  if (!checkoutUrl) throw new Error('No checkout URL returned from Shopify');

  const url = new URL(checkoutUrl);
  url.searchParams.set('channel', 'online_store');
  return url.toString();
}

const PRODUCT_BY_HANDLE_QUERY = `
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      title
      description
      handle
      priceRange { minVariantPrice { amount currencyCode } }
      images(first: 8) { edges { node { url altText } } }
      variants(first: 20) {
        edges {
          node {
            id
            title
            availableForSale
            price { amount currencyCode }
            selectedOptions { name value }
          }
        }
      }
      options { name values }
    }
  }
`;

export async function fetchProductByHandle(handle: string): Promise<ShopifyProductNode | null> {
  const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
  return data?.data?.product ?? null;
}
