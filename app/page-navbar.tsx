'use client';

import { Navbar } from '@/partials/navbar/navbar';
import { NavbarMenu } from '@/partials/navbar/navbar-menu';
import { useSettings } from '@/providers/settings-provider';
import { Container } from '@/components/common/container';
import { useTranslation } from '@/hooks/useTranslation';

const PageNavbar = () => {
  const { settings } = useSettings();
  const { t } = useTranslation('project');

  const items = [
    { title: t('navProjects', { defaultValue: 'Projects' }), path: '/project/projects' },
    { title: t('navWorksites', { defaultValue: 'Worksites' }), path: '/project/worksites' },
  ];

  if (settings?.layout === 'demo1') {
    return (
      <Navbar>
        <Container>
          <NavbarMenu items={items} />
        </Container>
      </Navbar>
    );
  }
  return <></>;
};

export { PageNavbar };
