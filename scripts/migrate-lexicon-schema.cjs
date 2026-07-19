/**
 * Migration script to add polysemy and difficulty fields to master-lexicon.json
 * This updates the lexicon to the unified schema required for the three game modes
 */

const fs = require('fs');
const path = require('path');

const LEXICON_PATH = path.join(__dirname, '../src/entities/lexicon/data/master-lexicon.json');

/**
 * Add polysemy and difficulty fields to lexicon entries
 * @param {Object} entry - The lexicon entry to update
 * @param {number} index - The index of the entry (for some heuristic logic)
 * @returns {Object} The updated entry
 */
function addSchemaFields(entry, index) {
  // Default values
  const defaults = {
    polysemy: 1,      // Low polysemy by default (single meaning)
    difficulty: 3     // Medium difficulty by default
  };

  // Add some heuristic logic based on word characteristics
  // This is a simple approach - can be refined with actual linguistic analysis
  
  // Words with longer definitions tend to be more complex
  const avgDefinitionLength = Object.values(entry.definitions)
    .reduce((sum, def) => sum + def.length, 0) / Object.values(entry.definitions).length;
  
  if (avgDefinitionLength > 100) {
    defaults.difficulty = 5;  // Longer definitions = higher difficulty
  } else if (avgDefinitionLength < 30) {
    defaults.difficulty = 2;  // Shorter definitions = lower difficulty
  }

  // Words appearing in early sections get lower difficulty (progressive learning)
  if (entry.coord && entry.coord.page === 1) {
    defaults.difficulty = Math.min(defaults.difficulty, 2);
  }

  return {
    ...entry,
    polysemy: entry.polysemy || defaults.polysemy,
    difficulty: entry.difficulty || defaults.difficulty
  };
}

/**
 * Main migration function
 */
function migrateLexicon() {
  console.log('🔄 Starting lexicon schema migration...');
  
  try {
    // Read the current lexicon
    const lexiconData = fs.readFileSync(LEXICON_PATH, 'utf8');
    const lexicon = JSON.parse(lexiconData);
    
    console.log(`📚 Found ${lexicon.length} lexicon entries`);
    
    // Migrate each entry
    const migratedLexicon = lexicon.map((entry, index) => {
      const migrated = addSchemaFields(entry, index);
      return migrated;
    });
    
    // Write the migrated lexicon back
    const migratedData = JSON.stringify(migratedLexicon, null, 2);
    fs.writeFileSync(LEXICON_PATH, migratedData, 'utf8');
    
    console.log('✅ Migration completed successfully');
    console.log(`   Added polysemy field to all entries`);
    console.log(`   Added difficulty field to all entries`);
    console.log(`   Total entries processed: ${migratedLexicon.length}`);
    
    // Show some statistics
    const polysemyStats = {};
    const difficultyStats = {};
    migratedLexicon.forEach(entry => {
      polysemyStats[entry.polysemy] = (polysemyStats[entry.polysemy] || 0) + 1;
      difficultyStats[entry.difficulty] = (difficultyStats[entry.difficulty] || 0) + 1;
    });
    
    console.log('\n📊 Polysemy distribution:');
    Object.keys(polysemyStats).sort().forEach(key => {
      console.log(`   ${key}: ${polysemyStats[key]} entries`);
    });
    
    console.log('\n📊 Difficulty distribution:');
    Object.keys(difficultyStats).sort().forEach(key => {
      console.log(`   ${key}: ${difficultyStats[key]} entries`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
migrateLexicon();
