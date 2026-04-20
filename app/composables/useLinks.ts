export interface IpEntry {
  label: string
  addr: string  // IP или Yggdrasil адрес — пингуется автоматически
}

export interface ServiceLink {
  name: string
  description: string
  url: string
  gradient: string
  icon?: string
  category?: string
  ips?: IpEntry[]
}

export interface ServiceLinkWithPage extends ServiceLink {
  _page: string
  _path: string
}

// ── Страница 1: Публичные сервисы ─────────────────────────────────────
export const publicLinks: ServiceLink[] = [
  {
    name: 'Proxmox VE',
    description: 'Кластер виртуализации · Нода 1',
    url: 'https://pve.lan.ru',
    gradient: 'from-orange-500 via-orange-600 to-red-600',
    icon: 'simple-icons:proxmox',
    category: 'Виртуализация',
    ips: [{ label: 'Local', addr: '192.168.1.2' }],
  },
  {
    name: 'Proxmox VE 2',
    description: 'Кластер виртуализации · Нода 2',
    url: 'https://suckless.org',
    gradient: 'from-orange-500 via-orange-600 to-red-600',
    icon: 'simple-icons:proxmox',
    category: 'Виртуализация',
    ips: [{ label: 'Local', addr: '192.168.1.12' }],
  },
  {
    name: 'Portainer',
    description: 'Управление контейнерами',
    url: 'https://2gis.ru',
    gradient: 'from-cyan-500 via-cyan-600 to-sky-600',
    icon: 'simple-icons:portainer',
    category: 'Управление',
    ips: [
      { label: 'Local', addr: '192.168.1.3' },
      { label: 'Yggdrasil', addr: '324:71e:281a:9ed3::41' },
    ],
  },
  {
    name: 'Pi-hole',
    description: 'DNS-блокировщик рекламы',
    url: 'https://pi-hole.local.ru',
    gradient: 'from-violet-500 via-purple-600 to-indigo-600',
    icon: 'simple-icons:pihole',
    category: 'Сеть',
    ips: [
      { label: 'Local', addr: '192.168.1.3' },
    ],
  },
  {
    name: 'TrueNAS',
    description: 'Сетевое хранилище',
    url: 'https://truenas2.lan',
    gradient: 'from-blue-500 via-blue-600 to-indigo-600',
    icon: 'simple-icons:truenas',
    category: 'Хранилище',
    ips: [{ label: 'Local', addr: '192.168.1.14' }],
  },
  {
    name: 'OnlyOffice',
    description: 'Офисный пакет',
    url: 'https://onlyoffice.lan',
    gradient: 'from-orange-400 via-orange-500 to-amber-600',
    icon: 'simple-icons:onlyoffice',
    category: 'Продуктивность',
    ips: [{ label: 'Local', addr: '192.168.1.20' }],
  },
]

// ── Страница 2: Локальная сеть (из NPM) ───────────────────────────────
export const localLinks: ServiceLink[] = [
  {
    name: 'Proxmox VE',
    description: 'Нода 1',
    url: 'https://192.168.1.2:8006',
    gradient: 'from-orange-500 via-orange-600 to-red-600',
    icon: 'simple-icons:proxmox',
    category: 'Виртуализация',
  },
  {
    name: 'Proxmox VE 2',
    description: 'Нода 2',
    url: 'https://192.168.1.12:8006',
    gradient: 'from-orange-500 via-orange-600 to-red-600',
    icon: 'simple-icons:proxmox',
    category: 'Виртуализация',
  },
  {
    name: 'Proxmox VE 3',
    description: 'Нода 3',
    url: 'https://192.168.1.22:8006',
    gradient: 'from-orange-500 via-orange-600 to-red-600',
    icon: 'simple-icons:proxmox',
    category: 'Виртуализация',
  },
  {
    name: 'Nginx Proxy Manager',
    description: 'Реверс-прокси',
    url: 'http://192.168.1.3:81',
    gradient: 'from-green-500 via-emerald-600 to-teal-600',
    icon: 'simple-icons:nginx',
    category: 'Сеть',
  },
  {
    name: 'Pi-hole',
    description: 'DNS-блокировщик',
    url: 'https://192.168.1.3:5543',
    gradient: 'from-violet-500 via-purple-600 to-indigo-600',
    icon: 'simple-icons:pihole',
    category: 'Сеть',
  },
  {
    name: 'TrueNAS',
    description: 'Хранилище (основное)',
    url: 'https://192.168.1.4:443',
    gradient: 'from-blue-500 via-blue-600 to-indigo-600',
    icon: 'simple-icons:truenas',
    category: 'Хранилище',
  },
  {
    name: 'TrueNAS 2',
    description: 'Хранилище (дополнительное)',
    url: 'https://192.168.1.14:443',
    gradient: 'from-blue-500 via-blue-600 to-indigo-600',
    icon: 'simple-icons:truenas',
    category: 'Хранилище',
  },
  {
    name: 'Nextcloud',
    description: 'Облачное хранилище',
    url: 'http://192.168.1.25:11000',
    gradient: 'from-sky-500 via-blue-600 to-indigo-700',
    icon: 'simple-icons:nextcloud',
    category: 'Хранилище',
  },
  {
    name: 'OnlyOffice',
    description: 'Офисный пакет',
    url: 'http://192.168.1.20:80',
    gradient: 'from-orange-400 via-orange-500 to-amber-600',
    icon: 'simple-icons:onlyoffice',
    category: 'Продуктивность',
  },
  {
    name: 'Traccar',
    description: 'GPS-трекинг',
    url: 'http://192.168.1.3:8083',
    gradient: 'from-emerald-500 via-teal-600 to-cyan-600',
    icon: 'heroicons:map-pin',
    category: 'Управление',
  },
]

// ── Страница 3: Внешние серверы ───────────────────────────────────────
export const externalLinks: ServiceLink[] = [
  {
    name: 'Yandex Cloud',
    description: 'Москва, Россия',
    url: 'https://ya.ru',
    gradient: 'from-yellow-500 via-orange-500 to-red-500',
    icon: 'simple-icons:yandex',
    category: 'VPS',
    ips: [
      { label: 'IP', addr: '8.8.4.4' },
      { label: 'Yggdrasil', addr: '324:71e:281a:9ed3::41' },
    ],
  },
]

// ── Все сервисы для поиска ─────────────────────────────────────────────
export function useAllLinks(): ServiceLinkWithPage[] {
  return [
    ...publicLinks.map(l => ({ ...l, _page: 'Сервисы', _path: '/' })),
    ...localLinks.map(l => ({ ...l, _page: 'Локальная', _path: '/local' })),
    ...externalLinks.map(l => ({ ...l, _page: 'Внешние', _path: '/external' })),
  ]
}
