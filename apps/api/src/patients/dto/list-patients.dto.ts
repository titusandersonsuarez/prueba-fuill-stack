import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class ListPatientsDto extends PaginationDto {
  @ApiPropertyOptional({
    example: 'maria',
    description: 'Búsqueda parcial por nombre, apellido o email (case-insensitive)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
