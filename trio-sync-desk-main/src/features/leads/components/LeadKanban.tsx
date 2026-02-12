import React from "react";
import { LeadCard } from "./LeadCard";
import { useLeads } from "../hooks/useLeads";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export const LeadKanban: React.FC = () => {
    const { leads, stages, isLoading, updateStatus } = useLeads();

    const onDragStart = (e: React.DragEvent, leadId: string) => {
        e.dataTransfer.setData("leadId", leadId);
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const onDrop = (e: React.DragEvent, stageName: string) => {
        const leadId = e.dataTransfer.getData("leadId");
        updateStatus({ leadId, status: stageName });
    };

    if (isLoading) {
        return (
            <div className="flex gap-4 p-4 overflow-x-auto">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="min-w-[300px] w-[300px] space-y-4">
                        <Skeleton className="h-8 w-[200px]" />
                        <Skeleton className="h-[150px] w-full" />
                        <Skeleton className="h-[150px] w-full" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <div className="flex gap-4 p-4 min-h-[70vh]">
                {stages.map((stage) => {
                    const stageLeads = leads.filter((l) => l.status === stage.nome);

                    return (
                        <div
                            key={stage.id}
                            className="min-w-[300px] w-[300px] bg-muted/30 rounded-lg p-3 flex flex-col"
                            onDragOver={onDragOver}
                            onDrop={(e) => onDrop(e, stage.nome)}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: stage.cor || "#ccc" }}
                                    />
                                    {stage.nome}
                                    <span className="ml-1 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                                        {stageLeads.length}
                                    </span>
                                </h3>
                            </div>

                            <div className="flex-1 space-y-3">
                                {stageLeads.map((lead) => (
                                    <LeadCard key={lead.id} lead={lead} onDragStart={onDragStart} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
};
