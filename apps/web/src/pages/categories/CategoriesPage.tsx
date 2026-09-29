import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  categoryControllerCreate,
  categoryControllerFindAll,
  categoryControllerUpdate,
  categoryControllerRemove,
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
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryDto | null>(null);

  const [queryParams, setQueryParams] = useState<CategoryControllerFindAllParams>({
    page: 1,
    pageSize: 20,
  });

  const { data: categoriesData, isLoading, isError } = useQuery({
    queryKey: ['categories', queryParams],
    queryFn: () => categoryControllerFindAll(queryParams),
    select: (response) => response.data as PaginatedResponseDto,
  });

  const categories = categoriesData?.data ?? [];

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
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Categorias</h1>
          <p className="text-muted-foreground">Gerencie suas categorias de tarefas</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
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

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <div className="rounded-md border border-destructive p-4 text-destructive">
          Falha ao carregar categorias.
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-md border border-dashed p-10 text-center text-muted-foreground">
          Nenhuma categoria encontrada.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Título</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(categories as any[])?.map((category: any) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{category.title}</Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(category)}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(category)}
                      title="Excluir"
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
    </div>
  );
}
