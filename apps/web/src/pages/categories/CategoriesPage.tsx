import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-feedback';
import { Folder, FolderOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  categoryControllerCreate,
  categoryControllerFindAll,
  categoryControllerUpdate,
  categoryControllerRemove,
  tasksControllerFindAll,
} from '@/lib/api-client';
import type {
  CategoryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  PaginatedResponseDto,
  CategoryControllerFindAllParams,
} from '@/lib/api-client/models';
import { CategoryFormDialog } from './CategoryFormDialog';

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo;
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryDto | null>(null);
  const [tasksCategory, setTasksCategory] = useState<CategoryDto | null>(null);

  const [queryParams] = useState<CategoryControllerFindAllParams>({
    page: 1,
    pageSize: 20,
  });

  const { data: categoriesData, isLoading, isError } = useQuery({
    queryKey: ['categories', queryParams],
    queryFn: () => categoryControllerFindAll(queryParams),
    select: (response) => response.data as PaginatedResponseDto,
  });

  const {
    data: allTasksData,
    isLoading: isTasksLoading,
    isError: isTasksError,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: ['tasks', 'all-categories'],
    queryFn: async () => {
      const firstResponse = await tasksControllerFindAll({ page: 1, pageSize: 100 });
      if (firstResponse.status !== 200) throw new Error('Não foi possível carregar as tarefas.');
      const firstPage = firstResponse.data;
      const tasks = [...(firstPage?.data ?? [])];
      const totalPages = firstPage?.meta?.totalPages ?? 1;

      for (let page = 2; page <= totalPages; page += 1) {
        const response = await tasksControllerFindAll({ page, pageSize: 100 });
        if (response.status !== 200) throw new Error('Não foi possível carregar as tarefas.');
        tasks.push(...(response.data?.data ?? []));
      }

      return tasks;
    },
  });

  const normalizeCategoryId = (value: unknown) => {
    if (value === undefined || value === null || value === '') return null;

    if (typeof value === 'string') return value.trim();

    if (typeof value === 'object') {
      const maybeId = (value as any)?.id ?? (value as any)?.categoryId ?? (value as any)?.value;
      if (maybeId !== undefined && maybeId !== null && maybeId !== '') return String(maybeId).trim();
    }

    return String(value).trim();
  };

  const categories = categoriesData?.data ?? [];
  const validCategoryIds = new Set((categories as any[]).map((category) => String(category.id)));
  const tasksByCategory = (allTasksData ?? []).reduce((acc, task: any) => {
    const candidateIds = [
      normalizeCategoryId(task?.categoryId),
      normalizeCategoryId(task?.category?.id),
      normalizeCategoryId(task?.category),
    ].filter((value): value is string => Boolean(value));

    const matchingCategoryId = candidateIds.find((candidate) => validCategoryIds.has(String(candidate)));
    if (!matchingCategoryId) return acc;

    const key = String(matchingCategoryId);
    acc[key] = acc[key] ?? [];
    acc[key].push(task);
    return acc;
  }, {} as Record<string, any[]>);

  const createMutation = useMutation({
    mutationFn: (payload: CreateCategoryDto) => categoryControllerCreate(payload),
  });

  const updateMutation = useMutation({
    mutationFn: (variables: { id: string; data: UpdateCategoryDto }) =>
      categoryControllerUpdate(variables.id, variables.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryControllerRemove(id),
  });

  const handleCreate = async (payload: CreateCategoryDto) => {
    try {
      await createMutation.mutateAsync(payload);
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      setCreateOpen(false);
      if (returnTo) {
        navigate(returnTo, { replace: true });
      }
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const handleUpdate = async (id: string, payload: UpdateCategoryDto) => {
    try {
      await updateMutation.mutateAsync({ id, data: payload });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      setEditingCategory(null);
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeleteTarget(null);
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const openEdit = (category: CategoryDto) => {
    setEditingCategory(category);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-blue-600" />
            Categorias
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Organize e reutilize classificações para suas tarefas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {returnTo && (
            <Button variant="outline" onClick={() => navigate(returnTo, { replace: true })}>
              Voltar para tarefas
            </Button>
          )}
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nova Categoria
          </Button>
        </div>
      </div>

      <CategoryFormDialog
        open={createOpen || !!editingCategory}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setEditingCategory(null);
          }
        }}
        category={editingCategory ?? undefined}
        onSubmit={async (values) => {
          if (editingCategory) {
            await handleUpdate(editingCategory.id, values);
          } else {
            await handleCreate(values);
          }
        }}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá remover a categoria &quot;{deleteTarget?.title}&quot;.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!tasksCategory}
        onOpenChange={(open) => {
          if (!open) setTasksCategory(null);
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-lg overflow-hidden">
          <DialogHeader>
            <DialogTitle>Tarefas de {tasksCategory?.title}</DialogTitle>
            <DialogDescription>
              {(tasksByCategory[String(tasksCategory?.id)] ?? []).length} tarefas vinculadas.
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {(tasksByCategory[String(tasksCategory?.id)] ?? []).map((task: any) => (
              <li
                key={task.id}
                className="flex items-start gap-3 rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-200"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                <span className="break-words">{task.title}</span>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Folder className="h-4 w-4 text-blue-600" />
              <span>Total de categorias</span>
            </div>
            <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-900 dark:text-blue-300 dark:bg-blue-950/40">
              {categories.length}
            </Badge>
          </div>

          {isLoading ? (
            <LoadingState message="Carregando categorias..." />
          ) : isError ? (
            <ErrorState
              title="Erro ao buscar categorias"
              message="Não foi possível carregar as categorias no momento."
              onRetry={() => window.location.reload()}
            />
          ) : categories.length === 0 ? (
            <EmptyState
              title="Nenhuma categoria encontrada"
              description="Ainda não existem categorias cadastradas para organizar suas tarefas."
              action={
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  Criar primeira categoria
                </Button>
              }
              icon={<Folder className="h-6 w-6" />}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {(categories as any[])?.map((category: any) => {
                const relatedTasks = tasksByCategory[String(category.id)] ?? [];

                return (
                  <div
                    key={category.id}
                    className="group rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                          <Folder className="h-4 w-4" />
                        </div>
                        <span className="truncate font-semibold text-slate-900 dark:text-white">
                          {category.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => openEdit(category)}
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500"
                          onClick={() => setDeleteTarget(category)}
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-800">
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                        <span>Tarefas</span>
                        <span>{relatedTasks.length}</span>
                      </div>

                      {isTasksLoading ? (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          Carregando tarefas...
                        </p>
                      ) : isTasksError ? (
                        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-red-600 dark:text-red-400">
                          <span>Falha ao carregar tarefas.</span>
                          <button type="button" onClick={() => refetchTasks()} className="font-medium underline">
                            Tentar novamente
                          </button>
                        </div>
                      ) : relatedTasks.length === 0 ? (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          Nenhuma tarefa vinculada.
                        </p>
                      ) : (
                        <ul className="mt-2 space-y-1.5">
                          {relatedTasks.slice(0, 3).map((task: any) => (
                            <li key={task.id} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
                              <span className="line-clamp-1">{task.title}</span>
                            </li>
                          ))}
                          {relatedTasks.length > 3 && (
                            <li className="text-[11px] text-slate-500 dark:text-slate-400">
                              <button
                                type="button"
                                onClick={() => setTasksCategory(category)}
                                className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                              >
                                +{relatedTasks.length - 3} mais
                              </button>
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
