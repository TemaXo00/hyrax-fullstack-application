import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ description: 'Статус ответа', example: 'error' })
  status: string;

  @ApiProperty({
    description: 'Время возникновения ошибки',
    type: String,
    format: 'date-time',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Путь запроса',
    example: '/api/auth/login',
  })
  path: string;

  @ApiProperty({ description: 'HTTP-метод запроса', example: 'POST' })
  method: string;

  @ApiProperty({
    description: 'Сообщение об ошибке',
    example: 'Неверный никнейм или пароль',
  })
  message: string;

  @ApiProperty({
    description: 'Длительность обработки запроса',
    example: '12ms',
  })
  duration: string;
}
