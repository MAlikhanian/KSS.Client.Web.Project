'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
import { Building2, CheckCircle2, Layers } from 'lucide-react';

interface SidebarProps {
  totalWorksites: number;
  activeWorksites: number;
  totalProjects: number;
}

export function Sidebar({
  totalWorksites,
  activeWorksites,
  totalProjects,
}: SidebarProps) {
  const { t } = useTranslation('project');

  const stats = [
    {
      icon: <Building2 className="w-5 h-5 text-white" />,
      bg: 'bg-teal-500',
      label: t('worksites.title', { defaultValue: 'Worksites' }),
      value: totalWorksites,
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-white" />,
      bg: 'bg-green-500',
      label: t('common.active', { defaultValue: 'Active' }),
      value: activeWorksites,
    },
    {
      icon: <Layers className="w-5 h-5 text-white" />,
      bg: 'bg-sky-500',
      label: t('projects.title', { defaultValue: 'Projects' }),
      value: totalProjects,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('worksites.title', { defaultValue: 'Worksites' })}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center shrink-0`}
              >
                {s.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
