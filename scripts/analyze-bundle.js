#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Analyzes the React build bundle and provides optimization recommendations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BUNDLE_SIZE_LIMIT = 1024 * 1024; // 1MB
const CHUNK_SIZE_LIMIT = 512 * 1024; // 512KB

/**
 * Analyze build directory
 */
function analyzeBuild() {
  const buildDir = path.join(process.cwd(), 'build', 'static');
  
  if (!fs.existsSync(buildDir)) {
    console.error('❌ Build directory not found. Run "npm run build" first.');
    process.exit(1);
  }

  console.log('📊 Analyzing bundle...\n');

  const jsDir = path.join(buildDir, 'js');
  const cssDir = path.join(buildDir, 'css');

  const jsFiles = fs.existsSync(jsDir) ? fs.readdirSync(jsDir) : [];
  const cssFiles = fs.existsSync(cssDir) ? fs.readdirSync(cssDir) : [];

  let totalSize = 0;
  const issues = [];
  const recommendations = [];

  // Analyze JavaScript files
  console.log('📦 JavaScript Files:');
  jsFiles.forEach(file => {
    const filePath = path.join(jsDir, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    
    totalSize += stats.size;
    
    console.log(`  ${file}: ${sizeKB} KB`);
    
    if (stats.size > CHUNK_SIZE_LIMIT) {
      issues.push(`Large chunk: ${file} (${sizeKB} KB)`);
    }
  });

  // Analyze CSS files
  console.log('\n🎨 CSS Files:');
  cssFiles.forEach(file => {
    const filePath = path.join(cssDir, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    
    totalSize += stats.size;
    
    console.log(`  ${file}: ${sizeKB} KB`);
  });

  const totalSizeKB = (totalSize / 1024).toFixed(2);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

  console.log(`\n📏 Total Bundle Size: ${totalSizeKB} KB (${totalSizeMB} MB)`);

  // Check bundle size
  if (totalSize > BUNDLE_SIZE_LIMIT) {
    issues.push(`Bundle size exceeds recommended limit (${totalSizeMB} MB > 1 MB)`);
  }

  // Generate recommendations
  if (issues.length > 0) {
    console.log('\n⚠️  Issues Found:');
    issues.forEach(issue => console.log(`  - ${issue}`));
    
    recommendations.push('Implement code splitting with React.lazy()');
    recommendations.push('Use dynamic imports for large libraries');
    recommendations.push('Consider removing unused dependencies');
    recommendations.push('Optimize images and assets');
    recommendations.push('Enable gzip compression on server');
  }

  if (recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    recommendations.forEach(rec => console.log(`  - ${rec}`));
  }

  if (issues.length === 0) {
    console.log('\n✅ Bundle size looks good!');
  }

  return {
    totalSize,
    totalSizeKB,
    totalSizeMB,
    issues,
    recommendations
  };
}

/**
 * Generate bundle report
 */
function generateReport(analysis) {
  const report = {
    timestamp: new Date().toISOString(),
    bundleSize: {
      bytes: analysis.totalSize,
      kb: analysis.totalSizeKB,
      mb: analysis.totalSizeMB
    },
    issues: analysis.issues,
    recommendations: analysis.recommendations,
    status: analysis.issues.length === 0 ? 'PASS' : 'FAIL'
  };

  const reportPath = path.join(process.cwd(), 'bundle-analysis.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Report saved to: ${reportPath}`);
  
  return report;
}

/**
 * Main execution
 */
function main() {
  try {
    const analysis = analyzeBuild();
    const report = generateReport(analysis);
    
    // Exit with error code if issues found
    if (report.status === 'FAIL') {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { analyzeBuild, generateReport };