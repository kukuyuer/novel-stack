"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../lib/api";
import Editor from "../../../components/Editor";
import { 
  FolderOpen, Plus, Save, ArrowLeft, Trash2, Edit2, FileText, Folder, Globe, ArrowUp, ArrowDown, Clock, MoveRight, Users
} from "lucide-react";

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  type: 'volume' | 'chapter';
  id: string;
  title: string;
}

export default function WriterPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;

  const [volumes, setVolumes] = useState<any[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [chapterContent, setChapterContent] = useState("");
  const [saveStatus, setSaveStatus] = useState("已同步");

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, type: 'chapter', id: '', title: '' });
  const [showTransferSubmenu, setShowTransferSubmenu] = useState(false);

  useEffect(() => {
    const handleClick = () => { setContextMenu({ ...contextMenu, visible: false }); setShowTransferSubmenu(false); };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [contextMenu]);

  const fetchCatalog = useCallback(async () => {
    try {
      const res = await api.get(`/chapters/catalog?bookId=${bookId}`);
      setVolumes(res.data);
    } catch (e) { console.error(e); }
  }, [bookId]);

  useEffect(() => { fetchCatalog(); }, [fetchCatalog]);

  const loadChapter = async (chapterId: string) => {
    if (chapterId === activeChapterId) return;
    setSaveStatus("加载中...");
    try {
      const res = await api.get(`/chapters/${chapterId}`);
      setChapterContent(res.data.content || "");
      setActiveChapterId(chapterId);
      setSaveStatus("已就绪");
    } catch (e) { setSaveStatus("加载失败"); }
  };

  const handleContentUpdate = (newHtml: string) => {
    setSaveStatus("未保存");
    setChapterContent(newHtml);
  };

  const saveChapter = async () => {
    if (!activeChapterId) return;
    setSaveStatus("保存中...");
    try {
      await api.patch(`/chapters/${activeChapterId}`, { content: chapterContent });
      setSaveStatus("已保存 " + new Date().toLocaleTimeString());
    } catch (e) { setSaveStatus("保存失败"); }
  };

  // --- 目录管理逻辑 ---

  const handleContextMenu = (e: React.MouseEvent, type: 'volume' | 'chapter', id: string, title: string) => {
    e.preventDefault(); 
    e.stopPropagation();
    setContextMenu({ visible: true, x: e.pageX, y: e.pageY, type, id, title });
    setShowTransferSubmenu(false);
  };

  const createVolume = async () => {
    const title = prompt("请输入新卷名：", "新卷");
    if (!title) return;
    await api.post("/volumes", { title, bookId });
    fetchCatalog();
  };

  const createChapter = async (targetVolumeId?: string) => {
    let volId = targetVolumeId;
    if (!volId) {
       if (volumes.length === 0) return alert("请先创建卷");
       volId = volumes[volumes.length - 1].id;
    }
    const title = prompt("请输入章节标题");
    if (!title) return;
    await api.post("/chapters", { title, bookId, volumeId: volId });
    fetchCatalog();
  };

  const handleRename = async () => {
    const newTitle = prompt(`重命名${contextMenu.type === 'volume' ? '卷' : '章节'}`, contextMenu.title);
    if (!newTitle || newTitle === contextMenu.title) return;
    const url = contextMenu.type === 'volume' ? `/volumes/${contextMenu.id}` : `/chapters/${contextMenu.id}`;
    await api.patch(url, { title: newTitle });
    fetchCatalog();
  };

  const handleDelete = async () => {
    if (!confirm(`确定要删除 "${contextMenu.title}" 吗？`)) return;
    const url = contextMenu.type === 'volume' ? `/volumes/${contextMenu.id}` : `/chapters/${contextMenu.id}`;
    await api.delete(url);
    if (activeChapterId === contextMenu.id) { setActiveChapterId(null); setChapterContent(""); }
    fetchCatalog();
  };

  const handleMove = async (direction: 'up' | 'down') => {
    const url = contextMenu.type === 'volume' ? `/volumes/${contextMenu.id}/move` : `/chapters/${contextMenu.id}/move`;
    await api.post(url, { direction });
    fetchCatalog();
  };

  const handleTransfer = async (targetVolumeId: string) => {
    await api.post(`/chapters/${contextMenu.id}/transfer`, { targetVolumeId });
    fetchCatalog();
  };

  return (
    <div className="flex h-screen bg-gray-100 text-black font-sans overflow-hidden">
      {/* 侧边栏 */}
      <div className="w-72 bg-white border-r flex flex-col shadow-lg z-10 flex-shrink-0">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 flex-shrink-0">
          <button onClick={() => router.push('/')} className="text-gray-500 hover:text-black transition-colors" title="返回首页"><ArrowLeft size={20} /></button>
          <div className="flex gap-2">
             <button onClick={createVolume} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="新建卷"><Folder size={18} /></button>
             <button onClick={() => createChapter()} className="p-1.5 hover:bg-gray-200 rounded text-blue-600 transition-colors" title="新建章节"><Plus size={20} /></button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {volumes.map((vol) => (
            <div key={vol.id}>
              <div 
                onContextMenu={(e) => handleContextMenu(e, 'volume', vol.id, vol.title)}
                className="flex items-center justify-between px-3 py-1 text-xs font-bold text-gray-500 uppercase hover:bg-gray-100 rounded cursor-context-menu select-none group"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                   <FolderOpen size={14} className="flex-shrink-0"/>
                   <span className="truncate">{vol.title}</span>
                </div>
                <button 
                   onClick={(e) => { e.stopPropagation(); createChapter(vol.id); }}
                   className="opacity-0 group-hover:opacity-100 hover:text-blue-600 hover:bg-blue-100 p-1 rounded"
                   title="在此卷创建章节"
                >
                   <Plus size={14} />
                </button>
              </div>

              <div className="space-y-0.5 mt-1 ml-2 border-l border-gray-200 pl-2">
                {vol.chapters.map((chap: any) => (
                  <div
                    key={chap.id}
                    onClick={() => loadChapter(chap.id)}
                    onContextMenu={(e) => handleContextMenu(e, 'chapter', chap.id, chap.title)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm transition-all select-none ${
                      activeChapterId === chap.id ? "bg-blue-50 text-blue-700 font-semibold shadow-sm" : "hover:bg-gray-100 text-gray-700 hover:pl-4"
                    }`}
                  >
                    <FileText size={14} className={activeChapterId === chap.id ? "text-blue-500" : "text-gray-400"} />
                    <span className="truncate">{chap.title}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {volumes.length === 0 && <div className="text-center text-gray-400 text-sm mt-10">点击上方文件夹图标<br/>创建第一卷</div>}
        </div>

        <div className="p-3 border-t bg-gray-50 flex-shrink-0 grid grid-cols-3 gap-1">
          <button onClick={() => router.push(`/books/${bookId}/world`)} className="flex flex-col items-center justify-center p-2 rounded hover:bg-white hover:shadow-sm text-xs font-medium text-gray-600 transition-all">
            <Globe size={16} className="mb-1 text-blue-500"/> 世界观
          </button>
          <button onClick={() => router.push(`/books/${bookId}/timeline`)} className="flex flex-col items-center justify-center p-2 rounded hover:bg-white hover:shadow-sm text-xs font-medium text-gray-600 transition-all">
            <Clock size={16} className="mb-1 text-purple-500"/> 时间轴
          </button>
          <button onClick={() => router.push(`/books/${bookId}/relations`)} className="flex flex-col items-center justify-center p-2 rounded hover:bg-white hover:shadow-sm text-xs font-medium text-gray-600 transition-all">
            <Users size={16} className="mb-1 text-pink-500"/> 关系网
          </button>
        </div>
      </div>

      {/* 右侧编辑器 */}
      <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
        <div className="h-14 border-b bg-white flex items-center justify-between px-6 shadow-sm flex-shrink-0">
          <div className="text-sm text-gray-500 flex items-center gap-2">
             <span className={`w-2 h-2 rounded-full ${saveStatus.includes('失败') ? 'bg-red-500' : saveStatus.includes('未') ? 'bg-yellow-400' : 'bg-green-500'}`}></span>
             {saveStatus}
          </div>
          <button onClick={saveChapter} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm transition-colors ${saveStatus.includes('未') ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Save size={16} /> {saveStatus.includes('未') ? '立即保存' : '已保存'}</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* ✅ 修复：将 max-w-3xl 改为 max-w-5xl，大幅加宽编辑区 */}
          <div className="max-w-5xl mx-auto bg-white min-h-[85vh] shadow-sm rounded-lg border border-gray-100">
            {activeChapterId ? (
               <Editor key={activeChapterId} initialContent={chapterContent} onUpdate={handleContentUpdate} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60"><FileText size={64} className="mb-4 text-gray-300" /><p>选择章节开始写作</p></div>
            )}
          </div>
        </div>
      </div>

      {/* 右键菜单 */}
      {contextMenu.visible && (
        <div className="fixed bg-white border shadow-xl rounded-md py-1 z-50 w-40 text-sm text-gray-700" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <div className="px-3 py-1.5 text-xs text-gray-400 border-b mb-1 truncate">{contextMenu.title}</div>
          <button onClick={handleRename} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"><Edit2 size={14} /> 重命名</button>
          
          <button onClick={() => handleMove('up')} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"><ArrowUp size={14} /> 上移</button>
          <button onClick={() => handleMove('down')} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"><ArrowDown size={14} /> 下移</button>
          
          {contextMenu.type === 'chapter' && (
            <div className="relative group">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowTransferSubmenu(!showTransferSubmenu); }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 justify-between"
                >
                   <div className="flex items-center gap-2"><MoveRight size={14} /> 转移到...</div>
                </button>
                {showTransferSubmenu && (
                    <div className="absolute left-full top-0 ml-1 bg-white border shadow-xl rounded-md py-1 w-32 max-h-60 overflow-y-auto">
                        {volumes.map(vol => (
                            <button key={vol.id} onClick={() => handleTransfer(vol.id)} className="w-full text-left px-3 py-2 hover:bg-blue-50 text-xs truncate" title={vol.title}>{vol.title}</button>
                        ))}
                    </div>
                )}
            </div>
          )}

          <div className="border-t my-1"></div>
          <button onClick={handleDelete} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"><Trash2 size={14} /> 删除</button>
        </div>
      )}
    </div>
  );
}
