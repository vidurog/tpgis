import { Injectable } from '@nestjs/common';
import { CustomerDTO } from '../dto/customer.dto';

@Injectable()
export class CustomerValidationService {
  validate(customer: CustomerDTO): string | null {
    return null;
  }
}
