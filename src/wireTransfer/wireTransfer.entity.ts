import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class WireTransfer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp' })
  quoteExpirationTime: Date;

  @Column()
  sourceAmount: number;

  @Column()
  fee: number;

  @Column({ type: 'float' })
  usdExchangeRate: number;

  @Column({ type: 'float' })
  usdAmount: number;

  @Column()
  targetCurrency: string;

  @Column({ type: 'float' })
  exchangeRate: number;

  @Column({ type: 'float' })
  targetAmount: number;

  @Column({ type: 'timestamp', nullable: true })
  requestedDate: Date | null;

  @Column()
  isWired: boolean;

  @ManyToOne(() => User, (user) => user.wireTransfers)
  user: User;
}
