import { supabase } from '../../utils/supabase';

interface UseFileActionsProps {
    setCustomFiles: React.Dispatch<React.SetStateAction<any[]>>;
    showToast: (message: string, type?: "success" | "error" | "info") => void;
    user: any;
}

export const useFileActions = ({ setCustomFiles, showToast, user }: UseFileActionsProps) => {
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
                const { data, error: uploadError } = await supabase.storage
                    .from('trip-files')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // 3. Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('trip-files')
                    .getPublicUrl(filePath);

                newFiles.push({
                    id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    name: file.name,
                    type: file.type.includes("pdf") ? "pdf" : "image",
                    data: publicUrl, // Now storing the URL instead of Base64
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
            setCustomFiles((prev: any) => [...prev, ...newFiles]);
            showToast(`${newFiles.length}건의 서류가 서버에 안전하게 업로드되었습니다.`, "success");
        }
    };

    const deleteFile = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();

        setCustomFiles((prev: any) => {
            const fileToDelete = prev.find((f: any) => f.id === id);

            // If it's a storage file, try to delete from Supabase storage too
            if (fileToDelete?.path) {
                supabase.storage.from('trip-files').remove([fileToDelete.path])
                    .then(({ error }) => {
                        if (error) console.error("Failed to delete file from storage:", error);
                    });
            }

            return prev.filter((f: any) => f.id !== id);
        });
    };

    return {
        handleFileUpload,
        deleteFile
    };
};
