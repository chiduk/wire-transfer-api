import { Injectable } from '@nestjs/common';
import { QuoteDto } from './dto/quote.dto';
import { WireTransferRepository } from './wireTransfer.repository';

@Injectable()
export class WireTransferService {
  constructor(private wireTransferRepository: WireTransferRepository) {}

  async getQuote(userId: string, quoteDto: QuoteDto) {
    try {
      return this.wireTransferRepository.getQuote(userId, quoteDto);
    } catch (error) {
      console.error(error);
    }
  }

  async requestWireTransfer(userId: string, quoteId: number) {
    return this.wireTransferRepository.requestWireTransfer(userId, quoteId);
  }

  async getWireTransferHistory(userId: string) {
    return this.wireTransferRepository.getWireTransferHistory(userId);
  }

  async expireQuote(quoteId: number) {
    return this.wireTransferRepository.expireQuote(quoteId);
  }
}
