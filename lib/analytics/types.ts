// Base system metadata appended to every payload
export type SystemMetadata = {
  actorId?: string;
  sessionId: string;
};

export type AnalyticsEvents = {
  'marketplace:search': SystemMetadata & {
    query?: string;
    category?: string;
    locationFilter?: string;
    resultCount: number;
    verifiedCount: number;
  };

  'listing:published': SystemMetadata & {
    productId: string;
    shopId: string;
    category: string;
    listingQualityScore: number;
    hasPhotos: boolean;
    hasPrice: boolean;
    hasLocation: boolean;
    descriptionLength: number;
  };

  'listing:viewed': SystemMetadata & {
    productId: string;
    shopId: string;
    category: string;
    hasDiscount: boolean;
    discountPercentage?: number;
    publishedAt: number;
  };

  'conversion:whatsapp_click': SystemMetadata & {
    productId?: string;
    shopId: string;
    category?: string;
    hasDiscount?: boolean;
    clickSource: 'product_detail' | 'shop_page' | 'search_result';
  };

  'listing:favorited': SystemMetadata & {
    productId: string;
    shopId: string;
    category: string;
  };

  'listing:unfavorited': SystemMetadata & {
    productId: string;
    shopId: string;
  };

  'shop:viewed': SystemMetadata & {
    shopId: string;
  };

  'shop:followed': SystemMetadata & {
    shopId: string;
  };

  'shop:unfollowed': SystemMetadata & {
    shopId: string;
  };

  'merchant:verification_started': SystemMetadata & {
    merchantId?: string;
    shopId?: string;
    stage?: number;
  };

  'merchant:verification_submitted': SystemMetadata & {
    merchantId: string;
    shopId: string;
    documentTypes: string[];
  };

  'merchant:verification_completed': SystemMetadata & {
    merchantId: string;
    shopId: string;
    status: 'approved' | 'rejected';
    rejectionReason?: string;
  };

  'merchant:chat_response_logged': SystemMetadata & {
    shopId: string;
    productId?: string;
    didRespond: boolean;
    perceivedResponseTimeHours?: number;
  };

  'trust:rating_prompted': SystemMetadata & {
    shopId: string;
    productId?: string;
  };

  'trust:rating_submitted': SystemMetadata & {
    shopId: string;
    productId?: string;
    rating: number;
    reviewText?: string;
  };

  'trust:report_submitted': SystemMetadata & {
    targetType: 'opportunity' | 'shop' | 'service' | 'product';
    targetId: string;
    shopId: string;
    category?: string;
    reason: 'scam' | 'inaccurate_info' | 'prohibited_item' | 'unresponsive' | 'other';
  };
};

export type EventKey = keyof AnalyticsEvents;

export type EventListener<K extends EventKey> = (
  payload: AnalyticsEvents[K],
) => void | Promise<void>;

// How each event maps onto the generic {target_type, target_id, properties}
// wire shape ingested by POST /api/v1/analytics/events. `properties` is
// whatever's left after sessionId/actorId/target fields are extracted.
export const EVENT_TARGET_MAP: {
  [K in EventKey]: {
    targetType: string | null;
    getTargetId: (p: AnalyticsEvents[K]) => string | null;
  };
} = {
  'marketplace:search': { targetType: null, getTargetId: () => null },
  'listing:published': { targetType: 'product', getTargetId: (p) => p.productId },
  'listing:viewed': { targetType: 'product', getTargetId: (p) => p.productId },
  'conversion:whatsapp_click': {
    targetType: 'product',
    getTargetId: (p) => p.productId ?? p.shopId,
  },
  'listing:favorited': { targetType: 'product', getTargetId: (p) => p.productId },
  'listing:unfavorited': { targetType: 'product', getTargetId: (p) => p.productId },
  'shop:viewed': { targetType: 'shop', getTargetId: (p) => p.shopId },
  'shop:followed': { targetType: 'shop', getTargetId: (p) => p.shopId },
  'shop:unfollowed': { targetType: 'shop', getTargetId: (p) => p.shopId },
  'merchant:verification_started': {
    targetType: 'shop',
    getTargetId: (p) => p.shopId ?? null,
  },
  'merchant:verification_submitted': {
    targetType: 'shop',
    getTargetId: (p) => p.shopId,
  },
  'merchant:verification_completed': {
    targetType: 'shop',
    getTargetId: (p) => p.shopId,
  },
  'merchant:chat_response_logged': {
    targetType: 'shop',
    getTargetId: (p) => p.shopId,
  },
  'trust:rating_prompted': { targetType: 'shop', getTargetId: (p) => p.shopId },
  'trust:rating_submitted': { targetType: 'shop', getTargetId: (p) => p.shopId },
  'trust:report_submitted': { targetType: 'target', getTargetId: (p) => p.targetId },
};
