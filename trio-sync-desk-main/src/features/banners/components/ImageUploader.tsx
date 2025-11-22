import { useCallback, useState } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
    onImageSelect: (file: File) => void;
    currentImage?: string;
}

export function ImageUploader({ onImageSelect, currentImage }: ImageUploaderProps) {
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith("image/")) {
                onImageSelect(file);
            }
        }
    }, [onImageSelect]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            onImageSelect(e.target.files[0]);
        }
    }, [onImageSelect]);

    return (
        <div
            className={cn(
                "relative border-2 border-dashed rounded-lg p-8 transition-colors",
                dragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25",
                "hover:border-primary hover:bg-primary/5"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            <input
                type="file"
                id="image-upload"
                className="hidden"
                accept="image/*"
                onChange={handleChange}
            />
            <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center cursor-pointer"
            >
                {currentImage ? (
                    <div className="space-y-4 text-center">
                        <img
                            src={currentImage}
                            alt="Preview"
                            className="max-h-64 mx-auto rounded-lg"
                        />
                        <p className="text-sm text-muted-foreground">
                            Clique ou arraste para alterar a imagem
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 text-center">
                        <div className="flex justify-center">
                            {dragActive ? (
                                <Upload className="h-12 w-12 text-primary" />
                            ) : (
                                <ImageIcon className="h-12 w-12 text-muted-foreground" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-medium">
                                Clique para selecionar ou arraste uma imagem
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                PNG, JPG ou WEBP (máx. 10MB)
                            </p>
                        </div>
                    </div>
                )}
            </label>
        </div>
    );
}
