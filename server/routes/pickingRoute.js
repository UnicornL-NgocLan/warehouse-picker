import express from "express";
import { pickingCtrl } from "../controllers/pickingController.js";
import { authenticateUser } from "../middleWare.js";

const router = express.Router();

router.get("/get-pickings", authenticateUser, pickingCtrl.getPickings);
router.get("/get-picking-moves/:id", authenticateUser, pickingCtrl.getPickingMoves);
router.get("/get-move-lines/:id", authenticateUser, pickingCtrl.getMoveLines);
router.post("/create-move-line/:moveId", authenticateUser, pickingCtrl.createMoveLine);
router.patch("/update-move-line/:id", authenticateUser, pickingCtrl.updateMoveLine);
router.post("/log-move-line-chatter", authenticateUser, pickingCtrl.logMoveLineChatter);
router.delete("/delete-move-line/:id", authenticateUser, pickingCtrl.deleteMoveLine);
router.get("/get-locations", authenticateUser, pickingCtrl.getLocations);
router.get("/get-lots", authenticateUser, pickingCtrl.getLots);
router.get("/search-storable-products", authenticateUser, pickingCtrl.searchStorableProducts);
router.get("/product-stock-summary/:productId", authenticateUser, pickingCtrl.getProductStockSummary);
router.get("/product-stock-report/:productId", authenticateUser, pickingCtrl.getProductStockReport);

export default router.stack;

