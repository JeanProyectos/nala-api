import { IsIn } from 'class-validator';
import {
  AVAILABILITY_STATUS_VALUES,
  type AvailabilityStatusValue,
} from '../availability-status.constants';

export class UpdateAvailabilityDto {
  @IsIn(AVAILABILITY_STATUS_VALUES)
  availabilityStatus: AvailabilityStatusValue;
}
