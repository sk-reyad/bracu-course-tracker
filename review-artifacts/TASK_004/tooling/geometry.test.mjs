import{test}from'node:test';import assert from'node:assert/strict';import{circleRect,circleCircle,directSquare,radiiFor,assess}from'./geometry.mjs';
function target(width,height,radius='0px',x=0,y=0){return{id:'fixture',name:'test control',rect:{x,y,width,height},clip:{x:-1000,y:-1000,width:3000,height:3000},radius:[radius,radius,radius,radius],axisAligned:true,complexShape:false}}
const hits={center:true,square:{samples:676,misses:[]}};
test('rectangular 24px square directly contains the minimum square',()=>assert.equal(directSquare(target(24,24)).contains,true));
test('13px line-height rectangle cannot contain a 24px square',()=>assert.equal(directSquare(target(49,13)).contains,false));
test('24px diameter circle has adequate bounding dimensions but cannot fit the square',()=>assert.equal(directSquare(target(24,24,'50%')).contains,false));
test('wide 64.6x26px full-badge capsule can fit a solid 24px square',()=>assert.equal(directSquare(target(64.578125,26,'999px')).contains,true));
test('rounded caps of narrow pill can invalidate a height-only check',()=>{assert.equal(directSquare(target(46,24,'999px')).contains,false);assert.equal(directSquare(target(48,24,'999px')).contains,true)});
test('radius normalization follows CSS edge sums, retaining nonzero mixed corners',()=>{assert.deepEqual(radiiFor({width:64,height:26},['999px','999px','999px','999px']),[[13,13],[13,13],[13,13],[13,13]]);assert.deepEqual(radiiFor({width:40,height:40},['0px','9px','0px','9px']),[[0,0],[9,9],[0,0],[9,9]])});
test('circle-to-target uses nearest target edge, not center-to-center alone',()=>{const circle={x:24,y:6.5,radius:12},large={x:30,y:-50,width:200,height:200};assert.equal(circleRect(circle,large).clearance,-6);assert(Math.hypot(24-130,6.5-50)>24)});
test('positive clearance demonstrates separated circle and peer target',()=>assert.equal(circleRect({x:10,y:10,radius:12},{x:30,y:0,width:20,height:20}).clearance,8));
test('diagonal nearest point uses Euclidean circle-to-rectangle distance',()=>assert.equal(circleRect({x:0,y:0,radius:12},{x:15,y:20,width:30,height:30}).clearance,13));
test('undersized peers require separate circle-to-circle comparison',()=>{assert.equal(circleCircle({x:10,y:10,radius:12},{x:34,y:10,radius:12}),0);assert.equal(circleCircle({x:10,y:10,radius:12},{x:30,y:10,radius:12}),-4)});
test('isolated undersized target qualifies through spacing, not direct size',()=>assert.equal(assess(target(49,13),[],hits).classification,'PASS — Spacing exception'));
test('rectangle intersection alone does not create an unsupported FAIL',()=>{const neighbor={...target(200,100,'30px',30,-50),id:'other'};assert.match(assess(target(49,13),[neighbor],hits).classification,/INCONCLUSIVE/)});
test('clipped or obscured 24px target cannot get a direct PASS from CSS size alone',()=>{const clipped=target(48,24);clipped.clip={x:0,y:0,width:48,height:20};assert.equal(directSquare(clipped).contains,false);assert.match(assess(target(48,24),[],{...hits,square:{samples:676,misses:[{x:12,y:0}]}}).classification,/INCONCLUSIVE/)});
test('unknown mask or nontranslation transform remains inconclusive',()=>{assert.equal(directSquare({...target(48,24),complexShape:true}).modelSupported,false);assert.match(assess({...target(48,24),axisAligned:false},[],hits).classification,/INCONCLUSIVE/)});
