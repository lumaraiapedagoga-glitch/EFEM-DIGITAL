/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  ExternalLink,
  Bell,
  RefreshCw,
  CheckCircle2,
  BookOpen,
  Calendar,
  Sparkles,
  UserCheck,
  Database,
  ZoomIn,
  ZoomOut,
  ChevronRight,
  Smartphone,
  Laptop,
  Monitor,
  Download,
  Copy,
  Check,
  Lock,
  Info,
  X,
  LogIn,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  EfemWallpaperBackground,
  EfemLogoGraphic,
  Event3870RealCard,
  GestoresPddePoster,
  SIPAE_GOOGLE_LOGIN_URL,
} from './components/EfemVisuals';
import { Calendar2027 } from './components/Calendar2027';
import { SmartAgenda } from './components/SmartAgenda';
import { DeveloperAnalyticsModal } from './components/DeveloperAnalyticsModal';
import { AdminManagerModal } from './components/AdminManagerModal';
import { usePWAInstall } from './usePWAInstall';
import type {
  AccessLog,
  SipaeLoginRecord,
  EnrollmentRecord,
  AppointmentRecord,
  SeductNotification,
  AdminUser,
} from '../server';

type PrimaryTab = 'efem' | 'formacoes' | 'alinhamento' | 'agenda';

import {
  FORMATION_SEGMENTS,
  type FormationSegment,
  type FormationCourseDetail,
} from './data/formationSegments';
import {
  getSeductProxiedImageUrl,
  notifyUserWhatsAppStyle,
  playWhatsAppChime,
} from './utils/seductNotification';

export const AUTHORIZED_ADMIN_EMAILS = [
  'lumaraiapedagoga@gmail.com',
  'lumaraiapedagoga@gmail',
  'luciana.15432@edu.campos.rj.gov.br',
];

export const isAuthorizedAdminEmail = (email?: string): boolean => {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return (
    clean === 'lumaraiapedagoga@gmail.com' ||
    clean === 'lumaraiapedagoga@gmail' ||
    clean === 'luciana.15432@edu.campos.rj.gov.br'
  );
};

export default function App() {
  // Navegação Superior (Abas em Azul Forte e Letras Brancas em Negrito)
  const [activeTab, setActiveTab] = useState<PrimaryTab>('efem');
  
  // Segmentos de Formação (Abas Verde Alface com Letras Azul Marinho em Negrito)
  // e Subcategorias (Mini Abas Azul Marinho com Letras Brancas)
  const [activeSegmentName, setActiveSegmentName] = useState<string>('Educação Infantil');
  const [activeSubcategoryName, setActiveSubcategoryName] = useState<string>('Professor(a) Creche');

  const currentSegment =
    FORMATION_SEGMENTS.find((s) => s.name === activeSegmentName) || FORMATION_SEGMENTS[0];
  const currentSubcategory =
    currentSegment.subcategories?.find((sub) => sub.name === activeSubcategoryName) ||
    currentSegment.subcategories?.[0];
  const currentCourse: FormationCourseDetail = currentSubcategory
    ? currentSubcategory.course
    : currentSegment.defaultCourse || FORMATION_SEGMENTS[0].subcategories![0].course;
  const currentAlignmentCourse: FormationCourseDetail | undefined = currentSubcategory
    ? currentSubcategory.alignmentCourse
    : currentSegment.defaultAlignmentCourse;
  const activeSubFormation = activeSubcategoryName
    ? `${activeSegmentName} - ${activeSubcategoryName}`
    : activeSegmentName;

  // Contador de cliques para o Desenvolvedor abrir o painel secreto
  const [devClicks, setDevClicks] = useState<number>(0);

  // Acessibilidade para Baixa Visão (Mínimo 16px até 24px redimensionável em todo o aplicativo)
  const [fontSizePx, setFontSizePx] = useState<number>(16);

  // Barra de Pesquisa Global já na página inicial
  const [searchQuery, setSearchQuery] = useState('');

  // Dados integrados ao Banco de Dados do Servidor e Extensão SEDUCT
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [sipaeLogins, setSipaeLogins] = useState<SipaeLoginRecord[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [seductFeed, setSeductFeed] = useState<SeductNotification[]>([]);
  const [syncingExtension, setSyncingExtension] = useState(false);

  // Notificações Mobile / Toast Interativo
  const [notificationToast, setNotificationToast] = useState<{
    title: string;
    message: string;
    url?: string;
  } | null>(null);

  // Modal de Inscrição com E-mail Institucional direto ao site do link + Lembrete Automático 24h e 1h
  const [enrollModalCourse, setEnrollModalCourse] = useState<{
    courseId: string;
    courseTitle: string;
    category: string;
    seductUrl: string;
    eventDate: string;
    eventTime: string;
    location: string;
  } | null>(null);
  const [participantName, setParticipantName] = useState('');
  const [sipaeEmail, setSipaeEmail] = useState('');
  const [redirectToSeductAfterEnroll, setRedirectToSeductAfterEnroll] = useState(true);

  // Modal de Login Institucional SIPAE, Painel de Administradores e Análise do Desenvolvedor
  const [showSipaeModal, setShowSipaeModal] = useState(false);
  const [showDevAnalytics, setShowDevAnalytics] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState(false);
  const [showInstallAppModal, setShowInstallAppModal] = useState(false);
  const [copiedAppUrl, setCopiedAppUrl] = useState(false);

  // Autenticação Exclusiva da Administração Autorizada
  const [authenticatedAdminEmail, setAuthenticatedAdminEmail] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('efem_auth_admin_email') || '';
    }
    return '';
  });
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [adminLoginInput, setAdminLoginInput] = useState('');
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);

  const isSuperAdmin =
    isAuthorizedAdminEmail(authenticatedAdminEmail) ||
    isAuthorizedAdminEmail(sipaeEmail);

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const handleSaveOrDownloadApp = async () => {
    if (isInstallable) {
      const installed = await install();
      if (installed) {
        triggerMobileNotification(
          'EFEM Instalado com Sucesso!',
          'O atalho com o ícone oficial da EFEM foi salvo na tela! Alertas do SIPAE e lembretes de 24h ativados.'
        );
        return;
      }
    }
    setShowInstallAppModal(true);
  };

  const handleCopyAppUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedAppUrl(true);
      setTimeout(() => setCopiedAppUrl(false), 3000);
    } catch {
      // fallback
    }
  };

  // Atualiza tamanho de fonte global (16px a 24px) para baixa visão
  useEffect(() => {
    document.documentElement.style.setProperty('--app-font-size', `${fontSizePx}px`);
  }, [fontSizePx]);

  // Carrega administradores cadastrados (protegido)
  const fetchAdmins = async (overrideEmail?: string) => {
    const adminEmail = overrideEmail || authenticatedAdminEmail;
    if (!adminEmail) {
      setAdmins([]);
      return;
    }
    try {
      const res = await fetch('/api/admins', {
        headers: {
          'x-admin-email': adminEmail,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins || []);
      }
    } catch (err) {
      console.error('Erro ao buscar administradores:', err);
    }
  };

  // Carrega estado inicial do banco de dados
  const fetchAllData = async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        setAccessLogs(data.accessLogs || []);
        setSipaeLogins(data.sipaeLogins || []);
        setEnrollments(data.enrollments || []);
        setAppointments(data.appointments || []);
        setSeductFeed(data.seductFeed || []);
        setAdmins(data.admins || []);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
    fetchAdmins();

    // Acesso do Desenvolvedor ou Administrador via parâmetro na URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryEmail = params.get('email') || params.get('admin_email');
      if (queryEmail && isAuthorizedAdminEmail(queryEmail)) {
        const clean = queryEmail.trim().toLowerCase();
        setAuthenticatedAdminEmail(clean);
        localStorage.setItem('efem_auth_admin_email', clean);
        setShowAdminModal(true);
      } else if (params.get('admin') === 'true') {
        const stored = localStorage.getItem('efem_auth_admin_email') || '';
        if (isAuthorizedAdminEmail(stored)) {
          setShowAdminModal(true);
        } else {
          setShowAdminLoginModal(true);
        }
      }
      if (params.get('dev') === 'true' || params.get('developer') === 'true') {
        setShowDevAnalytics(true);
      }
    }

    // Atalhos de teclado:
    // Ctrl + Shift + A ou Cmd + Shift + A -> Abre Gestão de Administradores (Exclusivo e-mails autorizados)
    // Ctrl + Shift + D ou Cmd + Shift + D -> Abre Painel de Análise do Desenvolvedor
    const handleAdminShortcuts = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        if (e.key.toLowerCase() === 'a') {
          e.preventDefault();
          const stored = localStorage.getItem('efem_auth_admin_email') || '';
          if (isAuthorizedAdminEmail(stored)) {
            setShowAdminModal((prev) => !prev);
          } else {
            setShowAdminLoginModal(true);
          }
        } else if (e.key.toLowerCase() === 'd') {
          e.preventDefault();
          setShowDevAnalytics((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleAdminShortcuts);

    // Monitoramento contínuo em tempo real de novas publicações em https://seduct.campos.rj.gov.br/ e https://sipae.campos.rj.gov.br/
    let lastSeenId = localStorage.getItem('efem_last_seduct_id') || '';
    let lastSipaeAlerted = localStorage.getItem('efem_last_sipae_alert') || '';

    const pollSeductUpdates = async () => {
      try {
        const res = await fetch('/api/check-seduct-updates');
        if (res.ok) {
          const data = await res.json();
          if (data.feed && data.feed.length > 0) {
            setSeductFeed(data.feed);
            const latest = data.feed[0];
            if (lastSeenId && latest.eventId !== lastSeenId) {
              notifyUserWhatsAppStyle(
                '🔔 Nova Formação SEDUCT / SIPAE Publicada!',
                `"${latest.title}" foi publicada no portal oficial. Toque para se inscrever!`,
                latest.url
              );
              setNotificationToast({
                title: '🔔 Nova Atualização no Portal SEDUCT / SIPAE!',
                message: latest.title,
                url: latest.url,
              });
            }
            lastSeenId = latest.eventId;
            localStorage.setItem('efem_last_seduct_id', latest.eventId);
          }

          // Alerta no ícone do aplicativo sempre que o site do SIPAE for atualizado
          if (data.sipaeUpdated && data.sipaeUpdateInfo) {
            const updateKey = `${data.sipaeUpdateInfo.title}-${Date.now().toString().slice(0, 7)}`;
            if (lastSipaeAlerted !== updateKey) {
              lastSipaeAlerted = updateKey;
              localStorage.setItem('efem_last_sipae_alert', updateKey);
              notifyUserWhatsAppStyle(
                '🌐 Portal SIPAE Atualizado!',
                data.sipaeUpdateInfo.summary || 'O portal https://sipae.campos.rj.gov.br/ recebeu novas atualizações de conteúdo e formações.',
                data.sipaeUpdateInfo.url || 'https://sipae.campos.rj.gov.br/'
              );
              setNotificationToast({
                title: '🌐 Portal SIPAE Atualizado!',
                message: 'Novas publicações e serviços pedagógicos disponíveis em https://sipae.campos.rj.gov.br/',
                url: 'https://sipae.campos.rj.gov.br/',
              });
            }
          }
        }
      } catch {
        // silencioso
      }

      // Checa transmissões de alertas gerais enviadas por administradores
      try {
        const alertRes = await fetch('/api/broadcast-alerts/latest');
        if (alertRes.ok) {
          const alertData = await alertRes.json();
          if (alertData.latest) {
            const lastAlertId = localStorage.getItem('efem_last_broadcast_id') || '';
            if (lastAlertId && lastAlertId !== alertData.latest.id) {
              notifyUserWhatsAppStyle(
                `📢 ${alertData.latest.title}`,
                alertData.latest.message
              );
              setNotificationToast({
                title: `📢 ${alertData.latest.title}`,
                message: alertData.latest.message,
              });
            }
            localStorage.setItem('efem_last_broadcast_id', alertData.latest.id);
          }
        }
      } catch {
        // silencioso
      }

      // Verificação automática de cursos do SIPAE faltando 24 horas (alerta no celular pelo aplicativo)
      try {
        const aptRes = await fetch('/api/data');
        if (aptRes.ok) {
          const d = await aptRes.json();
          const apts: AppointmentRecord[] = d.appointments || [];
          const now = Date.now();
          const notified24hKeys = JSON.parse(localStorage.getItem('efem_notified_24h_keys') || '[]');

          for (const apt of apts) {
            if (!apt.date) continue;
            // Converte data e hora para timestamp
            const [year, month, day] = apt.date.split('-').map(Number);
            const [hour, minute] = (apt.time || '08:00').split(':').map(Number);
            const eventTime = new Date(year, month - 1, day, hour || 8, minute || 0).getTime();
            const diffHours = (eventTime - now) / (1000 * 60 * 60);

            // Se estiver na janela de 24 horas antes do curso/formação (entre 0h e 24h)
            if (diffHours > 0 && diffHours <= 24) {
              const reminderKey = `reminder-24h-${apt.id}-${apt.date}`;
              if (!notified24hKeys.includes(reminderKey)) {
                notified24hKeys.push(reminderKey);
                localStorage.setItem('efem_notified_24h_keys', JSON.stringify(notified24hKeys));

                const hoursLeft = Math.round(diffHours);
                const timeLabel = hoursLeft <= 1 ? 'aproximadamente 1 hora' : `aproximadamente ${hoursLeft} horas`;

                notifyUserWhatsAppStyle(
                  '⏰ Faltam 24 Horas para sua Formação SIPAE!',
                  `Atenção educador(a): Falta ${timeLabel} para "${apt.title}". Prepare seu material pedagógico!`,
                  apt.courseUrl || 'https://sipae.campos.rj.gov.br/'
                );
                setNotificationToast({
                  title: '⏰ Faltam 24h para seu Curso no SIPAE!',
                  message: `Seu curso "${apt.title}" começa em ${apt.date.split('-').reverse().join('/')} às ${apt.time || '08:00'}.`,
                  url: apt.courseUrl,
                });
              }
            }
          }
        }
      } catch {
        // silencioso
      }
    };

    const updateInterval = setInterval(pollSeductUpdates, 30000);
    // Executa verificação inicial logo ao carregar
    setTimeout(pollSeductUpdates, 1500);

    return () => {
      window.removeEventListener('keydown', handleAdminShortcuts);
      clearInterval(updateInterval);
    };
  }, []);

  // Dispara notificação nativa no celular + som lúdico do WhatsApp + vibração + banner no app
  const triggerMobileNotification = (title: string, message: string, url?: string) => {
    setNotificationToast({ title, message, url });
    notifyUserWhatsAppStyle(title, message, url);
  };

  // Registra acesso no banco de dados quando usuário troca de aba
  const logPageAccess = async (pageName: string) => {
    try {
      await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: pageName,
          sipaeEmail: sipaeEmail || undefined,
        }),
      });
      fetchAllData();
    } catch {
      // ignore
    }
  };

  // Sincronização Automática com a Extensão https://seduct.campos.rj.gov.br/?p=eventos
  const handleSyncSeductExtension = async () => {
    setSyncingExtension(true);
    try {
      const res = await fetch('/api/seduct-sync', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSeductFeed(data.feed || []);
        triggerMobileNotification(
          'Extensão SEDUCT Sincronizada (seduct.campos.rj.gov.br/?p=eventos)',
          `Todas as imagens e publicações oficiais (${
            (data.feed || []).length
          } cursos/eventos ativos) foram atualizadas em tempo real!`,
          'https://seduct.campos.rj.gov.br/?p=eventos'
        );
      }
    } finally {
      setSyncingExtension(false);
    }
  };

  // Inscrição com E-mail Institucional direto ao site do link + Lembrete Automático na Agenda (24h e 1h antes)
  const handleConfirmEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollModalCourse) return;

    const cleanEmail = sipaeEmail.trim() || 'educador@edu.campos.rj.gov.br';
    const targetUrl = enrollModalCourse.seductUrl;
    const enrolledTitle = enrollModalCourse.courseTitle;

    const res = await fetch('/api/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...enrollModalCourse,
        participantName: participantName.trim() || 'Educador(a) Rede Municipal',
        sipaeEmail: cleanEmail,
      }),
    });

    if (res.ok) {
      await fetchAllData();
      setEnrollModalCourse(null);
      triggerMobileNotification(
        'Inscrição Confirmada no SIPAE!',
        `Confirmação enviada para o seu e-mail (${cleanEmail}) e lembrete automático 24h e 1h programado no aplicativo para "${enrolledTitle}".`,
        targetUrl
      );

      // Se o usuário marcou para finalizar direto no portal oficial do link SEDUCT, abre em nova guia segura via âncora DOM
      if (redirectToSeductAfterEnroll && targetUrl) {
        const anchor = document.createElement('a');
        anchor.href = targetUrl;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
      }
    }
  };

  // Adicionar compromisso direto na Agenda Inteligente com notificação por e-mail e aplicativo
  const handleAddAppointment = async (aptData: {
    title: string;
    date: string;
    time: string;
    category: string;
    email?: string;
    notifyPhone: boolean;
    notes?: string;
  }) => {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aptData),
    });
    if (res.ok) {
      await fetchAllData();
      const emailNotice = aptData.email ? ` Notificação enviada para ${aptData.email}.` : '';
      triggerMobileNotification(
        'Compromisso Salvo na Minha Agenda!',
        `"${aptData.title}" agendado para ${aptData.date
          .split('-')
          .reverse()
          .join('/')} às ${aptData.time}.${emailNotice} Alertas 24h e 1h ativados no aplicativo!`
      );
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
    await fetchAllData();
  };

  // Registrar Login Institucional SIPAE para o Banco de Dados do Desenvolvedor
  const handleSipaeLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMail = sipaeEmail.trim().toLowerCase();
    if (!cleanMail) return;

    await fetch('/api/sipae-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanMail,
        name: participantName.trim() || 'Educador(a) SEDUCT Campos',
        role: activeSubFormation,
        schoolUnit: 'Rede Municipal SEDUCT Campos dos Goytacazes',
      }),
    });
    await fetchAllData();
    setShowSipaeModal(false);

    if (isAuthorizedAdminEmail(cleanMail)) {
      setAuthenticatedAdminEmail(cleanMail);
      localStorage.setItem('efem_auth_admin_email', cleanMail);
      triggerMobileNotification(
        'Administradora / Desenvolvedora Reconhecida!',
        'Acesso exclusivo à gestão de administradores e desenvolvimento liberado no cabeçalho e topo do aplicativo.'
      );
    } else {
      triggerMobileNotification(
        'E-mail Institucional SIPAE Conectado!',
        `Vinculado a https://seduct.campos.rj.gov.br/ (${sipaeEmail}). Agora você pode clicar em qualquer evento para se inscrever direto no link oficial.`
      );
    }
  };

  // Autenticação direta das administradoras autorizadas
  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = adminLoginInput.trim().toLowerCase();
    if (isAuthorizedAdminEmail(clean)) {
      setAuthenticatedAdminEmail(clean);
      localStorage.setItem('efem_auth_admin_email', clean);
      setShowAdminLoginModal(false);
      setShowAdminModal(true);
      setAdminLoginError(null);
      setAdminLoginInput('');
      fetchAdmins(clean);
      triggerMobileNotification(
        'Acesso Autorizado ao Desenvolvimento!',
        'Painel liberado para cadastrar administradores e gerenciar atualizações no Google AI Studio.'
      );
    } else {
      setAdminLoginError(
        'Acesso restrito: E-mail não autorizado para a administração ou desenvolvimento do aplicativo.'
      );
    }
  };

  const handleLogoutAdmin = () => {
    setAuthenticatedAdminEmail('');
    localStorage.removeItem('efem_auth_admin_email');
    setShowAdminModal(false);
    triggerMobileNotification(
      'Sessão Administrativa Encerrada',
      'A Área do Administrador foi ocultada da interface.'
    );
  };

  // Resultados filtrados pela Barra de Pesquisa na página inicial
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const items: Array<{
      title: string;
      category: string;
      description: string;
      actionLabel: string;
      onSelect: () => void;
    }> = [];

    // Busca na aba EFEM
    if (
      'efem escola de formação de educadores municipais seduct pae emancipação'.includes(q) ||
      q.includes('efem')
    ) {
      items.push({
        title: 'EFEM - Escola de Formação de Educadores da Rede Municipal',
        category: 'Aba EFEM',
        description:
          'Texto institucional da EFEM em parceria com a SEDUCT e acesso ao Portal PAE (https://pae.seduct.campos.rj.gov.br/efem/).',
        actionLabel: 'Ir para Aba EFEM',
        onSelect: () => {
          setActiveTab('efem');
          setSearchQuery('');
        },
      });
    }

    // Busca em todos os 20 Segmentos de Formação e suas Subcategorias
    FORMATION_SEGMENTS.forEach((seg) => {
      if (seg.subcategories) {
        seg.subcategories.forEach((sub) => {
          const course = sub.course;
          const haystack = `${seg.name} ${sub.name} ${course.title} ${course.subtitle} ${course.description} ${course.location} ${course.id}`.toLowerCase();
          if (haystack.includes(q)) {
            items.push({
              title: `${seg.name} (${sub.name}): ${course.title}`,
              category: 'Formações',
              description: course.description,
              actionLabel: `Abrir ${sub.name}`,
              onSelect: () => {
                setActiveTab('formacoes');
                setActiveSegmentName(seg.name);
                setActiveSubcategoryName(sub.name);
                setSearchQuery('');
              },
            });
          }
        });
      } else if (seg.defaultCourse) {
        const course = seg.defaultCourse;
        const haystack = `${seg.name} ${course.title} ${course.subtitle} ${course.description} ${course.location} ${course.id}`.toLowerCase();
        if (haystack.includes(q)) {
          items.push({
            title: `${seg.name}: ${course.title}`,
            category: 'Formações',
            description: course.description,
            actionLabel: `Abrir ${seg.name}`,
            onSelect: () => {
              setActiveTab('formacoes');
              setActiveSegmentName(seg.name);
              setActiveSubcategoryName('');
              setSearchQuery('');
            },
          });
        }
      }
    });

    // Busca nos Eventos Sincronizados da Extensão SEDUCT
    seductFeed.forEach((evt) => {
      const haystack = `${evt.title} ${evt.category} ${evt.eventId}`.toLowerCase();
      if (haystack.includes(q)) {
        items.push({
          title: `Evento SEDUCT #${evt.eventId}: ${evt.title}`,
          category: 'Extensão SEDUCT Eventos',
          description: evt.summary,
          actionLabel: 'Inscrever-se',
          onSelect: () => {
            setSearchQuery('');
            setEnrollModalCourse({
              courseId: evt.eventId,
              courseTitle: evt.title,
              category: evt.category,
              seductUrl: evt.url,
              eventDate: '2026-10-30',
              eventTime: '08:00',
              location: 'Portal SEDUCT / SIPAE Campos dos Goytacazes',
            });
          },
        });
      }
    });

    // Busca no Calendário 2027
    if (
      'calendário 2027 alinhamento fevereiro março bolinha verde laranja azul vermelho pedagogos eja'.includes(
        q
      )
    ) {
      items.push({
        title: 'Calendário de Formação e Alinhamento — Ano 2027',
        category: 'Formação e Alinhamento',
        description:
          'Cronograma 2027 com legenda de cores por segmento (Fevereiro e Março 2027 destacados).',
        actionLabel: 'Abrir Calendário 2027',
        onSelect: () => {
          setActiveTab('alinhamento');
          setSearchQuery('');
        },
      });
    }

    // Busca na Agenda
    if ('agenda inteligente lembrete 24h celular ia compromissos'.includes(q)) {
      items.push({
        title: 'Minha Agenda Inteligente (Lembretes 24h e 1h antes)',
        category: 'Minha Agenda',
        description:
          'Cadastre compromissos sem precisar de e-mail e receba alertas das formações no celular.',
        actionLabel: 'Abrir Minha Agenda',
        onSelect: () => {
          setActiveTab('agenda');
          setSearchQuery('');
        },
      });
    }

    return items;
  }, [searchQuery, seductFeed]);


  return (
    <div className="relative min-h-screen w-full text-slate-900 flex flex-col">
      {/* Plano de Fundo em Tom Leve (Segunda Imagem em Anexo) */}
      <EfemWallpaperBackground />

      {/* Toast Flutuante de Notificação Estilo WhatsApp / Mobile Push */}
      {notificationToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 sm:top-5 right-4 sm:right-5 z-50 max-w-md w-[calc(100%-2rem)] bg-[#075E54] text-white rounded-2xl p-4 shadow-2xl border-2 border-[#25D366] flex items-start gap-3 transition-all animate-bounce-short"
        >
          <div className="w-10 h-10 rounded-full bg-[#25D366] text-[#075E54] flex items-center justify-center shrink-0 mt-0.5 shadow-md">
            <Bell className="w-5 h-5 fill-current" />
          </div>
          <div className="flex-1 text-xs sm:text-sm space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase font-black tracking-wider text-lime-300">
                EFEM · SEDUCT Alertas
              </span>
              <span className="text-[10px] text-lime-200/80 font-semibold">Agora</span>
            </div>
            <p className="font-extrabold text-white text-sm leading-tight">{notificationToast.title}</p>
            <p className="text-emerald-50 leading-snug">{notificationToast.message}</p>
            {notificationToast.url && (
              <a
                href={notificationToast.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-amber-300 font-bold hover:underline pt-1 text-xs"
              >
                <span>Acessar no Portal SEDUCT</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          <button
            onClick={() => setNotificationToast(null)}
            className="text-emerald-200 hover:text-white p-1 cursor-pointer shrink-0"
            aria-label="Fechar notificação"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Barra Superior de Acessibilidade (Baixa Visão: 16px a 24px + VLibras + Atalho no Celular + Extensão SEDUCT) */}
      <div className="relative z-20 bg-[#002244] text-white border-b border-white/15 px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Esquerda: Integração Oficial SEDUCT Campos */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://seduct.campos.rj.gov.br/?p=eventos"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-sky-200 hover:text-white transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-[#8CC63F]" />
              <span>Integrado a seduct.campos.rj.gov.br/?p=eventos</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              type="button"
              onClick={handleSyncSeductExtension}
              disabled={syncingExtension}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors cursor-pointer"
              title="Sincronizar publicações e imagens reais de https://seduct.campos.rj.gov.br/?p=eventos"
            >
              <RefreshCw className={`w-3 h-3 ${syncingExtension ? 'animate-spin' : ''}`} />
              <span>
                {syncingExtension ? 'Sincronizando SEDUCT...' : 'Atualizar Eventos SEDUCT'}
              </span>
            </button>
          </div>

          {/* Direita: Controles de Fonte para Baixa Visão (16px a 24px) + Salvar Atalho PWA + Login SIPAE */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Controle de Fonte Baixa Visão (16px - 24px) */}
            <div
              className="flex items-center gap-1 bg-white/10 rounded-lg px-2.5 py-1 border border-white/15"
              aria-label="Controle de tamanho da fonte para baixa visão (16px a 24px)"
            >
              <span className="font-bold text-sky-200 mr-1">Fonte (Baixa Visão):</span>
              <button
                type="button"
                onClick={() => setFontSizePx((prev) => Math.max(16, prev - 2))}
                disabled={fontSizePx <= 16}
                className="px-1.5 py-0.5 rounded bg-white/15 hover:bg-white/30 disabled:opacity-40 font-extrabold flex items-center gap-0.5 cursor-pointer"
                title="Diminuir fonte (mínimo 16px)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
                <span>A-</span>
              </button>
              <span className="px-1.5 font-mono-tabular font-bold text-lime-300">
                {fontSizePx}px
              </span>
              <button
                type="button"
                onClick={() => setFontSizePx((prev) => Math.min(24, prev + 2))}
                disabled={fontSizePx >= 24}
                className="px-1.5 py-0.5 rounded bg-white/15 hover:bg-white/30 disabled:opacity-40 font-extrabold flex items-center gap-0.5 cursor-pointer"
                title="Aumentar fonte até 24px para baixa visão"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>A+</span>
              </button>
            </div>

            {/* Botão Baixar / Salvar Aplicativo na Tela Inicial (Celular e PC) */}
            <button
              type="button"
              onClick={handleSaveOrDownloadApp}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#8CC63F] hover:bg-[#7ab332] text-[#002855] font-extrabold transition-colors cursor-pointer shadow-xs"
              title="Baixar ou salvar o aplicativo na tela inicial do celular e computador"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar / Salvar App</span>
            </button>

            {/* Botão Vincular E-mail Institucional SIPAE */}
            <button
              type="button"
              onClick={() => setShowSipaeModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-700 hover:bg-sky-600 text-white font-bold cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{sipaeEmail ? `SIPAE: ${sipaeEmail}` : 'E-mail Institucional SIPAE'}</span>
            </button>

            {/* Botão de Gestão de Administradores */}
            {isSuperAdmin && (
              <div className="flex items-center gap-1.5 bg-[#8CC63F]/20 px-2 py-0.5 rounded-lg border border-[#8CC63F]/40 animate-in fade-in">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-lime-300 hover:text-white transition-colors cursor-pointer"
                  title="Área do Administrador: Gerenciar atualizações e colaboradores"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#8CC63F]" />
                  <span>Área do Administrador</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogoutAdmin}
                  className="text-[10px] text-white/60 hover:text-white underline cursor-pointer ml-0.5"
                  title="Sair do modo administrador"
                >
                  (Sair)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CABEÇALHO PRINCIPAL + BARRA DE PESQUISA + ABAS EM AZUL FORTE COM LETRAS BRANCAS EM NEGRITO */}
      <header className="relative z-20 bg-white/95 backdrop-blur-md shadow-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
          {/* Linha 1: Identidade EFEM / SEDUCT + Botão Discreto de Gestão de Administradores + Barra de Pesquisa + Ícone Baixar App */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center justify-between gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('efem');
                  logPageAccess('Logo EFEM Topo -> Aba EFEM');
                }}
                className="flex items-center gap-3 text-left group cursor-pointer"
                title="Ir para a Página Institucional EFEM"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#f5f2e9] border-2 border-[#004b87] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <EfemLogoGraphic className="w-10 h-10" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl font-black text-[#004b87] tracking-tight">
                      EFEM
                    </span>
                    <span className="text-xs font-extrabold text-slate-500">
                      · SEDUCT CAMPOS DOS GOYTACAZES
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">
                    Escola de Formação de Educadores da Rede Municipal
                  </p>
                </div>
              </button>

              {/* Botão pequeno e bem discreto no cabeçalho */}
              <button
                type="button"
                onClick={() => {
                  if (isSuperAdmin) {
                    setShowAdminModal(true);
                  } else {
                    setShowAdminLoginModal(true);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-slate-400 hover:text-[#004b87] hover:bg-slate-100 border border-slate-200/70 hover:border-[#004b87]/30 text-xs font-medium transition-colors cursor-pointer shadow-2xs group shrink-0"
                title="Acesso restrito à administração e desenvolvimento"
                aria-label="Acesso restrito à administração"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#004b87] transition-colors" />
                <span className="text-[10px] font-semibold text-slate-600 group-hover:text-[#004b87]">
                  {isSuperAdmin ? 'Admin / Dev' : 'Admin'}
                </span>
                {isSuperAdmin && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                )}
              </button>
            </div>

            {/* Parte Superior Direita do Cabeçalho: Barra de Pesquisa + Ícone de Baixar/Salvar Aplicativo */}
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              {/* Barra de Pesquisa Global */}
              <div className="relative flex-1 md:w-72 lg:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar formações, PDDE..."
                  aria-label="Pesquisar no aplicativo EFEM SEDUCT"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-[#004b87]/30 bg-slate-50 text-slate-900 text-sm font-medium focus:bg-white focus:border-[#004b87] focus:outline-none transition-colors"
                />

                {/* Dropdown de Resultados da Pesquisa */}
                {searchQuery.trim() !== '' && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border-2 border-[#004b87] p-3 z-50 max-h-80 overflow-y-auto">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs font-bold text-slate-500">
                      <span>Resultados para “{searchQuery}”</span>
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        Limpar
                      </button>
                    </div>
                    {searchResults.length === 0 ? (
                      <p className="text-xs text-slate-500 py-3 text-center">
                        Nenhum resultado encontrado. Tente buscar por “Saberes das Águas”, “PDDE”, “Gestores”, “EJA” ou “2027”.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {searchResults.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={item.onSelect}
                            className="w-full text-left p-2.5 rounded-xl hover:bg-sky-50 transition-colors flex items-start justify-between gap-2 cursor-pointer"
                          >
                            <div>
                              <span className="text-[11px] font-extrabold uppercase text-[#004b87]">
                                {item.category}
                              </span>
                              <p className="text-sm font-bold text-slate-900">{item.title}</p>
                              <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>
                            </div>
                            <span className="text-xs font-extrabold text-[#004b87] shrink-0 mt-1">
                              {item.actionLabel} →
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ÍCONE NA PARTE SUPERIOR DIREITA: BAIXAR / SALVAR APLICATIVO NA TELA INICIAL (CELULAR E COMPUTADOR) */}
              <button
                type="button"
                onClick={handleSaveOrDownloadApp}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-[#004b87] to-[#002855] hover:from-[#003865] hover:to-[#001c3d] text-white text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer border-2 border-[#8CC63F]/70 group shrink-0"
                title="Baixar e Salvar o aplicativo na tela inicial do celular e computador"
                aria-label="Baixar e Salvar aplicativo na tela inicial do celular e computador"
              >
                <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-[#8CC63F] text-[#002855] group-hover:scale-105 transition-transform shadow-xs shrink-0">
                  <Download className="w-4 h-4 text-[#002855]" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
                </div>
                <div className="flex flex-col text-left leading-tight pr-0.5">
                  <span className="text-[11px] font-black text-white flex items-center gap-1">
                    <span>Baixar App</span>
                    <span className="hidden sm:inline text-lime-300">/ Salvar</span>
                  </span>
                  <span className="text-[9px] font-semibold text-sky-200">
                    Celular & PC
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Linha 2: ABAS SUPERIORES SEMPRE VISÍVEIS EM AZUL FORTE (#0047AB / #003882) E LETRAS BRANCAS EM NEGRITO */}
          <nav
            aria-label="Navegação Principal EFEM"
            className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1"
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab('efem');
                logPageAccess('Aba EFEM');
              }}
              className={`py-3 px-4 rounded-xl bg-[#0047AB] hover:bg-[#003380] text-white font-bold text-sm sm:text-base tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'efem'
                  ? 'ring-4 ring-[#8CC63F] bg-[#003380]'
                  : 'opacity-95 hover:opacity-100'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span className="font-bold text-white whitespace-nowrap">EFEM</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('formacoes');
                logPageAccess(`Aba Formações -> ${activeSubFormation}`);
              }}
              className={`py-3 px-4 rounded-xl bg-[#0047AB] hover:bg-[#003380] text-white font-bold text-sm sm:text-base tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'formacoes'
                  ? 'ring-4 ring-[#8CC63F] bg-[#003380]'
                  : 'opacity-95 hover:opacity-100'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className="font-bold text-white whitespace-nowrap">Formações</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('alinhamento');
                logPageAccess('Aba Formação e Alinhamento (Calendário 2027)');
              }}
              className={`py-3 px-4 rounded-xl bg-[#0047AB] hover:bg-[#003380] text-white font-bold text-sm sm:text-base tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'alinhamento'
                  ? 'ring-4 ring-[#8CC63F] bg-[#003380]'
                  : 'opacity-95 hover:opacity-100'
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span className="font-bold text-white whitespace-nowrap">
                Formação e Alinhamento
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('agenda');
                logPageAccess('Aba Minha Agenda Inteligente');
              }}
              className={`py-3 px-4 rounded-xl bg-[#0047AB] hover:bg-[#003380] text-white font-bold text-sm sm:text-base tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'agenda'
                  ? 'ring-4 ring-[#8CC63F] bg-[#003380]'
                  : 'opacity-95 hover:opacity-100'
              }`}
            >
              <Bell className="w-4 h-4 shrink-0" />
              <span className="font-bold text-white whitespace-nowrap">
                Minha Agenda ({appointments.length})
              </span>
            </button>
          </nav>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL DAS ABAS */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:py-8">
        {/* =====================================================================
            ABA 1: EFEM (Texto Institucional Exato + Botão Discreto para Portal PAE/EFEM
            + Extensão Conectada com Imagens e Publicações Exatas de https://seduct.campos.rj.gov.br/?p=eventos)
           ===================================================================== */}
        {activeTab === 'efem' && (
          <div className="space-y-8">
            <article className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200 max-w-5xl mx-auto">
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 mb-6 border-b border-slate-200">
                <div className="w-24 h-24 rounded-2xl bg-[#f5f2e9] border-2 border-[#004b87] flex items-center justify-center shrink-0 p-2">
                  <EfemLogoGraphic className="w-20 h-20" />
                </div>
                <div className="text-center sm:text-left">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#004b87]">
                    Secretaria Municipal de Educação, Ciência e Tecnologia (SEDUCT)
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#003865] mt-1">
                    Escola de Formação de Educadores da Rede Municipal de Campos dos Goytacazes (EFEM)
                  </h1>
                </div>
              </div>

              {/* Texto Institucional Exato Solicitado */}
              <div className="space-y-5 text-slate-800 leading-relaxed text-base sm:text-lg font-normal">
                <p>
                  A Escola de Formação de Educadores da Rede Municipal de Campos dos Goytacazes (EFEM) está diretamente ligada a Secretaria Municipal de Educação Ciência e Tecnologia (SEDUCT). Todo o trabalho realizado pela Efem acontece em parceria com setores internos da SEDUCT, a partir das demandas Formativas, e com setores externos, em parceria com Universidades e setores com finalidades educativas.
                </p>

                <p>
                  Entende-se que é preciso o Educador continuar o seu processo formativo para os novos saberes resultantes do desenvolvimento social e educativo, desdobrando-os em sua atuação, modificando, criticando, construindo, criando caminhos emancipados.
                </p>

                <p>
                  A formação continuada é urgente e dá a chance ao professor de aprender, praticar, refletir sobre esta prática, possibilitando-lhe transformar, assim como também ofertar ao aluno uma educação emancipada, de análise e posicionamento crítico frente às demandas sociais.
                </p>
              </div>

              {/* Botão Discreto para acessar https://pae.seduct.campos.rj.gov.br/efem/ */}
              <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <span className="text-xs text-slate-500">
                  Portal Oficial do Programa de Aprendizagem Eficiente (PAE / EFEM)
                </span>

                <a
                  href="https://pae.seduct.campos.rj.gov.br/efem/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-[#004b87] text-slate-700 hover:text-white text-xs sm:text-sm font-semibold border border-slate-300 transition-colors"
                >
                  <span>Acessar Portal PAE / EFEM</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </article>

            {/* Seção da Extensão Conectada · Atualizações Automáticas com as IMAGENS EXATAS e PUBLICAÇÕES EXATAS de https://seduct.campos.rj.gov.br/?p=eventos */}
            <section className="max-w-6xl mx-auto bg-white/95 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-[#004b87]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
                    <span>Extensão Conectada · Atualizações Automáticas</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#003865] mt-1">
                    Publicações e Cursos em Tempo Real — https://seduct.campos.rj.gov.br/?p=eventos
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Clique em qualquer curso ou formação abaixo para fazer sua inscrição com seu e-mail institucional direto no portal SIPAE / SEDUCT e ativar seu lembrete automático de 24h na Agenda.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleSyncSeductExtension}
                    disabled={syncingExtension}
                    className="px-3.5 py-2 rounded-xl bg-[#8CC63F] hover:bg-[#7ab332] text-[#002855] font-extrabold text-xs inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingExtension ? 'animate-spin' : ''}`} />
                    <span>{syncingExtension ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
                  </button>

                  <a
                    href="https://seduct.campos.rj.gov.br/?p=eventos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-[#0047AB] hover:bg-[#003380] text-white font-extrabold text-xs inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Ver Todos no Site SEDUCT</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Grade com as Imagens Exatas e Publicações Exatas de https://seduct.campos.rj.gov.br/?p=eventos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {seductFeed.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-md hover:shadow-xl transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Imagem Exata do Servidor SEDUCT clicável direto para a página do evento */}
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block relative aspect-[4/3] bg-slate-100 overflow-hidden border-b border-slate-200"
                        title={`Abrir ${item.title} direto no portal SEDUCT`}
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2.5 left-2.5 bg-[#003867]/90 backdrop-blur-xs text-white text-[11px] font-extrabold px-2.5 py-1 rounded-md shadow">
                          Evento #{item.eventId || item.id.replace('evt-', '')}
                        </div>
                      </a>

                      <div className="p-4 space-y-2">
                        <div className="text-xs font-bold text-[#004b87]">
                          {item.category} · SIPAE / SEDUCT
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[#0047AB] transition-colors"
                          >
                            {item.title}
                          </a>
                        </h3>
                      </div>
                    </div>

                    {/* Botões de Inscrição pelo E-mail Institucional direto ao site do link */}
                    <div className="p-4 pt-0 space-y-2">
                      <button
                        type="button"
                        onClick={() =>
                          setEnrollModalCourse({
                            courseId: item.eventId || item.id,
                            courseTitle: item.title,
                            category: item.category,
                            seductUrl: item.url,
                            eventDate: '2026-10-30',
                            eventTime: '08:00',
                            location: 'Portal de Eventos SEDUCT / SIPAE Campos dos Goytacazes',
                          })
                        }
                        className="w-full py-2.5 px-3 rounded-xl bg-[#0047AB] hover:bg-[#003380] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5 shrink-0" />
                        <span>Inscrever com E-mail Institucional no Site</span>
                      </button>

                      <div className="flex items-center justify-between gap-2 pt-1 text-[11px] font-bold text-slate-600">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#004b87] hover:underline inline-flex items-center gap-1"
                        >
                          <span>Acessar Link Direto</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <a
                          href={SIPAE_GOOGLE_LOGIN_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:underline inline-flex items-center gap-1"
                        >
                          <span>Login Google SIPAE</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* =====================================================================
            ABA 2: FORMAÇÕES
            - Sub-abas em formato VERTICAL para melhor visualização
            - Cor Verde Lima / Verde Alface (#9be564 / #8CC63F) com letras em Azul Marinho (#00205B)
            - Retângulos menores na largura (w-fit) sem sobrar espaço após terminar o nome de cada aba
           ===================================================================== */}
        {activeTab === 'formacoes' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Coluna Esquerda: Sub-abas Verticais em Retângulos Ajustados ao Texto (w-fit) */}
            <div className="lg:col-span-5 bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-5 shadow-md border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-black text-[#00205B] uppercase tracking-wider">
                  Segmentos de Formação
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#8CC63F]/30 text-[#00205B]">
                  {FORMATION_SEGMENTS.length} Segmentos
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-4">
                Selecione sua etapa ou modalidade de atuação na Rede Municipal:
              </p>

              {/* Lista Vertical de Abas Verde Alface com Letras Azul Marinho em Negrito */}
              <div
                role="tablist"
                aria-orientation="vertical"
                className="flex flex-col items-start gap-2.5 max-h-[820px] overflow-y-auto pr-1 w-full"
              >
                {FORMATION_SEGMENTS.map((segment) => {
                  const isSegmentSelected = activeSegmentName === segment.name;
                  const hasSubcategories = !!segment.subcategories && segment.subcategories.length > 0;

                  return (
                    <div key={segment.name} className="w-full flex flex-col items-start gap-1.5">
                      {/* Aba Principal: Verde Alface (#8CC63F) com Letras Azul Marinho (#00205B) em Negrito */}
                      <button
                        role="tab"
                        aria-selected={isSegmentSelected}
                        type="button"
                        onClick={() => {
                          setActiveSegmentName(segment.name);
                          if (hasSubcategories) {
                            setActiveSubcategoryName(segment.subcategories![0].name);
                            logPageAccess(`Formações -> ${segment.name} / ${segment.subcategories![0].name}`);
                          } else {
                            setActiveSubcategoryName('');
                            logPageAccess(`Formações -> ${segment.name}`);
                          }
                        }}
                        className={`w-fit max-w-full text-left px-3.5 py-2 rounded-lg font-black text-sm sm:text-base transition-all cursor-pointer flex items-center justify-between gap-2 shadow-xs ${
                          isSegmentSelected
                            ? 'bg-[#8CC63F] text-[#00205B] ring-2 ring-[#00205B] shadow-md translate-x-1'
                            : 'bg-[#8CC63F] hover:bg-[#7ebd34] text-[#00205B] border border-[#78b530]'
                        }`}
                      >
                        <span className="leading-snug">{segment.name}</span>
                        {hasSubcategories && (
                          <ChevronRight
                            className={`w-4 h-4 shrink-0 text-[#00205B] transition-transform duration-200 ${
                              isSegmentSelected ? 'rotate-90' : ''
                            }`}
                          />
                        )}
                      </button>

                      {/* Mini Abas (Subcategorias dentro das Abas): Azul Marinho (#00205B) com Letras Brancas */}
                      {isSegmentSelected && hasSubcategories && (
                        <div className="pl-3 sm:pl-4 py-1 flex flex-wrap gap-1.5 w-full">
                          {segment.subcategories!.map((sub) => {
                            const isSubSelected = activeSubcategoryName === sub.name;
                            return (
                              <button
                                key={sub.name}
                                type="button"
                                onClick={() => {
                                  setActiveSubcategoryName(sub.name);
                                  logPageAccess(`Formações -> ${segment.name} / ${sub.name}`);
                                }}
                                className={`w-fit max-w-full text-left px-3 py-1.5 rounded-md font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs ${
                                  isSubSelected
                                    ? 'bg-[#00205B] text-white ring-2 ring-[#8CC63F] shadow-md scale-[1.02]'
                                    : 'bg-[#00205B] hover:bg-[#001744] text-white opacity-95 hover:opacity-100'
                                }`}
                              >
                                <span>{sub.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Coluna Direita: Conteúdo da Sub-aba Selecionada */}
            <div className="lg:col-span-7 space-y-6">
              {/* Barra Superior de Mini Abas (Subcategorias): Azul Marinho com Letras Brancas */}
              {currentSegment.subcategories && currentSegment.subcategories.length > 0 && (
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-md border-2 border-[#8CC63F] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-[#00205B]">
                      Subcategorias de {currentSegment.name} (Mini Abas):
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {currentSegment.subcategories.length} subcategorias
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {currentSegment.subcategories.map((sub) => {
                      const isSubSelected = activeSubcategoryName === sub.name;
                      return (
                        <button
                          key={sub.name}
                          type="button"
                          onClick={() => {
                            setActiveSubcategoryName(sub.name);
                            logPageAccess(`Formações -> ${currentSegment.name} / ${sub.name}`);
                          }}
                          className={`px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-sm ${
                            isSubSelected
                              ? 'bg-[#00205B] text-white ring-2 ring-[#8CC63F] shadow-md scale-[1.02]'
                              : 'bg-[#00205B] hover:bg-[#001744] text-white opacity-95 hover:opacity-100'
                          }`}
                        >
                          <span>{sub.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CASO ESPECIAL: Sub-aba "Arte" do EF Anos Iniciais / Saberes das Águas (#3870) */}
              {currentCourse.id === '3870' && (
                <Event3870RealCard
                  onDirectSipaeEnroll={() =>
                    setEnrollModalCourse({
                      courseId: currentCourse.id,
                      courseTitle: currentCourse.title,
                      category: activeSubFormation,
                      seductUrl: currentCourse.seductUrl,
                      eventDate: currentCourse.eventDate,
                      eventTime: currentCourse.eventTime,
                      location: currentCourse.location,
                    })
                  }
                />
              )}

              {/* CASO ESPECIAL: Sub-aba "Escola" de Diretor e Diretor Adjunto (#3886) */}
              {currentCourse.id === '3886' && (
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl border-2 border-[#004b87] space-y-6">
                  <div className="border-b border-slate-200 pb-4">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#004b87]">
                      Segmento: {currentSegment.name} · Subcategoria: {activeSubcategoryName}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                      {currentCourse.title}
                    </h3>
                  </div>

                  {/* Cartaz Oficial da Formação Presencial PDDE */}
                  <GestoresPddePoster />

                  <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-5 space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-base font-extrabold text-[#003366]">
                        Inscrições Abertas — Evento Oficial SEDUCT #3886
                      </h4>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        Formação presencial realizada no dia <strong>30 de Outubro de 2026</strong>, das{' '}
                        <strong>8h às 17h30</strong> (Total de 8 horas), no{' '}
                        <strong>Auditório do Colégio Salesiano (Av. Dom Bosco, 49 - Parque Tamandaré)</strong>.
                        Inscreva-se com seu e-mail institucional direto no portal e ative o lembrete automático de 24h e 1h antes.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setEnrollModalCourse({
                            courseId: '3886',
                            courseTitle: currentCourse.title,
                            category: activeSubFormation,
                            seductUrl: currentCourse.seductUrl,
                            eventDate: currentCourse.eventDate,
                            eventTime: currentCourse.eventTime,
                            location: currentCourse.location,
                          })
                        }
                        className="px-5 py-3 rounded-xl bg-[#0047AB] hover:bg-[#003380] text-white font-extrabold text-sm inline-flex items-center gap-2 shadow-md transition-colors cursor-pointer"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Inscrever com E-mail Institucional direto no Site (id=3886)</span>
                      </button>

                      <a
                        href={currentCourse.seductUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-3 rounded-xl bg-[#8CC63F] hover:bg-[#7ab332] text-[#00205B] font-extrabold text-sm inline-flex items-center gap-2 shadow-md transition-colors"
                      >
                        <span>Abrir Página Oficial SEDUCT</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* CARD DETALHADO DA FORMAÇÃO CONTINUADA */}
              {currentCourse.id !== '3870' && currentCourse.id !== '3886' && (
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-[#004b87] space-y-6">
                  <div className="border-b border-slate-200 pb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider bg-[#004b87] text-white px-3 py-1 rounded-full shadow-xs">
                        Formação Continuada
                      </span>
                      <span className="text-xs font-black uppercase tracking-wider bg-[#8CC63F]/25 text-[#00205B] px-3 py-1 rounded-full border border-[#8CC63F]/60">
                        {currentSegment.name}
                      </span>
                      {activeSubcategoryName && (
                        <span className="text-xs font-black uppercase tracking-wider bg-[#00205B] text-white px-3 py-1 rounded-full">
                          {activeSubcategoryName}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                      {currentCourse.title}
                    </h3>
                    <p className="text-sm font-semibold text-slate-500 mt-0.5">
                      {currentCourse.subtitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    <div className="md:col-span-5">
                      <a
                        href={currentCourse.seductUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-2xl overflow-hidden border border-slate-200 shadow-md hover:shadow-xl transition-all"
                      >
                        <img
                          src={getSeductProxiedImageUrl(currentCourse.imageUrl)}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = currentCourse.imageUrl;
                          }}
                          alt={currentCourse.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-auto object-cover"
                        />
                      </a>
                    </div>

                    <div className="md:col-span-7 space-y-4">
                      <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                        {currentCourse.description}
                      </p>

                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-1 text-xs sm:text-sm">
                        <div>
                          <span className="font-bold text-slate-500">Data e Horário: </span>
                          <span className="font-extrabold text-slate-900 font-mono-tabular">
                            {currentCourse.eventDate.split('-').reverse().join('/')} às{' '}
                            {currentCourse.eventTime}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-500">Local / Polo: </span>
                          <span className="font-extrabold text-slate-900">
                            {currentCourse.location}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() =>
                            setEnrollModalCourse({
                              courseId: currentCourse.id,
                              courseTitle: currentCourse.title,
                              category: activeSubFormation,
                              seductUrl: currentCourse.seductUrl,
                              eventDate: currentCourse.eventDate,
                              eventTime: currentCourse.eventTime,
                              location: currentCourse.location,
                            })
                          }
                          className="px-5 py-3 rounded-xl bg-[#0047AB] hover:bg-[#003380] text-white font-extrabold text-sm inline-flex items-center gap-2 shadow-md transition-colors cursor-pointer"
                        >
                          <LogIn className="w-4 h-4" />
                          <span>Inscrever com E-mail Institucional direto no Site</span>
                        </button>

                        <a
                          href={currentCourse.seductUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-3 rounded-xl bg-[#8CC63F] hover:bg-[#7ab332] text-[#00205B] font-extrabold text-sm inline-flex items-center gap-2 shadow-md transition-colors"
                        >
                          <span>Ver no Portal SEDUCT</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CARD DE FORMAÇÃO E ALINHAMENTO CORRESPONDENTE À ABA / MINI ABA */}
              {currentAlignmentCourse && (
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-[#8CC63F] space-y-6">
                  <div className="border-b border-slate-200 pb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider bg-[#8CC63F] text-[#00205B] px-3.5 py-1 rounded-full border border-[#00205B]/20 shadow-xs">
                        Formação e Alinhamento Pedagógico
                      </span>
                      <span className="text-xs font-black uppercase tracking-wider bg-[#00205B] text-white px-3 py-1 rounded-full">
                        {currentSegment.name} {activeSubcategoryName ? `· ${activeSubcategoryName}` : ''}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                      {currentAlignmentCourse.title}
                    </h3>
                    <p className="text-sm font-semibold text-slate-500 mt-0.5">
                      {currentAlignmentCourse.subtitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    <div className="md:col-span-5">
                      <a
                        href={currentAlignmentCourse.seductUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-2xl overflow-hidden border border-slate-200 shadow-md hover:shadow-xl transition-all"
                      >
                        <img
                          src={getSeductProxiedImageUrl(currentAlignmentCourse.imageUrl)}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = currentAlignmentCourse.imageUrl;
                          }}
                          alt={currentAlignmentCourse.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-auto object-cover"
                        />
                      </a>
                    </div>

                    <div className="md:col-span-7 space-y-4">
                      <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                        {currentAlignmentCourse.description}
                      </p>

                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-1 text-xs sm:text-sm">
                        <div>
                          <span className="font-bold text-slate-500">Data e Horário: </span>
                          <span className="font-extrabold text-slate-900 font-mono-tabular">
                            {currentAlignmentCourse.eventDate.split('-').reverse().join('/')} às{' '}
                            {currentAlignmentCourse.eventTime}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-500">Local / Polo: </span>
                          <span className="font-extrabold text-slate-900">
                            {currentAlignmentCourse.location}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() =>
                            setEnrollModalCourse({
                              courseId: currentAlignmentCourse.id,
                              courseTitle: currentAlignmentCourse.title,
                              category: `${activeSubFormation} (Alinhamento)`,
                              seductUrl: currentAlignmentCourse.seductUrl,
                              eventDate: currentAlignmentCourse.eventDate,
                              eventTime: currentAlignmentCourse.eventTime,
                              location: currentAlignmentCourse.location,
                            })
                          }
                          className="px-5 py-3 rounded-xl bg-[#0047AB] hover:bg-[#003380] text-white font-extrabold text-sm inline-flex items-center gap-2 shadow-md transition-colors cursor-pointer"
                        >
                          <LogIn className="w-4 h-4" />
                          <span>Inscrever no Alinhamento com E-mail Institucional</span>
                        </button>

                        <a
                          href={currentAlignmentCourse.seductUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-3 rounded-xl bg-[#8CC63F] hover:bg-[#7ab332] text-[#00205B] font-extrabold text-sm inline-flex items-center gap-2 shadow-md transition-colors"
                        >
                          <span>Ver no Portal SEDUCT</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =====================================================================
            ABA 3: FORMAÇÃO E ALINHAMENTO (Calendário 2027 com Legenda de Bolinhas)
           ===================================================================== */}
        {activeTab === 'alinhamento' && (
          <Calendar2027
            onQuickEnrollAlignment={(title, dateStr, category) => {
              setEnrollModalCourse({
                courseId: `alinhamento-${dateStr}`,
                courseTitle: title,
                category: `Alinhamento 2027 · ${category}`,
                seductUrl: 'https://seduct.campos.rj.gov.br/?p=eventos',
                eventDate: dateStr,
                eventTime: '08:30',
                location: 'Polo Formativo EFEM / SEDUCT Campos dos Goytacazes',
              });
            }}
          />
        )}

        {/* =====================================================================
            ABA 4: MINHA AGENDA INTELIGENTE (IA + Compromissos sem exigir e-mail + Alertas 24h e 1h)
           ===================================================================== */}
        {activeTab === 'agenda' && (
          <SmartAgenda
            appointments={appointments}
            enrollments={enrollments}
            onAddAppointment={handleAddAppointment}
            onDeleteAppointment={handleDeleteAppointment}
            onTriggerTestNotification={(aptTitle, mode) => {
              const prefix =
                mode === '24h'
                  ? 'Lembrete de 24 Horas (1 Dia de Antecedência)'
                  : 'Lembrete de 1 Hora Antes';
              triggerMobileNotification(
                `${prefix} · Agenda EFEM`,
                `Olá, Educador(a)! Seu compromisso "${aptTitle}" acontecerá em ${
                  mode === '24h' ? '24 horas' : '1 hora'
                }. Prepare seus materiais!`
              );
            }}
          />
        )}
      </main>

      {/* RODAPÉ INSTITUCIONAL (O painel do desenvolvedor nunca aparece para o usuário comum) */}
      <footer className="relative z-10 bg-[#002244] text-white border-t border-white/15 mt-12 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-sky-200">
          <div className="text-center sm:text-left space-y-1">
            <p
              className="font-bold text-white select-none cursor-default"
              onClick={() => {
                setDevClicks((c) => {
                  const next = c + 1;
                  if (next >= 5) {
                    setShowDevAnalytics(true);
                    return 0;
                  }
                  return next;
                });
              }}
              title="EFEM Campos dos Goytacazes"
            >
              EFEM — Escola de Formação de Educadores da Rede Municipal de Campos dos Goytacazes
            </p>
            <p>
              Secretaria Municipal de Educação, Ciência e Tecnologia (SEDUCT) · Integrado a{' '}
              <a
                href="https://seduct.campos.rj.gov.br/?p=eventos"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white"
              >
                https://seduct.campos.rj.gov.br/?p=eventos
              </a>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://seduct.campos.rj.gov.br/?p=eventos"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold cursor-pointer text-xs flex items-center gap-1.5"
            >
              <span>Portal SEDUCT Eventos</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </footer>

      {/* MODAL DE INSCRIÇÃO COM E-MAIL INSTITUCIONAL DIRETO AO SITE DO LINK + LEMBRETE 24H / 1H NA AGENDA */}
      {enrollModalCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-[#004b87] space-y-4">
            <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-extrabold uppercase text-[#004b87]">
                  Inscrição Direta com E-mail Institucional · Portal SEDUCT / SIPAE
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                  {enrollModalCourse.courseTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEnrollModalCourse(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmEnrollment} className="space-y-4">
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs text-slate-700 space-y-1">
                <p>
                  <strong>Link Oficial do Evento:</strong>{' '}
                  <a
                    href={enrollModalCourse.seductUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0047AB] underline font-bold"
                  >
                    {enrollModalCourse.seductUrl}
                  </a>
                </p>
                <p>
                  <strong>Local:</strong> {enrollModalCourse.location}
                </p>
                <p className="text-emerald-800 font-bold pt-1">
                  ✓ Seu e-mail institucional será registrado, o lembrete automático de 24h e 1h antes será salvo na Agenda e você será direcionado à página oficial do evento na SEDUCT!
                </p>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                  Seu Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="Nome do(a) Educador(a) ou Gestor(a)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                  Seu E-mail Institucional SIPAE / SEDUCT *
                </label>
                <input
                  type="email"
                  required
                  value={sipaeEmail}
                  onChange={(e) => setSipaeEmail(e.target.value)}
                  placeholder="seu.nome@edu.campos.rj.gov.br"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={redirectToSeductAfterEnroll}
                  onChange={(e) => setRedirectToSeductAfterEnroll(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0047AB]"
                />
                <span>
                  Abrir automaticamente o site oficial do evento ({enrollModalCourse.seductUrl}) após confirmar
                </span>
              </label>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                <a
                  href={SIPAE_GOOGLE_LOGIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-extrabold text-[#0047AB] hover:underline inline-flex items-center gap-1"
                >
                  <span>Login Direto Google SIPAE</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEnrollModalCourse(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#8CC63F] hover:bg-[#7ab332] text-[#00205B] font-extrabold text-xs sm:text-sm cursor-pointer shadow-md inline-flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Inscrever e Ir para o Site SEDUCT</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONEXÃO COM SIPAE (https://seduct.campos.rj.gov.br/) */}
      {showSipaeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-[#004b87] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-extrabold uppercase text-[#004b87]">
                  Integração SIPAE · SEDUCT Campos
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Conectar E-mail Institucional SIPAE
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSipaeModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSipaeLoginSubmit} className="space-y-4">
              <p className="text-xs text-slate-600">
                Informe seu e-mail institucional utilizado no SIPAE (
                <a
                  href="https://seduct.campos.rj.gov.br/?p=eventos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#004b87] underline font-bold"
                >
                  seduct.campos.rj.gov.br/?p=eventos
                </a>
                ) para realizar suas inscrições diretamente nos links oficiais dos eventos.
              </p>

              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                  Nome do Educador(a)
                </label>
                <input
                  type="text"
                  required
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                  E-mail Institucional SIPAE *
                </label>
                <input
                  type="email"
                  required
                  value={sipaeEmail}
                  onChange={(e) => setSipaeEmail(e.target.value)}
                  placeholder="educador@edu.campos.rj.gov.br"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="pt-1">
                <a
                  href={SIPAE_GOOGLE_LOGIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#003867] font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-300"
                >
                  <span>Autenticar também no Login Google do Portal SIPAE</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSipaeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#004b87] text-white font-extrabold text-xs cursor-pointer"
                >
                  Salvar E-mail Institucional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GUIA DE ATALHO NO CELULAR PARA iOS SAFARI */}
      {showIOSInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-[#004b87] font-extrabold">
              <Info className="w-5 h-5" />
              <h3>Salvar Atalho no Celular (iPhone / iPad)</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              1. Toque no ícone de <strong>Compartilhar</strong> na barra do Safari.
              <br />
              2. Selecione <strong>Adicionar à Tela de Início</strong> para receber notificações de atualizações da EFEM/SEDUCT.
            </p>
            <button
              type="button"
              onClick={() => setShowIOSInstallGuide(false)}
              className="w-full py-2.5 rounded-xl bg-[#004b87] text-white font-bold text-sm"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      {/* PAINEL DE ANÁLISE DO DESENVOLVEDOR (BANCO DE DADOS + PLANILHA EXCEL) */}
      <DeveloperAnalyticsModal
        isOpen={showDevAnalytics}
        onClose={() => setShowDevAnalytics(false)}
        accessLogs={accessLogs}
        sipaeLogins={sipaeLogins}
        enrollments={enrollments}
        admins={admins}
        onRegisterSipaeModal={() => {
          setShowDevAnalytics(false);
          setShowSipaeModal(true);
        }}
        onOpenAdminManager={
          isSuperAdmin
            ? () => {
                setShowDevAnalytics(false);
                setShowAdminModal(true);
              }
            : undefined
        }
      />

      {/* PAINEL DE GESTÃO DE ADMINISTRADORES DO GOOGLE AI STUDIO / EFEM */}
      <AdminManagerModal
        isOpen={showAdminModal && isSuperAdmin}
        onClose={() => setShowAdminModal(false)}
        admins={admins}
        onRefreshAdmins={fetchAdmins}
        onSyncSeduct={handleSyncSeductExtension}
        onExportExcel={() => {
          setShowAdminModal(false);
          setShowDevAnalytics(true);
        }}
        currentUserEmail={isSuperAdmin ? (authenticatedAdminEmail || sipaeEmail || '') : undefined}
      />

      {/* MODAL DE AUTENTICAÇÃO RESTRITA: GESTÃO DE ADMINISTRADORES E DESENVOLVIMENTO */}
      {showAdminLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-[#003865] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#002855] text-[#8CC63F] flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#004b87]">
                    Controle de Acesso Restrito
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    Gestão de Administradores & Desenvolvimento
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAdminLoginModal(false);
                  setAdminLoginError(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              O acesso a esta área e a inserção de novos administradores para desenvolvimento do aplicativo são restritos exclusivamente à equipe gestora autorizada da EFEM / SEDUCT.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2.5 text-xs text-slate-700">
              <Lock className="w-4 h-4 text-[#004b87] shrink-0" />
              <span>Autenticação protegida: Digite seu e-mail institucional autorizado para validar suas permissões.</span>
            </div>

            {adminLoginError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-semibold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{adminLoginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seu E-mail Autorizado *
                </label>
                <input
                  type="email"
                  required
                  value={adminLoginInput}
                  onChange={(e) => {
                    setAdminLoginInput(e.target.value);
                    if (adminLoginError) setAdminLoginError(null);
                  }}
                  placeholder="seu.email@autorizado.gov.br"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8CC63F] font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminLoginModal(false);
                    setAdminLoginError(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#002855] text-white font-extrabold text-xs cursor-pointer flex items-center gap-1.5 hover:bg-[#001c3d]"
                >
                  <ShieldCheck className="w-4 h-4 text-[#8CC63F]" />
                  <span>Acessar Painel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL OFICIAL PARA BAIXAR / SALVAR O APLICATIVO NA TELA INICIAL (CELULAR E COMPUTADOR) */}
      {showInstallAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border-2 border-[#003865] space-y-5 animate-in fade-in zoom-in-95 my-4">
            {/* Cabeçalho do Modal */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#f5f2e9] border-2 border-[#004b87] p-1 flex items-center justify-center shrink-0 shadow-md overflow-hidden">
                  <img
                    src="/public/assets/aistudio/Captura_de_tela_2026-11-05_085745_05d1de50.png"
                    alt="Ícone do Aplicativo EFEM"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#8CC63F] bg-[#002855] px-2.5 py-0.5 rounded-full">
                    Atalho Oficial PWA
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-[#002855] leading-tight mt-1">
                    Baixar & Salvar Aplicativo
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Tenha o ícone oficial da EFEM no seu Celular e Computador
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallAppModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Destaques e Notificações */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                <Bell className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Alertas sonoros estilo WhatsApp</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900">
                <Calendar className="w-4 h-4 text-[#004b87] shrink-0" />
                <span>Lembrete 24h antes do curso SIPAE</span>
              </div>
            </div>

            {/* Passo a passo: Celular e Computador */}
            <div className="space-y-3">
              {/* Celular */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-[#002855]">
                  <Smartphone className="w-4 h-4 text-[#8CC63F]" />
                  <span>No Celular (Android e iPhone)</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 pl-5 list-disc leading-relaxed">
                  <li>
                    <strong>Android (Chrome):</strong> Toque em <em>"Instalar Aplicativo Agora"</em> abaixo ou abra o menu <strong>⋮</strong> e escolha <strong>"Adicionar à tela inicial"</strong>.
                  </li>
                  <li>
                    <strong>iPhone (Safari):</strong> Toque no botão de <strong>Compartilhar</strong> (ícone com seta ⬆) e selecione <strong>"Adicionar à Tela de Início"</strong>.
                  </li>
                </ul>
              </div>

              {/* Computador */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-[#002855]">
                  <Laptop className="w-4 h-4 text-[#004b87]" />
                  <span>No Computador (Windows / Mac / Linux)</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 pl-5 list-disc leading-relaxed">
                  <li>
                    Na <strong>barra de endereços do navegador</strong> (ao lado dos favoritos), clique no ícone de <strong>instalar ⊕</strong> ou <strong>computador com seta ⬇</strong> (<em>"Instalar aplicativo"</em>).
                  </li>
                  <li>
                    Ou abra o menu do navegador <strong>⋮</strong> → <strong>Salvar e compartilhar</strong> → <strong>Instalar esta página como aplicativo</strong>.
                  </li>
                  <li>
                    O aplicativo aparecerá com o ícone oficial da EFEM na sua <strong>Área de Trabalho</strong> e barra de tarefas!
                  </li>
                </ul>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="space-y-2 pt-1">
              {isInstallable && (
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await install();
                    if (ok) {
                      setShowInstallAppModal(false);
                      triggerMobileNotification(
                        'EFEM Adicionado à Tela Inicial!',
                        'Aplicativo instalado com sucesso no seu dispositivo.'
                      );
                    }
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-[#8CC63F] hover:bg-[#7cb632] text-[#002855] font-black text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md cursor-pointer"
                >
                  <Download className="w-5 h-5 text-[#002855]" />
                  <span>Instalar Aplicativo Agora</span>
                </button>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleCopyAppUrl}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedAppUrl ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-black">Link Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Copiar Link do Aplicativo</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerMobileNotification(
                      'Notificações EFEM & SIPAE Ativas!',
                      'Você receberá alertas sonoros e no ícone sempre que houver novidades no portal ou 24h antes dos cursos.'
                    );
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Bell className="w-4 h-4 text-lime-300" />
                  <span>Ativar & Testar Alertas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
