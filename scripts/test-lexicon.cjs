#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

try {
  const lexiconPath = path.resolve(process.cwd(), 'src/entities/lexicon/data/master-lexicon.json');
  const content = fs.readFileSync(lexiconPath, 'utf-8');
  const lexicon = JSON.parse(content);
  
  console.log('🔍 Testing Master Lexicon...');
  console.log(`📁 Path: ${lexiconPath}`);
  console.log(`📊 Total words: ${lexicon.length}`);
  
  // Test first entry
  const firstWord = lexicon[0];
  console.log('📝 First entry:');
  console.log(`   ID: ${firstWord.id}`);
  console.log(`   Concept: ${firstWord.conceptId}`);
  console.log(`   Languages: ${Object.keys(firstWord.translations).join(', ')}`);
  
  // Check for required languages
  const requiredLanguages = ['en', 'bg'];
  let completeness = {};
  requiredLanguages.forEach(lang => {
    completeness[lang] = lexicon.filter(word => word.translations[lang]).length;
  });
  
  console.log('📚 Language Completeness:');
  Object.entries(completeness).forEach(([lang, count]) => {
    const percentage = ((count / lexicon.length) * 100).toFixed(1);
    console.log(`   ${lang}: ${count}/${lexicon.length} (${percentage}%)`);
  });
  
  console.log('✅ Test completed successfully!');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
