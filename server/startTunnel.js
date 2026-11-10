import { spawn } from 'child_process';
import fs from 'fs';

function launch() {
  const lt = spawn('npx', ['localtunnel', '--port', '3000']);
  lt.stdout.on('data', (data) => {
    const text = data.toString();
    console.log('Tunnel out:', text);
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.loca\.lt/);
    if (match) {
      const url = match[0];
      fs.writeFileSync('/tmp/tunnel_url.txt', url, 'utf-8');
      console.log('ACTIVE_TUNNEL_URL:', url);
    }
  });

  lt.stderr.on('data', (data) => console.error('Tunnel err:', data.toString()));

  lt.on('close', (code) => {
    console.log('Tunnel exited with code', code, 'restarting in 2s...');
    setTimeout(launch, 2000);
  });
}

launch();
