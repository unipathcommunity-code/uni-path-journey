const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  try {
    const html = await get('https://unipath.me/');
    console.log("HTML length:", html.length);
    
    // Find script tags
    const match = html.match(/src="([^"]+\.js)"/g);
    if (!match) {
      console.log("No scripts found");
      return;
    }
    
    for (const m of match) {
      const src = m.match(/src="([^"]+)"/)[1];
      const scriptUrl = src.startsWith('http') ? src : `https://unipath.me${src.startsWith('/') ? '' : '/'}${src}`;
      console.log("Downloading", scriptUrl);
      
      const js = await get(scriptUrl);
      console.log("JS length:", js.length);
      
      const supaUrls = js.match(/https:\/\/[^.]+\.supabase\.co/g);
      if (supaUrls) {
        console.log("Found Supabase URLs in", scriptUrl, ":", [...new Set(supaUrls)]);
      } else {
        console.log("No supabase URLs found in", scriptUrl);
      }
      
      // Check if it throws supabaseKey is required
      if (js.includes("supabaseKey is required")) {
         console.log("Found text 'supabaseKey is required'");
      }
      
      // Let's also search for VITE_SUPABASE
      if (js.includes("VITE_SUPABASE")) {
         console.log("Found VITE_SUPABASE references");
      }
    }
  } catch(e) {
    console.error(e);
  }
}
run();
