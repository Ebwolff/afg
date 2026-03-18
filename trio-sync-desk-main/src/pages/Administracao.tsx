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
import { useAuth, ALL_PERMISSIONS, AppPermission, CustomRole } from "@/hooks/useAuth";
import { UserPlus, Shield, Settings2, Loader2, Pencil, Trash2 } from "lucide-react";

interface UserProfile {
  id: string;
  nome: string;
  email: string;
  created_at: string;
  role_id: string | null;
  role_name: string;
  role_display_name: string;
  role_permissions: string[];
}

export default function Administracao() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [newUser, setNewUser] = useState({ nome: "", email: "", password: "", role: "" });
  const [creatingUser, setCreatingUser] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<{ id: string; nome: string; roleId: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Buscar roles dinâmicas
  const { data: customRoles } = useQuery({
    queryKey: ["custom-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_roles")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data || []) as CustomRole[];
    },
    enabled: isAdmin,
  });

  // Buscar usuários com role via JOIN
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, nome, email, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role_id, role, custom_role:role_id(id, name, display_name, permissions)");

      const rolesMap = new Map<string, { role_id: string | null; role_name: string; role_display_name: string; role_permissions: string[] }>();

      roles?.forEach((r) => {
        const cr = r.custom_role && !Array.isArray(r.custom_role) ? r.custom_role : null;
        rolesMap.set(r.user_id, {
          role_id: cr?.id || null,
          role_name: cr?.name || r.role || "servicos",
          role_display_name: cr?.display_name || (r.role === "admin" ? "Administrador" : "Serviços"),
          role_permissions: (cr?.permissions as string[]) || [],
        });
      });

      return (profiles || []).map((p) => ({
        ...p,
        ...rolesMap.get(p.id) || { role_id: null, role_name: "servicos", role_display_name: "Serviços", role_permissions: [] },
      })) as UserProfile[];
    },
    enabled: isAdmin,
  });

  const handleCreateUser = async () => {
    setCreatingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: {
          email: newUser.email,
          password: newUser.password,
          nome: newUser.nome,
          role: newUser.role || "servicos",
          roleId: newUser.role, // Envia o role_id
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Usuário criado com sucesso!" });
      setCreateDialogOpen(false);
      setNewUser({ nome: "", email: "", password: "", role: "" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err: unknown) {
      const error = err as Error;
      toast({ title: "Erro ao criar usuário", description: error.message, variant: "destructive" });
    } finally {
      setCreatingUser(false);
    }
  };

  // Alterar role do usuário
  const updateUserRole = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      // Encontrar a role para pegar o name (necessário para o campo legacy)
      const role = customRoles?.find((r) => r.id === roleId);
      if (!role) throw new Error("Role não encontrada");

      const { error } = await supabase
        .from("user_roles")
        .update({ role_id: roleId, role: role.name })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, nome, roleId }: { id: string; nome: string; roleId: string }) => {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ nome })
        .eq("id", id);
      if (profileError) throw profileError;

      await updateUserRole.mutateAsync({ userId: id, roleId });
    },
    onSuccess: () => {
      toast({ title: "Usuário atualizado!" });
      setEditDialogOpen(false);
      setEditUser(null);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("admin-delete-user", {
        body: { userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      toast({ title: "Usuário removido!" });
      setDeleteConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    },
  });

  const openEditDialog = (user: UserProfile) => {
    setEditUser({ id: user.id, nome: user.nome, roleId: user.role_id || "" });
    setEditDialogOpen(true);
  };

  const openPermissionsDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setSelectedRoleId(user.role_id || "");
    setSelectedPermissions(user.role_permissions || []);
    setPermDialogOpen(true);
  };

  const getRoleBadgeVariant = (roleName: string) => {
    switch (roleName) {
      case "admin": return "default" as const;
      case "gerente": return "default" as const;
      case "vendedor": return "secondary" as const;
      case "financeiro": return "outline" as const;
      default: return "secondary" as const;
    }
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Acesso restrito a administradores.</p>
        </div>
      </Layout>
    );
  }

  const defaultRoleId = customRoles?.find((r) => r.name === "servicos")?.id || "";

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
                    value={newUser.role || defaultRoleId}
                    onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {customRoles?.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.display_name}
                        </SelectItem>
                      ))}
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
                        <Badge variant={getRoleBadgeVariant(user.role_name)}>
                          {user.role_display_name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.role_name === "admin" ? (
                          <span className="text-sm text-muted-foreground">Acesso total</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {user.role_permissions?.length || 0} módulo(s)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            <Pencil className="mr-1 h-4 w-4" />
                            Editar
                          </Button>
                          {user.role_name !== "admin" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openPermissionsDialog(user)}
                            >
                              <Settings2 className="mr-1 h-4 w-4" />
                              Permissões
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirmId(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog: Permissões Editáveis */}
        <Dialog open={permDialogOpen} onOpenChange={setPermDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Permissões — {selectedUser?.nome}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Alterar Perfil</Label>
                <Select
                  value={selectedRoleId}
                  onValueChange={(value) => {
                    setSelectedRoleId(value);
                    // Preencher permissões da role selecionada
                    const role = customRoles?.find((r) => r.id === value);
                    setSelectedPermissions((role?.permissions as string[]) || []);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {customRoles?.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.display_name}
                        {role.description && (
                          <span className="text-xs text-muted-foreground ml-2">— {role.description}</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Permissões editáveis */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Módulos com acesso:</Label>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setSelectedPermissions(ALL_PERMISSIONS.map((p) => p.id))}
                    >
                      Todos
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setSelectedPermissions([])}
                    >
                      Nenhum
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                  {ALL_PERMISSIONS.map((perm) => {
                    const included = selectedPermissions.includes(perm.id);
                    return (
                      <div
                        key={perm.id}
                        className={`flex items-center space-x-3 rounded-lg border p-2.5 cursor-pointer transition-colors ${
                          included ? "bg-primary/5 border-primary/20" : "hover:bg-muted/50"
                        }`}
                        onClick={() => {
                          setSelectedPermissions((prev) =>
                            included
                              ? prev.filter((p) => p !== perm.id)
                              : [...prev, perm.id]
                          );
                        }}
                      >
                        <Checkbox
                          checked={included}
                          onCheckedChange={(checked) => {
                            setSelectedPermissions((prev) =>
                              checked
                                ? [...prev, perm.id]
                                : prev.filter((p) => p !== perm.id)
                            );
                          }}
                        />
                        <span className="text-sm">{perm.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button
                className="w-full"
                onClick={async () => {
                  if (selectedUser && selectedRoleId) {
                    try {
                      // 1. Atualizar role do usuário
                      await updateUserRole.mutateAsync({ userId: selectedUser.id, roleId: selectedRoleId });

                      // 2. Atualizar permissões da role
                      const { error } = await supabase
                        .from("custom_roles")
                        .update({ permissions: selectedPermissions })
                        .eq("id", selectedRoleId);
                      if (error) throw error;

                      toast({ title: "Permissões atualizadas!" });
                      setPermDialogOpen(false);
                      setSelectedUser(null);
                      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
                      queryClient.invalidateQueries({ queryKey: ["custom-roles"] });
                    } catch (err: unknown) {
                      const error = err as Error;
                      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
                    }
                  }
                }}
                disabled={updateUserRole.isPending || !selectedRoleId}
              >
                {updateUserRole.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Perfil
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog: Editar Usuário */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
            </DialogHeader>
            {editUser && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateUser.mutate(editUser);
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Nome completo</Label>
                  <Input
                    value={editUser.nome}
                    onChange={(e) => setEditUser({ ...editUser, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Perfil</Label>
                  <Select
                    value={editUser.roleId}
                    onValueChange={(value) => setEditUser({ ...editUser, roleId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {customRoles?.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={updateUser.isPending}>
                  {updateUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog: Confirmar Exclusão */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirmId && deleteUser.mutate(deleteConfirmId)}
                disabled={deleteUser.isPending}
              >
                {deleteUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Excluir
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
