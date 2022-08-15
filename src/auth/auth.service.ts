import { PrismaService } from './../prisma/prisma.service';
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthDto, SignInDto } from './dto';
import * as bcrypt from 'bcrypt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async signUp(dto: AuthDto) {
    try {
      const saltRounds: number = 10;
      const hash: string = bcrypt.hashSync(dto.password, saltRounds);
      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          hash: hash,
        },
      });
      delete user.hash;
      return { user: user };
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new ForbiddenException('Credentials already taken!');
        }
      } else {
        throw e;
      }
    }
  }

  async signIn(dto: SignInDto) {
    const userFound = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    if (!userFound) {
      throw new UnauthorizedException('Invalid email/password');
    }
    const doesPasswordMatch = bcrypt.compareSync(dto.password, userFound.hash);
    if (!doesPasswordMatch) {
      throw new UnauthorizedException('Invalid email/password');
    }
    delete userFound.hash;
    return { message: 'Signed in successfully', user: userFound };
  }
}
