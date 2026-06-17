const https = require('https');
https.get('https://unipath.me/', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const match = data.match(/<script type="module" crossorigin src="(.*?)">/);
    if (match) {
      const jsUrl = 'https://unipath.me' + match[1];
      console.log('Found JS:', jsUrl);
      https.get(jsUrl, (res2) => {
        let jsData = '';
        res2.on('data', (c) => jsData += c);
        res2.on('end', () => {
          const supaUrlMatch = jsData.match(/https:\/\/[a-z0-9]+\.supabase\.co/g);
          console.log('Supabase URLs in bundle:', Array.from(new Set(supaUrlMatch)));
        });
      });
    } else {
      console.log('No script tag found in HTML');
    }
  });
});
