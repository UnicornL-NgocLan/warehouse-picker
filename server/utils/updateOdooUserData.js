import { formatLocationName } from "./getOdooUserData.js";

export async function hangeChangeUserCompany(odoo, companyId, uid) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([uid]);
    inParams.push({ company_id: parseInt(companyId) });
    const params = [];
    params.push(inParams);
    odoo.execute_kw("res.users", "write", params, function (err, user) {
      if (err) {
        reject(err);
      } else {
        resolve(user);
      }
    });
  });
}

export async function updateActualEndDate(odoo, data, uid) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([parseInt(uid)]);
    inParams.push(data);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("sea.transport.line", "write", params, function (err, user) {
      if (err) {
        reject(err);
      } else {
        resolve(user);
      }
    });
  });
}

export async function doneTransportLine(odoo, uid) {
  return new Promise((resolve, reject) => {
    let params = [];
    params.push([parseInt(uid)]);
    odoo.execute_kw("sea.transport.line", "done_transport_line", params, function (err, user) {
      if (err) {
        reject(err);
      } else {
        resolve(user);
      }
    });
  });
}

export async function cancelTransportLine(odoo, uid) {
  return new Promise((resolve, reject) => {
    let params = [];
    params.push([parseInt(uid)]);
    odoo.execute_kw("sea.transport.line", "cancel_transport_line", params, function (err, user) {
      if (err) {
        reject(err);
      } else {
        resolve(user);
      }
    });
  });
}

export async function startTransport(odoo, uid) {
  return new Promise((resolve, reject) => {
    let params = [];
    params.push([parseInt(uid)]);
    odoo.execute_kw("sea.transport", "start_transport", params, function (err, user) {
      if (err) {
        reject(err);
      } else {
        resolve(user);
      }
    });
  });
}

export async function updateSequenceAndStatusTransportLine(odoo, data, uid) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([parseInt(uid)]);
    inParams.push(data);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("sea.transport.line", "write", params, function (err, user) {
      if (err) {
        reject(err);
      } else {
        resolve(user);
      }
    });
  });
}

export async function addVehicleOdometerValue(odoo, data, uid) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([parseInt(uid)]);
    inParams.push(data);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("fleet.vehicle", "write", params, function (err, user) {
      if (err) {
        reject(err);
      } else {
        resolve(user);
      }
    });
  });
}

export async function markAsDoneReminderLine(odoo, uid) {
  return new Promise((resolve, reject) => {
    let params = [];
    params.push([parseInt(uid)]);
    odoo.execute_kw("vehicle.service.reminder", "mark_as_done", params, function (err, user) {
      if (err) {
        reject(err);
      } else {
        resolve(user);
      }
    });
  });
}

export async function addVehicleFuelLogValue(odoo, data) {
  return new Promise((resolve, reject) => {
    var inParams = [];
    inParams.push(data);
    var params = [];
    params.push(inParams);
    odoo.execute_kw("fleet.vehicle.log.fuel", "create", params, function (err, user) {
      if (err) {
        reject(err);
      } else {
        resolve(user);
      }
    });
  });
}

export async function deleteVehicleFuelLogValue(odoo, id) {
  return new Promise((resolve, reject) => {
    var inParams = [];
    inParams.push([parseInt(id)]); //id to delete
    var params = [];
    params.push(inParams);
    odoo.execute_kw("fleet.vehicle.log.fuel", "unlink", params, function (err, user) {
      if (err) {
        reject(err);
      } else {
        resolve(user);
      }
    });
  });
}

export async function createTransportLineImage(odoo, data) {
  return new Promise((resolve, reject) => {
    var inParams = [];
    inParams.push(data);
    var params = [];
    params.push(inParams);
    odoo.execute_kw("sea.transport.line.image", "create", params, function (err, recordId) {
      if (err) {
        reject(err);
      } else {
        resolve(recordId);
      }
    });
  });
}

export async function addPickingToTransport(odoo, transportId, pickingIdsArray) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push([parseInt(transportId)]);
    inParams.push({ picking_ids: [[6, 0, pickingIdsArray]] });
    const params = [];
    params.push(inParams);
    odoo.execute_kw("sea.transport", "write", params, function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

export async function createSeaTransportLine(odoo, data) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push(data);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("sea.transport.line", "create", params, function (err, recordId) {
      if (err) {
        reject(err);
      } else {
        resolve(recordId);
      }
    });
  });
}

export async function createSeaTransport(odoo, data) {
  return new Promise((resolve, reject) => {
    const inParams = [];
    inParams.push(data);
    const params = [];
    params.push(inParams);
    odoo.execute_kw("sea.transport", "create", params, function (err, recordId) {
      if (err) {
        reject(err);
      } else {
        resolve(recordId);
      }
    });
  });
}

export async function confirmSeaTransport(odoo, uid) {
  return new Promise((resolve, reject) => {
    let params = [];
    params.push([parseInt(uid)]);
    odoo.execute_kw("sea.transport", "confirm", params, function (err, user) {
      if (err) {
        reject(err);
      } else {
        resolve(user);
      }
    });
  });
}

export async function cancelSeaTransport(odoo, uid) {
  return new Promise((resolve, reject) => {
    let params = [];
    params.push([parseInt(uid)]);
    odoo.execute_kw("sea.transport", "write", [[[parseInt(uid)], {state: "cancel"}]], function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

export async function createMoveLine(odoo, moveId) {
  return new Promise((resolve, reject) => {
    const moveParams = [
      [["id", "=", parseInt(moveId, 10)]],
      ["id", "picking_id", "product_id", "product_uom", "location_id", "location_dest_id"],
      0,
      1,
    ];
    odoo.execute_kw("stock.move", "search_read", [moveParams], async (err, moveRecords) => {
      if (err) return reject(err);
      if (!moveRecords || moveRecords.length === 0) {
        return reject(new Error("Không tìm thấy dòng điều chuyển (stock.move)"));
      }
      const move = moveRecords[0];

      const createVals = {
        picking_id: move.picking_id ? move.picking_id[0] : false,
        move_id: move.id,
        product_id: move.product_id[0],
        product_uom_id: move.product_uom[0],
        location_id: move.location_id[0],
        location_dest_id: move.location_dest_id[0],
        qty_done: 0,
      };

      odoo.execute_kw("stock.move.line", "create", [[createVals]], async (cErr, newLineId) => {
        if (cErr) return reject(cErr);

        try {
          let tracking = "none";
          try {
            const pRecords = await new Promise((resP, rejP) => {
              odoo.execute_kw(
                "product.product",
                "search_read",
                [[[["id", "=", move.product_id[0]]], ["id", "tracking"], 0, 1]],
                (pErr, pRecs) => (pErr ? rejP(pErr) : resP(pRecs || []))
              );
            });
            if (pRecords && pRecords.length > 0 && pRecords[0].tracking) {
              tracking = pRecords[0].tracking;
            }
          } catch (tErr) {
            tracking = "none";
          }

          const lRecords = await new Promise((resL, rejL) => {
            odoo.execute_kw(
              "stock.move.line",
              "search_read",
              [[
                [["id", "=", newLineId]],
                ["id", "location_dest_id", "location_id", "lot_id", "qty_done", "product_uom_id", "product_id"],
                0,
                1,
              ]],
              (lErr, lRecs) => (lErr ? rejL(lErr) : resL(lRecs || []))
            );
          });

          if (!lRecords || lRecords.length === 0) {
            return reject(new Error("Không tìm thấy dòng soạn hàng vừa tạo"));
          }

          const line = lRecords[0];
          const locName =
            Array.isArray(line.location_id) && line.location_id.length >= 2
              ? line.location_id[1]
              : "";
          const locDestName =
            Array.isArray(line.location_dest_id) && line.location_dest_id.length >= 2
              ? line.location_dest_id[1]
              : "";

          resolve({
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
            uom: Array.isArray(line.product_uom_id) ? line.product_uom_id[1] : "",
            productId: Array.isArray(line.product_id) ? line.product_id[0] : move.product_id[0],
            tracking,
          });
        } catch (postErr) {
          reject(postErr);
        }
      });
    });
  });
}

export async function updateMoveLine(odoo, lineId, data) {
  return new Promise(async (resolve, reject) => {
    const vals = {};
    if (data.locationId !== undefined) {
      vals.location_id = parseInt(data.locationId, 10);
    }
    if (data.lotId !== undefined) {
      vals.lot_id = data.lotId ? parseInt(data.lotId, 10) : false;
    }
    if (data.qtyDone !== undefined) {
      vals.qty_done = Number(data.qtyDone);
    }

    if (Object.keys(vals).length === 0) {
      return reject(new Error("Không có dữ liệu cập nhật"));
    }

    const fieldsToRead = [
      "id",
      "picking_id",
      "move_id",
      "location_dest_id",
      "location_id",
      "lot_id",
      "qty_done",
      "product_uom_id",
      "product_id",
    ];

    let oldRecord = null;
    try {
      const oldRecords = await new Promise((resO, rejO) => {
        odoo.execute_kw(
          "stock.move.line",
          "search_read",
          [[[["id", "=", parseInt(lineId, 10)]], fieldsToRead, 0, 1]],
          (oErr, oRecs) => (oErr ? rejO(oErr) : resO(oRecs || []))
        );
      });
      if (oldRecords && oldRecords.length > 0) {
        oldRecord = oldRecords[0];
      }
    } catch (oldErr) {
      // Ignore pre-read error
    }

    if (oldRecord && oldRecord.product_id && Array.isArray(oldRecord.product_id)) {
      try {
        const prodRecords = await new Promise((resP, rejP) => {
          odoo.execute_kw(
            "product.product",
            "search_read",
            [[[["id", "=", oldRecord.product_id[0]]], ["id", "tracking"], 0, 1]],
            (pErr, pRecs) => (pErr ? rejP(pErr) : resP(pRecs || []))
          );
        });
        if (prodRecords && prodRecords.length > 0 && prodRecords[0].tracking && prodRecords[0].tracking !== "none") {
          const finalLot = vals.lot_id !== undefined ? vals.lot_id : (oldRecord.lot_id ? oldRecord.lot_id[0] : null);
          if (!finalLot) {
            return reject(new Error("Sản phẩm có theo dõi lô/serial, bắt buộc phải chọn lô"));
          }
        }
      } catch (tCheckErr) {
        if (tCheckErr.message && tCheckErr.message.includes("bắt buộc")) {
          return reject(tCheckErr);
        }
      }
    }

    odoo.execute_kw("stock.move.line", "write", [[[parseInt(lineId, 10)], vals]], async (err) => {
      if (err) return reject(err);

      try {
        const lRecords = await new Promise((resL, rejL) => {
          odoo.execute_kw(
            "stock.move.line",
            "search_read",
            [[
              [["id", "=", parseInt(lineId, 10)]],
              fieldsToRead,
              0,
              1,
            ]],
            (lErr, lRecs) => (lErr ? rejL(lErr) : resL(lRecs || []))
          );
        });

        if (!lRecords || lRecords.length === 0) {
          return reject(new Error("Không tìm thấy dòng soạn hàng"));
        }

        const line = lRecords[0];

        let tracking = "none";
        let customUom = "";
        try {
          const prodId = Array.isArray(line.product_id) ? line.product_id[0] : null;
          if (prodId) {
            const pRecords = await new Promise((resP, rejP) => {
              odoo.execute_kw(
                "product.product",
                "search_read",
                [[[["id", "=", prodId]], ["id", "tracking", "uom_id", "sea_unit_of_measure"], 0, 1]],
                (pErr, pRecs) => (pErr ? rejP(pErr) : resP(pRecs || []))
              );
            });
            if (pRecords && pRecords.length > 0) {
              const pObj = pRecords[0];
              if (pObj.tracking) tracking = pObj.tracking;

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
          }
        } catch (tErr) {
          tracking = "none";
        }

        const effectiveUom = customUom || (Array.isArray(line.product_uom_id) ? line.product_uom_id[1] : "");

        const locName =
          Array.isArray(line.location_id) && line.location_id.length >= 2
            ? line.location_id[1]
            : "";
        const locDestName =
          Array.isArray(line.location_dest_id) && line.location_dest_id.length >= 2
            ? line.location_dest_id[1]
            : "";

        // Post Chatter Log Note on Stock Picking
        let pickingId =
          (line.picking_id && Array.isArray(line.picking_id) ? line.picking_id[0] : null) ||
          (oldRecord?.picking_id && Array.isArray(oldRecord.picking_id) ? oldRecord.picking_id[0] : null);

        if (!pickingId && line.move_id && Array.isArray(line.move_id)) {
          try {
            const mRecs = await new Promise((resM, rejM) => {
              odoo.execute_kw(
                "stock.move",
                "search_read",
                [[[["id", "=", line.move_id[0]]], ["id", "picking_id"], 0, 1]],
                (mErr, res) => (mErr ? rejM(mErr) : resM(res || []))
              );
            });
            if (mRecs && mRecs.length > 0 && mRecs[0].picking_id) {
              pickingId = Array.isArray(mRecs[0].picking_id) ? mRecs[0].picking_id[0] : mRecs[0].picking_id;
            }
          } catch {
            // Ignore
          }
        }

        if (pickingId) {
          try {
            const productName = Array.isArray(line.product_id)
              ? line.product_id[1]
              : oldRecord && Array.isArray(oldRecord.product_id)
              ? oldRecord.product_id[1]
              : "Sản phẩm";

            const oldLotName = oldRecord && Array.isArray(oldRecord.lot_id) ? oldRecord.lot_id[1] : "(Không có)";
            const newLotName = Array.isArray(line.lot_id) ? line.lot_id[1] : "(Không có)";

            const oldLocName = oldRecord && Array.isArray(oldRecord.location_id)
              ? formatLocationName(oldRecord.location_id[1])
              : "Chưa xác định";
            const currentLocName = formatLocationName(locName);

            const oldLocDestName = oldRecord && Array.isArray(oldRecord.location_dest_id)
              ? formatLocationName(oldRecord.location_dest_id[1])
              : "Chưa xác định";
            const currentLocDestName = formatLocationName(locDestName);

            const oldQty = oldRecord ? Number(oldRecord.qty_done) || 0 : 0;
            const newQty = Number(line.qty_done) || 0;

            const lotHtml =
              oldLotName !== newLotName
                ? `${oldLotName} &rarr; <b>${newLotName}</b>`
                : `<b>${newLotName}</b>`;

            const locHtml =
              oldLocName !== currentLocName
                ? `${oldLocName} &rarr; <b>${currentLocName}</b>`
                : `<b>${currentLocName}</b>`;

            const locDestHtml =
              oldLocDestName !== currentLocDestName
                ? `${oldLocDestName} &rarr; <b>${currentLocDestName}</b>`
                : `<b>${currentLocDestName}</b>`;

            const qtyHtml =
              oldQty !== newQty
                ? `${oldQty} &rarr; <b>${newQty} ${effectiveUom}</b>`
                : `<b>${newQty} ${effectiveUom}</b>`;

            let imagesHtml = "";
            if (Array.isArray(data.imageUrls) && data.imageUrls.length > 0) {
              const urlList = data.imageUrls
                .map(
                  (url, idx) =>
                    `<li style="margin-bottom: 4px;"><a href="${url}" target="_blank" style="color: #0f4c81; text-decoration: underline;">Hình ảnh ${idx + 1} (${url})</a></li>`
                )
                .join("");

              const imgThumbs = data.imageUrls
                .map(
                  (url, idx) =>
                    `<a href="${url}" target="_blank" style="display: inline-block; margin-right: 8px; margin-top: 6px;"><img src="${url}" alt="Hình ${idx + 1}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px; border: 1px solid #d9d9d9;" /></a>`
                )
                .join("");

              imagesHtml = `
                <li style="margin-top: 8px;">
                  <b>Hình ảnh đính kèm (${data.imageUrls.length}):</b>
                  <ul style="margin: 4px 0 6px 0; padding-left: 18px;">
                    ${urlList}
                  </ul>
                  <div style="margin-top: 6px;">
                    ${imgThumbs}
                  </div>
                </li>
              `;
            }

            const chatterBody = `
              <div style="font-size: 13px; line-height: 1.5;">
                <p style="margin: 0 0 6px 0; font-weight: bold; color: #0f4c81;">
                  [Web Soạn Hàng] Cập nhật dòng soạn hàng
                </p>
                <ul style="margin: 0; padding-left: 18px;">
                  <li><b>Sản phẩm:</b> ${productName}</li>
                  <li><b>Số lượng:</b> ${qtyHtml}</li>
                  <li><b>Số lô:</b> ${lotHtml}</li>
                  <li><b>Địa điểm nguồn:</b> ${locHtml}</li>
                  <li><b>Địa điểm đích:</b> ${locDestHtml}</li>
                  ${imagesHtml}
                </ul>
              </div>
            `.trim();

            const postParams = [
              [[parseInt(pickingId, 10)]],
              {
                body: chatterBody,
                message_type: "comment",
                subtype: "mail.mt_note",
              },
            ];

            odoo.execute_kw("stock.picking", "message_post", postParams, (postErr) => {
              if (postErr) {
                // Retry without subtype in case mail.mt_note differs
                odoo.execute_kw(
                  "stock.picking",
                  "message_post",
                  [[[parseInt(pickingId, 10)]], { body: chatterBody, message_type: "comment" }],
                  (retryErr) => {
                    if (retryErr) {
                      console.error(`Lỗi log chatter picking #${pickingId}:`, retryErr?.message || retryErr);
                    }
                  }
                );
              }
            });
          } catch (chatErr) {
            console.error("Lỗi tạo nội dung chatter:", chatErr);
          }
        }

        resolve({
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
          uom: effectiveUom,
          productId: Array.isArray(line.product_id) ? line.product_id[0] : 0,
          tracking,
        });
      } catch (postErr) {
        reject(postErr);
      }
    });
  });
}

export async function deleteMoveLine(odoo, lineId) {
  return new Promise(async (resolve, reject) => {
    let lineToDel = null;
    try {
      const records = await new Promise((resL, rejL) => {
        odoo.execute_kw(
          "stock.move.line",
          "search_read",
          [[[["id", "=", parseInt(lineId, 10)]], ["id", "picking_id", "product_id", "lot_id", "location_id", "qty_done", "product_uom_id"], 0, 1]],
          (err, recs) => (err ? rejL(err) : resL(recs || []))
        );
      });
      if (records && records.length > 0) {
        lineToDel = records[0];
      }
    } catch {
      // Ignore
    }

    odoo.execute_kw("stock.move.line", "unlink", [[[parseInt(lineId, 10)]]], (err) => {
      if (err) return reject(err);

      if (lineToDel && lineToDel.picking_id && Array.isArray(lineToDel.picking_id)) {
        try {
          const pickingId = lineToDel.picking_id[0];
          const prodName = Array.isArray(lineToDel.product_id) ? lineToDel.product_id[1] : "Sản phẩm";
          const lotName = Array.isArray(lineToDel.lot_id) ? lineToDel.lot_id[1] : "(Không có)";
          const locName = Array.isArray(lineToDel.location_id) ? formatLocationName(lineToDel.location_id[1]) : "";
          const qty = Number(lineToDel.qty_done) || 0;
          const uom = Array.isArray(lineToDel.product_uom_id) ? lineToDel.product_uom_id[1] : "";

          const delBody = `
            <div style="font-size: 13px; line-height: 1.5; color: #a8071a;">
              <p style="margin: 0 0 6px 0; font-weight: bold;">
                🗑️ [Web Soạn Hàng] Đã xóa dòng soạn hàng
              </p>
              <ul style="margin: 0; padding-left: 18px; color: #262626;">
                <li><b>Sản phẩm:</b> ${prodName}</li>
                <li><b>Số lượng đã xóa:</b> <b>${qty} ${uom}</b></li>
                <li><b>Số lô:</b> ${lotName}</li>
                <li><b>Địa điểm nguồn:</b> ${locName}</li>
              </ul>
            </div>
          `.trim();

          odoo.execute_kw(
            "stock.picking",
            "message_post",
            [[[parseInt(pickingId, 10)]], { body: delBody, message_type: "comment", subtype: "mail.mt_note" }],
            () => {}
          );
        } catch {
          // Ignore
        }
      }

      resolve(true);
    });
  });
}
