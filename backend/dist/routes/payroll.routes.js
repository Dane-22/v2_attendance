"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const payroll_controller_1 = require("../controllers/payroll.controller");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticate, payroll_controller_1.getAllPayroll);
router.get('/my', auth_middleware_1.authenticate, payroll_controller_1.getMyPayroll);
router.post('/calculate', auth_middleware_1.authenticate, payroll_controller_1.calculatePayroll);
router.get('/:id', auth_middleware_1.authenticate, payroll_controller_1.getPayrollById);
router.post('/:id/process', auth_middleware_1.authenticate, payroll_controller_1.processPayroll);
router.patch('/:id/status', auth_middleware_1.authenticate, payroll_controller_1.updatePayrollStatus);
exports.default = router;
//# sourceMappingURL=payroll.routes.js.map