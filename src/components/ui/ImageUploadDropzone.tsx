'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, UploadCloud, CheckCircle2, Sparkles, X, Image as ImageIcon, RefreshCw, AlertCircle } from 'lucide-react';
import { smartCompressImage, formatBytes, CompressionResult } from '@/lib/image-compressor';

interface ImageUploadDropzoneProps {
  name: string;
  label?: string;
  optional?: boolean;
  onFileChange?: (file: File | null, result: CompressionResult | null) => void;
  className?: string;
  required?: boolean;
}

export function ImageUploadDropzone({
  name,
  label = 'Photo',
  optional = true,
  onFileChange,
  className = '',
  required = false,
}: ImageUploadDropzoneProps) {
  const [isCompressing, setIsCompressing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hiddenFormInputRef = useRef<HTMLInputElement>(null);

  // Synchronize the compressed file into the hidden input for native FormData compatibility
  useEffect(() => {
    if (hiddenFormInputRef.current) {
      if (result?.file && typeof DataTransfer !== 'undefined') {
        const dt = new DataTransfer();
        dt.items.add(result.file);
        hiddenFormInputRef.current.files = dt.files;
      } else {
        hiddenFormInputRef.current.value = '';
      }
    }
  }, [result]);

  const processFile = async (rawFile: File) => {
    setErrorMsg(null);
    if (!rawFile.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WebP)');
      return;
    }

    setIsCompressing(true);
    try {
      const compResult = await smartCompressImage(rawFile);
      setResult(compResult);
      if (onFileChange) {
        onFileChange(compResult.file, compResult);
      }
    } catch (err) {
      console.error('Image compression failed:', err);
      // Graceful fallback to original file
      const fallbackResult: CompressionResult = {
        file: rawFile,
        originalFile: rawFile,
        originalSize: rawFile.size,
        compressedSize: rawFile.size,
        originalWidth: 0,
        originalHeight: 0,
        width: 0,
        height: 0,
        format: (rawFile.type as any) || 'image/jpeg',
        savedBytes: 0,
        savedPercent: 0,
        isCompressed: false,
        isGraphicOrScreenshot: false,
        compressionTimeMs: 0,
        previewUrl: URL.createObjectURL(rawFile),
      };
      setResult(fallbackResult);
      if (onFileChange) {
        onFileChange(rawFile, fallbackResult);
      }
    } finally {
      setIsCompressing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    if (result?.previewUrl) {
      URL.revokeObjectURL(result.previewUrl);
    }
    setResult(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (hiddenFormInputRef.current) hiddenFormInputRef.current.value = '';
    if (onFileChange) {
      onFileChange(null, null);
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Hidden input tied to form submit via DataTransfer */}
      <input
        ref={hiddenFormInputRef}
        type="file"
        name={name}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        required={required && !result}
      />

      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {label} {optional ? '(optional)' : '*'}
        </label>
        {result && (
          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <Sparkles size={11} /> Smart Compressed
          </span>
        )}
      </div>

      {/* UI State: No file selected */}
      {!result && !isCompressing && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative border border-dashed rounded-xl p-3.5 sm:p-4 text-center cursor-pointer transition-all duration-200 ${
            dragOver
              ? 'border-primary bg-primary/10 scale-[1.01]'
              : 'border-white/15 hover:border-primary/50 bg-secondary/30 hover:bg-secondary/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleInputChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
            <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-primary">
              <Camera size={18} />
            </div>
            <div className="text-xs font-medium text-foreground">
              Click to select or drag & drop image
            </div>
            <p className="text-[11px] text-muted-foreground">
              JPG, PNG, or WebP &bull; Smart client-side compression will optimize size automatically
            </p>
          </div>
        </div>
      )}

      {/* UI State: Compressing in progress */}
      {isCompressing && (
        <div className="border border-primary/30 rounded-xl p-4 bg-primary/5 text-center flex flex-col items-center justify-center gap-2 animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <div className="text-xs font-semibold text-primary flex items-center gap-1.5">
            <Sparkles size={13} className="animate-spin" />
            Optimizing & Compressing Image...
          </div>
          <p className="text-[11px] text-muted-foreground">
            Preserving visual clarity, applying WebP compression, and adjusting orientation
          </p>
        </div>
      )}

      {/* UI State: Compressed File Ready with Visual Stats */}
      {result && !isCompressing && (
        <div className="glass-card rounded-xl p-3 border border-emerald-500/30 bg-emerald-500/5 space-y-2.5">
          <div className="flex items-start gap-3">
            {/* Thumbnail Preview */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.previewUrl}
                alt="Upload preview"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[9px] font-mono text-white/90 uppercase">
                {result.format.replace('image/', '')}
              </span>
            </div>

            {/* Stats & Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold text-foreground truncate flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                  <span className="truncate">{result.file.name}</span>
                </span>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-1 rounded-md text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Remove image"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Before vs After Sizes */}
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground line-through font-mono text-[11px]">
                  {formatBytes(result.originalSize)}
                </span>
                <span className="text-muted-foreground text-[10px]">&rarr;</span>
                <span className="font-bold text-emerald-400 font-mono text-[11px]">
                  {formatBytes(result.compressedSize)}
                </span>

                {result.savedPercent > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                    -{result.savedPercent}% saved
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium text-[10px]">
                    Already optimal
                  </span>
                )}
              </div>

              {/* Badges & Meta */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                {result.width > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono">
                    {result.width}&times;{result.height}
                  </span>
                )}
                {result.isGraphicOrScreenshot && (
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    High-Res Graphic Mode
                  </span>
                )}
                <span className="text-muted-foreground/70">
                  Ready for fast upload ({result.compressionTimeMs}ms)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-1.5 text-xs text-rose-400">
          <AlertCircle size={13} /> {errorMsg}
        </div>
      )}
    </div>
  );
}
