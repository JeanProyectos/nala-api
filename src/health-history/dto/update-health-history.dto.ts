import { PartialType } from '@nestjs/mapped-types';
import { CreateHealthHistoryDto } from './create-health-history.dto';

export class UpdateHealthHistoryDto extends PartialType(CreateHealthHistoryDto) {}
