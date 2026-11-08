# Hyrax

## Описание

### Информация о разработке

Проект разработан в рамках дисциплины "Современные технологии серверной разработки". Является игрой "кликером" с питомцами

### Технологический стек

Разработано в виде монорепозитория, созданного при помощи [NX](https://nx.dev/). Приложение включает в себя следующие технологии:

- [NestJS](https://nestjs.com/) - Node.js-фреймворк для разработки API
- [VueJS](https://vuejs.org/) - фреймворк для разработки клиентских SPA-приложений
- [PostgreSQL](https://www.postgresql.org/) - реляционная СУБД

Также, в разработке участвовало следующее ПО:

- [Docker](https://www.docker.com/) - платформа виртуализации для упаковки и использования контейнеров
- [NodeJS](https://nodejs.org/en) - кроссплатформенный рантайм для JavaScript

### Архитектура проекта

```text
.
├── app                               # Корневая директория NX-монорепозитория
│   ├── client-libs                   # Библиотеки, предназначенные для Frontend
│   ├── core-libs                     # Базовые библиотеки (конфигурации, типы, прочее)
│   ├── server-libs                   # Библиотеки, предназначенные для Backend
│   ├── services                      # Приложения (server и client)
│   ├── eslint.config.mjs             # Конфигурация ESLint
│   ├── nx.json                       # Конфигурация NX
│   ├── package.json                  # Node.js-зависимости
│   ├── package-lock.json             # Node.js-зависимости (lock)
│   ├── tsconfig.base.json            # Базовая настройка TSConfig
│   └── tsconfig.json                 # Настройка TypeScript
├── build                             # Docker-файлы для сборки приложений
├── CONTRIBUTING.md                   # Информация о участии в проекте
├── docker-compose.infra.yml          # Инфраструктура: PostgreSQL + применение миграций
├── docker-compose.test.yml           # Полный тестовый стек: БД, API, клиент
└── README.md                         # Документация проекта
```

## Установка

### Быстрый старт

```bash
# Клонируем репозиторий
git clone https://github.com/TemaXo00/hyrax-fullstack-application.git
# Переходим в директорию
cd hyrax-fullstack-application
# Копируем .env.example и называем .env
cp .env.example .env
# Опционально: редактируем переменные окружения
nano .env
# Запускаем полный тестовый стек (PostgreSQL + API + клиент)
docker compose -f docker-compose.test.yml up --build -d
```

### Ручная установка и использование

```bash
# Клонируем репозиторий
git clone https://github.com/TemaXo00/hyrax-fullstack-application.git
# Переходим в директорию
cd hyrax-fullstack-application
# Копируем .env.example и называем .env в корневой директории проекта и директории app
cp .env.example .env
cp app/.env.example app/.env
# Запускаем Docker-контейнеры для инфраструктуры
docker compose -f docker-compose.infra.yml up --build -d
# Переходим в директорию app, устаанвливаем зависимости, запускаем приложение
cd app
npm ci
npm run all:dev
```

## Игровой бэкенд

### REST API

После запуска сервера Swagger UI доступен по адресу `http://localhost:3000/api/docs`.
Все маршруты, кроме регистрации и входа, требуют JWT в заголовке
`Authorization: Bearer <access-token>`.

| Группа | Маршрут | Назначение |
| --- | --- | --- |
| Auth | `POST /api/auth/register` | Регистрация и выдача пары токенов |
| Auth | `POST /api/auth/login` | Вход в аккаунт |
| Auth | `POST /api/auth/refresh` | Обновление access-токена |
| Auth | `GET /api/auth/me` | Профиль со связанными сущностями |
| Pets | `GET /api/pets/me` | Состояние питомца, инвентарь, улучшения и затухание |
| Pets | `PATCH /api/pets/name` | Переименование питомца |
| Pets | `POST /api/pets/click` | Клик по питомцу |
| Pets | `POST /api/pets/walk` | Выгул питомца |
| Pets | `POST /api/pets/feed` | Кормление питомца |
| Food shop | `QUERY /api/shop/foods` | Каталог еды с пагинацией и поиском |
| Food shop | `POST /api/shop/foods/:id/buy` | Покупка еды |
| Cosmetic shop | `QUERY /api/shop/cosmetics` | Каталог косметики |
| Cosmetic shop | `POST /api/shop/cosmetics/:id/buy` | Покупка косметики |
| Cosmetic shop | `PATCH /api/shop/cosmetics/:id/equip` | Экипировка и снятие косметики |
| Upgrade shop | `QUERY /api/shop/upgrades` | Каталог улучшений с уровнями игрока |
| Upgrade shop | `POST /api/shop/upgrades/:id/buy` | Покупка следующего уровня улучшения |

Списки магазинов используют HTTP-метод `QUERY` и принимают параметры
пагинации в теле запроса.

### Игровая механика

- Настроение питомца падает со 100 до 0 за 6 часов, голод — за 12 часов.
- Клик приносит `clickPower`, масштабированный настроением (от 50% до 100%),
  и 2 XP.
- Выгул приносит пятикратную награду, повышает настроение на 10, снижает
  голод на 5, даёт 10 XP и имеет кулдаун 60 секунд.
- Кормление тратит одну единицу еды, восстанавливает голод и настроение и
  даёт 5 XP.
- Порог следующего уровня: `100 + (level - 1) * 50`, максимальный уровень — 100.
- Цена следующего уровня улучшения: `basePrice * priceMultiplier ^ currentLevel`.
- Улучшения `CLICK_POWER` увеличивают силу клика, `AUTO_INCOME` начисляют
  пассивный доход за каждую полную минуту с последней синхронизации.

### WebSocket

Игровые события доступны в namespace `game` (Socket.IO). JWT передаётся в
`handshake.auth.token`, `query.token` или заголовке `Authorization`.
Сервер отправляет события `pet:state`, `pet:click`, `pet:walk`, `pet:feed`
и `pet:error`. Для игровых действий действует отдельный кулдаун на сокет.

### Ограничение частоты запросов

Для HTTP-маршрутов используется глобальный `@nestjs/throttler`.
Окно и общий лимит задаются переменными `HYRAX_SERVER_WINDOW_MS_MINUTES` и
`HYRAX_SERVER_REQUEST_LIMIT`. Для авторизации, клика и выгула настроены
отдельные, более строгие лимиты. WebSocket-соединения throttling не затрагивает.

### Сиды

```bash
cd app
npm run db:seed
```

Команда заполняет каталоги еды, косметики и улучшений, а также конфигурацию
ежедневных наград (`DailyRewardConfig`) на 7 дней.

### Тесты

```bash
cd app
npm test
```

Тесты написаны на Jest (`ts-jest`) и покрывают игровые правила, сервисы
питомца и магазинов, WebSocket-авторизацию, шлюз и throttling.

## Участники проекта

- [Kiqiou](https://github.com/kiqiou) - Куксар Екатерина, группа 2421, Team-lead, маркетолог
- [TemaXo00](https://github.com/TemaXo00) - Мельников Артём, группа 2421. Backend-разработчик
- [Czapke](https://github.com/czapkee) - Ставская Алина, группа 2421. Frontend-разработчик и дизайнер
- [Felixirrr](https://github.com/felixirrr) - Рогатко Валерия, группа 2421, тестировщик
