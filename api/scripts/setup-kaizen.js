import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { query } from '../src/config/db.config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function setupKaizenTables() {
  try {
    console.log('Setting up Kaizen tables...');
    
    // Read the schema file
    const schemaPath = join(__dirname, '../db/schema.sql');
    const schema = await readFile(schemaPath, 'utf8');
    
    // Split into individual statements and execute
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await query(statement);
      }
    }
    
    console.log('✅ Database schema updated successfully');
    
    // Now run the kaizen seed data
    console.log('Seeding Kaizen data...');
    const seedPath = join(__dirname, '../db/kaizen_seed.sql');
    const seedData = await readFile(seedPath, 'utf8');
    
    const seedStatements = seedData.split(';').filter(stmt => stmt.trim());
    
    for (const statement of seedStatements) {
      if (statement.trim()) {
        try {
          await query(statement);
        } catch (error) {
          // Ignore duplicate key errors for seed data
          if (!error.message.includes('Duplicate entry')) {
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Kaizen seed data inserted successfully');
    console.log('🎉 Kaizen system setup complete!');
    
  } catch (error) {
    console.error('❌ Error setting up Kaizen tables:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

setupKaizenTables();