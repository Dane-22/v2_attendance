"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiter_middleware_1 = require("../middleware/rateLimiter.middleware");
const logs_controller_1 = require("../controllers/logs.controller");
const router = (0, express_1.Router)();
// Apply rate limiter to all log endpoints
router.use(...rateLimiter_middleware_1.logRateLimiter);
router.get('/', auth_middleware_1.authenticate, logs_controller_1.getLogs);
router.post('/', auth_middleware_1.authenticate, logs_controller_1.createLog);
router.delete('/:id', auth_middleware_1.authenticate, logs_controller_1.deleteLog);
exports.default = router;
//# sourceMappingURL=logs.routes.js.map