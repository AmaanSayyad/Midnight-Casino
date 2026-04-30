const fs = require('fs');
const path = require('path');

// Dosya uzantıları ve dizinler
const FILE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.json'];
const DIRECTORIES_TO_SEARCH = [
  'src',
  'components',
  'pages',
  'app',
  'hooks',
  'utils',
  'config',
  'services'
];

// Değiştirilecek kelimeler
const REPLACEMENTS = [
  // MON -> MATIC
  { from: /\bMON\b/g, to: 'MATIC' },
  { from: /\bmon\b/g, to: 'matic' },
  { from: /'MON'/g, to: "'MATIC'" },
  { from: /"MON"/g, to: '"MATIC"' },
  { from: /`MON`/g, to: '`MATIC`' },
  
  // POL -> MATIC
  { from: /\bPOL\b/g, to: 'MATIC' },
  { from: /\bpol\b/g, to: 'matic' },
  { from: /'POL'/g, to: "'MATIC'" },
  { from: /"POL"/g, to: '"MATIC"' },
  { from: /`POL`/g, to: '`MATIC`' },
  
  // Specific patterns
  { from: /MON token/g, to: 'MATIC token' },
  { from: /POL token/g, to: 'MATIC token' },
  { from: /MON tokens/g, to: 'MATIC tokens' },
  { from: /POL tokens/g, to: 'MATIC tokens' },
  { from: /MON amount/g, to: 'MATIC amount' },
  { from: /POL amount/g, to: 'MATIC amount' },
  { from: /MON balance/g, to: 'MATIC balance' },
  { from: /POL balance/g, to: 'MATIC balance' },
  
  // Variable names
  { from: /balanceInMon/g, to: 'balanceInMatic' },
  { from: /balanceInPol/g, to: 'balanceInMatic' },
  { from: /parseMONAmount/g, to: 'parseMATICAmount' },
  { from: /parsePOLAmount/g, to: 'parseMATICAmount' },
  { from: /formatMONAmount/g, to: 'formatMATICAmount' },
  { from: /formatPOLAmount/g, to: 'formatMATICAmount' },
  { from: /getCurrentBalanceInMON/g, to: 'getCurrentBalanceInMATIC' },
  { from: /getCurrentBalanceInPOL/g, to: 'getCurrentBalanceInMATIC' },
  { from: /valueMon/g, to: 'valueMatic' },
  { from: /valuePol/g, to: 'valueMatic' },
  
  // Comments and descriptions
  { from: /Format MON amount/g, to: 'Format MATIC amount' },
  { from: /Format POL amount/g, to: 'Format MATIC amount' },
  { from: /Parse MON amount/g, to: 'Parse MATIC amount' },
  { from: /Parse POL amount/g, to: 'Parse MATIC amount' },
  { from: /balance MON/g, to: 'balance MATIC' },
  { from: /balance POL/g, to: 'balance MATIC' },
  { from: /Display balance MON/g, to: 'Display balance MATIC' },
  { from: /Display balance POL/g, to: 'Display balance MATIC' },
  
  // Network names
  { from: /Polygon Ecosystem Token/g, to: 'MATIC Token' },
  { from: /POL Casino Token/g, to: 'MATIC Casino Token' },
  { from: /MON Casino Token/g, to: 'MATIC Casino Token' },
];

// Dosya okuma ve yazma fonksiyonları
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error.message);
    return false;
  }
}

// Dosya içeriğini güncelleme
function updateFileContent(content) {
  let updatedContent = content;
  let changeCount = 0;
  
  REPLACEMENTS.forEach(replacement => {
    const matches = updatedContent.match(replacement.from);
    if (matches) {
      changeCount += matches.length;
      updatedContent = updatedContent.replace(replacement.from, replacement.to);
    }
  });
  
  return { content: updatedContent, changes: changeCount };
}

// Dizin tarama
function scanDirectory(dirPath) {
  const files = [];
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, .git, .next, etc.
        if (!item.startsWith('.') && item !== 'node_modules' && item !== 'dist' && item !== 'build') {
          files.push(...scanDirectory(fullPath));
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (FILE_EXTENSIONS.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error.message);
  }
  
  return files;
}

// Ana fonksiyon
function main() {
  console.log('🔄 Starting currency update: MON/POL -> MATIC');
  console.log('📁 Scanning directories:', DIRECTORIES_TO_SEARCH.join(', '));
  
  let totalFiles = 0;
  let updatedFiles = 0;
  let totalChanges = 0;
  
  // Mevcut dizini al
  const currentDir = process.cwd();
  
  // Tüm dosyaları topla
  const allFiles = [];
  
  for (const dir of DIRECTORIES_TO_SEARCH) {
    const dirPath = path.join(currentDir, dir);
    if (fs.existsSync(dirPath)) {
      const files = scanDirectory(dirPath);
      allFiles.push(...files);
      console.log(`📂 Found ${files.length} files in ${dir}/`);
    }
  }
  
  // .env dosyasını da ekle
  const envPath = path.join(currentDir, '.env');
  if (fs.existsSync(envPath)) {
    allFiles.push(envPath);
  }
  
  console.log(`📊 Total files to process: ${allFiles.length}`);
  console.log('');
  
  // Her dosyayı işle
  for (const filePath of allFiles) {
    totalFiles++;
    const relativePath = path.relative(currentDir, filePath);
    
    const content = readFile(filePath);
    if (content === null) continue;
    
    const result = updateFileContent(content);
    
    if (result.changes > 0) {
      if (writeFile(filePath, result.content)) {
        updatedFiles++;
        totalChanges += result.changes;
        console.log(`✅ ${relativePath} - ${result.changes} changes`);
      } else {
        console.log(`❌ ${relativePath} - Failed to write`);
      }
    }
  }
  
  console.log('');
  console.log('🎉 Currency update completed!');
  console.log(`📊 Summary:`);
  console.log(`   - Total files scanned: ${totalFiles}`);
  console.log(`   - Files updated: ${updatedFiles}`);
  console.log(`   - Total changes made: ${totalChanges}`);
  
  if (updatedFiles > 0) {
    console.log('');
    console.log('✨ All MON and POL references have been updated to MATIC!');
    console.log('🔄 Please restart your development server to see the changes.');
  } else {
    console.log('');
    console.log('ℹ️  No changes were needed - all currency references are already correct.');
  }
}

// Script'i çalıştır
if (require.main === module) {
  main();
}

module.exports = { main, updateFileContent, REPLACEMENTS };