import { Injectable } from '@nestjs/common';
import { CustomerDTO } from '../dto/customer.dto';
import { Geometry } from 'typeorm';

@Injectable()
export class CustomerGeoService {
  async findGeom(customer: CustomerDTO): Promise<Geometry | null> {
    return null;
  }
}
