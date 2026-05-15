import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProduces } from '@nestjs/swagger';
import { Response } from 'express';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { ListPrescriptionsDto } from './dto/list-prescriptions.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload, Role } from '@prescriptions/shared';

@ApiTags('prescriptions')
@ApiBearerAuth('access-token')
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  @Roles(Role.DOCTOR, Role.ADMIN)
  @ApiOperation({ summary: 'Crear receta (doctor, admin)' })
  @ApiResponse({ status: 201, description: 'Receta creada con código PRESC-XXXXXXXX' })
  @ApiResponse({ status: 403, description: 'No tienes perfil de médico' })
  create(@Body() dto: CreatePrescriptionDto, @CurrentUser() user: JwtPayload) {
    return this.prescriptionsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar recetas (scope automático por rol)' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada. Doctor: solo suyas. Paciente: solo suyas. Admin: todas.',
  })
  findAll(@Query() dto: ListPrescriptionsDto, @CurrentUser() user: JwtPayload) {
    return this.prescriptionsService.findAll(dto, user);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Descargar PDF de receta' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'PDF en memoria (buffer)' })
  @ApiResponse({ status: 403, description: 'Sin acceso a esta receta' })
  @ApiResponse({ status: 404, description: 'Receta no encontrada' })
  async getPdf(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Res() res: Response) {
    const buffer = await this.prescriptionsService.getPdf(id, user);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="prescripcion-${id}.pdf"`,
      'Content-Length': buffer.length.toString(),
    });
    res.send(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener receta por ID' })
  @ApiResponse({ status: 200, description: 'Detalle de la receta con items' })
  @ApiResponse({ status: 403, description: 'Sin acceso a esta receta' })
  @ApiResponse({ status: 404, description: 'Receta no encontrada' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.prescriptionsService.findOne(id, user);
  }

  @Patch(':id/consume')
  @Roles(Role.PATIENT, Role.ADMIN)
  @ApiOperation({ summary: 'Marcar receta como consumida (paciente titular, admin)' })
  @ApiResponse({ status: 200, description: 'Receta marcada como consumed' })
  @ApiResponse({ status: 403, description: 'No eres el paciente titular' })
  @ApiResponse({ status: 409, description: 'La receta ya fue consumida' })
  consume(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.prescriptionsService.consume(id, user);
  }

  @Delete(':id')
  @Roles(Role.DOCTOR, Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar receta (admin o médico autor)' })
  @ApiResponse({ status: 204, description: 'Eliminada' })
  @ApiResponse({ status: 403, description: 'No eres el autor de esta receta' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.prescriptionsService.remove(id, user);
  }
}
