'use client';

import { Fragment } from 'react';
import { Container } from '@/components/common/container';
import { PageNavbar } from '@/app/page-navbar';
import { ProjectProjectsContent } from './content';

export default function ProjectProjectsPage() {
  return (
    <Fragment>
      <PageNavbar />
      <Container>
        <ProjectProjectsContent />
      </Container>
    </Fragment>
  );
}
