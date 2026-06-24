const https = require('https');

https.get('https://www.unipath.me/', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('HTTP Status Code:', res.statusCode);
    console.log('Headers:', res.headers);
    
    // Check if it contains old or new text
    const containsOldText = data.includes('raqamlashtiring');
    const containsNewText = data.includes('SaaS') || data.includes('Precision');
    const containsLime = data.includes('lime') || data.includes('forest');

    console.log('\n--- Content Check ---');
    console.log('Contains old text ("raqamlashtiring"):', containsOldText);
    console.log('Contains new text ("SaaS" / "Precision"):', containsNewText);
    console.log('Contains new styles ("lime" / "forest"):', containsLime);
    
    // Find script tags
    const scriptRegex = /<script\b[^>]*src="([^"]*)"/gi;
    let match;
    console.log('\n--- Bundled Scripts ---');
    while ((match = scriptRegex.exec(data)) !== null) {
      console.log(match[1]);
    }
  });
}).on('error', (err) => {
  console.error('Error fetching live page:', err.message);
});
