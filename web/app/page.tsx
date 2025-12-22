"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/api";
import { 
  Trash2, 
  Settings, 
  Book as BookIcon, 
  Download, 
  UploadCloud, 
  Upload, 
  FileJson,
  Plus,
  Loader2
} from "lucide-react";

interface Book {
  id: string;
  title: string;
  summary: string;
  status: string;
}

export default function Home() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState("");

  // 隐藏的文件 input 引用
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  // 获取书籍列表
  const fetchBooks = async () => {
    try {
      const res = await api.get("/books");
      setBooks(res.data);
    } catch (error) {
      console.error("获取书籍失败", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // 创建新书
  const handleCreate = async () => {
    if (!newBookTitle.trim()) return;
    try {
      await api.post("/books", { title: newBookTitle });
      setNewBookTitle("");
      fetchBooks();
    } catch (error) {
      alert("创建失败，请检查网络或后端服务");
    }
  };

  // 跳转到写作页面
  const handleEnterWriting = (bookId: string) => {
    router.push(`/books/${bookId}`);
  };

  // 删除书籍
  const handleDeleteBook = async (bookId: string, bookTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = confirm(`⚠️ 高危操作警告！\n\n确定要彻底删除作品《${bookTitle}》吗？\n\n此操作将连带删除该书下的：\n- 所有章节\n- 所有人物/设定\n- 所有时间轴数据\n\n且【无法恢复】！`);
    
    if (confirmed) {
      try {
        await api.delete(`/books/${bookId}`);
        fetchBooks();
      } catch (error) {
        alert("删除失败");
      }
    }
  };

  // 导出 Word (.docx)
  const handleExportDocx = async (bookId: string, bookTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`要把《${bookTitle}》导出为 Word 文档吗？`)) return;

    try {
      const response = await api.get(`/export/${bookId}/docx`, {
        responseType: 'blob', 
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${bookTitle}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("导出失败，请检查后端日志");
    }
  };

  // 备份数据 (.json)
  const handleBackupJson = async (bookId: string, bookTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await api.get(`/backup/export/${bookId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${bookTitle}_备份.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) { alert("备份失败"); }
  };

  // 处理书籍导入 (TXT/Word)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 简单的书名推测
    const bookTitle = file.name.replace(/\.(txt|docx)$/, '');
    const confirmImport = confirm(`确定导入 "${bookTitle}" 吗？\n文件较大时可能需要几秒钟处理。`);
    
    if (confirmImport) {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', bookTitle);

      try {
        // 注意：这里调用的是 /import/file 接口 (支持 txt/docx)
        await api.post('/import/file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert("导入成功！");
        fetchBooks();
      } catch (err) {
        alert("导入失败，请检查文件格式");
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  // 处理 JSON 恢复
  const handleJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmRestore = confirm(`确定从备份文件 "${file.name}" 恢复作品吗？\n这将创建一本新的副本书籍。`);
    if (confirmRestore) {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', file);

      try {
        await api.post('/backup/import', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert("恢复成功！");
        fetchBooks();
      } catch (err) {
        alert("恢复失败，文件格式可能错误");
      } finally {
        setImporting(false);
        if (jsonInputRef.current) jsonInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black font-sans">
      <div className="max-w-6xl mx-auto">
        {/* 顶部标题栏 */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-lg shadow-lg text-white">
              <BookIcon size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">创作工作台</h1>
              <p className="text-gray-500 text-sm mt-1">管理你的所有小说项目</p>
            </div>
          </div>
          <div className="flex gap-3">
             <button 
                onClick={() => router.push('/settings/ai')} 
                className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 text-gray-600 text-sm font-medium transition-colors"
             >
                <Settings size={16}/> 全局设置
             </button>
          </div>
        </header>

        {/* 顶部工具栏：创建与导入 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-10 flex flex-wrap gap-4 items-center transition-all hover:shadow-md">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder="输入新书名，例如：诡秘之主"
              className="flex-1 border-2 border-gray-100 rounded-lg px-5 py-3 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-lg min-w-[200px]"
              value={newBookTitle}
              onChange={(e) => setNewBookTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold text-lg shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
            >
              <Plus size={20}/> 新建
            </button>
          </div>

          <div className="w-px h-10 bg-gray-200 mx-2 hidden md:block"></div>

          <div className="flex gap-3 w-full md:w-auto">
            {/* 导入按钮 */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="flex-1 md:flex-none bg-white border-2 border-gray-200 text-gray-600 px-5 py-3 rounded-lg font-bold hover:border-blue-500 hover:text-blue-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {importing ? <Loader2 size={20} className="animate-spin"/> : <UploadCloud size={20}/>}
              导入书
            </button>
            
            {/* 恢复按钮 */}
            <button 
              onClick={() => jsonInputRef.current?.click()}
              disabled={importing}
              className="flex-1 md:flex-none bg-white border-2 border-gray-200 text-gray-600 px-5 py-3 rounded-lg font-bold hover:border-green-500 hover:text-green-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Upload size={20}/> 恢复备份
            </button>
          </div>

          {/* 隐藏的 inputs */}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".txt,.docx" className="hidden" />
          <input type="file" ref={jsonInputRef} onChange={handleJsonUpload} accept=".json" className="hidden" />
        </div>

        {/* 书籍列表区域 */}
        {loading ? (
          <div className="text-center text-gray-400 py-20 flex flex-col items-center">
             <Loader2 size={40} className="animate-spin mb-4 opacity-50"/>
             正在加载书架...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <div
                key={book.id}
                onClick={() => handleEnterWriting(book.id)}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden flex flex-col h-[220px]"
              >
                {/* 装饰背景 */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 pointer-events-none"></div>

                <div className="relative z-10 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1 pr-4">
                      {book.title}
                    </h2>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                      book.status === 'ongoing' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {book.status === 'ongoing' ? '连载中' : book.status}
                    </span>
                  </div>
                  
                  <p className="text-gray-500 text-sm mb-4 line-clamp-3 leading-relaxed">
                    {book.summary || "暂无简介，点击进入开始创作..."}
                  </p>
                </div>
                  
                <div className="relative z-10 flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                  <button className="text-blue-600 font-bold text-sm flex items-center gap-1 hover:underline">
                    进入写作 &rarr;
                  </button>
                  
                  <div className="flex gap-1">
                    {/* JSON 备份 */}
                    <button 
                      onClick={(e) => handleBackupJson(book.id, book.title, e)}
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                      title="备份数据 (.json)"
                    >
                      <FileJson size={18} />
                    </button>

                    {/* Word 导出 */}
                    <button 
                      onClick={(e) => handleExportDocx(book.id, book.title, e)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                      title="导出 Word (.docx)"
                    >
                      <Download size={18} />
                    </button>

                    {/* 删除 */}
                    <button 
                      onClick={(e) => handleDeleteBook(book.id, book.title, e)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="删除书籍"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {books.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
                <BookIcon size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">书架空空如也</p>
                <p className="text-sm mt-1">快去创建你的第一部神作，或者从文件导入吧！</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}