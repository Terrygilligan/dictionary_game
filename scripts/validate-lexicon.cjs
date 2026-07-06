#!/usr/bin/env node

/**
 * Lexicon Validation Script (CommonJS version)
 * 
 * This script validates the master lexicon JSON file to ensure:
 * - All required fields are present
 * - All concepts have translations for required languages
 * - Data structure is consistent
 * - No duplicate conceptIds or ids
 */

const fs = require('fs');
const path = require('path');

function loadLexiconData(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Failed to load lexicon from ${filePath}:`, error);
    process.exit(1);
  }
}

function validateLexicon(lexicon) {
  const errors = [];
  const warnings = [];
  const requiredLanguages = ['en', 'bg', 'nl'];
  const conceptIds = new Set();
  const wordIds = new Set();
  const languages = new Set();
  const languageCompleteness = {};

  // Initialize completeness counters
  requiredLanguages.forEach(lang => {
    languageCompleteness[lang] = 0;
  });

  lexicon.forEach((word, index) => {
    // Check required fields
    if (!word.id) {
      errors.push(`Entry ${index + 1}: Missing 'id' field`);
    } else if (wordIds.has(word.id)) {
      errors.push(`Entry ${index + 1}: Duplicate id '${word.id}'`);
    } else {
      wordIds.add(word.id);
    }

    if (!word.conceptId) {
      errors.push(`Entry ${index + 1}: Missing 'conceptId' field`);
    } else if (conceptIds.has(word.conceptId)) {
      errors.push(`Entry ${index + 1}: Duplicate conceptId '${word.conceptId}'`);
    } else {
      conceptIds.add(word.conceptId);
    }

    if (!word.translations || typeof word.translations !== 'object') {
      errors.push(`Entry ${index + 1}: Missing or invalid 'translations' field`);
    } else {
      Object.keys(word.translations).forEach(lang => languages.add(lang));
      
      requiredLanguages.forEach(lang => {
        if (!word.translations[lang]) {
          warnings.push(`Entry ${index + 1} (${word.conceptId}): Missing translation for '${lang}'`);
        } else {
          languageCompleteness[lang]++;
        }
      });
    }

    if (!word.definitions || typeof word.definitions !== 'object') {
      errors.push(`Entry ${index + 1}: Missing or invalid 'definitions' field`);
    } else {
      requiredLanguages.forEach(lang => {
        if (!word.definitions[lang]) {
          warnings.push(`Entry ${index + 1} (${word.conceptId}): Missing definition for '${lang}'`);
        }
      });
    }

    if (!word.coord || typeof word.coord !== 'object') {
      errors.push(`Entry ${index + 1} (${word.conceptId}): Missing or invalid 'coord' field`);
    } else {
      if (!word.coord.scroll) {
        errors.push(`Entry ${index + 1} (${word.conceptId}): Missing 'coord.scroll'`);
      }
      if (typeof word.coord.page !== 'number') {
        errors.push(`Entry ${index + 1} (${word.conceptId}): Invalid 'coord.page' (must be number)`);
      }
      if (typeof word.coord.column !== 'number') {
        errors.push(`Entry ${index + 1} (${word.conceptId}): Invalid 'coord.column' (must be number)`);
      }
      if (typeof word.coord.wordNumber !== 'number') {
        errors.push(`Entry ${index + 1} (${word.conceptId}): Invalid 'coord.wordNumber' (must be number)`);
      }
    }
  });

  const summary = {
    totalWords: lexicon.length,
    uniqueConcepts: conceptIds.size,
    languages: Array.from(languages).sort(),
    completeness: languageCompleteness
  };

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary
  };
}

function main() {
  const lexiconPath = path.resolve(process.cwd(), 'src/entities/lexicon/data/master-lexicon.json');
  
  console.log('🔍 Validating Master Lexicon...');
  console.log(`📁 Path: ${lexiconPath}`);
  console.log('');

  const lexicon = loadLexiconData(lexiconPath);
  const result = validateLexicon(lexicon);

  // Print summary
  console.log('📊 Summary:');
  console.log(`   Total words: ${result.summary.totalWords}`);
  console.log(`   Unique concepts: ${result.summary.uniqueConcepts}`);
  console.log(`   Languages: ${result.summary.languages.join(', ')}`);
  console.log('');

  // Print completeness
  console.log('📚 Language Completeness:');
  Object.entries(result.summary.completeness).forEach(([lang, count]) => {
    const percentage = ((count / result.summary.totalWords) * 100).toFixed(1);
    console.log(`   ${lang}: ${count}/${result.summary.totalWords} (${percentage}%)`);
  });
  console.log('');

  // Print warnings
  if (result.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    result.warnings.forEach(warning => console.log(`   ${warning}`));
    console.log('');
  }

  // Print errors
  if (result.errors.length > 0) {
    console.log('❌ Errors:');
    result.errors.forEach(error => console.log(`   ${error}`));
    console.log('');
  }

  // Final result
  if (result.isValid) {
    console.log('✅ Lexicon validation passed!');
    process.exit(0);
  } else {
    console.log(`❌ Lexicon validation failed with ${result.errors.length} error(s)`);
    process.exit(1);
  }
}

main();
