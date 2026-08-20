/**
 * BullMQ Worker — Background Job Processor
 * Run separately: npm run worker
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

console.log('🔧 Graxion Mail Worker starting...');
console.log('📝 Note: BullMQ worker requires Redis. Skipping if Redis is not available.');

// Worker will be fully implemented when Redis is configured
// For now, scheduled sends and cleanup run inline

console.log('✅ Worker ready (Redis-dependent features disabled until Redis is configured)');
