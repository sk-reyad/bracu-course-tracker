// Run with NODE_PATH pointing to Playwright and a local server on DEGREE_PLAN_URL.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const url=process.env.DEGREE_PLAN_URL || 'http://127.0.0.1:4176/index.html?preview=1';
const options={executablePath:process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true};
async function open(page){
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('#openSettingsBtn').click();
  await page.getByRole('button',{name:'Degree Plan',exact:true}).click();
  await page.locator('#degreePlanEditor.active').waitFor();
}
async function fixture(page,codes){
  await page.evaluate(codes=>{
    const sample=BracuPreview.createSanitizedState();
    sample.courses=BracuDegreePlanData.mergeCourses(sample.courses);
    sample.semesters=[{number:1,courses:codes.map((code,i)=>({id:`test-${i}`,code,status:'completed',grade:'A'}))}];
    BracuDegreePlanView.render(document.querySelector('#degreePlanEditor'),sample);
  },codes);
}
(async()=>{
  const browser=await chromium.launch(options);
  try {
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await open(page);
    assert.equal(await page.locator('[data-degree-completed]').innerText(),'42');
    assert.match(await page.locator('.dp-stats').innerText(),/3\.35/);
    assert.equal(await page.locator('#settingsModal .tab-btn').count(),5);
    assert.equal(await page.locator('.dp-source-links a').count(),2);
    assert.equal(await page.locator('.dp-source-links .dp-contact-link').count(),0);
    assert(!(await page.locator('.dp-sources').innerText()).includes('↗'));
    for(const width of [1440,736,390,360]){
      await page.setViewportSize({width,height:1000});
      const gaps=await page.locator('.dp-section-head .dp-progress-pill').evaluateAll(nodes=>nodes.map(node=>{
        const range=document.createRange();range.selectNodeContents(node);
        const text=range.getBoundingClientRect(),pill=node.getBoundingClientRect();
        return Math.min(text.left-pill.left,pill.right-text.right);
      }));
      assert(gaps.every(gap=>gap>=17),`pill text padding at ${width}: ${gaps}`);
      const footer=await page.locator('.dp-sources').boundingBox(),contact=await page.locator('.dp-contact-link').boundingBox();
      assert(Math.abs(footer.x+footer.width-contact.x-contact.width-21)<1,'contact follows 20px footer padding + border');
      assert(Math.abs(footer.y+footer.height-contact.y-contact.height-21)<1,'contact belongs at footer bottom');
    }
    await page.setViewportSize({width:1440,height:1000});
    const toggle=page.locator('.dp-page-nav-toggle'),nav=page.locator('.dp-page-nav'),list=page.locator('.dp-page-nav-list');
    const center=await toggle.boundingBox();
    const icon=await toggle.locator('span').boundingBox();
    assert(Math.abs(icon.y+icon.height/2-(center.y+center.height/2))<1);
    await toggle.hover();await page.waitForTimeout(850);
    assert.equal(await toggle.getAttribute('aria-expanded'),'true');
    assert.equal(await list.evaluate(node=>getComputedStyle(node).transitionDuration.split(',')[0]),'0.8s');
    const after=await toggle.locator('span').boundingBox();
    assert(Math.abs(after.y-icon.y)<1,'Arrow must not move on hover');
    await toggle.click();assert.equal(await toggle.getAttribute('aria-expanded'),'false');
    await page.waitForTimeout(850);assert(await list.evaluate(node=>node.inert));
    await page.mouse.move(600,200);await toggle.hover();await page.waitForTimeout(850);
    await list.getByRole('link',{name:'Program Elective',exact:true}).click();
    await page.waitForTimeout(900);
    assert.equal(await toggle.getAttribute('aria-expanded'),'false');
    assert(await page.locator('#program-elective > summary').evaluate(node=>node===document.activeElement));
    await toggle.focus();await page.keyboard.press('Enter');assert.equal(await toggle.getAttribute('aria-expanded'),'true');
    await page.keyboard.press('Escape');assert.equal(await toggle.getAttribute('aria-expanded'),'false');
    assert.equal(await page.locator('#settingsModal').getAttribute('hidden'),null);
    await fixture(page,['BNG103','HUM103','HUM101','ENG113','CST301','BUS334','CST201']);
    assert.equal(await page.locator('#stream-3 [data-block="minimum"] tbody tr').first().getAttribute('data-course-code'),'HUM101');
    assert.equal(await page.locator('#stream-5 [data-block="minimum"] tbody tr').first().getAttribute('data-course-code'),'CST301');
    assert(await page.locator('#stream-3').evaluate(node=>Boolean(node.querySelector('[data-group="minimum"]').compareDocumentPosition(node.querySelector('[data-group="extra"]')) & 4)));
    await fixture(page,[]);assert.equal(await page.locator('#gened-electives tbody tr').count(),3);
    for(const width of [1440,980,800,736,620,390,360]){
      await page.setViewportSize({width,height:1000});
      await page.locator('#settingsModal').evaluate(node=>node.scrollTop=0);
      assert(await page.locator('#settingsModal').evaluate(node=>node.scrollWidth<=node.clientWidth+1),`modal overflow at ${width}`);
      const pills=await page.locator('#degreePlanEditor .dp-section-head .dp-progress-pill,#degreePlanEditor .dp-section-head .dp-status-pill').evaluateAll(nodes=>nodes.map(node=>({x:node.getBoundingClientRect().right,h:node.getBoundingClientRect().height})));
      assert(Math.max(...pills.map(p=>p.x))-Math.min(...pills.map(p=>p.x))<2,`pill edges at ${width}: ${JSON.stringify(pills)}`);
      assert(pills.every(p=>Math.abs(p.h-34)<1));
      if([1440,736,360].includes(width))await page.screenshot({path:`tmp/degree-plan-integrated-${width}.png`});
    }
    await page.setViewportSize({width:1440,height:1000});
    await page.locator('#settingsModal').evaluate(node=>node.scrollTop=0);
    await page.getByRole('button',{name:'Grade Scale',exact:true}).click();
    assert.equal(await nav.isVisible(),false);
    await page.getByRole('button',{name:'Degree Plan',exact:true}).click();
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await list.evaluate(node=>getComputedStyle(node).transitionProperty),'opacity');
    assert.deepEqual(errors,[]);
    const touch=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    await open(touch);
    const touchToggle=touch.locator('.dp-page-nav-toggle');
    await touchToggle.tap();assert.equal(await touchToggle.getAttribute('aria-expanded'),'true');
    await touchToggle.tap();assert.equal(await touchToggle.getAttribute('aria-expanded'),'false');
    await touch.close();
    console.log('PASS: integrated Degree Plan data, minima/extras, placeholders, hover/click/keyboard/touch, 800ms motion, 7 responsive widths, pill alignment, tab lifecycle, reduced motion.');
  } finally {await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
