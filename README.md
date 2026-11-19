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
├── docker-compose.e2e.yml            # Инфраструктура для e2e-тестов
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

## Клиентское приложение

Клиент — SPA на Vue 3 (Composition API, TypeScript, Tailwind CSS, Vue Router,
Pinia). Экраны: игра с питомцем, магазин, достижения, рейтинг и профиль.
Vite проксирует `/api` на `http://localhost:3000`, поэтому клиент и сервер
запускаются раздельно или вместе через `npm run all:dev`.

### Структура клиента

Приложение `services/client` остаётся тонким: в нём только `App.vue`, `main.ts`,
`router.ts`, Tailwind-стили и файлы запуска. Вся UI-логика вынесена в
NX-библиотеки:

- `app/client-libs/api-client` — транспорт на `ofetch`, API-модули и
  Pinia-сторы с состоянием игры, инвентарём и каталогами.
- `app/client-libs/client-core` — форматирование, работа с `localStorage` и
  визуальные утилиты.
- `app/client-libs/client-ui` — атомарные компоненты интерфейса: кнопки,
  карточки, модальные окна, прогресс-бары и элементы навигации.
- `app/client-libs/client-composables` — композаблы `usePetGame`,
  `useShopCatalog`, `useAchievements`, `useDailyReward`, `useLeaderboard`,
  `useSession` и `useNow`.
- `app/client-libs/client-pet` — компоненты питомца и игрового экрана.
- `app/client-libs/client-shop` — каталоги еды, улучшений и косметики.
- `app/client-libs/client-progress` — достижения, ежедневные награды и
  рейтинг.
- `app/client-libs/client-pages` — страницы, экраны авторизации, layout-ы и
  `ToastHost`.

### Тесты клиента

Клиентские unit-тесты написаны на Vitest и `@vue/test-utils`, запускаются в
jsdom и покрывают транспорт, сторы, композаблы, компоненты, страницы и роутер:

```bash
cd app
npm run test:client
```

Проверка типов, линтера и форматирования клиента:

```bash
npx nx run-many -t typecheck -p @org/client-core @org/api-client @org/client-ui @org/client-composables @org/client-pet @org/client-shop @org/client-progress @org/client-pages @org/client
npx nx run-many -t lint -p @org/client-core @org/api-client @org/client-ui @org/client-composables @org/client-pet @org/client-shop @org/client-progress @org/client-pages @org/client
npx prettier --check "client-libs/*/src/**/*.{ts,vue}" "services/client/src/**/*.{ts,vue}"
```

### Особенности

- Вид питомца (даман или морская свинка) переключается на клиенте и хранится в
  `localStorage`; по умолчанию выбран даман.
- Прогулка отправляет накопленные клики и имеет 30-секундный кулдаун.
- Клики ограничены 24 за 10 секунд на клиенте, чтобы не упираться в серверный
  лимит 25 за 10 секунд.
- Настроение питомца влияет на доход за клик; кормление и прогулки повышают его.

## Игровой бэкенд

### REST API

После запуска сервера Swagger UI доступен по адресу `http://localhost:3000/api/docs`.
Все маршруты, кроме регистрации, входа, обновления токенов и выхода, требуют
JWT в заголовке `Authorization: Bearer <access-token>`. `refresh` и `logout`
работают с httpOnly cookie, поэтому access-токен для них не нужен.

| Группа              | Маршрут                                     | Назначение                                          |
| ------------------- | ------------------------------------------- | --------------------------------------------------- |
| Auth                | `POST /api/auth/register`                   | Регистрация и выдача пары токенов                   |
| Auth                | `POST /api/auth/login`                      | Вход в аккаунт                                      |
| Auth                | `POST /api/auth/refresh`                    | Обновление пары токенов по refresh-cookie           |
| Auth                | `POST /api/auth/logout`                     | Выход из текущей сессии                             |
| Auth                | `GET /api/auth/me`                          | Профиль со связанными сущностями                    |
| Auth                | `PATCH /api/auth/password/change`           | Смена пароля                                        |
| Auth sessions       | `GET /api/auth/sessions`                    | Активные сессии текущего пользователя               |
| Auth sessions       | `PATCH /api/auth/sessions/:id`              | Локальное имя сессии                                |
| Auth sessions       | `DELETE /api/auth/sessions/:id`             | Удаление одной сессии                               |
| Auth sessions       | `DELETE /api/auth/sessions`                 | Удаление всех сессий, кроме текущей                 |
| Pets                | `GET /api/pets/me`                          | Состояние питомца, инвентарь, улучшения и затухание |
| Pets                | `PATCH /api/pets/name`                      | Переименование питомца                              |
| Pets                | `POST /api/pets/click`                      | Клик по питомцу                                     |
| Pets                | `POST /api/pets/walk`                       | Выгул питомца с количеством накопленных кликов      |
| Pets                | `POST /api/pets/feed`                       | Кормление питомца                                   |
| Food shop           | `QUERY /api/shop/foods`                     | Каталог еды с пагинацией и поиском                  |
| Food shop           | `POST /api/shop/foods/:id/buy`              | Покупка еды                                         |
| Cosmetic shop       | `QUERY /api/shop/cosmetics`                 | Каталог косметики                                   |
| Cosmetic shop       | `POST /api/shop/cosmetics/:id/buy`          | Покупка косметики                                   |
| Cosmetic shop       | `PATCH /api/shop/cosmetics/:id/equip`       | Экипировка и снятие косметики                       |
| Upgrade shop        | `QUERY /api/shop/upgrades`                  | Каталог улучшений с уровнями игрока                 |
| Upgrade shop        | `POST /api/shop/upgrades/:id/buy`           | Покупка следующего уровня улучшения                 |
| Pets admin          | `QUERY /api/admin/pets`                     | Все питомцы с владельцами и статистикой             |
| Pets admin          | `GET /api/admin/pets/:id`                   | Питомец по идентификатору                           |
| Pets admin          | `PATCH /api/admin/pets/:id`                 | Изменение параметров питомца                        |
| Pets admin          | `PATCH /api/admin/pets/:id/statistics`      | Изменение статистики владельца                      |
| Shop admin          | `QUERY /api/admin/shop/foods`               | Все позиции каталога еды                            |
| Shop admin          | `GET /api/admin/shop/foods/:id`             | Еда по идентификатору                               |
| Shop admin          | `POST /api/admin/shop/foods`                | Создание еды                                        |
| Shop admin          | `PATCH /api/admin/shop/foods/:id`           | Обновление еды                                      |
| Shop admin          | `DELETE /api/admin/shop/foods/:id`          | Удаление еды                                        |
| Shop admin          | `QUERY /api/admin/shop/cosmetics`           | Все позиции каталога косметики                      |
| Shop admin          | `GET /api/admin/shop/cosmetics/:id`         | Косметика по идентификатору                         |
| Shop admin          | `POST /api/admin/shop/cosmetics`            | Создание косметики                                  |
| Shop admin          | `PATCH /api/admin/shop/cosmetics/:id`       | Обновление косметики                                |
| Shop admin          | `DELETE /api/admin/shop/cosmetics/:id`      | Удаление косметики                                  |
| Shop admin          | `QUERY /api/admin/shop/upgrades`            | Все позиции каталога улучшений                      |
| Shop admin          | `GET /api/admin/shop/upgrades/:id`          | Улучшение по идентификатору                         |
| Shop admin          | `POST /api/admin/shop/upgrades`             | Создание улучшения                                  |
| Shop admin          | `PATCH /api/admin/shop/upgrades/:id`        | Обновление улучшения                                |
| Shop admin          | `DELETE /api/admin/shop/upgrades/:id`       | Удаление улучшения                                  |
| Leaderboard         | `QUERY /api/leaderboard`                    | Глобальный рейтинг игроков по метрике               |
| Leaderboard         | `QUERY /api/leaderboard/me`                 | Позиция текущего игрока в рейтинге                  |
| Achievements        | `QUERY /api/achievements`                   | Достижения с прогрессом текущего игрока             |
| Achievements        | `POST /api/achievements/:id/claim`          | Получение награды за достижение                     |
| Daily rewards       | `QUERY /api/daily-rewards`                  | Календарь, серия входов и доступность награды       |
| Daily rewards       | `POST /api/daily-rewards/claim`             | Получение ежедневной награды                        |
| Achievements admin  | `QUERY /api/admin/achievements`             | Все достижения каталога                             |
| Achievements admin  | `GET /api/admin/achievements/:id`           | Достижение по идентификатору                        |
| Achievements admin  | `POST /api/admin/achievements`              | Создание достижения                                 |
| Achievements admin  | `PATCH /api/admin/achievements/:id`         | Обновление достижения                               |
| Achievements admin  | `DELETE /api/admin/achievements/:id`        | Удаление достижения                                 |
| Daily rewards admin | `GET /api/admin/daily-rewards`              | Календарь ежедневных наград                         |
| Daily rewards admin | `PATCH /api/admin/daily-rewards/:dayNumber` | Обновление награды за день                          |
| Auth admin          | `QUERY /api/auth/admin/users`               | Список пользователей с поиском и фильтрами          |
| Auth admin          | `QUERY /api/auth/admin/users/logs`          | Журнал действий администраторов                     |
| Auth admin          | `GET /api/auth/admin/users/:id`             | Пользователь по идентификатору                      |
| Auth admin          | `GET /api/auth/admin/users/:id/sessions`    | Сессии пользователя                                 |
| Auth admin          | `DELETE /api/auth/admin/users/:id/sessions` | Отзыв всех сессий пользователя                      |
| Auth admin          | `PATCH /api/auth/admin/users/:id/block`     | Блокировка пользователя                             |
| Auth admin          | `PATCH /api/auth/admin/users/:id/unblock`   | Разблокировка пользователя                          |
| Auth admin          | `PATCH /api/auth/admin/users/:id/role`      | Изменение роли пользователя                         |

Списки магазинов, лидерборд, достижения, ежедневные награды и журнал
администратора используют HTTP-метод `QUERY` и принимают параметры пагинации и
фильтрации в теле запроса.

### Роли и доступ

- Новый пользователь получает роль `PLAYER`.
- Роль `ADMIN` открывает маршруты `/api/admin/*` и `/api/auth/admin/*`.
- Администратор может назначить роль через
  `PATCH /api/auth/admin/users/:id/role`; менять роль собственного аккаунта
  запрещено, повторное назначение той же роли возвращает `400`.
- Изменение роли применяется без повторного входа: кеш сессий пользователя
  сбрасывается сразу после операции.
- Каждая смена роли записывается в журнал администратора действием
  `USER_ROLE_CHANGED` с предыдущей и новой ролью.
- Первый администратор создаётся вне API — изменением роли пользователя в базе
  данных (например, через Prisma Studio) или тестовым хелпером.

### Игровая механика

- Настроение питомца падает со 100 до 0 за 6 часов, голод — за 12 часов.
- Клик приносит `clickPower`, масштабированный настроением (от 50% до 100%),
  и 2 XP.
- Выгул принимает количество накопленных кликов, приносит награду за каждый
  клик с пятикратным множителем, повышает настроение на 10, снижает голод на 5,
  даёт 10 XP и имеет кулдаун 30 секунд.
- Кормление тратит одну единицу еды, восстанавливает голод и настроение и
  даёт 5 XP.
- Порог следующего уровня: `100 + (level - 1) * 50`, максимальный уровень — 100.
- Цена следующего уровня улучшения: `basePrice * priceMultiplier ^ currentLevel`.
- Улучшения `CLICK_POWER` увеличивают силу клика, `AUTO_INCOME` начисляют
  пассивный доход за каждую полную минуту с последней синхронизации.

### Лидерборд

Рейтинг строится по одной из метрик (по умолчанию — `TOTAL_COINS_EARNED`):

| Метрика              | Подпись                | Источник значения                  |
| -------------------- | ---------------------- | ---------------------------------- |
| `TOTAL_COINS_EARNED` | Всего заработано монет | `PlayerStatistic.totalCoinsEarned` |
| `TOTAL_CLICKS`       | Всего кликов           | `PlayerStatistic.totalClicks`      |
| `PET_LEVEL`          | Уровень питомца        | `Pet.level`                        |
| `STREAK`             | Серия входов           | `PlayerStatistic.streak`           |

- Метрика сортируется по убыванию, при равенстве — по идентификатору игрока.
- Заблокированные игроки не попадают в рейтинг: `QUERY /api/leaderboard` их не
  возвращает, а `QUERY /api/leaderboard/me` отдаёт `rank: 0` и
  `isRanked: false`.
- В рейтинг входят только игроки с питомцем и статистикой.
- Ответы кешируются в Redis; кеш рейтинга сбрасывается при регистрации, входе,
  действиях питомца, изменении данных администратором и блокировке игрока.

### Достижения

Условие получения достижения задаётся типом и пороговым значением:

| Тип условия          | Подпись                | Источник значения                  |
| -------------------- | ---------------------- | ---------------------------------- |
| `TOTAL_CLICKS`       | Всего кликов           | `PlayerStatistic.totalClicks`      |
| `TOTAL_FEEDS`        | Всего кормлений        | `PlayerStatistic.totalFeeds`       |
| `LEVEL`              | Уровень питомца        | `Pet.level`                        |
| `TOTAL_COINS_EARNED` | Всего заработано монет | `PlayerStatistic.totalCoinsEarned` |
| `STREAK`             | Серия входов           | `PlayerStatistic.streak`           |

- Прогресс в ответе ограничивается пороговым значением; статусы `isUnlocked`,
  `isClaimed` и дата `claimedAt` показывают готовность и факт получения.
- Награда выдаётся в транзакции и увеличивает `coins` и `totalCoinsEarned`;
  повторное получение возвращает `409`, невыполненное условие — `400`.
- Администратор управляет каталогом достижений; код уникален, а удаление
  достижения, уже полученного игроком, возвращает `409`.
- Изменения каталога и выдача награды сбрасывают кеш профилей и лидерборда.

### Ежедневные награды

- Календарь состоит из 7 дней; награда за день содержит монеты и, опционально,
  косметику.
- Первое получение начинает серию с дня 1. Если последняя награда была получена
  вчера, серия продолжается, иначе сбрасывается; номер дня вычисляется как
  `((streak - 1) % 7) + 1`.
- Награду можно получить один раз в сутки (по UTC); повторный запрос возвращает
  `409`.
- Косметика выдаётся один раз: при повторном владении предметом `itemGranted`
  равен `false`, но запись о награде сохраняется.
- Получение награды синхронизирует `PlayerStatistic.streak`, увеличивает
  `coins` и `totalCoinsEarned` и сбрасывает кеш профиля и лидерборда.
- Администратор может изменить монеты и предмет для любого дня календаря.

### Журнал администратора

`QUERY /api/auth/admin/users/logs` возвращает действия администраторов: кто,
над кем и когда выполнил блокировку, разблокировку, отзыв сессий или смену роли.
Доступен только роли `ADMIN`, поддерживает фильтры `action`, `adminId`,
`targetUserId` и пагинацию. Записи отдаются от новых к старым и не кешируются.

### Ограничение частоты запросов

Для HTTP-маршрутов используется глобальный `@nestjs/throttler`.
Окно и общий лимит задаются переменными `HYRAX_SERVER_WINDOW_MS_MINUTES` и
`HYRAX_SERVER_REQUEST_LIMIT`. Для авторизации, клика и выгула настроены
отдельные, более строгие лимиты.

### Сиды

```bash
cd app
npm run db:seed
```

Команда заполняет каталоги еды, косметики, улучшений и достижений, а также
конфигурацию ежедневных наград (`DailyRewardConfig`) на 7 дней.

### Тесты

```bash
cd app
npm test
```

Unit-тесты написаны на Jest (`ts-jest`) и покрывают игровые правила, сервисы
питомца, магазинов, достижений, ежедневных наград, лидерборда и админские
операции, включая чтение журнала, guard-ы авторизации, а также throttling.

### E2E-тесты

E2E-тесты проверяют приложение по реальному HTTP: поднимают production-модуль
через `configureMonolith`, отправляют запросы с cookie и access-токенами,
работают с PostgreSQL и Redis. Для этого используется отдельная инфраструктура

```bash
cd app
npm run test:e2e
```

Скрипт по шагам:

1. поднимает `docker-compose.e2e.yml` (`PostgreSQL` на порту `55432`, `Redis`
   на порту `56379`) и ждёт healthcheck;
2. применяет миграции `prisma migrate deploy`;
3. запускает Jest в режиме `--runInBand`;
4. останавливает и удаляет контейнеры вместе с тестовыми данными.

Перед каждым тестом прикладные таблицы очищаются (`TRUNCATE ... CASCADE`), а
каталоги еды, косметики, улучшений и достижений, а также дни ежедневных наград
пересеиваются из фикстур. Redis очищается командой `FLUSHDB`.

Покрытые сценарии:

- `auth.e2e-spec.ts` — регистрация, вход, refresh-ротация, выход, смена пароля,
  управление сессиями и защита маршрутов;
- `pet.e2e-spec.ts` — состояние питомца, переименование, клик, выгул по кликам
  с кулдауном, кормление и эффект улучшений;
- `shop.e2e-spec.ts` — каталоги, покупка еды и косметики, экипировка по слотам,
  уровни улучшений и нехватка монет;
- `admin.e2e-spec.ts` — роли `ADMIN`, смена ролей, блокировки и запись в журнал
  действий, управление питомцами и каталогами, конфликты удаления;
- `leaderboard.e2e-spec.ts` — рейтинг по всем метрикам, пагинация, позиция
  текущего игрока, исключение заблокированных и сброс кеша после клика;
- `achievements.e2e-spec.ts` — прогресс и статусы достижений, выдача награды,
  повторная выдача, админский CRUD и конфликт удаления;
- `daily-rewards.e2e-spec.ts` — календарь, выдача награды, продолжение и сброс
  серии, разовая выдача косметики и админское обновление дней;
- `admin-logs.e2e-spec.ts` — журнал действий, фильтры, пагинация и доступ
  только для `ADMIN`;
- `security.e2e-spec.ts` — единый формат ошибок, `429` на выгуле и
  Swagger-контракт.

Если инфраструктура уже запущена или её нужно переиспользовать:

| Переменная                                                        | Назначение                             |
| ----------------------------------------------------------------- | -------------------------------------- |
| `HYRAX_E2E_SKIP_DOCKER=1`                                         | не поднимать и не останавливать Docker |
| `HYRAX_E2E_KEEP=1`                                                | оставить контейнеры после прогона      |
| `HYRAX_E2E_SKIP_MIGRATE=1`                                        | не применять миграции                  |
| `HYRAX_E2E_DB_PORT`                                               | порт PostgreSQL для тестов (`55432`)   |
| `HYRAX_E2E_REDIS_PORT`                                            | порт Redis для тестов (`56379`)        |
| `HYRAX_E2E_DB_NAME`, `HYRAX_E2E_DB_USER`, `HYRAX_E2E_DB_PASSWORD` | учётные данные тестовой БД             |
| `HYRAX_E2E_REDIS_PASSWORD`                                        | пароль тестового Redis                 |

Без Docker (когда `HYRAX_DB_URL` и `HYRAX_REDIS_URL` указывают на уже
подготовленные тестовые сервисы):

```bash
cd app
npm run test:e2e:run
```

## Участники проекта

- [Kiqiou](https://github.com/kiqiou) - Куксар Екатерина, группа 2421, Team-lead, маркетолог
- [TemaXo00](https://github.com/TemaXo00) - Мельников Артём, группа 2421. Backend-разработчик
- [Czapke](https://github.com/czapkee) - Ставская Алина, группа 2421. Frontend-разработчик и дизайнер
- [Felixirrr](https://github.com/felixirrr) - Рогатко Валерия, группа 2421, тестировщик
