import {test,expect,type Page} from '@playwright/test';
test.use({hasTouch:true,isMobile:true,viewport:{width:393,height:852}});
async function open(page:Page){await page.goto('/hand/?demo');await expect(page.locator('.hand-fan')).toBeVisible();}
async function point(page:Page,selector:string){const r=await page.locator(selector).boundingBox();expect(r).toBeTruthy();return {x:r!.x+r!.width/2,y:r!.y+r!.height/2};}
async function touch(page:Page){
 const cdp=await page.context().newCDPSession(page);
 return async(type:'touchStart'|'touchMove'|'touchEnd'|'touchCancel',p?:{x:number;y:number})=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:p?[{...p,id:1}]:[]});
}
test('touch drag onto either face-up drink commits once, with inline Boba bonus and undo',async({page})=>{
 await open(page);const send=await touch(page);
 const from=await point(page,'.fan-hit:first-child'),to=await point(page,'.counter-drink.face-up:first-child');
 await send('touchStart',from);await send('touchMove',{x:from.x,y:from.y-30});
 await expect(page.locator('.drag-card')).toBeVisible();
 await send('touchMove',to);await send('touchEnd');
 await expect(page.locator('.drag-card')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Boba in Peach Please drink 1',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'+1 play',exact:true}).tap();
 await expect(page.getByRole('button',{name:'Boba in Peach Please drink 1',exact:true})).toHaveCount(1);
 await expect(page.locator('.surface-rail')).toContainText('3 plays left');
 expect(await page.evaluate(()=>({x:scrollX,y:scrollY}))).toEqual({x:0,y:0});
 await page.getByRole('button',{name:'↶ Undo',exact:true}).tap();
 await expect(page.getByRole('button',{name:'Select Boba',exact:true})).toBeVisible();
 // The right-hand drink is also a live drop target: protect it with Straw.
 const straw=await point(page,'.fan-hit:nth-child(2)'),right=await point(page,'.counter-drink.face-up:nth-child(2)');
 await send('touchStart',straw);await send('touchMove',{x:straw.x,y:straw.y-30});await send('touchMove',right);await send('touchEnd');
 await expect(page.locator('.counter-drink:nth-child(2)').getByRole('button',{name:'Inspect Straw',exact:true})).toBeVisible();
 await expect(page.locator('.game-error')).toHaveCount(0);
});
test('long press zooms without playing; cancelled and invalid drags do not play',async({page})=>{
 await open(page);const send=await touch(page),from=await point(page,'.fan-hit:first-child');
 await send('touchStart',from);await expect(page.getByRole('complementary',{name:'Card inspector'})).toBeVisible();await send('touchEnd');
 const face=await page.locator('.card-zoom .reader-face').boundingBox();expect(face!.width).toBeGreaterThan(260);
 await expect(page.locator('.hand-meta')).toContainText('7');
 await page.getByRole('button',{name:'Close reader',exact:true}).tap();
 await send('touchStart',from);await send('touchMove',{x:from.x,y:from.y-40});await send('touchCancel');
 await expect(page.locator('.drag-card')).toHaveCount(0);await expect(page.locator('.hand-meta')).toContainText('7');
 await send('touchStart',from);await send('touchMove',{x:190,y:40});await send('touchEnd');
 await expect(page.locator('.hand-meta')).toContainText('7');await expect(page.getByRole('button',{name:'↶ Undo',exact:true})).toBeDisabled();
 await expect(page.locator('.fan-label,[role=tooltip]')).toHaveCount(0);
});
test('swiping the counter browses two face-up drinks without scrolling or playing',async({page})=>{
 await open(page);const send=await touch(page);
 await expect(page.locator('.counter-drink.face-up')).toHaveCount(2);
 await send('touchStart',{x:270,y:470});await send('touchMove',{x:140,y:470});await send('touchEnd');
 await expect(page.getByRole('button',{name:'View drink 2, complete',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.counter-drink.face-up')).toHaveCount(2);
 await page.getByRole('button',{name:'View drink 7',exact:true}).tap();
 await expect(page.locator('.counter-drink.face-up')).toHaveCount(2);
 await expect(page.getByRole('button',{name:'Peach Please drink 7 empty slot',exact:true})).toBeInViewport();
 expect(await page.evaluate(()=>document.documentElement.scrollHeight)).toBe(852);
 await expect(page.locator('.hand-meta')).toContainText('7');
});
