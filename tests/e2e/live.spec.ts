import {test,expect} from '@playwright/test';
test('independent phones join, play, undo, and restore through Firestore',async({browser})=>{
 test.skip(!process.env.SABOBATAGE_EMULATORS&&!process.env.SABOBATAGE_LIVE_URL,'Requires local emulators or an explicit live deployment URL.');
 const deployment=process.env.SABOBATAGE_LIVE_URL||'http://127.0.0.1:5194/';
 const route=(path:string)=>new URL(path,deployment.endsWith('/')?deployment:deployment+'/').href;
 const host=await browser.newContext({viewport:{width:1440,height:1000}}),one=await browser.newContext({viewport:{width:393,height:852}}),two=await browser.newContext({viewport:{width:393,height:852}});
 const table=await host.newPage(),a=await one.newPage(),b=await two.newPage();
 for(const page of [table,a,b])page.on('pageerror',error=>{throw error;});
 try{
  await table.goto(route('table/'));await expect(table).toHaveURL(/\/table\/\?room=/,{timeout:20000});
  await expect(table.locator('.table-phone-join img')).toHaveCount(4);
  const room=new URL(table.url()).searchParams.get('room');
  const phoneLink=await table.locator('.table-phone-join a').first().getAttribute('href');
  expect(phoneLink).toBe(route(`hand/?room=${room}`));
  await table.reload();await expect(table.locator('.table-room')).toHaveText(room!);
  for(const [page,name] of [[a,'Peach Live'],[b,'Taro Live']] as const){await page.goto(phoneLink!);await page.getByRole('textbox',{name:'Your shop name'}).fill(name);await page.getByRole('button',{name:'Join table',exact:true}).click();await expect(page.locator('.table-lobby')).toContainText(name);}
  await expect(table.getByLabel('Joined shops')).toContainText('Peach Live');
  await expect(table.getByLabel('Joined shops')).toContainText('Taro Live');
  await table.getByRole('button',{name:'Open the shops →',exact:true}).click();
  await a.getByRole('button',{name:'Draw 2 cards',exact:true}).click();
  await expect(a.locator('.hand-meta')).toContainText('7');
  const choices=await a.locator('.fan-hit').evaluateAll(els=>els.map(el=>el.getAttribute('aria-label')!));
  const candidate=choices.find(name=>/^Select (Green Tea|Black Tea|Milk|Oat Milk|Taro|Peach|Passion Fruit|Honey Lemon|Wild Ingredient)$/.test(name));
  expect(candidate,'Seeded hand should contain an ingredient without a draw bonus').toBeTruthy();
  await a.getByRole('button',{name:candidate!,exact:true}).click();await a.getByRole('button',{name:'Place here',exact:true}).filter({visible:true}).click();
  await expect(a.locator('.game-error')).toHaveCount(0);
  await expect(table.locator('.counter-card')).toHaveCount(1);
  await expect(table.locator('.fan-hit,.near-hand')).toHaveCount(0);
  await a.getByRole('button',{name:'↶ Undo',exact:true}).click();await expect(table.locator('.counter-card')).toHaveCount(0);
  await a.reload();await expect(a.locator('.hand-meta')).toContainText('7');await expect(a.locator('.surface-rail')).toContainText('3 plays left');
  await expect(b.locator('.hand-meta')).toContainText('5');
 }finally{await Promise.all([host.close(),one.close(),two.close()]);}
});
