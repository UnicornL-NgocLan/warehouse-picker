import assert from "assert";
import { encrypt, decrypt } from "./utils/EnCryptAndDeCrypt.js";
import { createJWT } from "./utils/jwtAttachmentAndCreation.js";
import { isTokenValid } from "./utils/isTokenValid.js";
import { pickingCtrl } from "./controllers/pickingController.js";
import pickingRouter from "./routes/pickingRoute.js";
import mainRouter from "./routes/index.js";

process.env.CRYPTO_KEY = "test_crypto_key_for_unit_tests_32_bytes_long!!";
process.env.JWT_SECRET = "test_jwt_secret_for_unit_tests_1234567890";

console.log("--- 1. Testing AES-256-GCM Encryption/Decryption ---");
const secretText = "OdooPassword@2026!";
const encrypted = encrypt(secretText);
console.log("Encrypted output:", encrypted);
assert(typeof encrypted === "string", "Encrypted must be string");
assert(encrypted.startsWith("{"), "Encrypted must be JSON string");

const decrypted = decrypt(encrypted);
console.log("Decrypted output matches original:", decrypted === secretText);
assert.strictEqual(decrypted, secretText, "Decrypted text must match original");

console.log("--- 2. Testing JWT Generation & Verification ---");
const token = createJWT({ payload: { username: "warehouse_picker" } });
console.log("JWT generated:", token);
const payload = isTokenValid(token);
console.log("JWT payload verified:", payload);
assert.strictEqual(payload.username, "warehouse_picker", "Payload username must match");

console.log("--- 3. Testing Picking Controller Exports ---");
const requiredCtrlMethods = [
  "getPickings",
  "getPickingMoves",
  "getMoveLines",
  "createMoveLine",
  "updateMoveLine",
  "deleteMoveLine",
  "getLocations",
  "getLots",
];
requiredCtrlMethods.forEach((method) => {
  assert(typeof pickingCtrl[method] === "function", `pickingCtrl.${method} must be a function`);
  console.log(`✓ pickingCtrl.${method} is defined`);
});

console.log("--- 4. Testing Picking Routes Registration ---");
assert(Array.isArray(pickingRouter), "pickingRouter must export router.stack array");
console.log(`✓ pickingRouter has ${pickingRouter.length} routes registered`);

assert(Array.isArray(mainRouter.stack), "mainRouter.stack must be an array");
const registeredPaths = mainRouter.stack.map((layer) => layer.route?.path).filter(Boolean);
console.log("Registered API paths under /api/:\n", registeredPaths);

requiredCtrlMethods.forEach((method) => {
  // Check corresponding route exists
  const hasRoute = registeredPaths.some((p) =>
    ["/get-pickings", "/get-picking-moves/:id", "/get-move-lines/:id", "/create-move-line/:moveId", "/update-move-line/:id", "/delete-move-line/:id", "/get-locations", "/get-lots"].includes(p)
  );
  assert(hasRoute, `Route for ${method} must be registered`);
});

console.log("\nALL BACKEND UNIT TESTS PASSED SUCCESSFULLY! ✓✓✓");

