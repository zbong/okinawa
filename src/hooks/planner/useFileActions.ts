import { fileToBase64 } from '../../utils/ocr';

interface UseFileActionsProps {
    setCustomFiles: React.Dispatch<React.SetStateAction<any[]>>;
    showToast: (message: string, type?: "success" | "error" | "info") => void;
}

export const useFileActions = ({ setCustomFiles, showToast }: UseFileActionsProps) => {
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | File[], linkedTo?: string) => {
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
                const base64 = await fileToBase64(file);
                newFiles.push({
                    id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    name: file.name,
                    type: file.type.includes("pdf") ? "pdf" : "image",
                    data: base64,
                    linkedTo,
                    date: new Date().toISOString(),
                });
            } catch (err) {
                showToast(`${file.name} 업로드 실패`, "error");
            }
        }

        if (newFiles.length > 0) {
            setCustomFiles((prev: any) => [...prev, ...newFiles]);
            showToast(`${newFiles.length}건의 서류가 업로드되었습니다.`, "success");
        }
    };

    const deleteFile = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCustomFiles((prev: any) => prev.filter((f: any) => f.id !== id));
    };

    return {
        handleFileUpload,
        deleteFile
    };
};
