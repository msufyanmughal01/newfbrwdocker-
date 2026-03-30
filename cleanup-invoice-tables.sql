-- Cleanup Script: Drop invoice-related tables
-- Run this if you need to reset the invoice tables

DROP TABLE IF EXISTS line_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS invoice_drafts CASCADE;
DROP TYPE IF EXISTS invoice_type CASCADE;
DROP TYPE IF EXISTS buyer_registration_type CASCADE;
DROP TYPE IF EXISTS invoice_status CASCADE;
