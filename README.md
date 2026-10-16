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
├── docker-compose.dev.yml            # Dev-среда для контейнеров
├── docker-compose.infra.yml          # Контейнеры для запуска общей инфраструктуры (пример: базы данных)
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
# Запускаем dev-контейнеры
docker compose -f docker-compose.dev.yml up --build -d
```

### Ручная установка и использование

```bash
# Клонируем репозиторий
git clone https://github.com/TemaXo00/hyrax-fullstack-application.git
# Переходим в директорию
cd hyrax-fullstack-application
# Копируем .env.example и называем .env в корневой директории проекта и директории app
cp .env.example .env
cp app/.env.example .env
# Запускаем Docker-контейнеры для инфраструктуры
docker compose -f docker-compose.infra.yml up --build -d
# Переходим в директорию app, устаанвливаем зависимости, запускаем приложение
cd app
npm ci
npm run all:dev
```

## Участники проекта

- [Kiqiou](https://github.com/kiqiou) - Куксар Екатерина, группа 2421, Team-lead, маркетолог, тестировщик
- [TemaXo00](https://github.com/TemaXo00) - Мельников Артём, группа 2421. Backend-разработчик
- [Czapke](https://github.com/czapkee) - Ставская Алина, группа 2421. Frontend-разработчик и дизайнер
