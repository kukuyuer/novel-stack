"use client";

import { useEffect, useState } from "react";
// ✅ 关键修复：这里只有 3 个 ../
import api from "../../../lib/api"; 
import { ArrowLeft, Plus, Trash2, Bot, Save } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AiSettingsPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<any[]>([]);
  
  // 表单
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("openai");
  const [baseUrl, setBaseUrl] = useState("https://api.openai.com/v1");
  const [apiKey, setApiKey] = useState("");
  const [modelName, setModelName] = useState("gpt-4o");

  useEffect(() => { fetchProviders(); }, []);

  const fetchProviders = async () => {
    try {
      const res = await api.get('/ai/providers');
      setProviders(res.data);
    } catch (e) { console.error(e); }
  };

  const handleAdd = async () => {
    if (!name) return alert("请输入名称");
    await api.post('/ai/providers', {
      name, provider, baseUrl, apiKey,
      models: [modelName] 
    });
    fetchProviders();
    setName(""); setApiKey("");
  };

  const handleDelete = async (id: number) => {
    if(confirm("删除此渠道？")) {
      await api.delete(`/ai/providers/${id}`);
      fetchProviders();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.push('/')} className="p-2 hover:bg-gray-200 rounded text-gray-600"><ArrowLeft /></button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="text-blue-600"/> AI 渠道配置
          </h1>
        </div>

        {/* 添加区域 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h2 className="font-bold mb-4 text-lg text-gray-800">添加新模型</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
             <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">显示名称</label>
                <input className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="例如：我的 DeepSeek" value={name} onChange={e=>setName(e.target.value)} />
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">服务商类型</label>
                <select className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={provider} onChange={e=>{
                    setProvider(e.target.value);
                    if(e.target.value === 'ollama') setBaseUrl('http://host.docker.internal:11434/v1');
                    if(e.target.value === 'deepseek') setBaseUrl('https://api.deepseek.com');
                    if(e.target.value === 'openai') setBaseUrl('https://api.openai.com/v1');
                }}>
                   <option value="openai">OpenAI (标准)</option>
                   <option value="deepseek">DeepSeek</option>
                   <option value="ollama">Ollama (本地)</option>
                </select>
             </div>
             <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Base URL (API 地址)</label>
                <input className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500 outline-none" value={baseUrl} onChange={e=>setBaseUrl(e.target.value)} />
             </div>
             <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">API Key</label>
                <input className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500 outline-none" type="password" placeholder="sk-..." value={apiKey} onChange={e=>setApiKey(e.target.value)} />
             </div>
             <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">模型名称 (Model ID)</label>
                <input className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="例如：gpt-4o, deepseek-chat" value={modelName} onChange={e=>setModelName(e.target.value)} />
             </div>
          </div>
          <button onClick={handleAdd} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-bold shadow-md transition-all active:scale-95">
             <Save size={18}/> 保存配置
          </button>
        </div>

        {/* 列表区域 */}
        <div className="space-y-4">
           {providers.map(p => (
             <div key={p.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center group hover:border-blue-200 transition-all">
                <div className="flex items-center gap-4">
                   <div className={`p-3 rounded-full ${p.provider === 'openai' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                      <Bot size={24} />
                   </div>
                   <div>
                      <div className="font-bold text-lg text-gray-800">{p.name}</div>
                      <div className="text-sm text-gray-500 font-mono bg-gray-50 px-1 rounded inline-block mt-1">{p.models[0]}</div>
                      <div className="text-xs text-gray-400 mt-1 truncate max-w-[300px]">{p.base_url}</div>
                   </div>
                </div>
                <button onClick={() => handleDelete(p.id)} className="text-gray-300 hover:text-red-500 p-2 transition-colors group-hover:text-red-300">
                    <Trash2 size={20} />
                </button>
             </div>
           ))}
           
           {providers.length === 0 && (
             <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-xl">
               暂无 AI 配置，请在上方添加
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
