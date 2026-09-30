import test from 'node:test';
import assert from 'node:assert/strict';
import {WheelNavigator,nearestTimelineIndex} from '../../navigation.mjs';
test('gentle scroll advances once, vigorous scroll advances proportionally without a cooldown',()=>{
 const wheel=new WheelNavigator(); wheel.setIndex(0,30);
 assert.equal(wheel.consume(30,0),0); assert.equal(wheel.consume(30,16),0); assert.equal(wheel.consume(30,32),1);
 assert.equal(wheel.consume(450,48),6); assert.equal(wheel.consume(180,64),8);
 assert.equal(wheel.consume(-270,80),5); assert.equal(wheel.consume(-9000,96),0); assert.equal(wheel.consume(9000,112),29);
});
test('continuous timeline hit areas keep a target in the visual gaps',()=>{
 const rows=Array.from({length:5},(_,i)=>({top:100+i*18,height:18}));
 for(let y=100;y<190;y++) assert.ok(nearestTimelineIndex(y,rows)>=0);
 assert.equal(nearestTimelineIndex(117,rows),0); assert.equal(nearestTimelineIndex(119,rows),1);
 assert.equal(nearestTimelineIndex(135,rows),1); assert.equal(nearestTimelineIndex(137,rows),2);
});
