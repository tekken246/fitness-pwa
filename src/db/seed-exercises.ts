import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { exercises } from './schema';

// 1. Explicitly load Next.js environment variables
config({ path: '.env.local' });
config({ path: '.env' }); 

// 2. Create a standalone DB connection
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env or .env.local');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

const DB_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

async function seedExercises() {
  console.log('⏳ Fetching exercise data from free-exercise-db...');
  
  try {
    const res = await fetch(DB_URL);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
    
    const data = await res.json();
    console.log(`✅ Found ${data.length} exercises. Seeding database...`);

    const BATCH_SIZE = 100;
    let insertedCount = 0;

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE).map((item: any) => {
        // Helper: Convert '{a,b}' or stringified arrays to clean JSON arrays
        const cleanArray = (val: any): string[] => {
          if (!val) return [];
          if (Array.isArray(val)) return val;
          if (typeof val === 'string') {
            // Handle SQL-style array string: '{a,b}'
            if (val.startsWith('{')) {
              return val.replace(/[{}]/g, '').split(',').filter(Boolean);
            }
            // Handle JSON stringified array
            try { return JSON.parse(val); } catch { return [val]; }
          }
          return [];
        };

        return {
          id: item.id || `ex_${crypto.randomUUID()}`,
          name: item.name,
          category: item.category || 'other',
          measurementType: ['cardio', 'stretching'].includes(item.category) ? 'duration' : 'weight_reps',
          defaultUnit: 'lb',
          // Images: Ensure they are full URLs and cleaned of SQL formatting
          images: cleanArray(item.images).map((img: string) => 
            img.startsWith('http') ? img : `${IMAGE_BASE_URL}${img}`
          ),
          instructions: cleanArray(item.instructions),
          primaryMuscles: cleanArray(item.primaryMuscles),
          equipment: item.equipment || 'body_only',
        };
      });

      await db.insert(exercises)
        .values(batch)
        .onConflictDoNothing({ target: exercises.name });

      insertedCount += batch.length;
      console.log(`📈 Inserted ${insertedCount} / ${data.length}...`);
    }

    console.log('🚀 Seeding absolutely complete! Your PWA now has a visual exercise library.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seedExercises();