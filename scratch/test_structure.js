const fetch = require('node-fetch');

async function test() {
  try {
    const res = await fetch('https://hilex-nhl-production.up.railway.app/nhl/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ home_team: 'COL', away_team: 'AUTO' })
    });
    const data = await res.json();
    console.log('TEAM STRUCTURE:', JSON.stringify(data.home_team.breakdown, null, 2));

    const res2 = await fetch('https://hilex-nhl-production.up.railway.app/athletes/heatscore/nhl_8478402'); // Connor McDavid or similar
    const data2 = await res2.json();
    console.log('ATHLETE STRUCTURE:', JSON.stringify(data2, null, 2));
  } catch (e) {
    console.error(e);
  }
}

test();
