"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import { useEffect } from 'react';
import MenuBar from './MenuBar'; // 引入工具栏

interface EditorProps {
  initialContent?: string;
  onUpdate: (content: string) => void;
}

export default function Editor({ initialContent, onUpdate }: EditorProps) {
  const editor = useEditor({
    immediatelyRender: false, // 解决 SSR 问题
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] }, // 配置标题层级
      }),
      Placeholder.configure({
        placeholder: '在此处开始你的故事... (支持 Markdown 语法)',
      }),
      CharacterCount, // 字数统计
      Highlight,      // 高亮
      Typography,     // 排版优化
    ],
    content: initialContent || '',
    editorProps: {
      attributes: {
        // Tailwind Typography 样式配置
        // prose-lg: 大号字体
        // prose-slate: 颜色风格
        // focus:outline-none: 去掉浏览器默认蓝框
        class: 'prose prose-lg prose-slate max-w-none focus:outline-none min-h-[600px] px-8 py-6 outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
  });

  // 监听外部内容变化（切换章节时）
  useEffect(() => {
    if (editor && initialContent !== undefined) {
       // 只有当编辑器内容与传入内容严重不符（比如切换章节了）才重置
       // 或者依靠 Parent Component 的 key 属性强制重置，这里做个兜底
       if (editor.getHTML() !== initialContent && editor.getText().trim() === '') {
         editor.commands.setContent(initialContent);
       }
    }
  }, [initialContent, editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-col border rounded-lg bg-white shadow-sm overflow-hidden min-h-[700px]">
      {/* 1. 工具栏 */}
      <MenuBar editor={editor} />

      {/* 2. 编辑区 (模拟纸张感) */}
      <div className="flex-1 bg-white cursor-text" onClick={() => editor.chain().focus().run()}>
        <EditorContent editor={editor} />
      </div>

      {/* 3. 底部状态栏 */}
      <div className="border-t bg-gray-50 px-4 py-2 text-xs text-gray-500 flex justify-between items-center select-none">
        <div className="flex gap-4">
           <span>字数: {editor.storage.characterCount.characters()}</span>
           <span>段落: {editor.state.doc.childCount}</span>
        </div>
        <div>
           {editor.isFocused ? '写作中...' : '准备就绪'}
        </div>
      </div>
    </div>
  );
}