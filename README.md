# Homelab Landing Page

Современная, быстрая и эстетичная стартовая страница для ваших сервисов и серверов. Наверное... Позволяет удобно организовать доступ к локальным и внешним сервисам с мониторингом их состояния в реальном времени.

<img width="700" alt="изображение" src="https://github.com/user-attachments/assets/fd49194b-2d60-4689-a9ff-8bd4dae3cfaa" />
<img width="700" alt="изображение" src="https://github.com/user-attachments/assets/6e1c4bb5-ca44-40bc-87c6-bef89af811c3" />

## 🚀 Основные возможности

- **Мониторинг статуса в реальном времени**:
  - **Основной статус (HTTP/TCP)**: Большая лампа показывает доступность веб-интерфейса.
  - **Микро-статус (ICMP/Ping)**: Маленькие индикаторы под основной лампой показывают доступность узла по сети (LAN, Yggdrasil и др.) без необходимости раскрывать карточку.
- **Полная поддержка Yggdrasil**: Корректная работа с IPv6-адресами Yggdrasil для HTTP-чеков и ICMP-пинга (используется `family: 6` и флаг `-6` для пинга).
- **Интерактивный интерфейс**:
  - **Drag-and-drop**: Изменяйте порядок карточек перетаскиванием (сохраняется в `localStorage`).
  - **Фильтрация**: Мгновенный поиск и фильтры по категориям или сети Yggdrasil.
  - **PWA**: Устанавливается как приложение, работает оффлайн (кеширование статики).
  - **Светлая/Тёмная темы**: красота.
- **Sidecar Status API**: Выделенный сервис на Node.js для проверки статусов, обходящий ограничения CORS.

# Самое главное! Если долго смотреть на фон - он будет менять цвет! Отвал башки!

## 🛠 Технологический стек

- **Frontend**: Nuxt 4, Tailwind CSS, Nuxt UI.
- **Backend**: Node.js (Status API) в отдельном контейнере.
- **Proxy/Serve**: Nginx.
- **Runtime**: Docker & Docker Compose.

## 📦 Быстрый запуск

1. Склонируйте репозиторий.
2. Отредактируйте ваши сервисы в файле `app/composables/useLinks.ts`.
3. Запустите сборку:
   ```bash
   docker-compose up -d --build
   ```
4. Сайт будет доступен на порту `4444`.
5. Для production рекомендуется поставить за reverse proxy (например Nginx Proxy Manager) с SSL-сертификатом.

### LXC (Proxmox unprivileged container) override
В LXC Docker не может пробросить IPv6-маршруты (Yggdrasil и т.д.) в bridge-сеть
из-за ограничений unprivileged namespace. Решение: status-api работает в host-сети
LXC-контейнера, где все маршруты уже есть.
Использование:
```bash
docker compose -f docker-compose.yml -f docker-compose.lxc.yml up -d --build
```

## ⚙️ Настройка ссылок

Все ссылки и категории настраиваются в файле `app/composables/useLinks.ts`. 

Пример структуры объекта:

```typescript
{
  name: 'Nginx Proxy Manager',
  description: 'Реверс-прокси',
  url: 'https://npm.local.ru',
  gradient: 'from-green-500 via-emerald-600 to-teal-600',
  icon: 'simple-icons:nginx',
  category: 'Сеть',
  ips: [
    { label: 'Local', addr: '192.168.1.3' },
    { label: 'Yggdrasil', addr: '203:a782:5a4a:488d:dca:e1aa' },
  ],
}
```

## 📄 Лицензия
MIT
