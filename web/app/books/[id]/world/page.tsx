"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../../lib/api";
import { ArrowLeft, User, MapPin, Box, Plus, Upload, Trash2, Edit2 } from "lucide-react";

export default function WorldPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;

  const [activeTab, setActiveTab] = useState('character'); // character, location, item
  const [entities, setEntities] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  
  // 编辑状态
  const [editingId, setEditingId] = useState<string | null>(null); // 如果有值，说明是编辑模式
  
  // 表单状态
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  // 加载实体列表
  const fetchEntities = async () => {
    try {
      const res = await api.get(`/entities?bookId=${bookId}&type=${activeTab}`);
      setEntities(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchEntities();
  }, [activeTab]);

  // 打开新增弹窗
  const openCreateModal = () => {
    setEditingId(null); // 清空编辑ID
    setNewName("");
    setNewDesc("");
    setAvatarUrl("");
    setShowModal(true);
  };

  // 打开编辑弹窗
  const openEditModal = (entity: any) => {
    setEditingId(entity.id);
    setNewName(entity.name);
    setNewDesc(entity.description || "");
    setAvatarUrl(entity.avatar_url || "");
    setShowModal(true);
  };

  // 上传图片
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAvatarUrl(res.data.url);
    } catch (error) {
      alert('上传失败');
    } finally {
      setUploading(false);
    }
  };

  // 提交 (区分新增和修改)
  const handleSubmit = async () => {
    if (!newName) return;
    
    try {
      const payload = {
        name: newName,
        description: newDesc,
        avatarUrl,
        type: activeTab, // 即使是修改，带上这个参数也没事
        bookId
      };

      if (editingId) {
        // 修改模式
        await api.patch(`/entities/${editingId}`, payload);
      } else {
        // 新增模式
        await api.post('/entities', payload);
      }

      setShowModal(false);
      fetchEntities(); // 刷新列表
    } catch (error) {
      alert("保存失败");
    }
  };

  // 删除实体
  const handleDelete = async (id: string) => {
    if(!confirm("确定删除吗？此操作不可恢复。")) return;
    await api.delete(`/entities/${id}`);
    fetchEntities();
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      {/* 顶部导航 */}
      <div className="bg-white border-b px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push(`/books/${bookId}`)} className="text-gray-500 hover:text-black transition-colors">
            <ArrowLeft />
          </button>
          <h1 className="text-xl font-bold">🌏 世界观设定</h1>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} /> 新建{activeTab === 'character' ? '人物' : activeTab === 'location' ? '地点' : '物品'}
        </button>
      </div>

      {/* 标签页切换 */}
      <div className="px-8 mt-6">
        <div className="flex gap-4 border-b">
          {[
            { id: 'character', label: '人物', icon: User },
            { id: 'location', label: '地点', icon: MapPin },
            { id: 'item', label: '物品', icon: Box },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600 font-bold' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 卡片列表 */}
      <div className="p-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {entities.map(item => (
          <div key={item.id} className="bg-white rounded-lg shadow border overflow-hidden hover:shadow-md transition-shadow group relative">
            <div className="h-48 bg-gray-100 relative">
              {item.avatar_url ? (
                <img src={item.avatar_url} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                  <User size={48} className="opacity-20" />
                </div>
              )}
              
              {/* 操作按钮 (悬停显示) */}
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => openEditModal(item)}
                  className="bg-white/90 p-1.5 rounded-full text-blue-600 hover:bg-blue-50 shadow-sm"
                  title="编辑"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="bg-white/90 p-1.5 rounded-full text-red-500 hover:bg-red-50 shadow-sm"
                  title="删除"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg mb-1 truncate">{item.name}</h3>
              <p className="text-gray-500 text-sm line-clamp-3 h-10">
                {item.description || "暂无描述"}
              </p>
            </div>
          </div>
        ))}
        
        {entities.length === 0 && (
          <div className="col-span-full text-center py-20 text-gray-400 border-2 border-dashed rounded-lg">
            <p>暂无数据</p>
            <p className="text-sm mt-2">快去创建第一个设定吧！</p>
          </div>
        )}
      </div>

      {/* 创建/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 w-[500px] shadow-2xl">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? '编辑' : '新建'}{activeTab === 'character' ? '人物' : activeTab === 'location' ? '地点' : '物品'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称 <span className="text-red-500">*</span></label>
                <input 
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)}
                  placeholder="例如：萧炎"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">头像</label>
                <div className="flex items-center gap-4">
                  {avatarUrl ? (
                    <img src={avatarUrl} className="w-12 h-12 rounded object-cover border" />
                  ) : (
                    <div className="w-12 h-12 rounded bg-gray-100 border flex items-center justify-center text-gray-400">
                      <User size={20} />
                    </div>
                  )}
                  <label className="cursor-pointer bg-gray-50 border px-3 py-2 rounded text-sm hover:bg-gray-100 flex items-center gap-2 transition-colors">
                    <Upload size={16} /> {uploading ? '上传中...' : '上传图片'}
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述 / 传记</label>
                <textarea 
                  className="w-full border p-2 rounded h-32 focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="输入人物小传、性格特征、背景故事等..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 pt-4 border-t">
              <button 
                onClick={() => setShowModal(false)} 
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleSubmit} 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm"
              >
                {editingId ? '保存修改' : '立即创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}