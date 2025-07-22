import { Controller, Post, Req, Headers, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Stripe from 'stripe';
import { Payment, PaymentDocument, PaymentStatus } from '../schemas/payment.schema';

@Controller('api/webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  private stripe: Stripe;

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
    });
  }

  @Post('stripe')
  async handleStripeWebhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      this.logger.error('Stripe webhook secret is not configured');
      throw new BadRequestException('Webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      // Verify the webhook signature
      event = this.stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret
      );
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    this.logger.log(`Received Stripe webhook: ${event.type}`);

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'charge.dispute.created':
          await this.handleChargeDispute(event.data.object as Stripe.Dispute);
          break;
        
        case 'invoice.payment_succeeded':
          // Handle subscription payments if needed
          break;
        
        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`);
      throw new BadRequestException('Error processing webhook');
    }
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`Payment succeeded: ${paymentIntent.id}`);

    const payment = await this.paymentModel.findOne({
      externalTransactionId: paymentIntent.id,
    });

    if (!payment) {
      this.logger.warn(`Payment not found for PaymentIntent: ${paymentIntent.id}`);
      return;
    }

    // Update payment status
    payment.status = PaymentStatus.COMPLETED;
    payment.processedAt = new Date();
    
    // Update metadata with additional Stripe information
    payment.metadata = {
      ...payment.metadata,
      stripeChargeId: paymentIntent.latest_charge,
      stripePaymentMethod: paymentIntent.payment_method,
      stripeReceiptUrl: paymentIntent.charges?.data[0]?.receipt_url,
    };

    await payment.save();

    this.logger.log(`Payment ${payment._id} marked as completed`);

    // Here you could trigger additional actions like:
    // - Send confirmation emails
    // - Update request status
    // - Trigger notifications
    // - Update nurse earnings
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`Payment failed: ${paymentIntent.id}`);

    const payment = await this.paymentModel.findOne({
      externalTransactionId: paymentIntent.id,
    });

    if (!payment) {
      this.logger.warn(`Payment not found for PaymentIntent: ${paymentIntent.id}`);
      return;
    }

    // Update payment status
    payment.status = PaymentStatus.FAILED;
    payment.failedAt = new Date();
    payment.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';

    await payment.save();

    this.logger.log(`Payment ${payment._id} marked as failed`);

    // Here you could trigger additional actions like:
    // - Send failure notifications
    // - Retry payment logic
    // - Update request status
  }

  private async handleChargeDispute(dispute: Stripe.Dispute) {
    this.logger.log(`Charge dispute created: ${dispute.id} for charge: ${dispute.charge}`);

    // Find the payment associated with this charge
    const payment = await this.paymentModel.findOne({
      'metadata.stripeChargeId': dispute.charge,
    });

    if (!payment) {
      this.logger.warn(`Payment not found for disputed charge: ${dispute.charge}`);
      return;
    }

    // Update payment metadata with dispute information
    payment.metadata = {
      ...payment.metadata,
      disputeId: dispute.id,
      disputeReason: dispute.reason,
      disputeStatus: dispute.status,
      disputeAmount: dispute.amount,
    };

    await payment.save();

    this.logger.log(`Payment ${payment._id} updated with dispute information`);

    // Here you could trigger additional actions like:
    // - Notify administrators
    // - Freeze related funds
    // - Send dispute notifications
  }
}
