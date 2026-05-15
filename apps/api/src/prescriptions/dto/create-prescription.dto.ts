import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePrescriptionItemDto {
  @ApiProperty({ example: 'Amoxicilina' })
  @IsString()
  @IsNotEmpty()
  medicationName!: string;

  @ApiPropertyOptional({ example: '500mg' })
  @IsOptional()
  @IsString()
  dosage?: string;

  @ApiPropertyOptional({ example: 'Cada 8 horas' })
  @IsOptional()
  @IsString()
  frequency?: string;

  @ApiPropertyOptional({ example: 21 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  quantity?: number;

  @ApiPropertyOptional({ example: 'Tomar con agua' })
  @IsOptional()
  @IsString()
  instructions?: string;
}

export class CreatePrescriptionDto {
  @ApiProperty({ example: 'uuid-del-paciente', description: 'ID del registro Patient' })
  @IsUUID()
  patientId!: string;

  @ApiPropertyOptional({ example: 'Infección respiratoria leve' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreatePrescriptionItemDto], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe incluir al menos un medicamento' })
  @ValidateNested({ each: true })
  @Type(() => CreatePrescriptionItemDto)
  items!: CreatePrescriptionItemDto[];
}
