import { IsString, IsNumber, IsEnum, IsOptional, IsObject, Min, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod, PaymentType } from '../schemas/payment.schema';

export class CreatePaymentIntentDto {
  @ApiProperty({
    description: 'Request ID for the payment',
    example: '507f1f77bcf86cd799439011'
  })
  @IsString()
  requestId!: string;

  @ApiProperty({
    description: 'Payment amount in smallest currency unit (e.g., piastres for EGP)',
    example: 15000,
    minimum: 1
  })
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'egp',
    default: 'egp'
  })
  @IsString()
  @IsOptional()
  currency?: string = 'egp';

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD
  })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @ApiProperty({
    description: 'Payment description',
    example: 'Payment for wound care service'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Additional metadata',
    example: { serviceType: 'wound_care', duration: 2 }
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ConfirmPaymentDto {
  @ApiProperty({
    description: 'Stripe Payment Intent ID',
    example: 'pi_1234567890abcdef'
  })
  @IsString()
  paymentIntentId!: string;

  @ApiProperty({
    description: 'Request ID associated with the payment',
    example: '507f1f77bcf86cd799439011'
  })
  @IsString()
  requestId!: string;
}

export class RefundPaymentDto {
  @ApiProperty({
    description: 'Reason for refund',
    example: 'Service cancelled by patient'
  })
  @IsString()
  reason!: string;

  @ApiProperty({
    description: 'Refund amount in smallest currency unit (optional, defaults to full amount)',
    example: 15000,
    minimum: 1
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  amount?: number;
}

export class PaymentWebhookDto {
  @ApiProperty({
    description: 'Stripe event type',
    example: 'payment_intent.succeeded'
  })
  @IsString()
  type!: string;

  @ApiProperty({
    description: 'Stripe event data'
  })
  @IsObject()
  data!: any;
}

export class PaymentResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true
  })
  success!: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Payment intent created successfully'
  })
  message!: string;

  @ApiProperty({
    description: 'Payment data'
  })
  data?: any;
}
