import { loadConfig } from '../config.ts';
import { openDatabase } from './index.ts';

const config = loadConfig();
const database = openDatabase(config.DATABASE_PATH);
database.close();
console.info('Database migrations applied.');
