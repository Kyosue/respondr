const fs = require('fs');
const path = require('path');

// Copy Ionicons font to dist folder for web deployment
const sourceFont = path.join(__dirname, '../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf');
const distFontsDir = path.join(__dirname, '../dist/fonts');
const distFont = path.join(distFontsDir, 'Ionicons.ttf');

// Create fonts directory if it doesn't exist
if (!fs.existsSync(distFontsDir)) {
  fs.mkdirSync(distFontsDir, { recursive: true });
}

// Copy the font file
if (fs.existsSync(sourceFont)) {
  fs.copyFileSync(sourceFont, distFont);
  console.log('✓ Ionicons font copied to dist/fonts/');
} else {
  console.warn('⚠ Ionicons font not found at:', sourceFont);
}

