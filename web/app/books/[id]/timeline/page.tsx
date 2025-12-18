"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../../lib/api";
import { ArrowLeft, Plus, Clock, Trash2, Flag, Edit2, Layers, GitCommit, User, X } from "lucide-react";

// ✅ 修复：在 Entity 接口中添加 type 字段
interface Entity { 
  id: string; 
  name: string; 
  avatar_url?: string; 
  type: string; // <--- 补上这一行
}

interface Era { id: string; name: string; start_absolute_tick: string; }

interface TimelineEvent {
  id: string; title: string; description: string; year_in_era: number;
  eras?: Era; absolute_tick: string;
  event_participants: { entities: Entity }[];
}

const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

export default function TimelinePage() {
  const params = useParams(); const router = useRouter(); const bookId = params.id as string;
  const [eras, setEras] = useState<Era[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [viewMode, setViewMode] = useState<'stream' | 'swimlane'>('swimlane');

  const [filterEntityId, setFilterEntityId] = useState<string | null>(null);

  // Modal States
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEraModal, setShowEraModal] = useState(false);
  const [editingEra, setEditingEra] = useState<Era | null>(null);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);

  // Forms
  const [formEraName, setFormEraName] = useState("");
  const [formEraFaction, setFormEraFaction] = useState("");
  const [formEraStartTick, setFormEraStartTick] = useState<number | string>("");

  const [formEventTitle, setFormEventTitle] = useState("");
  const [formEventDesc, setFormEventDesc] = useState("");
  const [formEventEraId, setFormEventEraId] = useState("");
  const [formEventYear, setFormEventYear] = useState(1);
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => {
    const [r1, r2, r3] = await Promise.all([
      api.get(`/eras?bookId=${bookId}`),
      api.get(`/timeline?bookId=${bookId}`),
      api.get(`/entities?bookId=${bookId}`)
    ]);
    setEras(r1.data); setEvents(r2.data); setEntities(r3.data);
  };

  // --- Logic ---
  const timelineData = useMemo(() => {
    const factionsSet = new Set<string>();
    const parsedEras = eras.map(era => {
      const match = era.name.match(/^\[(.*?)\]\s*(.*)/);
      return { 
        ...era, 
        faction: match ? match[1] : "主世界", 
        displayName: match ? match[2] : era.name 
      };
    });
    parsedEras.forEach(e => factionsSet.add(e.faction));
    const factions = Array.from(factionsSet).sort();
    
    let sortedEvents = [...events].sort((a, b) => Number(a.absolute_tick) - Number(b.absolute_tick));

    if (filterEntityId) {
      sortedEvents = sortedEvents.filter(ev => 
        ev.event_participants.some(p => p.entities.id === filterEntityId)
      );
    }

    return { factions, parsedEras, sortedEvents };
  }, [eras, events, filterEntityId]);

  // --- Handlers ---
  const openCreateEra = () => { setEditingEra(null); setFormEraName(""); setFormEraFaction(""); setFormEraStartTick(""); setShowEraModal(true); };
  const openEditEra = (era: Era) => { setEditingEra(era); const match = era.name.match(/^\[(.*?)\]\s*(.*)/); setFormEraFaction(match ? match[1] : ""); setFormEraName(match ? match[2] : era.name); setFormEraStartTick(era.start_absolute_tick); setShowEraModal(true); };
  const openCreateEvent = () => { setEditingEvent(null); setFormEventTitle(""); setFormEventDesc(""); setFormEventYear(1); setFormEventEraId(eras.length > 0 ? eras[0].id : ""); setSelectedEntityIds([]); setShowEventModal(true); };
  const openEditEvent = (ev: TimelineEvent) => { setEditingEvent(ev); setFormEventTitle(ev.title); setFormEventDesc(ev.description); setFormEventYear(ev.year_in_era); setFormEventEraId(ev.eras?.id || ""); setSelectedEntityIds(ev.event_participants.map(p => p.entities.id)); setShowEventModal(true); };
  
  const submitEra = async () => { 
    const finalName = formEraFaction ? `[${formEraFaction}] ${formEraName}` : formEraName; 
    const payload = { name: finalName, bookId, startTick: formEraStartTick === "" ? undefined : Number(formEraStartTick) }; 
    if (editingEra) await api.patch(`/eras/${editingEra.id}`, payload); 
    else await api.post('/eras', payload); 
    setShowEraModal(false); fetchData(); 
  };
  
  const submitEvent = async () => { 
    const payload = { title: formEventTitle, description: formEventDesc, bookId, eraId: formEventEraId, year: Number(formEventYear), entityIds: selectedEntityIds }; 
    if (editingEvent) await api.patch(`/timeline/${editingEvent.id}`, payload); 
    else await api.post('/timeline', payload); 
    setShowEventModal(false); fetchData(); 
  };
  
  const handleDelete = async (url: string) => { if(confirm("确定删除吗？")) { await api.delete(url); fetchData(); }};

  const toggleEntitySelection = (id: string) => {
    if (selectedEntityIds.includes(id)) {
      setSelectedEntityIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedEntityIds(prev => [...prev, id]);
    }
  };

  return (
    <div className="h-screen bg-gray-50 text-black flex flex-col font-sans overflow-hidden">
      {/* Top Bar */}
      <div className="bg-white border-b px-6 py-3 flex justify-between items-center shadow-sm z-30 flex-shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push(`/books/${bookId}`)} className="text-gray-500 hover:text-black"><ArrowLeft /></button>
          <h1 className="text-xl font-bold flex items-center gap-2"><Clock className="text-blue-600" /> 时空架构</h1>
        </div>
        
        <div className="flex items-center gap-4 bg-gray-50 p-1.5 rounded-lg border">
           <div className="flex bg-gray-200 rounded p-0.5">
             <button onClick={() => setViewMode('swimlane')} className={`px-3 py-1 text-sm rounded flex items-center gap-2 transition-all ${viewMode === 'swimlane' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500'}`}><Layers size={14}/> 多维泳道</button>
             <button onClick={() => setViewMode('stream')} className={`px-3 py-1 text-sm rounded flex items-center gap-2 transition-all ${viewMode === 'stream' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500'}`}><GitCommit size={14}/> 统一时间流</button>
           </div>
           
           <div className="h-4 w-px bg-gray-300"></div>

           <div className="relative flex items-center">
              <User size={14} className="text-gray-400 absolute left-2"/>
              <select 
                className="pl-8 pr-8 py-1 text-sm bg-white border rounded hover:border-blue-400 focus:outline-none appearance-none cursor-pointer min-w-[120px]"
                value={filterEntityId || ""}
                onChange={(e) => setFilterEntityId(e.target.value || null)}
              >
                <option value="">筛选人物 (全部)</option>
                {entities.filter(e => e.type === 'character').map(ent => (
                  <option key={ent.id} value={ent.id}>{ent.name}</option>
                ))}
              </select>
              {filterEntityId && (
                <button onClick={() => setFilterEntityId(null)} className="absolute right-2 text-gray-400 hover:text-red-500">
                  <X size={12} />
                </button>
              )}
           </div>
        </div>

        <div className="flex gap-2">
           <button onClick={openCreateEra} className="bg-white border px-3 py-2 rounded text-sm flex gap-2 hover:bg-gray-50"><Flag size={16}/> 纪元/势力</button>
           <button onClick={openCreateEvent} className="bg-blue-600 text-white px-3 py-2 rounded text-sm flex gap-2 hover:bg-blue-700 shadow-sm"><Plus size={16}/> 记大事</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative bg-slate-100">
         {viewMode === 'swimlane' && (
           <div className="absolute inset-0 overflow-x-auto overflow-y-auto p-8">
             <div className="flex gap-8 min-w-max pb-20">
                {timelineData.factions.map(faction => {
                   const factionColor = stringToColor(faction);
                   const factionEras = timelineData.parsedEras.filter(e => e.faction === faction);
                   return (
                     <div key={faction} className="w-[380px] flex-shrink-0 flex flex-col">
                        <div className="bg-white p-3 rounded-t-lg border-b-4 shadow-sm mb-4 sticky top-0 z-20" style={{ borderColor: factionColor }}>
                           <h2 className="font-bold text-gray-800">{faction}</h2>
                        </div>
                        <div className="space-y-6 relative">
                           <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                           {factionEras.map(era => {
                              const eraEvents = timelineData.sortedEvents.filter(ev => ev.eras?.id === era.id);
                              return (
                                <div key={era.id} className="relative pl-12">
                                   <div className="absolute left-[19px] top-0 w-3 h-3 rounded-full border-2 border-white shadow-sm z-10" style={{ backgroundColor: factionColor }}></div>
                                   <div className="bg-white/60 border-l-4 p-3 mb-3 rounded-r shadow-sm backdrop-blur-sm group flex justify-between" style={{ borderColor: factionColor }}>
                                      <div><div className="font-bold text-sm">{era.displayName}</div></div>
                                      <button onClick={() => openEditEra(era as Era)} className="opacity-0 group-hover:opacity-100 text-blue-500"><Edit2 size={12}/></button>
                                   </div>
                                   <div className="space-y-3">
                                      {eraEvents.map(event => (
                                        <div key={event.id} onClick={() => openEditEvent(event)} className="bg-white p-3 rounded shadow-sm border border-gray-100 hover:shadow-md cursor-pointer relative group">
                                           <div className="flex justify-between">
                                              <span className="bg-gray-100 text-xs font-bold px-1.5 rounded">{event.year_in_era} 年</span>
                                              <button onClick={(e) => {e.stopPropagation(); handleDelete( `/timeline/${event.id}`)}}><Trash2 size={12} className="text-gray-300 hover:text-red-500"/></button>
                                           </div>
                                           <h3 className="font-bold text-sm mt-1">{event.title}</h3>
                                           {event.event_participants.length > 0 && (
                                             <div className="flex -space-x-1 mt-2 pt-2 border-t border-gray-50">
                                                {event.event_participants.map(p => (
                                                  <div key={p.entities.id} className="w-5 h-5 rounded-full bg-gray-200 border border-white overflow-hidden" title={p.entities.name}>
                                                     {p.entities.avatar_url && <img src={p.entities.avatar_url} className="w-full h-full object-cover"/>}
                                                  </div>
                                                ))}
                                             </div>
                                           )}
                                        </div>
                                      ))}
                                      {eraEvents.length === 0 && <div className="text-xs text-gray-400 py-2 pl-1 italic">无事件</div>}
                                   </div>
                                </div>
                              );
                           })}
                        </div>
                     </div>
                   );
                })}
             </div>
           </div>
         )}
         
         {viewMode === 'stream' && (
             <div className="absolute inset-0 overflow-y-auto p-8">
                 <div className="max-w-3xl mx-auto space-y-6 relative pb-20">
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-blue-200"></div>
                    {timelineData.sortedEvents.map(event => (
                       <div key={event.id} className="relative pl-16 group" onClick={() => openEditEvent(event)}>
                          <div className="absolute left-[27px] top-5 w-3 h-3 bg-blue-500 rounded-full border-4 border-white shadow z-10"></div>
                          <div className="bg-white p-5 rounded-lg shadow-sm border hover:shadow-md cursor-pointer relative hover:border-blue-300 transition-all">
                             <div className="flex justify-between items-start">
                                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded">
                                   {event.eras?.name} • {event.year_in_era} 年
                                </span>
                                <div className="text-xs text-gray-400">Tick: {event.absolute_tick}</div>
                             </div>
                             <h3 className="font-bold text-lg mt-2 text-gray-800">{event.title}</h3>
                             <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                             {event.event_participants.length > 0 && (
                               <div className="flex items-center gap-3 mt-4 pt-3 border-t">
                                  <span className="text-xs text-gray-400 font-bold">涉及人物:</span>
                                  <div className="flex -space-x-2">
                                     {event.event_participants.map(p => (
                                        <div key={p.entities.id} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white overflow-hidden shadow-sm" title={p.entities.name}>
                                           {p.entities.avatar_url ? (
                                              <img src={p.entities.avatar_url} className="w-full h-full object-cover"/>
                                           ) : (
                                              <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">{p.entities.name[0]}</div>
                                           )}
                                        </div>
                                     ))}
                                  </div>
                               </div>
                             )}
                             <button onClick={(e) => {e.stopPropagation(); handleDelete(`/timeline/${event.id}`)}} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                          </div>
                       </div>
                    ))}
                    {timelineData.sortedEvents.length === 0 && (
                        <div className="text-center text-gray-400 py-20">
                           {filterEntityId ? "该人物未参与任何大事件" : "暂无历史记录"}
                        </div>
                    )}
                 </div>
             </div>
         )}
      </div>

      {showEraModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-96 shadow-xl">
             <h3 className="font-bold mb-4">{editingEra ? '编辑纪元' : '新建纪元'}</h3>
             <div className="space-y-3">
               <div><label className="text-xs text-gray-500">所属势力</label><input className="border p-2 w-full rounded" placeholder="例如：人族" value={formEraFaction} onChange={e=>setFormEraFaction(e.target.value)}/></div>
               <div><label className="text-xs text-gray-500">纪元名称</label><input className="border p-2 w-full rounded" placeholder="例如：帝国纪元" value={formEraName} onChange={e=>setFormEraName(e.target.value)}/></div>
               <div><label className="text-xs text-gray-500 font-bold">起始绝对时间</label><input type="number" className="border p-2 w-full rounded bg-gray-50" value={formEraStartTick} onChange={e=>setFormEraStartTick(e.target.value)}/></div>
             </div>
             <div className="mt-6 flex justify-end gap-2">
                <button onClick={()=>setShowEraModal(false)} className="text-gray-500 px-3">取消</button>
                <button onClick={submitEra} className="bg-blue-600 text-white px-4 py-2 rounded">保存</button>
             </div>
          </div>
        </div>
      )}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-[500px] shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold mb-4">{editingEvent ? '编辑事件' : '记录事件'}</h3>
            <div className="space-y-3">
               <select className="w-full border p-2 rounded" value={formEventEraId} onChange={e=>setFormEventEraId(e.target.value)}>{eras.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
               <div className="flex gap-2"><input type="number" className="border p-2 w-1/3 rounded" placeholder="年份" value={formEventYear} onChange={e=>setFormEventYear(Number(e.target.value))} /><input className="border p-2 w-2/3 rounded" placeholder="标题" value={formEventTitle} onChange={e=>setFormEventTitle(e.target.value)} /></div>
               <textarea className="w-full border p-2 rounded h-20" placeholder="描述" value={formEventDesc} onChange={e=>setFormEventDesc(e.target.value)} />
               <div className="border p-2 h-24 overflow-y-auto grid grid-cols-3 gap-2">{entities.map(ent => (<div key={ent.id} onClick={() => toggleEntitySelection(ent.id)} className={`cursor-pointer p-1 text-xs border rounded ${selectedEntityIds.includes(ent.id)?'bg-blue-100 border-blue-500':''}`}>{ent.name}</div>))}</div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={()=>setShowEventModal(false)} className="text-gray-500 px-3">取消</button>
              <button onClick={submitEvent} className="bg-blue-600 text-white px-4 py-2 rounded">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
