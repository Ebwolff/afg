import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth, ALL_PERMISSIONS, AppPermission, AppRole } from "@/hooks/useAuth";
import { UserPlus, Shield, Settings2, Loader2 } from "lucide-react";

interface UserProfile {
  id: string;
  nome: string;
  email: string;
  permissions: AppPermission[] | null;
  created_at: string;
  role?: AppRole;
}

export default function Administracao() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<AppPermission[]>([]);
  const [newUser, setNewUser] = useState({ nome: "", email: "", password: "", role: "servicos" as AppRole });
  const [creatingUser, setCreatingUser] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const rolesMap = new Map(roles?.map((r) => [r.user_id, r.role as AppRole]) || []);

      return (profiles || []).map((p) => ({
        ...p,
        permissions: (p.permissions as AppPermission[]) || [],
        role: rolesMap.get(p.id) || ("servicos" as AppRole),
      })) as UserProfile[];
    },
    enabled: isAdmin,
  });

  const handleCreateUser = async () => {
    setCreatingUser(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: { nome: newUser.nome },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      if (data.user) {
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: data.user.id,
          role: newUser.role,
        });
        if (roleError) throw roleError;

        if (newUser.role === "servicos") {
          await supabase
            .from("profiles")
            .update({ permissions: ["dashboard"] })
            .eq("id", data.user.id);
        }
      }

      toast({ title: "Usuário criado com sucesso!" });
      setCreateDialogOpen(false);
      setNewUser({ nome: "", email: "", password: "", role: "servicos" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err: unknown) {
      const error = err as Error;
      toast({ title: "Erro ao criar usuário", description: error.message, variant: "destructive" });
    } finally {
      setCreatingUser(false);
    }
  };

  const updatePermissions = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: AppPermission[] }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ permissions })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Permissões atualizadas!" });
      setPermDialogOpen(false);
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar permissões", description: error.message, variant: "destructive" });
    },
  });

  const openPermissionsDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setSelectedPermissions(user.permissions || []);
    setPermDialogOpen(true);
  };

  const togglePermission = (permId: AppPermission) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const selectAll = () => setSelectedPermissions(ALL_PERMISSIONS.map((p) => p.id));
  const deselectAll = () => setSelectedPermissions([]);

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Acesso restrito a administradores.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Administração</h1>
            <p className="text-muted-foreground">Gerencie usuários e permissões de acesso</p>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateUser();
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Nome completo</Label>
                  <Input
                    value={newUser.nome}
                    onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Perfil</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value: AppRole) => setNewUser({ ...newUser, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="servicos">Serviços</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={creatingUser}>
                  {creatingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cadastrar
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Usuários do Sistema
            </CardTitle>
            <CardDescription>
              {users?.length || 0} usuário(s) cadastrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Carregando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Permissões</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.nome}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role === "admin" ? "Administrador" : "Serviços"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.role === "admin" ? (
                          <span className="text-sm text-muted-foreground">Acesso total</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {user.permissions?.length || 0} módulo(s)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.role !== "admin" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPermissionsDialog(user)}
                          >
                            <Settings2 className="mr-1 h-4 w-4" />
                            Permissões
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={permDialogOpen} onOpenChange={setPermDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Permissões — {selectedUser?.nome}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Selecionar Todos
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Desmarcar Todos
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto">
                {ALL_PERMISSIONS.map((perm) => (
                  <label
                    key={perm.id}
                    className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedPermissions.includes(perm.id)}
                      onCheckedChange={() => togglePermission(perm.id)}
                    />
                    <span className="text-sm font-medium">{perm.label}</span>
                  </label>
                ))}
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  if (selectedUser) {
                    updatePermissions.mutate({
                      userId: selectedUser.id,
                      permissions: selectedPermissions,
                    });
                  }
                }}
                disabled={updatePermissions.isPending}
              >
                {updatePermissions.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Permissões
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
