"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const employee_controller_1 = require("../controllers/employee.controller");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticate, employee_controller_1.getAllEmployees);
router.post('/', auth_middleware_1.authenticate, employee_controller_1.createEmployee);
router.get('/:id', auth_middleware_1.authenticate, employee_controller_1.getEmployeeById);
router.put('/:id', auth_middleware_1.authenticate, employee_controller_1.updateEmployee);
router.delete('/:id', auth_middleware_1.authenticate, employee_controller_1.deleteEmployee);
router.get('/:id/qr', auth_middleware_1.authenticate, employee_controller_1.generateQRCode);
router.post('/:id/upload-profile-image', auth_middleware_1.authenticate, employee_controller_1.uploadMiddleware, employee_controller_1.uploadProfileImage);
router.patch('/:id/transfer', auth_middleware_1.authenticate, employee_controller_1.transferEmployee);
router.patch('/:id/archive', auth_middleware_1.authenticate, employee_controller_1.archiveEmployee);
exports.default = router;
//# sourceMappingURL=employee.routes.js.map