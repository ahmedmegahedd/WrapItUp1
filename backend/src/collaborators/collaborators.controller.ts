import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AdminGuard } from '../admin/guards/admin.guard';
import { SuperAdminGuard } from '../admin/guards/super-admin.guard';
import { CollaboratorOnlyGuard } from '../admin/guards/collaborator-only.guard';
import { CollaboratorsService } from './collaborators.service';
import { CreateCollaboratorDto } from './dto/create-collaborator.dto';
import { UpdateCollaboratorDto } from './dto/update-collaborator.dto';

@Controller('admin/collaborators')
@UseGuards(AdminGuard)
export class CollaboratorsController {
  constructor(private readonly collaboratorsService: CollaboratorsService) {}

  @Get('me')
  @UseGuards(CollaboratorOnlyGuard)
  getMe(@Request() req: { user: { collaboratorId: string } }) {
    return this.collaboratorsService.getCollaboratorById(req.user.collaboratorId);
  }

  @Get('me/earnings')
  @UseGuards(CollaboratorOnlyGuard)
  getMyEarnings(
    @Request() req: { user: { collaboratorId: string } },
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('payoutStatus') payoutStatus?: string,
  ) {
    return this.collaboratorsService.getCollaboratorEarnings(req.user.collaboratorId, {
      dateFrom,
      dateTo,
      payoutStatus,
    });
  }

  @Get()
  @UseGuards(SuperAdminGuard)
  getAllCollaborators() {
    return this.collaboratorsService.getAllCollaborators();
  }

  @Post()
  @UseGuards(SuperAdminGuard)
  createCollaborator(@Body() dto: CreateCollaboratorDto) {
    return this.collaboratorsService.createCollaborator(dto);
  }

  @Get(':id')
  @UseGuards(SuperAdminGuard)
  getCollaboratorById(@Param('id') id: string) {
    return this.collaboratorsService.getCollaboratorById(id);
  }

  @Patch(':id')
  @UseGuards(SuperAdminGuard)
  updateCollaborator(@Param('id') id: string, @Body() dto: UpdateCollaboratorDto) {
    return this.collaboratorsService.updateCollaborator(id, dto);
  }

  @Get(':id/earnings')
  @UseGuards(SuperAdminGuard)
  getCollaboratorEarnings(
    @Param('id') id: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('payoutStatus') payoutStatus?: string,
  ) {
    return this.collaboratorsService.getCollaboratorEarnings(id, {
      dateFrom,
      dateTo,
      payoutStatus,
    });
  }

  @Post(':id/mark-paid')
  @UseGuards(SuperAdminGuard)
  markCommissionPaid(
    @Param('id') id: string,
    @Body() body: { recordIds: string[]; note?: string },
  ) {
    return this.collaboratorsService.markCommissionPaid(
      body.recordIds ?? [],
      body.note ?? '',
      id,
    );
  }
}
