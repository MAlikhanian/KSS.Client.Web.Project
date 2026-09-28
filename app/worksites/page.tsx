'use client';

import { Fragment } from 'react';
import { Container } from '@/components/common/container';
import { PageNavbar } from '@/app/page-navbar';
import { ProjectWorksitesContent } from './content';

export default function ProjectWorksitesPage() {
  return (
    <Fragment>
      <PageNavbar />
      <Container>
        <ProjectWorksitesContent />
      </Container>
    </Fragment>
  );
}
