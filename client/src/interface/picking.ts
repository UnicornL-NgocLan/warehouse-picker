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

export type Move = {
  id: number;
  product: Ref;
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
};

export type UpdateMoveLinePayload = {
  locationId?: number;
  lotId?: number | null;
  qtyDone?: number | string;
  imageUrls?: string[];
};

export type GetPickingsResponse = {
  items: Picking[];
  hasMore: boolean;
};

