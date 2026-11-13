export async function getUserData(odoo, uid) {
  return new Promise((resolve, reject) => {
    const params = [[["id", "=", uid]], ["id", "name", "company_ids", "company_id", "email", "partner_id"]];
    odoo.execute_kw("res.users", "search_read", [params], (err, user) => {
      if (err) {
        reject(err);
      } else {
        resolve(user);
      }
    });
  });
}

export async function getUserCompanies(odoo, user) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([["id", "in", user[0].company_ids]]);
    inParams.push(["id", "name", "short_name"]);
    inParams.push(0);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("res.company", "search_read", params, (err, companies) => {
      if (err) {
        reject(err);
      } else {
        resolve(companies);
      }
    });
  });
}

export async function getAllReadyTransport(odoo, company_id) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([
      ["company_id", "=", parseInt(company_id)],
      ["state", "in", ["ready", "start"]],
    ]);
    inParams.push(["id", "name", "state", "vehicle_id", "sea_driver_id"]);
    inParams.push(0); //offset
    const params = [];
    params.push(inParams);
    odoo.execute_kw("sea.transport", "search_read", params, (err, assets) => {
      if (err) {
        reject(err);
      } else {
        resolve(assets);
      }
    });
  });
}

export async function getAllActiveTransport(odoo, company_id) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([
      ["company_id", "=", parseInt(company_id)],
      ["state", "=", "start"],
    ]);
    inParams.push(["id", "name", "state", "vehicle_id", "date_start_actual", "sea_driver_id"]);
    inParams.push(0); //offset
    inParams.push(1); //limit
    const params = [];
    params.push(inParams);
    odoo.execute_kw("sea.transport", "search_read", params, (err, assets) => {
      if (err) {
        reject(err);
      } else {
        resolve(assets);
      }
    });
  });
}

export async function getAllMyTransports(odoo, company_id) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([
      ["company_id", "=", parseInt(company_id)],
      ["state", "in", ["start", "done", "cancel"]],
    ]);
    inParams.push(["id", "name", "state", "vehicle_id", "date_start_actual", "sea_driver_id"]);
    inParams.push(0);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("sea.transport", "search_read", params, (err, assets) => {
      if (err) {
        reject(err);
      } else {
        resolve(assets);
      }
    });
  });
}

export async function getAllTransportLine(odoo, id, getAll = false) {
  const condition = getAll ? ["ready", "start", "done", "cancel"] : ["ready", "start"];
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([
      ["transport_id", "=", parseInt(id)],
      ["state", "in", condition],
    ]);
    inParams.push(["id", "name", "state", "item_type", "partner_id", "address_start", "address_end", "transport_id", "date_end_actual", "note", "picking_id", "origin"]);
    inParams.push(0);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("sea.transport.line", "search_read", params, (err, assets) => {
      if (err) {
        reject(err);
      } else {
        resolve(assets);
      }
    });
  });
}

export async function getAllTransportLineJustStateAndSequence(odoo, id) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([["transport_id", "=", parseInt(id)]]);
    inParams.push(["id", "sequence", "state"]);
    inParams.push(0);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("sea.transport.line", "search_read", params, (err, assets) => {
      if (err) {
        reject(err);
      } else {
        resolve(assets);
      }
    });
  });
}

export async function getSeaDriver(odoo, id, company_id) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([
      ["company_id", "=", parseInt(company_id)],
      ["partner_id", "=", parseInt(id)],
    ]);
    inParams.push(["id"]);
    inParams.push(0);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("sea.driver", "search_read", params, (err, assets) => {
      if (err) {
        reject(err);
      } else {
        resolve(assets);
      }
    });
  });
}

export async function getAllSeaDriver(odoo, company_id) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([["company_id", "=", parseInt(company_id)]]);
    inParams.push(["id", "name"]);
    inParams.push(0);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("sea.driver", "search_read", params, (err, assets) => {
      if (err) {
        reject(err);
      } else {
        resolve(assets);
      }
    });
  });
}

export async function checkCurrentTransportLineIsDone(odoo, id) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([
      ["id", "=", parseInt(id)],
      ["state", "in", ["done", "cancel", "ready"]],
    ]);
    inParams.push(["id"]);
    inParams.push(0);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("sea.transport.line", "search_read", params, (err, assets) => {
      if (err) {
        reject(err);
      } else {
        resolve(assets);
      }
    });
  });
}

export async function checkCurrentTransportLineIsReady(odoo, id) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([
      ["id", "=", parseInt(id)],
      ["state", "in", ["done", "cancel", "start"]],
    ]);
    inParams.push(["id"]);
    inParams.push(0);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("sea.transport.line", "search_read", params, (err, assets) => {
      if (err) {
        reject(err);
      } else {
        resolve(assets);
      }
    });
  });
}

export async function getAllVehicles(odoo, company_id) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([["active", "=", true]]);
    inParams.push(["license_plate", "brand_id", "odometer", "is_on_mission", "image"]);
    inParams.push(0);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("fleet.vehicle", "search_read", params, (err, assets) => {
      if (err) {
        reject(err);
      } else {
        resolve(assets);
      }
    });
  });
}

export async function getAllOdometers(odoo, vehicle_id) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([["vehicle_id", "=", parseInt(vehicle_id)]]);
    inParams.push(["date", "value", "vehicle_id", "create_uid"]);
    inParams.push(0);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("fleet.vehicle.odometer", "search_read", params, (err, assets) => {
      if (err) {
        reject(err);
      } else {
        resolve(assets);
      }
    });
  });
}

export async function getAllWarningReminder(odoo, company_id) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([["company_id", "=", parseInt(company_id)]]);
    inParams.push(["id", "state", "vehicle_id"]);
    inParams.push(0);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("vehicle.service.reminder", "search_read", params, (err, assets) => {
      if (err) {
        reject(err);
      } else {
        resolve(assets);
      }
    });
  });
}

export async function getAllReminders(odoo, vehicle_id) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([["vehicle_id", "=", parseInt(vehicle_id)]]);
    inParams.push(["id", "state", "due_odometer", "name"]);
    inParams.push(0);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("vehicle.service.reminder", "search_read", params, (err, assets) => {
      if (err) {
        reject(err);
      } else {
        resolve(assets);
      }
    });
  });
}

export async function getTransportLineImages(odoo, transport_line_id) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([["transport_line_id", "=", parseInt(transport_line_id)]]);
    inParams.push([]);
    inParams.push(0);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("sea.transport.line.image", "search_read", params, (err, images) => {
      if (err) {
        reject(err);
      } else {
        resolve(images);
      }
    });
  });
}

export async function getFuelLogList(odoo, vehicle_id) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([["vehicle_id", "=", parseInt(vehicle_id)]]);
    inParams.push(["id", "liter", "is_full", "date", "odometer", "amount", "create_uid", "write_uid", "created_at"]);
    inParams.push(0);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("fleet.vehicle.log.fuel", "search_read", params, (err, assets) => {
      if (err) {
        reject(err);
      } else {
        resolve(assets);
      }
    });
  });
}

export async function getPickingByQR(odoo, qrContent, companyId) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([
      ["name", "=", qrContent],
      ["company_id", "=", parseInt(companyId)],
      ["state", "in", ["confirmed", "assigned","done"]]
    ]);
    inParams.push(["id", "name", "location_id", "location_dest_id"]);
    inParams.push(0);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("stock.picking", "search_read", params, (err, pickings) => {
      if (err) reject(err);
      else resolve(pickings);
    });
  });
}

export async function getTransportWarehouses(odoo, transportId) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([["id", "=", parseInt(transportId)]]);
    inParams.push(["id", "warehouse_id", "picking_ids"]);
    inParams.push(0);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("sea.transport", "search_read", params, (err, transports) => {
      if (err) reject(err);
      else resolve(transports);
    });
  });
}

export async function getLocationWarehouses(odoo, locationIds) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([["id", "in", locationIds]]);
    inParams.push(["id", "warehouse_id"]);
    inParams.push(0);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("stock.location", "search_read", params, (err, locations) => {
      if (err) reject(err);
      else resolve(locations);
    });
  });
}

export async function getTransportById(odoo, transportId) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([["id", "=", parseInt(transportId)]]);
    inParams.push(["id", "name", "state", "vehicle_id", "sea_driver_id", "date_start_actual"]);
    inParams.push(0);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("sea.transport", "search_read", params, (err, transports) => {
      if (err) reject(err);
      else resolve(transports);
    });
  });
}

export async function getTransportLineByTransportAndPicking(odoo, transportId, pickingId) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([
      ["transport_id", "=", parseInt(transportId)],
      ["picking_id", "=", parseInt(pickingId)],
      ["state", "in", ["ready"]]
    ]);
    inParams.push(["id"]);
    inParams.push(0);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("sea.transport.line", "search_read", params, (err, lines) => {
      if (err) reject(err);
      else resolve(lines);
    });
  });
}

export async function checkActiveTransportLineForPicking(odoo, pickingId,transport_id) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([
      ["picking_id", "=", parseInt(pickingId)],
      ["state", "!=", "cancel"],
      ["transport_id", "=", parseInt(transport_id)]
    ]);
    inParams.push(["id"]);
    inParams.push(0);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("sea.transport.line", "search_read", params, (err, lines) => {
      if (err) reject(err);
      else resolve(lines);
    });
  });
}

export async function getTransportLineDetailsById(odoo, line_id) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([["id", "=", parseInt(line_id)]]);
    inParams.push(["id", "picking_id", "partner_id", "transport_id", "date_end_actual", "address_end"]);
    inParams.push(0);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("sea.transport.line", "search_read", params, (err, assets) => {
      if (err) reject(err);
      else resolve(assets);
    });
  });
}

export async function getSeaDriversByIds(odoo, ids) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([["id", "in", ids]]);
    inParams.push(["id", "name"]);
    inParams.push(0);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("sea.driver", "search_read", params, (err, assets) => {
      if (err) reject(err);
      else resolve(assets);
    });
  });
}

export async function getStockPickingByName(odoo, name) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([["name", "=", name]]);
    inParams.push(["id", "name", "partner_id", "location_dest_id","location_id"]);
    inParams.push(0);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("stock.picking", "search_read", params, (err, pickings) => {
      if (err) reject(err);
      else resolve(pickings);
    });
  });
}

export async function getWarehouseById(odoo, warehouseId) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([["id", "=", parseInt(warehouseId)]]);
    inParams.push(["id", "partner_id", "is_consignment_warehouse"]);
    inParams.push(0);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("stock.warehouse", "search_read", params, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

export async function getPartnerById(odoo, partnerId) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([["id", "=", parseInt(partnerId)]]);
    inParams.push(["id", "street"]);
    inParams.push(0);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("res.partner", "search_read", params, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

export async function getAvailableVehicles(odoo) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([
      ["active", "=", true],
      ["is_on_mission", "=", false],
    ]);
    inParams.push(["id", "license_plate", "brand_id", "is_on_mission"]);
    inParams.push(0);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("fleet.vehicle", "search_read", params, (err, assets) => {
      if (err) reject(err);
      else resolve(assets);
    });
  });
}

export async function getAvailableSeaDrivers(odoo, company_id) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([
      ["company_id", "=", parseInt(company_id)],
      ["is_on_mission", "=", false],
    ]);
    inParams.push(["id", "name", "partner_id", "is_on_mission"]);
    inParams.push(0);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("sea.driver", "search_read", params, (err, assets) => {
      if (err) reject(err);
      else resolve(assets);
    });
  });
}

export async function getAllActiveWarehouses(odoo) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([["active", "=", true]]);
    inParams.push(["id", "name"]);
    inParams.push(0);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("stock.warehouse", "search_read", params, (err, warehouses) => {
      if (err) reject(err);
      else resolve(warehouses);
    });
  });
}

export async function searchReadPickings(odoo, domain, fields, offset = 0, limit = 30) {
  return new Promise((resolve, reject) => {
    const fetchLimit = parseInt(limit, 10) + 1;
    const fetchOffset = parseInt(offset, 10) || 0;
    const queryDomain = domain && domain.length > 0 ? domain : [["state", "not in", ["cancel", "done", "draft"]]];
    const queryFields = fields && fields.length > 0 ? fields : ["name", "partner_id", "state"];

    const inParams = [
      queryDomain,
      queryFields,
      fetchOffset,
      fetchLimit,
      "scheduled_date asc, id asc",
    ];
    const params = [inParams];
    odoo.execute_kw("stock.picking", "search_read", params, async (err, records) => {
      if (err) return reject(err);
      const rawRecords = records || [];
      const hasMore = rawRecords.length > limit;
      const sliced = hasMore ? rawRecords.slice(0, limit) : rawRecords;

      const pickingIds = sliced.map((p) => p.id);
      const reservedPickingIds = new Set(
        sliced
          .filter((p) => p.state === "assigned" || p.state === "partially_available")
          .map((p) => p.id)
      );

      if (pickingIds.length > 0) {
        try {
          const moveCheck = await new Promise((resM, rejM) => {
            const mParams = [
              [
                ["picking_id", "in", pickingIds],
                ["state", "in", ["assigned", "partially_available"]],
              ],
              ["id", "picking_id"],
              0,
              1000,
            ];
            odoo.execute_kw("stock.move", "search_read", [mParams], (mErr, mRecs) => {
              if (mErr) return rejM(mErr);
              resM(mRecs || []);
            });
          });
          (moveCheck || []).forEach((m) => {
            const pid = Array.isArray(m.picking_id) ? m.picking_id[0] : m.picking_id;
            if (pid) reservedPickingIds.add(pid);
          });
        } catch (mErr) {
          // Fallback to p.state check
        }
      }

      const items = sliced.map((p) => ({
        id: p.id,
        name: p.name,
        partner:
          Array.isArray(p.partner_id) && p.partner_id.length >= 2
            ? { id: p.partner_id[0], name: p.partner_id[1] }
            : null,
        state: p.state,
        hasReserved: reservedPickingIds.has(p.id),
      }));

      resolve({ items, hasMore });
    });
  });
}

export function formatLocationName(rawName) {
  if (!rawName || typeof rawName !== "string") return "";
  const parts = rawName
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  const parentName = parts[parts.length - 2];
  const selfName = parts[parts.length - 1];
  return `${parentName} / ${selfName}`;
}

// In-memory caches to dramatically speed up stock move requests
const uomCategoryCache = new Map();      // uomId    -> boolean (isUnitCat)
const productCustomUomCache = new Map(); // productId -> string | null (customUom)
const productBarcodeCache = new Map();   // productId -> string | null (barcode)
const productTrackingCache = new Map();  // productId -> string (tracking: 'none'|'lot'|'serial')

export async function getPickingMoves(odoo, pickingId) {
  const numPickingId = parseInt(pickingId, 10);

  const moveParams = [
    [["picking_id", "=", numPickingId], ["state", "!=", "cancel"]],
    [
      "id",
      "picking_id",
      "product_id",
      "product_uom_qty",
      "product_uom",
      "reserved_availability",
      "state",
      "location_id",
      "location_dest_id",
      "product_packaging",
      "package_qty",
      "package_qty_done",
    ],
    0,
    1000,
    "id asc",
  ];

  const moveLineParams = [
    [["picking_id", "=", numPickingId]],
    ["id", "move_id", "qty_done", "product_uom_qty", "package_qty"],
    0,
    2000,
  ];

  // BƯỚC 1: Chạy SONG SONG cả stock.move và stock.move.line ngay từ đầu thay vì chạy tuần tự
  const [moves, initialMoveLines] = await Promise.all([
    new Promise((resM, rejM) => {
      odoo.execute_kw("stock.move", "search_read", [moveParams], (err, res) => {
        if (err) return rejM(err);
        resM(res || []);
      });
    }),
    new Promise((resML) => {
      odoo.execute_kw("stock.move.line", "search_read", [moveLineParams], (err, res) => {
        if (err) {
          // Fallback nếu Odoo chưa đánh picking_id trực tiếp trên move line
          return resML(null);
        }
        resML(res || []);
      });
    }),
  ]);

  if (!moves || moves.length === 0) return [];

  try {
    const moveIds = moves.map((m) => m.id);
    const productIds = Array.from(new Set(moves.map((m) => m.product_id[0])));

    // Lọc ra các sản phẩm chưa có trong cache RAM
    const uncachedProductIds = productIds.filter(
      (pId) => !productCustomUomCache.has(pId) || !productBarcodeCache.has(pId)
    );

    // BƯỚC 2: Nếu chưa lấy được moveLines thì fallback lấy theo moveIds, đồng thời đọc sản phẩm chưa cache SONG SONG
    let [moveLines, productRecs] = await Promise.all([
      initialMoveLines !== null
        ? Promise.resolve(initialMoveLines)
        : moveIds.length > 0
        ? new Promise((resML) => {
            const mlParams = [
              [["move_id", "in", moveIds]],
              ["id", "move_id", "qty_done", "product_uom_qty", "package_qty"],
              0,
              2000,
            ];
            odoo.execute_kw("stock.move.line", "search_read", [mlParams], (mlErr, mlRecs) => {
              resML(mlRecs || []);
            });
          })
        : Promise.resolve([]),

      uncachedProductIds.length > 0
        ? new Promise((resP) => {
            const pParams = [
              [["id", "in", uncachedProductIds]],
              ["id", "barcode", "uom_id", "sea_unit_of_measure"],
              0,
              uncachedProductIds.length,
            ];
            odoo.execute_kw("product.product", "search_read", [pParams], (pErr, pData) => {
              resP(pData || []);
            });
          })
        : Promise.resolve([]),
    ]);

    let didAutoCreate = false;
    // BƯỚC 3: Tối ưu kiểm tra trạng thái phiếu trực tiếp từ moves (bỏ truy vấn thừa sang stock.picking)
    const isPickingActive = !moves.some((m) => m.state === "done" || m.state === "cancel");
    if (moves.length > 0 && (!moveLines || moveLines.length === 0) && isPickingActive) {
      // Ưu tiên dùng trực tiếp location_id của chính move để tránh lỗi retry địa điểm
      await Promise.all(
        moves.map((move) => {
          const hasPackaging = Boolean(
            move.product_packaging &&
              (Array.isArray(move.product_packaging) ? move.product_packaging[0] : move.product_packaging)
          );
          const moveLocId = Array.isArray(move.location_id) ? move.location_id[0] : move.location_id;
          const createVals = {
            picking_id: numPickingId,
            move_id: move.id,
            product_id: Array.isArray(move.product_id) ? move.product_id[0] : move.product_id,
            product_uom_id: Array.isArray(move.product_uom) ? move.product_uom[0] : move.product_uom,
            location_id: moveLocId || 288,
            location_dest_id: Array.isArray(move.location_dest_id) ? move.location_dest_id[0] : move.location_dest_id,
            qty_done: 0,
          };
          if (hasPackaging) {
            createVals.package_qty = 0;
          }

          return new Promise((resL) => {
            odoo.execute_kw("stock.move.line", "create", [[createVals]], (cErr, newLineId) => {
              if (cErr) {
                // Nếu location của move lỗi, thử fallback sang 288
                if (createVals.location_id !== 288) {
                  return odoo.execute_kw(
                    "stock.move.line",
                    "create",
                    [[{ ...createVals, location_id: 288 }]],
                    (cErr2, fallbackLineId) => {
                      if (cErr2) {
                        console.warn(`[AutoCreateLine] Lỗi tạo move line cho move ${move.id}:`, cErr2?.message || cErr2);
                        return resL(null);
                      }
                      resL(fallbackLineId);
                    }
                  );
                }
                console.warn(`[AutoCreateLine] Lỗi tạo move line cho move ${move.id}:`, cErr?.message || cErr);
                return resL(null);
              }
              resL(newLineId);
            });
          });
        })
      );
      didAutoCreate = true;
    }

    const pickedQtyMap = {};
    const reservedQtyMap = {};
    const pickedPackageQtyMap = {};
    (moveLines || []).forEach((ml) => {
      const mId = Array.isArray(ml.move_id) ? ml.move_id[0] : ml.move_id;
      pickedQtyMap[mId] = (pickedQtyMap[mId] || 0) + (Number(ml.qty_done) || 0);
      reservedQtyMap[mId] = (reservedQtyMap[mId] || 0) + (Number(ml.product_uom_qty) || 0);
      pickedPackageQtyMap[mId] = (pickedPackageQtyMap[mId] || 0) + (Number(ml.package_qty) || 0);
    });

    // BƯỚC 4: Lưu barcode và resolve UoM categories vào cache RAM cho sản phẩm chưa cache
    if (productRecs && productRecs.length > 0) {
      const uomIdsToFetch = [];
      productRecs.forEach((p) => {
        const rawBarcode = typeof p.barcode === "string" ? p.barcode.trim() : "";
        productBarcodeCache.set(p.id, rawBarcode || null);

        if (!productCustomUomCache.has(p.id) && p.uom_id && Array.isArray(p.uom_id)) {
          const uId = p.uom_id[0];
          if (!uomCategoryCache.has(uId)) {
            uomIdsToFetch.push(uId);
          }
        }
      });

      if (uomIdsToFetch.length > 0) {
        try {
          const uomRecs = await new Promise((resU) => {
            odoo.execute_kw(
              "uom.uom",
              "search_read",
              [[[["id", "in", Array.from(new Set(uomIdsToFetch))]], ["id", "name", "category_id"], 0, uomIdsToFetch.length]],
              (uErr, uData) => resU(uData || [])
            );
          });
          (uomRecs || []).forEach((u) => {
            const catName = u.category_id && Array.isArray(u.category_id) ? String(u.category_id[1]).toLowerCase() : "";
            const uName = u.name ? String(u.name).toLowerCase() : "";
            const isUnit = catName.includes("unit") || uName.includes("unit");
            uomCategoryCache.set(u.id, isUnit);
          });
        } catch {
          // Ignore
        }
      }

      productRecs.forEach((p) => {
        if (!productCustomUomCache.has(p.id)) {
          const uId = p.uom_id && Array.isArray(p.uom_id) ? p.uom_id[0] : null;
          const uName = p.uom_id && Array.isArray(p.uom_id) ? String(p.uom_id[1]).toLowerCase() : "";
          const isUnitCat = (uId && uomCategoryCache.get(uId)) || uName.includes("unit");
          let effectiveCustomUom = null;
          if (isUnitCat && p.sea_unit_of_measure && Array.isArray(p.sea_unit_of_measure)) {
            effectiveCustomUom = p.sea_unit_of_measure[1];
          }
          productCustomUomCache.set(p.id, effectiveCustomUom);
        }
      });
    }

    const result = moves.map((m) => {
      const defaultUom = Array.isArray(m.product_uom) ? m.product_uom[1] : "";
      const customUom = productCustomUomCache.get(m.product_id[0]);

      const hasPackaging = Boolean(
        m.product_packaging &&
          (Array.isArray(m.product_packaging) ? m.product_packaging[0] : m.product_packaging)
      );
      const packagingName =
        hasPackaging && Array.isArray(m.product_packaging) ? m.product_packaging[1] : null;

      let orderedQty = 0;
      let pickedQty = 0;
      let orderedUom = "";
      let pickedUom = "";

      if (hasPackaging) {
        orderedQty = Number(m.package_qty) || 0;
        const linesPkgDone = pickedPackageQtyMap[m.id] || 0;
        const movePkgDone = Number(m.package_qty_done) || 0;
        pickedQty = linesPkgDone > 0 ? linesPkgDone : movePkgDone;
        orderedUom = packagingName || defaultUom;
        pickedUom = packagingName || defaultUom;
      } else {
        orderedQty = Number(m.product_uom_qty) || 0;
        orderedUom = customUom || defaultUom;
        pickedQty = pickedQtyMap[m.id] || 0;
        pickedUom = customUom || defaultUom;
      }

      const reservedFromLines = Number(reservedQtyMap[m.id]) || 0;
      const reservedFromMove = Number(m.reserved_availability) || 0;
      const reservedQty = Math.max(reservedFromLines, reservedFromMove);
      const isReserved = reservedQty > 0 || m.state === "assigned" || m.state === "partially_available";

      return {
        id: m.id,
        product: {
          id: m.product_id[0],
          name: m.product_id[1],
          barcode: productBarcodeCache.get(m.product_id[0]) || null,
        },
        orderedQty: Number(orderedQty) || 0,
        orderedUom,
        orderedFromPicking: true,
        pickedQty: Number(pickedQty) || 0,
        pickedUom,
        reservedQty: Number(reservedQty) || 0,
        isReserved: Boolean(isReserved),
        hasPackaging,
        packaging:
          hasPackaging && Array.isArray(m.product_packaging)
            ? { id: m.product_packaging[0], name: m.product_packaging[1] }
            : null,
        packageQty: Number(m.package_qty) || 0,
        packageQtyDone: Number(m.package_qty_done) || 0,
        state: m.state,
      };
    });

    result.autoCreatedLines = didAutoCreate;
    return result;
  } catch (postErr) {
    throw postErr;
  }
}

export async function getMoveLines(odoo, moveId) {
  return new Promise((resolve, reject) => {
    const moveParams = [
      [["id", "=", parseInt(moveId, 10)]],
      ["id", "product_id", "product_packaging", "package_qty", "package_qty_done", "state"],
      0,
      1,
    ];
    odoo.execute_kw("stock.move", "search_read", [moveParams], async (err, moveRecords) => {
      if (err) return reject(err);
      if (!moveRecords || moveRecords.length === 0) {
        return reject(new Error("Không tìm thấy dòng điều chuyển (stock.move)"));
      }
      const move = moveRecords[0];
      const productId = move.product_id[0];

      const hasPackaging = Boolean(
        move.product_packaging &&
          (Array.isArray(move.product_packaging) ? move.product_packaging[0] : move.product_packaging)
      );
      const packagingName =
        hasPackaging && Array.isArray(move.product_packaging) ? move.product_packaging[1] : null;

      try {
        // Kiểm tra cache module-level trước — tránh round-trip Odoo không cần thiết
        const cachedCustomUom = productCustomUomCache.get(productId);
        const cachedTracking  = productTrackingCache.get(productId);
        const needsProductFetch = cachedCustomUom === undefined || cachedTracking === undefined;

        // Fetch product.product và stock.move.line SONG SONG (thay vì tuần tự)
        const lineParams = [
          [["move_id", "=", parseInt(moveId, 10)]],
          ["id", "location_dest_id", "location_id", "lot_id", "qty_done", "product_uom_id", "product_id", "package_qty"],
          0,
          1000,
          "id asc",
        ];

        const [productResult, lines] = await Promise.all([
          needsProductFetch
            ? new Promise((resP) => {
                odoo.execute_kw(
                  "product.product",
                  "search_read",
                  [[[["id", "=", productId]], ["id", "tracking", "uom_id", "sea_unit_of_measure"], 0, 1]],
                  (pErr, pRecs) => resP(pRecs || [])
                );
              })
            : Promise.resolve(null), // Đã có cache, bỏ qua

          new Promise((resL, rejL) => {
            odoo.execute_kw("stock.move.line", "search_read", [lineParams], (lErr, lRecs) => {
              if (lErr) return rejL(lErr);
              resL(lRecs || []);
            });
          }),
        ]);

        // Dùng giá trị cache nếu không cần fetch
        let tracking = cachedTracking ?? "none";
        let customUom = cachedCustomUom ?? null;

        if (needsProductFetch && productResult && productResult.length > 0) {
          const pObj = productResult[0];
          tracking = pObj.tracking || "none";

          let isUnitCat =
            pObj.uom_id && Array.isArray(pObj.uom_id)
              ? String(pObj.uom_id[1]).toLowerCase().includes("unit")
              : false;

          if (!isUnitCat && pObj.uom_id && Array.isArray(pObj.uom_id)) {
            const uomId = pObj.uom_id[0];
            if (uomCategoryCache.has(uomId)) {
              // Dùng cache UoM category — tránh round-trip Odoo
              isUnitCat = uomCategoryCache.get(uomId);
            } else {
              try {
                const uomRecs = await new Promise((resU) => {
                  odoo.execute_kw(
                    "uom.uom",
                    "search_read",
                    [[[["id", "=", uomId]], ["id", "name", "category_id"], 0, 1]],
                    (uErr, uData) => resU(uData || [])
                  );
                });
                if (uomRecs && uomRecs.length > 0 && uomRecs[0].category_id) {
                  isUnitCat = String(uomRecs[0].category_id[1]).toLowerCase().includes("unit");
                }
                uomCategoryCache.set(uomId, isUnitCat);
              } catch {
                // Ignore
              }
            }
          }

          customUom =
            isUnitCat && pObj.sea_unit_of_measure && Array.isArray(pObj.sea_unit_of_measure)
              ? pObj.sea_unit_of_measure[1]
              : null;

          // Lưu vào cache để lần sau khỏi query lại
          productTrackingCache.set(productId, tracking);
          productCustomUomCache.set(productId, customUom);
        }

        const result = (lines || []).map((line) => {
          const locName =
            Array.isArray(line.location_id) && line.location_id.length >= 2
              ? line.location_id[1]
              : "";
          const locDestName =
            Array.isArray(line.location_dest_id) && line.location_dest_id.length >= 2
              ? line.location_dest_id[1]
              : "";

          const defaultLineUom = Array.isArray(line.product_uom_id) ? line.product_uom_id[1] : "";
          const effectiveQty = hasPackaging
            ? (Number(line.package_qty) || 0)
            : (Number(line.qty_done) || 0);
          const effectiveUom = hasPackaging && packagingName
            ? packagingName
            : (customUom || defaultLineUom);

          return {
            id: line.id,
            locationDest: {
              id: Array.isArray(line.location_dest_id) ? line.location_dest_id[0] : 0,
              name: formatLocationName(locDestName),
            },
            location: {
              id: Array.isArray(line.location_id) ? line.location_id[0] : 0,
              name: formatLocationName(locName),
            },
            lot:
              Array.isArray(line.lot_id) && line.lot_id.length >= 2
                ? { id: line.lot_id[0], name: line.lot_id[1] }
                : null,
            qtyDone: effectiveQty,
            uom: effectiveUom,
            productId: Array.isArray(line.product_id) ? line.product_id[0] : productId,
            tracking,
            hasPackaging,
            packageQty: Number(line.package_qty) || 0,
            moveState: move.state,
          };
        });

        resolve(result);
      } catch (postErr) {
        reject(postErr);
      }
    });
  });
}

export async function getLocations(odoo, query, limit = 50) {
  return new Promise((resolve, reject) => {
    const maxLimit = Math.min(parseInt(limit, 10) || 50, 50);

    let domain;
    if (query && query.trim()) {
      // Có từ khóa tìm kiếm: lọc địa điểm khả dụng (không phải view) + tên khớp
      domain = [
        ["usage", "!=", "view"],
        ["complete_name", "ilike", query.trim()],
      ];
    } else {
      // Không có từ khóa: lấy địa điểm khả dụng HOẶC ID 288 (địa điểm mặc định)
      // Dùng OR domain để lấy trong 1 round-trip thay vì 2
      domain = ["|", ["id", "=", 288], ["usage", "!=", "view"]];
    }

    const params = [[domain, ["id", "complete_name", "name"], 0, maxLimit, "complete_name asc"]];
    odoo.execute_kw("stock.location", "search_read", params, (err, records) => {
      if (err) return reject(err);

      const result = (records || []).map((loc) => ({
        id: loc.id,
        name: formatLocationName(loc.complete_name || loc.name),
      }));

      // Đảm bảo ID 288 luôn ở đầu danh sách
      if (!query) {
        const idx = result.findIndex((loc) => loc.id === 288);
        if (idx > 0) {
          const [loc288] = result.splice(idx, 1);
          result.unshift(loc288);
        }
      }

      resolve(result);
    });
  });
}

export async function getLots(odoo, productId, query, limit = 50) {
  return new Promise((resolve, reject) => {
    const maxLimit = Math.min(parseInt(limit, 10) || 50, 50);
    const domain = [["product_id", "=", parseInt(productId, 10)]];
    if (query && query.trim()) {
      domain.push(["name", "ilike", query.trim()]);
    }
    const params = [[domain, ["id", "name"], 0, maxLimit, "name asc"]];
    odoo.execute_kw("stock.production.lot", "search_read", params, (err, records) => {
      if (err) return reject(err);
      const result = (records || []).map((lot) => ({
        id: lot.id,
        name: lot.name,
      }));
      resolve(result);
    });
  });
}

// Cache thông tin sản phẩm và báo cáo tồn kho
const storableProductInfoCache = new Map(); // productId -> productInfo
const stockReportCache = new Map();         // `${productId}_${companyId}` -> { data, expiresAt }
const STOCK_REPORT_CACHE_TTL = 15000;       // 15 giây

export async function searchStorableProducts(odoo, query, limit = 20) {
  return new Promise((resolve, reject) => {
    const maxLimit = Math.min(parseInt(limit, 10) || 20, 50);
    const domain = [
      ["type", "=", "product"], // Chỉ lấy sản phẩm có thể lưu kho
      ["active", "=", true],
    ];

    if (query && typeof query === "string" && query.trim()) {
      const q = query.trim();
      domain.push("|", "|", ["name", "ilike", q], ["barcode", "ilike", q], ["default_code", "ilike", q]);
    }

    const params = [
      domain,
      ["id", "name", "barcode", "default_code", "uom_id", "sea_unit_of_measure", "tracking"],
      0,
      maxLimit,
      "name asc",
    ];

    odoo.execute_kw("product.product", "search_read", [params], (err, records) => {
      if (err) return reject(err);
      const result = (records || []).map((p) => {
        const defaultUom = Array.isArray(p.uom_id) ? p.uom_id[1] : "";
        const customUom =
          p.sea_unit_of_measure && Array.isArray(p.sea_unit_of_measure)
            ? p.sea_unit_of_measure[1]
            : null;
        const pInfo = {
          id: p.id,
          name: p.name,
          barcode: typeof p.barcode === "string" ? p.barcode.trim() : null,
          defaultCode: typeof p.default_code === "string" ? p.default_code.trim() : null,
          uom: customUom || defaultUom,
          tracking: p.tracking || "none",
        };
        // Lưu trước vào RAM cache để getProductStockReport không cần query lại product.product
        storableProductInfoCache.set(p.id, pInfo);
        return pInfo;
      });
      resolve(result);
    });
  });
}

export async function getProductStockSummary(odoo, productId, companyId) {
  const pId = parseInt(productId, 10);
  const cId = parseInt(companyId, 10);
  if (!pId || !cId) {
    throw new Error("Mã sản phẩm hoặc công ty không hợp lệ");
  }

  const cacheKey = `sum_${pId}_${cId}`;
  const cachedReport = stockReportCache.get(cacheKey);
  if (cachedReport && Date.now() < cachedReport.expiresAt) {
    return cachedReport.data;
  }

  const quantDomain = [
    ["product_id", "=", pId],
    ["company_id", "=", cId],
    ["location_id.usage", "=", "internal"],
  ];

  const [productInfo, sumResult] = await Promise.all([
    storableProductInfoCache.has(pId)
      ? Promise.resolve(storableProductInfoCache.get(pId))
      : new Promise((resP) => {
          odoo.execute_kw(
            "product.product",
            "search_read",
            [[[["id", "=", pId]], ["id", "name", "barcode", "default_code", "uom_id", "sea_unit_of_measure", "tracking"], 0, 1]],
            (pErr, pRecs) => {
              if (pErr || !pRecs || pRecs.length === 0) return resP(null);
              const p = pRecs[0];
              const defaultUom = Array.isArray(p.uom_id) ? p.uom_id[1] : "";
              const customUom =
                p.sea_unit_of_measure && Array.isArray(p.sea_unit_of_measure)
                  ? p.sea_unit_of_measure[1]
                  : null;
              const info = {
                id: p.id,
                name: p.name,
                barcode: typeof p.barcode === "string" ? p.barcode.trim() : null,
                defaultCode: typeof p.default_code === "string" ? p.default_code.trim() : null,
                uom: customUom || defaultUom,
                tracking: p.tracking || "none",
              };
              storableProductInfoCache.set(p.id, info);
              resP(info);
            }
          );
        }),
    new Promise((resQ) => {
      odoo.execute_kw(
        "stock.quant",
        "read_group",
        [quantDomain, ["quantity"], []],
        (qErr, qRes) => {
          if (!qErr && Array.isArray(qRes) && qRes.length > 0 && qRes[0].quantity !== undefined) {
            return resQ(Number(qRes[0].quantity) || 0);
          }
          // Fallback nếu read_group gặp issue
          odoo.execute_kw(
            "stock.quant",
            "search_read",
            [[quantDomain, ["quantity"], 0, 1000]],
            (srErr, srList) => {
              if (srErr || !srList) return resQ(0);
              let total = 0;
              for (let i = 0; i < srList.length; i++) {
                total += Number(srList[i].quantity) || 0;
              }
              resQ(total);
            }
          );
        }
      );
    }),
  ]);

  const result = {
    product: productInfo || { id: pId, name: "Sản phẩm", uom: "" },
    companyId: cId,
    totalQuantity: sumResult,
  };

  stockReportCache.set(cacheKey, {
    data: result,
    expiresAt: Date.now() + STOCK_REPORT_CACHE_TTL,
  });

  return result;
}

export async function getProductStockReport(odoo, productId, companyId) {
  const pId = parseInt(productId, 10);
  const cId = parseInt(companyId, 10);
  if (!pId || !cId) {
    throw new Error("Mã sản phẩm hoặc công ty không hợp lệ");
  }

  // 1. Kiểm tra cache RAM của báo cáo tồn kho
  const cacheKey = `${pId}_${cId}`;
  const cachedReport = stockReportCache.get(cacheKey);
  if (cachedReport && Date.now() < cachedReport.expiresAt) {
    return cachedReport.data;
  }

  // 2. Chạy SONG SONG: Lấy thông tin sản phẩm (nếu chưa cache) VÀ đọc stock.quant
  const quantDomain = [
    ["product_id", "=", pId],
    ["company_id", "=", cId],
    ["location_id.usage", "=", "internal"],
    ["quantity", "!=", 0],
  ];

  const quantFields = ["id", "location_id", "lot_id", "quantity"];

  const [productInfo, quants] = await Promise.all([
    // Lấy thông tin sản phẩm (từ RAM cache nếu có, nếu chưa thì query Odoo)
    storableProductInfoCache.has(pId)
      ? Promise.resolve(storableProductInfoCache.get(pId))
      : new Promise((resP) => {
          odoo.execute_kw(
            "product.product",
            "search_read",
            [[[["id", "=", pId]], ["id", "name", "barcode", "default_code", "uom_id", "sea_unit_of_measure", "tracking"], 0, 1]],
            (pErr, pRecs) => {
              if (pErr || !pRecs || pRecs.length === 0) {
                return resP(null);
              }
              const p = pRecs[0];
              const defaultUom = Array.isArray(p.uom_id) ? p.uom_id[1] : "";
              const customUom =
                p.sea_unit_of_measure && Array.isArray(p.sea_unit_of_measure)
                  ? p.sea_unit_of_measure[1]
                  : null;
              const info = {
                id: p.id,
                name: p.name,
                barcode: typeof p.barcode === "string" ? p.barcode.trim() : null,
                defaultCode: typeof p.default_code === "string" ? p.default_code.trim() : null,
                uom: customUom || defaultUom,
                tracking: p.tracking || "none",
              };
              storableProductInfoCache.set(p.id, info);
              resP(info);
            }
          );
        }),

    // Đọc stock.quant từ Odoo
    new Promise((resQ, rejQ) => {
      odoo.execute_kw(
        "stock.quant",
        "search_read",
        [[quantDomain, quantFields, 0, 2000]],
        (qErr, quantRecs) => {
          if (qErr) return rejQ(qErr);
          resQ(quantRecs || []);
        }
      );
    }),
  ]);

  const quantList = quants || [];
  let totalQuantity = 0;

  // Group theo Lô -> Địa điểm
  const lotMap = new Map();
  // Group theo Địa điểm -> Lô
  const locationMap = new Map();

  for (let i = 0; i < quantList.length; i++) {
    const q = quantList[i];
    const qty = Number(q.quantity) || 0;
    totalQuantity += qty;

    const lotId = q.lot_id && Array.isArray(q.lot_id) ? q.lot_id[0] : 0;
    const lotName = q.lot_id && Array.isArray(q.lot_id) ? q.lot_id[1] : "(Không có lô)";

    const locId = q.location_id && Array.isArray(q.location_id) ? q.location_id[0] : 0;
    const locName = q.location_id && Array.isArray(q.location_id) ? formatLocationName(q.location_id[1]) : "Chưa xác định";

    // Nhóm theo Lô -> Địa điểm
    let lotGroup = lotMap.get(lotId);
    if (!lotGroup) {
      lotGroup = {
        key: `lot-${lotId}`,
        lotId,
        lotName,
        name: lotName,
        quantity: 0,
        children: [],
      };
      lotMap.set(lotId, lotGroup);
    }
    lotGroup.quantity += qty;

    let existingLoc = null;
    for (let j = 0; j < lotGroup.children.length; j++) {
      if (lotGroup.children[j].locationId === locId) {
        existingLoc = lotGroup.children[j];
        break;
      }
    }
    if (existingLoc) {
      existingLoc.quantity += qty;
    } else {
      lotGroup.children.push({
        key: `lot-${lotId}-loc-${locId}`,
        locationId: locId,
        locationName: locName,
        name: locName,
        quantity: qty,
      });
    }

    // Nhóm theo Địa điểm -> Lô
    let locGroup = locationMap.get(locId);
    if (!locGroup) {
      locGroup = {
        key: `loc-${locId}`,
        locationId: locId,
        locationName: locName,
        name: locName,
        quantity: 0,
        children: [],
      };
      locationMap.set(locId, locGroup);
    }
    locGroup.quantity += qty;

    let existingLot = null;
    for (let j = 0; j < locGroup.children.length; j++) {
      if (locGroup.children[j].lotId === lotId) {
        existingLot = locGroup.children[j];
        break;
      }
    }
    if (existingLot) {
      existingLot.quantity += qty;
    } else {
      locGroup.children.push({
        key: `loc-${locId}-lot-${lotId}`,
        lotId,
        lotName,
        name: lotName,
        quantity: qty,
      });
    }
  }

  const reportResult = {
    product: productInfo || { id: pId, name: "Sản phẩm", uom: "" },
    companyId: cId,
    totalQuantity,
    byLot: Array.from(lotMap.values()).sort((a, b) => b.quantity - a.quantity),
    byLocation: Array.from(locationMap.values()).sort((a, b) => b.quantity - a.quantity),
  };

  // Lưu vào RAM cache server
  stockReportCache.set(cacheKey, {
    data: reportResult,
    expiresAt: Date.now() + STOCK_REPORT_CACHE_TTL,
  });

  return reportResult;
}
