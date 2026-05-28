// Default configuration for the "About" cards.
// Each card is a clickable link opening in a new tab.
// `label` is the big text, `caption` the small uppercase text below,
// `url` the destination. The admin panel can override this whole list.

export type AboutCard = {
  label: string;
  captionPt: string;
  captionEn: string;
  url: string;
};

export const DEFAULT_CARDS: AboutCard[] = [
  {
    label: '!instagram',
    captionPt: 'Instagram',
    captionEn: 'Instagram',
    url: 'https://www.instagram.com/ofc.coelha/',
  },
  {
    label: 'Twitch',
    captionPt: 'Plataforma',
    captionEn: 'Platform',
    url: 'https://twitch.tv/coeiha',
  },
  {
    label: '✿',
    captionPt: 'Comunidade',
    captionEn: 'Community',
    url: 'https://linktr.ee/carolzoka',
  },
  {
    label: '!pix',
    captionPt: 'Apoie',
    captionEn: 'Support',
    url: 'https://midfielder.tv.br/coelha',
  },
  {
    label: '!youtube',
    captionPt: 'YouTube',
    captionEn: 'YouTube',
    url: 'https://www.youtube.com/@Coeiha',
  },
];

export function parseCards(json: string | null): AboutCard[] {
  if (!json) return DEFAULT_CARDS;
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return DEFAULT_CARDS;
  } catch {
    return DEFAULT_CARDS;
  }
}
