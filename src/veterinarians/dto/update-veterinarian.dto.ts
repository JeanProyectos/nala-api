import { PartialType } from '@nestjs/mapped-types';
import { CreateVeterinarianDto } from './create-veterinarian.dto';
import { IsOptional, IsEnum, IsIn } from 'class-validator';
import { VeterinarianStatus } from '@prisma/client';
import {
  AVAILABILITY_STATUS_VALUES,
  type AvailabilityStatusValue,
} from '../availability-status.constants';

export class UpdateVeterinarianDto extends PartialType(CreateVeterinarianDto) {
  @IsOptional()
  @IsEnum(VeterinarianStatus)
  status?: VeterinarianStatus;

  @IsOptional()
  @IsIn(AVAILABILITY_STATUS_VALUES)
  availabilityStatus?: AvailabilityStatusValue;
}
