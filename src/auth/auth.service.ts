import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async signJwtToken(payload: object) {
    return this.jwtService.signAsync(payload);
  }

  async verifyJwtToken(token: string) {
    return this.jwtService.verifyAsync(token);
  }
}
