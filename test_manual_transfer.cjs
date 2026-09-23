const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('index.html','utf8');
const c={document:{getElementById:()=>({value:800,addEventListener(){}})},console};vm.createContext(c);
vm.runInContext(html.slice(html.indexOf('  <script>')+10,html.lastIndexOf('</script>')),c);
vm.runInContext('render=()=>{};show=()=>{};',c);
const item=(id,w,d)=>({id,width:w,depth:d,height:16,weight:1,x:0,y:0,z:0,layer:1});
function setup(limit=40){c.data={packages:[{id:1,baseWidth:800,baseDepth:580,innerHeight:16,maxWeight:40,items:[item('wide',800,580)],fillers:[]},{id:2,baseWidth:1790,baseDepth:507,innerHeight:16,maxWeight:limit,items:[item('base',1790,507)],fillers:[]} ]};vm.runInContext('result=data;',c);}
setup();vm.runInContext('transferWithCartonResize(result.packages[0],result.packages[0].items[0],"2")',c);
let p=vm.runInContext('result.packages[0]',c);assert.equal(p.baseDepth,580);assert.equal(p.baseWidth,1790);assert.equal(p.items.length,2);c.validate(p);assert(p.fillers.length>0);
assert.deepEqual(vm.runInContext('result.packages.map(p=>p.id)',c),[1]);
setup(.1);const before=JSON.stringify(c.data);assert.throws(()=>vm.runInContext('transferWithCartonResize(result.packages[0],result.packages[0].items[0],"2")',c));assert.equal(JSON.stringify(c.data),before);
setup();vm.runInContext('transferWithCartonResize(result.packages[0],result.packages[0].items[0],"new")',c);assert.equal(vm.runInContext('result.items.length',c),2);
console.log('Transfer: resized carton, fillers, collision check, new package and rollback OK.');
