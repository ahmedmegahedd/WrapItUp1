import { Controller, Post, Body, UseGuards, Get, Request, Req, Param, Query, Patch, Delete, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminService } from './admin.service';
import { AdminUsersService } from './admin-users.service';
import { AdminRolesService } from './admin-roles.service';
import { DashboardService } from './dashboard.service';
import { LoginDto } from './dto/login.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreateAdminCredentialsDto } from './dto/create-admin-credentials.dto';
import { AdminGuard } from './guards/admin.guard';
import { PermissionGuard } from './guards/permission.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { RequirePermission } from './decorators/require-permission.decorator';
import { ADMIN_PERMISSIONS } from './admin-permissions.const';
import { ProductsService } from '../products/products.service';
import { CollectionsService } from '../collections/collections.service';
import { OrdersService } from '../orders/orders.service';
import { CreateProductDto } from '../products/dto/create-product.dto';
import { UpdateProductDto } from '../products/dto/update-product.dto';
import { CreateCollectionDto } from '../collections/dto/create-collection.dto';
import { UpdateCollectionDto } from '../collections/dto/update-collection.dto';
import { UpdateOrderStatusDto } from '../orders/dto/update-order-status.dto';
import { UpdateNavOrderDto } from './dto/update-nav-order.dto';
import { DeliveryDestinationsService } from '../delivery-destinations/delivery-destinations.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { CreateRewardDto } from '../loyalty/dto/create-reward.dto';
import { UpdateRewardDto } from '../loyalty/dto/update-reward.dto';
import { CollaboratorsService } from '../collaborators/collaborators.service';
import { MailService } from '../mail/mail.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly adminUsersService: AdminUsersService,
    private readonly adminRolesService: AdminRolesService,
    private readonly productsService: ProductsService,
    private readonly collectionsService: CollectionsService,
    private readonly ordersService: OrdersService,
    private readonly deliveryDestinationsService: DeliveryDestinationsService,
    private readonly loyaltyService: LoyaltyService,
    private readonly dashboardService: DashboardService,
    private readonly collaboratorsService: CollaboratorsService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  @Post('auth/login')
  login(@Body() loginDto: LoginDto) {
    return this.adminService.login(loginDto);
  }

  @Get('stats')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.DASHBOARD_VIEW)
  async getDashboardStats() {
    // Keep existing stats (products, collections, orders, totalRevenue) — do not break
    const [productsRes, collectionsRes, ordersRes] = await Promise.all([
      this.productsService.findAll(true),
      this.collectionsService.findAll(true),
      this.ordersService.findAll({}),
    ]);
    const orders = Array.isArray(ordersRes) ? ordersRes : [];
    const totalRevenue = orders
      .filter((o: { payment_status?: string }) => o.payment_status === 'paid')
      .reduce((sum: number, o: { total?: string | number }) => sum + parseFloat(String(o.total ?? 0)), 0);
    return {
      products: Array.isArray(productsRes) ? productsRes.length : 0,
      collections: Array.isArray(collectionsRes) ? collectionsRes.length : 0,
      orders: orders.length,
      totalRevenue,
    };
  }

  @Get('dashboard/today')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.DASHBOARD_VIEW)
  getDashboardToday() {
    return this.dashboardService.getTodayOverview();
  }

  @Get('dashboard/alerts')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.DASHBOARD_VIEW)
  getDashboardAlerts() {
    return this.dashboardService.getAlerts();
  }

  @Get('dashboard/delivery-load')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.DASHBOARD_VIEW)
  getDashboardDeliveryLoad() {
    return this.dashboardService.getDeliveryLoadToday();
  }

  @Get('dashboard/low-stock')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.DASHBOARD_VIEW)
  getDashboardLowStock() {
    return this.dashboardService.getLowStockProducts(5);
  }

  @Get('dashboard/revenue-comparison')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.DASHBOARD_VIEW)
  getDashboardRevenueComparison() {
    return this.dashboardService.getRevenueComparison();
  }

  @Get('auth/me')
  @UseGuards(AdminGuard)
  getMe(@Request() req) {
    const u = req.user;
    return {
      user: {
        id: u.id,
        email: u.email,
        role_id: u.role_id,
        role_name: u.role_name,
        is_super_admin: u.is_super_admin,
        permissions: u.permissions ?? [],
        collaborator_id: u.collaboratorId ?? null,
        is_collaborator: !!u.collaboratorId,
        collaborator_brand_name: u.collaboratorBrandName ?? null,
      },
    };
  }

  // Products management
  @Post('products')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.PRODUCTS_VIEW)
  async createProduct(@Req() req: any, @Body() createProductDto: CreateProductDto) {
    const product = await this.productsService.create(createProductDto, req.user?.collaboratorId);
    if (product?.collaborator_id) {
      try {
        const collaborator = await this.collaboratorsService.getCollaboratorById(product.collaborator_id);
        const to = this.configService.get<string>('NOTIFY_ADMIN_EMAIL') || this.configService.get<string>('ADMIN_EMAIL');
        const baseUrl = this.configService.get<string>('ADMIN_BASE_URL') || 'http://localhost:3000';
        if (to) {
          await this.mailService.sendProductPendingReview({
            to,
            productName: product.title,
            brandName: collaborator.brand_name,
            priceEgp: Number(product.discount_price ?? product.base_price ?? 0),
            adminProductUrl: `${baseUrl.replace(/\/$/, '')}/admin/products/${product.id}`,
          });
        }
      } catch (e) {
        console.warn('[Admin] sendProductPendingReview failed (non-blocking):', e);
      }
    }
    return product;
  }

  @Get('products')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.PRODUCTS_VIEW)
  findAllProducts(
    @Req() req: any,
    @Query('type') type?: 'wrapitup' | 'collaborator',
    @Query('approvalStatus') approvalStatus?: string,
  ) {
    const opts = req.user?.collaboratorId
      ? { collaboratorId: req.user.collaboratorId }
      : { type, approvalStatus };
    return this.productsService.findAllForAdmin(true, opts);
  }

  @Get('products/:id')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.PRODUCTS_VIEW)
  findOneProduct(@Req() req: any, @Param('id') id: string) {
    return this.productsService.findOneForAdmin(id, req.user?.collaboratorId);
  }

  @Patch('products/:id')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.PRODUCTS_VIEW)
  updateProduct(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto, req.user?.collaboratorId);
  }

  @Delete('products/:id')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.PRODUCTS_VIEW)
  removeProduct(@Req() req: any, @Param('id') id: string) {
    return this.productsService.remove(id, req.user?.collaboratorId);
  }

  @Patch('products/:id/approve')
  @UseGuards(AdminGuard, SuperAdminGuard)
  approveProduct(@Param('id') id: string) {
    return this.productsService.setApprovalStatus(id, 'approved');
  }

  @Patch('products/:id/activate')
  @UseGuards(AdminGuard, SuperAdminGuard)
  activateProduct(@Param('id') id: string) {
    return this.productsService.setApprovalStatus(id, 'active');
  }

  @Patch('products/:id/reject')
  @UseGuards(AdminGuard, SuperAdminGuard)
  rejectProduct(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.productsService.setApprovalStatus(id, 'rejected', reason);
  }

  @Patch('products/:id/set-pending')
  @UseGuards(AdminGuard, SuperAdminGuard)
  setProductPending(@Param('id') id: string) {
    return this.productsService.setApprovalPending(id);
  }

  // Collections management
  @Post('collections')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.COLLECTIONS_VIEW)
  createCollection(@Body() createCollectionDto: CreateCollectionDto) {
    return this.collectionsService.create(createCollectionDto);
  }

  @Get('collections')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.COLLECTIONS_VIEW)
  findAllCollections() {
    return this.collectionsService.findAll(true);
  }

  @Get('collections/:id')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.COLLECTIONS_VIEW)
  findOneCollection(@Param('id') id: string) {
    return this.collectionsService.findOne(id);
  }

  @Patch('collections/nav-order')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.NAVBAR_VIEW)
  updateCollectionsNavOrder(@Body() dto: UpdateNavOrderDto) {
    return this.collectionsService.updateNavOrder(dto.orderedIds);
  }

  @Patch('collections/:id')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.COLLECTIONS_VIEW)
  updateCollection(@Param('id') id: string, @Body() updateCollectionDto: UpdateCollectionDto) {
    return this.collectionsService.update(id, updateCollectionDto);
  }

  @Delete('collections/:id')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.COLLECTIONS_VIEW)
  removeCollection(@Param('id') id: string) {
    return this.collectionsService.remove(id);
  }

  // Delivery destinations (admin)
  @Get('delivery-destinations')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.DELIVERY_DESTINATIONS_VIEW)
  findAllDeliveryDestinations() {
    return this.deliveryDestinationsService.findAll(true);
  }

  @Get('delivery-destinations/:id')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.DELIVERY_DESTINATIONS_VIEW)
  findOneDeliveryDestination(@Param('id') id: string) {
    return this.deliveryDestinationsService.findOne(id);
  }

  @Post('delivery-destinations')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.DELIVERY_DESTINATIONS_VIEW)
  createDeliveryDestination(@Body() body: { name: string; fee_egp: number; display_order?: number; is_active?: boolean }) {
    return this.deliveryDestinationsService.create(body);
  }

  @Patch('delivery-destinations/:id')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.DELIVERY_DESTINATIONS_VIEW)
  updateDeliveryDestination(
    @Param('id') id: string,
    @Body() body: { name?: string; fee_egp?: number; display_order?: number; is_active?: boolean },
  ) {
    return this.deliveryDestinationsService.update(id, body);
  }

  @Delete('delivery-destinations/:id')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.DELIVERY_DESTINATIONS_VIEW)
  removeDeliveryDestination(@Param('id') id: string) {
    return this.deliveryDestinationsService.remove(id);
  }

  // Orders management
  @Get('orders')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.ORDERS_VIEW)
  findAllOrders(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('deliveryDate') deliveryDate?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ordersService.findAll(
      { status, paymentStatus, deliveryDate, startDate, endDate },
      req.user?.collaboratorId,
    );
  }

  @Get('orders/:id')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.ORDERS_VIEW)
  findOneOrder(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.findOneWithAdminNotes(id, req.user?.collaboratorId);
  }

  @Patch('orders/:id/status')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.ORDERS_VIEW)
  updateOrderStatus(@Param('id') id: string, @Body() updateOrderStatusDto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto);
  }

  @Post('orders/:id/notes')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.ORDERS_VIEW)
  async addOrderNote(@Param('id') id: string, @Body() body: { note?: string }, @Request() req: { user: { id: string } }) {
    const note = typeof body.note === 'string' ? body.note.trim() : '';
    if (!note) {
      throw new BadRequestException('Note text is required');
    }
    const adminName = await this.adminService.getAdminDisplayName(req.user.id);
    return this.ordersService.addAdminNote(id, {
      admin_id: req.user.id,
      admin_name: adminName,
      note,
    });
  }

  // Rewards / Points (loyalty)
  @Get('rewards')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.REWARDS_VIEW)
  findAllRewards() {
    return this.loyaltyService.findAllRewards(false);
  }

  @Get('rewards/:id')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.REWARDS_VIEW)
  findOneReward(@Param('id') id: string) {
    return this.loyaltyService.getRewardById(id);
  }

  @Post('rewards')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.REWARDS_VIEW)
  createReward(@Body() dto: CreateRewardDto) {
    return this.loyaltyService.createReward(dto);
  }

  @Patch('rewards/:id')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.REWARDS_VIEW)
  updateReward(@Param('id') id: string, @Body() dto: UpdateRewardDto) {
    return this.loyaltyService.updateReward(id, dto);
  }

  @Delete('rewards/:id')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.REWARDS_VIEW)
  removeReward(@Param('id') id: string) {
    return this.loyaltyService.deleteReward(id);
  }

  // Users management (profiles + orders by email)
  @Get('users')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.USERS_VIEW)
  getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
    return this.adminUsersService.getUsersPaginated(pageNum, limitNum, search);
  }

  @Get('users/export')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.USERS_VIEW)
  getUsersExport(@Query('search') search?: string) {
    return this.adminUsersService.getUsersForExport(search);
  }

  @Get('users/:id')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.USERS_VIEW)
  getUserDetail(@Param('id') id: string) {
    return this.adminUsersService.getUserDetail(id);
  }

  // Admin Controls (RBAC) – requires admin_controls.view
  @Get('roles')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.ADMIN_CONTROLS_VIEW)
  getRoles() {
    return this.adminRolesService.getRoles();
  }

  @Get('permissions')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.ADMIN_CONTROLS_VIEW)
  getPermissions() {
    return this.adminRolesService.getPermissions();
  }

  @Get('roles/:id')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.ADMIN_CONTROLS_VIEW)
  getRole(@Param('id') id: string) {
    return this.adminRolesService.getRole(id);
  }

  @Post('roles')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.ADMIN_CONTROLS_VIEW)
  createRole(@Body() dto: CreateRoleDto) {
    return this.adminRolesService.createRole(dto);
  }

  @Patch('roles/:id')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.ADMIN_CONTROLS_VIEW)
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.adminRolesService.updateRole(id, dto);
  }

  @Delete('roles/:id')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.ADMIN_CONTROLS_VIEW)
  deleteRole(@Param('id') id: string) {
    return this.adminRolesService.deleteRole(id);
  }

  @Get('admin-users')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.ADMIN_CONTROLS_VIEW)
  getAdminUsers() {
    return this.adminRolesService.getAdminUsers();
  }

  @Patch('admin-users/:id/role')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.ADMIN_CONTROLS_VIEW)
  setAdminRole(@Param('id') id: string, @Body() body: { role_id: string }) {
    if (!body?.role_id) throw new BadRequestException('role_id is required');
    return this.adminRolesService.setAdminRole(id, body.role_id);
  }

  @Post('admin-users')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.ADMIN_CONTROLS_VIEW)
  createAdminCredentials(@Body() dto: CreateAdminCredentialsDto) {
    return this.adminRolesService.createAdminCredentials(dto);
  }

  @Delete('admin-users/:id')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.ADMIN_CONTROLS_VIEW)
  deleteAdminCredentials(@Param('id') id: string) {
    return this.adminRolesService.deleteAdminCredentials(id);
  }
}
