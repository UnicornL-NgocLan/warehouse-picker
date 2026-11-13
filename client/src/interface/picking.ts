export type Ref = {
  id: number;
  name: string;
};

export type Picking = {
  id: number;
  name: string;
  partner: Ref | null;
  state: string;
  hasReserved?: boolean;
};

export type ProductRef = Ref & {
  barcode?: string | null;
};

export type Move = {
  id: number;
  product: ProductRef;
  orderedQty: number;
  orderedUom: string;
  orderedFromPicking?: boolean;
  pickedQty: number;
  pickedUom: string;
  reservedQty?: number;
  isReserved?: boolean;
  hasPackaging?: boolean;
  packaging?: Ref | null;
  packageQty?: number;
  packageQtyDone?: number;
  state?: string;
};

export type MoveLine = {
  id: number;
  locationDest: Ref;
  location: Ref;
  lot: Ref | null;
  qtyDone: number;
  uom: string;
  productId: number;
  tracking: "none" | "lot" | "serial";
  hasPackaging?: boolean;
  packageQty?: number;
  moveState?: string;
};

export type UpdateMoveLinePayload = {
  locationId?: number;
  locationDestId?: number;
  lotId?: number | null;
  qtyDone?: number | string;
  imageUrls?: string[];
  skipChatter?: boolean;
};

export type LogChatterPayload = {
  pickingId: number;
  lineId?: number;
  productName: string;
  oldRecord?: {
    qty?: number;
    lot?: string;
    location?: string;
    locationDest?: string;
  };
  newRecord?: {
    qty?: number;
    lot?: string;
    location?: string;
    locationDest?: string;
  };
  uom?: string;
  imageUrls?: string[];
  actionType?: 'update' | 'images_only';
};

export type GetPickingsResponse = {
  items: Picking[];
  hasMore: boolean;
};

export type StorableProduct = {
  id: number;
  name: string;
  barcode?: string | null;
  default_code?: string | null;
  uom?: string | null;
  uom_id?: [number, string] | null;
  tracking?: string;
};

export type StockReportChild = {
  key: string;
  name: string;
  locationId?: number;
  locationName?: string;
  lotId?: number;
  lotName?: string;
  quantity: number;
  reservedQuantity?: number;
  availableQuantity?: number;
};

export type StockReportGroup = {
  key: string;
  name?: string;
  lotId?: number;
  lotName?: string;
  locationId?: number;
  locationName?: string;
  quantity: number;
  reservedQuantity?: number;
  availableQuantity?: number;
  children: StockReportChild[];
};

export type ProductStockReport = {
  product: {
    id: number;
    name: string;
    barcode?: string | null;
    default_code?: string | null;
    uom: string;
    tracking?: string;
  };
  companyId: number;
  totalQuantity: number;
  totalReserved?: number;
  totalAvailable?: number;
  byLot: StockReportGroup[];
  byLocation: StockReportGroup[];
};


