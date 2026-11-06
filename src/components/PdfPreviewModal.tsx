import React, { useState, useEffect } from 'react';
import { X, FileDown, Eye, Loader2 } from 'lucide-react';
import type { Registration, Forum, EventMasterInfo, ForumInvitationTemplate } from '../types/index.ts';
import { getPdfDataUrl, downloadInvitationPdf } from '../utils/pdfGenerator.ts';

interface PdfPreviewModalProps {
  isOpen: boolean;
  registration: Registration;
  forum: Forum;
  eventInfo: EventMasterInfo;
  template?: ForumInvitationTemplate | null;
  onClose: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  registration,
  forum,
  eventInfo,
  template,
  onClose,
}) => {
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;
    if (isOpen) {
      setLoading(true);
      getPdfDataUrl({
        registration,
        forum,
        eventInfo,
        template,
      })
        .then((url) => {
          if (active) {
            setPdfDataUrl(url);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error('Failed to generate PDF preview:', err);
          if (active) setLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [isOpen, registration, forum, eventInfo, template]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadInvitationPdf({
        registration,
        forum,
        eventInfo,
        template,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col h-[90vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-400" />
              <span>Official Invitation PDF Preview: {forum.name}</span>
            </h3>
            <p className="text-xs text-indigo-200">
              Reg ID: <strong className="font-mono">{registration.registration_number}</strong> • Participant: {registration.full_name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>{downloading ? 'Downloading...' : 'Download PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Body */}
        <div className="flex-1 bg-slate-100 p-2 sm:p-4 overflow-hidden flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-xs font-semibold">Generating formal invitation preview...</p>
            </div>
          ) : pdfDataUrl ? (
            <iframe
              src={pdfDataUrl}
              title="Invitation PDF Preview"
              className="w-full h-full rounded-xl border border-slate-300 shadow-inner bg-white"
            />
          ) : (
            <div className="text-center p-6 text-slate-500 text-xs">
              Preview generation failed. Please use direct download.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
