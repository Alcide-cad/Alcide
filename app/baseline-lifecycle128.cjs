// Only newly managed, unpinned session baselines can be removed.
const fs = require('fs');
const path = require('path');
module.exports = function baselineLifecycle(root) {
 const base = path.resolve(root);
 function folder(source) {
  const dir = path.dirname(path.resolve(source));
  return path.dirname(dir) === base ? dir : null;
 }
 function mark(source) {
  const dir = folder(source);
  if (dir) fs.writeFileSync(path.join(dir, '.alcide-session.json'), JSON.stringify({pinned:false}));
 }
 function pin(source) {
  const dir = folder(source);
  if (dir && fs.existsSync(path.join(dir, '.alcide-session.json')))
   fs.writeFileSync(path.join(dir, '.alcide-session.json'), JSON.stringify({pinned:true}));
 }
 function release(source) {
  if (!source) return;
  const dir = folder(source);
  if (!dir) return;
  try {
   const metadata = JSON.parse(fs.readFileSync(path.join(dir, '.alcide-session.json'), 'utf8'));
   if (metadata.pinned === false) fs.rmSync(dir, {recursive:true, force:true});
  } catch (error) { console.warn('Session baseline retained:', error.message); }
 }
 return {mark, pin, release};
};
