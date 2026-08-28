'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/useTranslation';
import { usePermission } from '@/hooks/use-permission';
import {
  listProjects,
  createProject,
  updateProject,
  removeProject,
  listProjectTranslations,
  createProjectTranslation,
  updateProjectTranslation,
  removeProjectTranslation,
  type ProjectView,
  type ProjectTranslationView,
} from '@/lib/project/api/client';

// Persian = 12, English = 10 (project-wide language ids).
const FA = 12;
const EN = 10;

// Code must contain only English letters and digits.
const CODE_PATTERN = /^[A-Za-z0-9]+$/;

function showSuccess(msg: string) {
  toast.custom(
    () => (
      <Alert variant="mono" icon="success">
        <AlertIcon>
          <RiCheckboxCircleFill />
        </AlertIcon>
        <AlertTitle>{msg}</AlertTitle>
      </Alert>
    ),
    { position: 'top-center' },
  );
}

function showError(msg: string) {
  toast.custom(
    () => (
      <Alert variant="mono" icon="destructive">
        <AlertIcon>
          <RiErrorWarningFill />
        </AlertIcon>
        <AlertTitle>{msg}</AlertTitle>
      </Alert>
    ),
    { position: 'top-center' },
  );
}

interface DraftProject {
  id?: string;
  code: string;
  nameFa: string;
  nameEn: string;
  isActive: boolean;
}

const EMPTY_DRAFT: DraftProject = { code: '', nameFa: '', nameEn: '', isActive: true };

export function ProjectProjectsContent() {
  const { t } = useTranslation('project');
  const { hasPermission } = usePermission();
  const canModify = hasPermission(['Project.Project.Modify']);
  const [projects, setProjects] = useState<ProjectView[]>([]);
  const [translations, setTranslations] = useState<ProjectTranslationView[]>([]);
  const [draft, setDraft] = useState<DraftProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const nameFor = (projectId: string, languageId: number) =>
    translations.find((tr) => tr.projectId === projectId && tr.languageId === languageId)?.name ?? '';

  const refresh = async () => {
    setLoading(true);
    try {
      const [projs, trans] = await Promise.all([listProjects(), listProjectTranslations()]);
      setProjects(projs);
      setTranslations(trans);
    } catch {
      showError(t('common.toastLoadError', { defaultValue: 'Failed to load data' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const openAdd = () => setDraft({ ...EMPTY_DRAFT });
  const openEdit = (project: ProjectView) =>
    setDraft({
      id: project.id,
      code: project.code,
      nameFa: nameFor(project.id, FA),
      nameEn: nameFor(project.id, EN),
      isActive: project.isActive,
    });

  const saveTranslation = async (projectId: string, languageId: number, name: string) => {
    const existing = translations.find(
      (tr) => tr.projectId === projectId && tr.languageId === languageId,
    );
    if (name) {
      if (existing) {
        await updateProjectTranslation({ projectId, languageId, name });
      } else {
        await createProjectTranslation({ projectId, languageId, name });
      }
    } else if (existing) {
      await removeProjectTranslation({ projectId, languageId });
    }
  };

  const handleSave = async () => {
    if (!draft) return;
    const code = draft.code.trim();
    const nameFa = draft.nameFa.trim();
    const nameEn = draft.nameEn.trim();

    if (!code) {
      showError(t('projects.validation.codeRequired', { defaultValue: 'Code is required' }));
      return;
    }
    if (!CODE_PATTERN.test(code)) {
      showError(
        t('projects.validation.codeFormat', {
          defaultValue: 'Code must contain English letters and digits only',
        }),
      );
      return;
    }
    if (!nameFa && !nameEn) {
      showError(
        t('projects.validation.nameRequired', {
          defaultValue: 'Name is required',
        }),
      );
      return;
    }

    setSaving(true);
    try {
      const isEdit = Boolean(draft.id);
      let projectId = draft.id;
      // Never send an id on create — the backend stamps a v7 GUID.
      if (projectId) {
        await updateProject({ id: projectId, code, isActive: draft.isActive });
      } else {
        const created = await createProject({ code, isActive: draft.isActive });
        projectId = created.id;
      }
      await saveTranslation(projectId, FA, nameFa);
      await saveTranslation(projectId, EN, nameEn);
      showSuccess(
        isEdit
          ? t('common.toastUpdated', { defaultValue: 'Updated successfully' })
          : t('common.toastCreated', { defaultValue: 'Created successfully' }),
      );
      setDraft(null);
      await refresh();
    } catch {
      showError(t('common.toastError', { defaultValue: 'Something went wrong' }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (project: ProjectView) => {
    if (
      !window.confirm(
        t('common.confirmDeleteMessage', {
          defaultValue: 'Are you sure you want to delete this item? This action cannot be undone.',
        }),
      )
    ) {
      return;
    }
    try {
      const projectTranslations = translations.filter((tr) => tr.projectId === project.id);
      for (const tr of projectTranslations) {
        await removeProjectTranslation({ projectId: tr.projectId, languageId: tr.languageId });
      }
      await removeProject({ id: project.id });
      showSuccess(t('common.toastDeleted', { defaultValue: 'Deleted successfully' }));
      await refresh();
    } catch {
      showError(t('common.toastError', { defaultValue: 'Something went wrong' }));
    }
  };

  return (
    <div className="space-y-5 lg:space-y-7.5">
      <Card className="bg-emerald-50/25! border-emerald-100! dark:bg-emerald-950/25! dark:border-emerald-900! shadow-lg shadow-black/5">
        <CardContent className="py-5">
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle text={t('projects.title', { defaultValue: 'Projects' })} />
              <ToolbarDescription>
                {t('projects.description', {
                  defaultValue: 'Manage projects and their localized names',
                })}
              </ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </CardContent>
      </Card>

      <div
        className={
          'space-y-5 lg:space-y-7.5 ' +
          '[&_div.rounded-xl.bg-card]:bg-emerald-50/25! ' +
          '[&_div.rounded-xl.bg-card]:border-emerald-100! ' +
          'dark:[&_div.rounded-xl.bg-card]:bg-emerald-950/25! ' +
          'dark:[&_div.rounded-xl.bg-card]:border-emerald-900! ' +
          '[&_div.rounded-xl.bg-card]:shadow-lg ' +
          '[&_div.rounded-xl.bg-card]:shadow-black/5'
        }
      >
        <Card>
          <CardContent className="py-5">
            {canModify && (
              <div className="flex items-center justify-end mb-4">
                <Button onClick={openAdd}>
                  <Plus className="size-4" />
                  {t('projects.addTitle', { defaultValue: 'New Project' })}
                </Button>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('projects.columns.code', { defaultValue: 'Code' })}</TableHead>
                  <TableHead>
                    {t('projects.columns.nameFa', { defaultValue: 'Name (Persian)' })}
                  </TableHead>
                  <TableHead>
                    {t('projects.columns.nameEn', { defaultValue: 'Name (English)' })}
                  </TableHead>
                  <TableHead className="text-center">
                    {t('projects.columns.isActive', { defaultValue: 'Status' })}
                  </TableHead>
                  <TableHead className="text-center w-32">
                    {t('projects.columns.actions', { defaultValue: 'Actions' })}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.code}</TableCell>
                    <TableCell>{nameFor(p.id, FA) || '—'}</TableCell>
                    <TableCell>{nameFor(p.id, EN) || '—'}</TableCell>
                    <TableCell className="text-center">
                      {p.isActive ? (
                        <Badge variant="success" appearance="light">
                          {t('common.active', { defaultValue: 'Active' })}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" appearance="light">
                          {t('common.inactive', { defaultValue: 'Inactive' })}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex gap-1">
                        {canModify ? (
                          <>
                            <Button variant="ghost" mode="icon" size="sm" onClick={() => openEdit(p)}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              mode="icon"
                              size="sm"
                              onClick={() => handleDelete(p)}
                            >
                              <Trash2 className="size-4 text-rose-500" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && projects.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {t('projects.empty', { defaultValue: 'No projects yet' })}
                    </TableCell>
                  </TableRow>
                )}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {t('common.loading', { defaultValue: 'Loading...' })}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={draft !== null} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {draft?.id
                ? t('projects.editTitle', { defaultValue: 'Edit Project' })
                : t('projects.addTitle', { defaultValue: 'New Project' })}
            </DialogTitle>
            <DialogDescription>
              {t('projects.description', {
                defaultValue: 'Manage projects and their localized names',
              })}
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>{t('projects.form.code', { defaultValue: 'Code' })}</Label>
                <Input
                  value={draft.code}
                  dir="ltr"
                  onChange={(e) =>
                    setDraft({ ...draft, code: e.target.value.replace(/[^A-Za-z0-9]/g, '') })
                  }
                  placeholder={t('projects.form.codePlaceholder', {
                    defaultValue: 'e.g. PRJ001',
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  {t('projects.form.codeHint', {
                    defaultValue: 'English letters and digits only',
                  })}
                </p>
              </div>
              <div className="space-y-1">
                <Label>{t('projects.form.nameFa', { defaultValue: 'Name (Persian)' })}</Label>
                <Input
                  value={draft.nameFa}
                  onChange={(e) => setDraft({ ...draft, nameFa: e.target.value })}
                  placeholder={t('projects.form.nameFaPlaceholder', {
                    defaultValue: 'Project name in Persian',
                  })}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('projects.form.nameEn', { defaultValue: 'Name (English)' })}</Label>
                <Input
                  value={draft.nameEn}
                  dir="ltr"
                  onChange={(e) => setDraft({ ...draft, nameEn: e.target.value })}
                  placeholder={t('projects.form.nameEnPlaceholder', {
                    defaultValue: 'Project name in English',
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>{t('projects.form.isActive', { defaultValue: 'Active' })}</Label>
                <Switch
                  checked={draft.isActive}
                  onCheckedChange={(v) => setDraft({ ...draft, isActive: v })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)} disabled={saving}>
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving
                ? t('common.saving', { defaultValue: 'Saving...' })
                : t('common.save', { defaultValue: 'Save' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
