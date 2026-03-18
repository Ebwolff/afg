-- Add NIS (Número de Cadastro/NIS) and data_nascimento columns to clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS nis TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS data_nascimento DATE;
