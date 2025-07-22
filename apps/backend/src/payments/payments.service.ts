import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Payment, PaymentDocument, PaymentStatus, PaymentMethod, PaymentType } from '../schemas/payment.schema';
import { PatientRequest, PatientRequestDocument, RequestStatus } from '../schemas/patient-request.schema';
import { User, UserDocument, UserRole } from '../schemas/user.schema';
import { CreatePaymentIntentDto, ConfirmPaymentDto, RefundPaymentDto } from '../dto/payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe;

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(PatientRequest.name) private requestModel: Model<PatientRequestDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
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

  async createPaymentIntent(createPaymentIntentDto: CreatePaymentIntentDto, user: UserDocument) {
    const { requestId, amount, currency = 'egp', paymentMethod, description, metadata } = createPaymentIntentDto;

    // Verify the request exists and user has permission
    const request = await this.requestModel
      .findById(requestId)
      .populate('patientId')
      .populate('nurseId')
      .exec();

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    // Only the patient who created the request can pay for it
    if (user.role !== UserRole.PATIENT || request.patientId.toString() !== user._id.toString()) {
      throw new ForbiddenException('You can only pay for your own requests');
    }

    // Check if request is in a payable state
    if (request.status !== RequestStatus.COMPLETED) {
      throw new BadRequestException('Payment can only be made for completed requests');
    }

    // Check if payment already exists for this request
    const existingPayment = await this.paymentModel.findOne({ 
      requestId, 
      status: { $in: [PaymentStatus.COMPLETED, PaymentStatus.PROCESSING] } 
    });

    if (existingPayment) {
      throw new BadRequestException('Payment already exists for this request');
    }

    try {
      // Calculate platform fee (10% of the amount)
      const platformFee = Math.round(amount * 0.1);
      const netAmount = amount - platformFee;

      // Create Stripe Payment Intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency: currency.toLowerCase(),
        payment_method_types: ['card'],
        description: description || `Payment for nursing service - Request ${requestId}`,
        metadata: {
          requestId,
          patientId: user._id.toString(),
          nurseId: request.nurseId?.toString() || '',
          platformFee: platformFee.toString(),
          ...metadata,
        },
      });

      // Create payment record in database
      const payment = new this.paymentModel({
        patientId: user._id,
        nurseId: request.nurseId,
        requestId,
        amount,
        currency: currency.toLowerCase(),
        status: PaymentStatus.PENDING,
        paymentMethod,
        paymentType: PaymentType.SERVICE_PAYMENT,
        externalTransactionId: paymentIntent.id,
        paymentProvider: 'stripe',
        platformFee,
        netAmount,
        description,
        metadata: {
          stripePaymentIntentId: paymentIntent.id,
          ...metadata,
        },
      });

      await payment.save();

      this.logger.log(`Payment intent created: ${paymentIntent.id} for request: ${requestId}`);

      return {
        success: true,
        message: 'Payment intent created successfully',
        data: {
          paymentId: payment._id,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount,
          currency,
          platformFee,
          netAmount,
        },
      };
    } catch (error) {
      this.logger.error('Failed to create payment intent:', error);
      throw new BadRequestException('Failed to create payment intent');
    }
  }

  async confirmPayment(confirmPaymentDto: ConfirmPaymentDto, user: UserDocument) {
    const { paymentIntentId, requestId } = confirmPaymentDto;

    // Find the payment record
    const payment = await this.paymentModel.findOne({
      externalTransactionId: paymentIntentId,
      requestId,
      patientId: user._id,
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    try {
      // Retrieve the payment intent from Stripe
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        // Update payment status
        payment.status = PaymentStatus.COMPLETED;
        payment.processedAt = new Date();
        await payment.save();

        this.logger.log(`Payment confirmed: ${paymentIntentId} for request: ${requestId}`);

        return {
          success: true,
          message: 'Payment confirmed successfully',
          data: {
            paymentId: payment._id,
            status: payment.status,
            amount: payment.amount,
          },
        };
      } else {
        throw new BadRequestException(`Payment not successful. Status: ${paymentIntent.status}`);
      }
    } catch (error) {
      this.logger.error('Failed to confirm payment:', error);
      
      // Update payment status to failed
      payment.status = PaymentStatus.FAILED;
      payment.failedAt = new Date();
      payment.failureReason = error.message;
      await payment.save();

      throw new BadRequestException('Failed to confirm payment');
    }
  }

  async getPaymentHistory(user: UserDocument, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    let query: any = {};

    // Filter based on user role
    if (user.role === UserRole.PATIENT) {
      query.patientId = user._id;
    } else if (user.role === UserRole.NURSE) {
      query.nurseId = user._id;
    } else if (user.role === UserRole.ADMIN) {
      // Admins can see all payments
    } else {
      throw new ForbiddenException('Insufficient permissions');
    }

    const [payments, total] = await Promise.all([
      this.paymentModel
        .find(query)
        .populate('patientId', 'name email phone')
        .populate('nurseId', 'name email phone')
        .populate('requestId', 'title serviceType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.paymentModel.countDocuments(query),
    ]);

    return {
      success: true,
      message: 'Payment history retrieved successfully',
      data: {
        payments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };
  }

  async getPaymentById(paymentId: string, user: UserDocument) {
    const payment = await this.paymentModel
      .findById(paymentId)
      .populate('patientId', 'name email phone')
      .populate('nurseId', 'name email phone')
      .populate('requestId', 'title serviceType description')
      .exec();

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Check permissions
    const canView =
      user.role === UserRole.ADMIN ||
      payment.patientId._id.toString() === user._id.toString() ||
      payment.nurseId?._id.toString() === user._id.toString();

    if (!canView) {
      throw new ForbiddenException('You do not have permission to view this payment');
    }

    return {
      success: true,
      message: 'Payment retrieved successfully',
      data: payment,
    };
  }

  async refundPayment(paymentId: string, refundDto: RefundPaymentDto, user: UserDocument) {
    const payment = await this.paymentModel.findById(paymentId);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Only admins or the patient can request refunds
    if (user.role !== UserRole.ADMIN && payment.patientId.toString() !== user._id.toString()) {
      throw new ForbiddenException('You do not have permission to refund this payment');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    const refundAmount = refundDto.amount || payment.amount;

    try {
      // Create refund in Stripe
      const refund = await this.stripe.refunds.create({
        payment_intent: payment.externalTransactionId,
        amount: refundAmount,
        reason: 'requested_by_customer',
        metadata: {
          paymentId: payment._id.toString(),
          reason: refundDto.reason,
        },
      });

      // Update payment record
      payment.status = PaymentStatus.REFUNDED;
      payment.refundedAt = new Date();
      payment.refundAmount = refundAmount;
      payment.refundReason = refundDto.reason;
      await payment.save();

      this.logger.log(`Payment refunded: ${payment._id} - Amount: ${refundAmount}`);

      return {
        success: true,
        message: 'Payment refunded successfully',
        data: {
          paymentId: payment._id,
          refundId: refund.id,
          refundAmount,
          status: payment.status,
        },
      };
    } catch (error) {
      this.logger.error('Failed to refund payment:', error);
      throw new BadRequestException('Failed to process refund');
    }
  }
}
