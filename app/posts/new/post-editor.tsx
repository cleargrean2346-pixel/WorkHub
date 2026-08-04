'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from './editor.module.css';

type PostEditorProps = { organizationId: string; initialValue?: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character] ?? character);
}

function markdownPreview(value: string) {
  const escaped = escapeHtml(value);
  return escaped
    .replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, '<img src="$2" alt="$1" />')
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/^&gt; (.*)$/gm, '<blockquote>$1</blockquote>')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/^- \[ \] (.*)$/gm, '<p>☐ $1</p>')
    .replace(/^- \[x\] (.*)$/gim, '<p>☑ $1</p>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br />');
}

export function PostEditor({ organizationId, initialValue = '' }: PostEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(initialValue);
  const [altText, setAltText] = useState('이미지');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  function insert(before: string, after = '', fallback = '') {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || fallback;
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    setValue(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + before.length + selected.length + after.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  async function uploadImage(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setMessage('이미지 파일만 업로드할 수 있습니다.'); return; }
    if (file.size > 5 * 1024 * 1024) { setMessage('이미지는 5MB 이하만 업로드할 수 있습니다.'); return; }
    setUploading(true);
    setMessage('이미지를 업로드하는 중입니다…');
    const extension = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '') || 'png';
    const path = `${organizationId}/posts/${crypto.randomUUID()}.${extension}`;
    const supabase = createClient();
    const { error } = await supabase.storage.from('post-images').upload(path, file, { contentType: file.type, upsert: false });
    if (error) { setMessage(`업로드 실패: ${error.message}`); setUploading(false); return; }
    const { data } = supabase.storage.from('post-images').getPublicUrl(path);
    insert(`![${altText.trim() || '이미지'}](${data.publicUrl})`);
    setMessage('이미지를 본문에 추가했습니다.');
    setUploading(false);
  }

  return <div className={styles.editorBlock}>
    <div className={styles.toolbar} aria-label="본문 서식 도구">
      <button type="button" onClick={() => insert('**', '**', '강조할 텍스트')}>굵게</button>
      <button type="button" onClick={() => insert('`', '`', '코드')}>인라인 코드</button>
      <button type="button" onClick={() => insert('\n```\n', '\n```\n', '코드 블록')}>코드 블록</button>
      <button type="button" onClick={() => insert('> ', '', '인용문')}>인용</button>
      <button type="button" onClick={() => insert('- [ ] ', '', '할 일')}>체크리스트</button>
      <button type="button" onClick={() => insert('## ', '', '소제목')}>소제목</button>
    </div>
    <textarea ref={textareaRef} id="body" name="body" rows={16} value={value} onChange={(event) => setValue(event.target.value)} placeholder="Markdown으로 본문을 작성하세요." />
    <div className={styles.imageTools} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void uploadImage(event.dataTransfer.files[0]); }}>
      <label>이미지 설명<input value={altText} onChange={(event) => setAltText(event.target.value)} maxLength={160} /></label>
      <label className="secondary">이미지 선택<input type="file" accept="image/*" onChange={(event) => void uploadImage(event.target.files?.[0])} hidden /></label>
      <span>여기로 이미지를 끌어 놓을 수도 있습니다.</span>
    </div>
    {message && <p className={styles.editorMessage} role="status">{message}</p>}
    <details className={styles.preview}><summary>미리보기</summary><div dangerouslySetInnerHTML={{ __html: markdownPreview(value) }} /></details>
    {uploading && <p className={styles.editorMessage}>업로드 중…</p>}
  </div>;
}
