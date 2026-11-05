import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json({ limit: '5mb' }));

// Cache control for real-time asset updates
app.use((req, res, next) => {
  if (req.url.startsWith('/Logo') || req.url.startsWith('/capa')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

const PORT = 3000;
const DB_PATH = path.resolve(process.cwd(), 'efem_database.json');

export const SIPAE_OAUTH_URL =
  'https://accounts.google.com/o/oauth2/auth?response_type=code&access_type=online&client_id=858912930727-ga06ipmhacunnhjoq3beot01t007v20r.apps.googleusercontent.com&redirect_uri=https:%2F%2Fseduct.campos.rj.gov.br%2Fredirect.php&state&scope=email%20profile&approval_prompt=auto';

export interface AccessLog {
  id: string;
  timestamp: string;
  page: string;
  userAgent: string;
  sipaeEmail?: string;
}

export interface SipaeLoginRecord {
  id: string;
  email: string;
  name: string;
  role: string;
  schoolUnit: string;
  loggedAt: string;
}

export interface EnrollmentRecord {
  id: string;
  courseId: string;
  courseTitle: string;
  category: string;
  seductUrl: string;
  eventDate: string;
  eventTime: string;
  location: string;
  participantName: string;
  sipaeEmail: string;
  enrolledAt: string;
}

export interface AppointmentRecord {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  category: string;
  email?: string;
  notifyPhone: boolean;
  notify24hSent: boolean;
  notify1hSent: boolean;
  isAutoFromCourse?: boolean;
  courseUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface SeductNotification {
  id: string;
  eventId: string;
  title: string;
  summary: string;
  category: string;
  imageUrl: string;
  url: string;
  sipaeOAuthUrl: string;
  publishedAt: string;
  isNew?: boolean;
}

export interface AdminPermissions {
  canUpdateCourses: boolean;
  canSyncSeduct: boolean;
  canSendAlerts: boolean;
  canManageAdmins: boolean;
  canExportReports: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolUnit: string;
  permissions: AdminPermissions;
  createdAt: string;
  status: 'active' | 'inactive';
}

export interface BroadcastAlertRecord {
  id: string;
  title: string;
  message: string;
  authorEmail?: string;
  createdAt: string;
}

interface DatabaseSchema {
  accessLogs: AccessLog[];
  sipaeLogins: SipaeLoginRecord[];
  enrollments: EnrollmentRecord[];
  appointments: AppointmentRecord[];
  seductFeed: SeductNotification[];
  admins: AdminUser[];
  broadcastAlerts: BroadcastAlertRecord[];
  lastUpdated: string;
}

// Publicações e imagens EXATAS extraídas de https://seduct.campos.rj.gov.br/?p=eventos
const DEFAULT_LIVE_SEDUCT_EVENTS: SeductNotification[] = [
  {
    id: 'evt-3886',
    eventId: '3886',
    title: 'Caminhos Compartilhantes com o PDDE em Campos dos Goytacazes - RJ',
    summary:
      'Formação presencial (30/10/2026 às 08h00 no Auditório do Colégio Salesiano) para Diretores e Diretores Adjuntos da Rede Municipal.',
    category: 'Gestores',
    imageUrl: 'https://seduct.campos.rj.gov.br/eventos/NOVO-NEUROCIENCIA-NA-EDUCACAO-1.jpg',
    url: 'https://seduct.campos.rj.gov.br/?p=eventos&id=3886',
    sipaeOAuthUrl: SIPAE_OAUTH_URL,
    publishedAt: '2026-10-08T08:00:00.000Z',
    isNew: true,
  },
  {
    id: 'evt-3896',
    eventId: '3896',
    title: 'Entre o Plugado e o Desplugado: Computação e Inclusão na Sala de Recursos',
    summary:
      'Formação continuada oficial disponibilizada no portal de Cursos & Eventos SEDUCT / SIPAE.',
    category: 'Professores de Salas de Recursos',
    imageUrl: 'https://seduct.campos.rj.gov.br/eventos/CARDS-ROTATIVOS-COM-MATHEUS_1.jpg',
    url: 'https://seduct.campos.rj.gov.br/?p=eventos&id=3896',
    sipaeOAuthUrl: SIPAE_OAUTH_URL,
    publishedAt: '2026-10-08T07:50:00.000Z',
    isNew: true,
  },
  {
    id: 'evt-3893',
    eventId: '3893',
    title:
      'Descobrindo Campos dos Goytacazes com Os Olhos da História: Formação Continuada em Educação Patrimonial',
    summary:
      'Formação continuada em Educação Patrimonial publicada em seduct.campos.rj.gov.br/?p=eventos.',
    category: 'Ensino Fundamental (anos finais)',
    imageUrl: 'https://seduct.campos.rj.gov.br/eventos/CARDS-ROTATIVOS-COM-MATHEUS.jpg',
    url: 'https://seduct.campos.rj.gov.br/?p=eventos&id=3893',
    sipaeOAuthUrl: SIPAE_OAUTH_URL,
    publishedAt: '2026-10-08T07:40:00.000Z',
    isNew: true,
  },
  {
    id: 'evt-3885',
    eventId: '3885',
    title: 'Capacitação em Primeiros Socorros: Adequação à Lei Lucas',
    summary:
      'Capacitação oficial para profissionais da educação da Rede Municipal de Campos dos Goytacazes.',
    category: 'Creche / Educação Infantil',
    imageUrl: 'https://seduct.campos.rj.gov.br/eventos/LETYCIA_1.jpg',
    url: 'https://seduct.campos.rj.gov.br/?p=eventos&id=3885',
    sipaeOAuthUrl: SIPAE_OAUTH_URL,
    publishedAt: '2026-10-08T07:30:00.000Z',
    isNew: true,
  },
  {
    id: 'evt-3869',
    eventId: '3869',
    title: 'Quando a Dor é Coletiva: Luto, Escuta e Acolhimento no Espaço Escolar',
    summary:
      'Encontro formativo de escuta e acolhimento no espaço escolar pelo portal SIPAE / SEDUCT.',
    category: 'Pedagogos',
    imageUrl: 'https://seduct.campos.rj.gov.br/eventos/CARD-MODELO-TODOS_64.jpg',
    url: 'https://seduct.campos.rj.gov.br/?p=eventos&id=3869',
    sipaeOAuthUrl: SIPAE_OAUTH_URL,
    publishedAt: '2026-10-08T07:20:00.000Z',
    isNew: false,
  },
  {
    id: 'evt-3882',
    eventId: '3882',
    title:
      'Entre Desafios e Possibilidades: A Prática Pedagógica e a Flexibilização Curricular na EJA',
    summary:
      'Formação continuada para educadores da Educação de Jovens e Adultos (EJA) no portal SEDUCT.',
    category: 'EJA',
    imageUrl: 'https://seduct.campos.rj.gov.br/eventos/NOVO-CIRCUITO-DE-PENSAMENTO_2.jpg',
    url: 'https://seduct.campos.rj.gov.br/?p=eventos&id=3882',
    sipaeOAuthUrl: SIPAE_OAUTH_URL,
    publishedAt: '2026-10-08T07:10:00.000Z',
    isNew: false,
  },
  {
    id: 'evt-3892',
    eventId: '3892',
    title: 'Caminhos Compartilhantes com o PDDE em Campos dos Goytacazes - RJ - Sensibilização',
    summary:
      'Etapa de sensibilização do programa Caminhos Compartilhantes com o PDDE no portal SEDUCT.',
    category: 'Gestores',
    imageUrl: 'https://seduct.campos.rj.gov.br/eventos/NOVO-NEUROCIENCIA-NA-EDUCACAO-2.jpg',
    url: 'https://seduct.campos.rj.gov.br/?p=eventos&id=3892',
    sipaeOAuthUrl: SIPAE_OAUTH_URL,
    publishedAt: '2026-10-08T07:05:00.000Z',
    isNew: false,
  },
  {
    id: 'evt-3895',
    eventId: '3895',
    title: 'Professor 4.0: Tecnologias que transformam a sala de aula',
    summary:
      'Formação voltada para tecnologias educacionais e inovação pedagógica na sala de aula.',
    category: 'Professores Orientadores de Tecnologias Educacionais',
    imageUrl: 'https://seduct.campos.rj.gov.br/eventos/Copia-de-CARD-S-FORMACOES-2026_1.jpg',
    url: 'https://seduct.campos.rj.gov.br/?p=eventos&id=3895',
    sipaeOAuthUrl: SIPAE_OAUTH_URL,
    publishedAt: '2026-10-08T07:00:00.000Z',
    isNew: false,
  },
  {
    id: 'evt-3894',
    eventId: '3894',
    title: 'PGE - Programa de Gestão Escolar',
    summary: 'Formação do Programa de Gestão Escolar (PGE) da SEDUCT Campos dos Goytacazes.',
    category: 'Gestores',
    imageUrl: 'https://seduct.campos.rj.gov.br/eventos/pge_1.jpg',
    url: 'https://seduct.campos.rj.gov.br/?p=eventos&id=3894',
    sipaeOAuthUrl: SIPAE_OAUTH_URL,
    publishedAt: '2026-10-08T06:50:00.000Z',
    isNew: false,
  },
  {
    id: 'evt-3883',
    eventId: '3883',
    title: 'Formação de Regentes: Técnica de Regência e Pedagogia Musical',
    summary: 'Formação continuada em Técnica de Regência e Pedagogia Musical pela EFEM / SEDUCT.',
    category: 'Formações EFEM',
    imageUrl: 'https://seduct.campos.rj.gov.br/eventos/NOVO-CIRCUITO-DE-PENSAMENTO_1.jpg',
    url: 'https://seduct.campos.rj.gov.br/?p=eventos&id=3883',
    sipaeOAuthUrl: SIPAE_OAUTH_URL,
    publishedAt: '2026-10-08T06:45:00.000Z',
    isNew: false,
  },
  {
    id: 'evt-3873',
    eventId: '3873',
    title:
      'CUIDAR DE QUEM CUIDA: UMA EXPERIÊNCIA DE AUTOCUIDADO, SAÚDE MENTAL E CUIDADO COM O OUTRO',
    summary:
      'Encontro formativo voltado ao autocuidado, saúde mental e acolhimento dos profissionais da educação.',
    category: 'Educação Infantil / Creche',
    imageUrl: 'https://seduct.campos.rj.gov.br/eventos/CUIDAR-DE-QUEM-CUIDA.jpg',
    url: 'https://seduct.campos.rj.gov.br/?p=eventos&id=3873',
    sipaeOAuthUrl: SIPAE_OAUTH_URL,
    publishedAt: '2026-10-08T06:40:00.000Z',
    isNew: false,
  },
  {
    id: 'evt-3891',
    eventId: '3891',
    title: 'Formação e Alinhamento Pedagógico: 5º Ano',
    summary:
      'Formação e Alinhamento Pedagógico para professores do 5º Ano do Ensino Fundamental (Anos Iniciais).',
    category: 'Ensino Fundamental (anos iniciais)',
    imageUrl: 'https://seduct.campos.rj.gov.br/eventos/NOVO-CIRCUITO-DE-PENSAMENTO-5.jpg',
    url: 'https://seduct.campos.rj.gov.br/?p=eventos&id=3891',
    sipaeOAuthUrl: SIPAE_OAUTH_URL,
    publishedAt: '2026-10-08T06:35:00.000Z',
    isNew: false,
  },
  {
    id: 'evt-3890',
    eventId: '3890',
    title: 'Formação e Alinhamento Pedagógico: 4º Ano',
    summary:
      'Formação e Alinhamento Pedagógico para professores do 4º Ano do Ensino Fundamental (Anos Iniciais).',
    category: 'Ensino Fundamental (anos iniciais)',
    imageUrl: 'https://seduct.campos.rj.gov.br/eventos/NOVO-CIRCUITO-DE-PENSAMENTO-4.jpg',
    url: 'https://seduct.campos.rj.gov.br/?p=eventos&id=3890',
    sipaeOAuthUrl: SIPAE_OAUTH_URL,
    publishedAt: '2026-10-08T06:30:00.000Z',
    isNew: false,
  },
  {
    id: 'evt-3870',
    eventId: '3870',
    title: 'Saberes das Águas e Memórias da Terra',
    summary:
      'Formação em arte na Casa de Cultura José Cândido de Carvalho para Professores dos Anos Iniciais do Ensino Fundamental.',
    category: 'Ensino Fundamental (anos iniciais)',
    imageUrl: 'https://seduct.campos.rj.gov.br/eventos/Saberes-das-aguas.jpg',
    url: 'https://seduct.campos.rj.gov.br/?p=eventos&id=3870',
    sipaeOAuthUrl: SIPAE_OAUTH_URL,
    publishedAt: '2026-09-28T08:00:00.000Z',
    isNew: false,
  },
];

const initialDatabase: DatabaseSchema = {
  accessLogs: [
    {
      id: 'acc-1',
      timestamp: '2026-10-08T08:15:00.000Z',
      page: 'Capa -> EFEM Institucional',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      sipaeEmail: 'maria.silva@edu.campos.rj.gov.br',
    },
    {
      id: 'acc-2',
      timestamp: '2026-10-08T08:42:00.000Z',
      page: 'Formações -> Gestores (PDDE)',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      sipaeEmail: 'carlos.gestor@edu.campos.rj.gov.br',
    },
    {
      id: 'acc-3',
      timestamp: '2026-10-08T09:10:00.000Z',
      page: 'Formações -> Ensino Fundamental (anos iniciais) - Evento #3870',
      userAgent: 'Mozilla/5.0 (Linux; Android 14)',
      sipaeEmail: 'ana.pedagoga@edu.campos.rj.gov.br',
    },
  ],
  sipaeLogins: [
    {
      id: 'sipae-1',
      email: 'maria.silva@edu.campos.rj.gov.br',
      name: 'Maria Clara da Silva',
      role: 'Professora - Ensino Fundamental (Anos Iniciais)',
      schoolUnit: 'E.M. Castelo Branco',
      loggedAt: '2026-10-08T08:15:22.000Z',
    },
    {
      id: 'sipae-2',
      email: 'carlos.gestor@edu.campos.rj.gov.br',
      name: 'Carlos Eduardo Rangel',
      role: 'Diretor Escolar (Gestor)',
      schoolUnit: 'C.M. 29 de Maio',
      loggedAt: '2026-10-08T08:40:10.000Z',
    },
    {
      id: 'sipae-3',
      email: 'ana.pedagoga@edu.campos.rj.gov.br',
      name: 'Ana Beatriz Peixoto',
      role: 'Pedagoga',
      schoolUnit: 'E.M. Frederico Paes',
      loggedAt: '2026-10-08T09:05:44.000Z',
    },
    {
      id: 'sipae-4',
      email: 'lumaraiapedagoga@gmail.com',
      name: 'Lu Maraia (Coordenação Pedagógica)',
      role: 'Pedagoga / Formadora EFEM',
      schoolUnit: 'SEDUCT / EFEM Campos',
      loggedAt: '2026-10-08T09:20:00.000Z',
    },
  ],
  enrollments: [
    {
      id: 'enr-1',
      courseId: '3870',
      courseTitle: 'Saberes das Águas e Memórias da Terra',
      category: 'Ensino Fundamental (anos iniciais)',
      seductUrl: 'https://seduct.campos.rj.gov.br/?p=eventos&id=3870',
      eventDate: '2026-09-28',
      eventTime: '08:30',
      location: 'Casa de Cultura José Cândido de Carvalho',
      participantName: 'Maria Clara da Silva',
      sipaeEmail: 'maria.silva@edu.campos.rj.gov.br',
      enrolledAt: '2026-10-08T08:18:00.000Z',
    },
    {
      id: 'enr-2',
      courseId: '3886',
      courseTitle: 'Caminhos Compartilhantes com o PDDE em Campos dos Goytacazes - RJ',
      category: 'Gestores',
      seductUrl: 'https://seduct.campos.rj.gov.br/?p=eventos&id=3886',
      eventDate: '2026-10-30',
      eventTime: '08:00',
      location: 'Auditório do Colégio Salesiano - Av. Dom Bosco, 49 - Parque Tamandaré',
      participantName: 'Carlos Eduardo Rangel',
      sipaeEmail: 'carlos.gestor@edu.campos.rj.gov.br',
      enrolledAt: '2026-10-08T08:45:00.000Z',
    },
    {
      id: 'enr-3',
      courseId: 'alinhamento-2027-fev',
      courseTitle: 'Alinhamento Pedagógico 2027 - Ensino Fundamental Anos Iniciais',
      category: 'Formação e Alinhamento',
      seductUrl: 'https://pae.seduct.campos.rj.gov.br/efem/',
      eventDate: '2027-02-22',
      eventTime: '08:30',
      location: 'Polo Formativo EFEM / SEDUCT',
      participantName: 'Ana Beatriz Peixoto',
      sipaeEmail: 'ana.pedagoga@edu.campos.rj.gov.br',
      enrolledAt: '2026-10-08T09:12:00.000Z',
    },
  ],
  appointments: [
    {
      id: 'apt-1',
      title: 'Formação: Caminhos Compartilhantes com o PDDE em Campos dos Goytacazes - RJ',
      date: '2026-10-30',
      time: '08:00',
      category: 'Gestores',
      email: '',
      notifyPhone: true,
      notify24hSent: false,
      notify1hSent: false,
      isAutoFromCourse: true,
      courseUrl: 'https://seduct.campos.rj.gov.br/?p=eventos&id=3886',
      notes:
        'Local: Auditório do Colégio Salesiano - Av. Dom Bosco, 49 - Parque Tamandaré (8h às 17h30 - Total 8h)',
      createdAt: '2026-10-08T08:45:00.000Z',
    },
    {
      id: 'apt-2',
      title: 'Saberes das Águas e Memórias da Terra',
      date: '2026-09-28',
      time: '08:30',
      category: 'Ensino Fundamental (anos iniciais)',
      email: '',
      notifyPhone: true,
      notify24hSent: false,
      notify1hSent: false,
      isAutoFromCourse: true,
      courseUrl: 'https://seduct.campos.rj.gov.br/?p=eventos&id=3870',
      notes:
        'Inscrição vinculada automaticamente pelo portal de Eventos SEDUCT (ID 3870 - Casa de Cultura José Cândido de Carvalho). Lembrete configurado para 24h e 1h antes.',
      createdAt: '2026-10-08T08:18:00.000Z',
    },
  ],
  seductFeed: DEFAULT_LIVE_SEDUCT_EVENTS,
  admins: [
    {
      id: 'admin-1',
      name: 'Lu Maraia',
      email: 'lumaraiapedagoga@gmail.com',
      role: 'Super Administradora / Coordenação Pedagógica EFEM',
      schoolUnit: 'SEDUCT / EFEM Campos dos Goytacazes',
      permissions: {
        canUpdateCourses: true,
        canSyncSeduct: true,
        canSendAlerts: true,
        canManageAdmins: true,
        canExportReports: true,
      },
      createdAt: '2026-10-01T08:00:00.000Z',
      status: 'active',
    },
    {
      id: 'admin-luciana',
      name: 'Luciana',
      email: 'luciana.15432@edu.campos.rj.gov.br',
      role: 'Administradora / Desenvolvedora EFEM',
      schoolUnit: 'SEDUCT / EFEM Campos dos Goytacazes',
      permissions: {
        canUpdateCourses: true,
        canSyncSeduct: true,
        canSendAlerts: true,
        canManageAdmins: true,
        canExportReports: true,
      },
      createdAt: '2026-10-01T08:00:00.000Z',
      status: 'active',
    },
    {
      id: 'admin-2',
      name: 'Administração Geral EFEM',
      email: 'admin.efem@edu.campos.rj.gov.br',
      role: 'Administrador do Sistema',
      schoolUnit: 'SEDUCT Campos dos Goytacazes',
      permissions: {
        canUpdateCourses: true,
        canSyncSeduct: true,
        canSendAlerts: true,
        canManageAdmins: true,
        canExportReports: true,
      },
      createdAt: '2026-10-01T08:00:00.000Z',
      status: 'active',
    },
  ],
  broadcastAlerts: [],
  lastUpdated: new Date().toISOString(),
};

function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(initialDatabase, null, 2), 'utf-8');
      return initialDatabase;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    let mutated = false;
    // Ensure seductFeed has the latest real events with imageUrl
    if (!parsed.seductFeed || !parsed.seductFeed[0]?.imageUrl) {
      parsed.seductFeed = DEFAULT_LIVE_SEDUCT_EVENTS;
      parsed.enrollments = initialDatabase.enrollments;
      parsed.appointments = initialDatabase.appointments;
      mutated = true;
    }
    if (!parsed.admins || parsed.admins.length === 0) {
      parsed.admins = initialDatabase.admins;
      mutated = true;
    }

    // Garantir que as administradoras principais estejam cadastradas
    const hasLuciana = (parsed.admins || []).some(
      (a) => a.email.toLowerCase() === 'luciana.15432@edu.campos.rj.gov.br'
    );
    if (!hasLuciana) {
      parsed.admins.push({
        id: 'admin-luciana',
        name: 'Luciana',
        email: 'luciana.15432@edu.campos.rj.gov.br',
        role: 'Administradora / Desenvolvedora EFEM',
        schoolUnit: 'SEDUCT / EFEM Campos dos Goytacazes',
        permissions: {
          canUpdateCourses: true,
          canSyncSeduct: true,
          canSendAlerts: true,
          canManageAdmins: true,
          canExportReports: true,
        },
        createdAt: '2026-10-01T08:00:00.000Z',
        status: 'active',
      });
      mutated = true;
    }

    if (!parsed.broadcastAlerts) {
      parsed.broadcastAlerts = [];
      mutated = true;
    }
    if (mutated) {
      fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
    }
    return parsed;
  } catch (err) {
    console.error('Error reading DB:', err);
    return initialDatabase;
  }
}

function writeDb(data: DatabaseSchema) {
  try {
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

// Helper to scrape live events and updates from both SEDUCT and SIPAE (https://sipae.campos.rj.gov.br/)
async function scrapeLiveSeductEvents(): Promise<SeductNotification[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch('https://seduct.campos.rj.gov.br/?p=eventos', {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(timeout);
    if (!response.ok) return DEFAULT_LIVE_SEDUCT_EVENTS;

    const html = await response.text();
    const eventBlockRegex = /<a href=['"]\?p=eventos&id=(\d+)['"]>([\s\S]*?)<\/span>/gi;
    const found: SeductNotification[] = [];
    let blockMatch: RegExpExecArray | null;

    while ((blockMatch = eventBlockRegex.exec(html)) !== null) {
      const eventId = blockMatch[1].trim();
      const content = blockMatch[2];
      const srcMatch = content.match(/src=['"]([^'"]+)['"]/i);
      const altMatch = content.match(/alt=['"]([^'"]*)['"]/i);
      const titleMatch = content.match(/<span class=['"]card-title['"][^>]*><a[^>]*>([^<]+)<\/a>/i);

      const title = (titleMatch ? titleMatch[1] : (altMatch ? altMatch[1] : '')).trim();
      let imageUrl = srcMatch ? srcMatch[1].trim() : '';

      // Ignore malicious pentest file records or broken scripts
      if (
        !eventId ||
        !title ||
        title.length < 3 ||
        imageUrl.endsWith('.txt') ||
        imageUrl.endsWith('.php') ||
        title.toLowerCase().includes('pentest')
      ) {
        continue;
      }

      // Ensure proper image url
      if (imageUrl === 'https://seduct.campos.rj.gov.br/eventos/' || !imageUrl) {
        imageUrl = 'https://seduct.campos.rj.gov.br/eventos/CARD-MODELO-TODOS_64.jpg';
      }

      found.push({
        id: `evt-${eventId}`,
        eventId,
        title,
        summary: `Publicação oficial sincronizada em tempo real do portal SEDUCT / SIPAE (https://sipae.campos.rj.gov.br/ - Evento #${eventId}). Toque para se inscrever com seu e-mail institucional.`,
        category: 'Portal de Eventos SEDUCT / SIPAE',
        imageUrl,
        url: `https://seduct.campos.rj.gov.br/?p=eventos&id=${eventId}`,
        sipaeOAuthUrl: SIPAE_OAUTH_URL,
        publishedAt: new Date().toISOString(),
        isNew: true,
      });
      if (found.length >= 25) break;
    }

    return found.length > 0 ? found : DEFAULT_LIVE_SEDUCT_EVENTS;
  } catch (e) {
    console.error('Error scraping SEDUCT events:', e);
    return DEFAULT_LIVE_SEDUCT_EVENTS;
  }
}

// Verificação em tempo real do portal SIPAE (https://sipae.campos.rj.gov.br/)
let lastKnownSipaeHash = '';
async function checkSipaeSiteUpdates(): Promise<{ updated: boolean; title?: string; url?: string; summary?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch('https://sipae.campos.rj.gov.br/', {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return { updated: false };

    const html = await res.text();
    // Identificador simples de conteúdo e data do SIPAE
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const siteTitle = titleMatch ? titleMatch[1].trim() : 'SIPAE Campos dos Goytacazes';
    const contentSignature = `${html.length}-${html.substring(0, 500).replace(/\s+/g, '')}`;

    if (lastKnownSipaeHash && lastKnownSipaeHash !== contentSignature) {
      lastKnownSipaeHash = contentSignature;
      return {
        updated: true,
        title: 'Nova Atualização no Portal SIPAE!',
        url: 'https://sipae.campos.rj.gov.br/',
        summary: `O portal SIPAE (${siteTitle}) foi atualizado com novos conteúdos, cadernos ou serviços pedagógicos.`,
      };
    }
    lastKnownSipaeHash = contentSignature;
    return { updated: false, url: 'https://sipae.campos.rj.gov.br/' };
  } catch (err) {
    return { updated: false, url: 'https://sipae.campos.rj.gov.br/' };
  }
}

// Envio de Notificação Automática por E-mail Institucional (Simulador + Registro em Banco de Dados)
export interface EmailNotificationLog {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  content: string;
  type: 'enrollment' | 'appointment';
  sentAt: string;
  status: 'sent' | 'delivered';
}

function sendEmailNotification(to: string, name: string, subject: string, content: string, type: 'enrollment' | 'appointment'): EmailNotificationLog {
  const log: EmailNotificationLog = {
    id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    recipientEmail: to,
    recipientName: name,
    subject,
    content,
    type,
    sentAt: new Date().toISOString(),
    status: 'sent',
  };
  console.log(`\n==================================================`);
  console.log(`[EMAIL AUTOMÁTICO ENVIADO COM SUCESSO]`);
  console.log(`Para: ${name} <${to}>`);
  console.log(`Assunto: ${subject}`);
  console.log(`Tipo: ${type === 'enrollment' ? 'Inscrição SIPAE' : 'Compromisso Minha Agenda'}`);
  console.log(`Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
  console.log(`Conteúdo:\n${content}`);
  console.log(`==================================================\n`);
  return log;
}

// Proxy de Imagens da SEDUCT com cache no servidor para contornar bloqueios de CORS, iframe e Referer
app.get('/api/proxy-image', async (req, res) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl || !imageUrl.startsWith('http')) {
    res.status(400).send('URL de imagem inválida');
    return;
  }
  try {
    const upstreamRes = await fetch(imageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': 'https://seduct.campos.rj.gov.br/',
      },
    });
    if (!upstreamRes.ok) {
      res.redirect(imageUrl);
      return;
    }
    const contentType = upstreamRes.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    const buffer = Buffer.from(await upstreamRes.arrayBuffer());
    res.send(buffer);
  } catch {
    res.redirect(imageUrl);
  }
});

// API: Verificar atualizações recentes no portal da SEDUCT e SIPAE (https://sipae.campos.rj.gov.br/)
app.get('/api/check-seduct-updates', async (_req, res) => {
  const db = readDb();
  const sipaeCheck = await checkSipaeSiteUpdates();
  res.json({
    ok: true,
    feed: db.seductFeed,
    sipaeUpdated: sipaeCheck.updated,
    sipaeUpdateInfo: sipaeCheck.updated ? sipaeCheck : null,
    lastUpdated: db.lastUpdated,
  });
});

// API: Checagem explícita de atualizações do SIPAE (https://sipae.campos.rj.gov.br/)
app.get('/api/check-sipae-updates', async (_req, res) => {
  const result = await checkSipaeSiteUpdates();
  res.json({
    ok: true,
    portal: 'https://sipae.campos.rj.gov.br/',
    updated: result.updated,
    info: result,
  });
});

// API: Get all database state & analytics
app.get('/api/data', (req, res) => {
  const db = readDb();
  if (isAuthorizedSuperAdmin(req)) {
    return res.json(db);
  }
  // Para usuários comuns: não expor a lista de administradores ou seus e-mails
  const sanitizedDb = {
    ...db,
    admins: [],
  };
  res.json(sanitizedDb);
});

// API: Log access
app.post('/api/access', (req, res) => {
  const db = readDb();
  const { page, sipaeEmail } = req.body;
  const newLog: AccessLog = {
    id: `acc-${Date.now()}`,
    timestamp: new Date().toISOString(),
    page: page || 'Página Inicial',
    userAgent: req.headers['user-agent'] || 'Navegador Web / Mobile',
    sipaeEmail: sipaeEmail || undefined,
  };
  db.accessLogs.unshift(newLog);
  if (db.accessLogs.length > 300) db.accessLogs.pop();
  writeDb(db);
  res.json({ ok: true, log: newLog });
});

// API: Log SIPAE institutional email login
app.post('/api/sipae-login', (req, res) => {
  const db = readDb();
  const { email, name, role, schoolUnit } = req.body;
  if (!email) {
    res.status(400).json({ error: 'E-mail institucional é obrigatório.' });
    return;
  }
  const record: SipaeLoginRecord = {
    id: `sipae-${Date.now()}`,
    email: String(email).trim(),
    name: String(name || 'Educador(a) da Rede Municipal').trim(),
    role: String(role || 'Professor(a)').trim(),
    schoolUnit: String(schoolUnit || 'Rede Municipal SEDUCT Campos').trim(),
    loggedAt: new Date().toISOString(),
  };
  db.sipaeLogins.unshift(record);
  writeDb(db);
  res.json({ ok: true, record });
});

// API: Register Enrollment in Formation or Alignment + Auto-create Smart Agenda Reminder + Envio Automático de E-mail
app.post('/api/enroll', (req, res) => {
  const db = readDb();
  const {
    courseId,
    courseTitle,
    category,
    seductUrl,
    eventDate,
    eventTime,
    location,
    participantName,
    sipaeEmail,
  } = req.body;

  const enrollment: EnrollmentRecord = {
    id: `enr-${Date.now()}`,
    courseId: String(courseId || 'formacao'),
    courseTitle: String(courseTitle || 'Formação Continuada EFEM'),
    category: String(category || 'Formações'),
    seductUrl: String(seductUrl || 'https://seduct.campos.rj.gov.br/?p=eventos'),
    eventDate: String(eventDate || '2026-10-30'),
    eventTime: String(eventTime || '08:00'),
    location: String(location || 'Polo EFEM / SEDUCT Campos'),
    participantName: String(participantName || 'Educador(a) SEDUCT'),
    sipaeEmail: String(sipaeEmail || 'nao-informado@edu.campos.rj.gov.br'),
    enrolledAt: new Date().toISOString(),
  };

  db.enrollments.unshift(enrollment);

  if (sipaeEmail && String(sipaeEmail).includes('@')) {
    const cleanEmail = String(sipaeEmail).trim();
    const existsLogin = db.sipaeLogins.some(
      (l) => l.email.toLowerCase() === cleanEmail.toLowerCase()
    );
    if (!existsLogin) {
      db.sipaeLogins.unshift({
        id: `sipae-${Date.now()}`,
        email: cleanEmail,
        name: enrollment.participantName,
        role: enrollment.category,
        schoolUnit: 'Inscrição Direta Portal SEDUCT / SIPAE',
        loggedAt: new Date().toISOString(),
      });
    }

    // Disparo automático de e-mail de confirmação da inscrição do SIPAE
    sendEmailNotification(
      cleanEmail,
      enrollment.participantName,
      `Confirmação de Inscrição: ${enrollment.courseTitle} - EFEM / SIPAE SEDUCT`,
      `Olá, ${enrollment.participantName}!\n\nSua inscrição para o curso/formação "${enrollment.courseTitle}" no portal SIPAE / SEDUCT foi confirmada com sucesso!\n\nDetalhes do Evento:\n- Data: ${enrollment.eventDate}\n- Horário: ${enrollment.eventTime}\n- Local: ${enrollment.location}\n- Segmento: ${enrollment.category}\n- Link oficial no portal: ${enrollment.seductUrl}\n\nLembretes automáticos foram agendados para 24h e 1h antes no aplicativo EFEM SEDUCT.\n\nAtenciosamente,\nCoordenação EFEM / SEDUCT Campos dos Goytacazes`,
      'enrollment'
    );
  }

  // Automatically add to Smart Agenda with 24h and 1h reminders
  const autoAppointment: AppointmentRecord = {
    id: `apt-${Date.now()}`,
    title: `[Inscrição SEDUCT] ${enrollment.courseTitle}`,
    date: enrollment.eventDate,
    time: enrollment.eventTime,
    category: enrollment.category,
    email: sipaeEmail && sipaeEmail.includes('@') ? sipaeEmail : '',
    notifyPhone: true,
    notify24hSent: false,
    notify1hSent: false,
    isAutoFromCourse: true,
    courseUrl: enrollment.seductUrl,
    notes: `Inscrição sincronizada automaticamente. Local: ${enrollment.location}. Lembrete ativo para 1 dia (24h) e 1 hora de antecedência.`,
    createdAt: new Date().toISOString(),
  };

  db.appointments.unshift(autoAppointment);
  writeDb(db);

  res.json({
    ok: true,
    enrollment,
    autoAppointment,
  });
});

// API: Create or delete Smart Agenda appointment + Notificação Automática por E-mail
app.post('/api/appointments', (req, res) => {
  const db = readDb();
  const { title, date, time, category, email, notifyPhone, notes } = req.body;
  if (!title || !date || !time) {
    res.status(400).json({ error: 'Nome do compromisso, data e horário são obrigatórios.' });
    return;
  }
  const cleanEmail = email ? String(email).trim() : '';
  const newApt: AppointmentRecord = {
    id: `apt-${Date.now()}`,
    title: String(title).trim(),
    date: String(date).trim(),
    time: String(time).trim(),
    category: String(category || 'Compromisso Pedagógico'),
    email: cleanEmail,
    notifyPhone: notifyPhone !== false,
    notify24hSent: false,
    notify1hSent: false,
    isAutoFromCourse: false,
    notes: notes
      ? String(notes).trim()
      : 'Lembrete programado para 24h antes e 1h antes no celular.',
    createdAt: new Date().toISOString(),
  };

  db.appointments.unshift(newApt);
  writeDb(db);

  // Disparo automático de e-mail ao agendar compromisso no Minha Agenda
  if (cleanEmail && cleanEmail.includes('@')) {
    sendEmailNotification(
      cleanEmail,
      'Educador(a) SEDUCT',
      `Novo Compromisso Agendado: ${newApt.title} - Minha Agenda EFEM`,
      `Olá!\n\nSeu compromisso foi agendado com sucesso na Minha Agenda do aplicativo EFEM SEDUCT:\n\n- Compromisso: ${newApt.title}\n- Data: ${newApt.date.split('-').reverse().join('/')}\n- Horário: ${newApt.time}\n- Categoria: ${newApt.category}\n- Observações: ${newApt.notes}\n\nVocê também receberá alertas no aplicativo estilo WhatsApp com som e vibração.\n\nAtenciosamente,\nEquipe EFEM / SEDUCT`,
      'appointment'
    );
  }

  res.json({ ok: true, appointment: newApt });
});

app.delete('/api/appointments/:id', (req, res) => {
  const db = readDb();
  db.appointments = db.appointments.filter((a) => a.id !== req.params.id);
  writeDb(db);
  res.json({ ok: true });
});

// API: Live Extension Sync with https://seduct.campos.rj.gov.br/?p=eventos
app.post('/api/seduct-sync', async (_req, res) => {
  const db = readDb();
  const liveEvents = await scrapeLiveSeductEvents();
  db.seductFeed = liveEvents;
  writeDb(db);

  res.json({
    ok: true,
    syncedAt: new Date().toISOString(),
    latestNotification: liveEvents[0],
    feed: db.seductFeed,
  });
});

// =========================================================================
// API: GESTÃO DE ADMINISTRADORES DO GOOGLE AI STUDIO / EFEM SEDUCT
// Acesso restrito exclusivamente a:
// 1) lumaraiapedagoga@gmail.com (e lumaraiapedagoga@gmail)
// 2) luciana.15432@edu.campos.rj.gov.br
// =========================================================================

const AUTHORIZED_ADMIN_EMAILS = [
  'lumaraiapedagoga@gmail.com',
  'lumaraiapedagoga@gmail',
  'luciana.15432@edu.campos.rj.gov.br',
];

function isAuthorizedSuperAdmin(req: express.Request): boolean {
  const emailFromHeader = req.headers['x-admin-email'];
  const emailFromBody = req.body?.requesterEmail || req.body?.adminEmail;
  const emailFromQuery = req.query?.adminEmail;
  const candidate = (emailFromHeader || emailFromBody || emailFromQuery || '')
    .toString()
    .trim()
    .toLowerCase();

  return AUTHORIZED_ADMIN_EMAILS.some((allowed) => allowed.toLowerCase() === candidate);
}

// Listar todos os administradores cadastrados (somente administradores autorizados)
app.get('/api/admins', (req, res) => {
  if (!isAuthorizedSuperAdmin(req)) {
    return res.json({
      ok: true,
      admins: [],
      count: 0,
    });
  }
  const db = readDb();
  res.json({
    ok: true,
    admins: db.admins || [],
    count: (db.admins || []).length,
  });
});

// Inserir / Cadastrar novo administrador
app.post('/api/admins', (req, res) => {
  if (!isAuthorizedSuperAdmin(req)) {
    res.status(403).json({
      error:
        'Acesso negado. Apenas a administração autorizada possui permissão para cadastrar administradores e colaboradores do aplicativo.',
    });
    return;
  }

  const db = readDb();
  const { name, email, role, schoolUnit, permissions } = req.body;

  if (!email || !String(email).includes('@')) {
    res.status(400).json({ error: 'E-mail válido é obrigatório para cadastrar o administrador.' });
    return;
  }
  if (!name || String(name).trim().length < 2) {
    res.status(400).json({ error: 'Nome do administrador é obrigatório.' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const existingIdx = (db.admins || []).findIndex(
    (a) => a.email.toLowerCase() === cleanEmail
  );

  if (existingIdx >= 0) {
    // Atualiza cadastro existente
    db.admins[existingIdx].name = String(name).trim();
    db.admins[existingIdx].role = String(role || db.admins[existingIdx].role).trim();
    if (schoolUnit) db.admins[existingIdx].schoolUnit = String(schoolUnit).trim();
    if (permissions) {
      db.admins[existingIdx].permissions = {
        ...db.admins[existingIdx].permissions,
        ...permissions,
      };
    }
    db.admins[existingIdx].status = 'active';
    writeDb(db);
    res.json({ ok: true, admin: db.admins[existingIdx], updated: true });
    return;
  }

  const newAdmin: AdminUser = {
    id: `admin-${Date.now()}`,
    name: String(name).trim(),
    email: cleanEmail,
    role: String(role || 'Administrador(a) EFEM').trim(),
    schoolUnit: String(schoolUnit || 'SEDUCT / EFEM Campos dos Goytacazes').trim(),
    permissions: {
      canUpdateCourses: permissions?.canUpdateCourses !== false,
      canSyncSeduct: permissions?.canSyncSeduct !== false,
      canSendAlerts: permissions?.canSendAlerts !== false,
      canManageAdmins: permissions?.canManageAdmins === true,
      canExportReports: permissions?.canExportReports !== false,
    },
    createdAt: new Date().toISOString(),
    status: 'active',
  };

  db.admins = db.admins || [];
  db.admins.push(newAdmin);
  writeDb(db);

  res.json({ ok: true, admin: newAdmin, created: true });
});

// Atualizar status ou permissões do administrador
app.patch('/api/admins/:id', (req, res) => {
  if (!isAuthorizedSuperAdmin(req)) {
    res.status(403).json({
      error:
        'Acesso negado. Apenas a administração autorizada possui permissão para alterar administradores.',
    });
    return;
  }

  const db = readDb();
  const { status, role, schoolUnit, permissions } = req.body;
  const admin = (db.admins || []).find((a) => a.id === req.params.id);

  if (!admin) {
    res.status(404).json({ error: 'Administrador não encontrado.' });
    return;
  }

  if (status) admin.status = status;
  if (role) admin.role = String(role).trim();
  if (schoolUnit) admin.schoolUnit = String(schoolUnit).trim();
  if (permissions) {
    admin.permissions = {
      ...admin.permissions,
      ...permissions,
    };
  }

  writeDb(db);
  res.json({ ok: true, admin });
});

// Remover administrador
app.delete('/api/admins/:id', (req, res) => {
  if (!isAuthorizedSuperAdmin(req)) {
    res.status(403).json({
      error:
        'Acesso negado. Apenas a administração autorizada possui permissão para remover administradores.',
    });
    return;
  }

  const db = readDb();
  const target = (db.admins || []).find((a) => a.id === req.params.id);

  if (!target) {
    res.status(404).json({ error: 'Administrador não encontrado.' });
    return;
  }

  // Proteger as contas das administradoras principais
  const cleanTargetEmail = target.email.toLowerCase();
  if (
    cleanTargetEmail === 'lumaraiapedagoga@gmail.com' ||
    cleanTargetEmail === 'lumaraiapedagoga@gmail' ||
    cleanTargetEmail === 'luciana.15432@edu.campos.rj.gov.br'
  ) {
    res.status(403).json({ error: 'As contas das administradoras principais autorizadas não podem ser removidas.' });
    return;
  }

  db.admins = (db.admins || []).filter((a) => a.id !== req.params.id);
  writeDb(db);
  res.json({ ok: true, removedId: req.params.id });
});

// Disparar Alerta / Notificação Geral estilo WhatsApp transmitida para todos os usuários
app.post('/api/broadcast-alert', (req, res) => {
  const db = readDb();
  const { title, message, authorEmail } = req.body;

  if (!title || !message) {
    res.status(400).json({ error: 'Título e mensagem são obrigatórios para disparar o alerta.' });
    return;
  }

  const alert: BroadcastAlertRecord = {
    id: `alert-${Date.now()}`,
    title: String(title).trim(),
    message: String(message).trim(),
    authorEmail: authorEmail ? String(authorEmail).trim() : 'Administrador EFEM',
    createdAt: new Date().toISOString(),
  };

  db.broadcastAlerts = db.broadcastAlerts || [];
  db.broadcastAlerts.unshift(alert);
  if (db.broadcastAlerts.length > 50) db.broadcastAlerts.pop();
  writeDb(db);

  res.json({ ok: true, alert });
});

// Obter alertas gerais recentes
app.get('/api/broadcast-alerts/latest', (_req, res) => {
  const db = readDb();
  const latest = (db.broadcastAlerts && db.broadcastAlerts.length > 0)
    ? db.broadcastAlerts[0]
    : null;
  res.json({ ok: true, latest });
});


// API: Gemini AI Assistant for Smart Agenda
app.post('/api/ai/agenda-assistant', async (req, res) => {
  try {
    const { prompt, appointments, enrollments, userRole } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.json({
        suggestion:
          'Olá, Educador(a) da Rede Municipal de Campos! Analisei sua agenda e suas inscrições na EFEM. Recomendo reservar 1 hora na véspera dos encontros presenciais para organizar suas anotações pedagógicas. Seus lembretes automáticos de 24 horas e 1 hora antes já estão ativos no seu aparelho!',
        recommendedAction: {
          title: 'Preparação Pedagógica e Leitura de Pauta - Formação EFEM',
          date: '2026-10-29',
          time: '19:00',
          category: userRole || 'Planejamento Pedagógico',
        },
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemPrompt = `Você é o Consultor Pedagógico Inteligente da EFEM (Escola de Formação de Educadores da Rede Municipal de Campos dos Goytacazes - SEDUCT).
Seu público são adultos profissionais da educação (professores de Creche, Educação Infantil, Ensino Fundamental Anos Iniciais e Finais, EJA, Sala de Recursos, Tecnologias Educacionais, Pedagogos e Gestores).
Sua linguagem deve ser acolhedora, emancipadora, lúdica, interativa e muito prática.
Analise os compromissos e inscrições do educador e responda de forma motivadora e estruturada, além de sugerir um compromisso complementar útil para a rotina docente.`;

    const userContext = `Solicitação do educador: "${prompt || 'Organize minha semana de formações e sugira um momento de estudo ou preparação.'}"
Cargo/Segmento: ${userRole || 'Educador da Rede Municipal SEDUCT'}
Compromissos atuais na Minha Agenda: ${JSON.stringify(appointments || [])}
Inscrições no portal SEDUCT: ${JSON.stringify(enrollments || [])}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userContext,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestion: {
              type: Type.STRING,
              description:
                'Mensagem lúdica, acolhedora e prática para o educador organizando sua rotina e formações.',
            },
            tipOfTheDay: {
              type: Type.STRING,
              description:
                'Uma pílula formativa ou dica rápida de bem-estar e gestão do tempo docente.',
            },
            recommendedAction: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                date: { type: Type.STRING, description: 'Formato YYYY-MM-DD' },
                time: { type: Type.STRING, description: 'Formato HH:mm' },
                category: { type: Type.STRING },
              },
              required: ['title', 'date', 'time', 'category'],
            },
          },
          required: ['suggestion', 'tipOfTheDay', 'recommendedAction'],
        },
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (error) {
    console.error('Gemini Agenda Assistant Error:', error);
    res.json({
      suggestion:
        'Organizei sua trilha formativa! Suas inscrições na EFEM/SEDUCT estão conectadas à sua agenda com alertas programados para 24h e 1h antes de cada encontro.',
      tipOfTheDay:
        'A formação continuada dá a chance ao professor de aprender, praticar e refletir sobre sua prática para construir caminhos emancipados.',
      recommendedAction: {
        title: 'Revisão de Materiais e Pauta EFEM/SEDUCT',
        date: '2026-10-29',
        time: '18:30',
        category: 'Planejamento Docente',
      },
    });
  }
});

async function startServer() {
  const appOrigin = (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/$/, '');

  // Bind to port 3000 immediately so the container health check succeeds without delay
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EFEM SEDUCT Server running on http://localhost:${PORT}`);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    app.get('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        const hostOrigin =
          req.headers['x-forwarded-proto'] && req.headers.host
            ? `${req.headers['x-forwarded-proto']}://${req.headers.host}`
            : appOrigin;
        template = template.replace(/content="\/og-efem\.png"/g, `content="${hostOrigin}/og-efem.png"`);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      try {
        const indexPath = path.join(distPath, 'index.html');
        let html = fs.readFileSync(indexPath, 'utf-8');
        const hostOrigin =
          req.headers['x-forwarded-proto'] && req.headers.host
            ? `${req.headers['x-forwarded-proto']}://${req.headers.host}`
            : appOrigin;
        html = html.replace(/content="\/og-efem\.png"/g, `content="${hostOrigin}/og-efem.png"`);
        res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
      } catch {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  // Sincronização periódica contínua em segundo plano com https://seduct.campos.rj.gov.br/?p=eventos
  const syncSeductBackground = async () => {
    try {
      const freshEvents = await scrapeLiveSeductEvents();
      if (freshEvents && freshEvents.length > 0) {
        const db = readDb();
        const existingIds = new Set((db.seductFeed || []).map((e) => e.eventId));
        const newEventsCount = freshEvents.filter((e) => !existingIds.has(e.eventId)).length;
        db.seductFeed = freshEvents;
        writeDb(db);
        if (newEventsCount > 0) {
          console.log(`[SEDUCT SYNC] ${newEventsCount} novo(s) evento(s) sincronizado(s) de https://seduct.campos.rj.gov.br/`);
        }
      }
    } catch (err) {
      console.error('[SEDUCT SYNC ERROR]:', err);
    }
  };

  setTimeout(syncSeductBackground, 3000);
  setInterval(syncSeductBackground, 90000);
}

startServer();
