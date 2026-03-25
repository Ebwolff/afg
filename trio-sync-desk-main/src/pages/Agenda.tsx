import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useClientes } from "@/features/clientes/hooks/useClientes";
import { Clock, User } from "lucide-react";

import { handleSupabaseError } from "@/integrations/supabase/error-handler";

export default function Agenda() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { clientes } = useClientes();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    tipo: "reuniao",
    status: "agendado",
    cliente_id: "none",
    data_inicio: "",
    data_fim: "",
    local: "",
  });

  const { data: eventos } = useQuery({
    queryKey: ["eventos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eventos")
        .select("*")
        .order("data_inicio", { ascending: true });
      if (error) handleSupabaseError(error, "Erro ao carregar eventos");
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const payload = {
        titulo: values.titulo,
        descricao: values.descricao,
        tipo: values.tipo,
        status: values.status,
        local: values.local,
        data_inicio: values.data_inicio,
        data_fim: values.data_fim || null,
        cliente_id: values.cliente_id === "none" ? null : values.cliente_id,
        created_by: user.id
      };

      const { error } = await supabase.from("eventos").insert(payload);
      if (error) handleSupabaseError(error, "Erro ao criar evento");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      toast({ title: "Evento criado com sucesso!" });
      setOpen(false);
      setFormData({
        titulo: "",
        descricao: "",
        tipo: "reuniao",
        status: "agendado",
        cliente_id: "none",
        data_inicio: "",
        data_fim: "",
        local: "",
      });
    },
    onError: (error: Error) => {
      if (error.name !== "AppError") {
        toast({
          title: "Erro ao criar evento",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("eventos")
        .delete()
        .eq("id", id);
      if (error) handleSupabaseError(error, "Erro ao excluir evento");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      toast({ title: "Evento excluído com sucesso!" });
    },
    onError: (error: Error) => {
      if (error.name !== "AppError") {
        toast({
          title: "Erro ao excluir evento",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "reuniao":
        return "default";
      case "acao_venda":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Agenda</h1>
            <p className="text-muted-foreground">
              Programação de reuniões e ações
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Evento</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createMutation.mutate(formData);
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={formData.titulo}
                    onChange={(e) =>
                      setFormData({ ...formData, titulo: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) =>
                      setFormData({ ...formData, tipo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reuniao">Reunião</SelectItem>
                      <SelectItem value="acao_venda">Ação de Venda</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vincular a Cliente (Opcional)</Label>
                  <Select
                    value={formData.cliente_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, cliente_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {clientes?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Início</Label>
                    <Input
                      type="datetime-local"
                      value={formData.data_inicio}
                      onChange={(e) =>
                        setFormData({ ...formData, data_inicio: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fim (Opcional)</Label>
                    <Input
                      type="datetime-local"
                      value={formData.data_fim}
                      onChange={(e) =>
                        setFormData({ ...formData, data_fim: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Local</Label>
                  <Input
                    value={formData.local}
                    onChange={(e) =>
                      setFormData({ ...formData, local: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.descricao}
                    onChange={(e) =>
                      setFormData({ ...formData, descricao: e.target.value })
                    }
                  />
                </div>
                <Button type="submit" className="w-full">
                  Criar Evento
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Esquerda: Calendário e Filtros */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3 text-center">
                <CardTitle className="text-lg">Visualizar Data</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border shadow-sm w-fit"
                  modifiers={{
                    hasEvent: (date) => eventos?.some(e => isSameDay(new Date(e.data_inicio), date)) || false
                  }}
                  modifiersStyles={{
                    hasEvent: { fontWeight: 'bold', border: '1px solid var(--primary)', color: 'var(--primary)' }
                  }}
                />
                <div className="mt-4 flex w-full justify-between px-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
                    Hoje
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDate(undefined)}>
                    Todas as Datas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Direita: Lista de Eventos */}
          <div className="lg:col-span-2 space-y-4">
            {(() => {
              const eventosFiltrados = eventos?.filter(e => 
                !selectedDate || isSameDay(new Date(e.data_inicio), selectedDate)
              ) || [];

              if (eventosFiltrados.length === 0) {
                return (
                  <Card className="border-dashed bg-muted/20">
                    <CardContent className="pt-8 pb-8 flex flex-col items-center">
                      <CalendarIcon className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
                      <p className="text-center text-muted-foreground font-medium">
                        Nenhum evento agendado {selectedDate ? `para ${format(selectedDate, "dd/MM/yyyy")}` : "no sistema"}.
                      </p>
                    </CardContent>
                  </Card>
                );
              }

              return eventosFiltrados.map((evento) => {
                const isPast = new Date(evento.data_inicio) < new Date() && evento.status !== 'realizado';
                const clienteLabel = clientes?.find(c => c.id === evento.cliente_id)?.nome;

                return (
                  <Card key={evento.id} className={isPast ? "opacity-75" : ""}>
                    <CardHeader className="pb-3 border-b bg-muted/10">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isPast ? 'bg-muted' : 'bg-primary/10 text-primary'}`}>
                            <CalendarIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {evento.titulo}
                              {isPast && <Badge variant="destructive" className="text-[10px]">Em Atraso</Badge>}
                              {evento.status === 'realizado' && <Badge variant="default" className="text-[10px] bg-green-500 hover:bg-green-600">Realizado</Badge>}
                              {evento.status === 'cancelado' && <Badge variant="secondary" className="text-[10px]">Cancelado</Badge>}
                            </CardTitle>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {format(new Date(evento.data_inicio), "PPP 'às' p", { locale: ptBR })}
                                {evento.data_fim && ` - ${format(new Date(evento.data_fim), "p")}`}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getTipoColor(evento.tipo)}>
                            {evento.tipo === "reuniao" ? "Reunião" : evento.tipo === "acao_venda" ? "Ação de Venda" : "Outro"}
                          </Badge>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-50 hover:opacity-100">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  O evento <strong>{evento.titulo}</strong> será permanentemente excluído do sistema.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(evento.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      {clienteLabel && (
                        <div className="flex items-center text-sm text-blue-700 bg-blue-50 dark:bg-blue-950/30 p-2 rounded-md border border-blue-100 dark:border-blue-900 w-max">
                          <User className="h-4 w-4 mr-2" />
                          <span>Cliente: <span className="font-semibold">{clienteLabel}</span></span>
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-2">
                        {evento.local && (
                          <p className="text-sm">
                            <span className="font-medium text-muted-foreground">Local:</span> {evento.local}
                          </p>
                        )}
                        {evento.descricao && (
                          <p className="text-sm bg-muted/40 p-3 rounded-md">
                            {evento.descricao}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </Layout>
  );
}
