import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Request, 
  ValidationPipe,
  Headers,
  RawBodyRequest,
  Req
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { 
  CreatePaymentIntentDto, 
  ConfirmPaymentDto, 
  RefundPaymentDto, 
  PaymentResponseDto 
} from '../dto/payment.dto';

@ApiTags('Payments')
@Controller('api/payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-payment-intent')
  @ApiOperation({ summary: 'Create a payment intent for a service request' })
  @ApiResponse({ 
    status: 201, 
    description: 'Payment intent created successfully',
    type: PaymentResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  async createPaymentIntent(
    @Body(ValidationPipe) createPaymentIntentDto: CreatePaymentIntentDto,
    @Request() req: any
  ) {
    return this.paymentsService.createPaymentIntent(createPaymentIntentDto, req.user);
  }

  @Post('confirm-payment')
  @ApiOperation({ summary: 'Confirm a payment after successful processing' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment confirmed successfully',
    type: PaymentResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Payment confirmation failed' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async confirmPayment(
    @Body(ValidationPipe) confirmPaymentDto: ConfirmPaymentDto,
    @Request() req: any
  ) {
    return this.paymentsService.confirmPayment(confirmPaymentDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get payment history for the authenticated user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment history retrieved successfully',
    type: PaymentResponseDto 
  })
  async getPaymentHistory(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.paymentsService.getPaymentHistory(req.user, pageNum, limitNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment details by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment details retrieved successfully',
    type: PaymentResponseDto 
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPaymentById(
    @Param('id') paymentId: string,
    @Request() req: any
  ) {
    return this.paymentsService.getPaymentById(paymentId, req.user);
  }

  @Post('refund/:id')
  @ApiOperation({ summary: 'Process a refund for a payment' })
  @ApiResponse({ 
    status: 200, 
    description: 'Refund processed successfully',
    type: PaymentResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Refund failed' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async refundPayment(
    @Param('id') paymentId: string,
    @Body(ValidationPipe) refundDto: RefundPaymentDto,
    @Request() req: any
  ) {
    return this.paymentsService.refundPayment(paymentId, refundDto, req.user);
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get payment statistics summary' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment statistics retrieved successfully',
    type: PaymentResponseDto 
  })
  async getPaymentStats(@Request() req: any) {
    // This would be implemented based on your analytics requirements
    return {
      success: true,
      message: 'Payment statistics retrieved successfully',
      data: {
        totalEarnings: 0,
        totalPayments: 0,
        pendingPayments: 0,
        // Add more statistics as needed
      },
    };
  }

  @Get('nurse/earnings')
  @ApiOperation({ summary: 'Get nurse earnings summary' })
  @ApiResponse({ 
    status: 200, 
    description: 'Nurse earnings retrieved successfully',
    type: PaymentResponseDto 
  })
  async getNurseEarnings(@Request() req: any) {
    // This would be implemented to show nurse-specific earnings
    return {
      success: true,
      message: 'Nurse earnings retrieved successfully',
      data: {
        totalEarnings: 0,
        thisMonthEarnings: 0,
        pendingPayouts: 0,
        // Add more earnings data as needed
      },
    };
  }
}
