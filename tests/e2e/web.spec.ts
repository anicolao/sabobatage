import {test,expect} from '@playwright/test';
test('web host and invited player play privately without a tabletop, with room-code join and reload',async({browser},info)=>{
 test.skip(!process.env.SABOBATAGE_EMULATORS&&!process.env.SABOBATAGE_LIVE_URL,'Requires emulators or a live deployment.');
 const deployment=process.env.SABOBATAGE_LIVE_URL||'http://127.0.0.1:5194/';
 const route=(path:string)=>new URL(path,deployment).href;
 const host=await browser.newContext({viewport:{width:1440,height:1000}}),guest=await browser.newContext({viewport:{width:393,height:852}}),third=await browser.newContext();
 const a=await host.newPage(),b=await guest.newPage(),c=await third.newPage();
 try{
  await a.goto(route('play/'));
  await a.screenshot({path:info.outputPath('play-modes.png')});
  await expect(a.getByRole('link',{name:'Create tabletop game ↗'})).toHaveAttribute('href',/\/table\/$/);
  await a.getByRole('textbox',{name:'Your shop name'}).fill('Web Peach');await a.getByRole('button',{name:'Create web game'}).click();
  await expect(a).toHaveURL(/\/play\/\?room=/,{timeout:20000});
  await expect(a.locator('.table-lobby')).toContainText('Web Peach · you');
  const invite=await a.getByRole('textbox',{name:'Game link'}).inputValue();expect(invite).toBe(a.url());
  await a.screenshot({path:info.outputPath('web-invite.png')});
  await a.reload();await expect(a.locator('.table-lobby')).toContainText('Web Peach · you');
  await b.goto(invite);await b.getByRole('textbox',{name:'Your shop name'}).fill('Web Taro');await b.getByRole('button',{name:'Join game',exact:true}).click();
  await expect(a.locator('.table-lobby')).toContainText('Web Taro');
  await c.goto(route('play/'));await c.getByRole('textbox',{name:'Room code'}).fill(new URL(invite).searchParams.get('room')!);await c.getByRole('button',{name:'Join web game'}).click();
  await c.getByRole('textbox',{name:'Your shop name'}).fill('Web Milk');await c.getByRole('button',{name:'Join game',exact:true}).click();
  await expect(a.locator('.table-lobby')).toContainText('Web Milk');
  await expect(b.getByRole('button',{name:'Open the shops →'})).toHaveCount(0);
  await a.getByRole('button',{name:'Open the shops →'}).click();
  for(const p of [a,b,c]){await expect(p.locator('.hand-meta')).toContainText('5');await expect(p.locator('.public-surface,.physical-seat')).toHaveCount(0);}
  const own=await a.locator('.fan-hit').evaluateAll(els=>els.map(el=>el.getAttribute('data-piece')));
  const other=await b.locator('.fan-hit').evaluateAll(els=>els.map(el=>el.getAttribute('data-piece')));
  expect(own.some(id=>other.includes(id))).toBe(false);
  await a.getByRole('button',{name:'Draw 2 cards',exact:true}).click();await expect(a.locator('.hand-meta')).toContainText('7');
  await a.getByRole('button',{name:'End turn →',exact:true}).click();
  await b.getByRole('button',{name:'Draw 2 cards',exact:true}).click();await expect(b.locator('.hand-meta')).toContainText('7');
  await b.reload();await expect(b.locator('.hand-meta')).toContainText('7');await expect(b.locator('.counter-owner')).toContainText('Your counter');
  await a.reload();await expect(a.locator('.hand-meta')).toContainText('7');await expect(a.locator('.game-error')).toHaveCount(0);
  await a.locator('.table-wordmark').click();await expect(a.getByRole('button',{name:'Create web game'})).toBeVisible();
  await a.goto(invite);await expect(a.locator('.hand-meta')).toContainText('7');
 }finally{await Promise.all([host.close(),guest.close(),third.close()]);}
});
