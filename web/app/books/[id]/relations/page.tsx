"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import api from "../../../../lib/api";
import { ArrowLeft, Plus, Users, Trash2, Edit2, List, Share2, X, Save } from "lucide-react";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

const stringToColor = (str: string) => {
  if (str === '敌对' || str === '仇恨') return '#ef4444';
  if (str === '好友' || str === '盟友') return '#3b82f6';
  if (str === '情侣' || str === '爱慕') return '#ec4899';
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

export default function RelationsPage() {
  const params = useParams(); const router = useRouter(); const bookId = params.id as string;
  const graphRef = useRef<any>(null);
  const [entities, setEntities] = useState<any[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [relType, setRelType] = useState("");
  const [relDesc, setRelDesc] = useState("");

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => {
    const [resEnt, resRel] = await Promise.all([
      api.get(`/entities?bookId=${bookId}&type=character`),
      api.get(`/relationships?bookId=${bookId}`)
    ]);
    setEntities(resEnt.data); setRelationships(resRel.data);
  };

  const graphData = useMemo(() => {
    return {
      nodes: entities.map(e => ({ id: e.id, name: e.name, val: 1 })),
      links: relationships.map(r => ({
        id: r.id, source: r.source.id, target: r.target.id, name: r.type, desc: r.label, color: stringToColor(r.type)
      }))
    };
  }, [entities, relationships]);

  const openCreate = () => { setEditingId(null); setSourceId(""); setTargetId(""); setRelType(""); setRelDesc(""); setShowModal(true); };
  const openEdit = (rel: any) => { setEditingId(rel.id); setSourceId(rel.source.id || rel.source); setTargetId(rel.target.id || rel.target); setRelType(rel.type); setRelDesc(rel.label); setShowModal(true); };
  const handleSubmit = async () => {
    if (!sourceId || !targetId || sourceId === targetId) return alert("请选择两个不同的人物");
    try { await api.post('/relationships', { bookId, sourceId, targetId, relationType: relType, description: relDesc }); setShowModal(false); fetchData(); } catch (e) { alert("操作失败"); }
  };
  const handleDelete = async (id: string) => { if (confirm("确定删除这条关系吗？")) { await api.delete(`/relationships/${id}`); fetchData(); } };

  return (
    <div className="h-screen bg-gray-50 flex flex-col relative overflow-hidden font-sans">
      <div className="bg-white border-b px-6 py-3 flex justify-between items-center shadow-sm z-20">
        <div className="flex items-center gap-4"><button onClick={() => router.push(`/books/${bookId}`)} className="text-gray-500 hover:text-black"><ArrowLeft /></button><h1 className="text-lg font-bold flex items-center gap-2"><Users className="text-purple-600"/> 人物关系网</h1></div>
        <div className="flex bg-gray-100 p-1 rounded-lg"><button onClick={() => setViewMode('graph')} className={`px-4 py-1.5 rounded text-sm flex gap-2 ${viewMode === 'graph' ? 'bg-white shadow text-purple-600 font-bold' : 'text-gray-500'}`}><Share2 size={16}/> 图谱视图</button><button onClick={() => setViewMode('list')} className={`px-4 py-1.5 rounded text-sm flex gap-2 ${viewMode === 'list' ? 'bg-white shadow text-purple-600 font-bold' : 'text-gray-500'}`}><List size={16}/> 列表管理</button></div>
        <button onClick={openCreate} className="bg-purple-600 text-white px-4 py-2 rounded text-sm flex items-center gap-2 hover:bg-purple-700 shadow-sm"><Plus size={16}/> 新建关系</button>
      </div>
      <div className="flex-1 bg-slate-50 relative overflow-hidden">
        {viewMode === 'graph' && (<div className="h-full w-full cursor-move"><ForceGraph2D ref={graphRef} graphData={graphData} nodeLabel="name" nodeColor={() => "#60a5fa"} linkColor="color" linkWidth={2} linkDirectionalArrowLength={4} linkDirectionalArrowRelPos={1} linkCurvature={0.2} onLinkClick={(link) => openEdit({ id: link.id, source: link.source, target: link.target, type: link.name, label: (link as any).desc })} nodeCanvasObject={(node: any, ctx, globalScale) => { const label = node.name; const fontSize = 14/globalScale; ctx.font = `${fontSize}px Sans-Serif`; ctx.beginPath(); ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false); ctx.fillStyle = node.color || '#3b82f6'; ctx.fill(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#1e293b'; ctx.fillText(label, node.x, node.y + 10); }} /></div>)}
        {viewMode === 'list' && (<div className="h-full overflow-y-auto p-8 max-w-5xl mx-auto"><div className="bg-white rounded-lg shadow border overflow-hidden"><table className="w-full text-sm text-left"><thead className="bg-gray-50 border-b text-gray-500 font-medium"><tr><th className="px-6 py-3">主动方</th><th className="px-6 py-3">关系类型</th><th className="px-6 py-3">被动方</th><th className="px-6 py-3">详细描述</th><th className="px-6 py-3 text-right">操作</th></tr></thead><tbody className="divide-y">{relationships.map(rel => (<tr key={rel.id} className="hover:bg-gray-50"><td className="px-6 py-4 font-bold text-gray-800">{rel.source.name}</td><td className="px-6 py-4"><span className="px-2 py-1 rounded text-xs text-white" style={{ backgroundColor: stringToColor(rel.type) }}>{rel.type}</span></td><td className="px-6 py-4 font-bold text-gray-800">{rel.target.name}</td><td className="px-6 py-4 text-gray-500">{rel.label || '-'}</td><td className="px-6 py-4 text-right flex justify-end gap-2"><button onClick={() => openEdit(rel)} className="text-blue-500 hover:text-blue-700"><Edit2 size={16}/></button><button onClick={() => handleDelete(rel.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button></td></tr>))}</tbody></table></div></div>)}
      </div>
      {showModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"><div className="bg-white p-6 rounded-lg w-96 shadow-xl relative"><h3 className="font-bold mb-4 text-lg">{editingId ? '修改关系' : '新建关系'}</h3><div className="space-y-4"><div className="grid grid-cols-2 gap-2"><div><label className="text-xs text-gray-500 mb-1 block">主动方</label><select className="border p-2 w-full rounded bg-white" value={sourceId} onChange={e=>setSourceId(e.target.value)} disabled={!!editingId}><option value="">选择...</option>{entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div><div><label className="text-xs text-gray-500 mb-1 block">被动方</label><select className="border p-2 w-full rounded bg-white" value={targetId} onChange={e=>setTargetId(e.target.value)} disabled={!!editingId}><option value="">选择...</option>{entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div></div><div><label className="text-xs text-gray-500 mb-1 block">关系类型</label><input list="relationTypes" className="border p-2 w-full rounded focus:ring-2 focus:ring-purple-500 outline-none" placeholder="例如：师徒" value={relType} onChange={e=>setRelType(e.target.value)}/><datalist id="relationTypes"><option value="好友"/><option value="敌对"/><option value="情侣"/><option value="师徒"/><option value="盟友"/></datalist></div><div><label className="text-xs text-gray-500 mb-1 block">详细描述</label><textarea className="border p-2 w-full rounded h-20 focus:ring-2 focus:ring-purple-500 outline-none resize-none" placeholder="例如：因争夺异火结怨" value={relDesc} onChange={e=>setRelDesc(e.target.value)}/></div></div><div className="mt-6 pt-4 border-t flex justify-end gap-2">{editingId && <button onClick={() => {handleDelete(editingId); setShowModal(false)}} className="text-red-500 text-sm mr-auto hover:underline">删除此关系</button>}<button onClick={()=>setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">取消</button><button onClick={handleSubmit} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2"><Save size={16}/> 保存</button></div></div></div>)}
    </div>
  );
}
