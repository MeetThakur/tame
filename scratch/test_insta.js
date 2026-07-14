async function test() {
  const reelUrl = 'https://www.instagram.com/p/CDZrcmwsULJ/';
  
  const userAgents = [
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_voiced_ostg.php)',
    'WhatsApp/2.24.4 A',
    'Twitterbot/1.0',
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  ];

  for (const ua of userAgents) {
    console.log('Testing User-Agent:', ua);
    try {
      const response = await fetch(reelUrl, {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      });
      console.log('Status:', response.status);
      const text = await response.text();
      
      const ogTitle = text.match(/<meta[^>]+(?:property|name)=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
                      text.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:title["']/i);
      const ogImage = text.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                      text.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i);
      
      console.log('Found Title:', ogTitle ? ogTitle[1] : 'Not Found');
      console.log('Found Image:', ogImage ? ogImage[1] : 'Not Found');
      console.log('---');
    } catch (err) {
      console.error('Error:', err.message);
    }
  }
}
test();
