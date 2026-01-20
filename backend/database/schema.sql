-- QuickPay Invoicing Database Schema
-- PostgreSQL schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table (main invoice/payment records)
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    subtotal DECIMAL(12, 2) NOT NULL CHECK (subtotal >= 0),
    tax_amount DECIMAL(12, 2) DEFAULT 0 CHECK (tax_amount >= 0),
    discount_amount DECIMAL(12, 2) DEFAULT 0 CHECK (discount_amount >= 0),
    tax_rate DECIMAL(5, 2) DEFAULT 0 CHECK (tax_rate >= 0 AND tax_rate <= 100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    due_date DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice items table (line items for each invoice/payment)
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
    rate DECIMAL(10, 2) NOT NULL CHECK (rate >= 0),
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_number ON payments(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_items_payment_id ON invoice_items(payment_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users (service role has full access)
-- These policies allow full CRUD operations for authenticated users

-- Clients policies
CREATE POLICY "Enable all operations for authenticated users" ON clients
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Payments policies
CREATE POLICY "Enable all operations for authenticated users" ON payments
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Invoice items policies
CREATE POLICY "Enable all operations for authenticated users" ON invoice_items
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Trigger function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data (optional - for development/testing)
-- Insert sample clients
INSERT INTO clients (name, email, company, phone, address) VALUES
    ('John Doe', 'john.doe@email.com', 'Tech Solutions Inc', '+1-555-0123', '123 Main St, City, State 12345'),
    ('Jane Smith', 'jane.smith@email.com', 'Creative Agency LLC', '+1-555-0124', '456 Oak Ave, City, State 12346'),
    ('Mike Johnson', 'mike.johnson@email.com', 'Johnson Consulting', '+1-555-0125', '789 Pine Rd, City, State 12347')
ON CONFLICT (email) DO NOTHING;

-- Insert sample payments (get client IDs first)
DO $$
DECLARE
    client1_id UUID;
    client2_id UUID;
    client3_id UUID;
    payment1_id UUID;
    payment2_id UUID;
    payment3_id UUID;
BEGIN
    -- Get client IDs
    SELECT id INTO client1_id FROM clients WHERE email = 'john.doe@email.com';
    SELECT id INTO client2_id FROM clients WHERE email = 'jane.smith@email.com';
    SELECT id INTO client3_id FROM clients WHERE email = 'mike.johnson@email.com';
    
    -- Insert sample payments
    INSERT INTO payments (invoice_number, client_id, amount, subtotal, tax_amount, tax_rate, status, due_date, notes)
    VALUES 
        ('INV-202412-0001', client1_id, 2650.00, 2500.00, 150.00, 6.0, 'paid', '2024-12-15', 'Website development project'),
        ('INV-202412-0002', client2_id, 1590.00, 1500.00, 90.00, 6.0, 'pending', '2024-12-25', 'Logo design and branding'),
        ('INV-202412-0003', client3_id, 5300.00, 5000.00, 300.00, 6.0, 'pending', '2025-01-15', 'Business consulting services')
    RETURNING id INTO payment1_id;
    
    -- Get the payment IDs for invoice items
    SELECT id INTO payment1_id FROM payments WHERE invoice_number = 'INV-202412-0001';
    SELECT id INTO payment2_id FROM payments WHERE invoice_number = 'INV-202412-0002';
    SELECT id INTO payment3_id FROM payments WHERE invoice_number = 'INV-202412-0003';
    
    -- Insert sample invoice items
    INSERT INTO invoice_items (payment_id, description, quantity, rate, amount)
    VALUES 
        (payment1_id, 'Frontend Development', 40.0, 50.00, 2000.00),
        (payment1_id, 'Backend API Development', 20.0, 25.00, 500.00),
        
        (payment2_id, 'Logo Design', 10.0, 100.00, 1000.00),
        (payment2_id, 'Brand Guidelines', 5.0, 100.00, 500.00),
        
        (payment3_id, 'Strategy Consultation', 20.0, 150.00, 3000.00),
        (payment3_id, 'Implementation Plan', 10.0, 200.00, 2000.00);
END $$;

-- Views for common queries (optional)
CREATE OR REPLACE VIEW payment_summary AS
SELECT 
    p.id,
    p.invoice_number,
    p.amount,
    p.status,
    p.due_date,
    p.created_at,
    c.name as client_name,
    c.company as client_company,
    c.email as client_email,
    COUNT(ii.id) as item_count
FROM payments p
JOIN clients c ON p.client_id = c.id
LEFT JOIN invoice_items ii ON p.id = ii.payment_id
GROUP BY p.id, c.id
ORDER BY p.created_at DESC;

-- Grant necessary permissions
-- Note: In Supabase, the service_role already has full permissions
-- These grants are for additional database users if needed

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;