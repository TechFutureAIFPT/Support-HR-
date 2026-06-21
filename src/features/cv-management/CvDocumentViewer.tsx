import React, { useEffect, useRef, useState } from 'react';
import { Download, FileSearch, Minus, Plus, RotateCw, Upload } from 'lucide-react';
import type { Candidate } from '@/types';
import type { StoredCvDocument } from '@/types/workspace';
import { findCvDocument, storeCvFiles } from '@/services/workspace/cvDocumentStore';

interface CvDocumentViewerProps {
  ownerKey: string;
  candidate: Candidate;
}

type ViewerKind = 'pdf' | 'docx' | 'image' | 'text' | 'unknown';

function getKind(document: StoredCvDocument | null, candidate: Candidate): ViewerKind {
  if (document) {
    const name = document.fileName.toLowerCase();
    const mime = document.mimeType || '';
    if (mime.includes('pdf') || name.endsWith('.pdf')) return 'pdf';
    if (mime.includes('word') || name.endsWith('.docx')) return 'docx';
    if (mime.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(name)) return 'image';
  }
  if (candidate._cvText?.trim()) return 'text';
  return 'unknown';
}

const CvDocumentViewer: React.FC<CvDocumentViewerProps> = ({ ownerKey, candidate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const docxRef = useRef<HTMLDivElement | null>(null);
  const [document, setDocument] = useState<StoredCvDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [objectUrl, setObjectUrl] = useState('');
  const kind = getKind(document, candidate);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setPageNumber(1);
    setZoom(1);
    void findCvDocument(ownerKey, candidate.fileName)
      .then((record) => { if (active) setDocument(record); })
      .catch(() => { if (active) setDocument(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [candidate.fileName, ownerKey]);

  useEffect(() => {
    if (!document || kind !== 'image') {
      setObjectUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(document.blob);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [document, kind]);

  useEffect(() => {
    if (!document || kind !== 'pdf' || !canvasRef.current) return undefined;
    let cancelled = false;
    let renderTask: { cancel: () => void } | null = null;
    let pdfDocument: any = null;

    const renderPdf = async () => {
      try {
        setLoading(true);
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
        const data = await document.blob.arrayBuffer();
        pdfDocument = await pdfjs.getDocument({ data }).promise;
        if (cancelled || !pdfDocument) return;
        setPageCount(pdfDocument.numPages);
        const safePage = Math.min(pageNumber, pdfDocument.numPages);
        const page = await pdfDocument.getPage(safePage);
        if (cancelled || !canvasRef.current) return;
        const viewport = page.getViewport({ scale: zoom * 1.25, rotation });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * ratio);
        canvas.height = Math.floor(viewport.height * ratio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        renderTask = page.render({ canvasContext: context, viewport });
        await (renderTask as any).promise;
        setError('');
      } catch (cause) {
        if (!cancelled && (cause as { name?: string })?.name !== 'RenderingCancelledException') {
          setError('Không thể hiển thị file PDF này. Bạn vẫn có thể tải file về thiết bị.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void renderPdf();
    return () => {
      cancelled = true;
      renderTask?.cancel();
      if (typeof pdfDocument?.destroy === 'function') void pdfDocument.destroy();
    };
  }, [document, kind, pageNumber, rotation, zoom]);

  useEffect(() => {
    if (!document || kind !== 'docx' || !docxRef.current) return undefined;
    let active = true;
    setLoading(true);
    setError('');
    docxRef.current.innerHTML = '';
    void import('docx-preview')
      .then(({ renderAsync }) => renderAsync(document.blob, docxRef.current!, undefined, {
        className: 'apple-docx-page',
        inWrapper: true,
        ignoreWidth: true,
        ignoreHeight: true,
        breakPages: false,
      }))
      .catch(() => { if (active) setError('Không thể dựng bố cục DOCX. Hệ thống sẽ dùng nội dung đã trích xuất.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [document, kind]);

  const reattach = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const [record] = await storeCvFiles(ownerKey, [file]);
      setDocument(record || null);
      setError('');
    } catch (cause) {
      setError(cause instanceof DOMException && cause.name === 'QuotaExceededError'
        ? 'Thiết bị không còn đủ dung lượng để lưu CV này.'
        : 'Không thể lưu file CV trên thiết bị.');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const download = () => {
    if (!document) return;
    const url = URL.createObjectURL(document.blob);
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = document.fileName;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 500);
  };

  return (
    <section className="flex h-full min-h-0 flex-col bg-[#f5f5f7]" aria-label="Trình xem CV">
      <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-[#d2d2d7] bg-white px-3">
        <p className="min-w-0 truncate text-[12px] font-medium text-[#515154]">{document?.fileName || candidate.fileName || 'Hồ sơ ứng viên'}</p>
        <div className="flex shrink-0 items-center gap-1">
          {kind === 'pdf' ? (
            <>
              <button type="button" onClick={() => setPageNumber((value) => Math.max(1, value - 1))} disabled={pageNumber <= 1} className="apple-toolbar-icon !h-8 !w-8" aria-label="Trang trước">‹</button>
              <span className="min-w-[54px] text-center text-[11px] text-[#6e6e73]">{pageNumber} / {pageCount}</span>
              <button type="button" onClick={() => setPageNumber((value) => Math.min(pageCount, value + 1))} disabled={pageNumber >= pageCount} className="apple-toolbar-icon !h-8 !w-8" aria-label="Trang sau">›</button>
              <button type="button" onClick={() => setZoom((value) => Math.max(0.65, value - 0.1))} className="apple-toolbar-icon !h-8 !w-8" aria-label="Thu nhỏ"><Minus size={14} /></button>
              <span className="w-10 text-center text-[11px] text-[#6e6e73]">{Math.round(zoom * 100)}%</span>
              <button type="button" onClick={() => setZoom((value) => Math.min(2, value + 0.1))} className="apple-toolbar-icon !h-8 !w-8" aria-label="Phóng to"><Plus size={14} /></button>
              <button type="button" onClick={() => setRotation((value) => (value + 90) % 360)} className="apple-toolbar-icon !h-8 !w-8" aria-label="Xoay trang"><RotateCw size={14} /></button>
            </>
          ) : null}
          {document ? <button type="button" onClick={download} className="apple-toolbar-icon !h-8 !w-8" aria-label="Tải CV"><Download size={14} /></button> : null}
          {!document ? (
            <label className="apple-toolbar-button !h-8 cursor-pointer !px-2.5 text-[11px]">
              <Upload size={13} /> <span className="hidden sm:inline">Gắn file</span>
              <input type="file" accept=".pdf,.docx,.png,.jpg,.jpeg" className="sr-only" onChange={reattach} />
            </label>
          ) : null}
        </div>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-auto p-3 sm:p-5">
        {error ? <div className="mb-3 rounded-lg border border-[#f4d6a5] bg-[#fff7e8] px-3 py-2 text-[12px] text-[#a35d00]">{error}</div> : null}
        {loading ? <p className="py-10 text-center text-[12px] text-[#86868b]">Đang chuẩn bị tài liệu…</p> : null}
        {kind === 'pdf' && document ? <div className="flex min-w-max justify-center"><canvas ref={canvasRef} className="bg-white shadow-[0_2px_12px_rgba(29,29,31,0.12)]" /></div> : null}
        {kind === 'docx' && document ? <div ref={docxRef} className="apple-docx-viewer mx-auto" /> : null}
        {kind === 'image' && objectUrl ? <img src={objectUrl} alt={`CV của ${candidate.candidateName}`} className="mx-auto max-w-full bg-white shadow-[0_2px_12px_rgba(29,29,31,0.12)]" /> : null}
        {(kind === 'text' || (kind === 'docx' && error)) && candidate._cvText ? (
          <article className="mx-auto min-h-[70vh] max-w-[760px] whitespace-pre-wrap bg-white p-8 text-[13px] leading-6 text-[#3a3a3c] shadow-[0_2px_12px_rgba(29,29,31,0.1)] sm:p-12">{candidate._cvText}</article>
        ) : null}
        {kind === 'unknown' ? (
          <div className="mx-auto flex min-h-[360px] max-w-md flex-col items-center justify-center text-center">
            <FileSearch size={32} className="text-[#86868b]" strokeWidth={1.5} />
            <h3 className="mt-4 text-[15px] font-semibold text-[#1d1d1f]">Chưa có file CV gốc trên thiết bị</h3>
            <p className="mt-1 text-[12px] leading-5 text-[#6e6e73]">Phiên cũ chỉ lưu nội dung đã trích xuất. Gắn lại file để xem đúng bố cục tài liệu.</p>
            <label className="mt-5 inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-[#007aff] bg-white px-3 text-[13px] font-medium text-[#0066d6] hover:bg-[#eef5ff]">
              <Upload size={15} /> Gắn lại file
              <input type="file" accept=".pdf,.docx,.png,.jpg,.jpeg" className="sr-only" onChange={reattach} />
            </label>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default CvDocumentViewer;
