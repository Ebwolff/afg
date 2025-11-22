import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBanners } from "@/features/banners/hooks/useBanners";
import { ImageUploader } from "@/features/banners/components/ImageUploader";
import { BannerEditor } from "@/features/banners/components/BannerEditor";
import { BannerList } from "@/features/banners/components/BannerList";
import { BannerConfig } from "@/features/banners/types";

export default function Banners() {
    const { banners, createMutation, deleteMutation } = useBanners();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [activeTab, setActiveTab] = useState("criar");

    const handleImageSelect = (file: File) => {
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            setSelectedImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async (config: BannerConfig, canvas: HTMLCanvasElement) => {
        // Converter canvas para base64
        const imagemBase64 = canvas.toDataURL("image/png");

        // Converter canvas para blob para criar um File
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => {
                if (b) resolve(b);
            }, "image/png");
        });

        // Criar um File a partir do blob
        const file = new File([blob], `banner-${Date.now()}.png`, { type: "image/png" });

        await createMutation.mutateAsync({
            titulo: "Novo Banner",
            descricao: "",
            imagem: file,
            imagemBase64: imagemBase64,
            configuracao: config,
        });

        // Resetar estado
        setSelectedImage(null);
        setImageFile(null);
        setActiveTab("listar");
    };

    const handleCancel = () => {
        setSelectedImage(null);
        setImageFile(null);
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Criador de Banners</h1>
                    <p className="text-muted-foreground">
                        Crie banners personalizados com suas imagens e textos
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="criar">Criar Banner</TabsTrigger>
                        <TabsTrigger value="listar">Meus Banners</TabsTrigger>
                    </TabsList>

                    <TabsContent value="criar" className="space-y-6">
                        {!selectedImage ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Selecione uma Imagem</CardTitle>
                                    <CardDescription>
                                        Faça upload de uma imagem para começar a criar seu banner
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ImageUploader onImageSelect={handleImageSelect} />
                                </CardContent>
                            </Card>
                        ) : (
                            <BannerEditor
                                image={selectedImage}
                                onSave={handleSave}
                                onCancel={handleCancel}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="listar" className="space-y-6">
                        <BannerList
                            banners={banners}
                            onEdit={(banner) => {
                                setSelectedImage(banner.imagem_url);
                                setActiveTab("criar");
                            }}
                            onDelete={(id) => deleteMutation.mutate(id)}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </Layout>
    );
}
