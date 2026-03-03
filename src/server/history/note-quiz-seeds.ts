import type { QuizQuestion } from '@/types/quiz';
import backendInterviewPrep from '../../../notes/backend-interview-prep.json';
import cmsProductFlow from '../../../notes/cms-product-flow.json';
import cypressTestingArchitecture from '../../../notes/cypress-testing-architecture.json';
import javascriptMapVsReduce from '../../../notes/javascript-map-vs-reduce.json';
import javascriptTypescriptDynamicAccess from '../../../notes/javascript-typescript-dynamic-access.json';
import multiTenantCmsClassDiagram from '../../../notes/multi-tenant-cms-class-diagram.json';
import nestHttpExceptions from '../../../notes/nest-http-exceptions.json';
import nestRequestLifecycle from '../../../notes/nest-request-lifecycle.json';
import nextjsRenderingAndPerformance from '../../../notes/nextjs-rendering-and-performance.json';
import ragAndDevSearchWorkflow from '../../../notes/rag-and-dev-search-workflow.json';
import sqlAdvancedFundamentals from '../../../notes/sql-advanced-fundamentals.json';
import sqlIndexingStrategy from '../../../notes/sql-indexing-strategy.json';
import systematicProgramDesignFundamentals from '../../../notes/systematic-program-design-fundamentals.json';
import typescriptGenericsAndReduce from '../../../notes/typescript-generics-and-reduce.json';
import zodSafeparseEnvConfig from '../../../notes/zod-safeparse-env-config.json';
import zodValidationAndDockerCompose from '../../../notes/zod-validation-and-docker-compose.json';

export interface NoteQuizSeed {
  slug: string;
  subject: string;
  questions: QuizQuestion[];
}

function asQuizQuestions(value: unknown): QuizQuestion[] {
  return value as QuizQuestion[];
}

export const NOTE_QUIZ_SEEDS: NoteQuizSeed[] = [
  {
    slug: 'backend-interview-prep',
    subject: 'Backend Interview Prep',
    questions: asQuizQuestions(backendInterviewPrep)
  },
  {
    slug: 'cms-product-flow',
    subject: 'CMS Product Flow',
    questions: asQuizQuestions(cmsProductFlow)
  },
  {
    slug: 'cypress-testing-architecture',
    subject: 'Cypress Testing Architecture',
    questions: asQuizQuestions(cypressTestingArchitecture)
  },
  {
    slug: 'javascript-map-vs-reduce',
    subject: 'JavaScript map vs reduce',
    questions: asQuizQuestions(javascriptMapVsReduce)
  },
  {
    slug: 'javascript-typescript-dynamic-access',
    subject: 'JavaScript and TypeScript Dynamic Access',
    questions: asQuizQuestions(javascriptTypescriptDynamicAccess)
  },
  {
    slug: 'multi-tenant-cms-class-diagram',
    subject: 'Multi-Tenant CMS Class Diagram',
    questions: asQuizQuestions(multiTenantCmsClassDiagram)
  },
  {
    slug: 'nest-http-exceptions',
    subject: 'NestJS HTTP Exceptions',
    questions: asQuizQuestions(nestHttpExceptions)
  },
  {
    slug: 'nest-request-lifecycle',
    subject: 'NestJS Request Lifecycle',
    questions: asQuizQuestions(nestRequestLifecycle)
  },
  {
    slug: 'nextjs-rendering-and-performance',
    subject: 'Next.js Rendering and Performance',
    questions: asQuizQuestions(nextjsRenderingAndPerformance)
  },
  {
    slug: 'rag-and-dev-search-workflow',
    subject: 'RAG and Developer Search Workflow',
    questions: asQuizQuestions(ragAndDevSearchWorkflow)
  },
  {
    slug: 'sql-advanced-fundamentals',
    subject: 'SQL Advanced Fundamentals',
    questions: asQuizQuestions(sqlAdvancedFundamentals)
  },
  {
    slug: 'sql-indexing-strategy',
    subject: 'SQL Indexing Strategy',
    questions: asQuizQuestions(sqlIndexingStrategy)
  },
  {
    slug: 'systematic-program-design-fundamentals',
    subject: 'Systematic Program Design Fundamentals',
    questions: asQuizQuestions(systematicProgramDesignFundamentals)
  },
  {
    slug: 'typescript-generics-and-reduce',
    subject: 'TypeScript Generics and Reduce',
    questions: asQuizQuestions(typescriptGenericsAndReduce)
  },
  {
    slug: 'zod-safeparse-env-config',
    subject: 'Zod SafeParse Environment Config',
    questions: asQuizQuestions(zodSafeparseEnvConfig)
  },
  {
    slug: 'zod-validation-and-docker-compose',
    subject: 'Zod Validation and Docker Compose',
    questions: asQuizQuestions(zodValidationAndDockerCompose)
  }
];
