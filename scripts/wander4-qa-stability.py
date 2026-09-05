from pathlib import Path
p=Path('scripts/wander4-qa.py');q=p.read_text()
a=q.index('def images(page):');b=q.index('def overflow(page',a)
q=q[:a]+'''def images(page):
 page.wait_for_function("""()=>{const photos=Array.from(document.querySelectorAll('img[data-thumb]'));photos.forEach(x=>x.loading='eager');return photos.length>0&&photos.every(x=>x.complete&&x.naturalWidth>0)}""",timeout=45000)
 check(page.locator('.error-photo').count()==0,'No missing landmark photos')
'''+q[b:]
q=q.replace('page.wait_for_function("window.Wander?.version===\'4.0.0\'",timeout=45000);images(page);overflow(page,\'home390\')', 'page.wait_for_function("window.Wander?.version===\'4.0.0\'",timeout=45000);ok("Application initialized");images(page);overflow(page,\'home390\')')
old="report['success']=False;report['failure']=str(e);print('FAIL',e,flush=True)"
new="""report['success']=False;report['failure']=str(e);print('FAIL',e,flush=True)
 try:
  report['browser_errors']=errors
  report['failed_images']=page.evaluate("Array.from(document.querySelectorAll('img[data-thumb]')).filter(x=>!x.complete||!x.naturalWidth).map(x=>({src:x.src,complete:x.complete,width:x.naturalWidth}))")
  report['body_tail']=page.locator('body').inner_text()[-3000:]
  page.screenshot(path=str(OUT/'failure.png'),full_page=True)
 except Exception as diagnostic_error:report['diagnostic_error']=str(diagnostic_error)
"""
q=q.replace(old,new)
p.write_text(q)
