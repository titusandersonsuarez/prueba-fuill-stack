import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PrescriptionStatus } from '@prescriptions/shared';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class ListPrescriptionsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: PrescriptionStatus })
  @IsOptional()
  @IsEnum(PrescriptionStatus)
  status?: PrescriptionStatus;

  @ApiPropertyOptional({ example: 'uuid-del-paciente' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({ example: 'uuid-del-doctor' })
  @IsOptional()
  @IsUUID()
  authorId?: string;

  @ApiPropertyOptional({
    example: 'PRESC-1A2B',
    description: 'Búsqueda parcial por código (case-insensitive)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({
    example: '2026-01-01',
    description: 'Fecha inicial (YYYY-MM-DD) sobre createdAt',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    example: '2026-12-31',
    description: 'Fecha final (YYYY-MM-DD) sobre createdAt',
  })
  @IsOptional()
  @IsDateString()
  to?: string;
}
