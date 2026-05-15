import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prescriptions/shared';

export class CreateUserDto {
  @ApiProperty({ example: 'nuevo@test.com' })
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @ApiProperty({ example: 'secret123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password!: string;

  @ApiProperty({ enum: Role, example: Role.DOCTOR })
  @IsEnum(Role)
  role!: Role;

  @ApiPropertyOptional({ example: 'Carlos', description: 'Requerido para doctor y paciente' })
  @ValidateIf((o: CreateUserDto) => o.role === Role.DOCTOR || o.role === Role.PATIENT)
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Ramírez', description: 'Requerido para doctor y paciente' })
  @ValidateIf((o: CreateUserDto) => o.role === Role.DOCTOR || o.role === Role.PATIENT)
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @ApiPropertyOptional({ example: 'Medicina General', description: 'Requerido para doctor' })
  @ValidateIf((o: CreateUserDto) => o.role === Role.DOCTOR)
  @IsString()
  @IsNotEmpty()
  speciality?: string;

  @ApiPropertyOptional({ example: 'MED-003-2024', description: 'Requerido para doctor' })
  @ValidateIf((o: CreateUserDto) => o.role === Role.DOCTOR)
  @IsString()
  @IsNotEmpty()
  licenseNumber?: string;

  @ApiPropertyOptional({ example: '1990-04-15', description: 'Opcional para paciente' })
  @ValidateIf((o: CreateUserDto) => o.role === Role.PATIENT)
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: '+34 612 345 678', description: 'Opcional para paciente' })
  @ValidateIf((o: CreateUserDto) => o.role === Role.PATIENT)
  @IsOptional()
  @IsString()
  phone?: string;
}
