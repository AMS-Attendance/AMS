/**
 * Direct Import Students to Supabase
 * 
 * This script directly inserts students into Supabase using the JS client.
 * Make sure you have SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function importStudents() {
  try {
    // Read the JSON file
    const jsonPath = path.join(__dirname, '..', 'test.users.json');
    const students = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    console.log(`📊 Found ${students.length} students in test.users.json\n`);

    // Check for existing students
    const { data: existing, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('role', 'student');

    if (checkError) {
      console.error('❌ Error checking existing students:', checkError.message);
      process.exit(1);
    }

    const existingEmails = new Set(existing.map(u => u.email));
    console.log(`📧 Found ${existingEmails.size} existing students in database`);

    // Filter out students that already exist
    const newStudents = students.filter(s => !existingEmails.has(s.email));

    if (newStudents.length === 0) {
      console.log('✅ All students already exist in the database!');
      return;
    }

    console.log(`📥 Importing ${newStudents.length} new students...\n`);

    // Transform to PostgreSQL format
    const studentsToInsert = newStudents.map(student => ({
      name: student.name,
      email: student.email,
      password: student.password, // Already bcrypt hashed
      role: 'student',
      rfid: student.rfid || null,
      index_number: student.indexNumber || null,
      degree: student.degree || null,
      batch: student.batch || null,
      is_active: student.isActive !== undefined ? student.isActive : true
    }));

    // Insert in batches of 100 to avoid timeout
    const batchSize = 100;
    let inserted = 0;
    let failed = 0;

    for (let i = 0; i < studentsToInsert.length; i += batchSize) {
      const batch = studentsToInsert.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('users')
        .insert(batch)
        .select('id, name, email, index_number');

      if (error) {
        console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error.message);
        failed += batch.length;
      } else {
        inserted += data.length;
        console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${data.length} students (${inserted}/${studentsToInsert.length})`);
      }
    }

    console.log(`\n📊 Import Summary:`);
    console.log(`   - Successfully inserted: ${inserted}`);
    console.log(`   - Failed: ${failed}`);
    console.log(`   - Skipped (already exist): ${students.length - newStudents.length}`);

    // Verify the import
    const { count, error: countError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student');

    if (!countError) {
      console.log(`\n✅ Total students in database: ${count}`);
    }

    // Show batch distribution
    const { data: batches } = await supabase
      .from('users')
      .select('batch')
      .eq('role', 'student')
      .not('batch', 'is', null)
      .order('batch');

    if (batches) {
      const batchCounts = batches.reduce((acc, { batch }) => {
        acc[batch] = (acc[batch] || 0) + 1;
        return acc;
      }, {});

      console.log(`\n📚 Students by batch:`);
      Object.entries(batchCounts)
        .sort(([a], [b]) => Number(a) - Number(b))
        .forEach(([batch, count]) => {
          console.log(`   - Batch ${batch}: ${count} students`);
        });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the import
importStudents().then(() => {
  console.log('\n🎉 Import completed!');
  process.exit(0);
});
