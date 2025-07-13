import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'nurse-platform-super-secret-jwt-key-2024',
      issuer: 'nurse-platform',
      audience: 'nurse-platform-users',
    });
  }

  async validate(payload: JwtPayload): Promise<UserDocument> {
    const { sub } = payload;

    const user = await this.userModel.findById(sub).exec();
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user is still active/verified for sensitive operations
    if (user.status === 'rejected') {
      throw new UnauthorizedException('Account has been rejected');
    }

    return user;
  }
}
