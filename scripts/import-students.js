/**
 * Import Students from MongoDB JSON to PostgreSQL
 * 
 * This script reads test.users.json and generates a SQL file
 * to insert all students into the Supabase users table.
 */

const fs = require('fs');
const path = require('path');

// Read the JSON file
const jsonPath = path.join(__dirname, '..', 'test.users.json');
const students = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

console.log(`📊 Found ${students.length} students in test.users.json`);

// Analyze the data
const batches = [...new Set(students.map(s => s.batch))].sort();
const degrees = [...new Set(students.map(s => s.degree))];
const withRFID = students.filter(s => s.rfid).length;

console.log(`\n📈 Data Analysis:`);
console.log(`   - Batches: ${batches.join(', ')}`);
console.log(`   - Degrees: ${degrees.join(', ')}`);
console.log(`   - Students with RFID: ${withRFID}/${students.length}`);

// Generate SQL INSERT statements
const sqlStatements = [];

sqlStatements.push(`-- Import Students into Supabase`);
sqlStatements.push(`-- Generated: ${new Date().toISOString()}`);
sqlStatements.push(`-- Total students: ${students.length}\n`);

sqlStatements.push(`-- Disable triggers temporarily for faster import`);
sqlStatements.push(`SET session_replication_role = 'replica';\n`);

// Generate INSERT for each student
students.forEach((student, index) => {
  const name = escapeSql(student.name);
  const email = escapeSql(student.email);
  const password = escapeSql(student.password); // Already bcrypt hashed
  const role = 'student';
  const rfid = student.rfid ? `'${escapeSql(student.rfid)}'` : 'NULL';
  const indexNumber = student.indexNumber ? `'${escapeSql(student.indexNumber)}'` : 'NULL';
  const degree = student.degree ? `'${escapeSql(student.degree)}'` : 'NULL';
  const batch = student.batch || 'NULL';
  const isActive = student.isActive ? 'TRUE' : 'FALSE';

  const sql = `INSERT INTO users (name, email, password, role, rfid, index_number, degree, batch, is_active)
VALUES ('${name}', '${email}', '${password}', '${role}', ${rfid}, ${indexNumber}, ${degree}, ${batch}, ${isActive});`;

  sqlStatements.push(sql);

  // Add progress indicator every 50 students
  if ((index + 1) % 50 === 0) {
    sqlStatements.push(`\n-- Inserted ${index + 1}/${students.length} students...\n`);
  }
});

sqlStatements.push(`\n-- Re-enable triggers`);
sqlStatements.push(`SET session_replication_role = 'origin';`);

sqlStatements.push(`\n-- Verify the import`);
sqlStatements.push(`SELECT COUNT(*) as total_students FROM users WHERE role = 'student';`);
sqlStatements.push(`SELECT batch, COUNT(*) as count FROM users WHERE role = 'student' GROUP BY batch ORDER BY batch;`);

// Write to SQL file
const sqlFilePath = path.join(__dirname, 'insert-students.sql');
fs.writeFileSync(sqlFilePath, sqlStatements.join('\n'), 'utf8');

console.log(`\n✅ SQL file generated: ${sqlFilePath}`);
console.log(`\n🚀 Next steps:`);
console.log(`   1. Review the SQL file: scripts/insert-students.sql`);
console.log(`   2. Run it in Supabase SQL Editor OR`);
console.log(`   3. Run: node scripts/import-students-direct.js (for direct DB import)`);

/**
 * Escape single quotes in SQL strings
 */
function escapeSql(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/'/g, "''");
}
