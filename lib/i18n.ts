export type Lang = 'pt' | 'en';

type Dict = {
  nav: { about: string; ranking: string; live: string };
  hero: {
    tag: string;
    title: string;
    subtitle: string;
    cta: string;
    live: string;
    offline: string;
  };
  about: {
    title: string;
    placeholder: string;
    stats: { commands: string; live: string; community: string };
  };
  ranking: {
    title: string;
    subtitle: string;
    empty: string;
    points: string;
    point: string;
    position: string;
    user: string;
    total: string;
    loading: string;
    lastReset: string;
    never: string;
    admin: string;
    reset: string;
    password: string;
    confirm: string;
    resetSuccess: string;
    resetError: string;
    cancel: string;
  };
  live: {
    title: string;
    status: string;
    online: string;
    offline: string;
    watch: string;
    viewers: string;
    game: string;
  };
  admin: {
    title: string;
    login: string;
    logout: string;
    save: string;
    saved: string;
    saveError: string;
    loginHint: string;
    wrongPassword: string;
    photoTitle: string;
    uploadPhoto: string;
    noImage: string;
    posX: string;
    posY: string;
    imageTooLarge: string;
    imageError: string;
    textTitle: string;
    textPt: string;
    textEn: string;
    textPlaceholder: string;
    logoTitle: string;
    uploadLogo: string;
    linksTitle: string;
    addCard: string;
    cardLabel: string;
    cardCaptionPt: string;
    cardCaptionEn: string;
    cardUrl: string;
    dangerZone: string;
    showReset: string;
    resetSuccess: string;
    resetError: string;
  };
  footer: { made: string; by: string };
};

export const translations: Record<Lang, Dict> = {
  pt: {
    nav: {
      about: 'Sobre',
      ranking: 'Ranking',
      live: 'Live',
    },
    hero: {
      tag: 'Ponto Batido',
      title: 'Bata o ponto na live',
      subtitle: 'Use !ponto no chat da Twitch e marque presença no ranking diário',
      cta: 'Ver ranking',
      live: 'AO VIVO',
      offline: 'OFFLINE',
    },
    about: {
      title: 'Sobre',
      placeholder:
        'Sou streamer há cerca de 5 anos, apaixonada por jogos de todos os tipos e por animes. Amo compartilhar essa paixão nas lives junto com meu chat. 💖',
      stats: {
        commands: 'Comando',
        live: 'Plataforma',
        community: 'Comunidade',
      },
    },
    ranking: {
      title: 'Ranking',
      subtitle: 'Quem mais bateu o ponto',
      empty: 'Ninguém bateu o ponto ainda. Seja o primeiro!',
      points: 'pontos',
      point: 'ponto',
      position: 'Posição',
      user: 'Usuário',
      total: 'Total',
      loading: 'Carregando...',
      lastReset: 'Último reset',
      never: 'Nunca',
      admin: 'Admin',
      reset: 'Resetar ranking',
      password: 'Senha admin',
      confirm: 'Tem certeza? Isso apaga todo o ranking.',
      resetSuccess: 'Ranking resetado',
      resetError: 'Erro ao resetar',
      cancel: 'Cancelar',
    },
    live: {
      title: 'Acompanhe a live',
      status: 'Status',
      online: 'Online agora',
      offline: 'Offline',
      watch: 'Assistir na Twitch',
      viewers: 'espectadores',
      game: 'Jogo',
    },
    admin: {
      title: 'Painel Admin',
      login: 'Entrar',
      logout: 'Sair',
      save: 'Salvar alterações',
      saved: 'Salvo!',
      saveError: 'Erro ao salvar',
      loginHint: 'Digite a senha admin para editar o site.',
      wrongPassword: 'Senha incorreta',
      photoTitle: 'Foto do Sobre',
      uploadPhoto: 'Enviar nova foto',
      noImage: 'sem imagem',
      posX: 'Posição horizontal',
      posY: 'Posição vertical',
      imageTooLarge: 'Imagem muito grande (máx ~2MB)',
      imageError: 'Erro ao processar imagem',
      textTitle: 'Texto do Sobre',
      textPt: 'Texto em Português',
      textEn: 'Texto em Inglês',
      textPlaceholder: 'Escreva o texto do Sobre aqui...',
      logoTitle: 'Logo do site',
      uploadLogo: 'Enviar nova logo',
      linksTitle: 'Cards de links',
      addCard: 'Adicionar card',
      cardLabel: 'Texto principal',
      cardCaptionPt: 'Legenda (PT)',
      cardCaptionEn: 'Legenda (EN)',
      cardUrl: 'Link (URL)',
      dangerZone: 'Zona perigosa',
      showReset: 'Mostrar opções de reset',
      resetSuccess: 'Ranking resetado',
      resetError: 'Erro ao resetar',
    },
    footer: {
      made: 'Feito com',
      by: 'por',
    },
  },
  en: {
    nav: {
      about: 'About',
      ranking: 'Ranking',
      live: 'Live',
    },
    hero: {
      tag: 'Clock In',
      title: 'Clock in on the stream',
      subtitle: 'Type !ponto in Twitch chat and check in to the daily ranking',
      cta: 'See ranking',
      live: 'LIVE',
      offline: 'OFFLINE',
    },
    about: {
      title: 'About',
      placeholder:
        "I've been streaming for around 5 years — passionate about all kinds of games and anime. I love sharing that passion on stream with my chat. 💖",
      stats: {
        commands: 'Command',
        live: 'Platform',
        community: 'Community',
      },
    },
    ranking: {
      title: 'Ranking',
      subtitle: 'Who clocked in the most',
      empty: 'No one has clocked in yet. Be the first!',
      points: 'points',
      point: 'point',
      position: 'Position',
      user: 'User',
      total: 'Total',
      loading: 'Loading...',
      lastReset: 'Last reset',
      never: 'Never',
      admin: 'Admin',
      reset: 'Reset ranking',
      password: 'Admin password',
      confirm: 'Are you sure? This wipes the whole ranking.',
      resetSuccess: 'Ranking reset',
      resetError: 'Reset failed',
      cancel: 'Cancel',
    },
    live: {
      title: 'Watch the stream',
      status: 'Status',
      online: 'Online now',
      offline: 'Offline',
      watch: 'Watch on Twitch',
      viewers: 'viewers',
      game: 'Game',
    },
    admin: {
      title: 'Admin Panel',
      login: 'Log in',
      logout: 'Log out',
      save: 'Save changes',
      saved: 'Saved!',
      saveError: 'Save failed',
      loginHint: 'Enter the admin password to edit the site.',
      wrongPassword: 'Wrong password',
      photoTitle: 'About photo',
      uploadPhoto: 'Upload new photo',
      noImage: 'no image',
      posX: 'Horizontal position',
      posY: 'Vertical position',
      imageTooLarge: 'Image too large (max ~2MB)',
      imageError: 'Failed to process image',
      textTitle: 'About text',
      textPt: 'Portuguese text',
      textEn: 'English text',
      textPlaceholder: 'Write the About text here...',
      logoTitle: 'Site logo',
      uploadLogo: 'Upload new logo',
      linksTitle: 'Link cards',
      addCard: 'Add card',
      cardLabel: 'Main text',
      cardCaptionPt: 'Caption (PT)',
      cardCaptionEn: 'Caption (EN)',
      cardUrl: 'Link (URL)',
      dangerZone: 'Danger zone',
      showReset: 'Show reset options',
      resetSuccess: 'Ranking reset',
      resetError: 'Reset failed',
    },
    footer: {
      made: 'Made with',
      by: 'by',
    },
  },
};

export type Translations = Dict;
