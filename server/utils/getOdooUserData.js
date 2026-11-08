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
const uomCategoryCache = new Map(); // uomId -> boolean (isUnitCat)
const productCustomUomCache = new Map(); // productId -> string | null (customUom)

export async function getPickingMoves(odoo, pickingId) {
  return new Promise((resolve, reject) => {
    const inParams = [
      [["picking_id", "=", parseInt(pickingId, 10)], ["state", "!=", "cancel"]],
      ["id", "product_id", "product_uom_qty", "product_uom", "sale_line_id", "reserved_availability", "state"],
      0,
      1000,
      "id asc",
    ];
    odoo.execute_kw("stock.move", "search_read", [inParams], async (err, moves) => {
      if (err) return reject(err);
      if (!moves || moves.length === 0) return resolve([]);

      try {
        const moveIds = moves.map((m) => m.id);
        const productIds = Array.from(new Set(moves.map((m) => m.product_id[0])));
        const saleLineIds = Array.from(
          new Set(
            moves
              .filter((m) => m.sale_line_id && Array.isArray(m.sale_line_id))
              .map((m) => m.sale_line_id[0])
          )
        );

        // Filter products not yet in cache
        const uncachedProductIds = productIds.filter((pId) => !productCustomUomCache.has(pId));

        // Fetch sale.order.line, stock.move.line, and uncached product.product IN PARALLEL!
        const [solRecords, moveLines, productRecs] = await Promise.all([
          saleLineIds.length > 0
            ? new Promise((resSol) => {
                const solParams = [
                  [["id", "in", saleLineIds]],
                  ["id", "product_uom_qty", "product_uom"],
                  0,
                  saleLineIds.length,
                ];
                odoo.execute_kw("sale.order.line", "search_read", [solParams], (sErr, sRecs) => {
                  resSol(sRecs || []);
                });
              })
            : Promise.resolve([]),

          moveIds.length > 0
            ? new Promise((resML) => {
                const mlParams = [
                  [["move_id", "in", moveIds]],
                  ["id", "move_id", "qty_done", "product_uom_qty"],
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
                  ["id", "name", "uom_id", "sea_unit_of_measure"],
                  0,
                  uncachedProductIds.length,
                ];
                odoo.execute_kw("product.product", "search_read", [pParams], (pErr, pData) => {
                  resP(pData || []);
                });
              })
            : Promise.resolve([]),
        ]);

        const saleLineMap = {};
        (solRecords || []).forEach((sol) => {
          saleLineMap[sol.id] = sol;
        });

        const pickedQtyMap = {};
        const reservedQtyMap = {};
        (moveLines || []).forEach((ml) => {
          const mId = Array.isArray(ml.move_id) ? ml.move_id[0] : ml.move_id;
          pickedQtyMap[mId] = (pickedQtyMap[mId] || 0) + (Number(ml.qty_done) || 0);
          reservedQtyMap[mId] = (reservedQtyMap[mId] || 0) + (Number(ml.product_uom_qty) || 0);
        });

        // Resolve UoM categories for any newly fetched products
        if (productRecs && productRecs.length > 0) {
          const uomIdsToFetch = [];
          productRecs.forEach((p) => {
            if (p.uom_id && Array.isArray(p.uom_id)) {
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
            const uId = p.uom_id && Array.isArray(p.uom_id) ? p.uom_id[0] : null;
            const uName = p.uom_id && Array.isArray(p.uom_id) ? String(p.uom_id[1]).toLowerCase() : "";
            const isUnitCat = (uId && uomCategoryCache.get(uId)) || uName.includes("unit");
            let effectiveCustomUom = null;
            if (isUnitCat && p.sea_unit_of_measure && Array.isArray(p.sea_unit_of_measure)) {
              effectiveCustomUom = p.sea_unit_of_measure[1];
            }
            productCustomUomCache.set(p.id, effectiveCustomUom);
          });
        }

        const result = moves.map((m) => {
          const solId = m.sale_line_id && Array.isArray(m.sale_line_id) ? m.sale_line_id[0] : null;
          const sol = solId ? saleLineMap[solId] : null;
          const orderedFromPicking = !sol;
          const orderedQty = sol ? Number(sol.product_uom_qty) : Number(m.product_uom_qty);
          const defaultOrderedUom =
            sol && Array.isArray(sol.product_uom)
              ? sol.product_uom[1]
              : Array.isArray(m.product_uom)
              ? m.product_uom[1]
              : "";
          const defaultPickedUom = Array.isArray(m.product_uom) ? m.product_uom[1] : "";

          const customUom = productCustomUomCache.get(m.product_id[0]);
          const orderedUom = customUom || defaultOrderedUom;
          const pickedUom = customUom || defaultPickedUom;
          const pickedQty = pickedQtyMap[m.id] || 0;

          const reservedFromLines = Number(reservedQtyMap[m.id]) || 0;
          const reservedFromMove = Number(m.reserved_availability) || 0;
          const reservedQty = Math.max(reservedFromLines, reservedFromMove);
          const isReserved = reservedQty > 0 || m.state === "assigned" || m.state === "partially_available";

          return {
            id: m.id,
            product: {
              id: m.product_id[0],
              name: m.product_id[1],
            },
            orderedQty: Number(orderedQty) || 0,
            orderedUom,
            orderedFromPicking,
            pickedQty: Number(pickedQty) || 0,
            pickedUom,
            reservedQty: Number(reservedQty) || 0,
            isReserved: Boolean(isReserved),
          };
        });

        resolve(result);
      } catch (postErr) {
        reject(postErr);
      }
    });
  });
}

export async function getMoveLines(odoo, moveId) {
  return new Promise((resolve, reject) => {
    const moveParams = [
      [["id", "=", parseInt(moveId, 10)]],
      ["id", "product_id"],
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

      try {
        let tracking = "none";
        let customUom = null;
        try {
          const productRecords = await new Promise((resP, rejP) => {
            odoo.execute_kw(
              "product.product",
              "search_read",
              [[[["id", "=", productId]], ["id", "tracking", "uom_id", "sea_unit_of_measure"], 0, 1]],
              (pErr, pRecs) => {
                if (pErr) return rejP(pErr);
                resP(pRecs || []);
              }
            );
          });
          if (productRecords && productRecords.length > 0) {
            const pObj = productRecords[0];
            if (pObj.tracking) {
              tracking = pObj.tracking;
            }

            if (pObj.uom_id && Array.isArray(pObj.uom_id)) {
              let isUnitCat = String(pObj.uom_id[1]).toLowerCase().includes("unit");
              if (!isUnitCat) {
                try {
                  const uomRecs = await new Promise((resU, rejU) => {
                    odoo.execute_kw(
                      "uom.uom",
                      "search_read",
                      [[[["id", "=", pObj.uom_id[0]]], ["id", "name", "category_id"], 0, 1]],
                      (uErr, uData) => (uErr ? rejU(uErr) : resU(uData || []))
                    );
                  });
                  if (uomRecs && uomRecs.length > 0 && uomRecs[0].category_id) {
                    isUnitCat = String(uomRecs[0].category_id[1]).toLowerCase().includes("unit");
                  }
                } catch {
                  // Ignore
                }
              }

              if (isUnitCat && pObj.sea_unit_of_measure && Array.isArray(pObj.sea_unit_of_measure)) {
                customUom = pObj.sea_unit_of_measure[1];
              }
            }
          }
        } catch (pErr) {
          tracking = "none";
        }

        const lineParams = [
          [["move_id", "=", parseInt(moveId, 10)]],
          ["id", "location_dest_id", "location_id", "lot_id", "qty_done", "product_uom_id", "product_id"],
          0,
          1000,
          "id asc",
        ];
        const lines = await new Promise((resL, rejL) => {
          odoo.execute_kw("stock.move.line", "search_read", [lineParams], (lErr, lRecs) => {
            if (lErr) return rejL(lErr);
            resL(lRecs || []);
          });
        });

        const result = (lines || []).map((line) => {
          const locName =
            Array.isArray(line.location_id) && line.location_id.length >= 2
              ? line.location_id[1]
              : "";
          const locDestName =
            Array.isArray(line.location_dest_id) && line.location_dest_id.length >= 2
              ? line.location_dest_id[1]
              : "";

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
            qtyDone: Number(line.qty_done) || 0,
            uom: customUom || (Array.isArray(line.product_uom_id) ? line.product_uom_id[1] : ""),
            productId: Array.isArray(line.product_id) ? line.product_id[0] : productId,
            tracking,
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
    const domain = [["usage", "=", "internal"]];
    if (query && query.trim()) {
      domain.push(["complete_name", "ilike", query.trim()]);
    }
    const params = [[domain, ["id", "complete_name", "name"], 0, maxLimit, "complete_name asc"]];
    odoo.execute_kw("stock.location", "search_read", params, async (err, records) => {
      if (err) return reject(err);
      const result = (records || []).map((loc) => ({
        id: loc.id,
        name: formatLocationName(loc.complete_name || loc.name),
      }));

      // Đảm bảo địa điểm nguồn mặc định (ID 288) luôn có trong danh sách lựa chọn
      if (!query && !result.some((loc) => loc.id === 288)) {
        try {
          const loc288Records = await new Promise((res288, rej288) => {
            odoo.execute_kw(
              "stock.location",
              "search_read",
              [[[["id", "=", 288]], ["id", "complete_name", "name"], 0, 1]],
              (e288, r288) => (e288 ? rej288(e288) : res288(r288 || []))
            );
          });
          if (loc288Records && loc288Records.length > 0) {
            const loc288 = loc288Records[0];
            result.unshift({
              id: loc288.id,
              name: formatLocationName(loc288.complete_name || loc288.name),
            });
          }
        } catch (e288) {
          // Bỏ qua lỗi nếu không tìm thấy 288
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
