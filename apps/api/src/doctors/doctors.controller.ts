import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { ListDoctorsDto } from './dto/list-doctors.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload, Role } from '@prescriptions/shared';

@ApiTags('doctors')
@ApiBearerAuth('access-token')
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.DOCTOR)
  @ApiOperation({ summary: 'Listar médicos (admin, doctor)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de médicos' })
  findAll(@Query() dto: ListDoctorsDto) {
    return this.doctorsService.findAll(dto);
  }

  // IMPORTANTE: /me debe estar ANTES de /:id
  @Get('me')
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Perfil del médico autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil propio del médico' })
  getMe(@CurrentUser() user: JwtPayload) {
    return this.doctorsService.findByUserId(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener médico por ID (autenticado)' })
  @ApiResponse({ status: 200, description: 'Médico encontrado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.DOCTOR)
  @ApiOperation({ summary: 'Actualizar médico (admin o propio médico)' })
  @ApiResponse({ status: 200, description: 'Médico actualizado' })
  @ApiResponse({ status: 403, description: 'Sin permiso sobre este perfil' })
  update(@Param('id') id: string, @Body() dto: UpdateDoctorDto, @CurrentUser() user: JwtPayload) {
    return this.doctorsService.update(id, dto, user);
  }
}
