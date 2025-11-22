import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Download, Trash2, Edit } from "lucide-react";
import { Banner } from "../types";

interface BannerListProps {
    banners: Banner[] | undefined;
    onEdit: (banner: Banner) => void;
    onDelete: (id: string) => void;
}

export function BannerList({ banners, onEdit, onDelete }: BannerListProps) {
    const handleDownload = (banner: Banner) => {
        const link = document.createElement("a");
        link.download = `${banner.titulo.replace(/\s+/g, "-")}.png`;
        link.href = banner.imagem_url;
        link.click();
    };

    if (!banners || banners.length === 0) {
        return (
            <Card>
                <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                        <p>Nenhum banner criado ainda.</p>
                        <p className="text-sm mt-2">Crie seu primeiro banner usando o editor acima.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {banners.map((banner) => (
                <Card key={banner.id} className="overflow-hidden">
                    <div className="aspect-video relative overflow-hidden bg-muted">
                        <img
                            src={banner.imagem_url}
                            alt={banner.titulo}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-lg">{banner.titulo}</CardTitle>
                        {banner.descricao && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {banner.descricao}
                            </p>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownload(banner)}
                                className="flex-1"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEdit(banner)}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir Banner</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Tem certeza que deseja excluir este banner? Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onDelete(banner.id)}>
                                            Excluir
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
