'use strict';
// Contract checks for actual functions used by the shipped 3D bowling game.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'..','bowling.html'),'utf8');
function extract(name){
 const start=src.indexOf('function '+name+'(');
 assert(start>=0,'Missing game function: '+name);
 const brace=src.indexOf('{',start);let depth=0;
 for(let i=brace;i<src.length;i++){
  if(src[i]==='{')depth++;
  if(src[i]==='}'&&--depth===0)return src.slice(start,i+1);
 }
 throw Error('Unbalanced function: '+name);
}
const logic=['frameComplete','allRollValuesFrom','scores','rollMarks'].map(extract).join('\n');
function game(rolls){assert.equal(rolls.length,10);const frames=rolls.map(r=>({rolls:r}));return vm.runInNewContext('const frames=input;'+logic+';scores();',{input:frames})}
function check(name,rolls,total){
 const scores=game(rolls);
 assert.equal(scores[9],total,name+' final score');
 for(const x of scores)if(x!==undefined)assert.ok(Number.isFinite(x),'score must be a number');
 console.log('PASS '+name+' · '+total)
}
const zeros=()=>Array.from({length:10},()=>[0,0]);
check('gutter game',zeros(),0);
check('open frame 4 + 5',Array.from({length:10},()=>[4,5]),90);
check('all spares 5 + 5',Array.from({length:9},()=>[5,5]).concat([[5,5,5]]),150);
check('perfect 300',Array.from({length:9},()=>[10]).concat([[10,10,10]]),300);
const s1=zeros();s1[0]=[10];s1[1]=[3,4];
check('strike + 3/4 + zeros',s1,24);
const s2=zeros();s2[0]=[10];s2[1]=[10];s2[2]=[3,4];
check('consecutive strikes',s2,47);
const s3=zeros();s3[9]=[10,0,10];
check('tenth-frame fill balls',s3,20);
const script=(src.match(/<script type="module">([\s\S]*?)<\/script>/)||[])[1];
assert(script,'3D game module missing');
assert(script.includes("mode==='challenge'"),'Strike Rush gameplay mode missing');
assert(script.includes('challengeBest'),'Strike Rush saved high score missing');
assert(script.includes("setAlleyTheme"),'3D alley customization missing');
console.log('PASS 3D Bowling gameplay features and 7 scoring contracts');
