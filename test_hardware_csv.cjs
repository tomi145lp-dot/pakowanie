const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('index.html','utf8'),control={value:'800',addEventListener(){}};
const c={console,TextDecoder,document:{getElementById(){return control},createElement(){return {}}},setTimeout(){},clearTimeout(){}};
vm.createContext(c);vm.runInContext(fs.readFileSync('optimizer.js','utf8'),c);vm.runInContext(html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>')),c);
c.text=new TextDecoder('windows-1250').decode(fs.readFileSync('C:/Users/tomi1/Desktop/1. Szafa WYCENY-ROZKROJ.csv'));
vm.runInContext('parsed=parseCsv(text,{board:650,hdf:800}); parsed.items.filter(item=>/okucia/i.test(item.id)).forEach(item=>rotationChoices.set(item.uid,true)); parsed=parseCsv(text,{board:650,hdf:800}); oldRebuild=rebuildManualPackage;rebuildManualPackage=p=>{try{return oldRebuild(p)}catch(error){console.log(JSON.stringify({base:[p.baseWidth,p.baseDepth],items:p.items.filter(item=>/okucia/i.test(item.id))}));throw error}};',c);
try { const output=vm.runInContext('optimizePackages(parsed.items,40)',c); console.log('OK',output.length); } catch(error) { console.error(error.stack); process.exitCode=1; }
