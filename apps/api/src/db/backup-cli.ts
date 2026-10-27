import { backupDatabase } from './backup.ts';

const directory = process.env.BACKUP_DIRECTORY;
if (!directory) throw new Error('Set BACKUP_DIRECTORY to a private backup directory.');
console.info(await backupDatabase(process.env.DATABASE_PATH ?? './data/vidhyasaathy.db', directory));
