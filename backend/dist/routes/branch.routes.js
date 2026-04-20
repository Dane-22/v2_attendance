"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const branch_controller_1 = require("../controllers/branch.controller");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticate, branch_controller_1.getBranches);
router.get('/:branchCode/employees', auth_middleware_1.authenticate, branch_controller_1.getBranchEmployees);
exports.default = router;
//# sourceMappingURL=branch.routes.js.map