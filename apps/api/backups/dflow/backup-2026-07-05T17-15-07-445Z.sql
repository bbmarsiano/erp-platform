--
-- PostgreSQL database dump
--

\restrict Ujt3IDZmpB5uag07UguEdbSw2bCRMGkpSTkyXrAHBRg0VOFkltDbR8H6jxiVJbe

-- Dumped from database version 14.20 (Homebrew)
-- Dumped by pg_dump version 14.20 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: BackupJobStatus; Type: TYPE; Schema: public; Owner: dimitarmitrev
--

CREATE TYPE public."BackupJobStatus" AS ENUM (
    'PENDING',
    'RUNNING',
    'COMPLETED',
    'FAILED',
    'VERIFIED'
);


ALTER TYPE public."BackupJobStatus" OWNER TO dimitarmitrev;

--
-- Name: BackupTarget; Type: TYPE; Schema: public; Owner: dimitarmitrev
--

CREATE TYPE public."BackupTarget" AS ENUM (
    'LOCAL',
    'NETWORK',
    'S3'
);


ALTER TYPE public."BackupTarget" OWNER TO dimitarmitrev;

--
-- Name: DocumentStatus; Type: TYPE; Schema: public; Owner: dimitarmitrev
--

CREATE TYPE public."DocumentStatus" AS ENUM (
    'DRAFT',
    'CONFIRMED',
    'CANCELLED'
);


ALTER TYPE public."DocumentStatus" OWNER TO dimitarmitrev;

--
-- Name: LocationType; Type: TYPE; Schema: public; Owner: dimitarmitrev
--

CREATE TYPE public."LocationType" AS ENUM (
    'STORAGE',
    'RECEIVING',
    'DISPATCH',
    'QUARANTINE',
    'PRODUCTION'
);


ALTER TYPE public."LocationType" OWNER TO dimitarmitrev;

--
-- Name: MovementType; Type: TYPE; Schema: public; Owner: dimitarmitrev
--

CREATE TYPE public."MovementType" AS ENUM (
    'IN',
    'OUT',
    'TRANSFER',
    'ADJUSTMENT'
);


ALTER TYPE public."MovementType" OWNER TO dimitarmitrev;

--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: dimitarmitrev
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'CASH',
    'CARD',
    'MIXED'
);


ALTER TYPE public."PaymentMethod" OWNER TO dimitarmitrev;

--
-- Name: PurchaseOrderStatus; Type: TYPE; Schema: public; Owner: dimitarmitrev
--

CREATE TYPE public."PurchaseOrderStatus" AS ENUM (
    'DRAFT',
    'SENT',
    'PARTIALLY_RECEIVED',
    'RECEIVED',
    'CANCELLED'
);


ALTER TYPE public."PurchaseOrderStatus" OWNER TO dimitarmitrev;

--
-- Name: SaleStatus; Type: TYPE; Schema: public; Owner: dimitarmitrev
--

CREATE TYPE public."SaleStatus" AS ENUM (
    'COMPLETED',
    'REFUNDED',
    'CANCELLED'
);


ALTER TYPE public."SaleStatus" OWNER TO dimitarmitrev;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: dimitarmitrev
--

CREATE TYPE public."UserRole" AS ENUM (
    'SUPER_ADMIN',
    'ADMIN',
    'MANAGER',
    'OPERATOR',
    'READONLY'
);


ALTER TYPE public."UserRole" OWNER TO dimitarmitrev;

--
-- Name: WorkOrderStatus; Type: TYPE; Schema: public; Owner: dimitarmitrev
--

CREATE TYPE public."WorkOrderStatus" AS ENUM (
    'DRAFT',
    'RELEASED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."WorkOrderStatus" OWNER TO dimitarmitrev;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "userId" text,
    action text NOT NULL,
    entity text NOT NULL,
    "entityId" text,
    payload jsonb,
    "ipAddress" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AuditLog" OWNER TO dimitarmitrev;

--
-- Name: BackupJob; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."BackupJob" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "policyId" text,
    status public."BackupJobStatus" DEFAULT 'PENDING'::public."BackupJobStatus" NOT NULL,
    "startedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "sizeBytes" bigint,
    "filePath" text,
    checksum text,
    "errorMsg" text,
    note text,
    "isVerified" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."BackupJob" OWNER TO dimitarmitrev;

--
-- Name: BackupPolicy; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."BackupPolicy" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    schedule text NOT NULL,
    "retentionDays" integer DEFAULT 30 NOT NULL,
    "targetType" public."BackupTarget" DEFAULT 'LOCAL'::public."BackupTarget" NOT NULL,
    "targetPath" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "isEncrypted" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."BackupPolicy" OWNER TO dimitarmitrev;

--
-- Name: BankAccount; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."BankAccount" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    iban text NOT NULL,
    currency text DEFAULT 'BGN'::text NOT NULL,
    "bankName" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."BankAccount" OWNER TO dimitarmitrev;

--
-- Name: BankTransaction; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."BankTransaction" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "bankAccountId" text NOT NULL,
    "transactionDate" timestamp(3) without time zone NOT NULL,
    "valueDate" timestamp(3) without time zone,
    amount numeric(12,2) NOT NULL,
    description text NOT NULL,
    counterparty text,
    "referenceNumber" text,
    "transactionType" text NOT NULL,
    "matchedType" text,
    "matchedId" text,
    "isReconciled" boolean DEFAULT false NOT NULL,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."BankTransaction" OWNER TO dimitarmitrev;

--
-- Name: BillOfMaterials; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."BillOfMaterials" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "productId" text NOT NULL,
    version text DEFAULT '1.0'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."BillOfMaterials" OWNER TO dimitarmitrev;

--
-- Name: BomItem; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."BomItem" (
    id text NOT NULL,
    "bomId" text NOT NULL,
    "componentId" text NOT NULL,
    quantity double precision NOT NULL,
    unit text,
    note text
);


ALTER TABLE public."BomItem" OWNER TO dimitarmitrev;

--
-- Name: CashRegister; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."CashRegister" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "warehouseId" text NOT NULL,
    "locationId" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CashRegister" OWNER TO dimitarmitrev;

--
-- Name: ChartOfAccount; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."ChartOfAccount" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "accountType" text NOT NULL,
    "parentId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ChartOfAccount" OWNER TO dimitarmitrev;

--
-- Name: Customer; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."Customer" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    eik text,
    "vatNumber" text,
    address text,
    city text,
    email text,
    phone text,
    "contactPerson" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Customer" OWNER TO dimitarmitrev;

--
-- Name: Delivery; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."Delivery" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "deliveryNo" text NOT NULL,
    "purchaseOrderId" text,
    "warehouseId" text NOT NULL,
    "supplierName" text,
    status public."DocumentStatus" DEFAULT 'DRAFT'::public."DocumentStatus" NOT NULL,
    "deliveryDate" timestamp(3) without time zone,
    note text,
    "goodsReceiptId" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Delivery" OWNER TO dimitarmitrev;

--
-- Name: DeliveryLine; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."DeliveryLine" (
    id text NOT NULL,
    "deliveryId" text NOT NULL,
    "productId" text NOT NULL,
    "locationId" text NOT NULL,
    quantity double precision NOT NULL,
    "lotNumber" text,
    "expiryDate" timestamp(3) without time zone
);


ALTER TABLE public."DeliveryLine" OWNER TO dimitarmitrev;

--
-- Name: DocumentSequence; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."DocumentSequence" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "docType" text NOT NULL,
    "lastNumber" integer DEFAULT 0 NOT NULL,
    prefix text
);


ALTER TABLE public."DocumentSequence" OWNER TO dimitarmitrev;

--
-- Name: FinancialPeriod; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."FinancialPeriod" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    "isClosed" boolean DEFAULT false NOT NULL,
    "closedAt" timestamp(3) without time zone,
    "closedBy" text
);


ALTER TABLE public."FinancialPeriod" OWNER TO dimitarmitrev;

--
-- Name: GoodsIssue; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."GoodsIssue" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "issueNo" text NOT NULL,
    "warehouseId" text NOT NULL,
    destination text,
    note text,
    status public."DocumentStatus" DEFAULT 'DRAFT'::public."DocumentStatus" NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."GoodsIssue" OWNER TO dimitarmitrev;

--
-- Name: GoodsIssueLine; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."GoodsIssueLine" (
    id text NOT NULL,
    "issueId" text NOT NULL,
    "productId" text NOT NULL,
    "locationId" text NOT NULL,
    quantity double precision NOT NULL,
    "lotNumber" text
);


ALTER TABLE public."GoodsIssueLine" OWNER TO dimitarmitrev;

--
-- Name: GoodsReceipt; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."GoodsReceipt" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "receiptNo" text NOT NULL,
    "warehouseId" text NOT NULL,
    "supplierName" text,
    note text,
    status public."DocumentStatus" DEFAULT 'DRAFT'::public."DocumentStatus" NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."GoodsReceipt" OWNER TO dimitarmitrev;

--
-- Name: GoodsReceiptLine; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."GoodsReceiptLine" (
    id text NOT NULL,
    "receiptId" text NOT NULL,
    "productId" text NOT NULL,
    "locationId" text NOT NULL,
    quantity double precision NOT NULL,
    "lotNumber" text,
    "expiryDate" timestamp(3) without time zone
);


ALTER TABLE public."GoodsReceiptLine" OWNER TO dimitarmitrev;

--
-- Name: Invoice; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."Invoice" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "docType" text NOT NULL,
    number text NOT NULL,
    "issueDate" timestamp(3) without time zone NOT NULL,
    "dueDate" timestamp(3) without time zone,
    "taxEventDate" timestamp(3) without time zone,
    "customerId" text,
    "supplierId" text,
    currency text DEFAULT 'BGN'::text NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    "vatAmount" numeric(12,2) NOT NULL,
    "totalAmount" numeric(12,2) NOT NULL,
    "vatRate" numeric(5,2) DEFAULT 20.00 NOT NULL,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    note text,
    "relatedPOId" text,
    "relatedSaleId" text,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Invoice" OWNER TO dimitarmitrev;

--
-- Name: InvoiceLine; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."InvoiceLine" (
    id text NOT NULL,
    "invoiceId" text NOT NULL,
    "productId" text,
    description text NOT NULL,
    quantity numeric(12,3) NOT NULL,
    "unitPrice" numeric(12,2) NOT NULL,
    "vatRate" numeric(5,2) DEFAULT 20.00 NOT NULL,
    "lineTotal" numeric(12,2) NOT NULL
);


ALTER TABLE public."InvoiceLine" OWNER TO dimitarmitrev;

--
-- Name: JournalEntry; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."JournalEntry" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "entryDate" timestamp(3) without time zone NOT NULL,
    description text NOT NULL,
    "sourceType" text NOT NULL,
    "sourceId" text,
    "isPosted" boolean DEFAULT true NOT NULL,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."JournalEntry" OWNER TO dimitarmitrev;

--
-- Name: JournalEntryLine; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."JournalEntryLine" (
    id text NOT NULL,
    "journalEntryId" text NOT NULL,
    "accountId" text NOT NULL,
    debit numeric(12,2) DEFAULT 0 NOT NULL,
    credit numeric(12,2) DEFAULT 0 NOT NULL,
    description text
);


ALTER TABLE public."JournalEntryLine" OWNER TO dimitarmitrev;

--
-- Name: LicenseKey; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."LicenseKey" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    key text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    features jsonb DEFAULT '[]'::jsonb NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastValidAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."LicenseKey" OWNER TO dimitarmitrev;

--
-- Name: Location; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."Location" (
    id text NOT NULL,
    "warehouseId" text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    zone text,
    "locationType" public."LocationType" DEFAULT 'STORAGE'::public."LocationType" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Location" OWNER TO dimitarmitrev;

--
-- Name: MaterialConsumption; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."MaterialConsumption" (
    id text NOT NULL,
    "workOrderId" text NOT NULL,
    "productId" text NOT NULL,
    "locationId" text NOT NULL,
    "plannedQty" double precision NOT NULL,
    "consumedQty" double precision DEFAULT 0 NOT NULL,
    "lotNumber" text
);


ALTER TABLE public."MaterialConsumption" OWNER TO dimitarmitrev;

--
-- Name: Payable; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."Payable" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "invoiceId" text NOT NULL,
    "supplierId" text NOT NULL,
    "amountDue" numeric(12,2) NOT NULL,
    "amountPaid" numeric(12,2) DEFAULT 0 NOT NULL,
    "dueDate" timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'OPEN'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Payable" OWNER TO dimitarmitrev;

--
-- Name: PosInvoice; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."PosInvoice" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    number text NOT NULL,
    "saleId" text NOT NULL,
    "customerId" text NOT NULL,
    "issueDate" timestamp(3) without time zone NOT NULL,
    "dueDate" timestamp(3) without time zone,
    "taxEventDate" timestamp(3) without time zone,
    subtotal numeric(12,2) NOT NULL,
    "vatAmount" numeric(12,2) NOT NULL,
    "totalAmount" numeric(12,2) NOT NULL,
    "vatRate" numeric(5,2) DEFAULT 20.00 NOT NULL,
    "paymentMethod" text NOT NULL,
    status text DEFAULT 'ISSUED'::text NOT NULL,
    note text,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PosInvoice" OWNER TO dimitarmitrev;

--
-- Name: Product; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    unit text DEFAULT 'бр.'::text NOT NULL,
    category text,
    "minStock" double precision DEFAULT 0 NOT NULL,
    "maxStock" double precision,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    barcode text,
    price double precision
);


ALTER TABLE public."Product" OWNER TO dimitarmitrev;

--
-- Name: PurchaseOrder; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."PurchaseOrder" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "orderNo" text NOT NULL,
    "supplierId" text NOT NULL,
    "warehouseId" text NOT NULL,
    status public."PurchaseOrderStatus" DEFAULT 'DRAFT'::public."PurchaseOrderStatus" NOT NULL,
    "expectedDate" timestamp(3) without time zone,
    note text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PurchaseOrder" OWNER TO dimitarmitrev;

--
-- Name: PurchaseOrderLine; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."PurchaseOrderLine" (
    id text NOT NULL,
    "purchaseOrderId" text NOT NULL,
    "productId" text NOT NULL,
    quantity double precision NOT NULL,
    "receivedQty" double precision DEFAULT 0 NOT NULL,
    "unitPrice" double precision,
    unit text
);


ALTER TABLE public."PurchaseOrderLine" OWNER TO dimitarmitrev;

--
-- Name: Receivable; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."Receivable" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "invoiceId" text NOT NULL,
    "customerId" text NOT NULL,
    "amountDue" numeric(12,2) NOT NULL,
    "amountPaid" numeric(12,2) DEFAULT 0 NOT NULL,
    "dueDate" timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'OPEN'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Receivable" OWNER TO dimitarmitrev;

--
-- Name: Sale; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."Sale" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "saleNo" text NOT NULL,
    "cashRegisterId" text NOT NULL,
    "paymentMethod" public."PaymentMethod" DEFAULT 'CASH'::public."PaymentMethod" NOT NULL,
    "totalAmount" double precision NOT NULL,
    status public."SaleStatus" DEFAULT 'COMPLETED'::public."SaleStatus" NOT NULL,
    note text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "customerId" text
);


ALTER TABLE public."Sale" OWNER TO dimitarmitrev;

--
-- Name: SaleLine; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."SaleLine" (
    id text NOT NULL,
    "saleId" text NOT NULL,
    "productId" text NOT NULL,
    "locationId" text NOT NULL,
    quantity double precision NOT NULL,
    "unitPrice" double precision NOT NULL,
    "totalPrice" double precision NOT NULL,
    "lotNumber" text
);


ALTER TABLE public."SaleLine" OWNER TO dimitarmitrev;

--
-- Name: StockItem; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."StockItem" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "productId" text NOT NULL,
    "locationId" text NOT NULL,
    quantity double precision DEFAULT 0 NOT NULL,
    "reservedQty" double precision DEFAULT 0 NOT NULL,
    "lotNumber" text,
    "expiryDate" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."StockItem" OWNER TO dimitarmitrev;

--
-- Name: StockMovement; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."StockMovement" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "productId" text NOT NULL,
    "movementType" public."MovementType" NOT NULL,
    quantity double precision NOT NULL,
    "fromLocationId" text,
    "toLocationId" text,
    "referenceType" text,
    "referenceId" text,
    "lotNumber" text,
    note text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."StockMovement" OWNER TO dimitarmitrev;

--
-- Name: Supplier; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."Supplier" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "contactName" text,
    email text,
    phone text,
    address text,
    "taxNumber" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Supplier" OWNER TO dimitarmitrev;

--
-- Name: Tenant; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."Tenant" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    "logoUrl" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    address text,
    eik text,
    "vatNumber" text,
    "vatRegistered" boolean DEFAULT false NOT NULL,
    mol text,
    city text,
    country text DEFAULT 'България'::text NOT NULL,
    phone text,
    email text,
    "bankName" text,
    "bankIban" text,
    "enabledModules" text[] DEFAULT ARRAY['wms'::text, 'scm'::text, 'mes'::text, 'pos'::text, 'backup'::text],
    "posInvoiceStartNumber" integer DEFAULT 1 NOT NULL,
    "posInvoiceLastNumber" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Tenant" OWNER TO dimitarmitrev;

--
-- Name: User; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    "hashedPassword" text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    role public."UserRole" DEFAULT 'OPERATOR'::public."UserRole" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "tenantId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO dimitarmitrev;

--
-- Name: Warehouse; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."Warehouse" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    address text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Warehouse" OWNER TO dimitarmitrev;

--
-- Name: WorkOrder; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public."WorkOrder" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "orderNo" text NOT NULL,
    "productId" text NOT NULL,
    "bomId" text,
    "warehouseId" text NOT NULL,
    "outputLocationId" text NOT NULL,
    "plannedQty" double precision NOT NULL,
    "producedQty" double precision DEFAULT 0 NOT NULL,
    status public."WorkOrderStatus" DEFAULT 'DRAFT'::public."WorkOrderStatus" NOT NULL,
    "plannedStart" timestamp(3) without time zone,
    "plannedEnd" timestamp(3) without time zone,
    "actualStart" timestamp(3) without time zone,
    "actualEnd" timestamp(3) without time zone,
    note text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."WorkOrder" OWNER TO dimitarmitrev;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: dimitarmitrev
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO dimitarmitrev;

--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."AuditLog" (id, "tenantId", "userId", action, entity, "entityId", payload, "ipAddress", "createdAt") FROM stdin;
cmr0khak50001p8yuchhun2ls	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-06-30 11:32:12.341
cmr0khayx0003p8yushahsdy6	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-06-30 11:32:12.874
cmr0khbc50005p8yum7yxn4fg	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-06-30 11:32:13.35
cmr0khjmu0007p8yusa19qdgx	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-06-30 11:32:24.102
cmr0km6x60001uw2mdjkyfnxm	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-06-30 11:36:00.906
cmr0km7890003uw2m1ma9l2r6	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-06-30 11:36:01.305
cmr0km7ls0007uw2mxmbf0oth	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm3x000ux3e88pajry3b	LOGIN	User	cmr0kgm3x000ux3e88pajry3b	{"email": "operator@metalkonstrukt.bg"}	\N	2026-06-30 11:36:01.792
cmr0kmm5w0009uw2m101qydze	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-06-30 11:36:20.66
cmr0kpc91000buw2mvnn23gkf	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-06-30 11:38:27.781
cmr0l5ohn0001cvr3qqw36w7k	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-06-30 11:51:10.139
cmr0l8fkw0003cvr3z730e8bb	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm3x000ux3e88pajry3b	LOGIN	User	cmr0kgm3x000ux3e88pajry3b	{"email": "operator@metalkonstrukt.bg"}	\N	2026-06-30 11:53:18.56
cmr0ls8m2000110nc7rk6igzx	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-06-30 12:08:42.65
cmr0lso26000310ncckr6mqvu	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-06-30 12:09:02.671
cmr0qbyv6000s10nc7axpor8v	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-06-30 14:16:01.601
cmr0ttvsi000y10nc6hkoytvo	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-06-30 15:53:56.274
cmr0u73cf0001xncok6igh8g5	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-06-30 16:04:12.591
cmr0u7bpk000wxnco0m8j5ulq	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-06-30 16:04:23.433
cmr0u7qwh000yxncoj018vu4p	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-06-30 16:04:43.122
cmr0u7yej0010xnconsfk1ug3	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-06-30 16:04:52.844
cmr0u89zw001nxncomyp4q3ge	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-06-30 16:05:07.869
cmr0uebma000142xgr7y37u24	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-06-30 16:09:49.906
cmr118xcr000k42xguswo3kzt	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-06-30 19:21:35.451
cmr12gnpe00011rup9ybwmmdx	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-06-30 19:55:35.81
cmr1mixgr00018of3cest9mkj	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-07-01 05:17:14.091
cmr1mv14z0001op7ll3k96owd	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-07-01 05:26:38.724
cmr1mv5t8000gop7l0vv9sbar	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-07-01 05:26:44.78
cmr1myd7w000iop7lbisoid52	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-07-01 05:29:14.348
cmr1ngui00001vsc30nfyra4d	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-07-01 05:43:36.552
cmr1ngzmq0003vsc3yxf0y3o8	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-07-01 05:43:43.202
cmr1nh41k0005vsc3o06f1tb8	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-07-01 05:43:48.92
cmr1nhb5x000kvsc3bz85i9e2	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-07-01 05:43:58.149
cmr1nhbj5000mvsc3k593ikr8	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm3x000tx3e8ekwl0w7y	LOGIN	User	cmr0kgm3x000tx3e8ekwl0w7y	{"email": "manager@metalkonstrukt.bg"}	\N	2026-07-01 05:43:58.625
cmr1tltaf0001rww1ysgoiy6c	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-07-01 08:35:25.959
cmr335mdm0001cg282529nopo	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-07-02 05:50:32.842
cmr34fp3q0001cibj8jh8wj3d	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-07-02 06:26:22.55
cmr3h0gul0001fwjuhpc774t4	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-07-02 12:18:27.022
cmr3ied4n0003fwjuhigye5f5	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-07-02 12:57:14.999
cmr3iih5f0005fwjuoju1yf2k	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-07-02 13:00:26.836
cmr3in7150007fwjuliser7hc	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-07-02 13:04:07.002
cmr3j8ezk0009fwjuu4v3823w	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-07-02 13:20:37.089
cmr4hrerq000bfwjuxttoxubl	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-07-03 05:27:10.215
cmr7xvu460001ab4rliw8b4mh	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-07-05 15:21:49.11
cmr81aomu000110xud7srbb61	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm0p000sx3e8nchhuoqj	LOGIN	User	cmr0kgm0p000sx3e8nchhuoqj	{"email": "admin@metalkonstrukt.bg"}	\N	2026-07-05 16:57:20.694
\.


--
-- Data for Name: BackupJob; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."BackupJob" (id, "tenantId", "policyId", status, "startedAt", "completedAt", "sizeBytes", "filePath", checksum, "errorMsg", note, "isVerified", "createdAt") FROM stdin;
cmr81l41a000144cgd628mdj1	cmr0kglyo0000x3e89bbsy2vr	default-backup-policy	FAILED	2026-07-05 17:05:27.217	2026-07-05 17:05:27.219	\N	\N	\N	ENOENT: no such file or directory, mkdir '/backups'	\N	f	2026-07-05 17:05:27.214
cmr81sidy000114gc7ta0afbg	cmr0kglyo0000x3e89bbsy2vr	default-backup-policy	FAILED	2026-07-05 17:11:12.409	2026-07-05 17:11:12.412	\N	\N	\N	ENOENT: no such file or directory, mkdir '/backups'	Верифицирано ръчно на 5.07.2026 г., 20:11:16 ч.	t	2026-07-05 17:11:12.406
cmr81xjqo000314gcekvktwj2	cmr0kglyo0000x3e89bbsy2vr	default-backup-policy	RUNNING	2026-07-05 17:15:07.442	\N	\N	\N	\N	\N	\N	f	2026-07-05 17:15:07.44
cmr7yd93h0001hfwnlh911ax3	cmr0kglyo0000x3e89bbsy2vr	default-backup-policy	FAILED	2026-07-05 15:35:21.682	2026-07-05 15:35:21.684	\N	\N	\N	ENOENT: no such file or directory, mkdir '/backups'	Верифицирано ръчно на 5.07.2026 г., 18:40:08 ч.	t	2026-07-05 15:35:21.678
cmr7ymh3x0003hfwnifo5xtta	cmr0kglyo0000x3e89bbsy2vr	default-backup-policy	FAILED	2026-07-05 15:42:31.969	2026-07-05 15:42:31.973	\N	\N	\N	ENOENT: no such file or directory, mkdir '/backups'	\N	f	2026-07-05 15:42:31.965
cmr81bhod000310xuljxihedr	cmr0kglyo0000x3e89bbsy2vr	default-backup-policy	FAILED	2026-07-05 16:57:58.337	2026-07-05 16:57:58.341	\N	\N	\N	ENOENT: no such file or directory, mkdir '/backups'	\N	f	2026-07-05 16:57:58.333
\.


--
-- Data for Name: BackupPolicy; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."BackupPolicy" (id, "tenantId", name, schedule, "retentionDays", "targetType", "targetPath", "isActive", "isEncrypted", "createdAt", "updatedAt") FROM stdin;
default-backup-policy	cmr0kglyo0000x3e89bbsy2vr	Дневен архив	0 2 * * *	30	LOCAL	\N	t	t	2026-06-30 11:31:40.688	2026-06-30 11:31:40.688
\.


--
-- Data for Name: BankAccount; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."BankAccount" (id, "tenantId", name, iban, currency, "bankName", "isActive", "createdAt", "updatedAt") FROM stdin;
cmr1mv1im0003op7lza3jc8g9	cmr0kglyo0000x3e89bbsy2vr	Основна сметка — УниКредит	BG80BNBG96611020345678	BGN	УниКредит Булбанк	t	2026-07-01 05:26:39.214	2026-07-01 05:26:39.214
\.


--
-- Data for Name: BankTransaction; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."BankTransaction" (id, "tenantId", "bankAccountId", "transactionDate", "valueDate", amount, description, counterparty, "referenceNumber", "transactionType", "matchedType", "matchedId", "isReconciled", "createdBy", "createdAt") FROM stdin;
cmr1mv1l00005op7lg5wsrfxf	cmr0kglyo0000x3e89bbsy2vr	cmr1mv1im0003op7lza3jc8g9	2026-06-05 00:00:00	\N	200.00	Плащане фактура 0000000001	Тест Клиент ООД	\N	IN	RECEIVABLE	cmr0lsokf000d10nczkw443jw	t	cmr0kgm0p000sx3e8nchhuoqj	2026-07-01 05:26:39.301
cmr1mv1ow000dop7lgy69bxa2	cmr0kglyo0000x3e89bbsy2vr	cmr1mv1im0003op7lza3jc8g9	2026-06-05 00:00:00	\N	-240.00	Плащане фактура 0000000001 входяща	Стоманени профили ЕООД	\N	OUT	PAYABLE	cmr0qffh5000v10nc3wvyycua	t	cmr0kgm0p000sx3e8nchhuoqj	2026-07-01 05:26:39.441
\.


--
-- Data for Name: BillOfMaterials; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."BillOfMaterials" (id, "tenantId", "productId", version, "isActive", "createdAt", "updatedAt") FROM stdin;
cmr0kgm4r0036x3e8smect54d	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm49001sx3e8hukdxkj5	1.0	t	2026-06-30 11:31:40.683	2026-06-30 11:31:40.683
cmr0kgm4t003dx3e87zsrhavm	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm49001ux3e8tvcdbfjk	1.0	t	2026-06-30 11:31:40.686	2026-06-30 11:31:40.686
\.


--
-- Data for Name: BomItem; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."BomItem" (id, "bomId", "componentId", quantity, unit, note) FROM stdin;
cmr0kgm4s0037x3e80s0u9jai	cmr0kgm4r0036x3e8smect54d	cmr0kgm46001ex3e8h7m9ehx5	6	м	\N
cmr0kgm4s0038x3e87ka2u1pu	cmr0kgm4r0036x3e8smect54d	cmr0kgm48001kx3e891od14z2	4	м	\N
cmr0kgm4s0039x3e8ibt2svaw	cmr0kgm4r0036x3e8smect54d	cmr0kgm48001mx3e834f1olyj	0.5	кг	\N
cmr0kgm4s003ax3e8065sse8r	cmr0kgm4r0036x3e8smect54d	cmr0kgm48001ox3e8229dacro	0.3	л	\N
cmr0kgm4s003bx3e809ts3di4	cmr0kgm4r0036x3e8smect54d	cmr0kgm49001qx3e86d6vlgd7	8	бр	\N
cmr0kgm4u003ex3e83czbec7e	cmr0kgm4t003dx3e87zsrhavm	cmr0kgm46001ex3e8h7m9ehx5	8	м	\N
cmr0kgm4u003fx3e82goat0vg	cmr0kgm4t003dx3e87zsrhavm	cmr0kgm47001ix3e8lys67azc	2	м	\N
cmr0kgm4u003gx3e8ko85hwq0	cmr0kgm4t003dx3e87zsrhavm	cmr0kgm48001mx3e834f1olyj	0.8	кг	\N
cmr0kgm4u003hx3e80atr4kee	cmr0kgm4t003dx3e87zsrhavm	cmr0kgm48001ox3e8229dacro	0.5	л	\N
cmr0kgm4u003ix3e8cmhczqbx	cmr0kgm4t003dx3e87zsrhavm	cmr0kgm49001qx3e86d6vlgd7	12	бр	\N
\.


--
-- Data for Name: CashRegister; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."CashRegister" (id, "tenantId", code, name, "warehouseId", "locationId", "isActive", "createdAt", "updatedAt") FROM stdin;
cmr0kgm4v003kx3e8zyun7epa	cmr0kglyo0000x3e89bbsy2vr	CASH-01	Каса Шоурум	cmr0kgm420010x3e8ntg3fz42	cmr0kgm45001ax3e8ti8ksh2x	t	2026-06-30 11:31:40.687	2026-06-30 11:31:40.687
\.


--
-- Data for Name: ChartOfAccount; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."ChartOfAccount" (id, "tenantId", code, name, "accountType", "parentId", "isActive", "createdAt") FROM stdin;
cmr0kglyq0002x3e86mt78773	cmr0kglyo0000x3e89bbsy2vr	501	Каса	ASSET	\N	t	2026-06-30 11:31:40.467
cmr0kglyu0004x3e8qzxgcpab	cmr0kglyo0000x3e89bbsy2vr	503	Разплащателна сметка	ASSET	\N	t	2026-06-30 11:31:40.47
cmr0kglyv0006x3e8if7l7iuw	cmr0kglyo0000x3e89bbsy2vr	411	Клиенти	ASSET	\N	t	2026-06-30 11:31:40.471
cmr0kglyv0008x3e8idk8l576	cmr0kglyo0000x3e89bbsy2vr	302	Стоки	ASSET	\N	t	2026-06-30 11:31:40.472
cmr0kglyw000ax3e8fraqrs0y	cmr0kglyo0000x3e89bbsy2vr	304	Продукция	ASSET	\N	t	2026-06-30 11:31:40.472
cmr0kglyw000cx3e8s66q94ph	cmr0kglyo0000x3e89bbsy2vr	401	Доставчици	LIABILITY	\N	t	2026-06-30 11:31:40.472
cmr0kglyw000ex3e87uf310fp	cmr0kglyo0000x3e89bbsy2vr	4532	ДДС на покупките	LIABILITY	\N	t	2026-06-30 11:31:40.473
cmr0kglyx000gx3e815ffoyvl	cmr0kglyo0000x3e89bbsy2vr	4538	ДДС за внасяне	LIABILITY	\N	t	2026-06-30 11:31:40.473
cmr0kglyx000ix3e8urdwwtwc	cmr0kglyo0000x3e89bbsy2vr	702	Приходи от продажба на стоки	REVENUE	\N	t	2026-06-30 11:31:40.474
cmr0kglyy000kx3e882glpi2h	cmr0kglyo0000x3e89bbsy2vr	703	Приходи от продажба на продукция	REVENUE	\N	t	2026-06-30 11:31:40.474
cmr0kglyy000mx3e8skqmcd57	cmr0kglyo0000x3e89bbsy2vr	601	Разходи за материали	EXPENSE	\N	t	2026-06-30 11:31:40.475
cmr0kglyz000ox3e8nb9ow8yw	cmr0kglyo0000x3e89bbsy2vr	602	Разходи за външни услуги	EXPENSE	\N	t	2026-06-30 11:31:40.475
cmr0kglyz000qx3e8823wcenz	cmr0kglyo0000x3e89bbsy2vr	604	Разходи за заплати	EXPENSE	\N	t	2026-06-30 11:31:40.475
\.


--
-- Data for Name: Customer; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."Customer" (id, "tenantId", code, name, eik, "vatNumber", address, city, email, phone, "contactPerson", "isActive", "createdAt", "updatedAt") FROM stdin;
cmr0km7ji0005uw2mwxxxpfpm	cmr0kglyo0000x3e89bbsy2vr	CUST-001	Тест Клиент ООД	999888777	\N	\N	\N	\N	\N	\N	t	2026-06-30 11:36:01.711	2026-06-30 11:36:01.711
\.


--
-- Data for Name: Delivery; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."Delivery" (id, "tenantId", "deliveryNo", "purchaseOrderId", "warehouseId", "supplierName", status, "deliveryDate", note, "goodsReceiptId", "createdBy", "createdAt", "updatedAt") FROM stdin;
cmr0u7yp30012xnco3wn0e847	cmr0kglyo0000x3e89bbsy2vr	DLV-20260630-0001	cmr0kgm4p0032x3e8n8qfd3x9	cmr0kgm41000yx3e8dgwwx73d	Test Supplier	CONFIRMED	\N	\N	cmr0u7yqd0017xncoxk7pdwa8	cmr0kgm0p000sx3e8nchhuoqj	2026-06-30 16:04:53.223	2026-06-30 16:04:53.279
\.


--
-- Data for Name: DeliveryLine; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."DeliveryLine" (id, "deliveryId", "productId", "locationId", quantity, "lotNumber", "expiryDate") FROM stdin;
cmr0u7ypv0014xnco4130jk6o	cmr0u7yp30012xnco3wn0e847	cmr0kgm46001ex3e8h7m9ehx5	cmr0kgm420012x3e8dcaa9j23	10	\N	\N
\.


--
-- Data for Name: DocumentSequence; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."DocumentSequence" (id, "tenantId", "docType", "lastNumber", prefix) FROM stdin;
cmr0lsorx000n10nckrjdj7k4	cmr0kglyo0000x3e89bbsy2vr	INVOICE_IN	2	\N
cmr0lsoh0000610ncaqesjfqf	cmr0kglyo0000x3e89bbsy2vr	INVOICE_OUT	5	\N
\.


--
-- Data for Name: FinancialPeriod; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."FinancialPeriod" (id, "tenantId", year, month, "isClosed", "closedAt", "closedBy") FROM stdin;
cmr1nh4er0007vsc3o7mh8ov6	cmr0kglyo0000x3e89bbsy2vr	2026	6	f	\N	\N
cmr1nh4er0008vsc3y4xpyte0	cmr0kglyo0000x3e89bbsy2vr	2026	5	f	\N	\N
cmr1nh4er0009vsc3f8k3cojg	cmr0kglyo0000x3e89bbsy2vr	2026	4	f	\N	\N
cmr1nh4er000avsc3bswms46c	cmr0kglyo0000x3e89bbsy2vr	2026	3	f	\N	\N
cmr1nh4er000bvsc3k0xn8vgv	cmr0kglyo0000x3e89bbsy2vr	2026	2	f	\N	\N
cmr1nh4er000cvsc3u2zq6flj	cmr0kglyo0000x3e89bbsy2vr	2026	1	f	\N	\N
cmr1nh4er000dvsc3qnxeebmx	cmr0kglyo0000x3e89bbsy2vr	2025	12	f	\N	\N
cmr1nh4er000evsc3ttbim8gx	cmr0kglyo0000x3e89bbsy2vr	2025	11	f	\N	\N
cmr1nh4er000fvsc3bdgh441i	cmr0kglyo0000x3e89bbsy2vr	2025	10	f	\N	\N
cmr1nh4er000gvsc3owc0nt0n	cmr0kglyo0000x3e89bbsy2vr	2025	9	f	\N	\N
cmr1nh4er000hvsc31a5udjo5	cmr0kglyo0000x3e89bbsy2vr	2025	8	f	\N	\N
cmr1nh4er000ivsc30m40cwyi	cmr0kglyo0000x3e89bbsy2vr	2025	7	f	\N	\N
cmr1nh4er0006vsc325gwha61	cmr0kglyo0000x3e89bbsy2vr	2026	7	f	\N	\N
\.


--
-- Data for Name: GoodsIssue; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."GoodsIssue" (id, "tenantId", "issueNo", "warehouseId", destination, note, status, "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: GoodsIssueLine; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."GoodsIssueLine" (id, "issueId", "productId", "locationId", quantity, "lotNumber") FROM stdin;
\.


--
-- Data for Name: GoodsReceipt; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."GoodsReceipt" (id, "tenantId", "receiptNo", "warehouseId", "supplierName", note, status, "createdBy", "createdAt", "updatedAt") FROM stdin;
cmr0u7yqd0017xncoxk7pdwa8	cmr0kglyo0000x3e89bbsy2vr	REC-20260630-0001	cmr0kgm41000yx3e8dgwwx73d	Test Supplier	Автоматично от доставка DLV-20260630-0001	CONFIRMED	cmr0kgm0p000sx3e8nchhuoqj	2026-06-30 16:04:53.269	2026-06-30 16:04:53.269
\.


--
-- Data for Name: GoodsReceiptLine; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."GoodsReceiptLine" (id, "receiptId", "productId", "locationId", quantity, "lotNumber", "expiryDate") FROM stdin;
cmr0u7yqd0019xnconmkxz288	cmr0u7yqd0017xncoxk7pdwa8	cmr0kgm46001ex3e8h7m9ehx5	cmr0kgm420012x3e8dcaa9j23	10	\N	\N
\.


--
-- Data for Name: Invoice; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."Invoice" (id, "tenantId", "docType", number, "issueDate", "dueDate", "taxEventDate", "customerId", "supplierId", currency, subtotal, "vatAmount", "totalAmount", "vatRate", status, note, "relatedPOId", "relatedSaleId", "createdBy", "createdAt", "updatedAt") FROM stdin;
cmr0lsopd000j10ncojgc676z	cmr0kglyo0000x3e89bbsy2vr	INVOICE_OUT	0000000002	2026-06-05 00:00:00	\N	\N	cmr0km7ji0005uw2mwxxxpfpm	\N	BGN	10.00	2.00	12.00	20.00	DRAFT	\N	\N	\N	cmr0kgm0p000sx3e8nchhuoqj	2026-06-30 12:09:03.505	2026-06-30 12:09:03.505
cmr0u7yqt001kxncomtoz6xcw	cmr0kglyo0000x3e89bbsy2vr	INVOICE_IN	0000000002	2026-06-30 16:04:53.285	\N	\N	\N	cmr0kgm4n002wx3e82e4n5lkq	BGN	32.00	6.40	38.40	20.00	DRAFT	Автоматично от доставка DLV-20260630-0001	cmr0kgm4p0032x3e8n8qfd3x9	\N	cmr0kgm0p000sx3e8nchhuoqj	2026-06-30 16:04:53.286	2026-06-30 16:04:53.286
cmr0u73ul000txncosw2n0z5r	cmr0kglyo0000x3e89bbsy2vr	INVOICE_OUT	0000000003	2026-06-30 16:04:13.237	\N	\N	cmr0km7ji0005uw2mwxxxpfpm	\N	BGN	75.00	15.00	90.00	20.00	ISSUED	Автоматично от продажба SAL-20260630-0002	\N	cmr0u73uc000gxncopwa1y8sf	cmr0kgm0p000sx3e8nchhuoqj	2026-06-30 16:04:13.246	2026-06-30 16:05:08.244
cmr0ufhpb000h42xgcftj3qtm	cmr0kglyo0000x3e89bbsy2vr	INVOICE_OUT	0000000004	2026-06-30 16:10:44.375	\N	\N	cmr0km7ji0005uw2mwxxxpfpm	\N	BGN	1.00	0.20	1.20	20.00	DRAFT	Автоматично от продажба SAL-20260630-0003	\N	cmr0ufhnb000442xg31kzm4dh	cmr0kgm0p000sx3e8nchhuoqj	2026-06-30 16:10:44.447	2026-06-30 16:10:44.447
cmr0lsohk000810nc5dmfc843	cmr0kglyo0000x3e89bbsy2vr	INVOICE_OUT	0000000001	2026-06-05 00:00:00	2026-07-05 00:00:00	\N	cmr0km7ji0005uw2mwxxxpfpm	\N	BGN	250.00	50.00	300.00	20.00	PAID	Плащане 100: partial\nПлащане 200 на 5.06.2026 г.: Банково съпоставяне: Плащане фактура 0000000001	\N	\N	cmr0kgm0p000sx3e8nchhuoqj	2026-06-30 12:09:03.224	2026-07-01 05:26:39.353
cmr0lsory000p10nctx5m7rae	cmr0kglyo0000x3e89bbsy2vr	INVOICE_IN	0000000001	2026-06-05 00:00:00	\N	\N	\N	cmr0kgm4n002wx3e82e4n5lkq	BGN	200.00	40.00	240.00	20.00	PAID	\N	\N	\N	cmr0kgm0p000sx3e8nchhuoqj	2026-06-30 12:09:03.599	2026-07-01 05:29:15.575
cmr34j0bu000hcibjqz6dfrcp	cmr0kglyo0000x3e89bbsy2vr	INVOICE_OUT	0000000005	2026-07-02 06:28:57.035	\N	\N	cmr0km7ji0005uw2mwxxxpfpm	\N	BGN	1.00	0.20	1.20	20.00	ISSUED	Автоматично от продажба SAL-20260702-0001	\N	cmr34j0ay0004cibjnvjzni74	cmr0kgm0p000sx3e8nchhuoqj	2026-07-02 06:28:57.066	2026-07-02 06:29:14.745
\.


--
-- Data for Name: InvoiceLine; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."InvoiceLine" (id, "invoiceId", "productId", description, quantity, "unitPrice", "vatRate", "lineTotal") FROM stdin;
cmr0lsohk000910nc3fkctb7d	cmr0lsohk000810nc5dmfc843	\N	Line 1	2.000	100.00	20.00	200.00
cmr0lsohk000a10nc3d1omc1v	cmr0lsohk000810nc5dmfc843	\N	Line 2	1.000	50.00	20.00	50.00
cmr0lsopd000k10ncf1cn9zkg	cmr0lsopd000j10ncojgc676z	\N	Single	1.000	10.00	20.00	10.00
cmr0lsory000q10ncm6qm4nwc	cmr0lsory000p10nctx5m7rae	\N	Supply	1.000	200.00	20.00	200.00
cmr0u73ul000uxncoaidg5d56	cmr0u73ul000txncosw2n0z5r	cmr0kgm46001ex3e8h7m9ehx5	SUB-001 — Метален профил 40x40x2	1.000	75.00	20.00	75.00
cmr0u7yqt001lxncoyl2ldmeu	cmr0u7yqt001kxncomtoz6xcw	cmr0kgm46001ex3e8h7m9ehx5	SUB-001 — Метален профил 40x40x2	10.000	3.20	20.00	32.00
cmr0ufhpb000i42xgd83wl1gr	cmr0ufhpb000h42xgcftj3qtm	cmr0kgm47001ix3e8lys67azc	SUB-003 — Кръгла тръба ⌀33x2	1.000	1.00	20.00	1.00
cmr34j0bu000icibj4isgvzbq	cmr34j0bu000hcibjqz6dfrcp	cmr0kgm48001ox3e8229dacro	SUB-006 — Боя RAL 9005 черна	1.000	1.00	20.00	1.00
\.


--
-- Data for Name: JournalEntry; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."JournalEntry" (id, "tenantId", "entryDate", description, "sourceType", "sourceId", "isPosted", "createdBy", "createdAt") FROM stdin;
cmr0u73ra000axncoeworo3gh	cmr0kglyo0000x3e89bbsy2vr	2026-06-30 16:04:13.11	Продажба SAL-20260630-0001	POS_SALE	cmr0u73qu0004xnco0tixrdgp	t	cmr0kgm0p000sx3e8nchhuoqj	2026-06-30 16:04:13.126
cmr0u73ui000mxncowvv552ml	cmr0kglyo0000x3e89bbsy2vr	2026-06-30 16:04:13.237	Продажба SAL-20260630-0002	POS_SALE	cmr0u73uc000gxncopwa1y8sf	t	cmr0kgm0p000sx3e8nchhuoqj	2026-06-30 16:04:13.243
cmr0u7yqr001dxncorvw5ckd5	cmr0kglyo0000x3e89bbsy2vr	2026-06-30 16:04:53.282	Доставка DLV-20260630-0001	SCM_DELIVERY	cmr0u7yp30012xnco3wn0e847	t	cmr0kgm0p000sx3e8nchhuoqj	2026-06-30 16:04:53.283
cmr0ufhow000a42xg10pich18	cmr0kglyo0000x3e89bbsy2vr	2026-06-30 16:10:44.375	Продажба SAL-20260630-0003	POS_SALE	cmr0ufhnb000442xg31kzm4dh	t	cmr0kgm0p000sx3e8nchhuoqj	2026-06-30 16:10:44.433
cmr1mv1mk0008op7lg0b3ejzq	cmr0kglyo0000x3e89bbsy2vr	2026-06-05 00:00:00	Банково плащане — Плащане фактура 0000000001	MANUAL	cmr1mv1l00005op7lg5wsrfxf	t	cmr0kgm0p000sx3e8nchhuoqj	2026-07-01 05:26:39.357
cmr1mye61000lop7lof2h31pk	cmr0kglyo0000x3e89bbsy2vr	2026-06-05 00:00:00	Банково плащане — Плащане фактура 0000000001 входяща	MANUAL	cmr1mv1ow000dop7lgy69bxa2	t	cmr0kgm0p000sx3e8nchhuoqj	2026-07-01 05:29:15.577
cmr34j0bk000acibjb0h74h9q	cmr0kglyo0000x3e89bbsy2vr	2026-07-02 06:28:57.035	Продажба SAL-20260702-0001	POS_SALE	cmr34j0ay0004cibjnvjzni74	t	cmr0kgm0p000sx3e8nchhuoqj	2026-07-02 06:28:57.056
\.


--
-- Data for Name: JournalEntryLine; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."JournalEntryLine" (id, "journalEntryId", "accountId", debit, credit, description) FROM stdin;
cmr0u73ra000cxncosshmhzm7	cmr0u73ra000axncoeworo3gh	cmr0kglyq0002x3e86mt78773	50.00	0.00	Продажба SAL-20260630-0001
cmr0u73ra000dxncoygkh0nhp	cmr0u73ra000axncoeworo3gh	cmr0kglyx000ix3e8urdwwtwc	0.00	50.00	Приходи SAL-20260630-0001
cmr0u73ui000oxnco19rq89km	cmr0u73ui000mxncowvv552ml	cmr0kglyq0002x3e86mt78773	75.00	0.00	Продажба SAL-20260630-0002
cmr0u73ui000pxncolroufmmy	cmr0u73ui000mxncowvv552ml	cmr0kglyx000ix3e8urdwwtwc	0.00	75.00	Приходи SAL-20260630-0002
cmr0u7yqr001fxncojwmo9mnp	cmr0u7yqr001dxncorvw5ckd5	cmr0kglyv0008x3e8idk8l576	32.00	0.00	Доставка DLV-20260630-0001
cmr0u7yqr001gxncoxyfpjkym	cmr0u7yqr001dxncorvw5ckd5	cmr0kglyw000cx3e8s66q94ph	0.00	32.00	Доставчик DLV-20260630-0001
cmr0ufhow000c42xgjp70nqwz	cmr0ufhow000a42xg10pich18	cmr0kglyu0004x3e8qzxgcpab	1.00	0.00	Продажба SAL-20260630-0003
cmr0ufhow000d42xg27c0gypu	cmr0ufhow000a42xg10pich18	cmr0kglyx000ix3e8urdwwtwc	0.00	1.00	Приходи SAL-20260630-0003
cmr1mv1mk000aop7lmej33sk2	cmr1mv1mk0008op7lg0b3ejzq	cmr0kglyu0004x3e8qzxgcpab	200.00	0.00	Плащане фактура 0000000001
cmr1mv1mk000bop7l53f0x0pk	cmr1mv1mk0008op7lg0b3ejzq	cmr0kglyv0006x3e8if7l7iuw	0.00	200.00	Плащане фактура 0000000001
cmr1mye61000nop7lra9tq7ux	cmr1mye61000lop7lof2h31pk	cmr0kglyw000cx3e8s66q94ph	240.00	0.00	Плащане фактура 0000000001 входяща
cmr1mye61000oop7livrzewbf	cmr1mye61000lop7lof2h31pk	cmr0kglyu0004x3e8qzxgcpab	0.00	240.00	Плащане фактура 0000000001 входяща
cmr34j0bk000ccibj77122gqh	cmr34j0bk000acibjb0h74h9q	cmr0kglyu0004x3e8qzxgcpab	1.00	0.00	Продажба SAL-20260702-0001
cmr34j0bk000dcibjfop0ylpk	cmr34j0bk000acibjb0h74h9q	cmr0kglyx000ix3e8urdwwtwc	0.00	1.00	Приходи SAL-20260702-0001
\.


--
-- Data for Name: LicenseKey; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."LicenseKey" (id, "tenantId", key, "expiresAt", features, "isActive", "lastValidAt", "createdAt", "updatedAt") FROM stdin;
cmr0kgm3y000wx3e80mxnkfr3	cmr0kglyo0000x3e89bbsy2vr	AO6M-ERIE-UDQ4-TVCS	2126-01-01 00:00:00	["module:wms", "module:scm", "module:mes", "module:pos", "module:backup", "module:finance"]	t	\N	2026-06-30 11:31:40.655	2026-06-30 11:31:40.655
\.


--
-- Data for Name: Location; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."Location" (id, "warehouseId", code, name, zone, "locationType", "isActive", "createdAt", "updatedAt") FROM stdin;
cmr0kgm420012x3e8dcaa9j23	cmr0kgm41000yx3e8dgwwx73d	A-01	Метални профили	\N	STORAGE	t	2026-06-30 11:31:40.659	2026-06-30 11:31:40.659
cmr0kgm430014x3e80gs5lg79	cmr0kgm41000yx3e8dgwwx73d	A-02	Метални листове	\N	STORAGE	t	2026-06-30 11:31:40.66	2026-06-30 11:31:40.66
cmr0kgm440016x3e89m9wwk86	cmr0kgm41000yx3e8dgwwx73d	B-01	Тръби	\N	STORAGE	t	2026-06-30 11:31:40.66	2026-06-30 11:31:40.66
cmr0kgm440018x3e8b82wq4jw	cmr0kgm41000yx3e8dgwwx73d	B-02	Метален ъгъл	\N	STORAGE	t	2026-06-30 11:31:40.661	2026-06-30 11:31:40.661
cmr0kgm45001ax3e8ti8ksh2x	cmr0kgm420010x3e8ntg3fz42	GP-01	Готови огради	\N	STORAGE	t	2026-06-30 11:31:40.661	2026-06-30 11:31:40.661
cmr0kgm45001cx3e8qe32s2ja	cmr0kgm420010x3e8ntg3fz42	GP-02	Метални конструкции	\N	STORAGE	t	2026-06-30 11:31:40.662	2026-06-30 11:31:40.662
\.


--
-- Data for Name: MaterialConsumption; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."MaterialConsumption" (id, "workOrderId", "productId", "locationId", "plannedQty", "consumedQty", "lotNumber") FROM stdin;
\.


--
-- Data for Name: Payable; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."Payable" (id, "tenantId", "invoiceId", "supplierId", "amountDue", "amountPaid", "dueDate", status, "createdAt", "updatedAt") FROM stdin;
cmr0qffh5000v10nc3wvyycua	cmr0kglyo0000x3e89bbsy2vr	cmr0lsory000p10nctx5m7rae	cmr0kgm4n002wx3e82e4n5lkq	240.00	240.00	2026-06-05 00:00:00	PAID	2026-06-30 14:18:43.097	2026-07-01 05:29:15.572
\.


--
-- Data for Name: PosInvoice; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."PosInvoice" (id, "tenantId", number, "saleId", "customerId", "issueDate", "dueDate", "taxEventDate", subtotal, "vatAmount", "totalAmount", "vatRate", "paymentMethod", status, note, "createdBy", "createdAt") FROM stdin;
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."Product" (id, "tenantId", code, name, description, unit, category, "minStock", "maxStock", "isActive", "createdAt", "updatedAt", barcode, price) FROM stdin;
cmr0kgm46001ex3e8h7m9ehx5	cmr0kglyo0000x3e89bbsy2vr	SUB-001	Метален профил 40x40x2	\N	м	\N	50	\N	t	2026-06-30 11:31:40.662	2026-06-30 11:31:40.662	5901234123457	3.5
cmr0kgm47001gx3e87tsq2ger	cmr0kglyo0000x3e89bbsy2vr	SUB-002	Метален лист 1000x2000x2мм	\N	бр	\N	20	\N	t	2026-06-30 11:31:40.663	2026-06-30 11:31:40.663	5901234123458	45
cmr0kgm47001ix3e8lys67azc	cmr0kglyo0000x3e89bbsy2vr	SUB-003	Кръгла тръба ⌀33x2	\N	м	\N	30	\N	t	2026-06-30 11:31:40.664	2026-06-30 11:31:40.664	5901234123459	4.2
cmr0kgm48001kx3e891od14z2	cmr0kglyo0000x3e89bbsy2vr	SUB-004	Метален ъгъл 40x40x4	\N	м	\N	40	\N	t	2026-06-30 11:31:40.664	2026-06-30 11:31:40.664	5901234123460	2.8
cmr0kgm48001mx3e834f1olyj	cmr0kglyo0000x3e89bbsy2vr	SUB-005	Електроди 3.2мм	\N	кг	\N	10	\N	t	2026-06-30 11:31:40.664	2026-06-30 11:31:40.664	5901234123461	8.5
cmr0kgm48001ox3e8229dacro	cmr0kglyo0000x3e89bbsy2vr	SUB-006	Боя RAL 9005 черна	\N	л	\N	5	\N	t	2026-06-30 11:31:40.665	2026-06-30 11:31:40.665	5901234123462	12
cmr0kgm49001qx3e86d6vlgd7	cmr0kglyo0000x3e89bbsy2vr	SUB-007	Болтове M10x50	\N	бр	\N	100	\N	t	2026-06-30 11:31:40.665	2026-06-30 11:31:40.665	5901234123463	0.35
cmr0kgm49001sx3e8hukdxkj5	cmr0kglyo0000x3e89bbsy2vr	PRD-001	Метална ограда панел 2x1м	\N	бр	\N	5	\N	t	2026-06-30 11:31:40.666	2026-06-30 11:31:40.666	5901234123464	85
cmr0kgm49001ux3e8tvcdbfjk	cmr0kglyo0000x3e89bbsy2vr	PRD-002	Метална врата единична 1x2м	\N	бр	\N	2	\N	t	2026-06-30 11:31:40.666	2026-06-30 11:31:40.666	5901234123465	180
cmr0kgm4a001wx3e8yyzyljqm	cmr0kglyo0000x3e89bbsy2vr	PRD-003	Метална конструкция навес 4x6м	\N	бр	\N	1	\N	t	2026-06-30 11:31:40.666	2026-06-30 11:31:40.666	5901234123466	1200
\.


--
-- Data for Name: PurchaseOrder; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."PurchaseOrder" (id, "tenantId", "orderNo", "supplierId", "warehouseId", status, "expectedDate", note, "createdBy", "createdAt", "updatedAt") FROM stdin;
cmr0kgm4p0032x3e8n8qfd3x9	cmr0kglyo0000x3e89bbsy2vr	PO-20260624-0001	cmr0kgm4n002wx3e82e4n5lkq	cmr0kgm41000yx3e8dgwwx73d	PARTIALLY_RECEIVED	2026-06-27 00:00:00	Поръчка за производство на огради	\N	2026-06-30 11:31:40.682	2026-06-30 16:04:53.278
\.


--
-- Data for Name: PurchaseOrderLine; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."PurchaseOrderLine" (id, "purchaseOrderId", "productId", quantity, "receivedQty", "unitPrice", unit) FROM stdin;
cmr0kgm4q0034x3e87ai14yb2	cmr0kgm4p0032x3e8n8qfd3x9	cmr0kgm48001kx3e891od14z2	60	0	2.6	\N
cmr0kgm4q0033x3e8g8vggdis	cmr0kgm4p0032x3e8n8qfd3x9	cmr0kgm46001ex3e8h7m9ehx5	100	10	3.2	\N
\.


--
-- Data for Name: Receivable; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."Receivable" (id, "tenantId", "invoiceId", "customerId", "amountDue", "amountPaid", "dueDate", status, "createdAt", "updatedAt") FROM stdin;
cmr0u8aad001qxnco4dqp9rhp	cmr0kglyo0000x3e89bbsy2vr	cmr0u73ul000txncosw2n0z5r	cmr0km7ji0005uw2mwxxxpfpm	90.00	0.00	2026-06-30 16:04:13.237	OPEN	2026-06-30 16:05:08.245	2026-06-30 16:05:08.245
cmr0lsokf000d10nczkw443jw	cmr0kglyo0000x3e89bbsy2vr	cmr0lsohk000810nc5dmfc843	cmr0km7ji0005uw2mwxxxpfpm	300.00	300.00	2026-07-05 00:00:00	PAID	2026-06-30 12:09:03.328	2026-07-01 05:26:39.342
cmr34jdyz000lcibj3eept41w	cmr0kglyo0000x3e89bbsy2vr	cmr34j0bu000hcibjqz6dfrcp	cmr0km7ji0005uw2mwxxxpfpm	1.20	0.00	2026-07-02 06:28:57.035	OPEN	2026-07-02 06:29:14.747	2026-07-02 06:29:14.747
\.


--
-- Data for Name: Sale; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."Sale" (id, "tenantId", "saleNo", "cashRegisterId", "paymentMethod", "totalAmount", status, note, "createdBy", "createdAt", "updatedAt", "customerId") FROM stdin;
cmr0u73qu0004xnco0tixrdgp	cmr0kglyo0000x3e89bbsy2vr	SAL-20260630-0001	cmr0kgm4v003kx3e8zyun7epa	CASH	50	COMPLETED	\N	cmr0kgm0p000sx3e8nchhuoqj	2026-06-30 16:04:13.11	2026-06-30 16:04:13.11	\N
cmr0u73uc000gxncopwa1y8sf	cmr0kglyo0000x3e89bbsy2vr	SAL-20260630-0002	cmr0kgm4v003kx3e8zyun7epa	CASH	75	COMPLETED	\N	cmr0kgm0p000sx3e8nchhuoqj	2026-06-30 16:04:13.237	2026-06-30 16:04:13.237	cmr0km7ji0005uw2mwxxxpfpm
cmr0ufhnb000442xg31kzm4dh	cmr0kglyo0000x3e89bbsy2vr	SAL-20260630-0003	cmr0kgm4v003kx3e8zyun7epa	CARD	1	COMPLETED	\N	cmr0kgm0p000sx3e8nchhuoqj	2026-06-30 16:10:44.375	2026-06-30 16:10:44.375	cmr0km7ji0005uw2mwxxxpfpm
cmr34j0ay0004cibjnvjzni74	cmr0kglyo0000x3e89bbsy2vr	SAL-20260702-0001	cmr0kgm4v003kx3e8zyun7epa	CARD	1	COMPLETED	\N	cmr0kgm0p000sx3e8nchhuoqj	2026-07-02 06:28:57.035	2026-07-02 06:28:57.035	cmr0km7ji0005uw2mwxxxpfpm
\.


--
-- Data for Name: SaleLine; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."SaleLine" (id, "saleId", "productId", "locationId", quantity, "unitPrice", "totalPrice", "lotNumber") FROM stdin;
cmr0u73r20008xnco729txvf8	cmr0u73qu0004xnco0tixrdgp	cmr0kgm46001ex3e8h7m9ehx5	cmr0kgm420012x3e8dcaa9j23	1	50	50	\N
cmr0u73uf000kxncomucmys3q	cmr0u73uc000gxncopwa1y8sf	cmr0kgm46001ex3e8h7m9ehx5	cmr0kgm420012x3e8dcaa9j23	1	75	75	\N
cmr0ufhnm000842xgk493ta7h	cmr0ufhnb000442xg31kzm4dh	cmr0kgm47001ix3e8lys67azc	cmr0kgm440016x3e89m9wwk86	1	1	1	\N
cmr34j0ba0008cibjfcyrsawt	cmr34j0ay0004cibjnvjzni74	cmr0kgm48001ox3e8229dacro	cmr0kgm430014x3e80gs5lg79	1	1	1	\N
\.


--
-- Data for Name: StockItem; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."StockItem" (id, "tenantId", "productId", "locationId", quantity, "reservedQty", "lotNumber", "expiryDate", "updatedAt") FROM stdin;
cmr0kgm4b0020x3e8n2tpvngy	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm47001gx3e87tsq2ger	cmr0kgm430014x3e80gs5lg79	50	0	\N	\N	2026-06-30 11:31:40.668
cmr0kgm4d0024x3e8y0y9mynj	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm48001kx3e891od14z2	cmr0kgm440018x3e8b82wq4jw	100	0	\N	\N	2026-06-30 11:31:40.669
cmr0kgm4e0026x3e8d7naq1w2	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm48001mx3e834f1olyj	cmr0kgm420012x3e8dcaa9j23	30	0	\N	\N	2026-06-30 11:31:40.67
cmr0kgm4f002ax3e85bnv2at6	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm49001qx3e86d6vlgd7	cmr0kgm420012x3e8dcaa9j23	500	0	\N	\N	2026-06-30 11:31:40.671
cmr0kgm4f002cx3e8z9vty0r5	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm49001sx3e8hukdxkj5	cmr0kgm45001ax3e8ti8ksh2x	0	0	\N	\N	2026-06-30 11:31:40.672
cmr0kgm4g002ex3e8p8qnnjzd	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm49001ux3e8tvcdbfjk	cmr0kgm45001ax3e8ti8ksh2x	0	0	\N	\N	2026-06-30 11:31:40.672
cmr0kgm4g002gx3e8krbcnus3	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm4a001wx3e8yyzyljqm	cmr0kgm45001cx3e8qe32s2ja	0	0	\N	\N	2026-06-30 11:31:40.673
cmr0kgm4a001yx3e8bwwxdm2q	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm46001ex3e8h7m9ehx5	cmr0kgm420012x3e8dcaa9j23	208	0	\N	\N	2026-06-30 16:04:53.273
cmr0kgm4c0022x3e8c1obiilb	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm47001ix3e8lys67azc	cmr0kgm440016x3e89m9wwk86	149	0	\N	\N	2026-06-30 16:10:44.381
cmr0kgm4e0028x3e8b93dwa3l	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm48001ox3e8229dacro	cmr0kgm430014x3e80gs5lg79	19	0	\N	\N	2026-07-02 06:28:57.038
\.


--
-- Data for Name: StockMovement; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."StockMovement" (id, "tenantId", "productId", "movementType", quantity, "fromLocationId", "toLocationId", "referenceType", "referenceId", "lotNumber", note, "createdBy", "createdAt") FROM stdin;
cmr0u73qy0006xnco5vfm9q91	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm46001ex3e8h7m9ehx5	OUT	1	cmr0kgm420012x3e8dcaa9j23	\N	SALE	cmr0u73qu0004xnco0tixrdgp	\N	Продажба: SAL-20260630-0001	cmr0kgm0p000sx3e8nchhuoqj	2026-06-30 16:04:13.114
cmr0u73uf000ixnco1rpwtnov	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm46001ex3e8h7m9ehx5	OUT	1	cmr0kgm420012x3e8dcaa9j23	\N	SALE	cmr0u73uc000gxncopwa1y8sf	\N	Продажба: SAL-20260630-0002	cmr0kgm0p000sx3e8nchhuoqj	2026-06-30 16:04:13.239
cmr0u7yqi001bxncolas5oxm7	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm46001ex3e8h7m9ehx5	IN	10	\N	cmr0kgm420012x3e8dcaa9j23	DELIVERY	cmr0u7yp30012xnco3wn0e847	\N	\N	cmr0kgm0p000sx3e8nchhuoqj	2026-06-30 16:04:53.274
cmr34j0b60006cibj9di9djnj	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm48001ox3e8229dacro	OUT	1	cmr0kgm430014x3e80gs5lg79	\N	SALE	cmr34j0ay0004cibjnvjzni74	\N	Продажба: SAL-20260702-0001	cmr0kgm0p000sx3e8nchhuoqj	2026-07-02 06:28:57.042
cmr0ufhnj000642xgslejds9k	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm47001ix3e8lys67azc	OUT	1	cmr0kgm440016x3e89m9wwk86	\N	SALE	cmr0ufhnb000442xg31kzm4dh	\N	Продажба: SAL-20260630-0003	cmr0kgm0p000sx3e8nchhuoqj	2026-06-30 16:10:44.383
cmr0kgm4h002ix3e87az51e86	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm46001ex3e8h7m9ehx5	IN	200	\N	cmr0kgm420012x3e8dcaa9j23	INITIAL	\N	\N	Начално заприхождаване	cmr0kgm0p000sx3e8nchhuoqj	2026-06-30 11:31:40.673
cmr0kgm4j002kx3e8uxc5912e	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm47001gx3e87tsq2ger	IN	50	\N	cmr0kgm430014x3e80gs5lg79	INITIAL	\N	\N	Начално заприхождаване	cmr0kgm0p000sx3e8nchhuoqj	2026-06-30 11:31:40.675
cmr0kgm4j002mx3e8yaetjh2g	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm47001ix3e8lys67azc	IN	150	\N	cmr0kgm440016x3e89m9wwk86	INITIAL	\N	\N	Начално заприхождаване	cmr0kgm0p000sx3e8nchhuoqj	2026-06-30 11:31:40.676
cmr0kgm4k002ox3e8fqrvvhmm	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm48001kx3e891od14z2	IN	100	\N	cmr0kgm440018x3e8b82wq4jw	INITIAL	\N	\N	Начално заприхождаване	cmr0kgm0p000sx3e8nchhuoqj	2026-06-30 11:31:40.676
cmr0kgm4l002qx3e8vwefrwsn	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm48001mx3e834f1olyj	IN	30	\N	cmr0kgm420012x3e8dcaa9j23	INITIAL	\N	\N	Начално заприхождаване	cmr0kgm0p000sx3e8nchhuoqj	2026-06-30 11:31:40.677
cmr0kgm4l002sx3e8g9wtxxxa	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm48001ox3e8229dacro	IN	20	\N	cmr0kgm430014x3e80gs5lg79	INITIAL	\N	\N	Начално заприхождаване	cmr0kgm0p000sx3e8nchhuoqj	2026-06-30 11:31:40.678
cmr0kgm4m002ux3e84vbps87m	cmr0kglyo0000x3e89bbsy2vr	cmr0kgm49001qx3e86d6vlgd7	IN	500	\N	cmr0kgm420012x3e8dcaa9j23	INITIAL	\N	\N	Начално заприхождаване	cmr0kgm0p000sx3e8nchhuoqj	2026-06-30 11:31:40.679
\.


--
-- Data for Name: Supplier; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."Supplier" (id, "tenantId", code, name, "contactName", email, phone, address, "taxNumber", "isActive", "createdAt", "updatedAt") FROM stdin;
cmr0kgm4n002wx3e82e4n5lkq	cmr0kglyo0000x3e89bbsy2vr	SUP-001	Стоманени профили ЕООД	Георги Стоянов	office@stomaprofile.bg	+359 2 888 1234	\N	\N	t	2026-06-30 11:31:40.679	2026-06-30 11:31:40.679
cmr0kgm4o002yx3e8k9ioibf4	cmr0kglyo0000x3e89bbsy2vr	SUP-002	Металтрейд АД	Мария Николова	sales@metaltrade.bg	+359 32 777 5678	\N	\N	t	2026-06-30 11:31:40.68	2026-06-30 11:31:40.68
cmr0kgm4o0030x3e8kecub6l8	cmr0kglyo0000x3e89bbsy2vr	SUP-003	Хемимпекс ООД	Петър Димитров	info@hemimpex.bg	+359 56 444 9012	\N	\N	t	2026-06-30 11:31:40.681	2026-06-30 11:31:40.681
\.


--
-- Data for Name: Tenant; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."Tenant" (id, name, slug, "logoUrl", "isActive", "createdAt", "updatedAt", address, eik, "vatNumber", "vatRegistered", mol, city, country, phone, email, "bankName", "bankIban", "enabledModules", "posInvoiceStartNumber", "posInvoiceLastNumber") FROM stdin;
cmr0kglyo0000x3e89bbsy2vr	Металконструкт ООД	metalkonstrukt	\N	t	2026-06-30 11:31:40.465	2026-06-30 11:31:40.465	ул. Индустриална 15	123456789	BG123456789	f	Иван Петров	Пловдив	България	+359 32 123 456	office@metalkonstrukt.bg	ОББ	BG80UBBS80021020345678	{wms,scm,mes,pos,backup,finance}	1	0
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."User" (id, email, "hashedPassword", "firstName", "lastName", role, "isActive", "tenantId", "createdAt", "updatedAt") FROM stdin;
cmr0kgm0p000sx3e8nchhuoqj	admin@metalkonstrukt.bg	$2a$10$LIOg/DJW/nlAdlpFc8LQZu6NvmJl4ASVP4PCTRLnz3od2W21uz2H.	Иван	Петров	SUPER_ADMIN	t	cmr0kglyo0000x3e89bbsy2vr	2026-06-30 11:31:40.537	2026-06-30 11:31:40.537
cmr0kgm3x000tx3e8ekwl0w7y	manager@metalkonstrukt.bg	$2a$10$knH/mufQzmXESvTNwEhU3.Rt0KG06pXqFGAj56bemlrkZrH7woFnq	Георги	Иванов	MANAGER	t	cmr0kglyo0000x3e89bbsy2vr	2026-06-30 11:31:40.653	2026-06-30 11:31:40.653
cmr0kgm3x000ux3e88pajry3b	operator@metalkonstrukt.bg	$2a$10$3AxO6fx4Ayix9cFZVCBQcOkd6.dMBG9phjFRKJq9bQ.KDsrYvRwz.	Петър	Димитров	OPERATOR	t	cmr0kglyo0000x3e89bbsy2vr	2026-06-30 11:31:40.653	2026-06-30 11:31:40.653
\.


--
-- Data for Name: Warehouse; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."Warehouse" (id, "tenantId", code, name, address, "isActive", "createdAt", "updatedAt") FROM stdin;
cmr0kgm41000yx3e8dgwwx73d	cmr0kglyo0000x3e89bbsy2vr	WH-01	Основен склад суровини	ул. Индустриална 15, Пловдив	t	2026-06-30 11:31:40.657	2026-06-30 11:31:40.657
cmr0kgm420010x3e8ntg3fz42	cmr0kglyo0000x3e89bbsy2vr	WH-02	Склад готова продукция	ул. Индустриална 15, Пловдив	t	2026-06-30 11:31:40.658	2026-06-30 11:31:40.658
\.


--
-- Data for Name: WorkOrder; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public."WorkOrder" (id, "tenantId", "orderNo", "productId", "bomId", "warehouseId", "outputLocationId", "plannedQty", "producedQty", status, "plannedStart", "plannedEnd", "actualStart", "actualEnd", note, "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: dimitarmitrev
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
8091c336-2eba-4c7b-8a5e-213e449641ed	1a2a092a27de3f1a90d72bea4c717cbe4f73dc201d6d3678aa952de9b099e194	2026-05-07 14:58:50.340572+03	20260506090052_init_core_schema	\N	\N	2026-05-07 14:58:50.332108+03	1
66fdbc74-7dd7-429c-a920-1d280d59938c	6bd9a6bfbc0a2d5583c23414321e70b6c5e795bfef219053cd1feaaeb8a35813	2026-07-02 09:20:09.834208+03	20260702120000_add_pos_invoices_and_counterparties	\N	\N	2026-07-02 09:20:09.804584+03	1
b5765264-651e-4772-8bd0-820e20995a89	1f22fe29a1b8bd78aad75d1fc21f36e0bb5161b941876ef35ef090b0dce62ea5	2026-05-07 14:58:50.354592+03	20260507055755_wms_schema	\N	\N	2026-05-07 14:58:50.341061+03	1
655062cd-f682-400d-96c8-7c17b0c20027	545a787f3adef0277efd2c1f46af52ec6e9b82f28206a5359fb78c7905c8f21b	2026-05-07 15:00:28.648031+03	20260507115000_scm_schema	\N	\N	2026-05-07 15:00:28.623548+03	1
ba8e3b7c-9e1f-4708-a172-27b7a911e205	f3b40cfd2ffa0e5f7372a897fdf73fc63b7125e26d2a5ac9508133addf3d77ce	2026-05-07 15:51:05.92458+03	20260507124500_mes_schema	\N	\N	2026-05-07 15:51:05.896161+03	1
7b445122-bbcc-4d38-bb30-519a18a45daa	69b50b636b8fce6f4722529473c03e8b5edb8602808a97099a20cf57a40c32a0	2026-05-07 20:16:50.421333+03	20260507170500_pos_schema	\N	\N	2026-05-07 20:16:50.396436+03	1
ade2987a-5c87-477c-9e33-97d7a92dd86f	845965df1180dc1a40191dcf57a4ad0ee8db6980a742e1bff2e7815000b3d20a	2026-05-07 21:54:16.850166+03	20260507184500_backup_schema	\N	\N	2026-05-07 21:54:16.830868+03	1
269e6a2a-8cf3-4b56-90bd-93e90882f38d	b8bd72e5940b0184a2103affa2d61a2c8b069a33cd98f7a44acf00138c25f030	2026-06-08 17:49:33.63526+03	20260608140500_add_barcode_to_product	\N	\N	2026-06-08 17:49:33.62455+03	1
1597e43b-6245-422a-bfd4-33303c687aea	1023b5293dd56fa5f2ae66a04a7056c3fa91964c9a4518ede83d792ba3dabbf7	2026-06-09 14:33:38.490242+03	20260609103000_add_product_price	\N	\N	2026-06-09 14:33:38.485618+03	1
7911ef3b-6bc7-413e-85e7-1145c775aac7	171658550c31f77985b09b1963e4e853d834d54a3e6b8d47eb66b27a69409b0f	2026-06-10 15:09:56.736779+03	20260610120000_add_legal_fields_to_tenant	\N	\N	2026-06-10 15:09:56.726132+03	1
374e3aac-8409-44da-b1c8-3e47a6066712	233973d26f420868bf8a97ca4c55363ad656267525a3ec7d816d0eb2f00dfeaf	2026-06-30 14:31:17.104607+03	20260626120000_add_finance_foundation	\N	\N	2026-06-30 14:31:17.020183+03	1
5d7fc23f-d3cf-441c-915a-74f61468e261	ea76c09bf11520e5359c062d7872d9eb1cbfb923fba05bc303938665a9a91e4b	2026-06-30 15:07:22.409121+03	20260626140000_add_finance_invoices_phase2	\N	\N	2026-06-30 15:07:22.351582+03	1
69fd4f1e-56c8-4c96-8940-5ba528c0ddaa	759c7f5545fe17f3a127e0521dfa5951f35d81efec990a86aa73312480dc31be	2026-06-30 19:02:48.927919+03	20260626160000_add_finance_journal_phase3	\N	\N	2026-06-30 19:02:48.894543+03	1
a24a1dba-e116-4f99-9446-dea163a18b01	2646b1b19e63bc1e55c2cbbe9bea455cd77e6757465a448304cc0ae41167bd13	2026-07-01 08:26:12.656068+03	20260630120000_add_finance_banking_phase4	\N	\N	2026-07-01 08:26:12.61629+03	1
\.


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: BackupJob BackupJob_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."BackupJob"
    ADD CONSTRAINT "BackupJob_pkey" PRIMARY KEY (id);


--
-- Name: BackupPolicy BackupPolicy_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."BackupPolicy"
    ADD CONSTRAINT "BackupPolicy_pkey" PRIMARY KEY (id);


--
-- Name: BankAccount BankAccount_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."BankAccount"
    ADD CONSTRAINT "BankAccount_pkey" PRIMARY KEY (id);


--
-- Name: BankTransaction BankTransaction_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."BankTransaction"
    ADD CONSTRAINT "BankTransaction_pkey" PRIMARY KEY (id);


--
-- Name: BillOfMaterials BillOfMaterials_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."BillOfMaterials"
    ADD CONSTRAINT "BillOfMaterials_pkey" PRIMARY KEY (id);


--
-- Name: BomItem BomItem_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."BomItem"
    ADD CONSTRAINT "BomItem_pkey" PRIMARY KEY (id);


--
-- Name: CashRegister CashRegister_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."CashRegister"
    ADD CONSTRAINT "CashRegister_pkey" PRIMARY KEY (id);


--
-- Name: ChartOfAccount ChartOfAccount_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."ChartOfAccount"
    ADD CONSTRAINT "ChartOfAccount_pkey" PRIMARY KEY (id);


--
-- Name: Customer Customer_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_pkey" PRIMARY KEY (id);


--
-- Name: DeliveryLine DeliveryLine_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."DeliveryLine"
    ADD CONSTRAINT "DeliveryLine_pkey" PRIMARY KEY (id);


--
-- Name: Delivery Delivery_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Delivery"
    ADD CONSTRAINT "Delivery_pkey" PRIMARY KEY (id);


--
-- Name: DocumentSequence DocumentSequence_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."DocumentSequence"
    ADD CONSTRAINT "DocumentSequence_pkey" PRIMARY KEY (id);


--
-- Name: FinancialPeriod FinancialPeriod_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."FinancialPeriod"
    ADD CONSTRAINT "FinancialPeriod_pkey" PRIMARY KEY (id);


--
-- Name: GoodsIssueLine GoodsIssueLine_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."GoodsIssueLine"
    ADD CONSTRAINT "GoodsIssueLine_pkey" PRIMARY KEY (id);


--
-- Name: GoodsIssue GoodsIssue_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."GoodsIssue"
    ADD CONSTRAINT "GoodsIssue_pkey" PRIMARY KEY (id);


--
-- Name: GoodsReceiptLine GoodsReceiptLine_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."GoodsReceiptLine"
    ADD CONSTRAINT "GoodsReceiptLine_pkey" PRIMARY KEY (id);


--
-- Name: GoodsReceipt GoodsReceipt_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."GoodsReceipt"
    ADD CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY (id);


--
-- Name: InvoiceLine InvoiceLine_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."InvoiceLine"
    ADD CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY (id);


--
-- Name: Invoice Invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_pkey" PRIMARY KEY (id);


--
-- Name: JournalEntryLine JournalEntryLine_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."JournalEntryLine"
    ADD CONSTRAINT "JournalEntryLine_pkey" PRIMARY KEY (id);


--
-- Name: JournalEntry JournalEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."JournalEntry"
    ADD CONSTRAINT "JournalEntry_pkey" PRIMARY KEY (id);


--
-- Name: LicenseKey LicenseKey_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."LicenseKey"
    ADD CONSTRAINT "LicenseKey_pkey" PRIMARY KEY (id);


--
-- Name: Location Location_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Location"
    ADD CONSTRAINT "Location_pkey" PRIMARY KEY (id);


--
-- Name: MaterialConsumption MaterialConsumption_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."MaterialConsumption"
    ADD CONSTRAINT "MaterialConsumption_pkey" PRIMARY KEY (id);


--
-- Name: Payable Payable_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Payable"
    ADD CONSTRAINT "Payable_pkey" PRIMARY KEY (id);


--
-- Name: PosInvoice PosInvoice_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."PosInvoice"
    ADD CONSTRAINT "PosInvoice_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: PurchaseOrderLine PurchaseOrderLine_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."PurchaseOrderLine"
    ADD CONSTRAINT "PurchaseOrderLine_pkey" PRIMARY KEY (id);


--
-- Name: PurchaseOrder PurchaseOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."PurchaseOrder"
    ADD CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY (id);


--
-- Name: Receivable Receivable_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Receivable"
    ADD CONSTRAINT "Receivable_pkey" PRIMARY KEY (id);


--
-- Name: SaleLine SaleLine_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."SaleLine"
    ADD CONSTRAINT "SaleLine_pkey" PRIMARY KEY (id);


--
-- Name: Sale Sale_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Sale"
    ADD CONSTRAINT "Sale_pkey" PRIMARY KEY (id);


--
-- Name: StockItem StockItem_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."StockItem"
    ADD CONSTRAINT "StockItem_pkey" PRIMARY KEY (id);


--
-- Name: StockMovement StockMovement_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."StockMovement"
    ADD CONSTRAINT "StockMovement_pkey" PRIMARY KEY (id);


--
-- Name: Supplier Supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Supplier"
    ADD CONSTRAINT "Supplier_pkey" PRIMARY KEY (id);


--
-- Name: Tenant Tenant_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Tenant"
    ADD CONSTRAINT "Tenant_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Warehouse Warehouse_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Warehouse"
    ADD CONSTRAINT "Warehouse_pkey" PRIMARY KEY (id);


--
-- Name: WorkOrder WorkOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."WorkOrder"
    ADD CONSTRAINT "WorkOrder_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: BankAccount_tenantId_iban_key; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE UNIQUE INDEX "BankAccount_tenantId_iban_key" ON public."BankAccount" USING btree ("tenantId", iban);


--
-- Name: BankAccount_tenantId_idx; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE INDEX "BankAccount_tenantId_idx" ON public."BankAccount" USING btree ("tenantId");


--
-- Name: BankTransaction_bankAccountId_idx; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE INDEX "BankTransaction_bankAccountId_idx" ON public."BankTransaction" USING btree ("bankAccountId");


--
-- Name: BankTransaction_matchedType_matchedId_idx; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE INDEX "BankTransaction_matchedType_matchedId_idx" ON public."BankTransaction" USING btree ("matchedType", "matchedId");


--
-- Name: BankTransaction_tenantId_idx; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE INDEX "BankTransaction_tenantId_idx" ON public."BankTransaction" USING btree ("tenantId");


--
-- Name: BillOfMaterials_productId_key; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE UNIQUE INDEX "BillOfMaterials_productId_key" ON public."BillOfMaterials" USING btree ("productId");


--
-- Name: CashRegister_tenantId_code_key; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE UNIQUE INDEX "CashRegister_tenantId_code_key" ON public."CashRegister" USING btree ("tenantId", code);


--
-- Name: ChartOfAccount_tenantId_code_key; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE UNIQUE INDEX "ChartOfAccount_tenantId_code_key" ON public."ChartOfAccount" USING btree ("tenantId", code);


--
-- Name: ChartOfAccount_tenantId_idx; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE INDEX "ChartOfAccount_tenantId_idx" ON public."ChartOfAccount" USING btree ("tenantId");


--
-- Name: Customer_tenantId_code_key; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE UNIQUE INDEX "Customer_tenantId_code_key" ON public."Customer" USING btree ("tenantId", code);


--
-- Name: Customer_tenantId_idx; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE INDEX "Customer_tenantId_idx" ON public."Customer" USING btree ("tenantId");


--
-- Name: Delivery_tenantId_deliveryNo_key; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE UNIQUE INDEX "Delivery_tenantId_deliveryNo_key" ON public."Delivery" USING btree ("tenantId", "deliveryNo");


--
-- Name: DocumentSequence_tenantId_docType_key; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE UNIQUE INDEX "DocumentSequence_tenantId_docType_key" ON public."DocumentSequence" USING btree ("tenantId", "docType");


--
-- Name: DocumentSequence_tenantId_idx; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE INDEX "DocumentSequence_tenantId_idx" ON public."DocumentSequence" USING btree ("tenantId");


--
-- Name: FinancialPeriod_tenantId_idx; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE INDEX "FinancialPeriod_tenantId_idx" ON public."FinancialPeriod" USING btree ("tenantId");


--
-- Name: FinancialPeriod_tenantId_year_month_key; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE UNIQUE INDEX "FinancialPeriod_tenantId_year_month_key" ON public."FinancialPeriod" USING btree ("tenantId", year, month);


--
-- Name: GoodsIssue_tenantId_issueNo_key; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE UNIQUE INDEX "GoodsIssue_tenantId_issueNo_key" ON public."GoodsIssue" USING btree ("tenantId", "issueNo");


--
-- Name: GoodsReceipt_tenantId_receiptNo_key; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE UNIQUE INDEX "GoodsReceipt_tenantId_receiptNo_key" ON public."GoodsReceipt" USING btree ("tenantId", "receiptNo");


--
-- Name: Invoice_customerId_idx; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE INDEX "Invoice_customerId_idx" ON public."Invoice" USING btree ("customerId");


--
-- Name: Invoice_tenantId_docType_number_key; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE UNIQUE INDEX "Invoice_tenantId_docType_number_key" ON public."Invoice" USING btree ("tenantId", "docType", number);


--
-- Name: Invoice_tenantId_idx; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE INDEX "Invoice_tenantId_idx" ON public."Invoice" USING btree ("tenantId");


--
-- Name: JournalEntry_sourceType_sourceId_idx; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE INDEX "JournalEntry_sourceType_sourceId_idx" ON public."JournalEntry" USING btree ("sourceType", "sourceId");


--
-- Name: JournalEntry_tenantId_idx; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE INDEX "JournalEntry_tenantId_idx" ON public."JournalEntry" USING btree ("tenantId");


--
-- Name: LicenseKey_key_key; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE UNIQUE INDEX "LicenseKey_key_key" ON public."LicenseKey" USING btree (key);


--
-- Name: LicenseKey_tenantId_key; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE UNIQUE INDEX "LicenseKey_tenantId_key" ON public."LicenseKey" USING btree ("tenantId");


--
-- Name: Location_warehouseId_code_key; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE UNIQUE INDEX "Location_warehouseId_code_key" ON public."Location" USING btree ("warehouseId", code);


--
-- Name: Payable_invoiceId_key; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE UNIQUE INDEX "Payable_invoiceId_key" ON public."Payable" USING btree ("invoiceId");


--
-- Name: Payable_status_idx; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE INDEX "Payable_status_idx" ON public."Payable" USING btree (status);


--
-- Name: Payable_tenantId_idx; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE INDEX "Payable_tenantId_idx" ON public."Payable" USING btree ("tenantId");


--
-- Name: PosInvoice_saleId_key; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE UNIQUE INDEX "PosInvoice_saleId_key" ON public."PosInvoice" USING btree ("saleId");


--
-- Name: PosInvoice_tenantId_idx; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE INDEX "PosInvoice_tenantId_idx" ON public."PosInvoice" USING btree ("tenantId");


--
-- Name: PosInvoice_tenantId_number_key; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE UNIQUE INDEX "PosInvoice_tenantId_number_key" ON public."PosInvoice" USING btree ("tenantId", number);


--
-- Name: Product_barcode_key; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE UNIQUE INDEX "Product_barcode_key" ON public."Product" USING btree (barcode);


--
-- Name: Product_tenantId_code_key; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE UNIQUE INDEX "Product_tenantId_code_key" ON public."Product" USING btree ("tenantId", code);


--
-- Name: PurchaseOrder_tenantId_orderNo_key; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE UNIQUE INDEX "PurchaseOrder_tenantId_orderNo_key" ON public."PurchaseOrder" USING btree ("tenantId", "orderNo");


--
-- Name: Receivable_invoiceId_key; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE UNIQUE INDEX "Receivable_invoiceId_key" ON public."Receivable" USING btree ("invoiceId");


--
-- Name: Receivable_status_idx; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE INDEX "Receivable_status_idx" ON public."Receivable" USING btree (status);


--
-- Name: Receivable_tenantId_idx; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE INDEX "Receivable_tenantId_idx" ON public."Receivable" USING btree ("tenantId");


--
-- Name: Sale_customerId_idx; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE INDEX "Sale_customerId_idx" ON public."Sale" USING btree ("customerId");


--
-- Name: Sale_tenantId_saleNo_key; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE UNIQUE INDEX "Sale_tenantId_saleNo_key" ON public."Sale" USING btree ("tenantId", "saleNo");


--
-- Name: StockItem_productId_locationId_lotNumber_key; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE UNIQUE INDEX "StockItem_productId_locationId_lotNumber_key" ON public."StockItem" USING btree ("productId", "locationId", "lotNumber");


--
-- Name: Supplier_tenantId_code_key; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE UNIQUE INDEX "Supplier_tenantId_code_key" ON public."Supplier" USING btree ("tenantId", code);


--
-- Name: Tenant_slug_key; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE UNIQUE INDEX "Tenant_slug_key" ON public."Tenant" USING btree (slug);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Warehouse_tenantId_code_key; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE UNIQUE INDEX "Warehouse_tenantId_code_key" ON public."Warehouse" USING btree ("tenantId", code);


--
-- Name: WorkOrder_tenantId_orderNo_key; Type: INDEX; Schema: public; Owner: dimitarmitrev
--

CREATE UNIQUE INDEX "WorkOrder_tenantId_orderNo_key" ON public."WorkOrder" USING btree ("tenantId", "orderNo");


--
-- Name: AuditLog AuditLog_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AuditLog AuditLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BackupJob BackupJob_policyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."BackupJob"
    ADD CONSTRAINT "BackupJob_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES public."BackupPolicy"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BackupJob BackupJob_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."BackupJob"
    ADD CONSTRAINT "BackupJob_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BackupPolicy BackupPolicy_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."BackupPolicy"
    ADD CONSTRAINT "BackupPolicy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BankAccount BankAccount_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."BankAccount"
    ADD CONSTRAINT "BankAccount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BankTransaction BankTransaction_bankAccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."BankTransaction"
    ADD CONSTRAINT "BankTransaction_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES public."BankAccount"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BankTransaction BankTransaction_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."BankTransaction"
    ADD CONSTRAINT "BankTransaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BillOfMaterials BillOfMaterials_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."BillOfMaterials"
    ADD CONSTRAINT "BillOfMaterials_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BillOfMaterials BillOfMaterials_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."BillOfMaterials"
    ADD CONSTRAINT "BillOfMaterials_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BomItem BomItem_bomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."BomItem"
    ADD CONSTRAINT "BomItem_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES public."BillOfMaterials"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BomItem BomItem_componentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."BomItem"
    ADD CONSTRAINT "BomItem_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CashRegister CashRegister_locationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."CashRegister"
    ADD CONSTRAINT "CashRegister_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES public."Location"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CashRegister CashRegister_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."CashRegister"
    ADD CONSTRAINT "CashRegister_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CashRegister CashRegister_warehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."CashRegister"
    ADD CONSTRAINT "CashRegister_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES public."Warehouse"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChartOfAccount ChartOfAccount_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."ChartOfAccount"
    ADD CONSTRAINT "ChartOfAccount_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."ChartOfAccount"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ChartOfAccount ChartOfAccount_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."ChartOfAccount"
    ADD CONSTRAINT "ChartOfAccount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Customer Customer_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DeliveryLine DeliveryLine_deliveryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."DeliveryLine"
    ADD CONSTRAINT "DeliveryLine_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES public."Delivery"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DeliveryLine DeliveryLine_locationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."DeliveryLine"
    ADD CONSTRAINT "DeliveryLine_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES public."Location"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DeliveryLine DeliveryLine_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."DeliveryLine"
    ADD CONSTRAINT "DeliveryLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Delivery Delivery_purchaseOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Delivery"
    ADD CONSTRAINT "Delivery_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES public."PurchaseOrder"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Delivery Delivery_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Delivery"
    ADD CONSTRAINT "Delivery_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Delivery Delivery_warehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Delivery"
    ADD CONSTRAINT "Delivery_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES public."Warehouse"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DocumentSequence DocumentSequence_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."DocumentSequence"
    ADD CONSTRAINT "DocumentSequence_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: FinancialPeriod FinancialPeriod_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."FinancialPeriod"
    ADD CONSTRAINT "FinancialPeriod_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GoodsIssueLine GoodsIssueLine_issueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."GoodsIssueLine"
    ADD CONSTRAINT "GoodsIssueLine_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES public."GoodsIssue"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GoodsIssueLine GoodsIssueLine_locationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."GoodsIssueLine"
    ADD CONSTRAINT "GoodsIssueLine_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES public."Location"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GoodsIssueLine GoodsIssueLine_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."GoodsIssueLine"
    ADD CONSTRAINT "GoodsIssueLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GoodsIssue GoodsIssue_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."GoodsIssue"
    ADD CONSTRAINT "GoodsIssue_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GoodsIssue GoodsIssue_warehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."GoodsIssue"
    ADD CONSTRAINT "GoodsIssue_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES public."Warehouse"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GoodsReceiptLine GoodsReceiptLine_locationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."GoodsReceiptLine"
    ADD CONSTRAINT "GoodsReceiptLine_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES public."Location"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GoodsReceiptLine GoodsReceiptLine_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."GoodsReceiptLine"
    ADD CONSTRAINT "GoodsReceiptLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GoodsReceiptLine GoodsReceiptLine_receiptId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."GoodsReceiptLine"
    ADD CONSTRAINT "GoodsReceiptLine_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES public."GoodsReceipt"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GoodsReceipt GoodsReceipt_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."GoodsReceipt"
    ADD CONSTRAINT "GoodsReceipt_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GoodsReceipt GoodsReceipt_warehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."GoodsReceipt"
    ADD CONSTRAINT "GoodsReceipt_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES public."Warehouse"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InvoiceLine InvoiceLine_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."InvoiceLine"
    ADD CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public."Invoice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Invoice Invoice_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Invoice Invoice_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public."Supplier"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Invoice Invoice_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: JournalEntryLine JournalEntryLine_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."JournalEntryLine"
    ADD CONSTRAINT "JournalEntryLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public."ChartOfAccount"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: JournalEntryLine JournalEntryLine_journalEntryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."JournalEntryLine"
    ADD CONSTRAINT "JournalEntryLine_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES public."JournalEntry"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: JournalEntry JournalEntry_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."JournalEntry"
    ADD CONSTRAINT "JournalEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LicenseKey LicenseKey_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."LicenseKey"
    ADD CONSTRAINT "LicenseKey_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Location Location_warehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Location"
    ADD CONSTRAINT "Location_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES public."Warehouse"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MaterialConsumption MaterialConsumption_locationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."MaterialConsumption"
    ADD CONSTRAINT "MaterialConsumption_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES public."Location"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MaterialConsumption MaterialConsumption_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."MaterialConsumption"
    ADD CONSTRAINT "MaterialConsumption_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MaterialConsumption MaterialConsumption_workOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."MaterialConsumption"
    ADD CONSTRAINT "MaterialConsumption_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES public."WorkOrder"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payable Payable_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Payable"
    ADD CONSTRAINT "Payable_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public."Invoice"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payable Payable_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Payable"
    ADD CONSTRAINT "Payable_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public."Supplier"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payable Payable_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Payable"
    ADD CONSTRAINT "Payable_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PosInvoice PosInvoice_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."PosInvoice"
    ADD CONSTRAINT "PosInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PosInvoice PosInvoice_saleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."PosInvoice"
    ADD CONSTRAINT "PosInvoice_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES public."Sale"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PosInvoice PosInvoice_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."PosInvoice"
    ADD CONSTRAINT "PosInvoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Product Product_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PurchaseOrderLine PurchaseOrderLine_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."PurchaseOrderLine"
    ADD CONSTRAINT "PurchaseOrderLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PurchaseOrderLine PurchaseOrderLine_purchaseOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."PurchaseOrderLine"
    ADD CONSTRAINT "PurchaseOrderLine_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES public."PurchaseOrder"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PurchaseOrder PurchaseOrder_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."PurchaseOrder"
    ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public."Supplier"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PurchaseOrder PurchaseOrder_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."PurchaseOrder"
    ADD CONSTRAINT "PurchaseOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PurchaseOrder PurchaseOrder_warehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."PurchaseOrder"
    ADD CONSTRAINT "PurchaseOrder_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES public."Warehouse"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Receivable Receivable_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Receivable"
    ADD CONSTRAINT "Receivable_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Receivable Receivable_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Receivable"
    ADD CONSTRAINT "Receivable_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public."Invoice"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Receivable Receivable_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Receivable"
    ADD CONSTRAINT "Receivable_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SaleLine SaleLine_locationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."SaleLine"
    ADD CONSTRAINT "SaleLine_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES public."Location"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SaleLine SaleLine_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."SaleLine"
    ADD CONSTRAINT "SaleLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SaleLine SaleLine_saleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."SaleLine"
    ADD CONSTRAINT "SaleLine_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES public."Sale"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Sale Sale_cashRegisterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Sale"
    ADD CONSTRAINT "Sale_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES public."CashRegister"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Sale Sale_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Sale"
    ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Sale Sale_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Sale"
    ADD CONSTRAINT "Sale_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StockItem StockItem_locationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."StockItem"
    ADD CONSTRAINT "StockItem_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES public."Location"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StockItem StockItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."StockItem"
    ADD CONSTRAINT "StockItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StockMovement StockMovement_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."StockMovement"
    ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StockMovement StockMovement_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."StockMovement"
    ADD CONSTRAINT "StockMovement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Supplier Supplier_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Supplier"
    ADD CONSTRAINT "Supplier_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: User User_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Warehouse Warehouse_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."Warehouse"
    ADD CONSTRAINT "Warehouse_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WorkOrder WorkOrder_bomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."WorkOrder"
    ADD CONSTRAINT "WorkOrder_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES public."BillOfMaterials"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: WorkOrder WorkOrder_outputLocationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."WorkOrder"
    ADD CONSTRAINT "WorkOrder_outputLocationId_fkey" FOREIGN KEY ("outputLocationId") REFERENCES public."Location"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WorkOrder WorkOrder_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."WorkOrder"
    ADD CONSTRAINT "WorkOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WorkOrder WorkOrder_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."WorkOrder"
    ADD CONSTRAINT "WorkOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WorkOrder WorkOrder_warehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dimitarmitrev
--

ALTER TABLE ONLY public."WorkOrder"
    ADD CONSTRAINT "WorkOrder_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES public."Warehouse"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict Ujt3IDZmpB5uag07UguEdbSw2bCRMGkpSTkyXrAHBRg0VOFkltDbR8H6jxiVJbe

