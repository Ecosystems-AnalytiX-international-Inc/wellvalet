const RAKUTEN_WELLVALET_ID = "RAKUTEN_WELLVALET_ID";
const WALMART_CA_MID       = "WALMART_CA_MID";
const IMPACT_WELLVALET_ID  = "IMPACT_WELLVALET_ID";
const HELLOFRESH_AFFILIATE = "HELLOFRESH_AFFILIATE";

export type DeliveryPlatform = "walmart" | "instacart" | "hellofresh";

export function generateAffiliateUrl(platform: DeliveryPlatform): string {
  switch (platform) {
    case "walmart":
      return (
        `https://click.linksynergy.com/deeplink` +
        `?id=${RAKUTEN_WELLVALET_ID}` +
        `&mid=${WALMART_CA_MID}` +
        `&murl=${encodeURIComponent("https://www.walmart.ca/en/grocery")}`
      );
    case "instacart":
      return (
        `https://www.instacart.ca/store/shopping_lists` +
        `?utm_source=affiliate&utm_medium=app&utm_campaign=wellvalet_shopping_list` +
        `&impact_id=${IMPACT_WELLVALET_ID}`
      );
    case "hellofresh":
      return (
        `https://www.hellofresh.ca/plans` +
        `?c=${HELLOFRESH_AFFILIATE}&utm_source=affiliate&utm_medium=app&utm_campaign=wellvalet`
      );
    default:
      return "https://www.wellvalet.com";
  }
}

export function formatListForPlatform(items: string[], platform: DeliveryPlatform): string {
  const cleaned = items
    .map(item => item.replace(/^[•\-\*]\s*/, "").trim())
    .filter(item => item.length > 0);
  switch (platform) {
    case "walmart":
    case "instacart":
      return cleaned.join("\n");
    case "hellofresh":
      return cleaned.join(", ");
    default:
      return cleaned.join("\n");
  }
}

import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export const PLATFORM_INFO: Record<DeliveryPlatform, {
  label: string; iconName: IoniconName; color: string;
  description: string; cookie: string; commission: string;
}> = {
  walmart:    { label: "Walmart Canada", iconName: "cart-outline",       color: "#0071CE", description: "Grocery delivery from Walmart.ca",        cookie: "4 days",  commission: "2–4% on orders" },
  instacart:  { label: "Instacart",      iconName: "basket-outline",     color: "#43B02A", description: "1-hour delivery from local stores",       cookie: "14 days", commission: "C$5–10 new · 3% repeat" },
  hellofresh: { label: "HelloFresh",     iconName: "restaurant-outline", color: "#99CC00", description: "Meal kits with fresh ingredients",        cookie: "30 days", commission: "C$10–20 per signup" },
};
