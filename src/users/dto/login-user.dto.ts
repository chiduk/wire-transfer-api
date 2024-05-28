import { CreateUserDto } from './create-user.dto';
import { OmitType } from '@nestjs/swagger';

export class LogInDto extends OmitType(CreateUserDto, [
  'name',
  'idType',
  'idValue',
] as const) {}
