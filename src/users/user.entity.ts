import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { WireTransfer } from '../wireTransfer/wireTransfer.entity';
import { IsEnum } from 'class-validator';
import { UserType } from './users.interfaces';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  userId: string;

  @Column()
  name: string;

  @Column()
  password: string;

  @Column()
  @IsEnum(UserType)
  idType: string;

  @Column()
  idValue: string;

  @Column({ type: 'varchar', nullable: true })
  token: string | null;

  @OneToMany(() => WireTransfer, (wireTransfer) => wireTransfer.user, {
    cascade: true,
  })
  wireTransfers: WireTransfer[];
}
