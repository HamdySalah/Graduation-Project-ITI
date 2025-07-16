import { ApiProperty } from '@nestjs/swagger';

export class ChatResponseDto {
  @ApiProperty({
    description: 'Response message from the AI chatbot',
    example: 'To find a qualified nurse, you can use our platform to search based on qualifications...',
  })
  response: string;
}
