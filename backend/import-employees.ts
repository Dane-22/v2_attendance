import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Employee data from v1 (attendance_db.sql)
const employees = [
  { id: 6, employeeCode: 'SA001', firstName: 'Super', middleName: 'Torres', lastName: 'Adminesu', email: 'admin@jajrconstruction.com', position: 'Super Admin', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 11, employeeCode: 'E0001', firstName: 'AARIZ', middleName: null, lastName: 'MARLOU', email: 'aariz.marlou@example.com', position: 'Worker', status: 'Active', dailyRate: 700.00, hasDeduction: true },
  { id: 12, employeeCode: 'E0002', firstName: 'CESAR', middleName: '', lastName: 'ABUBO', email: 'cesar.abubo@example.com', position: 'Worker', status: 'Active', dailyRate: 550.00, hasDeduction: true },
  { id: 13, employeeCode: 'E0003', firstName: 'MARLON', middleName: '', lastName: 'AGUILAR', email: 'marlon.aguilar@example.com', position: 'Worker', status: 'Active', dailyRate: 600.00, hasDeduction: false },
  { id: 14, employeeCode: 'E0004', firstName: 'NOEL', middleName: null, lastName: 'ARIZ', email: 'noel.ariz@example.com', position: 'Worker', status: 'Active', dailyRate: 550.00, hasDeduction: false },
  { id: 15, employeeCode: 'E0005', firstName: 'DANIEL', middleName: null, lastName: 'BACHILLER', email: 'daniel.bachiller@example.com', position: 'Worker', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 16, employeeCode: 'E0006', firstName: 'ALFREDO', middleName: null, lastName: 'BAGUIO', email: 'alfredo.baguio@example.com', position: 'Worker', status: 'Active', dailyRate: 550.00, hasDeduction: true },
  { id: 17, employeeCode: 'E0007', firstName: 'ROLLY', middleName: null, lastName: 'BALTAZAR', email: 'rolly.baltazar@example.com', position: 'Worker', status: 'Active', dailyRate: 500.00, hasDeduction: true },
  { id: 18, employeeCode: 'E0008', firstName: 'DONG', middleName: null, lastName: 'BAUTISTA', email: 'dong.bautista@example.com', position: 'Worker', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 19, employeeCode: 'E0009', firstName: 'JANLY', middleName: null, lastName: 'BELINO', email: 'janly.belino@example.com', position: 'Worker', status: 'Active', dailyRate: 650.00, hasDeduction: true },
  { id: 20, employeeCode: 'E0010', firstName: 'MENUEL', middleName: null, lastName: 'BENITEZ', email: 'menuel.benitez@example.com', position: 'Worker', status: 'Active', dailyRate: 600.00, hasDeduction: false },
  { id: 21, employeeCode: 'E0011', firstName: 'GELMAR', middleName: null, lastName: 'BERNACHEA', email: 'gelmar.bernachea@example.com', position: 'Worker', status: 'Active', dailyRate: 500.00, hasDeduction: true },
  { id: 22, employeeCode: 'E0012', firstName: 'JOMAR', middleName: null, lastName: 'CABANBAN', email: 'jomar.cabanban@example.com', position: 'Worker', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 23, employeeCode: 'E0013', firstName: 'MARIO', middleName: null, lastName: 'CABANBAN', email: 'mario.cabanban@example.com', position: 'Worker', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 24, employeeCode: 'E0014', firstName: 'KELVIN', middleName: null, lastName: 'CALDERON', email: 'kelvin.calderon@example.com', position: 'Worker', status: 'Active', dailyRate: 500.00, hasDeduction: true },
  { id: 25, employeeCode: 'E0015', firstName: 'FLORANTE', middleName: null, lastName: 'CALUZA', email: 'florante.caluza@example.com', position: 'Worker', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 26, employeeCode: 'E0016', firstName: 'MELVIN', middleName: null, lastName: 'CAMPOS', email: 'melvin.campos@example.com', position: 'Worker', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 27, employeeCode: 'E0017', firstName: 'JERWIN', middleName: null, lastName: 'CAMPOS', email: 'jerwin.campos@example.com', position: 'Worker', status: 'Active', dailyRate: 550.00, hasDeduction: true },
  { id: 28, employeeCode: 'E0018', firstName: 'BENJIE', middleName: null, lastName: 'CARAS', email: 'benjie.caras@example.com', position: 'Worker', status: 'Active', dailyRate: 700.00, hasDeduction: true },
  { id: 29, employeeCode: 'E0019', firstName: 'BONJO', middleName: null, lastName: 'DACUMOS', email: 'bonjo.dacumos@example.com', position: 'Worker', status: 'Active', dailyRate: 500.00, hasDeduction: true },
  { id: 30, employeeCode: 'E0020', firstName: 'RYAN', middleName: null, lastName: 'DEOCARIS', email: 'ryan.deocaris@example.com', position: 'Worker', status: 'Active', dailyRate: 500.00, hasDeduction: true },
  { id: 31, employeeCode: 'E0021', firstName: 'BEN', middleName: null, lastName: 'ESTEPA', email: 'ben.estepa@example.com', position: 'Worker', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 32, employeeCode: 'E0022', firstName: 'MAR DAVE', middleName: null, lastName: 'FLORES', email: 'mardave.flores@example.com', position: 'Worker', status: 'Active', dailyRate: 550.00, hasDeduction: true },
  { id: 33, employeeCode: 'E0023', firstName: 'ALBERT', middleName: null, lastName: 'FONTANILLA', email: 'albert.fontanilla@example.com', position: 'Worker', status: 'Active', dailyRate: 550.00, hasDeduction: true },
  { id: 34, employeeCode: 'E0024', firstName: 'JOHN WILSON', middleName: null, lastName: 'FONTANILLA', email: 'johnwilson.fontanilla@example.com', position: 'Worker', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 35, employeeCode: 'E0025', firstName: 'LEO', middleName: null, lastName: 'GURTIZA', email: 'leo.gurtiza@example.com', position: 'Worker', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 36, employeeCode: 'E0026', firstName: 'JOSE', middleName: null, lastName: 'IGLECIAS', email: 'jose.iglecias@example.com', position: 'Worker', status: 'Active', dailyRate: 500.00, hasDeduction: true },
  { id: 37, employeeCode: 'E0027', firstName: 'JEFFREY', middleName: null, lastName: 'JIMENEZ', email: 'jeffrey.jimenez@example.com', position: 'Worker', status: 'Active', dailyRate: 550.00, hasDeduction: true },
  { id: 38, employeeCode: 'E0028', firstName: 'WILSON', middleName: null, lastName: 'LICTAOA', email: 'wilson.lictaoa@example.com', position: 'Worker', status: 'Active', dailyRate: 500.00, hasDeduction: true },
  { id: 39, employeeCode: 'E0029', firstName: 'LORETO', middleName: null, lastName: 'MABALO', email: 'loreto.mabalo@example.com', position: 'Worker', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 40, employeeCode: 'E0030', firstName: 'ROMEL', middleName: null, lastName: 'MALLARE', email: 'romel.mallare@example.com', position: 'Worker', status: 'Active', dailyRate: 800.00, hasDeduction: true },
  { id: 41, employeeCode: 'E0031', firstName: 'SAMUEL SR.', middleName: null, lastName: 'MARQUEZ', email: 'samuel.marquez@example.com', position: 'Worker', status: 'Active', dailyRate: 500.00, hasDeduction: true },
  { id: 42, employeeCode: 'E0032', firstName: 'ROLLY', middleName: null, lastName: 'MARZAN', email: 'rolly.marzan@example.com', position: 'Worker', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 43, employeeCode: 'E0033', firstName: 'RONALD', middleName: null, lastName: 'MARZAN', email: 'ronald.marzan@example.com', position: 'Worker', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 44, employeeCode: 'E0034', firstName: 'WILSON', middleName: null, lastName: 'MARZAN', email: 'wilson.marzan@example.com', position: 'Worker', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 45, employeeCode: 'E0035', firstName: 'MARVIN', middleName: null, lastName: 'MIRANDA', email: 'marvin.miranda@example.com', position: 'Worker', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 46, employeeCode: 'E0036', firstName: 'JOE', middleName: null, lastName: 'MONTERDE', email: 'joe.monterde@example.com', position: 'Worker', status: 'Active', dailyRate: 700.00, hasDeduction: true },
  { id: 47, employeeCode: 'E0037', firstName: 'ALDRED', middleName: null, lastName: 'NATARTE', email: 'aldred.natarte@example.com', position: 'Worker', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 48, employeeCode: 'E0038', firstName: 'ARNOLD', middleName: null, lastName: 'NERIDO', email: 'arnold.nerido@example.com', position: 'Worker', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 49, employeeCode: 'E0039', firstName: 'RONEL', middleName: null, lastName: 'NOSES', email: 'ronel.noses@example.com', position: 'Worker', status: 'Active', dailyRate: 500.00, hasDeduction: true },
  { id: 50, employeeCode: 'E0040', firstName: 'DANNY', middleName: null, lastName: 'PADILLA', email: 'danny.padilla@example.com', position: 'Worker', status: 'Active', dailyRate: 500.00, hasDeduction: true },
  { id: 51, employeeCode: 'E0041', firstName: 'EDGAR', middleName: null, lastName: 'PANEDA', email: 'edgar.paneda@example.com', position: 'Worker', status: 'Active', dailyRate: 550.00, hasDeduction: true },
  { id: 52, employeeCode: 'E0042', firstName: 'JEREMY', middleName: null, lastName: 'PIMENTEL', email: 'jeremy.pimentel@example.com', position: 'Worker', status: 'Active', dailyRate: 550.00, hasDeduction: true },
  { id: 53, employeeCode: 'E0043', firstName: 'MIGUEL', middleName: null, lastName: 'PREPOSI', email: 'miguel.preposi@example.com', position: 'Worker', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 54, employeeCode: 'E0044', firstName: 'JUN', middleName: null, lastName: 'ROAQUIN', email: 'jun.roaquin@example.com', position: 'Worker', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 55, employeeCode: 'E0045', firstName: 'RICKMAR', middleName: null, lastName: 'SANTOS', email: 'rickmar.santos@example.com', position: 'Worker', status: 'Active', dailyRate: 500.00, hasDeduction: true },
  { id: 56, employeeCode: 'E0046', firstName: 'RIO', middleName: null, lastName: 'SILOY', email: 'rio.siloy@example.com', position: 'Worker', status: 'Active', dailyRate: 750.00, hasDeduction: true },
  { id: 57, employeeCode: 'E0047', firstName: 'NORMAN', middleName: null, lastName: 'TARAPE', email: 'norman.tarape@example.com', position: 'Worker', status: 'Active', dailyRate: 500.00, hasDeduction: true },
  { id: 58, employeeCode: 'E0048', firstName: 'HILMAR', middleName: null, lastName: 'TATUNAY', email: 'hilmar.tatunay@example.com', position: 'Worker', status: 'Active', dailyRate: 500.00, hasDeduction: true },
  { id: 59, employeeCode: 'E0049', firstName: 'KENNETH JOHN', middleName: null, lastName: 'UGAS', email: 'kennethjohn.ugas@example.com', position: 'Worker', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 60, employeeCode: 'E0050', firstName: 'CLYDE JUSTINE', middleName: null, lastName: 'VASADRE', email: 'clydejustine.vasadre@example.com', position: 'Worker', status: 'Active', dailyRate: 500.00, hasDeduction: true },
  { id: 63, employeeCode: 'ENG-2026-0005', firstName: 'JOYLENE F.', middleName: null, lastName: 'BALANON', email: 'joylene.balanon@example.com', position: 'Engineer', status: 'Active', dailyRate: 600.00, hasDeduction: false },
  { id: 67, employeeCode: 'ADMIN-2026-0002', firstName: 'RONALYN', middleName: null, lastName: 'MALLARE', email: 'ronalyn.mallare@example.com', position: 'Admin', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 68, employeeCode: 'ENG-2026-0001', firstName: 'MICHELLE F.', middleName: null, lastName: 'NORIAL', email: 'michelle.norial@example.com', position: 'Engineer', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 113, employeeCode: 'ENG-2026-0002', firstName: 'John Kennedy', middleName: '', lastName: 'Lucas', email: 'lucas@gmail.com', position: 'Engineer', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 114, employeeCode: 'ENG-2026-0003', firstName: 'Julius John', middleName: '', lastName: 'Echague', email: 'echague@gmail.com', position: 'Engineer', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 115, employeeCode: 'PRO-2026-0001', firstName: 'Junell', middleName: '', lastName: 'Tadina', email: 'tadina@gmail.com', position: 'Engineer', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 116, employeeCode: 'ENG-2026-0006', firstName: 'Winnielyn Kaye', middleName: '', lastName: 'Olarte', email: 'olarte@gmail.com', position: 'Engineer', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 117, employeeCode: 'ADMIN-2026-0001', firstName: 'ELAINE', middleName: 'Torres', lastName: 'Aguilar', email: 'aguilar@gmail.com', position: 'Admin', status: 'Active', dailyRate: 600.00, hasDeduction: false },
  { id: 118, employeeCode: 'SA-2026-002', firstName: 'Jason', middleName: 'Larkin', lastName: 'Wong', email: 'wong@gmail.com', position: 'Super Admin', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 119, employeeCode: 'SA-2026-003', firstName: 'Lee Aldrich', middleName: '', lastName: 'Rimando', email: 'rimando@gmail.com', position: 'Super Admin', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 120, employeeCode: 'SA-2026-004', firstName: 'Marc', middleName: '', lastName: 'Arzadon', email: 'arzadon@gmail.com', position: 'Super Admin', status: 'Active', dailyRate: 600.00, hasDeduction: false },
  { id: 121, employeeCode: 'E0052', firstName: 'JOSHUA', middleName: null, lastName: 'ARQUITOLA', email: 'joshua.arquitola@example.com', position: 'Worker', status: 'Active', dailyRate: 600.00, hasDeduction: false },
  { id: 122, employeeCode: 'E0053', firstName: 'VERGEL', middleName: null, lastName: 'DACUMOS', email: 'vergel.dacumos@example.com', position: 'Worker', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 123, employeeCode: 'E0054', firstName: 'REAL RAIN', middleName: null, lastName: 'IVERSON', email: 'realrain.iverson@example.com', position: 'Worker', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 124, employeeCode: 'E0055', firstName: 'VOHANN', middleName: null, lastName: 'MIRANDA', email: 'vohann.miranda@example.com', position: 'Worker', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 125, employeeCode: 'E0056', firstName: 'SONNY', middleName: null, lastName: 'OCCIANO', email: 'sonny.occiano@example.com', position: 'Worker', status: 'Active', dailyRate: 1400.00, hasDeduction: true },
  { id: 126, employeeCode: 'E0065', firstName: 'RANDY', middleName: null, lastName: 'ATON', email: 'randy.aton@example.com', position: 'Worker', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 127, employeeCode: 'E0058', firstName: 'JHUNEL', middleName: null, lastName: 'CANCHO', email: 'jhunel.cancho@example.com', position: 'Worker', status: 'Active', dailyRate: 500.00, hasDeduction: true },
  { id: 129, employeeCode: 'E0060', firstName: 'HECTOR', middleName: null, lastName: 'PADICLAS', email: 'hector.padiclas@example.com', position: 'Worker', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 130, employeeCode: 'E0061', firstName: 'MARIANO', middleName: null, lastName: 'NERIDO', email: 'mariano.nerido@example.com', position: 'Worker', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 131, employeeCode: 'E0062', firstName: 'JAYSON KENNETH', middleName: null, lastName: 'PADILLA', email: 'jaysonkenneth.padilla@example.com', position: 'Worker', status: 'Active', dailyRate: 500.00, hasDeduction: true },
  { id: 132, employeeCode: 'E0063', firstName: 'JEFFREY', middleName: null, lastName: 'ZAMORA', email: 'jeffrey.zamora@example.com', position: 'Worker', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 133, employeeCode: 'E0064', firstName: 'FRANKIE', middleName: null, lastName: 'PADILLA', email: 'frankie.padilla@example.com', position: 'Worker', status: 'Active', dailyRate: 500.00, hasDeduction: true },
  { id: 134, employeeCode: 'E0066', firstName: 'ROMEO', middleName: null, lastName: 'GURION', email: 'romeo.gurion@example.com', position: 'Worker', status: 'Active', dailyRate: 550.00, hasDeduction: true },
  { id: 135, employeeCode: 'ADMIN-2026-0003', firstName: 'Admin', middleName: '', lastName: 'Charisse', email: 'charisse@gmail.com', position: 'ADMIN', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 136, employeeCode: 'ADMIN-2026-0004', firstName: 'Marjorie', middleName: '', lastName: 'Garcia', email: 'garcia@gmail.com', position: 'ADMIN', status: 'Active', dailyRate: 600.00, hasDeduction: true },
  { id: 137, employeeCode: 'IT-2026-001', firstName: 'Daniel', middleName: 'Obaldo', lastName: 'Rillera', email: 'danrillera.va@gmail.com', position: 'Developer', status: 'Active', dailyRate: 0.00, hasDeduction: true },
];

async function main() {
  console.log('Importing employees...');
  
  let imported = 0;
  let skipped = 0;
  
  for (const emp of employees) {
    try {
      // Check if employee already exists
      const existing = await prisma.employee.findUnique({
        where: { employeeCode: emp.employeeCode }
      });
      
      if (existing) {
        console.log(`Skipping ${emp.employeeCode} - already exists`);
        skipped++;
        continue;
      }
      
      await prisma.employee.create({
        data: {
          id: emp.id,
          employeeCode: emp.employeeCode,
          firstName: emp.firstName,
          middleName: emp.middleName || null,
          lastName: emp.lastName,
          email: emp.email,
          position: emp.position,
          status: emp.status,
          dailyRate: emp.dailyRate,
          hasDeduction: emp.hasDeduction,
          department: emp.position,
        }
      });
      
      console.log(`Imported: ${emp.employeeCode} - ${emp.firstName} ${emp.lastName}`);
      imported++;
    } catch (error) {
      console.error(`Failed to import ${emp.employeeCode}:`, error);
    }
  }
  
  console.log(`\nDone! Imported: ${imported}, Skipped: ${skipped}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
