import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/db.js';

const port = Number(process.env.PORT) || 5000;

try {
  await connectDatabase();
  app.listen(port, () => console.log(`Eventify API listening on http://localhost:${port}`));
} catch (error) {
  console.error(`Unable to start Eventify API: ${error.message}`);
  process.exit(1);
}
