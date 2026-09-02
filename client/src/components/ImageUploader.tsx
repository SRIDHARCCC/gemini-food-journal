import React, { useRef, useState } from "react";
import { Camera, X, Image as ImageIcon } from "lucide-react";

interface ImageUploaderProps {
  onImageSelected: (base64: string | null, mimeType: string) => void;
  selectedImageBase64: string | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelected,
  selectedImageBase64,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (JPEG, PNG, WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Compress / resize image to keep payloads lightweight & fast
        const canvas = document.createElement("canvas");
        const maxDimension = 1024;
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);
          onImageSelected(compressedBase64, "image/jpeg");
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {selectedImageBase64 ? (
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-md group">
          <img
            src={selectedImageBase64}
            alt="Plate upload preview"
            className="w-full h-48 sm:h-56 object-cover opacity-90 group-hover:opacity-100 transition-opacity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 flex flex-col justify-between p-3">
            <div className="flex justify-between items-center">
              <span className="px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-medium backdrop-blur-sm flex items-center space-x-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>Plate Image Attached</span>
              </span>
              <button
                type="button"
                onClick={() => onImageSelected(null, "image/jpeg")}
                className="p-1.5 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors backdrop-blur-sm"
                title="Remove Image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-[11px] text-slate-200">
              Gemini 3.7 Flash will visually recognize ingredients & portions from this plate.
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            dragOver
              ? "border-blue-500 bg-blue-50/50"
              : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
          }`}
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <Camera className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-800">
            Take a photo or upload meal image
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Drag & drop plate picture here, or click to browse (JPEG / PNG)
          </p>
        </div>
      )}
    </div>
  );
};
