import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const cache=new Map();
function moduleUrl(file){
 const full=path.resolve(file);if(cache.has(full))return cache.get(full);
 let code=ts.transpileModule(fs.readFileSync(full,'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
 code=code.replace(/(from\s*)['"]([^'"]+)['"]/g,(match,prefix,target)=>target.startsWith('.')?prefix+JSON.stringify(moduleUrl(path.resolve(path.dirname(full),target+'.ts'))):match);
 const url='data:text/javascript;base64,'+Buffer.from(code).toString('base64');cache.set(full,url);return url;
}
export const loadDiscovery=name=>import(moduleUrl('src/app/discovery/'+name+'.ts'));
