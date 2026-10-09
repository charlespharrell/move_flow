/**
 * Local development seed — organization plus one user per role, and the full
 * demo dataset mapped from the existing frontend mock data (src/data/*.js):
 * customers.js, drivers.js, shipments.js, payments.js, activity.js.
 *
 * The credentials below are DEVELOPMENT ONLY and intentionally committed so the
 * login screen can display them. They are not production secrets and must never
 * be deployed.
 *
 * Idempotent: safe to run repeatedly, uses upserts keyed on stable IDs. Existing
 * organizations, users and customers are reused (never deleted); drivers,
 * shipments, payments and activities are created/updated from the mapped mock.
 */
import { hashPassword } from '../src/services/auth.service.js'
import { derivePaymentState } from '../src/utils/paymentState.js'
import prisma from '../src/lib/prisma.js'

const ORGANIZATION = {
  id: 'org_moveflow',
  companyName: 'MoveFlow Demo',
  companyEmail: 'hello@moveflow.local',
  companyPhone: '+234 800 000 0000',
  address: '14 Marina Road, Lagos, Nigeria',
}

export const DEV_PASSWORD = 'MoveFlow#2026'

/** 'YYYY-MM-DD' -> the Date-only column value the backend services use. */
function dateOnly(value) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null
}

const DEV_USERS = [
  {
    id: 'USR-001',
    name: 'Ada Lovelace',
    email: 'admin@moveflow.local',
    phone: '+234 801 900 0001',
    role: 'ADMINISTRATOR',
    joinedDate: new Date('2023-08-14T00:00:00.000Z'),
  },
  {
    id: 'USR-002',
    name: 'Chinedu Okeke',
    email: 'operations@moveflow.local',
    phone: '+234 801 900 0002',
    role: 'OPERATIONS',
    joinedDate: new Date('2024-01-10T00:00:00.000Z'),
  },
  {
    id: 'USR-003',
    name: 'Funmilayo Ade',
    email: 'finance@moveflow.local',
    phone: '+234 801 900 0003',
    role: 'FINANCE',
    joinedDate: new Date('2024-03-22T00:00:00.000Z'),
  },
]

// Full customer set from src/data/customers.js. IDs align with the shipment and
// payment mocks. CUST-001..005 already exist and match these values except
// CUST-005 (previously "Zenith Logistics"): it is reconciled here to the mock's
// "NorthStar Logistics" so the shipment/customer relationship the product shows
// stays intact.
const DEV_CUSTOMERS = [
  { id: 'CUST-001', businessName: 'Acme Foods', contactName: 'Grace Adeyemi', email: 'grace@acmefoods.ng', phone: '+234 801 234 0001', status: 'ACTIVE', dateJoined: dateOnly('2025-11-14') },
  { id: 'CUST-002', businessName: 'FreshMart', contactName: 'Tolu Okonkwo', email: 'tolu@freshmart.ng', phone: '+234 801 234 0002', status: 'ACTIVE', dateJoined: dateOnly('2025-12-02') },
  { id: 'CUST-003', businessName: 'BuildRight Ltd', contactName: 'Ibrahim Musa', email: 'ibrahim@buildright.ng', phone: '+234 801 234 0003', status: 'ACTIVE', dateJoined: dateOnly('2026-01-18') },
  { id: 'CUST-004', businessName: 'GreenFields', contactName: 'Ngozi Uche', email: 'ngozi@greenfields.ng', phone: '+234 801 234 0004', status: 'ACTIVE', dateJoined: dateOnly('2025-10-09') },
  { id: 'CUST-005', businessName: 'NorthStar Logistics', contactName: 'Yusuf Bello', email: 'yusuf@northstar.ng', phone: '+234 801 234 0005', status: 'ACTIVE', dateJoined: dateOnly('2026-02-11') },
  { id: 'CUST-006', businessName: 'Harvest & Co', contactName: 'Chiamaka Okoro', email: 'chiamaka@harvestco.ng', phone: '+234 801 234 0006', status: 'INACTIVE', dateJoined: dateOnly('2025-09-03') },
  { id: 'CUST-007', businessName: 'UrbanEdge Retail', contactName: 'Femi Johnson', email: 'femi@urbanedge.ng', phone: '+234 801 234 0007', status: 'ACTIVE', dateJoined: dateOnly('2026-03-07') },
  { id: 'CUST-008', businessName: 'BlueWave Trading', contactName: 'Sarah Benson', email: 'sarah@bluewave.ng', phone: '+234 801 234 0008', status: 'ACTIVE', dateJoined: dateOnly('2025-08-22') },
  { id: 'CUST-009', businessName: 'Prime Agro', contactName: 'Emmanuel Chukwu', email: 'emmanuel@primeagro.ng', phone: '+234 801 234 0009', status: 'ACTIVE', dateJoined: dateOnly('2025-07-15') },
  { id: 'CUST-010', businessName: 'Skyline Contractors', contactName: 'Amina Lawal', email: 'amina@skyline.ng', phone: '+234 801 234 0010', status: 'ACTIVE', dateJoined: dateOnly('2026-01-30') },
  { id: 'CUST-011', businessName: 'Coastal Distributors', contactName: 'David Efiong', email: 'david@coastal.ng', phone: '+234 801 234 0011', status: 'INACTIVE', dateJoined: dateOnly('2025-11-28') },
  { id: 'CUST-012', businessName: 'Metro Supplies', contactName: 'Kemi Adeoye', email: 'kemi@metrosupplies.ng', phone: '+234 801 234 0012', status: 'ACTIVE', dateJoined: dateOnly('2025-06-10') },
  { id: 'CUST-013', businessName: 'Lagos Fresh', contactName: 'Blessing Ola', email: 'blessing@lagosfresh.ng', phone: '+234 801 234 0013', status: 'ACTIVE', dateJoined: dateOnly('2026-04-02') },
  { id: 'CUST-014', businessName: 'Delta Foods', contactName: 'Peter Obi', email: 'peter@deltafoods.ng', phone: '+234 801 234 0014', status: 'ACTIVE', dateJoined: dateOnly('2026-02-19') },
  { id: 'CUST-015', businessName: 'Oyo Traders', contactName: 'Funke Adebayo', email: 'funke@oyotraders.ng', phone: '+234 801 234 0015', status: 'INACTIVE', dateJoined: dateOnly('2025-12-20') },
  { id: 'CUST-016', businessName: 'Kaduna Mills', contactName: 'Sani Ahmed', email: 'sani@kadunamills.ng', phone: '+234 801 234 0016', status: 'ACTIVE', dateJoined: dateOnly('2025-10-30') },
  { id: 'CUST-017', businessName: 'WestGate Imports', contactName: 'Lara Daniels', email: 'lara@westgate.ng', phone: '+234 801 234 0017', status: 'ACTIVE', dateJoined: dateOnly('2026-05-11') },
]

// Drivers from src/data/drivers.js. `currentShipmentId` is not part of the
// schema — the driver DTO recomputes it from the driver's active shipments, so
// it is intentionally omitted here.
const DEV_DRIVERS = [
  { id: 'DRV-001', name: 'John Doe', phone: '+234 803 100 0001', email: 'john.doe@moveflow.ng', vehicle: 'Truck — LA-842-XA', vehicleType: 'TRUCK', licenseStatus: 'VALID', verificationStatus: 'VERIFIED', status: 'ASSIGNED', joinedDate: dateOnly('2024-06-12') },
  { id: 'DRV-002', name: 'Michael James', phone: '+234 803 100 0002', email: 'michael.james@moveflow.ng', vehicle: 'Van — AB-210-KD', vehicleType: 'VAN', licenseStatus: 'VALID', verificationStatus: 'VERIFIED', status: 'AVAILABLE', joinedDate: dateOnly('2024-08-03') },
  { id: 'DRV-003', name: 'David Okoro', phone: '+234 803 100 0003', email: 'david.okoro@moveflow.ng', vehicle: 'Truck — AB-412-JJ', vehicleType: 'TRUCK', licenseStatus: 'VALID', verificationStatus: 'VERIFIED', status: 'ASSIGNED', joinedDate: dateOnly('2024-09-18') },
  { id: 'DRV-004', name: 'Samuel Peter', phone: '+234 803 100 0004', email: 'samuel.peter@moveflow.ng', vehicle: 'Truck — PH-773-BT', vehicleType: 'TRUCK', licenseStatus: 'VALID', verificationStatus: 'VERIFIED', status: 'ASSIGNED', joinedDate: dateOnly('2024-07-22') },
  { id: 'DRV-005', name: 'Aisha Bello', phone: '+234 803 100 0005', email: 'aisha.bello@moveflow.ng', vehicle: 'Truck — KN-501-LG', vehicleType: 'TRUCK', licenseStatus: 'VALID', verificationStatus: 'VERIFIED', status: 'ASSIGNED', joinedDate: dateOnly('2024-11-05') },
  { id: 'DRV-006', name: 'Emeka Nwosu', phone: '+234 803 100 0006', email: 'emeka.nwosu@moveflow.ng', vehicle: 'Van — EN-330-AP', vehicleType: 'VAN', licenseStatus: 'VALID', verificationStatus: 'VERIFIED', status: 'AVAILABLE', joinedDate: dateOnly('2024-05-14') },
  { id: 'DRV-007', name: 'Fatima Yusuf', phone: '+234 803 100 0007', email: 'fatima.yusuf@moveflow.ng', vehicle: 'Truck — KD-901-ZX', vehicleType: 'TRUCK', licenseStatus: 'EXPIRING_SOON', verificationStatus: 'PENDING', status: 'ASSIGNED', joinedDate: dateOnly('2025-01-09') },
  { id: 'DRV-008', name: 'Chidi Okafor', phone: '+234 803 100 0008', email: 'chidi.okafor@moveflow.ng', vehicle: 'Van — OG-118-PL', vehicleType: 'VAN', licenseStatus: 'VALID', verificationStatus: 'VERIFIED', status: 'AVAILABLE', joinedDate: dateOnly('2024-10-30') },
  { id: 'DRV-009', name: 'Tunde Adebayo', phone: '+234 803 100 0009', email: 'tunde.adebayo@moveflow.ng', vehicle: 'Truck — IB-622-MN', vehicleType: 'TRUCK', licenseStatus: 'VALID', verificationStatus: 'VERIFIED', status: 'ASSIGNED', joinedDate: dateOnly('2024-12-02') },
  { id: 'DRV-010', name: 'Blessing Eze', phone: '+234 803 100 0010', email: 'blessing.eze@moveflow.ng', vehicle: 'Van — LA-503-QR', vehicleType: 'VAN', licenseStatus: 'VALID', verificationStatus: 'PENDING', status: 'ASSIGNED', joinedDate: dateOnly('2025-02-14') },
  { id: 'DRV-011', name: 'Kola Williams', phone: '+234 803 100 0011', email: 'kola.williams@moveflow.ng', vehicle: 'Truck — LA-771-BB', vehicleType: 'TRUCK', licenseStatus: 'EXPIRED', verificationStatus: 'EXPIRED', status: 'OFFLINE', joinedDate: dateOnly('2023-11-20') },
  { id: 'DRV-012', name: 'Nneka Obi', phone: '+234 803 100 0012', email: 'nneka.obi@moveflow.ng', vehicle: 'Van — EN-412-CC', vehicleType: 'VAN', licenseStatus: 'VALID', verificationStatus: 'VERIFIED', status: 'AVAILABLE', joinedDate: dateOnly('2025-03-18') },
  { id: 'DRV-013', name: 'Hassan Ibrahim', phone: '+234 803 100 0013', email: 'hassan.ibrahim@moveflow.ng', vehicle: 'Truck — KN-822-DD', vehicleType: 'TRUCK', licenseStatus: 'VALID', verificationStatus: 'PENDING', status: 'OFFLINE', joinedDate: dateOnly('2024-03-11') },
  { id: 'DRV-014', name: 'Uche Nwachukwu', phone: '+234 803 100 0014', email: 'uche.nwachukwu@moveflow.ng', vehicle: 'Truck — PH-909-EE', vehicleType: 'TRUCK', licenseStatus: 'VALID', verificationStatus: 'VERIFIED', status: 'AVAILABLE', joinedDate: dateOnly('2025-04-07') },
  { id: 'DRV-015', name: 'Zainab Aliyu', phone: '+234 803 100 0015', email: 'zainab.aliyu@moveflow.ng', vehicle: 'Van — AB-333-FF', vehicleType: 'VAN', licenseStatus: 'VALID', verificationStatus: 'VERIFIED', status: 'AVAILABLE', joinedDate: dateOnly('2025-05-22') },
]

// Payments from src/data/payments.js plus two derived rows (PAY-023/PAY-024)
// for SH-1023/SH-1024, which declared a payment status in the shipment mock but
// had no Payment row behind it. Keeping one Payment per shipment lets the
// denormalised shipment.paymentStatus and the dashboard still derive correctly.
const DEV_PAYMENTS = [
  { id: 'PAY-001', shipmentId: 'SH-1001', customerId: 'CUST-001', amount: 185000, paymentMethod: 'BANK_TRANSFER', status: 'PAID', transactionReference: 'TXN-7A9F-1001-PD', createdAt: dateOnly('2026-09-20'), paidAt: dateOnly('2026-09-21'), refundedAt: null },
  { id: 'PAY-002', shipmentId: 'SH-1002', customerId: 'CUST-002', amount: 120000, paymentMethod: 'CARD', status: 'PAID', transactionReference: 'TXN-3B2E-1002-PD', createdAt: dateOnly('2026-09-12'), paidAt: dateOnly('2026-09-13'), refundedAt: null },
  { id: 'PAY-003', shipmentId: 'SH-1003', customerId: 'CUST-003', amount: 95000, paymentMethod: 'ONLINE_PAYMENT', status: 'PENDING', transactionReference: 'TXN-8C1D-1003-PE', createdAt: dateOnly('2026-09-24'), paidAt: null, refundedAt: null },
  { id: 'PAY-004', shipmentId: 'SH-1004', customerId: 'CUST-004', amount: 140000, paymentMethod: 'BANK_TRANSFER', status: 'PAID', transactionReference: 'TXN-4F6A-1004-PD', createdAt: dateOnly('2026-09-22'), paidAt: dateOnly('2026-09-23'), refundedAt: null },
  { id: 'PAY-005', shipmentId: 'SH-1005', customerId: 'CUST-005', amount: 210000, paymentMethod: 'CARD', status: 'PENDING', transactionReference: 'TXN-9E0B-1005-PE', createdAt: dateOnly('2026-09-25'), paidAt: null, refundedAt: null },
  { id: 'PAY-006', shipmentId: 'SH-1006', customerId: 'CUST-006', amount: 87500, paymentMethod: 'CASH', status: 'PAID', transactionReference: 'TXN-2D4C-1006-PD', createdAt: dateOnly('2026-09-10'), paidAt: dateOnly('2026-09-11'), refundedAt: null },
  { id: 'PAY-007', shipmentId: 'SH-1007', customerId: 'CUST-007', amount: 65000, paymentMethod: 'ONLINE_PAYMENT', status: 'FAILED', transactionReference: 'TXN-5A3B-1007-FD', createdAt: dateOnly('2026-09-26'), paidAt: null, refundedAt: null },
  { id: 'PAY-008', shipmentId: 'SH-1008', customerId: 'CUST-008', amount: 175000, paymentMethod: 'BANK_TRANSFER', status: 'PAID', transactionReference: 'TXN-6E8F-1008-PD', createdAt: dateOnly('2026-09-23'), paidAt: dateOnly('2026-09-24'), refundedAt: null },
  { id: 'PAY-009', shipmentId: 'SH-1009', customerId: 'CUST-001', amount: 245000, paymentMethod: 'CARD', status: 'REFUNDED', transactionReference: 'TXN-1C9A-1009-RF', createdAt: dateOnly('2026-09-18'), paidAt: dateOnly('2026-09-19'), refundedAt: dateOnly('2026-09-22') },
  { id: 'PAY-010', shipmentId: 'SH-1010', customerId: 'CUST-009', amount: 78000, paymentMethod: 'BANK_TRANSFER', status: 'PAID', transactionReference: 'TXN-0B7D-1010-PD', createdAt: dateOnly('2026-09-08'), paidAt: dateOnly('2026-09-09'), refundedAt: null },
  { id: 'PAY-011', shipmentId: 'SH-1011', customerId: 'CUST-010', amount: 195000, paymentMethod: 'ONLINE_PAYMENT', status: 'PAID', transactionReference: 'TXN-8F2E-1011-PD', createdAt: dateOnly('2026-09-21'), paidAt: dateOnly('2026-09-22'), refundedAt: null },
  { id: 'PAY-012', shipmentId: 'SH-1012', customerId: 'CUST-003', amount: 132000, paymentMethod: 'CASH', status: 'PENDING', transactionReference: 'TXN-3D9C-1012-PE', createdAt: dateOnly('2026-09-26'), paidAt: null, refundedAt: null },
  { id: 'PAY-013', shipmentId: 'SH-1013', customerId: 'CUST-004', amount: 110000, paymentMethod: 'CARD', status: 'PAID', transactionReference: 'TXN-7B1A-1013-PD', createdAt: dateOnly('2026-09-05'), paidAt: dateOnly('2026-09-06'), refundedAt: null },
  { id: 'PAY-014', shipmentId: 'SH-1014', customerId: 'CUST-002', amount: 168000, paymentMethod: 'BANK_TRANSFER', status: 'FAILED', transactionReference: 'TXN-4C0E-1014-FD', createdAt: dateOnly('2026-09-27'), paidAt: null, refundedAt: null },
  { id: 'PAY-015', shipmentId: 'SH-1015', customerId: 'CUST-011', amount: 225000, paymentMethod: 'ONLINE_PAYMENT', status: 'PAID', transactionReference: 'TXN-9A4F-1015-PD', createdAt: dateOnly('2026-09-20'), paidAt: dateOnly('2026-09-21'), refundedAt: null },
  { id: 'PAY-016', shipmentId: 'SH-1016', customerId: 'CUST-012', amount: 54000, paymentMethod: 'CASH', status: 'PAID', transactionReference: 'TXN-2E7B-1016-PD', createdAt: dateOnly('2026-09-03'), paidAt: dateOnly('2026-09-04'), refundedAt: null },
  { id: 'PAY-017', shipmentId: 'SH-1017', customerId: 'CUST-005', amount: 198000, paymentMethod: 'CARD', status: 'REFUNDED', transactionReference: 'TXN-1F3D-1017-RF', createdAt: dateOnly('2026-09-14'), paidAt: dateOnly('2026-09-15'), refundedAt: dateOnly('2026-09-20') },
  { id: 'PAY-018', shipmentId: 'SH-1018', customerId: 'CUST-013', amount: 72000, paymentMethod: 'BANK_TRANSFER', status: 'PENDING', transactionReference: 'TXN-6B2C-1018-PE', createdAt: dateOnly('2026-09-27'), paidAt: null, refundedAt: null },
  { id: 'PAY-019', shipmentId: 'SH-1019', customerId: 'CUST-006', amount: 158000, paymentMethod: 'ONLINE_PAYMENT', status: 'PAID', transactionReference: 'TXN-5D8A-1019-PD', createdAt: dateOnly('2026-09-24'), paidAt: dateOnly('2026-09-25'), refundedAt: null },
  { id: 'PAY-020', shipmentId: 'SH-1020', customerId: 'CUST-014', amount: 62000, paymentMethod: 'CASH', status: 'FAILED', transactionReference: 'TXN-0A6E-1020-FD', createdAt: dateOnly('2026-09-28'), paidAt: null, refundedAt: null },
  { id: 'PAY-021', shipmentId: 'SH-1021', customerId: 'CUST-007', amount: 201000, paymentMethod: 'BANK_TRANSFER', status: 'PAID', transactionReference: 'TXN-8C4A-1021-PD', createdAt: dateOnly('2026-09-01'), paidAt: dateOnly('2026-09-02'), refundedAt: null },
  { id: 'PAY-022', shipmentId: 'SH-1022', customerId: 'CUST-015', amount: 182000, paymentMethod: 'CARD', status: 'PAID', transactionReference: 'TXN-3E1B-1022-PD', createdAt: dateOnly('2026-09-22'), paidAt: dateOnly('2026-09-23'), refundedAt: null },
  { id: 'PAY-023', shipmentId: 'SH-1023', customerId: 'CUST-008', amount: 145000, paymentMethod: 'ONLINE_PAYMENT', status: 'PENDING', transactionReference: 'TXN-6D7E-1023-PE', createdAt: dateOnly('2026-09-26'), paidAt: null, refundedAt: null },
  { id: 'PAY-024', shipmentId: 'SH-1024', customerId: 'CUST-016', amount: 99000, paymentMethod: 'BANK_TRANSFER', status: 'PAID', transactionReference: 'TXN-2A9C-1024-PD', createdAt: dateOnly('2026-09-06'), paidAt: dateOnly('2026-09-07'), refundedAt: null },
]

// Shipments from src/data/shipments.js. `paymentStatus` is not copied from the
// mock verbatim: the schema treats it as a denormalised PaymentState that is
// always derived from the Payment rows (see derivePaymentState). It is computed
// below after the full payment set is known.
const DEV_SHIPMENTS = [
  { id: 'SH-1001', customerId: 'CUST-001', driverId: 'DRV-001', vehicle: 'Truck — LA-842-XA', status: 'IN_TRANSIT', origin: 'Lagos', destination: 'Abuja', currentLocation: 'Lokoja — Kogi State', amount: 185000, createdAt: dateOnly('2026-09-20'), pickupDate: dateOnly('2026-09-21'), expectedDeliveryDate: dateOnly('2026-09-28'), actualDeliveryDate: null },
  { id: 'SH-1002', customerId: 'CUST-002', driverId: 'DRV-002', vehicle: 'Van — AB-210-KD', status: 'DELIVERED', origin: 'Port Harcourt', destination: 'Lagos', currentLocation: 'Lagos — Delivered', amount: 120000, createdAt: dateOnly('2026-09-12'), pickupDate: dateOnly('2026-09-13'), expectedDeliveryDate: dateOnly('2026-09-18'), actualDeliveryDate: dateOnly('2026-09-17') },
  { id: 'SH-1003', customerId: 'CUST-003', driverId: null, vehicle: null, status: 'PENDING', origin: 'Abuja', destination: 'Kaduna', currentLocation: 'Abuja — Awaiting assignment', amount: 95000, createdAt: dateOnly('2026-09-24'), pickupDate: null, expectedDeliveryDate: dateOnly('2026-09-30'), actualDeliveryDate: null },
  { id: 'SH-1004', customerId: 'CUST-004', driverId: 'DRV-004', vehicle: 'Truck — PH-773-BT', status: 'IN_TRANSIT', origin: 'Ibadan', destination: 'Lagos', currentLocation: 'Sagamu Interchange', amount: 140000, createdAt: dateOnly('2026-09-22'), pickupDate: dateOnly('2026-09-23'), expectedDeliveryDate: dateOnly('2026-09-29'), actualDeliveryDate: null },
  { id: 'SH-1005', customerId: 'CUST-005', driverId: 'DRV-005', vehicle: 'Truck — KN-501-LG', status: 'ASSIGNED', origin: 'Kano', destination: 'Abuja', currentLocation: 'Kano Depot — Assigned', amount: 210000, createdAt: dateOnly('2026-09-25'), pickupDate: dateOnly('2026-09-26'), expectedDeliveryDate: dateOnly('2026-10-02'), actualDeliveryDate: null },
  { id: 'SH-1006', customerId: 'CUST-006', driverId: 'DRV-006', vehicle: 'Van — EN-330-AP', status: 'DELIVERED', origin: 'Enugu', destination: 'Port Harcourt', currentLocation: 'Port Harcourt — Delivered', amount: 87500, createdAt: dateOnly('2026-09-10'), pickupDate: dateOnly('2026-09-11'), expectedDeliveryDate: dateOnly('2026-09-16'), actualDeliveryDate: dateOnly('2026-09-15') },
  { id: 'SH-1007', customerId: 'CUST-007', driverId: null, vehicle: null, status: 'PENDING', origin: 'Lagos', destination: 'Ibadan', currentLocation: 'Lagos — Awaiting assignment', amount: 65000, createdAt: dateOnly('2026-09-26'), pickupDate: null, expectedDeliveryDate: dateOnly('2026-10-01'), actualDeliveryDate: null },
  { id: 'SH-1008', customerId: 'CUST-008', driverId: 'DRV-003', vehicle: 'Truck — AB-412-JJ', status: 'IN_TRANSIT', origin: 'Abuja', destination: 'Jos', currentLocation: 'Keffi — Nasarawa', amount: 175000, createdAt: dateOnly('2026-09-23'), pickupDate: dateOnly('2026-09-24'), expectedDeliveryDate: dateOnly('2026-09-30'), actualDeliveryDate: null },
  { id: 'SH-1009', customerId: 'CUST-001', driverId: 'DRV-007', vehicle: 'Truck — KD-901-ZX', status: 'CANCELLED', origin: 'Lagos', destination: 'Kano', currentLocation: 'Cancelled', amount: 245000, createdAt: dateOnly('2026-09-18'), pickupDate: null, expectedDeliveryDate: dateOnly('2026-09-26'), actualDeliveryDate: null },
  { id: 'SH-1010', customerId: 'CUST-009', driverId: 'DRV-008', vehicle: 'Van — OG-118-PL', status: 'DELIVERED', origin: 'Abeokuta', destination: 'Lagos', currentLocation: 'Lagos — Delivered', amount: 78000, createdAt: dateOnly('2026-09-08'), pickupDate: dateOnly('2026-09-09'), expectedDeliveryDate: dateOnly('2026-09-14'), actualDeliveryDate: dateOnly('2026-09-13') },
  { id: 'SH-1011', customerId: 'CUST-010', driverId: 'DRV-001', vehicle: 'Truck — LA-842-XA', status: 'IN_TRANSIT', origin: 'Onitsha', destination: 'Abuja', currentLocation: 'Benin City — Edo State', amount: 195000, createdAt: dateOnly('2026-09-21'), pickupDate: dateOnly('2026-09-22'), expectedDeliveryDate: dateOnly('2026-09-29'), actualDeliveryDate: null },
  { id: 'SH-1012', customerId: 'CUST-003', driverId: 'DRV-005', vehicle: 'Truck — KN-501-LG', status: 'ASSIGNED', origin: 'Kaduna', destination: 'Kano', currentLocation: 'Kaduna Depot — Assigned', amount: 132000, createdAt: dateOnly('2026-09-26'), pickupDate: dateOnly('2026-09-27'), expectedDeliveryDate: dateOnly('2026-10-03'), actualDeliveryDate: null },
  { id: 'SH-1013', customerId: 'CUST-004', driverId: 'DRV-009', vehicle: 'Truck — IB-622-MN', status: 'DELIVERED', origin: 'Ilorin', destination: 'Lagos', currentLocation: 'Lagos — Delivered', amount: 110000, createdAt: dateOnly('2026-09-05'), pickupDate: dateOnly('2026-09-06'), expectedDeliveryDate: dateOnly('2026-09-12'), actualDeliveryDate: dateOnly('2026-09-11') },
  { id: 'SH-1014', customerId: 'CUST-002', driverId: null, vehicle: null, status: 'PENDING', origin: 'Lagos', destination: 'Port Harcourt', currentLocation: 'Lagos — Awaiting assignment', amount: 168000, createdAt: dateOnly('2026-09-27'), pickupDate: null, expectedDeliveryDate: dateOnly('2026-10-04'), actualDeliveryDate: null },
  { id: 'SH-1015', customerId: 'CUST-011', driverId: 'DRV-004', vehicle: 'Truck — PH-773-BT', status: 'IN_TRANSIT', origin: 'Warri', destination: 'Abuja', currentLocation: 'Kogi State — En route', amount: 225000, createdAt: dateOnly('2026-09-20'), pickupDate: dateOnly('2026-09-21'), expectedDeliveryDate: dateOnly('2026-09-28'), actualDeliveryDate: null },
  { id: 'SH-1016', customerId: 'CUST-012', driverId: 'DRV-006', vehicle: 'Van — EN-330-AP', status: 'DELIVERED', origin: 'Calabar', destination: 'Uyo', currentLocation: 'Uyo — Delivered', amount: 54000, createdAt: dateOnly('2026-09-03'), pickupDate: dateOnly('2026-09-04'), expectedDeliveryDate: dateOnly('2026-09-09'), actualDeliveryDate: dateOnly('2026-09-08') },
  { id: 'SH-1017', customerId: 'CUST-005', driverId: 'DRV-002', vehicle: 'Van — AB-210-KD', status: 'CANCELLED', origin: 'Kano', destination: 'Lagos', currentLocation: 'Cancelled', amount: 198000, createdAt: dateOnly('2026-09-14'), pickupDate: null, expectedDeliveryDate: dateOnly('2026-09-22'), actualDeliveryDate: null },
  { id: 'SH-1018', customerId: 'CUST-013', driverId: 'DRV-010', vehicle: 'Van — LA-503-QR', status: 'ASSIGNED', origin: 'Lagos', destination: 'Abeokuta', currentLocation: 'Lagos Hub — Assigned', amount: 72000, createdAt: dateOnly('2026-09-27'), pickupDate: dateOnly('2026-09-28'), expectedDeliveryDate: dateOnly('2026-10-01'), actualDeliveryDate: null },
  { id: 'SH-1019', customerId: 'CUST-006', driverId: 'DRV-007', vehicle: 'Truck — KD-901-ZX', status: 'IN_TRANSIT', origin: 'Jos', destination: 'Abuja', currentLocation: 'Akwanga — Nasarawa', amount: 158000, createdAt: dateOnly('2026-09-24'), pickupDate: dateOnly('2026-09-25'), expectedDeliveryDate: dateOnly('2026-10-02'), actualDeliveryDate: null },
  { id: 'SH-1020', customerId: 'CUST-014', driverId: 'DRV-008', vehicle: 'Van — OG-118-PL', status: 'PENDING', origin: 'Benin City', destination: 'Warri', currentLocation: 'Benin City — Awaiting assignment', amount: 62000, createdAt: dateOnly('2026-09-28'), pickupDate: null, expectedDeliveryDate: dateOnly('2026-10-05'), actualDeliveryDate: null },
  { id: 'SH-1021', customerId: 'CUST-007', driverId: 'DRV-003', vehicle: 'Truck — AB-412-JJ', status: 'DELIVERED', origin: 'Abuja', destination: 'Lagos', currentLocation: 'Lagos — Delivered', amount: 201000, createdAt: dateOnly('2026-09-01'), pickupDate: dateOnly('2026-09-02'), expectedDeliveryDate: dateOnly('2026-09-08'), actualDeliveryDate: dateOnly('2026-09-07') },
  { id: 'SH-1022', customerId: 'CUST-015', driverId: 'DRV-009', vehicle: 'Truck — IB-622-MN', status: 'IN_TRANSIT', origin: 'Ibadan', destination: 'Abuja', currentLocation: 'Ogbomoso — Oyo State', amount: 182000, createdAt: dateOnly('2026-09-22'), pickupDate: dateOnly('2026-09-23'), expectedDeliveryDate: dateOnly('2026-09-30'), actualDeliveryDate: null },
  { id: 'SH-1023', customerId: 'CUST-008', driverId: 'DRV-010', vehicle: 'Van — LA-503-QR', status: 'ASSIGNED', origin: 'Lagos', destination: 'Benin City', currentLocation: 'Lagos Hub — Assigned', amount: 145000, createdAt: dateOnly('2026-09-26'), pickupDate: dateOnly('2026-09-27'), expectedDeliveryDate: dateOnly('2026-10-02'), actualDeliveryDate: null },
  { id: 'SH-1024', customerId: 'CUST-016', driverId: 'DRV-006', vehicle: 'Van — EN-330-AP', status: 'DELIVERED', origin: 'Kaduna', destination: 'Abuja', currentLocation: 'Abuja — Delivered', amount: 99000, createdAt: dateOnly('2026-09-06'), pickupDate: dateOnly('2026-09-07'), expectedDeliveryDate: dateOnly('2026-09-13'), actualDeliveryDate: dateOnly('2026-09-12') },
]

// Recent activity from src/data/activity.js. The mock stores relative labels
// ("2h ago"); here they become absolute timestamps relative to the seed run,
// which the dashboard API re-formats back to relative labels. `type` values map
// to ActivityType members and every message is preserved verbatim.
const DEV_ACTIVITIES = [
  { type: 'CREATED', message: 'Shipment SH-1020 created — Benin City → Warri', entityType: 'SHIPMENT', entityId: 'SH-1020', hoursAgo: 2 },
  { type: 'ASSIGNED', message: 'Driver Aisha Bello assigned to SH-1005', entityType: 'SHIPMENT', entityId: 'SH-1005', hoursAgo: 5 },
  { type: 'TRANSIT', message: 'SH-1004 departed Sagamu Interchange', entityType: 'SHIPMENT', entityId: 'SH-1004', hoursAgo: 7 },
  { type: 'DELIVERED', message: 'SH-1002 delivered to Lagos — ₦120,000', entityType: 'SHIPMENT', entityId: 'SH-1002', hoursAgo: 24 },
  { type: 'PAYMENT', message: 'Payment received for SH-1010 — ₦78,000', entityType: 'SHIPMENT', entityId: 'SH-1010', hoursAgo: 28 },
  { type: 'CANCELLED', message: 'SH-1009 cancelled — refund initiated', entityType: 'SHIPMENT', entityId: 'SH-1009', hoursAgo: 50 },
]

async function main() {
  await prisma.organization.upsert({
    where: { id: ORGANIZATION.id },
    update: { ...ORGANIZATION },
    create: ORGANIZATION,
  })

  for (const user of DEV_USERS) {
    const { id, ...rest } = user
    // Hash once per run rather than per user.
    const passwordHash = await hashPassword(DEV_PASSWORD)
    await prisma.user.upsert({
      where: { id },
      update: { ...rest, passwordHash, status: 'ACTIVE' },
      create: { id, ...rest, passwordHash, status: 'ACTIVE' },
    })
  }

  for (const customer of DEV_CUSTOMERS) {
    const { id, ...rest } = customer
    await prisma.customer.upsert({
      where: { id },
      update: { ...rest },
      create: { id, ...rest },
    })
  }

  for (const driver of DEV_DRIVERS) {
    const { id, ...rest } = driver
    await prisma.driver.upsert({
      where: { id },
      update: { ...rest },
      create: { id, ...rest },
    })
  }

  // Denormalised payment state, derived from the seeded Payment rows using the
  // same rule the backend services enforce (see utils/paymentState.js). Runs
  // before the shipment upserts so the stored column is always consistent.
  const paymentRowsByShipment = new Map()
  for (const payment of DEV_PAYMENTS) {
    const rows = paymentRowsByShipment.get(payment.shipmentId) ?? []
    rows.push({ status: payment.status })
    paymentRowsByShipment.set(payment.shipmentId, rows)
  }
  const shipmentStates = new Map()
  for (const shipment of DEV_SHIPMENTS) {
    shipmentStates.set(shipment.id, derivePaymentState(paymentRowsByShipment.get(shipment.id) ?? []))
  }

  for (const shipment of DEV_SHIPMENTS) {
    const { id, ...rest } = shipment
    await prisma.shipment.upsert({
      where: { id },
      update: { ...rest, paymentStatus: shipmentStates.get(id) },
      create: { id, ...rest, paymentStatus: shipmentStates.get(id) },
    })
  }

  for (const payment of DEV_PAYMENTS) {
    const { id, ...rest } = payment
    await prisma.payment.upsert({
      where: { id },
      update: { ...rest },
      create: { id, ...rest },
    })
  }

  // Activities have auto-generated cuid ids with no stable natural key, so the
  // existence check is (type, message, entityId) — re-running never duplicates.
  for (const activity of DEV_ACTIVITIES) {
    const exists = await prisma.activity.findFirst({
      where: {
        type: activity.type,
        message: activity.message,
        entityType: activity.entityType,
        entityId: activity.entityId,
      },
    })
    if (exists) continue
    await prisma.activity.create({
      data: {
        type: activity.type,
        message: activity.message,
        entityType: activity.entityType,
        entityId: activity.entityId,
        createdAt: new Date(Date.now() - activity.hoursAgo * 60 * 60 * 1000),
      },
    })
  }

  console.log(
    `Seeded organization "${ORGANIZATION.companyName}", ${DEV_USERS.length} users, ` +
      `${DEV_CUSTOMERS.length} customers, ${DEV_DRIVERS.length} drivers, ` +
      `${DEV_SHIPMENTS.length} shipments, ${DEV_PAYMENTS.length} payments and ${DEV_ACTIVITIES.length} activities.`,
  )
  console.log(`Development password for all seeded accounts: ${DEV_PASSWORD}`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error('Seed failed:', error.message)
    await prisma.$disconnect()
    process.exit(1)
  })