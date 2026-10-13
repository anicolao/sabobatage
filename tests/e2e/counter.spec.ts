import {test,expect,type Page} from '@playwright/test';
const demo=async(page:Page,scenario='')=>{await page.goto(`/hand/?demo=${scenario}`);await expect(page.locator('.hand-fan')).toBeVisible();};
const select=async(page:Page,name:string)=>page.getByRole('button',{name:`Select ${name}`,exact:true}).click();
const ingredient=async(page:Page,name:string)=>page.getByRole('button',{name,exact:true}).click({position:{x:25,y:12}});
test.beforeEach(async({page})=>{page.on('pageerror',error=>{throw error;});});

test('phone places Boba immediately, selects its bonus, and undoes',async({page})=>{
 await demo(page);await select(page,'Boba');
 await page.getByRole('button',{name:'+1 play',exact:true}).click();
 await page.locator('.counter-drink.focused').getByRole('button',{name:'Place here',exact:true}).click();
 await expect(page.getByRole('button',{name:'Boba in Peach Please drink 1',exact:true})).toBeVisible();
 await expect(page.locator('.surface-rail')).toContainText('3 plays left');
 await page.getByRole('button',{name:'↶ Undo',exact:true}).click();
 await expect(page.getByRole('button',{name:'Select Boba',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Boba in Peach Please drink 1',exact:true})).toHaveCount(0);
});

test('5-Star Review requires the draw pile; phone selectors only browse',async({page})=>{
 await demo(page);await select(page,'5-Star Review');
 await expect(page.locator('.hand-meta')).toContainText('7');
 await page.getByRole('button',{name:'Play 5-Star Review and draw two',exact:true}).click();
 await expect(page.locator('.hand-meta')).toContainText('8 / 7');
 await expect(page.getByRole('button',{name:'↶ Undo',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'View drink 4',exact:true}).click();
 await expect(page.getByRole('button',{name:'Peach Please drink 4 empty slot',exact:true})).toBeVisible();
});

test('Sabobatage keeps four targets local, then declares all five',async({page})=>{
 await demo(page);await select(page,'Sabobatage');
 await ingredient(page,'Black Tea in Peach Please drink 1');
 await ingredient(page,'Milk in Peach Please drink 1');
 await page.getByRole('button',{name:'Taro & Co., 2 drinks, 4 private cards',exact:true}).click();
 await ingredient(page,'Black Tea in Taro & Co. drink 1');
 await ingredient(page,'Milk in Taro & Co. drink 1');
 await expect(page.locator('.selection-count')).toContainText('4 chosen');
 await expect(page.getByRole('button',{name:'Pass',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Milk Moon, 2 drinks, 4 private cards',exact:true}).click();
 await ingredient(page,'Black Tea in Milk Moon drink 1');
 await expect(page.locator('.action-receipt')).toContainText('5 ingredients chosen');
 await expect(page.getByRole('button',{name:'Pass',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Select Sabobatage',exact:true})).toHaveCount(0);
});

test('Sugar and Ice carries the ingredient back to your counter',async({page})=>{
 await demo(page);await select(page,'Sugar and Ice');
 await page.getByRole('button',{name:'Taro & Co., 2 drinks, 4 private cards',exact:true}).click();
 await ingredient(page,'Black Tea in Taro & Co. drink 1');
 await expect(page.locator('.counter-owner')).toContainText('Your counter');
 await page.getByRole('button',{name:'View drink 4',exact:true}).click();
 await page.locator('.counter-drink.focused').getByRole('button',{name:'Place here',exact:true}).click();
 await expect(page.locator('.action-receipt')).toContainText('Sugar and Ice');
 await expect(page.getByRole('button',{name:'Pass',exact:true})).toBeVisible();
});

test('Tea Party stages two teas before choosing separate destinations',async({page})=>{
 await demo(page);await select(page,'Tea Party');
 for(const shop of ['Taro & Co.','Milk Moon']){
  await page.getByRole('button',{name:`${shop}, 2 drinks, 4 private cards`,exact:true}).click();
  await ingredient(page,`Black Tea in ${shop} drink 1`);
 }
 await page.getByRole('button',{name:'Use 2 teas →',exact:true}).click();
 for(const slot of [4,5]){await page.getByRole('button',{name:`View drink ${slot}`,exact:true}).click();await page.locator('.counter-drink.focused').getByRole('button',{name:'Place here',exact:true}).click();}
 await expect(page.locator('.action-receipt')).toContainText('2 ingredients chosen');
 await expect(page.getByRole('button',{name:'Pass',exact:true})).toBeVisible();
});

test('Straw protects the selected completed drink without a dialog',async({page})=>{
 await demo(page);await select(page,'Straw');await page.getByRole('button',{name:'View drink 2, complete',exact:true}).click();
 await page.locator('.counter-drink.focused').getByRole('button',{name:'Place here',exact:true}).click();
 await expect(page.getByRole('button',{name:'Inspect Straw',exact:true})).toBeVisible();
 await expect(page.locator('dialog')).toHaveCount(0);
});

test('Lactose Intolerant lets the victim directly choose Milk',async({page})=>{
 await demo(page,'milk-choice');
 await expect(page.locator('.action-receipt')).toContainText('Lactose Intolerant');
 await ingredient(page,'Milk in Peach Please drink 1');
 await expect(page.getByRole('button',{name:'Milk in Peach Please drink 1',exact:true})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Black Tea in Peach Please drink 1',exact:true})).toBeVisible();
});

test('Recycle uses an inline discard reader, overflow stays reachable',async({page})=>{
 await demo(page);await select(page,'Recycle');
 await page.getByRole('button',{name:'Recycle Health Inspector',exact:true}).click();
 await expect(page.getByRole('button',{name:'Select Health Inspector',exact:true})).toBeVisible();
 await expect(page.locator('dialog')).toHaveCount(0);
 await demo(page,'overflow');
 await expect(page.locator('.hand-meta')).toContainText('14 / 7');
 await page.getByRole('button',{name:'Next hand cards',exact:true}).click();
 await expect(page.locator('.hand-meta')).toContainText('8–14');
 await page.getByRole('button',{name:'Discard 7 to end',exact:true}).click();
 for(let i=0;i<7;i++)await page.locator('.fan-hit').first().click();
 await expect(page.getByRole('button',{name:'End turn →',exact:true})).toBeEnabled();
});

for(const size of [{width:393,height:852},{width:360,height:740},{width:1440,height:1000}])test(`viewport ${size.width}: no page overflow, disjoint hand hits, readable inspector`,async({page},info)=>{
 await page.setViewportSize(size);await demo(page);
 const geometry=await page.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,cards:Array.from(document.querySelectorAll('.fan-hit')).map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};})}));
 expect(geometry.width).toBe(size.width);expect(geometry.height).toBe(size.height);
 geometry.cards.forEach((r,i)=>{expect(r.width).toBeGreaterThanOrEqual(44);expect(r.height).toBeGreaterThanOrEqual(44);if(i)expect(r.x).toBeGreaterThanOrEqual(geometry.cards[i-1].right-.1);});
 await page.screenshot({path:info.outputPath('resting.png')});
 await select(page,'Boba');
 expect(await page.locator('.selection-ticket').evaluate(el=>el.scrollHeight<=el.clientHeight+1)).toBe(true);
 await page.getByRole('button',{name:'Inspect',exact:true}).click();
 await expect(page.getByRole('complementary',{name:'Card inspector'})).toBeVisible();
 expect(await page.locator('.surface-reader > p').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
 await page.getByRole('button',{name:'Close reader',exact:true}).click();
 await page.screenshot({path:info.outputPath('selected.png')});
});

test('public table has 35 positions, stable seats, all five targets, and no hand DOM',async({page},info)=>{
 await page.setViewportSize({width:3840,height:2160});await page.goto('/table/?demo=reaction');
 await expect(page.locator('.physical-seat')).toHaveCount(5);await expect(page.locator('.counter-drink')).toHaveCount(35);
 await expect(page.locator('.near-hand,.fan-hit')).toHaveCount(0);await expect(page.locator('.target-number')).toHaveCount(5);
 await expect(page.locator('.action-receipt')).toContainText('5 ingredients chosen');
 const before=await page.locator('.physical-seat').evaluateAll(els=>els.map(el=>({x:(el as HTMLElement).style.getPropertyValue('--sx'),y:(el as HTMLElement).style.getPropertyValue('--sy')})));
 const bounds=await page.locator('.physical-seat').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};}));
 for(let i=0;i<bounds.length;i++)for(let j=i+1;j<bounds.length;j++){const a=bounds[i],b=bounds[j];expect(Math.min(a.right,b.right)>Math.max(a.left,b.left)&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top),'Seat regions must not overlap').toBe(false);}
 await page.screenshot({path:info.outputPath('table.png')});
 await page.getByRole('button',{name:'Seated display',exact:true}).click();
 expect(await page.locator('.physical-seat').evaluateAll(els=>els.map(el=>({x:(el as HTMLElement).style.getPropertyValue('--sx'),y:(el as HTMLElement).style.getPropertyValue('--sy')})))).toEqual(before);
});

test('two-player table uses the display width with large cards and separate seat regions',async({page},info)=>{
 await page.setViewportSize({width:2048,height:1184});await page.goto('/table/?demo=two-player');
 await expect(page.locator('.physical-seat')).toHaveCount(2);
 const seats=await page.locator('.physical-seat').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {width:r.width,top:r.top,bottom:r.bottom};}));
 expect(seats[0].width).toBeGreaterThan(1700);expect(seats[1].bottom).toBeLessThan(seats[0].top);
 const cards=await page.locator('.counter-card').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {width:r.width,top:r.top,bottom:r.bottom,left:r.left,right:r.right};}));
 for(const r of cards){expect(r.width).toBeGreaterThan(170);expect(r.top).toBeGreaterThan(55);expect(r.bottom).toBeLessThan(1120);expect(r.left).toBeGreaterThan(0);expect(r.right).toBeLessThan(2048);}
 await expect(page.locator('.near-hand,.fan-hit')).toHaveCount(0);
 await page.screenshot({path:info.outputPath('table-two-player.png')});
});
