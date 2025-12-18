"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/api";
import { Trash2, Settings, Book as BookIcon, Download } from "lucide-react";

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
  const [newBookTitle, setNewBookTitle] = useState("");

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

  useEffect(() => { fetchBooks(); }, []);

  const handleCreate = async () => {
    if (!newBookTitle.trim()) return;
    try {
      await api.post("/books", { title: newBookTitle });
      setNewBookTitle("");
      fetchBooks();
    } catch (error) { alert("创建失败"); }
  };

  const handleEnterWriting = (bookId: string) => {
    router.push(`/books/${bookId}`);
  };

  const handleDeleteBook = async (bookId: string, bookTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`确定要彻底删除作品《${bookTitle}》吗？`)) {
      try {
        await api.delete(`/books/${bookId}`);
        fetchBooks();
      } catch (error) { alert("删除失败"); }
    }
  };

  // 🔥 导出功能
  const handleExport = async (bookId: string, bookTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`要把《${bookTitle}》导出为 Word 文档吗？`)) return;

    try {
      // 这里的 loading 状态建议加个全局 Toast，简单起见先略过
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

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-lg shadow-lg">
            <BookIcon className="text-white w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">创作工作台</h1>
            <p className="text-gray-500 text-sm mt-1">管理你的所有小说项目</p>
          </div>
        </header>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-10 flex gap-4 transition-all hover:shadow-md">
          <input
            type="text"
            placeholder="输入新书名，例如：诡秘之主"
            className="flex-1 border-2 border-gray-100 rounded-lg px-5 py-3 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-lg"
            value={newBookTitle}
            onChange={(e) => setNewBookTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-md hover:shadow-lg transition-all active:scale-95">
            新建作品
          </button>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-20">正在加载书架...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <div key={book.id} onClick={() => handleEnterWriting(book.id)} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1">{book.title}</h2>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${book.status === 'ongoing' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{book.status === 'ongoing' ? '连载中' : book.status}</span>
                  </div>
                  <p className="text-gray-500 text-sm mb-6 line-clamp-2 h-10 leading-relaxed">{book.summary || "暂无简介..."}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <button className="text-blue-600 font-bold text-sm flex items-center gap-1 hover:underline">进入写作 &rarr;</button>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); router.push('/settings/ai'); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="AI 设置"><Settings size={18} /></button>
                      
                      {/* 导出按钮 */}
                      <button onClick={(e) => handleExport(book.id, book.title, e)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors" title="导出 Word"><Download size={18} /></button>
                      
                      <button onClick={(e) => handleDeleteBook(book.id, book.title, e)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="删除书籍"><Trash2 size={18} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {books.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
                <BookIcon size={48} className="mb-4 opacity-20" />
                <p className="text-lg">书架空空如也</p>
                <p className="text-sm">快去创建你的第一部神作吧！</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}