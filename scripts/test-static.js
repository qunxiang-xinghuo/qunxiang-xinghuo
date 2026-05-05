const http = require('http');
const req = http.request({hostname:'81.70.59.228',port:80,path:'/',method:'GET',timeout:10000}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const jsMatches = body.match(/_next\/static\/[^"]+\.js/g) || [];
    const cssMatches = body.match(/_next\/static\/[^"]+\.css/g) || [];
    console.log('JS files found in HTML:', jsMatches.length);
    jsMatches.slice(0,3).forEach(m => console.log('  ', m));
    console.log('CSS files found in HTML:', cssMatches.length);
    cssMatches.slice(0,3).forEach(m => console.log('  ', m));
    
    const hasForm = body.includes('type="password"');
    const hasTitle = body.includes('群像·星火');
    const hasButton = body.includes('登录');
    console.log('Form:', hasForm, 'Title:', hasTitle, 'LoginBtn:', hasButton);
    
    if (jsMatches.length > 0) {
      const testPath = '/' + jsMatches[0];
      const req2 = http.request({hostname:'81.70.59.228',port:80,path:testPath,method:'GET',timeout:10000}, res2 => {
        console.log('Static JS test:', testPath, '→', res2.statusCode, res2.headers['content-type']);
      });
      req2.on('error', e => console.log('Static JS error:', e.message));
      req2.end();
    }
  });
});
req.on('error', e => console.log('ERROR:', e.message));
req.end();
