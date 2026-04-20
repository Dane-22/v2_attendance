"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const qr_controller_1 = require("../controllers/qr.controller");
const router = (0, express_1.Router)();
router.post('/decode', qr_controller_1.decodeQRCode);
router.get('/generate/:employeeId', auth_middleware_1.authenticate, qr_controller_1.generateEmployeeQR);
router.post('/verify', qr_controller_1.verifyQRCode);
exports.default = router;
//# sourceMappingURL=qr.routes.js.map