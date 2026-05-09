const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const buf = Buffer.from(data, 'utf-8');
    const req = http.request({
      hostname: 'localhost', port: 3100, path, method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': buf.length }
    }, (res) => {
      let chunks = '';
      res.on('data', c => chunks += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(chunks) }); }
        catch(e) { resolve({ status: res.statusCode, body: chunks }); }
      });
    });
    req.on('error', reject);
    req.write(buf);
    req.end();
  });
}

async function main() {
  // Test dice roll
  const d1 = await post('/api/dice/roll', { expression: '2d6+3', label: 'Fire damage' });
  console.log('Dice 2d6+3:', JSON.stringify(d1));

  // Test skill check with character
  const d2 = await post('/api/dice/roll', { expression: 'adv d20', character_id: 1, skill: 'arcana', label: 'Arcana check' });
  console.log('Skill adv d20:', JSON.stringify(d2));

  // Test d20
  const d3 = await post('/api/dice/roll', { expression: 'd20', label: 'Initiative' });
  console.log('d20:', JSON.stringify(d3));

  // Test character login
  const login = await post('/api/characters/login', { username: 'gandalf', password: 'greyhame' });
  console.log('Login:', JSON.stringify(login).slice(0, 200));
}

main().catch(console.error);
