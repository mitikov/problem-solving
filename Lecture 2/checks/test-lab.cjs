// Run from any directory: node "Lecture 2/checks/test-lab.cjs"
// Built-in Node.js modules only. This checks models, not students' free-text answers.
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {test}=require('node:test');
const html=readFileSync(join(__dirname,'..','lab.html'),'utf8');
const coreScript=html.match(/<script id="lab-core">([\s\S]*?)<\/script>/)[1];
const context=vm.createContext({});vm.runInContext(coreScript,context);
const C=context.LabCore;
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);

test('polling: processing time consumes the delay budget',()=>{
 for(const [D,T,f,count] of [[1,.8,1.25,4500],[5,4.8,1/4.8,750]]){
  const r=C.polling(T,D,.1);assert.equal(r.pass,true);near(r.bound,D);near(r.frequency,f);near(r.polls,count);
  assert.equal(C.polling(T+.1,D,.1).pass,false);
 }
});
test('polling: a favorable phase cannot establish the universal guarantee',()=>{
 const early=C.polling(2,1,.1),late=C.polling(2,1,.99);
 assert.ok(late.observed<1);assert.ok(early.observed>late.observed);
 near(early.bound,late.bound);assert.equal(late.pass,false);
 for(const args of [[0,1,.1],[1,1,0],[1,1,1],[NaN,1,.1],[1,1,.1,-1]])assert.throws(()=>C.polling(...args));
});
test('budget: an exact boundary is allowed, hard requirements cannot be traded',()=>{
 const all=C.budget(800,true,true,true);assert.equal(all.cost,600);assert.equal(all.pass,true);
 assert.equal(C.budget(500,true,true,true).pass,false);
 assert.equal(C.budget(500,true,true,false).cost,500);assert.equal(C.budget(500,true,true,false).pass,true);
 assert.equal(C.budget(500,true,false,true).cost,480);assert.equal(C.budget(500,true,false,true).pass,true);
 for(const fast of [false,true])for(const door of [false,true]){
  assert.equal(C.budget(800,false,fast,door).pass,false);
  assert.equal(C.budget(350,true,fast,door).pass,false);
 }
});
test('input domain: boundaries, fractions and invalid data',()=>{
 for(const s of ['0','40','84','85','100','84,5','8.5e1'])assert.equal(C.parse(s).valid,true,s);
 for(const s of ['','None','NaN','Infinity','-Infinity','-1','101','true','false','текст','"40"','0x55','1e999','1,2,3']){
  assert.equal(C.parse(s).valid,false,s);assert.equal(C.oracle(s),'НЕВІДОМО',s);
 }
 assert.equal(C.oracle('84'),'Є МІСЦЕ');assert.equal(C.oracle('85'),'ПОВНИЙ');
});
test('test bench: independent expectation, state and time checks',()=>{
 assert.equal(C.test('A','40','Є МІСЦЕ').pass,true);
 assert.equal(C.test('A','85','ПОВНИЙ').statePass,false);
 assert.equal(C.test('B','None','НЕВІДОМО').statePass,false);
 const late=C.test('C','40','Є МІСЦЕ');assert.equal(late.statePass,true);assert.equal(late.timePass,false);
 const wrongExpectation=C.test('D','85','Є МІСЦЕ');assert.equal(wrongExpectation.expectationCorrect,false);assert.equal(wrongExpectation.pass,true);
 for(const s of ['40','84','85','86','None','-1','101','NaN'])assert.equal(C.test('D',s,C.oracle(s)).pass,true);
});
test('changing the specification does not silently update prototypes',()=>{
 assert.equal(C.oracle('86',90),'Є МІСЦЕ');assert.equal(C.prototype('D','86').status,'ПОВНИЙ');
 assert.equal(C.test('D','86','Є МІСЦЕ',90).statePass,false);
 assert.equal(C.test('D','90','ПОВНИЙ',90).pass,true);
});
test('trainer is a self-contained offline file',()=>{
 assert.ok(!/<script[^>]+src=/.test(html));assert.ok(!/<link[^>]+href=/.test(html));
 assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket/.test(html));
 for(const id of ['stage0','stage1','stage2','stage3','exportMd','exportJson','importFile'])assert.ok(html.includes(`id="${id}"`));
});
