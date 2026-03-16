"use client";

type PhotoField = "photo1Key" | "photo2Key" | "photo3Key" | "photo4Key";
type PhotoUrlField = "photo1Url" | "photo2Url" | "photo3Url" | "photo4Url";

interface PhotoGridProps {
  profile: {
    photo1Url: string | null;
    photo2Url: string | null;
    photo3Url: string | null;
    photo4Url: string | null;
  };
  onPhotoUpdate: (photoField: PhotoField, file: File) => void;
}

const PHOTO_FIELDS: { urlField: PhotoUrlField; keyField: PhotoField; label: string }[] = [
  { urlField: "photo1Url", keyField: "photo1Key", label: "メイン" },
  { urlField: "photo2Url", keyField: "photo2Key", label: "サブ" },
  { urlField: "photo3Url", keyField: "photo3Key", label: "" },
  { urlField: "photo4Url", keyField: "photo4Key", label: "" },
];

export default function PhotoGrid({ profile, onPhotoUpdate }: PhotoGridProps) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-sm font-semibold text-gray-700">写真</h3>
        <span className="text-[11px] text-gray-400">タップして変更</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {PHOTO_FIELDS.map(({ urlField, keyField, label }) => {
          const url = profile[urlField];
          return (
            <label key={urlField} className="relative aspect-square overflow-hidden rounded-xl bg-gray-100 cursor-pointer group">
              {url ? (
                <>
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="none" className="opacity-0 group-hover:opacity-80 transition-opacity drop-shadow">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M15 12l-6 4V8l6 4z" fill="#666" />
                    </svg>
                  </div>
                </>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-0.5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onPhotoUpdate(keyField, f); }} />
              {label && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1">
                  <span className="text-[9px] text-white font-medium">{label}</span>
                </div>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
