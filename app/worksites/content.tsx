'use client';

import { useCallback, useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useLanguage } from '@/providers/i18n-provider';
import {
  listWorksites,
  createWorksite,
  updateWorksite,
  removeWorksite,
  listWorksiteTranslations,
  createWorksiteTranslation,
  updateWorksiteTranslation,
  removeWorksiteTranslation,
  listProjects,
  listProjectTranslations,
  listPersons,
  type WorksiteView,
  type WorksiteTranslationView,
  type ProjectView,
  type ProjectTranslationView,
  type PersonDirectoryRecord,
} from '@/lib/project/api/client';
import { PersonPicker, personDisplayName } from './components/person-picker';
import { Sidebar } from './components/sidebar';

const FA = 12;
const EN = 10;
const CODE_RE = /^[A-Za-z0-9]+$/;
const ALL = 'all';

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

interface WorksiteDraft {
  id?: string;
  projectId: string;
  code: string;
  supervisorPersonId: string | null;
  nameFa: string;
  nameEn: string;
  isActive: boolean;
}

const EMPTY_DRAFT: WorksiteDraft = {
  projectId: '',
  code: '',
  supervisorPersonId: null,
  nameFa: '',
  nameEn: '',
  isActive: true,
};

export function ProjectWorksitesContent() {
  const { t } = useTranslation('project');
  const { hasPermission } = usePermission();
  const canModify = hasPermission(['Project.Worksite.Modify']);
  const { language } = useLanguage();
  const langId = language.code === 'en' ? EN : FA;

  const [worksites, setWorksites] = useState<WorksiteView[]>([]);
  const [worksiteTranslations, setWorksiteTranslations] = useState<
    WorksiteTranslationView[]
  >([]);
  const [projects, setProjects] = useState<ProjectView[]>([]);
  const [projectTranslations, setProjectTranslations] = useState<
    ProjectTranslationView[]
  >([]);
  const [persons, setPersons] = useState<PersonDirectoryRecord[]>([]);

  const [filterProjectId, setFilterProjectId] = useState<string>(ALL);
  const [draft, setDraft] = useState<WorksiteDraft | null>(null);
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [ws, wt, pr, pt, ps] = await Promise.all([
        listWorksites(),
        listWorksiteTranslations(),
        listProjects(),
        listProjectTranslations(),
        listPersons(),
      ]);
      setWorksites(ws);
      setWorksiteTranslations(wt);
      setProjects(pr);
      setProjectTranslations(pt);
      setPersons(ps);
    } catch {
      showError(t('common.toastLoadError', { defaultValue: 'Failed to load data' }));
    }
  }, [t]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ── name resolvers ──
  const worksiteNameFor = useCallback(
    (worksiteId: string, lang: number) =>
      worksiteTranslations.find(
        (x) => x.worksiteId === worksiteId && x.languageId === lang,
      )?.name ?? '',
    [worksiteTranslations],
  );

  const projectName = useCallback(
    (projectId: string) => {
      const rows = projectTranslations.filter((x) => x.projectId === projectId);
      const tr = rows.find((x) => x.languageId === langId) ?? rows[0];
      if (tr?.name) return tr.name;
      return projects.find((p) => p.id === projectId)?.code ?? '—';
    },
    [projectTranslations, projects, langId],
  );

  const supervisorLabel = useCallback(
    (personId: string | null) => {
      if (!personId) return '—';
      const p = persons.find((x) => x.id === personId);
      return p ? personDisplayName(p, langId) : personId;
    },
    [persons, langId],
  );

  const filteredWorksites =
    filterProjectId === ALL
      ? worksites
      : worksites.filter((w) => w.projectId === filterProjectId);

  // ── create / edit ──
  const openAdd = () => setDraft({ ...EMPTY_DRAFT });
  const openEdit = (w: WorksiteView) =>
    setDraft({
      id: w.id,
      projectId: w.projectId,
      code: w.code,
      supervisorPersonId: w.supervisorPersonId,
      nameFa: worksiteNameFor(w.id, FA),
      nameEn: worksiteNameFor(w.id, EN),
      isActive: w.isActive,
    });

  const upsertTranslation = async (worksiteId: string, lang: number, name: string) => {
    const existing = worksiteTranslations.find(
      (x) => x.worksiteId === worksiteId && x.languageId === lang,
    );
    const trimmed = name.trim();
    if (trimmed) {
      if (existing)
        await updateWorksiteTranslation({ worksiteId, languageId: lang, name: trimmed });
      else await createWorksiteTranslation({ worksiteId, languageId: lang, name: trimmed });
    } else if (existing) {
      await removeWorksiteTranslation({ worksiteId, languageId: lang });
    }
  };

  const handleSave = async () => {
    if (!draft) return;
    if (!draft.projectId) {
      showError(t('worksites.validation.projectRequired', { defaultValue: 'Project is required' }));
      return;
    }
    const code = draft.code.trim();
    if (!code) {
      showError(t('worksites.validation.codeRequired', { defaultValue: 'Code is required' }));
      return;
    }
    if (!CODE_RE.test(code)) {
      showError(
        t('worksites.validation.codeFormat', {
          defaultValue: 'Code must contain English letters and digits only',
        }),
      );
      return;
    }
    if (!draft.nameFa.trim() && !draft.nameEn.trim()) {
      showError(t('worksites.validation.nameRequired', { defaultValue: 'Name is required' }));
      return;
    }

    setSaving(true);
    try {
      let worksiteId = draft.id;
      if (draft.id) {
        await updateWorksite({
          id: draft.id,
          projectId: draft.projectId,
          code,
          supervisorPersonId: draft.supervisorPersonId,
          isActive: draft.isActive,
        });
      } else {
        const created = await createWorksite({
          projectId: draft.projectId,
          code,
          supervisorPersonId: draft.supervisorPersonId,
          isActive: draft.isActive,
        });
        worksiteId = created.id;
      }
      if (worksiteId) {
        await upsertTranslation(worksiteId, FA, draft.nameFa);
        await upsertTranslation(worksiteId, EN, draft.nameEn);
      }
      showSuccess(
        draft.id
          ? t('common.toastUpdated', { defaultValue: 'Updated successfully' })
          : t('common.toastCreated', { defaultValue: 'Created successfully' }),
      );
      setDraft(null);
      await loadAll();
    } catch (e) {
      showError(
        (e as Error)?.message || t('common.toastError', { defaultValue: 'Something went wrong' }),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (w: WorksiteView) => {
    if (
      !window.confirm(
        t('common.confirmDeleteMessage', {
          defaultValue:
            'Are you sure you want to delete this item? This action cannot be undone.',
        }),
      )
    )
      return;
    try {
      const rows = worksiteTranslations.filter((x) => x.worksiteId === w.id);
      for (const row of rows) {
        await removeWorksiteTranslation({ worksiteId: w.id, languageId: row.languageId });
      }
      await removeWorksite({ id: w.id });
      showSuccess(t('common.toastDeleted', { defaultValue: 'Deleted successfully' }));
      await loadAll();
    } catch (e) {
      showError(
        (e as Error)?.message || t('common.toastError', { defaultValue: 'Something went wrong' }),
      );
    }
  };

  return (
    <div className="space-y-5 lg:space-y-7.5">
      {/* Title card */}
      <Card className="bg-teal-50/25! border-teal-100! dark:bg-teal-950/25! dark:border-teal-900! shadow-lg shadow-black/5">
        <CardContent className="py-5">
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle text={t('worksites.title', { defaultValue: 'Worksites' })} />
              <ToolbarDescription>
                {t('worksites.description', {
                  defaultValue: 'Manage worksites under projects and their localized names',
                })}
              </ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </CardContent>
      </Card>

      <div
        className={
          'space-y-5 lg:space-y-7.5 ' +
          '[&_div.rounded-xl.bg-card]:bg-teal-50/25! ' +
          '[&_div.rounded-xl.bg-card]:border-teal-100! ' +
          'dark:[&_div.rounded-xl.bg-card]:bg-teal-950/25! ' +
          'dark:[&_div.rounded-xl.bg-card]:border-teal-900! ' +
          '[&_div.rounded-xl.bg-card]:shadow-lg ' +
          '[&_div.rounded-xl.bg-card]:shadow-black/5'
        }
      >
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-5 lg:gap-7.5">
          {/* Main column */}
          <div className="col-span-3">
            <div className="grid gap-5 lg:gap-7.5">
              {/* Worksites list */}
              <Card>
                <CardContent className="py-5">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="w-64 max-w-full">
                      <Select value={filterProjectId} onValueChange={setFilterProjectId}>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('worksites.filters.project', {
                              defaultValue: 'Filter by project',
                            })}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>
                            {t('worksites.filters.allProjects', {
                              defaultValue: 'All projects',
                            })}
                          </SelectItem>
                          {projects.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {projectName(p.id)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {canModify && (
                      <Button onClick={openAdd}>
                        <Plus className="size-4" />
                        {t('worksites.addTitle', { defaultValue: 'New Worksite' })}
                      </Button>
                    )}
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('worksites.columns.code', { defaultValue: 'Code' })}</TableHead>
                        <TableHead>{t('worksites.columns.project', { defaultValue: 'Project' })}</TableHead>
                        <TableHead>{t('worksites.columns.supervisor', { defaultValue: 'Supervisor' })}</TableHead>
                        <TableHead>{t('worksites.columns.nameFa', { defaultValue: 'Name (Persian)' })}</TableHead>
                        <TableHead>{t('worksites.columns.nameEn', { defaultValue: 'Name (English)' })}</TableHead>
                        <TableHead className="text-center">{t('worksites.columns.isActive', { defaultValue: 'Status' })}</TableHead>
                        <TableHead className="text-center w-28">{t('worksites.columns.actions', { defaultValue: 'Actions' })}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWorksites.map((w) => (
                        <TableRow key={w.id}>
                          <TableCell className="font-mono text-xs">{w.code}</TableCell>
                          <TableCell>{projectName(w.projectId)}</TableCell>
                          <TableCell>{supervisorLabel(w.supervisorPersonId)}</TableCell>
                          <TableCell>{worksiteNameFor(w.id, FA) || '—'}</TableCell>
                          <TableCell>{worksiteNameFor(w.id, EN) || '—'}</TableCell>
                          <TableCell className="text-center">
                            {w.isActive ? (
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
                                  <Button variant="ghost" mode="icon" size="sm" onClick={() => openEdit(w)}>
                                    <Pencil className="size-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    mode="icon"
                                    size="sm"
                                    onClick={() => handleDelete(w)}
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
                      {filteredWorksites.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            {t('worksites.empty', { defaultValue: 'No worksites yet' })}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-1">
            <div className="grid gap-5 lg:gap-7.5">
              <Sidebar
                totalWorksites={worksites.length}
                activeWorksites={worksites.filter((w) => w.isActive).length}
                totalProjects={projects.length}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Create / edit dialog */}
      <Dialog open={draft !== null} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {draft?.id
                ? t('worksites.editTitle', { defaultValue: 'Edit Worksite' })
                : t('worksites.addTitle', { defaultValue: 'New Worksite' })}
            </DialogTitle>
            <DialogDescription>
              {t('worksites.description', {
                defaultValue: 'Manage worksites under projects and their localized names',
              })}
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>{t('worksites.form.code', { defaultValue: 'Code' })}</Label>
                <Input
                  value={draft.code}
                  dir="ltr"
                  onChange={(e) =>
                    setDraft({ ...draft, code: e.target.value.replace(/[^A-Za-z0-9]/g, '') })
                  }
                  placeholder={t('worksites.form.codePlaceholder', {
                    defaultValue: 'e.g. WS001',
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  {t('worksites.form.codeHint', {
                    defaultValue: 'English letters and digits only',
                  })}
                </p>
              </div>

              <div className="space-y-1">
                <Label>{t('worksites.form.project', { defaultValue: 'Project' })}</Label>
                <Select
                  value={draft.projectId || undefined}
                  onValueChange={(v) => setDraft({ ...draft, projectId: v })}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t('worksites.form.projectPlaceholder', {
                        defaultValue: 'Select a project',
                      })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {projects
                      .filter((p) => p.isActive || p.id === draft.projectId)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {projectName(p.id)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>{t('worksites.form.supervisor', { defaultValue: 'Supervisor' })}</Label>
                <PersonPicker
                  persons={persons}
                  value={draft.supervisorPersonId}
                  onChange={(id) => setDraft({ ...draft, supervisorPersonId: id })}
                  langId={langId}
                />
              </div>

              <div className="space-y-1">
                <Label>{t('worksites.form.nameFa', { defaultValue: 'Name (Persian)' })}</Label>
                <Input
                  value={draft.nameFa}
                  onChange={(e) => setDraft({ ...draft, nameFa: e.target.value })}
                  placeholder={t('worksites.form.nameFaPlaceholder', {
                    defaultValue: 'Worksite name in Persian',
                  })}
                />
              </div>

              <div className="space-y-1">
                <Label>{t('worksites.form.nameEn', { defaultValue: 'Name (English)' })}</Label>
                <Input
                  value={draft.nameEn}
                  dir="ltr"
                  onChange={(e) => setDraft({ ...draft, nameEn: e.target.value })}
                  placeholder={t('worksites.form.nameEnPlaceholder', {
                    defaultValue: 'Worksite name in English',
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>{t('worksites.form.isActive', { defaultValue: 'Active' })}</Label>
                <Switch
                  checked={draft.isActive}
                  onCheckedChange={(v) => setDraft({ ...draft, isActive: v })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
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
