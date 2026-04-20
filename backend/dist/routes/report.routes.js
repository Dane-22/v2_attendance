"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const report_controller_1 = require("../controllers/report.controller");
const router = (0, express_1.Router)();
router.get('/attendance', auth_middleware_1.authenticate, report_controller_1.getAttendanceReport);
router.get('/payroll', auth_middleware_1.authenticate, report_controller_1.getPayrollReport);
router.get('/summary', auth_middleware_1.authenticate, report_controller_1.getEmployeeSummary);
router.get('/export/:type', auth_middleware_1.authenticate, report_controller_1.exportReport);
exports.default = router;
//# sourceMappingURL=report.routes.js.map