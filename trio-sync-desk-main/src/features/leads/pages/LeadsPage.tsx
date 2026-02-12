import React from "react";
import { Layout } from "@/components/Layout";
import { LeadKanban } from "../components/LeadKanban";
import { CreateLeadDialog } from "../components/CreateLeadDialog";
import { Button } from "@/components/ui/button";
import { Filter, Download } from "lucide-react";

const LeadsPage = () => {
    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            Gestão de Leads
                        </h1>
                        <p className="text-muted-foreground">
                            Acompanhe o funil de vendas e conversão de consórcios.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                            <Filter className="w-4 h-4" />
                            Filtrar
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Download className="w-4 h-4" />
                            Exportar
                        </Button>
                        <CreateLeadDialog />
                    </div>
                </div>

                <LeadKanban />
            </div>
        </Layout>
    );
};

export default LeadsPage;
