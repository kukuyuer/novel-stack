"use client";

import { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import api from '../lib/api'; // 确保路径正确
import { 
  Bold, Italic, Strikethrough, Heading1, Heading2, 
  Quote, Undo, Redo, Eraser, Sparkles, X, Loader2, Send
} from 'lucide-react';

interface MenuBarProps {
  editor: Editor | null;
}

export default function MenuBar({ editor }: MenuBarProps) {
  const [showAi, setShowAi] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  // 加载 AI 渠道
  useEffect(() => {
    if (showAi && providers.length === 0) {
      api.get('/ai/providers').then(res => {
        setProviders(res.data);
        if (res.data.length > 0) setSelectedProvider(res.data[0].id);
      });
    }
  }, [showAi]);

  if (!editor) return null;

  // 一键排版
  const formatNovelStyle = () => {
    let html = editor.getHTML();
    html = html.replace(/<p>\s*　+/g, '<p>');
    html = html.replace(/<p>\s+/g, '<p>');
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p><br><\/p>/g, '');
    html = html.replace(/<p>/g, '<p>　　');
    editor.commands.setContent(html);
  };

  // 调用 AI
  const handleAiGenerate = async () => {
    if (!selectedProvider || !prompt) return;
    setLoading(true);
    
    try {
      // 获取当前选中的文本作为上下文，如果没有选中，取光标前 500 字
      const selection = editor.state.selection;
      const context = selection.empty 
        ? editor.getText().slice(Math.max(0, selection.from - 500), selection.from)
        : editor.state.doc.textBetween(selection.from, selection.to, '\n');

      const res = await api.post('/ai/generate', {
        providerId: Number(selectedProvider),
        prompt: prompt,
        context: context
      });

      // 将结果插入编辑器
      const result = res.data.result;
      editor.chain().focus().insertContent(result).run();
      setShowAi(false); // 关闭窗口
      setPrompt("");    // 清空提示词
    } catch (error) {
      alert("AI 生成失败，请检查配置或网络");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1 sticky top-0 z-20 items-center relative">
      {/* 撤销/重做 */}
      <div className="flex gap-1 border-r pr-2 mr-2 border-gray-300">
        <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30"><Undo size={18} /></button>
        <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30"><Redo size={18} /></button>
      </div>

      {/* 基础格式 */}
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-200 text-blue-600' : ''}`}><Bold size={18} /></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-200 text-blue-600' : ''}`}><Italic size={18} /></button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('strike') ? 'bg-gray-200 text-blue-600' : ''}`}><Strikethrough size={18} /></button>
      
      <div className="w-px h-6 bg-gray-300 mx-1"></div>

      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 text-blue-600' : ''}`}><Heading1 size={18} /></button>
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('blockquote') ? 'bg-gray-200 text-blue-600' : ''}`}><Quote size={18} /></button>

      <div className="w-px h-6 bg-gray-300 mx-1"></div>

      {/* 排版按钮 */}
      <button onClick={formatNovelStyle} className="px-3 py-1 rounded bg-white border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-100 transition-colors shadow-sm" title="自动缩进">排版</button>
      <button onClick={() => editor.chain().focus().unsetAllMarks().run()} className="p-1.5 rounded hover:bg-red-100 text-gray-500 hover:text-red-500"><Eraser size={18} /></button>

      {/* 🔥 AI 按钮 */}
      <button 
        onClick={() => setShowAi(!showAi)}
        className={`ml-auto px-3 py-1 rounded border text-xs font-bold flex items-center gap-1 shadow-sm transition-colors ${showAi ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-transparent hover:opacity-90'}`}
      >
        <Sparkles size={14} /> AI 助手
      </button>

      {/* 🔥 AI 悬浮面板 */}
      {showAi && (
        <div className="absolute top-12 right-2 w-80 bg-white border border-gray-200 shadow-xl rounded-lg p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm text-gray-700 flex items-center gap-2">
              <Sparkles size={14} className="text-purple-600"/> 灵感生成
            </h3>
            <button onClick={() => setShowAi(false)} className="text-gray-400 hover:text-gray-600"><X size={14}/></button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">选择模型</label>
              <select 
                className="w-full text-sm border p-1.5 rounded bg-gray-50 outline-none focus:border-purple-500"
                value={selectedProvider}
                onChange={e => setSelectedProvider(e.target.value)}
              >
                {providers.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.provider})</option>
                ))}
                {providers.length === 0 && <option disabled>无可用模型，请去设置页添加</option>}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">指令</label>
              <textarea 
                className="w-full text-sm border p-2 rounded h-20 outline-none focus:border-purple-500 resize-none"
                placeholder="例如：帮我描写一段萧炎释放异火的场景..."
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
               {['润色这段话', '续写情节', '生成环境描写', '起个名字'].map(tag => (
                 <button 
                   key={tag} 
                   onClick={() => setPrompt(tag)}
                   className="text-[10px] bg-gray-100 hover:bg-purple-50 hover:text-purple-600 px-2 py-1 rounded border border-gray-200"
                 >
                   {tag}
                 </button>
               ))}
            </div>

            <button 
              onClick={handleAiGenerate}
              disabled={loading || providers.length === 0}
              className="w-full bg-purple-600 text-white py-2 rounded text-sm font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
              {loading ? '生成中...' : '立即生成'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}