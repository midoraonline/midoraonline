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
    rating: number; // 1 to 5 stars
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

export type EventListener<K extends EventKey> = (payload: AnalyticsEvents[K]) => void | Promise<void>;