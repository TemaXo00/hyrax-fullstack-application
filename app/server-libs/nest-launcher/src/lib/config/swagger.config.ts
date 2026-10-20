import { DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger'

import { APP_NAME, AUTHOR_GITHUB, AUTHOR_MAIL, AUTHOR_NAME, SWAGGER_PATH } from './info.config.js'

export const SWAGGER_CONFIG = new DocumentBuilder()
  .setTitle(APP_NAME)
  .setContact(AUTHOR_NAME, AUTHOR_GITHUB, AUTHOR_MAIL)
  .addBearerAuth()
  .setOpenAPIVersion('3.2.0')
  .build()

export const SWAGGER_UI_CONFIG: SwaggerCustomOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'list',
    filter: true,
    displayRequestDuration: true,
    operationsSorter: (a: { get: (arg0: string) => string }, b: { get: (arg0: string) => string }) => {
      const methodOrder: Record<string, number> = {
        get: 1,
        query: 2,
        post: 3,
        put: 4,
        patch: 5,
        delete: 6,
        head: 7,
        options: 8,
        trace: 9,
      }
      const methodA = a.get('method').toLowerCase()
      const methodB = b.get('method').toLowerCase()

      return (methodOrder[methodA] || 99) - (methodOrder[methodB] || 99)
    },
    tagsSorter: 'alpha',
    tryItOutEnabled: true,
    requestSnippetsEnabled: true,
    syntaxHighlight: {
      activated: true,
      theme: 'monokai',
    },
    displayOperationId: true,
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
    showExtensions: true,
    showCommonExtensions: true,
    deepLinking: true,
    validatorUrl: null,
    supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch', 'query'],
  },
  customSiteTitle: 'API',
  customCss: `
    .swagger-ui .topbar {display: none !important;}
    `,
  jsonDocumentUrl: `${SWAGGER_PATH}/swagger.json`,
  yamlDocumentUrl: `${SWAGGER_PATH}/swagger.yaml`,
}
