/**
 * CLI-обгортка: npm run db:seed. Логіка — у lib/db/seedData.ts (щоб її можна було
 * викликати і з /api/setup на хостингу, де немає доступу до консолі).
 */
import { seedDatabase } from "./seedData";

seedDatabase()
  .then((log) => {
    for (const line of log) console.log(line);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
