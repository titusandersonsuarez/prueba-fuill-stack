import { Controller, Get, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload, Role } from '@prescriptions/shared';

@ApiTags('metrics')
@ApiBearerAuth('access-token')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Métricas globales del sistema (admin)' })
  @ApiResponse({
    status: 200,
    description:
      'Resumen: usuarios, prescripciones, top médicos, actividad reciente y serie diaria (byDay, últimos 30 días)',
  })
  getSummary() {
    return this.metricsService.getSummary();
  }

  @Get('my-stats')
  @Roles(Role.DOCTOR, Role.ADMIN)
  @ApiOperation({ summary: 'Estadísticas propias del médico autenticado' })
  @ApiResponse({ status: 200, description: 'Estadísticas de prescripciones del médico' })
  @ApiResponse({ status: 403, description: 'Solo disponible para médicos' })
  async getDoctorStats(@CurrentUser() user: JwtPayload) {
    if (user.role !== Role.DOCTOR) {
      throw new ForbiddenException('Este endpoint es solo para médicos');
    }
    return this.metricsService.getDoctorStats(user.sub);
  }
}
