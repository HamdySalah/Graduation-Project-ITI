import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatMessageDto {
  @ApiProperty({
    description: 'Message text to send to the AI chatbot',
    example: 'How can I find a qualified nurse?',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;
}
