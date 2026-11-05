import React from 'react';
import { Calendar, MapPin, Users, ExternalLink, LogIn } from 'lucide-react';

export const SIPAE_GOOGLE_LOGIN_URL =
  'https://accounts.google.com/o/oauth2/auth?response_type=code&access_type=online&client_id=858912930727-ga06ipmhacunnhjoq3beot01t007v20r.apps.googleusercontent.com&redirect_uri=https:%2F%2Fseduct.campos.rj.gov.br%2Fredirect.php&state&scope=email%20profile&approval_prompt=auto';

/**
 * 1. Plano de Fundo (Tom Leve) - Segunda imagem em anexo:
 * Fundo bege/creme suave com marca d'água dos ícones da EFEM distribuídos em padrão delicado
 * e borda pastel sutil.
 */
export const EfemWallpaperBackground: React.FC = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ backgroundColor: '#f5f2e9' }}
      aria-hidden="true"
    >
      {/* Moldura pastel suave igual à segunda imagem */}
      <div className="absolute inset-2 sm:inset-4 border-4 border-[#d5dfe5]/60 rounded-xl pointer-events-none" />

      <svg
        className="w-full h-full opacity-[0.22]"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="efem-watermark-pattern"
            width="360"
            height="360"
            patternUnits="userSpaceOnUse"
          >
            {/* Ícone Superior Esquerdo */}
            <g transform="translate(30, 25) scale(0.42)">
              <circle cx="178" cy="248" r="26" fill="#b8dc8f" />
              <path d="M138 355 C138 288, 218 288, 218 355 Z" fill="#b8dc8f" />
              <circle cx="334" cy="248" r="26" fill="#f2b5a7" />
              <path d="M294 355 C294 288, 374 288, 374 355 Z" fill="#f2b5a7" />
              <circle cx="256" cy="218" r="34" fill="#f7df94" />
              <path d="M200 375 C200 280, 312 280, 312 375 Z" fill="#f7df94" />
              <path
                d="M256 445 L136 355 L136 382 L86 335 L136 288 L136 315 L256 400 L376 315 L376 288 L426 335 L376 382 L376 355 Z"
                fill="#a3becb"
              />
            </g>

            {/* Ícone Central Maior */}
            <g transform="translate(185, 165) scale(0.54)">
              <circle cx="178" cy="248" r="26" fill="#b8dc8f" />
              <path d="M138 355 C138 288, 218 288, 218 355 Z" fill="#b8dc8f" />
              <circle cx="334" cy="248" r="26" fill="#f2b5a7" />
              <path d="M294 355 C294 288, 374 288, 374 355 Z" fill="#f2b5a7" />
              <circle cx="256" cy="218" r="34" fill="#f7df94" />
              <path d="M200 375 C200 280, 312 280, 312 375 Z" fill="#f7df94" />
              <path
                d="M256 445 L136 355 L136 382 L86 335 L136 288 L136 315 L256 400 L376 315 L376 288 L426 335 L376 382 L376 355 Z"
                fill="#a3becb"
              />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#efem-watermark-pattern)" />
      </svg>
    </div>
  );
};

/**
 * Logotipo Oficial da EFEM (Três bonecos: verde, amarelo, laranja sobre livro/setas azuis)
 * Exatamente nas proporções da imagem de capa enviada.
 */
export const EfemLogoGraphic: React.FC<{ className?: string }> = ({ className = 'w-56 h-56' }) => (
  <svg
    viewBox="0 0 512 460"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Logotipo EFEM - Escola de Formação de Educadores Municipais de Campos dos Goytacazes"
  >
    {/* Boneco Esquerdo (Verde #8CC63F) */}
    <ellipse cx="188" cy="182" rx="25" ry="30" fill="#8CC63F" />
    <path d="M148 308 C148 220, 228 220, 228 308 Z" fill="#8CC63F" />

    {/* Boneco Direito (Laranja #F15A24) */}
    <ellipse cx="324" cy="182" rx="25" ry="30" fill="#F15A24" />
    <path d="M284 308 C284 220, 364 220, 364 308 Z" fill="#F15A24" />

    {/* Boneco Central (Amarelo Ouro #FFCC00) */}
    <ellipse cx="256" cy="138" rx="33" ry="40" fill="#FFCC00" />
    <path d="M202 345 C202 195, 310 195, 310 345 Z" fill="#FFCC00" />

    {/* Base Livro Aberto com Setas Duplas Curvas (Azul Institucional #004E82) */}
    <path
      d="M256 425 L132 315 L132 348 L68 292 L132 232 L132 268 Q195 292 256 368 Q317 292 380 268 L380 232 L444 292 L380 348 L380 315 Z"
      fill="#004E82"
    />
  </svg>
);

/**
 * 2. Página e Imagem REAL do link https://seduct.campos.rj.gov.br/?p=eventos&id=3870
 * Sub-aba: "Ensino Fundamental (anos iniciais)"
 * Evento Real no SIPAE/SEDUCT: "Saberes das Águas e Memórias da Terra"
 * Imagem Oficial: https://seduct.campos.rj.gov.br/eventos/Saberes-das-aguas.jpg
 */
export const Event3870RealCard: React.FC<{
  onDirectSipaeEnroll: () => void;
}> = ({ onDirectSipaeEnroll }) => {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-xl border-2 border-[#004b87]">
      {/* Barra de cabeçalho idêntica ao portal SIPAE / SEDUCT */}
      <div className="bg-[#003867] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-sky-200 block">
            Portal SIPAE · https://seduct.campos.rj.gov.br/?p=eventos&id=3870
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
            Saberes das Águas e Memórias da Terra
          </h3>
        </div>
        <span className="text-xs font-bold bg-white/15 px-3 py-1 rounded-md text-sky-100">
          #seduct · #efem · #educacao · #formacao · #arte
        </span>
      </div>

      {/* Corpo com a imagem exata da página https://seduct.campos.rj.gov.br/eventos/Saberes-das-aguas.jpg */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <div className="md:col-span-5">
          <a
            href="https://seduct.campos.rj.gov.br/?p=eventos&id=3870"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl overflow-hidden border-2 border-slate-200 shadow-md hover:shadow-xl transition-shadow group"
          >
            <img
              src="/api/proxy-image?url=https%3A%2F%2Fseduct.campos.rj.gov.br%2Feventos%2FSaberes-das-aguas.jpg"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://seduct.campos.rj.gov.br/eventos/Saberes-das-aguas.jpg';
              }}
              alt="Saberes das Águas e Memórias da Terra - Evento Oficial SEDUCT #3870"
              referrerPolicy="no-referrer"
              className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-200"
            />
          </a>
        </div>

        <div className="md:col-span-7 space-y-4 text-slate-800">
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-bold text-[#003867] bg-sky-50 p-3.5 rounded-xl border border-sky-200">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>28/09/2026</span>
            </span>
            <span>·</span>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Casa+de+Cultura+Jos%C3%A9+C%C3%A2ndido+de+Carvalho"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:underline"
            >
              <MapPin className="w-4 h-4 shrink-0" />
              <span>Casa de Cultura José Cândido de Carvalho</span>
            </a>
          </div>

          <div className="space-y-3 text-sm sm:text-base leading-relaxed text-slate-700">
            <p>
              A arte tem o poder único de conectar sensibilidade, memória, ancestralidade e sustentabilidade. Na formação em arte{' '}
              <strong>Saberes das Águas e Memórias da Terra</strong>, convidamos você, educador(a), a mergulhar em uma jornada de criação poética, reflexão e prática pedagógica viva.
            </p>
            <p>
              Utilizar as linguagens artísticas para escutar o território, resgatar memórias e expressar a urgência do cuidado com a terra e com as águas expande o seu repertório docente e desperta nos estudantes uma consciência profunda, estética e crítica. A arte se torna, assim, uma ferramenta potente de transformação dentro e fora da sala de aula.
            </p>
            <p className="font-semibold text-slate-900">
              Garanta sua vaga e venha enriquecer sua prática através da força expressiva da arte, da escuta da terra e do fluxo das águas!
            </p>
          </div>

          <div className="bg-slate-100 p-3.5 rounded-xl border border-slate-200 flex items-start gap-2.5 text-xs sm:text-sm">
            <Users className="w-5 h-5 text-[#003867] shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900">Público-Alvo:</strong> PROFESSORES DOS ANOS INICIAIS DO ENSINO FUNDAMENTAL DA REDE MUNICIPAL DE ENSINO DE CAMPOS DOS GOYTACAZES
            </div>
          </div>

          {/* Botões de Inscrição Direta com E-mail Institucional no site do link */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onDirectSipaeEnroll}
              className="px-5 py-3 rounded-xl bg-[#0047AB] hover:bg-[#003380] text-white font-extrabold text-sm inline-flex items-center gap-2 shadow-md transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Inscrever-se com E-mail Institucional direto no Site SEDUCT</span>
            </button>

            <a
              href="https://seduct.campos.rj.gov.br/?p=eventos&id=3870"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#003867] font-extrabold text-sm inline-flex items-center gap-2 border border-slate-300 transition-colors"
            >
              <span>Abrir Página do Evento (#3870)</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 3. Cartaz e Imagem Oficial da Aba "Gestores":
 * Formação denominada "Caminhos Compartilhantes com o PDDE em Campos dos Goytacazes - RJ"
 * Link: https://seduct.campos.rj.gov.br/?p=eventos&id=3886
 * Imagem Oficial no Servidor SEDUCT: https://seduct.campos.rj.gov.br/eventos/NOVO-NEUROCIENCIA-NA-EDUCACAO-1.jpg
 */
export const GestoresPddePoster: React.FC = () => {
  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-xl border-2 border-[#165b8c] bg-white">
      <a
        href="https://seduct.campos.rj.gov.br/?p=eventos&id=3886"
        target="_blank"
        rel="noopener noreferrer"
        className="block group overflow-hidden"
        title="Clique para acessar a página oficial de inscrição no portal SEDUCT (id=3886)"
      >
        <img
          src="/api/proxy-image?url=https%3A%2F%2Fseduct.campos.rj.gov.br%2Feventos%2FNOVO-NEUROCIENCIA-NA-EDUCACAO-1.jpg"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              'https://seduct.campos.rj.gov.br/eventos/NOVO-NEUROCIENCIA-NA-EDUCACAO-1.jpg';
          }}
          alt="Formação Presencial em Campos dos Goytacazes - Caminhos Compartilhantes com o PDDE"
          referrerPolicy="no-referrer"
          className="w-full h-auto object-contain group-hover:scale-[1.01] transition-transform duration-200"
        />
      </a>
    </div>
  );
};
