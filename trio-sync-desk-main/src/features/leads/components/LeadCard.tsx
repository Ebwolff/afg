import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lead } from "../services/leadsService";
import { Phone, Instagram, DollarSign, Calendar } from "lucide-react";

interface LeadCardProps {
    lead: Lead;
    onDragStart: (e: React.DragEvent, leadId: string) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onDragStart }) => {
    const formatCurrency = (val: number | null) => {
        if (val === null) return "N/A";
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(val);
    };

    return (
        <Card
            draggable
            onDragStart={(e) => onDragStart(e, lead.id)}
            className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow mb-3 border-l-4 border-l-primary"
        >
            <CardHeader className="p-3 pb-0">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-bold truncate max-w-[150px]">
                        {lead.nome}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] uppercase">
                        {lead.origem || "Direto"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-3 pt-2 text-xs text-muted-foreground space-y-2">
                {lead.whatsapp && (
                    <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-green-500" />
                        <span>{lead.whatsapp}</span>
                    </div>
                )}
                {lead.instagram_handle && (
                    <div className="flex items-center gap-1">
                        <Instagram className="w-3 h-3 text-pink-500" />
                        <span>@{lead.instagram_handle}</span>
                    </div>
                )}
                <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-primary" />
                    <span>{formatCurrency(lead.valor_desejado)}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{lead.tipo_credito || "Consórcio"}</span>
                </div>
            </CardContent>
        </Card>
    );
};
