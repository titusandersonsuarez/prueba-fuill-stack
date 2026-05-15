import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { ListPatientsDto } from './dto/list-patients.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload, Role } from '@prescriptions/shared';

@ApiTags('patients')
@ApiBearerAuth('access-token')
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.DOCTOR)
  @ApiOperation({ summary: 'Listar pacientes (admin, doctor)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de pacientes' })
  findAll(@Query() dto: ListPatientsDto) {
    return this.patientsService.findAll(dto);
  }

  // IMPORTANTE: /me debe estar ANTES de /:id para que NestJS no interprete "me" como ID
  @Get('me')
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Perfil del paciente autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil propio del paciente' })
  getMe(@CurrentUser() user: JwtPayload) {
    return this.patientsService.findByUserId(user.sub);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.DOCTOR, Role.PATIENT)
  @ApiOperation({ summary: 'Obtener paciente por ID (paciente solo ve el propio)' })
  @ApiResponse({ status: 200, description: 'Paciente encontrado' })
  @ApiResponse({ status: 403, description: 'Sin permiso sobre este perfil' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.patientsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.PATIENT)
  @ApiOperation({ summary: 'Actualizar paciente (admin o propio paciente)' })
  @ApiResponse({ status: 200, description: 'Paciente actualizado' })
  @ApiResponse({ status: 403, description: 'Sin permiso sobre este perfil' })
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto, @CurrentUser() user: JwtPayload) {
    return this.patientsService.update(id, dto, user);
  }
}
