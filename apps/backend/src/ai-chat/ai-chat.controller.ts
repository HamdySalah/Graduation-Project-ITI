import { Controller, Post, Body, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AiChatService } from './ai-chat.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { ChatResponseDto } from './dto/chat-response.dto';

@ApiTags('AI Chat')
@Controller('ai-chat')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post('message')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a message to the AI chatbot and get a response' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Message processed successfully',
    type: ChatResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid message format or empty message',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Error processing message or connecting to OpenAI',
  })
  async sendMessage(@Body() chatMessageDto: ChatMessageDto): Promise<ChatResponseDto> {
    const aiResponse = await this.aiChatService.generateResponse(chatMessageDto.message);
    return { response: aiResponse };
  }

  @Get('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test endpoint for the AI chat module' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Test endpoint working',
  })
  async testEndpoint(): Promise<{ status: string; apiKey: boolean }> {
    const apiKey = !!this.aiChatService['configService'].get<string>('OPENAI_API_KEY');
    return { 
      status: 'working',
      apiKey: apiKey
    };
  }
}
