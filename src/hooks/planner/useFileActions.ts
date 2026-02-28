import { supabase } from '../../utils/supabase';

interface UseFileActionsProps {
    setCustomFiles: React.Dispatch<React.SetStateAction<any[]>>;
    showToast: (message: string, type?: "success" | "error" | "info") => void;
    user: any;
    saveTripToSupabase?: (targetTrip: any, isImmediate?: boolean, overrides?: any) => Promise<void>;
    trip?: any;
    currentFiles: any[];
}

export const useFileActions = ({ setCustomFiles, showToast, user, saveTripToSupabase, trip, currentFiles }: UseFileActionsProps) => {
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | File[], linkedTo?: string) => {
        if (!user) {
            showToast("로그인이 필요한 기능입니다.", "error");
            return;
        }

        let files: File[] = [];
        if (Array.isArray(e)) {
            files = e;
        } else if (e && "target" in e && e.target.files) {
            files = Array.from(e.target.files);
        }

        if (files.length === 0) return;

        const newFiles: any[] = [];

        for (const file of files) {
            try {
                // 1. Generate unique file path
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;

                // 2. Upload to Supabase Storage
                const { error: uploadError } = await supabase.storage
                    .from('trip-files')
                    .upload(filePath, file, {
                        contentType: file.type || 'application/octet-stream',
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) throw uploadError;

                // 3. Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('trip-files')
                    .getPublicUrl(filePath);

                const isPdf = file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf");
                const isHtml = file.type.includes("html") || file.name.toLowerCase().endsWith(".html") || file.name.toLowerCase().endsWith(".htm");

                newFiles.push({
                    id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    name: file.name,
                    type: isPdf ? "pdf" : isHtml ? "html" : "image",
                    data: publicUrl, // Now storing the URL instead of Base64
                    url: publicUrl,  // Added for consistency with HtmlPreview
                    path: filePath,  // Keeping path for deletion
                    linkedTo,
                    date: new Date().toISOString(),
                });
            } catch (err: any) {
                console.error("Upload error:", err);
                showToast(`${file.name} 업로드 실패: ${err.message || '알 수 없는 오류'}`, "error");
            }
        }

        if (newFiles.length > 0) {
            const updatedFiles = [...currentFiles, ...newFiles];
            setCustomFiles(updatedFiles);
            showToast(`${newFiles.length}건의 서류가 서버에 안전하게 업로드되었습니다.`, "success");

            // 🚀 Persist new files to DB immediately
            if (saveTripToSupabase && trip) {
                await saveTripToSupabase(trip, true, { customFiles: updatedFiles });
            }
        }
    };

    const deleteFile = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();

        console.log("🗑️ Starting deletion for file ID:", id);

        // 1. Calculate the NEW list FIRST (Atomically)
        const updatedFiles = currentFiles.filter((f: any) => f.id !== id);

        console.log(`🗑️ File Count: ${currentFiles.length} -> ${updatedFiles.length}`);

        // 2. Locate the file to delete from storage
        const fileToDelete = currentFiles.find((f: any) => f.id === id);

        // 3. Update local UI state immediately
        setCustomFiles(updatedFiles);

        // 4. Update Server IMMEDIATELY with the SPECIFIC updated list
        if (saveTripToSupabase && trip) {
            console.log("💾 Triggering immediate sync to server with updated list...");
            await saveTripToSupabase(trip, true, { customFiles: updatedFiles });
        }

        // 5. Clean up Storage (Background)
        if (fileToDelete?.path) {
            supabase.storage.from('trip-files').remove([fileToDelete.path])
                .then(({ error }) => {
                    if (error) console.error("⚠️ Storage Cleanup Failed:", error);
                    else console.log("✅ Storage Cleanup Success");
                });
        }

        showToast("파일이 제거되었습니다.");
    };

    return {
        handleFileUpload,
        deleteFile
    };
};
