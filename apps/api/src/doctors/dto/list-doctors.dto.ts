import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class ListDoctorsDto extends PaginationDto {
  @ApiPropertyOptional({
    example: 'perez',
    description: 'Búsqueda parcial por nombre, apellido, email o licencia (case-insensitive)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({
    example: 'Cardiología',
    description: 'Filtro parcial por especialidad (case-insensitive)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  speciality?: string;
}
