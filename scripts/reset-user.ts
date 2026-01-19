import { db } from '../src/db';
import { users, sessions, accounts } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function resetUser() {
  const email = 'codydearkland@gmail.com';
  
  // Find the user
  const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (user.length === 0) {
    console.log('User not found:', email);
    return;
  }

  const userId = user[0].id;
  console.log('Found user:', { id: userId, email: user[0].email, role: user[0].role });

  // Delete sessions first (foreign key constraint)
  await db.delete(sessions).where(eq(sessions.userId, userId));
  console.log('Deleted sessions');

  // Delete accounts (foreign key constraint)
  await db.delete(accounts).where(eq(accounts.userId, userId));
  console.log('Deleted accounts');

  // Delete user
  await db.delete(users).where(eq(users.id, userId));
  console.log('Deleted user:', email);
  
  console.log('\nYou can now register again with this email.');
}

resetUser()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
