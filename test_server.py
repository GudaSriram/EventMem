import unittest, tempfile, json
from pathlib import Path
from unittest.mock import patch
import server
class GroundingTests(unittest.TestCase):
 def test_similarity_and_chunks(self):
  self.assertEqual(server.cosine([1,0],[0,1]),0)
  self.assertEqual(server.cosine([1,0],[1,0]),1)
  self.assertEqual(server.cosine([],[]),0)
  self.assertEqual(server.chunks('x'*3000)[-1][-30:],'x'*30)
 def test_validation(self):
  with self.assertRaises(ValueError):server.validate_notes([{'id':'a'}])
  with self.assertRaises(ValueError):server.segments_valid({'segments':[{'text':'x','at':'wrong'}]})
 def test_vector_index_idempotence_and_removal(self):
  with tempfile.TemporaryDirectory() as d,patch.object(server,'DB_PATH',Path(d)/'v.sqlite'),patch.object(server,'embeddings',side_effect=lambda texts:[[1,0] for _ in texts]) as embed:
   notes=[{'id':'a','title':'Actual source','text':'agent tool permissions','date':'2026-10-11'}]
   first=server.index_notes(notes);second=server.index_notes(notes)
   self.assertEqual(embed.call_count,1)
   self.assertEqual(first[0]['sourceId'],'a')
   self.assertEqual(second[0]['date'],'2026-10-11')
   server.index_notes([])
   with server.database() as conn:self.assertEqual(conn.execute('select count(*) from vectors').fetchone()[0],0)
 def test_invented_connection_source_rejected(self):
  candidates=[{'sourceId':'actual','title':'Actual note','date':'2026-10-11','text':'agents','vector':[1,0]}]
  topics=[{'title':'Agents','text':'Agents','segments':[{'at':30,'text':'Agents'}]}]
  with patch.object(server,'index_notes',return_value=candidates),patch.object(server,'extract_topics',return_value=topics),patch.object(server,'retrieve',return_value=candidates),patch.object(server,'model_json',return_value={'relevant':True,'message':'fabricated','source_indices':[999]}):
   result=server.connections({'segments':[{'at':30,'text':'Agents'}],'notes':[]})['connections'][0]
   self.assertEqual(result['sources'],[])
   self.assertEqual(result['message'],'No relevant memory found.')
 def test_bad_citations_and_unsupported_claims_omitted(self):
  with patch.object(server,'index_notes',return_value=[]),patch.object(server,'embeddings',return_value=[[1,0]]),patch.object(server,'retrieve',return_value=[]),patch.object(server,'model_json',return_value={'sections':[{'heading':'Answer','items':[{'text':'Invented answer','evidence_ids':['M999']},{'text':'Unsupported assertion','evidence_ids':[]}]}]}):
   result=server.evidence_answer({'segments':[{'text':'Agents','at':0}],'notes':[],'question':'Agents?'})
   self.assertNotIn('Invented',result['text']);self.assertIn('Insufficient',result['text'])
if __name__=='__main__':unittest.main()

class HTTPTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  import threading
  from http.server import ThreadingHTTPServer
  cls.http=ThreadingHTTPServer(('127.0.0.1',0),server.Handler)
  cls.thread=threading.Thread(target=cls.http.serve_forever,daemon=True);cls.thread.start()
 @classmethod
 def tearDownClass(cls):cls.http.shutdown();cls.http.server_close()
 def get(self,path='/',headers=None):
  import urllib.request
  return urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:%s%s'%(self.http.server_port,path),headers=headers or {'Host':'localhost:8765'}))
 def test_health_and_static_assets(self):
  with self.get('/api/health') as r:self.assertTrue(json.load(r)['available'])
  with self.get('/manifest.webmanifest') as r:self.assertEqual(json.load(r)['name'],'EventMemory')
  with self.get('/app.js') as r:self.assertEqual(r.status,200)
 def test_host_and_origin_rejected(self):
  import urllib.error
  with self.assertRaises(urllib.error.HTTPError) as cm:self.get('/api/health',{'Host':'evil.example'})
  self.assertEqual(cm.exception.code,403)
  with self.assertRaises(urllib.error.HTTPError) as cm:self.get('/api/health',{'Host':'localhost:8765','Origin':'https://evil.example'})
  self.assertEqual(cm.exception.code,403)
