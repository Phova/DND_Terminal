const http = require('http');

function get(path) {
  return new Promise((resolve) => {
    http.get('http://localhost:5173' + path, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d.slice(0, 200) }));
    });
  });
}

async function main() {
  const health = await get('/api/health');
  console.log('Health:', health.status, health.body);
  const chars = await get('/api/characters');
  console.log('Chars:', chars.status, chars.body.slice(0, 120));
  const monsters = await get('/api/monsters?limit=2');
  console.log('Monsters:', monsters.status, monsters.body.slice(0, 120));
}

main();
